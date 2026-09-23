// Generated from Mobile/dd_tests_mobile/MOB.700_AssetLookup_Search.json by to_playwright.py — do not edit by hand yet.
// MOB.700_AssetLookup_Search

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertPageContains, el, wait } from '../support/dd';

export async function mob700(page: Page): Promise<void> {
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for the page to mount
    await wait(page, 5);
    // Test the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, DEFAULT_TIMEOUT);
    // Test the search input renders
    await assertElementPresent(page, `//input[@name="asset-search"]`, DEFAULT_TIMEOUT);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Select any persisted query first (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Search for Pump 0102
    await el(page, `//input[@name="asset-search"]`).fill(`Pump 0102`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter - there is no search button)
    await page.keyboard.press(`Enter`);
    // Wait for the search results
    await wait(page, 8);
    // Test Pump 0102 is in the results
    await assertPageContains(page, `Pump 0102`, DEFAULT_TIMEOUT);
    // Expand the first result
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the detail panel to mount
    await wait(page, 3);
    // Test the asset detail tab strip rendered
    await assertElementPresent(page, `((//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"])[1]`, DEFAULT_TIMEOUT);
    // Test the "Work History" tab exists (one of the six)
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Work History"]`, DEFAULT_TIMEOUT);
}
