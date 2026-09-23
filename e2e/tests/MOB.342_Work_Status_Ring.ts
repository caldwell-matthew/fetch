// Generated from Mobile/dd_tests_mobile/MOB.342_Work_Status_Ring.json by to_playwright.py — do not edit by hand yet.
// MOB.342_Work_Status_Ring

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageLacks, el, wait } from '../support/dd';

export async function mob342(page: Page): Promise<void> {
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
    // The status ring rendered
    await assertElementPresent(page, `//*[contains(@class,"mantine-RingProgress-root")]`, 30000);
    // The legend renders at least one `Status (n)` entry
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('li')]
  .map(e => (e.textContent || '').trim())
  .filter(t => /^[A-Za-z ]+\\(\\d+\\)$/.test(t));
return items.length > 0;`, 30000);
    // A "Ready (n)" legend entry is present
    await assertElementPresent(page, `//li[contains(normalize-space(.), "Ready (")]`, 30000);
    // BASELINE: rows are rendered
    await assertFromJavascript(page, `const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
return ROWS().length > 0;`, 30000);
    // Select the Ready status in the legend
    await el(page, `//li[contains(normalize-space(.), "Ready (")]`).click({ timeout: 30000 });
    // Let the list re-filter
    await wait(page, 3);
    // PROOF: the Ready entry now renders as SELECTED (Highlight emits a <mark>)
    await assertFromJavascript(page, `return [...document.querySelectorAll('li mark')]
  .some(m => (m.textContent || '').includes('Ready'));`, 30000);
    // PROOF: rows survive the Ready filter, and all are still Ready-green
    await assertFromJavascript(page, `const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
const rows = ROWS();
// Non-vacuous: a filter that emptied the list would pass an all-match test.
if (!rows.length) return false;
return rows.every(r => getComputedStyle(r).borderLeftColor === 'rgb(155, 203, 82)');`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Deselect Ready (the legend toggles)
    await el(page, `//li[contains(normalize-space(.), "Ready (")]`).click({ timeout: 30000 });
    // Let the list restore
    await wait(page, 3);
    // RESTORED: nothing in the legend is marked selected
    await assertFromJavascript(page, `return [...document.querySelectorAll('li mark')].length === 0;`, 30000);
    // RESTORED: the unfiltered list is back
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 60000);
  }
}
