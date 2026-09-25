import { test } from '@playwright/test';
import { appUrl, freshSession } from '../support/session';
import { LOADING_BAR, waitForPrefetch } from '../support/prefetch';

// Does LOADING_BAR match the prefetch's bars, and how long do they last? Read-only.
test('prefetch bars', async ({ browser }) => {
  test.setTimeout(6 * 60_000);
  const page = await freshSession(browser);
  try {
    for (const path of ['work', 'asset-verify']) {
      const t0 = Date.now();
      await page.goto(appUrl(path), { waitUntil: 'load' });
      let seen = 0; const labels = new Set<string>();
      const watch = setInterval(async () => {
        const n = await page.locator(LOADING_BAR).count().catch(() => 0);
        if (n) { seen++; for (const l of await page.locator(`xpath=//*[contains(@class,"mantine-Progress-root")][.//*[@data-animated]]/preceding-sibling::p`).allInnerTexts().catch(() => [])) labels.add(l.replace(/\d+/g, 'N')); }
      }, 200);
      await waitForPrefetch(page);
      clearInterval(watch);
      console.log(`${path}: settled after ${((Date.now() - t0) / 1000).toFixed(1)}s · bar seen in ${seen} samples · ${[...labels].join(' | ')}`);
    }
  } finally {
    await page.context().close();
  }
});
