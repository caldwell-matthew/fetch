// Generated from Mobile/dd_tests_mobile/MOB.395_Work_GenInfo_Edit.json by to_playwright.py — do not edit by hand yet.
// MOB.395_Work_GenInfo_Edit

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob395(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
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
    // Open the General Info tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "General Info")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the General Info panel to mount
    await wait(page, 3);
    // FIELD GUARD: the Description input is on this tab
    await assertElementPresent(page, `//*[@id="desc"]`, DEFAULT_TIMEOUT);
    // Focus the Description field
    await el(page, `//*[@id="desc"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Select the existing text (typeText APPENDS without this)
    await page.keyboard.press(`Control+a`);
    // Type the Description value
    await el(page, `//*[@id="desc"]`).fill(`DD SYNTHETIC EDIT ${RUNID}`, { timeout: DEFAULT_TIMEOUT });
    // Submit the General Info form
    await el(page, `//button[@form="mobile-genInfo"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Brief wait for the toast to appear
    await wait(page, 2);
    await optional("Record Updated toast (optional: fires optimistically)", async () => {
      await assertPageContains(page, `Record Updated`, DEFAULT_TIMEOUT);
    });
    // Wait for the update mutation to reach the server
    await wait(page, 5);
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
    // Open the General Info tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "General Info")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the General Info panel to mount
    await wait(page, 3);
    // FIELD GUARD: the Description input is on this tab
    await assertElementPresent(page, `//*[@id="desc"]`, DEFAULT_TIMEOUT);
    // PROOF: after a reload the description is no longer the baseline
    await assertFromJavascript(page, `const el = document.querySelector('#desc');
if (!el) return false;
return el.value.trim() !== 'DATADOG FIXTURE';`, DEFAULT_TIMEOUT);
    // Focus the Description field
    await el(page, `//*[@id="desc"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Select the existing text (typeText APPENDS without this)
    await page.keyboard.press(`Control+a`);
    // Type the Description value
    await el(page, `//*[@id="desc"]`).fill(`DATADOG FIXTURE`, { timeout: DEFAULT_TIMEOUT });
    // Submit the restore
    await el(page, `//button[@form="mobile-genInfo"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the restore mutation
    await wait(page, 6);
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
    // Open the General Info tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "General Info")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the General Info panel to mount
    await wait(page, 3);
    // FIELD GUARD: the Description input is on this tab
    await assertElementPresent(page, `//*[@id="desc"]`, DEFAULT_TIMEOUT);
    // RESTORED: the description is exactly "DATADOG FIXTURE" again
    await assertFromJavascript(page, `const el = document.querySelector('#desc');
if (!el) return false;
return el.value.trim() === 'DATADOG FIXTURE';`, DEFAULT_TIMEOUT);
}
