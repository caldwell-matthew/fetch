import { expect, test } from '@playwright/test';
import { RUM_HOSTS } from '../../playwright.config';
import { appUrl, freshSession } from '../support/session';

// Proves no test browser reports to Datadog RUM: every request to a RUM host fails, none gets a response, and the
// page never gets `window.DD_RUM`. Read-only.
test('rum blocked', async ({ browser }) => {
  test.setTimeout(4 * 60_000);
  const page = await freshSession(browser);
  try {
    const isRum = (u: string) => RUM_HOSTS.some((h) => new URL(u).hostname.endsWith(h));
    const answered: string[] = [], failed: string[] = [];
    page.on('response', (r) => { if (isRum(r.url())) answered.push(new URL(r.url()).hostname); });
    page.on('requestfailed', (r) => { if (isRum(r.url())) failed.push(new URL(r.url()).hostname); });
    for (const path of ['', 'work', 'asset-lookup']) {
      await page.goto(appUrl(path), { waitUntil: 'load' });
      await page.waitForTimeout(8_000);
    }
    const hasRum = await page.evaluate(() => typeof (window as any).DD_RUM !== 'undefined');
    console.log(`RUM requests answered: ${answered.length} · failed (blocked): ${failed.length} [${[...new Set(failed)].join(', ')}] · window.DD_RUM: ${hasRum}`);
    expect(answered, 'no RUM request got through').toEqual([]);
    expect(hasRum, 'the RUM script never loaded').toBe(false);
  } finally {
    await page.context().close();
  }
});
