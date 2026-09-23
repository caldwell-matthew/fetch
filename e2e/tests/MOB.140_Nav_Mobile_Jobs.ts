// Generated from Mobile/dd_tests_mobile/MOB.140_Nav_Mobile_Jobs.json by to_playwright.py — do not edit by hand yet.
// MOB.140_Nav_Mobile_Jobs

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent } from '../support/dd';

export async function mob140(page: Page): Promise<void> {
    // Navigate to /asset-verify
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Test page title "Mobile Jobs"
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, DEFAULT_TIMEOUT);
    // Test mobile job search input is present
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, 30000);
}
