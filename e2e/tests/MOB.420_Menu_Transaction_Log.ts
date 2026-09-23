// Generated from Mobile/dd_tests_mobile/MOB.420_Menu_Transaction_Log.json by to_playwright.py — do not edit by hand yet.
// MOB.420_Menu_Transaction_Log

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, el } from '../support/dd';
import { globals } from '../support/env';

export async function mob420(page: Page): Promise<void> {
  const MOBDEV = globals.MOBDEV;
    // Navigate to mobile home
    await page.goto(`${MOBDEV}`);
    // Open the hamburger menu
    await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Click Transaction Log
    await el(page, `//button[normalize-space(.)="Transaction Log"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Test page title "Transaction Log"
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Transaction Log")]`, `Transaction Log`, DEFAULT_TIMEOUT);
}
