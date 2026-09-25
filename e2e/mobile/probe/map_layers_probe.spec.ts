import { expect, test } from '@playwright/test';
import { appUrl, freshSession } from '../support/session';

// Which layers does the map list, and which are on? Read-only: the list is opened and read, nothing toggled.
test('map layers', async ({ browser }) => {
  test.setTimeout(3 * 60_000);
  const page = await freshSession(browser, { touch: true });
  try {
    const tiles: string[] = [];
    page.on('request', (r) => { if (/mbtiles|tiles?\//i.test(r.url()) && !/mapbox\.com/.test(r.url())) tiles.push(new URL(r.url()).pathname.split('/').slice(0, 4).join('/')); });
    await page.goto(appUrl('map'), { waitUntil: 'load' });
    await expect(page.locator('canvas.mapboxgl-canvas')).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(8_000);
    const bl = page.locator('.mapboxgl-ctrl-bottom-left');
    console.log(`bottom-left controls: ${(await bl.innerText().catch(() => '')).replace(/\s+/g, ' ') || '(no text)'} · buttons ${await bl.locator('button').count()}`);
    await page.getByText('Layers', { exact: true }).click().catch(() => undefined);
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: 'results/layers-probe.png' });
    const txt = await page.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find((e) => (e as HTMLElement).innerText?.startsWith('Select All'));
      const box = el?.parentElement ?? document.body;
      const sc = [...box.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 20) as HTMLElement | undefined;
      if (sc) sc.scrollTop = sc.scrollHeight;
      return [...document.querySelectorAll('label, [class*="Group-root"]')].map((e) => (e as HTMLElement).innerText.split('\n')[0].slice(0, 60))
        .filter((s) => /work|stage|order/i.test(s));
    });
    console.log(`work-ish entries: ${[...new Set(txt)].join(' | ') || 'none'}`);
    await page.waitForTimeout(1_000);
    await page.screenshot({ path: 'results/layers-probe-bottom.png' });
    const checks = page.locator('input[type="checkbox"]');
    const n = await checks.count();
    for (let i = 0; i < 0 && i < n; i++) {
      const c = checks.nth(i);
      const label = (await c.locator('xpath=ancestor::*[self::label or contains(@class,"Group")][1]').innerText().catch(() => '?')).replace(/\s+/g, ' ');
      console.log(`layer: ${label} · ${await c.isChecked() ? 'ON' : 'off'}`);
    }
    console.log(`tile paths: ${[...new Set(tiles)].join(' | ') || 'none'}`);
  } finally {
    await page.context().close();
  }
});
