// Generated from Mobile/dd_tests_mobile/MOB.130_Nav_Transaction_Log.json by to_playwright.py — do not edit by hand yet.
// MOB.130_Nav_Transaction_Log

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent } from '../support/dd';

export async function mob130(page: Page): Promise<void> {
    // Navigate to /transactions
    await page.goto(`https://dev.mentorapm.com/apm-mobile/transactions`);
    // Test page title "Transaction Log"
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Transaction Log")]`, `Transaction Log`, DEFAULT_TIMEOUT);
}
