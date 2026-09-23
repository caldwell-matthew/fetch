// Generated from Mobile/dd_tests_mobile/MOB.132_TransactionLog_Search.json by to_playwright.py — do not edit by hand yet.
// MOB.132_TransactionLog_Search

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, wait } from '../support/dd';

export async function mob132(page: Page): Promise<void> {
  try {
    // Navigate to the Transaction Log
    await page.goto(`https://dev.mentorapm.com/apm-mobile/transactions`);
    // Let the page mount and read `gql_log`
    await wait(page, 5);
    // Test the "Transaction Log" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Transaction Log")]`, `Transaction Log`, 30000);
    // The search box renders
    await assertElementPresent(page, `//input[@placeholder="Search for things"]`, 30000);
    // LOG GUARD: the session has logged at least one transaction to filter
    await assertFromJavascript(page, `const ROWS = () => document.querySelectorAll('table tbody tr').length;
const n = ROWS();
if (n < 1) return false;
sessionStorage.setItem('__dd132_rows', String(n));
return true;`, 60000);
    // Focus the search box
    await el(page, `//input[@placeholder="Search for things"]`).click({ timeout: 30000 });
    // Select any existing term first (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Type a term nothing can match
    await el(page, `//input[@placeholder="Search for things"]`).fill(`ZZZZ-NO-SUCH-TRANSACTION`, { timeout: DEFAULT_TIMEOUT });
    // Let the filter apply
    await wait(page, 2);
    // ⭐ NEGATIVE: the filter drives the row count to ZERO
    await assertFromJavascript(page, `const ROWS = () => document.querySelectorAll('table tbody tr').length;
return ROWS() === 0;`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Focus the search box (to clear it)
    await el(page, `//input[@placeholder="Search for things"]`).click({ timeout: 30000 });
    // Select all
    await page.keyboard.press(`Control+a`);
    // Delete
    await page.keyboard.press(`Delete`);
    // Let the list restore
    await wait(page, 2);
    // ⭐ RESTORED: clearing the term brings the SAME row count back
    await assertFromJavascript(page, `const ROWS = () => document.querySelectorAll('table tbody tr').length;
const before = Number(sessionStorage.getItem('__dd132_rows') || '0');
if (!before) return false;
return ROWS() === before;`, 30000);
    // CLEANUP: remove this test's scratch key
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd132_rows');
return !sessionStorage.getItem('__dd132_rows');`, 30000);
  }
}
