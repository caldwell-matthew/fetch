import { test, expect } from '@playwright/test';
import { freshSession, appUrl } from '../support/session';

// What happens after Asset Lookup's "View in Map"? Read-only.
test('view in map', async ({ browser }) => {
  test.setTimeout(4 * 60_000);
  const page = await freshSession(browser);
  const log: string[] = [];
  const t0 = Date.now(); const at = () => `+${((Date.now() - t0) / 1000).toFixed(1)}s`;
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) log.push(`${at()} url ${f.url().replace(/^https:\/\/[^/]+/, '')}`); });
  page.on('console', (m) => { if (m.type() === 'error') log.push(`${at()} console.error ${m.text().slice(0, 140)}`); });
  page.on('pageerror', (e) => log.push(`${at()} pageerror ${String(e).slice(0, 140)}`));
  page.on('console', (m) => { if (m.type() === 'error' && /reading 'map'/.test(m.text())) log.push(`${at()} STACK ${m.text().slice(0, 600)}`); });
  try {
  await page.goto(appUrl('asset-lookup'), { waitUntil: 'load' });
  const search = page.locator('input[name="asset-search"]');
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.fill('Tank 0040'); await search.press('Enter');
  const result = page.locator('.mantine-Accordion-item').filter({ hasText: 'Tank 0040' }).first();
  await expect(result).toBeVisible({ timeout: 60_000 });
  await result.locator('.mantine-Accordion-control').click();
  log.push(`${at()} clicking View in Map`);
  await result.getByRole('button', { name: 'View in Map' }).click();
  await page.waitForTimeout(8000);
  await page.waitForTimeout(4000);
  const names = await page.getByText(/^(Tank|Pump)[^\n]{0,20}\d{4}$/).allTextContents();
  log.push(`${at()} with no tap: card names ${JSON.stringify(names)} ; map-options ${await page.locator('[aria-label="map-options"]').count()}`);
  await page.screenshot({ path: `results/view_in_map_tank.png` });
  } finally {
    log.push(`${at()} last url ${page.url()}`);
    console.log(log.join('\n'));
    await page.context().close();
  }
});
