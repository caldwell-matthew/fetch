// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.343_Work_List_Search_Filter.json. This file is the source now: edit it directly.
// MOB.343_Work_List_Search_Filter

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageLacks, click, press, typeText, wait } from '../../support/dd';

export async function mob343(page: Page): Promise<void> {
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
  await run.step("BASELINE: the unfiltered list has at least one row", {}, async () => {
    await assertFromJavascript(page, `const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
return ROWS().length >= 1;`, 30000);
  });
  await run.step("Focus the search box", {}, async () => {
    await click(page, `//input[@placeholder="Find Workstage(s)"]`, 30000);
  });
  await run.step("Select any existing text (typeText APPENDS without this)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type a term nothing can match (\"ZZQXJV0000\")", {}, async () => {
    await typeText(page, `//input[@placeholder="Find Workstage(s)"]`, `ZZQXJV0000`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait past the 300ms search debounce", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF: the list filtered to ZERO rows \u2014 the search really filters", {}, async () => {
    await assertFromJavascript(page, `const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
return ROWS().length === 0;`, 30000);
  });
  await run.step("Focus the search box again", {always: true}, async () => {
    await click(page, `//input[@placeholder="Find Workstage(s)"]`, 30000);
  });
  await run.step("Select the nonsense term", {always: true}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Delete it \u2014 restore the unfiltered list", {always: true}, async () => {
    await press(page, `Delete`);
  });
  await run.step("Wait past the debounce again", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("RESTORED: the rows are back \u2014 so there WERE rows to filter", {always: true}, async () => {
    await assertFromJavascript(page, `const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
return ROWS().length >= 1;`, 30000);
  });
  run.finish();
}
