// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.344_Work_List_Row_Navigate.json. This file is the source now: edit it directly.
// MOB.344_Work_List_Row_Navigate

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';

export async function mob344(page: Page): Promise<void> {
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
  await run.step("BASELINE: we are on the LIST, not a detail page", {}, async () => {
    await assertFromJavascript(page, `return /\\/work\\/?$/.test(location.pathname);`, 30000);
  });
  await run.step("Tap the first work order in the list", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 30000);
  });
  await run.step("Let the detail route mount", {}, async () => {
    await wait(page, 5);
  });
  await run.step("PROOF: the Work Orders detail page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("The detail view rendered its status control", {}, async () => {
    await assertPageContains(page, `Status:`, DEFAULT_TIMEOUT);
  });
  await run.step("PROOF: the URL gained a /work/<id> segment \u2014 a record really opened", {}, async () => {
    await assertFromJavascript(page, `return /\\/work\\/[^/]+$/.test(location.pathname);`, 30000);
  });
  await run.step("Go back to the list with the header back arrow", {always: true}, async () => {
    await click(page, `//*[@id="page-title"]//*[@data-icon="chevrons-left" or contains(concat(" ", normalize-space(@class), " "), " fa-chevrons-left ") or @data-icon="chevron-double-left" or contains(concat(" ", normalize-space(@class), " "), " fa-chevron-double-left ") or @data-icon="angles-left" or contains(concat(" ", normalize-space(@class), " "), " fa-angles-left ")]`, 30000);
  });
  await run.step("Let the list re-render", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("RESTORED: back on the work list", {always: true}, async () => {
    await assertFromJavascript(page, `return /\\/work\\/?$/.test(location.pathname);`, 30000);
  });
  run.finish();
}
