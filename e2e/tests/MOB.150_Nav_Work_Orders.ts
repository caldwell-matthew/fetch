// Generated from Mobile/dd_tests_mobile/MOB.150_Nav_Work_Orders.json by to_playwright.py — do not edit by hand yet.
// MOB.150_Nav_Work_Orders

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent } from '../support/dd';

export async function mob150(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test page title \"Work Orders\"", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, DEFAULT_TIMEOUT);
  });
  await run.step("Test workstage search input is present", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
