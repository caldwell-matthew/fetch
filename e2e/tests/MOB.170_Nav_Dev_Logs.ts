// Generated from Mobile/dd_tests_mobile/MOB.170_Nav_Dev_Logs.json by to_playwright.py — do not edit by hand yet.
// MOB.170_Nav_Dev_Logs

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent } from '../support/dd';

export async function mob170(page: Page): Promise<void> {
    // Navigate to /logz
    await page.goto(`https://dev.mentorapm.com/apm-mobile/logz`);
    // Test page title "Dev Logs"
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Dev Logs")]`, `Dev Logs`, DEFAULT_TIMEOUT);
}
