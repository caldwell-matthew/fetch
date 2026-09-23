// Generated from Mobile/dd_tests_mobile/MOB.340_Work_Search_Sort.json by to_playwright.py — do not edit by hand yet.
// MOB.340_Work_Search_Sort

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob340(page: Page): Promise<void> {
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
    // Focus the search box
    await el(page, `//input[@placeholder="Find Workstage(s)"]`).click({ timeout: 30000 });
    // Type a search term
    await el(page, `//input[@placeholder="Find Workstage(s)"]`).fill(`a`, { timeout: DEFAULT_TIMEOUT });
    // Wait for the 300ms search debounce
    await wait(page, 2);
    // Test the search box holds the term
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
    // Open the sort dropdown
    await el(page, `//button[.//*[@data-icon="sort-alt" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Test the Sort Criteria modal opened
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
    // Dismiss the sort modal
    await page.keyboard.press(`Escape`);
    // Test the sort modal closed
    await assertPageLacks(page, `Sort Criteria`, DEFAULT_TIMEOUT);
}
