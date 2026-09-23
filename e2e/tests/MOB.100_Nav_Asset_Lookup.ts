// Generated from Mobile/dd_tests_mobile/MOB.100_Nav_Asset_Lookup.json by to_playwright.py — do not edit by hand yet.
// MOB.100_Nav_Asset_Lookup

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent } from '../support/dd';

export async function mob100(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /asset-lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test page title \"Asset Lookup\"", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
