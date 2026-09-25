import { expect, test } from '@playwright/test';
import { appUrl, FIXTURE_WO, freshSession } from '../support/session';

// How does the fixture work order's card open on the map? Read-only: nothing is clicked but the map and the card.
test('workstage map card', async ({ browser }) => {
  test.setTimeout(5 * 60_000);
  const page = await freshSession(browser, { touch: true });
  try {
    await page.goto(appUrl('work'), { waitUntil: 'load' });
    await expect(page.locator('#page-title h4', { hasText: 'Work Orders' })).toBeVisible({ timeout: 60_000 });
    await page.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
    await expect(page.getByRole('tab').first()).toBeVisible({ timeout: 60_000 });
    await page.locator('button:has([data-icon="globe"])').first().click();
    await page.locator('.mantine-Menu-item', { hasText: 'View in Map' }).click();
    const gear = page.locator('[aria-label="map-options"]');
    const t0 = Date.now();
    const opened = await gear.waitFor({ timeout: 90_000 }).then(() => true, () => false);
    console.log(`auto-open: ${opened} after ${Math.round((Date.now() - t0) / 1000)}s`);
    await page.screenshot({ path: 'results/wsprobe-1.png' });
    if (!opened) {
      const pin = (await page.locator('.mapboxgl-marker').first().boundingBox())!;
      console.log(`marker box ${JSON.stringify(pin)}`);
      await page.touchscreen.tap(pin.x + pin.width / 2, pin.y + pin.height - 1);
      await gear.waitFor({ timeout: 30_000 }).catch(() => undefined);
    }
    await page.screenshot({ path: 'results/wsprobe-2.png' });
    const header = async () => (await page.locator('[aria-label="map-options"]').locator('xpath=ancestor::div[contains(@class,"mantine-Group-root")][2]').innerText().catch(() => '?')).replace(/\s+/g, ' ');
    console.log(`card: ${await header()}`);
    const next = page.getByRole('button').filter({ has: page.locator('[data-icon="chevron-right"], [data-icon="arrow-right"], [data-icon="caret-right"]') });
    console.log(`cycle text: ${(await page.getByText(/^\d+ \/ \d+$/).allInnerTexts()).join(' | ') || 'none'}`);
    for (let i = 0; i < 4 && (await next.count()); i++) {
      await next.last().click().catch(() => undefined);
      await page.waitForTimeout(1500);
      console.log(`after next ${i + 1}: ${(await page.getByText(/^\d+ \/ \d+$/).allInnerTexts()).join(' | ')} · ${await header()}`);
    }
    await page.screenshot({ path: 'results/wsprobe-3.png' });
  } finally {
    await page.context().close();
  }
});
