// Generated from Mobile/dd_tests_mobile/MOB.400_Menu_Open_Close.json by to_playwright.py — do not edit by hand yet.
// MOB.400_Menu_Open_Close

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertPageContains, assertPageLacks, el } from '../support/dd';
import { globals } from '../support/env';

export async function mob400(page: Page): Promise<void> {
  const MOBDEV = globals.MOBDEV;
    // Navigate to mobile home
    await page.goto(`${MOBDEV}`);
    // Open the hamburger menu
    await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Test ReSync item is listed
    await assertPageContains(page, `ReSync`, DEFAULT_TIMEOUT);
    // Test Switch Crews item is listed
    await assertPageContains(page, `Switch Crews`, DEFAULT_TIMEOUT);
    // Test Log Out item is listed
    await assertPageContains(page, `Log Out`, DEFAULT_TIMEOUT);
    // Close the menu with Escape
    await page.keyboard.press(`Escape`);
    // Test menu closed
    await assertPageLacks(page, `Switch Crews`, DEFAULT_TIMEOUT);
}
