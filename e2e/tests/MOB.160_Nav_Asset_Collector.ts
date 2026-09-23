// Generated from Mobile/dd_tests_mobile/MOB.160_Nav_Asset_Collector.json by to_playwright.py — do not edit by hand yet.
// MOB.160_Nav_Asset_Collector

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent } from '../support/dd';

export async function mob160(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /asset-collector", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test page title \"Asset Collector / Lens\"", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Collector / Lens")]`, `Asset Collector / Lens`, DEFAULT_TIMEOUT);
  });
  await run.step("Test asset search input is present", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Asset(s)"]`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
