// After a new asset is added to the AV fixture job, the job's page is blank. What brings it back? Adds ONE
// `DD SYNTHETIC MOBILE AV …` asset through the app (as MOB.513), then tries, in order: the list and the job again; a
// full reload of the list; the module resync. Reset afterwards with `reset_av_fixture.py --apply`.
import { expect, Page, test } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { runId } from '../../support/env';
import { login } from '../support/login';
import { appUrl } from '../support/session';
import { jobAssets, openAddAssetModal } from '../tests/MOB.513_AssetVerify_Add_New_Asset';

async function jobShows(page: Page, label: string): Promise<boolean> {
  const ok = await openAddAssetModal(page, 'DATADOG MOBILE JOB').then(() => true, () => false);
  if (ok) await page.keyboard.press('Escape');
  const rows = await page.locator('.mantine-Accordion-item').count();
  console.log(`PROBE ${label}: job opened=${ok}, asset rows=${rows}`);
  await page.screenshot({ path: `results/probe-av-blank-${label}.png` });
  return rows > 0;
}

test('av add blank probe', async ({ browser }) => {
  test.setTimeout(900_000);
  const context = await browser.newContext({ viewport: DEVICES.tablet });
  const page = await context.newPage();
  await login(page);
  const name = `DD SYNTHETIC MOBILE AV ${runId('numeric', 8)}`;
  expect((await jobAssets(page)).assets.length, 'at rest').toBe(2);

  if (process.env.PROBE_EXISTING) {
    await openAddAssetModal(page, 'DATADOG MOBILE JOB');
    await page.locator('xpath=//label[contains(concat(" ", normalize-space(@class), " "), " mantine-SegmentedControl-label ")][normalize-space(.)="Add Existing Asset"]').click();
    const modal = page.locator('.mantine-Modal-content').filter({ has: page.locator('input[name="asset-search"]') });
    await modal.locator('input[name="asset-search"]').fill('Pump 0098');
    await modal.locator('input[name="asset-search"]').press('Enter');
    const row = modal.locator('.mantine-Accordion-item').filter({ has: page.locator('.mantine-Accordion-control', { hasText: 'Pump 0098' }) }).first();
    await row.locator('input[type="checkbox"]').check({ timeout: 60_000 });
    await modal.getByRole('button', { name: 'Add 1 Asset(s)' }).click();
    await expect(page.getByText('Asset added', { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => (await jobAssets(page)).assets.some((a) => a.assetId.name === 'Pump 0098'), { timeout: 60_000 }).toBe(true);
  } else {
  const body = await openAddAssetModal(page, 'DATADOG MOBILE JOB');
  const form = body.locator('#asset-collector');
  await form.locator('#name').fill(name);
  await form.locator('#typeId').click();
  await page.getByRole('option').first().click();
  await body.getByRole('button', { name: 'Create Asset' }).click();
  await expect(page.getByText('Asset created and added')).toBeVisible({ timeout: 60_000 });
  await expect.poll(async () => (await jobAssets(page)).assets.some((a) => a.assetId.name === name), { timeout: 60_000 }).toBe(true);
  }
  await page.waitForTimeout(3_000);
  console.log(`PROBE right after the add: asset rows=${await page.locator('.mantine-Accordion-item').count()}`);

  if (!(await jobShows(page, '1-list-again'))) {
    await page.goto(appUrl('asset-verify'), { waitUntil: 'load' });
    await page.reload({ waitUntil: 'load' });
    if (!(await jobShows(page, '2-reload'))) {
      await page.goto(appUrl('asset-verify'), { waitUntil: 'load' });
      await expect(page.getByText('Data synced on').first()).toBeVisible({ timeout: 60_000 });
      await page.locator('xpath=//button[.//*[@data-icon="sync" or @data-icon="arrows-rotate" or @data-icon="rotate"]]').first().click();
      await page.waitForTimeout(3_000);
      await expect(page.getByText('Fetching mobile job details')).toHaveCount(0, { timeout: 120_000 });
      await jobShows(page, '3-resync');
    }
  }
  await context.close();
});
