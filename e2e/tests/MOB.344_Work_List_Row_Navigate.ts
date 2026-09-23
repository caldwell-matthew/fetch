// Generated from Mobile/dd_tests_mobile/MOB.344_Work_List_Row_Navigate.json by to_playwright.py — do not edit by hand yet.
// MOB.344_Work_List_Row_Navigate

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob344(page: Page): Promise<void> {
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
    // WORK ROW GUARD: at least one work order rendered
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 60000);
    // BASELINE: we are on the LIST, not a detail page
    await assertFromJavascript(page, `return /\\/work\\/?$/.test(location.pathname);`, 30000);
    // Tap the first work order in the list
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`).click({ timeout: 30000 });
    // Let the detail route mount
    await wait(page, 5);
    // PROOF: the Work Orders detail page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // The detail view rendered its status control
    await assertPageContains(page, `Status:`, DEFAULT_TIMEOUT);
    // PROOF: the URL gained a /work/<id> segment — a record really opened
    await assertFromJavascript(page, `return /\\/work\\/[^/]+$/.test(location.pathname);`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Go back to the list with the header back arrow
    await el(page, `//*[@id="page-title"]//*[@data-icon="chevrons-left" or contains(concat(" ", normalize-space(@class), " "), " fa-chevrons-left ") or @data-icon="chevron-double-left" or contains(concat(" ", normalize-space(@class), " "), " fa-chevron-double-left ") or @data-icon="angles-left" or contains(concat(" ", normalize-space(@class), " "), " fa-angles-left ")]`).click({ timeout: 30000 });
    // Let the list re-render
    await wait(page, 4);
    // RESTORED: back on the work list
    await assertFromJavascript(page, `return /\\/work\\/?$/.test(location.pathname);`, 30000);
  }
}
