// Generated from Mobile/dd_tests_mobile/MOB.410_Menu_Resync.json by to_playwright.py — do not edit by hand yet.
// MOB.410_Menu_Resync

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, el, wait } from '../support/dd';
import { globals } from '../support/env';

export async function mob410(page: Page): Promise<void> {
  const MOBDEV = globals.MOBDEV;
    // Navigate to mobile home
    await page.goto(`${MOBDEV}`);
    // Open the hamburger menu
    await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Click ReSync
    await el(page, `//button[normalize-space(.)="ReSync"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the resync to complete
    await wait(page, 10);
    // Test app shell survived the resync
    await assertElementPresent(page, `//button[@aria-label="Toggle navigation"]`, DEFAULT_TIMEOUT);
}
