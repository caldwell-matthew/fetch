// Generated from Mobile/dd_tests_mobile/MOB.110_Nav_Material_Lookup.json by to_playwright.py — do not edit by hand yet.
// MOB.110_Nav_Material_Lookup

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent } from '../support/dd';

export async function mob110(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /material-lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/material-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test page title \"Material Lookup\"", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]`, `Material Lookup`, DEFAULT_TIMEOUT);
  });
  await run.step("Test material search input is present", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Search for material items by name"]`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
