// Generated from Mobile/dd_tests_mobile/MOB.210_Perms_Menu_Gating.json by to_playwright.py — do not edit by hand yet.
// MOB.210_Perms_Menu_Gating

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob210(page: Page): Promise<void> {
    // Navigate to the mobile home page
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`);
    // Wait for the app shell
    await wait(page, 5);
    // Open the menu to read the session role
    await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the menu
    await wait(page, 2);
    // Role is now "Admin"
    await assertPageContains(page, `Admin`, DEFAULT_TIMEOUT);
    // Baseline: "Work Orders" is in the menu under Admin
    await assertPageContains(page, `Work Orders`, DEFAULT_TIMEOUT);
    // Close the menu
    await page.keyboard.press(`Escape`);
    // HOME TILES: exactly 6 permission-gated tile(s) rendered
    await assertFromJavascript(page, `return document.querySelectorAll('img[alt^="icon for "]').length === 6;`, 30000);
    // Baseline: the "Work Orders" home TILE is present under Admin
    await assertElementPresent(page, `//img[@alt="icon for Work Orders url"]`, 30000);
    // Open the header menu
    await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Click Switch Crews
    await el(page, `//button[.//div[normalize-space(.)="Switch Crews"]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the crew list
    await wait(page, 2);
    // Select Admin 0000
    await el(page, `//label[contains(normalize-space(.), "0000")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Submit the crew change
    await el(page, `//button[normalize-space(.)="Submit"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the crew change to resync
    await wait(page, 8);
    // Navigate to the mobile home page
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`);
    // Wait for the app shell
    await wait(page, 5);
    // Open the menu to read the session role
    await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the menu
    await wait(page, 2);
    // Role is now "0000"
    await assertPageContains(page, `0000`, DEFAULT_TIMEOUT);
    // PROOF: "Work Orders" is hidden without read permission
    await assertPageLacks(page, `Work Orders`, DEFAULT_TIMEOUT);
    // Close the menu
    await page.keyboard.press(`Escape`);
    // PROOF: Home falls through to its "No valid permissions" empty state
    await assertPageContains(page, `No valid permissions`, DEFAULT_TIMEOUT);
    // HOME TILES: exactly 0 permission-gated tile(s) rendered
    await assertFromJavascript(page, `return document.querySelectorAll('img[alt^="icon for "]').length === 0;`, 30000);
    // Open the header menu
    await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Click Switch Crews
    await el(page, `//button[.//div[normalize-space(.)="Switch Crews"]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the crew list
    await wait(page, 2);
    // Select Admin (restore)
    await el(page, `//label[normalize-space(.)="Admin"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Submit the crew change
    await el(page, `//button[normalize-space(.)="Submit"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the crew change to resync
    await wait(page, 8);
    // Navigate to the mobile home page
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`);
    // Wait for the app shell
    await wait(page, 5);
    // Open the menu to read the session role
    await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the menu
    await wait(page, 2);
    // Role is now "Admin"
    await assertPageContains(page, `Admin`, DEFAULT_TIMEOUT);
    // RESTORED: "Work Orders" is back in the menu
    await assertPageContains(page, `Work Orders`, DEFAULT_TIMEOUT);
    // Close the menu
    await page.keyboard.press(`Escape`);
    // HOME TILES: exactly 6 permission-gated tile(s) rendered
    await assertFromJavascript(page, `return document.querySelectorAll('img[alt^="icon for "]').length === 6;`, 30000);
    // RESTORED: the empty state is gone
    await assertPageLacks(page, `No valid permissions`, DEFAULT_TIMEOUT);
}
