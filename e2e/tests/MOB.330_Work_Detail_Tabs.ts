// Generated from Mobile/dd_tests_mobile/MOB.330_Work_Detail_Tabs.json by to_playwright.py — do not edit by hand yet.
// MOB.330_Work_Detail_Tabs

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, assertPageContains, el, wait } from '../support/dd';

export async function mob330(page: Page): Promise<void> {
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, DEFAULT_TIMEOUT);
    // Test a tab strip is rendered
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, DEFAULT_TIMEOUT);
    // Test the first tab starts active
    await assertElementPresent(page, `(//*[@role="tab"])[1][@data-active]`, DEFAULT_TIMEOUT);
    // Switch to the second tab
    await el(page, `(//*[@role="tab"])[2]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the panel to mount
    await wait(page, 2);
    // Test the second tab is now active
    await assertElementPresent(page, `(//*[@role="tab"])[2][@data-active]`, DEFAULT_TIMEOUT);
    // Switch back to the first tab
    await el(page, `(//*[@role="tab"])[1]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the panel to mount
    await wait(page, 2);
    // Test the first tab is active again
    await assertElementPresent(page, `(//*[@role="tab"])[1][@data-active]`, DEFAULT_TIMEOUT);
}
