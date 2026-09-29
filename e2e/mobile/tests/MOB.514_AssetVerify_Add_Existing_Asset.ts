// MOB.514_AssetVerify_Add_Existing_Asset — written for Playwright (not converted from Datadog).
//
// The job's + → "Add Existing Asset" is Asset Lookup with a checkbox per row (`AssetVerification/NewAssetForm.tsx`,
// `RegisterChecklist`); `Add N Asset(s)` (`AssetLookup/index.tsx:361-369`) runs `addAssetToMobileJob` for each ticked
// asset — optimistic and NOT awaited — and toasts `Asset added` (`Job.tsx:187-188`) before the server answers. So the
// proof is a server read: the job holds a link to the asset. MOB.928 proves the picker leaves out the job's own assets.
//
// The asset is Pump 0098: drawn on the map near Tank 0040 and used by no test but MOB.129's link (which does not
// involve the job). Owner, 2026-09-29: run, then reset — `reset_av_fixture.py --apply` unlinks it (it is not
// synthetic, so it is unlinked only, never deleted), run by `playwright_pass.py` after MOB.985.
import { expect, Page } from '@playwright/test';
import { jobAssets, openAddAssetModal } from './MOB.513_AssetVerify_Add_New_Asset';

const ASSET = 'Pump 0098';

export async function mob514(page: Page): Promise<void> {
  const job = await jobAssets(page);
  expect(job.assets.some((a) => a.assetId.name === ASSET), `PREMISE: ${ASSET} is not on the job`).toBe(false);
  const before = job.assets.length;

  try {
    await openAddAssetModal(page, job.name);
    await page.locator('xpath=//label[contains(concat(" ", normalize-space(@class), " "), " mantine-SegmentedControl-label ")][normalize-space(.)="Add Existing Asset"]').click();
    const modal = page.locator('.mantine-Modal-content').filter({ has: page.locator('input[name="asset-search"]') });
    const search = modal.locator('input[name="asset-search"]');
    await expect(search, 'the existing-asset picker opened').toBeVisible({ timeout: 30_000 });
    await search.fill(ASSET);
    await search.press('Enter'); // the search has no button
    const row = modal.locator('.mantine-Accordion-item').filter({ has: page.locator('.mantine-Accordion-control', { hasText: ASSET }) }).first();
    await expect(row, `${ASSET} is offered`).toBeVisible({ timeout: 60_000 });
    const add = modal.getByRole('button', { name: /^Add \d+ Asset\(s\)$/ });
    await expect(add, 'nothing ticked: `Add 0 Asset(s)`').toHaveText('Add 0 Asset(s)');
    await row.locator('input[type="checkbox"]').check();
    await expect(add, 'one ticked: `Add 1 Asset(s)`').toHaveText('Add 1 Asset(s)');
    await add.click();
    await expect(modal, 'the picker closed').toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByText('Asset added', { exact: true }), 'the add toast').toBeVisible({ timeout: 30_000 });

    // SERVER: the job holds a link to it, unverified.
    await expect.poll(async () => (await jobAssets(page)).assets.find((a) => a.assetId.name === ASSET)?.verified ?? null,
      { message: `the job holds an unverified link to ${ASSET}`, timeout: 60_000 }).toBe(false);
    expect((await jobAssets(page)).assets.length, 'exactly one more asset').toBe(before + 1);
    // Unlike a NEW asset (bugs §57), the job's page keeps rendering, with the asset in it.
    await expect(page.locator('.mantine-Accordion-item').filter({ hasText: ASSET }), 'the job lists it').toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: 'results/MOB.514-added.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.514-failure.png' }).catch(() => undefined);
    throw err;
  }
}
