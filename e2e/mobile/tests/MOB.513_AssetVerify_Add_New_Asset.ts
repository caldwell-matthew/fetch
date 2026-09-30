// MOB.513_AssetVerify_Add_New_Asset — written for Playwright (not converted from Datadog).
//
// A job's affixed + opens "Get New Asset" / "Add Existing Asset" (`AssetVerification/NewAssetForm.tsx`). The new tab is
// the collector's create form; with `mobileJobId` its type list is the job's allowed types, or the org's when the job
// allows none — the fixture job allows none (MOB.515 proves the narrowing). `Create Asset` runs
// `addNewAssetToJob` (`AssetVerification/utils/createAsset.ts`): the collector's `createAsset`, then
// `addAssetToMobileJob` — queued behind the create (`waitForKeys`), with an optimistic answer and NOT awaited — and the
// job toasts `Asset created and added` (`Job.tsx:189-193`) before the server has answered the link. So the proof is a
// server read: the job holds a link to an asset with this run's name, of the type picked.
//
// Owner, 2026-09-29: run, then reset. The job keeps the new asset until `reset_av_fixture.py --apply` unlinks it and
// deletes it (it is `DD SYNTHETIC MOBILE …`); `playwright_pass.py` runs that after this test's suite (MOB.985's
// `after`). Named `DD SYNTHETIC MOBILE AV <8 digits>`, so the collector tests' `DD SYNTHETIC MOBILE <8 digits>` pick never
// takes it.
//
// Then the job's page is BLANK (bugs §57): it reads `MOBILE_JOB_DETAILS` from the cache only (`Job.tsx:92-96`) and
// renders nothing without it (`:136`), and the add's answer (`ADD_ASSET_TO_MOBILE_JOB`) lacks fields that query selects
// for an asset (`ASSET_LATEST_READINGS` — inferred), so the cached job cannot be read. Reopening the job and a full
// reload stay blank; the module resync brings it back. The test returns whether it was blank (the suite pins §57) and
// recovers with the resync. An EXISTING asset (MOB.514) does not do it.
import { expect, Locator, Page } from '@playwright/test';
import { runId } from '../../support/env';
import { appUrl, serverRead } from '../support/session';
import { AV_JOB } from '../support/fixtures';

export const JOB_ASSETS = 'query($id: ID!) { mobileJob(id: $id) { name status assets { id verified assetId { id name typeId { name } } } } }';
type JobAsset = { id: string; verified: boolean; assetId: { id: string; name: string; typeId: { name: string } | null } };

/** The fixture job's links, from the server. */
export async function jobAssets(page: Page): Promise<{ name: string; status: string; assets: JobAsset[] }> {
  return (await serverRead(page, JOB_ASSETS, { id: AV_JOB })).mobileJob;
}

/** Open the fixture job through the jobs list (a deep link renders blank until the list has loaded — MOB.928), then
 *  its affixed + . Returns the modal's body. */
export async function openAddAssetModal(page: Page, jobName: string): Promise<Locator> {
  await page.goto(appUrl('asset-verify'), { waitUntil: 'load' });
  await expect(page.locator('input[placeholder="Find Mobile Job(s)"]'), 'the job list rendered').toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Fetching data for lookups'), 'the lookup prefetch finished').toHaveCount(0, { timeout: 120_000 });
  await expect(page.getByText('Fetching mobile job details'), 'the job details finished').toHaveCount(0, { timeout: 120_000 });
  await page.locator('.mantine-Paper-root').filter({ hasText: jobName }).first().click();
  await expect(page.locator('.mantine-Accordion-item').first(), 'the job opened, its assets listed').toBeVisible({ timeout: 60_000 });
  await page.locator('.mantine-Affix-root button').click();
  const body = page.locator('.mantine-Modal-content .gradient-bg').first();
  await expect(body, 'the add-asset modal opened').toBeVisible({ timeout: 30_000 });
  return body;
}

export async function mob513(page: Page): Promise<{ blank: boolean }> {
  const name = `DD SYNTHETIC MOBILE AV ${runId('numeric', 8)}`;
  const job = await jobAssets(page);
  expect(job.assets.length, 'PREMISE: the fixture job is at rest — its two assets (reset_av_fixture.py --check)').toBe(2);

  try {
    const body = await openAddAssetModal(page, job.name);
    const form = body.locator('#asset-collector');
    await expect(form, 'it opens on Get New Asset: the collector\'s create form').toBeVisible({ timeout: 30_000 });
    await form.locator('#name').fill(name);
    await form.locator('#desc').fill('Created by the mobile tests (MOB.513) - safe to delete');
    await form.locator('#typeId').click();
    const option = page.getByRole('option').first();
    await expect(option, 'asset types are offered').toBeVisible({ timeout: 30_000 });
    const type = (await option.innerText()).trim();
    await option.click();
    await body.getByRole('button', { name: 'Create Asset' }).click();
    await expect(page.getByText('Asset created and added'), 'the create-and-add toast').toBeVisible({ timeout: 60_000 });

    // SERVER: the job holds a link to this run's asset, unverified, of the type picked.
    await expect.poll(async () => {
      const link = (await jobAssets(page)).assets.find((a) => a.assetId.name === name);
      return link ? { verified: link.verified, type: link.assetId.typeId?.name ?? null } : null;
    }, { message: `the job holds a link to "${name}"`, timeout: 60_000 }).toEqual({ verified: false, type });
    const after = await jobAssets(page);
    expect(after.assets.length, 'the job has one more asset').toBe(3);
    // The job's page reads the job from the cache only; after the add it renders nothing (bugs §57). Recorded, then
    // recovered the one way that works — the module resync, which re-downloads the job — and the new asset listed.
    const rows = page.locator('.mantine-Accordion-item');
    const blank = await expect(rows.first()).toBeVisible({ timeout: 20_000 }).then(() => false, () => true);
    await page.screenshot({ path: `results/MOB.513-${blank ? 'blank' : 'added'}.png` });
    if (blank) {
      await page.goto(appUrl('asset-verify'), { waitUntil: 'load' });
      await expect(page.getByText('Data synced on').first(), 'the job list and its sync stamp').toBeVisible({ timeout: 60_000 });
      await page.locator('xpath=//button[.//*[@data-icon="sync" or @data-icon="arrows-rotate" or @data-icon="rotate"]]').first().click();
      await page.waitForTimeout(3_000); // the list refetches, then the job details start downloading
      await expect(page.getByText('Fetching mobile job details'), 'the resync finished').toHaveCount(0, { timeout: 120_000 });
      await openAddAssetModal(page, job.name);
      await page.keyboard.press('Escape');
    }
    await expect(rows.filter({ hasText: name }), 'the job lists the new asset').toBeVisible({ timeout: 30_000 });
    return { blank };
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.513-failure.png' }).catch(() => undefined);
    throw err;
  }
}
