// MOB.940_AssetVerify_Verify_Refused — written for Playwright (not converted from Datadog).
//
// Ticking an asset on an Asset Verification job used to toast `Asset verified` at once, whatever the server said.
// Online it now waits for the server (`AssetVerification/VerificationCheckbox.tsx:24-71`; offline the queue holds the
// mutation, so it still toasts at once — MOB.913's ground). The browser refuses the verify (`updateMobileJobAsset`,
// the field behind `verifyAsset:` — trap 43), so dev never receives it. Asserted: the refusal reaches the user, no
// `Asset verified` appears, the counter stays `0 out of 2`, and the server still holds 0 of 2 verified, `READY`.
//
// Two symptoms are RETURNED, not asserted — bugs §52 and §53, which the suite pins (measured 2026-09-25):
//  - §52, the box stays ticked: it is uncontrolled (`defaultChecked={verified}`, `:17`), so the rollback of the optimistic
//    answer never reaches it — the row says verified while the counter says 0;
//  - §53, the job's status is written anyway: the mutation's `update` (`:40-66`) runs on the OPTIMISTIC answer too and
//    sends `UPDATE_MOBILE_JOB_STATUS` (field `updateMobileJob`) with the recomputed status. The first run let it
//    through and left the fixture job `IN_PROGRESS` with 0 verified (`reset_av_fixture.py` put it back). The browser
//    now refuses that write too, and counts it.

import { expect, Page } from '@playwright/test';
import { failOperation } from '../../support/network';
import { appUrl, serverRead } from '../support/session';
import { waitForPrefetch } from '../support/prefetch';

const JOB = 'Z0EVwQcdJZhMURcBFkp0E0'; // DATADOG MOBILE JOB
const REJECTION = 'DD SYNTHETIC 940: the test refused this verification';
const JOB_READ = 'query($id: ID!) { mobileJob(id: $id) { status assets { id verified } } }';

export async function mob940(page: Page): Promise<{ boxStillTicked: boolean; statusWrites: number }> {
  const state = async () => {
    const j = (await serverRead(page, JOB_READ, { id: JOB })).mobileJob;
    return `${j.status} · ${j.assets.filter((a: { verified: boolean }) => a.verified).length} verified`;
  };
  expect(await state(), 'PREMISE: the fixture job is at rest').toBe('READY · 0 verified');
  let boxStillTicked = false;
  let statusWrites = 0;

  try {
    await page.goto(appUrl('asset-verify'), { waitUntil: 'load' });
    await expect(page.locator('input[placeholder="Find Mobile Job(s)"]')).toBeVisible({ timeout: 60_000 });
    await waitForPrefetch(page);
    await page.locator('.mantine-Paper-root').filter({ hasText: 'DATADOG MOBILE JOB' }).first().click();
    await expect(page.locator('.mantine-Accordion-item').first(), "the job's assets rendered").toBeVisible({ timeout: 60_000 });
    await page.locator('label').filter({ has: page.locator('span', { hasText: /^All$/ }) }).click();
    await expect(page.getByText('0 out of 2 Assets Verified')).toBeVisible({ timeout: 30_000 });

    const box = page.locator('input[type="checkbox"]').first();
    await expect(box).not.toBeChecked();
    const failing = await failOperation(page, { field: 'updateMobileJobAsset' }, { kind: 'graphql', message: REJECTION });
    const status = await failOperation(page, { field: 'updateMobileJob' }, { kind: 'graphql', message: REJECTION });
    try {
      await box.click();
      await expect(page.getByText(REJECTION).first(), "the server's refusal reaches the user").toBeVisible({ timeout: 30_000 });
      expect(failing.hits, 'the verify really was refused (not a vacuous pass)').toBeGreaterThan(0);
      await page.waitForTimeout(3_000); // the rollback, and any status write, land within this
      statusWrites = status.hits;
    } finally {
      await failing.stop();
      await status.stop();
    }
    await expect(page.getByText('0 out of 2 Assets Verified'), 'the counter is unchanged').toBeVisible();
    await expect(page.getByText('Asset verified', { exact: true }), 'no success toast').toHaveCount(0);
    boxStillTicked = await box.isChecked();
    await page.screenshot({ path: 'results/MOB.940-after-refusal.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.940-failure.png' }).catch(() => undefined);
    throw err;
  }
  expect(await state(), 'the server: still 0 of 2 verified, and the job still READY').toBe('READY · 0 verified');
  return { boxStillTicked, statusWrites };
}
