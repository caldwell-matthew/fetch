// Generated from Mobile/dd_tests_mobile/MOB.150_Nav_Work_Orders.json by to_playwright.py — do not edit by hand yet.
// MOB.150_Nav_Work_Orders

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent } from '../support/dd';

export async function mob150(page: Page): Promise<void> {
    // Navigate to /work
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Test page title "Work Orders"
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, DEFAULT_TIMEOUT);
    // Test workstage search input is present
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
}
