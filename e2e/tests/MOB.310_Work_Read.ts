// Generated from Mobile/dd_tests_mobile/MOB.310_Work_Read.json by to_playwright.py — do not edit by hand yet.
// MOB.310_Work_Read

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, assertPageContains } from '../support/dd';

export async function mob310(page: Page): Promise<void> {
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, DEFAULT_TIMEOUT);
    // Test status control is present
    await assertElementPresent(page, `//span[contains(normalize-space(.), "Status:")]`, DEFAULT_TIMEOUT);
}
