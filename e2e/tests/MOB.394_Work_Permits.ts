// Generated from Mobile/dd_tests_mobile/MOB.394_Work_Permits.json by to_playwright.py — do not edit by hand yet.
// MOB.394_Work_Permits

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob394(page: Page): Promise<void> {
    // Navigate to /work — the work order list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Wait for the workstage pages and the lookup prefetch
    await wait(page, 20);
    // The work list rendered its search box
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
    // LOADEDALL 1/3: the initial fetch finished
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
    // LOADEDALL 2/3: paging through workstages finished
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
    // LOADEDALL 3/3: the per-stage detail downloads finished
    await assertPageLacks(page, `workstages downloaded`, 180000);
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the "Permits" tab
    await el(page, `//*[@role="tab"][normalize-space(.)="Permits"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the panel
    await wait(page, 3);
    // The "Permits" tab is active
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Permits"][@data-active]`, DEFAULT_TIMEOUT);
    // PROOF: a permit card rendered with its status, expiration and approver
    await assertFromJavascript(page, `
const t = document.body.innerText || '';
return t.indexOf('Status:') !== -1
    && t.indexOf('Expiration Date:') !== -1
    && t.indexOf('Approved By:') !== -1;
`, DEFAULT_TIMEOUT);
}
