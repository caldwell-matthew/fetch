// MOB.928_AssetVerify_Add_Existing_Excludes_Job_Assets — written for Playwright (not converted from Datadog).
//
// A job's "Add Existing Asset" picker (`AssetVerification/NewAssetForm.tsx`) must never offer an asset the job
// already has — neither in its first list nor after a search. Two things keep them out: the server leaves out the
// job's assets when the lookup carries the job's id (`asset.ts:73`), and the lookup itself filters the job's
// `currentAssets` out of whatever comes back (`AssetLookup/index.tsx:90,108`). The second is why a submitted search
// is still safe although its refetch sends `jobId: '??'` (`AssetLookup/index.tsx:171`): measured 2026-09-23, the
// request carried `'??'` and the job's asset was still not offered.
//
// READ-ONLY: nothing is added — the picker is closed with its X, and a server read proves the job unchanged.
import { expect, Page } from '@playwright/test';
import { appUrl, serverRead } from '../support/session';

const JOB = 'Z0EVwQcdJZhMURcBFkp0E0'; // DATADOG MOBILE JOB, the Asset Verify fixture
const ASSETS = 'query($id: ID!) { mobileJob(id: $id) { name assets { assetId { name } } } }';

export async function mob928(page: Page): Promise<void> {
  const job = (await serverRead(page, ASSETS, { id: JOB })).mobileJob;
  const onJob: string[] = job.assets.map((a: { assetId: { name: string } }) => a.assetId.name);
  expect(onJob.length, 'PREMISE: the fixture job has assets').toBeGreaterThan(0);
  const target = onJob[0];

  // Through the jobs list, as a user does (and as MOB.531 does): a deep link to the job renders blank until the
  // list's own loading has run.
  await page.goto(appUrl('asset-verify'), { waitUntil: 'load' });
  await expect(page.locator('input[placeholder="Find Mobile Job(s)"]'), 'the job list rendered').toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Fetching data for lookups'), 'the lookup prefetch finished').toHaveCount(0, { timeout: 120_000 });
  await expect(page.getByText('Fetching mobile job details'), 'the job details finished').toHaveCount(0, { timeout: 120_000 });
  await page.locator('.mantine-Paper-root').filter({ hasText: job.name }).first().click();
  await expect(page.locator('.mantine-Accordion-item').first(), 'the job opened, its assets listed').toBeVisible({ timeout: 60_000 });
  await page.locator('xpath=//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button').click();
  await page.locator('xpath=//label[contains(concat(" ", normalize-space(@class), " "), " mantine-SegmentedControl-label ")][normalize-space(.)="Add Existing Asset"]').click();

  const modal = page.locator('.mantine-Modal-content').filter({ has: page.locator('input[name="asset-search"]') });
  const rows = modal.locator('.mantine-Accordion-item');
  const offered = async (name: string) => (await rows.filter({ hasText: name }).count()) > 0;
  await expect(rows.first(), 'the picker lists assets').toBeVisible({ timeout: 60_000 });
  for (const name of onJob) {
    expect(await offered(name), `the first list leaves out "${name}" — already on the job`).toBe(false);
  }

  // Search for an asset the job already has, and submit (Enter — the search has no button).
  const search = modal.locator('input[name="asset-search"]');
  await search.fill(target);
  await search.press('Enter');
  await page.waitForTimeout(5_000);                // both lookups the submit fires have answered by now
  expect(await offered(target), `after a search, "${target}" — already on the job — is still left out`).toBe(false);

  await modal.locator('button.mantine-CloseButton-root, button[class*="CloseButton"]').first().click();
  await expect(modal, 'the picker closed — nothing added').toHaveCount(0, { timeout: 15_000 });
  const after = (await serverRead(page, ASSETS, { id: JOB })).mobileJob.assets.length;
  expect(after, 'the job still has exactly its assets').toBe(onJob.length);
}
