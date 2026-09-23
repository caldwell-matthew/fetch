// Generated from Mobile/dd_tests_mobile/MOB.342_Work_Status_Ring.json by to_playwright.py — do not edit by hand yet.
// MOB.342_Work_Status_Ring

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageLacks, click, wait } from '../support/dd';

export async function mob342(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Wait for the workstage pages and the lookup prefetch", {}, async () => {
    await wait(page, 20);
  });
  await run.step("The work list rendered its search box", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 1/3: the initial fetch finished", {}, async () => {
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 2/3: paging through workstages finished", {}, async () => {
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 3/3: the per-stage detail downloads finished", {}, async () => {
    await assertPageLacks(page, `workstages downloaded`, 360000);
  });
  await run.step("LOADEDALL: start the idle clock", {}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd_worklist_idle_since');
return true;`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL: no loading bar on screen for 10s straight (all six phases, and the gaps between them)", {}, async () => {
    await assertFromJavascript(page, `const K = '__dd_worklist_idle_since';
if (document.querySelector('.mantine-Progress-root')) {
  sessionStorage.removeItem(K);
  return false;
}
const since = Number(sessionStorage.getItem(K)) || 0;
if (!since) { sessionStorage.setItem(K, String(Date.now())); return false; }
return Date.now() - since >= 10000;`, 360000);
  });
  await run.step("WORK ROW GUARD: at least one work order rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 60000);
  });
  await run.step("The status ring rendered", {}, async () => {
    await assertElementPresent(page, `//*[contains(@class,"mantine-RingProgress-root")]`, 30000);
  });
  await run.step("The legend renders at least one `Status (n)` entry", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('li')]
  .map(e => (e.textContent || '').trim())
  .filter(t => /^[A-Za-z ]+\\(\\d+\\)$/.test(t));
return items.length > 0;`, 30000);
  });
  await run.step("A \"Ready (n)\" legend entry is present", {}, async () => {
    await assertElementPresent(page, `//li[contains(normalize-space(.), "Ready (")]`, 30000);
  });
  await run.step("BASELINE: rows are rendered", {}, async () => {
    await assertFromJavascript(page, `const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
return ROWS().length > 0;`, 30000);
  });
  await run.step("Select the Ready status in the legend", {}, async () => {
    await click(page, `//li[contains(normalize-space(.), "Ready (")]`, 30000);
  });
  await run.step("Let the list re-filter", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF: the Ready entry now renders as SELECTED (Highlight emits a <mark>)", {}, async () => {
    await assertFromJavascript(page, `return [...document.querySelectorAll('li mark')]
  .some(m => (m.textContent || '').includes('Ready'));`, 30000);
  });
  await run.step("PROOF: rows survive the Ready filter, and all are still Ready-green", {}, async () => {
    await assertFromJavascript(page, `const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
const rows = ROWS();
// Non-vacuous: a filter that emptied the list would pass an all-match test.
if (!rows.length) return false;
return rows.every(r => getComputedStyle(r).borderLeftColor === 'rgb(155, 203, 82)');`, 30000);
  });
  await run.step("Deselect Ready (the legend toggles)", {always: true}, async () => {
    await click(page, `//li[contains(normalize-space(.), "Ready (")]`, 30000);
  });
  await run.step("Let the list restore", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("RESTORED: nothing in the legend is marked selected", {always: true}, async () => {
    await assertFromJavascript(page, `return [...document.querySelectorAll('li mark')].length === 0;`, 30000);
  });
  await run.step("RESTORED: the unfiltered list is back", {always: true}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 60000);
  });
  run.finish();
}
