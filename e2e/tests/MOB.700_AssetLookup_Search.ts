// Generated from Mobile/dd_tests_mobile/MOB.700_AssetLookup_Search.json by to_playwright.py — do not edit by hand yet.
// MOB.700_AssetLookup_Search

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertPageContains, click, press, typeText, wait } from '../support/dd';

export async function mob700(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to asset lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the page to mount", {}, async () => {
    await wait(page, 5);
  });
  await run.step("Test the \"Asset Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the search input renders", {}, async () => {
    await assertElementPresent(page, `//input[@name="asset-search"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Select any persisted query first (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for Pump 0102", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter - there is no search button)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Wait for the search results", {}, async () => {
    await wait(page, 8);
  });
  await run.step("Test Pump 0102 is in the results", {}, async () => {
    await assertPageContains(page, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Expand the first result", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the detail panel to mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the asset detail tab strip rendered", {}, async () => {
    await assertElementPresent(page, `((//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"])[1]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the \"Work History\" tab exists (one of the six)", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Work History"]`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
