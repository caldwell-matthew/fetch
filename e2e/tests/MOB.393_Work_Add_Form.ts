// Generated from Mobile/dd_tests_mobile/MOB.393_Work_Add_Form.json by to_playwright.py — do not edit by hand yet.
// MOB.393_Work_Add_Form

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob393(page: Page): Promise<void> {
  try {
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
    // Open the Forms tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Form")]`).click({ timeout: 30000 });
    // Open the add form
    await el(page, `//button[normalize-space(.)="Add"]`).click({ timeout: 30000 });
    // Wait for the modal
    await wait(page, 2);
    // PROOF: the form picker rendered
    await assertElementPresent(page, `//*[@id="formId"]`, 30000);
    // Open the picker
    await el(page, `//*[@id="formId"]`).click({ timeout: 30000 });
    // Wait for options
    await wait(page, 2);
    // PROOF: the picker offers at least one form
    await assertElementPresent(page, `(//*[@role="option"])[1]`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Cancel without adding
    await page.keyboard.press(`Escape`);
    // Let the modal close
    await wait(page, 2);
    // Close the add modal
    await page.keyboard.press(`Escape`);
  }
}
