// Generated from Mobile/dd_tests_mobile/MOB.160_Nav_Asset_Collector.json by to_playwright.py — do not edit by hand yet.
// MOB.160_Nav_Asset_Collector

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent } from '../support/dd';

export async function mob160(page: Page): Promise<void> {
    // Navigate to /asset-collector
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`);
    // Test page title "Asset Collector / Lens"
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Collector / Lens")]`, `Asset Collector / Lens`, DEFAULT_TIMEOUT);
    // Test asset search input is present
    await assertElementPresent(page, `//input[@placeholder="Find Asset(s)"]`, DEFAULT_TIMEOUT);
}
