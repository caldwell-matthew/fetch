import { test } from '@playwright/test';
import { globals } from '../../support/env';
import { login } from '../support/login';

test('how long does /work take to finish downloading', async ({ browser }) => {
  test.setTimeout(15 * 60_000);
  const page = await (await browser.newContext({ viewport: { width: 768, height: 1020 } })).newPage();
  await login(page);
  const t0 = Date.now();
  await page.goto(`${globals.MOBDEV.replace(/\/$/, '')}/work`);
  const marks: Record<string, number> = {};
  for (;;) {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const el = (Date.now() - t0) / 1000;
    for (const phrase of ['Retrieving assigned work', 'workstages found', 'workstages downloaded', 'Downloading lookup list items']) {
      if (body.includes(phrase) && !marks[phrase + ' seen']) marks[phrase + ' seen'] = el;
      if (!body.includes(phrase) && marks[phrase + ' seen'] && !marks[phrase + ' gone']) marks[phrase + ' gone'] = el;
    }
    if ((marks['Downloading lookup list items gone'] && marks['workstages downloaded gone']) || el > 600) break;
    await page.waitForTimeout(2000);
  }
  for (const [k, v] of Object.entries(marks)) console.log(`  ${k}: ${v.toFixed(0)}s`);
  await page.context().close();
});
