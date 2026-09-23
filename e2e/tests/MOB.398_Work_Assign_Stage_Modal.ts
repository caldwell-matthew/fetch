// Generated from Mobile/dd_tests_mobile/MOB.398_Work_Assign_Stage_Modal.json by to_playwright.py — do not edit by hand yet.
// MOB.398_Work_Assign_Stage_Modal

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob398(page: Page): Promise<void> {
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
    // The "Assign Work Stage" button renders
    await assertElementPresent(page, `//button[contains(normalize-space(.), "Assign Work Stage")]`, DEFAULT_TIMEOUT);
    // Click "Assign Work Stage"
    await el(page, `//button[contains(normalize-space(.), "Assign Work Stage")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the modal and its auto-opened crew dropdown
    await wait(page, 3);
    // PROOF: the crew form rendered
    await assertElementPresent(page, `//*[@id="crewform"]`, DEFAULT_TIMEOUT);
    // The "Keep local copy of work?" option renders
    await assertPageContains(page, `Keep local copy of work`, DEFAULT_TIMEOUT);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Cancel — close the modal without assigning
    await page.keyboard.press(`Escape`);
    // Wait for the modal to close
    await wait(page, 2);
    // RESTORED: the modal closed and nothing was assigned
    await assertPageLacks(page, `Keep local copy of work`, DEFAULT_TIMEOUT);
  }
}
