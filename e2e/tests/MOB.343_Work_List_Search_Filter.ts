// Generated from Mobile/dd_tests_mobile/MOB.343_Work_List_Search_Filter.json by to_playwright.py — do not edit by hand yet.
// MOB.343_Work_List_Search_Filter

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageLacks, el, wait } from '../support/dd';

export async function mob343(page: Page): Promise<void> {
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
    // BASELINE: the unfiltered list has at least one row
    await assertFromJavascript(page, `const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
return ROWS().length >= 1;`, 30000);
    // Focus the search box
    await el(page, `//input[@placeholder="Find Workstage(s)"]`).click({ timeout: 30000 });
    // Select any existing text (typeText APPENDS without this)
    await page.keyboard.press(`Control+a`);
    // Type a term nothing can match ("ZZQXJV0000")
    await el(page, `//input[@placeholder="Find Workstage(s)"]`).fill(`ZZQXJV0000`, { timeout: DEFAULT_TIMEOUT });
    // Wait past the 300ms search debounce
    await wait(page, 3);
    // PROOF: the list filtered to ZERO rows — the search really filters
    await assertFromJavascript(page, `const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
return ROWS().length === 0;`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Focus the search box again
    await el(page, `//input[@placeholder="Find Workstage(s)"]`).click({ timeout: 30000 });
    // Select the nonsense term
    await page.keyboard.press(`Control+a`);
    // Delete it — restore the unfiltered list
    await page.keyboard.press(`Delete`);
    // Wait past the debounce again
    await wait(page, 3);
    // RESTORED: the rows are back — so there WERE rows to filter
    await assertFromJavascript(page, `const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
return ROWS().length >= 1;`, 30000);
  }
}
