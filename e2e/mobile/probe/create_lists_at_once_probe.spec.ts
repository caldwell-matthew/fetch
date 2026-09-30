import { expect, test } from '@playwright/test';
import { login } from '../support/login';
import { appUrl } from '../support/session';
import { waitForPrefetch } from '../support/prefetch';

// Does a work order created from /work show in the list's own data (the status legend's total) straight away, once
// EVERY stage's details have downloaded? MOB.300 saw the total not move when it created before the downloads ended.
// Writes one `DD SYNTHETIC MOBILE` work order, as MOB.300 does (cleanup_residue.py prunes it).
test('create lists at once, after all downloads', async ({ browser }) => {
  test.setTimeout(12 * 60_000);
  const page = await (await browser.newContext({ viewport: { width: 768, height: 1020 } })).newPage();
  await login(page);
  await page.goto(appUrl('work'), { waitUntil: 'load' });
  await expect(page.locator('#page-title h4', { hasText: 'Work Orders' })).toBeVisible({ timeout: 60_000 });
  const t0 = Date.now();
  await waitForPrefetch(page, { timeout: 8 * 60_000 });
  console.log(`  every download finished after ${Math.round((Date.now() - t0) / 1000)}s`);
  const total = async () => (await page.locator('li').filter({ hasText: /^\s*[^()]+ \(\d+\)\s*$/ }).allInnerTexts())
    .reduce((s, t) => s + Number(/\((\d+)\)/.exec(t)![1]), 0);
  const before = await total();
  console.log(`  legend total before: ${before}`);

  await page.locator('.mantine-Affix-root button').click();
  const form = page.locator('#workorder-insert-form');
  await expect(form).toBeVisible({ timeout: 30_000 });
  await form.locator('#workflowTitleId').click();
  await form.locator('#workflowTitleId').fill('Datadog Test');
  await page.getByRole('option', { name: /Datadog Test/ }).first().click();
  await form.locator('#problemDesc').fill('DD SYNTHETIC MOBILE');
  const created = page.waitForResponse((r) => r.url().endsWith('/graphql') && /\bcreateWork\s*\(/.test(r.request().postData() ?? ''));
  await page.getByRole('button', { name: 'Create Work Order' }).click();
  const stages = (await (await created).json()).data.createWork.stages;
  console.log(`  created ${stages.length} stage(s)`);
  await expect(form).toHaveCount(0, { timeout: 30_000 });
  let after = before;
  for (let i = 0; i < 15 && after === before; i++) { await page.waitForTimeout(1000); after = await total(); }
  console.log(`  legend total after: ${after} (want ${before + stages.length})`);
  await page.screenshot({ path: 'results/probe-create-lists.png' });
  await page.context().close();
});
