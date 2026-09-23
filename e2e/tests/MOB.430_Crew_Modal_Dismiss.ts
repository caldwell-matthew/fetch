// Generated from Mobile/dd_tests_mobile/MOB.430_Crew_Modal_Dismiss.json by to_playwright.py — do not edit by hand yet.
// MOB.430_Crew_Modal_Dismiss

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertPageContains, assertPageLacks, el } from '../support/dd';
import { globals } from '../support/env';

export async function mob430(page: Page): Promise<void> {
  const MOBDEV = globals.MOBDEV;
    // Navigate to mobile home
    await page.goto(`${MOBDEV}`);
    // Open the hamburger menu
    await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Click Switch Crews
    await el(page, `//button[.//div[normalize-space(.)="Switch Crews"]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Test crew switcher opened
    await assertPageContains(page, `Switch Crew`, DEFAULT_TIMEOUT);
    // Test current-crew label is shown
    await assertPageContains(page, `Currently logged in as`, DEFAULT_TIMEOUT);
    // The modal's description is `OFFLINE_FEATURE_MESSAGE` (always shown)
    await assertPageContains(page, `This feature requires an internet connection.`, 15000);
    // Dismiss with Cancel
    await el(page, `//button[normalize-space(.)="Cancel"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Test crew switcher closed
    await assertPageLacks(page, `Currently logged in as`, DEFAULT_TIMEOUT);
}
