// Generated from Mobile/dd_tests_mobile/MOB.120_Nav_Map.json by to_playwright.py — do not edit by hand yet.
// MOB.120_Nav_Map

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent } from '../support/dd';

export async function mob120(page: Page): Promise<void> {
    // Navigate to /map
    await page.goto(`https://dev.mentorapm.com/apm-mobile/map`);
    // Test page title "The Map"
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "The Map")]`, `The Map`, DEFAULT_TIMEOUT);
}
