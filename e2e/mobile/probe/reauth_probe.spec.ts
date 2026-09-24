import { test, expect } from '@playwright/test';
import { serverRead } from '../support/session';
import { login } from '../support/login';
import { globals } from '../../support/env';
import { DEVICES } from '../../playwright.config';

// Why does "Extend session" end in "The operation was aborted."? Record requests AND the session websocket from
// before the app loads. Read-only apart from the re-authentication itself.
test('reauth request trace', async ({ browser }) => {
  test.setTimeout(5 * 60_000);
  const page = await (await browser.newContext({ viewport: DEVICES.tablet })).newPage();
  const log: string[] = [];
  let t0 = Date.now();
  const at = () => `+${((Date.now() - t0) / 1000).toFixed(1)}s`;
  page.on('websocket', (ws) => {
    log.push(`${at()} WS opened ${ws.url().replace(/^wss?:\/\/[^/]+/, '')}`);
    ws.on('framereceived', (f) => {
      const text = typeof f.payload === 'string' ? f.payload : '';
      if (/sessionUpdate/.test(text)) log.push(`${at()} ⇠ WS ${text.slice(0, 180)}`);
    });
    ws.on('close', () => log.push(`${at()} WS closed`));
  });
  await page.clock.install();
  await login(page);
  const before = new Date((await serverRead(page, '{ session { expiresAt } }')).session.expiresAt).getTime();
  await page.clock.fastForward(before - Date.now() - 4 * 60_000);
  const prompt = page.getByRole('dialog').filter({ hasText: 'Your session is about to expire' });
  await expect(prompt).toBeVisible({ timeout: 30_000 });
  t0 = Date.now();
  log.push('--- click Extend session ---');
  page.on('request', (r) => { if (/reauth|graphql/.test(r.url())) log.push(`${at()} → ${r.url().replace(/^https:\/\/[^/]+/, '')} ${r.postDataJSON?.()?.operationName ?? ''}`); });
  page.on('response', (r) => { if (/reauth|graphql/.test(r.url())) log.push(`${at()} ← ${r.status()} ${r.url().replace(/^https:\/\/[^/]+/, '')}`); });
  await prompt.getByLabel('Password').fill(globals.DATA_DOG_PASSWORD);
  await prompt.getByRole('button', { name: 'Extend session' }).click();
  await page.waitForTimeout(8000);
  console.log(log.join('\n'));
  console.log('prompt still open:', await prompt.count() > 0, '| error shown:', await prompt.getByText('The operation was aborted.').count() > 0);
  await page.context().close();
});
