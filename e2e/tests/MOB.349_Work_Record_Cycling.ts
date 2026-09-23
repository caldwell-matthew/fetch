// Generated from Mobile/dd_tests_mobile/MOB.349_Work_Record_Cycling.json by to_playwright.py — do not edit by hand yet.
// MOB.349_Work_Record_Cycling

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, wait } from '../support/dd';

export async function mob349(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the work order list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("ROW GATE: at least one work order rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 120000);
  });
  await run.step("FIXTURE GUARD: the list holds at least TWO work orders (one cannot cycle)", {}, async () => {
    await assertFromJavascript(page, `const rows = [...document.querySelectorAll('.mantine-Paper-root')].filter(e => /Description:/.test(e.textContent||''));
return rows.length >= 2;`, 60000);
  });
  await run.step("Tap the first work order row", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 60000);
  });
  await run.step("Let the detail view render", {}, async () => {
    await wait(page, 4);
  });
  await run.step("The work order detail rendered (tab strip)", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
  });
  await run.step("We are on a /work/<id> route, not still on the list", {}, async () => {
    await assertFromJavascript(page, `return /\\/work\\/[^/]+$/.test(location.pathname);`, 30000);
  });
  await run.step("Remember which work order we started on", {}, async () => {
    await assertFromJavascript(page, `sessionStorage.setItem('dd_cycle_from', location.pathname);
return !!sessionStorage.getItem('dd_cycle_from');`, 30000);
  });
  await run.step("The BACK cycle arrow renders", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Group-root ")][.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]//button[.//*[@data-icon="circle-arrow-left" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-left ")]]`, 30000);
  });
  await run.step("The FORWARD cycle arrow renders", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Group-root ")][.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]//button[.//*[@data-icon="circle-arrow-right" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-right ")]]`, 30000);
  });
  await run.step("Cycle FORWARD to the next work order", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Group-root ")][.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]//button[.//*[@data-icon="circle-arrow-right" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-right ")]])[1]`, 30000);
  });
  await run.step("Let the next work order render", {}, async () => {
    await wait(page, 4);
  });
  await run.step("CYCLED: the route now points at a DIFFERENT work order", {}, async () => {
    await assertFromJavascript(page, `const from = sessionStorage.getItem('dd_cycle_from');
if (!from) return false;
return /\\/work\\/[^/]+$/.test(location.pathname) && location.pathname !== from;`, 60000);
  });
  await run.step("Cycle BACK again", {always: true}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Group-root ")][.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]//button[.//*[@data-icon="circle-arrow-left" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-left ")]])[1]`, 30000);
  });
  await run.step("Let the original work order render", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("RESTORED: the route points at the work order we started on", {always: true}, async () => {
    await assertFromJavascript(page, `const from = sessionStorage.getItem('dd_cycle_from');
if (!from) return false;
return location.pathname === from;`, 60000);
  });
  await run.step("Tidy up the stash", {always: true, allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('dd_cycle_from');
return true;`, 15000);
  });
  run.finish();
}
