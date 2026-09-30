import { expect, test } from '@playwright/test';
import { login } from '../support/login';
import { appUrl } from '../support/session';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';

// A work order created from /work BEFORE every stage's details have downloaded (as MOB.300 does): when, if ever, does
// the list show it? Samples every 5s for 2 minutes: the status legend's total (the list's own data), the progress
// label, and whether the new stage's row is drawn. Writes one `DD SYNTHETIC MOBILE` work order, as MOB.300 does.
test('create lists early, before the downloads end', async ({ browser }) => {
  test.setTimeout(8 * 60_000);
  const page = await (await browser.newContext({ viewport: { width: 768, height: 1020 } })).newPage();
  await login(page);
  await page.goto(appUrl('work'), { waitUntil: 'load' });
  await expect(page.locator('#page-title h4', { hasText: 'Work Orders' })).toBeVisible({ timeout: 60_000 });
  await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
  const total = async () => (await page.locator('li').filter({ hasText: /^\s*[^()]+ \(\d+\)\s*$/ }).allInnerTexts())
    .reduce((s, t) => s + Number(/\((\d+)\)/.exec(t)![1]), 0);
  const label = async () => (await page.locator('.mantine-Progress-root').first().evaluate((e) => e.previousElementSibling?.textContent ?? '').catch(() => '(no bar)'));
  console.log(`  before: total ${await total()} · ${await label()}`);

  await page.locator('.mantine-Affix-root button').click();
  const form = page.locator('#workorder-insert-form');
  await expect(form).toBeVisible({ timeout: 30_000 });
  await form.locator('#workflowTitleId').click();
  await form.locator('#workflowTitleId').fill('Datadog Test');
  await page.getByRole('option', { name: /Datadog Test/ }).first().click();
  await form.locator('#problemDesc').fill('DD SYNTHETIC MOBILE');
  const created = page.waitForResponse((r) => r.url().endsWith('/graphql') && /\bcreateWork\s*\(/.test(r.request().postData() ?? ''));
  await page.getByRole('button', { name: 'Create Work Order' }).click();
  const stageId = (await (await created).json()).data.createWork.stages[0].id;
  await expect(form).toHaveCount(0, { timeout: 30_000 });
  const seq = await page.evaluate(async (id) => {
    const r = await fetch('/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'query($id: ID!) { workStage(id: $id) { _workSequence } }', variables: { id } }) });
    return (await r.json()).data.workStage._workSequence as string;
  }, stageId);
  console.log(`  created ${seq}`);
  for (let s = 0; s <= 120; s += 5) {
    const row = await page.locator('.mantine-Paper-root').filter({ hasText: seq }).count();
    const rows = await page.locator('.mantine-Paper-root').filter({ hasText: 'Description:' }).count();
    console.log(`  +${s}s: total ${await total()} · rows drawn ${rows} · new row ${row ? 'YES' : 'no'} · ${await label()}`);
    await page.waitForTimeout(5000);
  }
  await page.screenshot({ path: 'results/probe-create-early.png' });
  await page.context().close();
});
