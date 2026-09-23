// Generated from Mobile/dd_tests_mobile/MOB.130_Nav_Transaction_Log.json by to_playwright.py — do not edit by hand yet.
// MOB.130_Nav_Transaction_Log

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent } from '../support/dd';

export async function mob130(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /transactions", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/transactions`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test page title \"Transaction Log\"", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Transaction Log")]`, `Transaction Log`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
