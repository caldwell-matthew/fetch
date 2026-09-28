// MOB.946_AssetVerify_No_Standard_No_Profile — written for Playwright (not converted from Datadog).
//
// An Asset Verification job asset's full page has Condition and Failure tabs. Without an asset standard the Condition
// tab says `An asset standard needs to exist on an asset in order to do a condition assessment`
// (`AssetVerification/ConditionAssessment.tsx:22-24`); without a failure profile the Failure tab says `A failure
// profile need to exist on an asset in order to capture failure information` (`AssetVerification/Failures.tsx:32-34`).
// Both of `DATADOG MOBILE JOB`'s assets have both, so every answer is passed through with the two ids emptied on each
// Asset: the real answers, two fields changed. MOB.575 proves the other side — the fixture's real tabs, with neither message. Reads only.
import { expect, Page } from '@playwright/test';
import { appUrl } from '../support/session';
import { waitForPrefetch } from '../support/prefetch';

const NO_STANDARD = 'An asset standard needs to exist on an asset in order to do a condition assessment';
const NO_PROFILE = 'A failure profile need to exist on an asset in order to capture failure information';

export async function mob946(page: Page): Promise<void> {
  // The page reads its asset from the cache (`AssetDetails.tsx:113-119`), which more than one query fills — the job's
  // details, the list's batched downloads — so every Asset in every answer gets the two ids emptied, in this test's own
  // browser only.
  let emptied = 0;
  const blank = (v: unknown): void => {
    if (Array.isArray(v)) { v.forEach(blank); return; }
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    if (o.__typename === 'Asset' && ('assetStandardId' in o || 'failureProfileId' in o)) {
      if ('assetStandardId' in o) o.assetStandardId = null;
      if ('failureProfileId' in o) o.failureProfileId = null;
      emptied++;
    }
    Object.values(o).forEach(blank);
  };
  await page.route('**/graphql', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    try {
      const real = await route.fetch();
      let json: unknown;
      try { json = await real.json(); } catch { return await route.fulfill({ response: real }); }
      blank(json);
      await route.fulfill({ response: real, json });
    } catch { /* the page closed mid-request — nothing left to answer */ }
  });


  try {
    await page.goto(appUrl('asset-verify'), { waitUntil: 'load' });
    await expect(page.locator('input[placeholder="Find Mobile Job(s)"]')).toBeVisible({ timeout: 60_000 });
    await waitForPrefetch(page);
    await page.locator('.mantine-Paper-root').filter({ hasText: 'DATADOG MOBILE JOB' }).first().click();
    await expect(page.locator('.mantine-Accordion-item').first(), "the job's assets rendered").toBeVisible({ timeout: 60_000 });
    await page.locator('span', { hasText: 'Tank 0000' }).last().click();
    await expect(page.getByText('Asset Type:').first(), 'the full-page asset detail rendered').toBeVisible({ timeout: 30_000 });
    expect(emptied, 'the answers carried assets, and their ids were emptied').toBeGreaterThan(0);

    await page.getByRole('tab', { name: /Condition/ }).first().click();
    await expect(page.getByText(NO_STANDARD), 'the Condition tab says an asset standard is needed').toBeVisible({ timeout: 15_000 });
    await page.getByRole('tab', { name: /Failure/ }).first().click();
    await expect(page.getByText(NO_PROFILE), 'the Failure tab says a failure profile is needed').toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Something went wrong.'), 'no crash').toHaveCount(0);
    await page.screenshot({ path: 'results/MOB.946-failure-tab.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.946-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  }
}
