// Generated from legacy/Mobile/dd_tests_mobile/MOB.132_TransactionLog_Search.json by to_playwright.py — do not edit by hand yet.
// MOB.132_TransactionLog_Search

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, press, typeText, wait } from '../support/dd';

export async function mob132(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the Transaction Log", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/transactions`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page mount and read `gql_log`", {}, async () => {
    await wait(page, 5);
  });
  await run.step("Test the \"Transaction Log\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Transaction Log")]`, `Transaction Log`, 30000);
  });
  await run.step("The search box renders", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Search for things"]`, 30000);
  });
  await run.step("LOG GUARD: the session has logged at least one transaction to filter", {}, async () => {
    await assertFromJavascript(page, `const ROWS = () => document.querySelectorAll('table tbody tr').length;
const n = ROWS();
if (n < 1) return false;
sessionStorage.setItem('__dd132_rows', String(n));
return true;`, 60000);
  });
  await run.step("Focus the search box", {}, async () => {
    await click(page, `//input[@placeholder="Search for things"]`, 30000);
  });
  await run.step("Select any existing term first (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type a term nothing can match", {}, async () => {
    await typeText(page, `//input[@placeholder="Search for things"]`, `ZZZZ-NO-SUCH-TRANSACTION`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the filter apply", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 NEGATIVE: the filter drives the row count to ZERO", {}, async () => {
    await assertFromJavascript(page, `const ROWS = () => document.querySelectorAll('table tbody tr').length;
return ROWS() === 0;`, 30000);
  });
  await run.step("Focus the search box (to clear it)", {always: true}, async () => {
    await click(page, `//input[@placeholder="Search for things"]`, 30000);
  });
  await run.step("Select all", {always: true}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Delete", {always: true}, async () => {
    await press(page, `Delete`);
  });
  await run.step("Let the list restore", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 RESTORED: clearing the term brings the SAME row count back", {always: true}, async () => {
    await assertFromJavascript(page, `const ROWS = () => document.querySelectorAll('table tbody tr').length;
const before = Number(sessionStorage.getItem('__dd132_rows') || '0');
if (!before) return false;
return ROWS() === before;`, 30000);
  });
  await run.step("CLEANUP: remove this test's scratch key", {always: true}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd132_rows');
return !sessionStorage.getItem('__dd132_rows');`, 30000);
  });
  run.finish();
}
