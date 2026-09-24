// Generated from legacy/Mobile/dd_tests_mobile/MOB.393_Work_Add_Form.json by to_playwright.py — do not edit by hand yet.
// MOB.393_Work_Add_Form

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, wait } from '../support/dd';

export async function mob393(page: Page): Promise<void> {
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
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the Forms tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Form")]`, 30000);
  });
  await run.step("Open the add form", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Wait for the modal", {}, async () => {
    await wait(page, 2);
  });
  await run.step("PROOF: the form picker rendered", {}, async () => {
    await assertElementPresent(page, `//*[@id="formId"]`, 30000);
  });
  await run.step("Open the picker", {}, async () => {
    await click(page, `//*[@id="formId"]`, 30000);
  });
  await run.step("Wait for options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("PROOF: the picker offers at least one form", {}, async () => {
    await assertElementPresent(page, `(//*[@role="option"])[1]`, 30000);
  });
  await run.step("Cancel without adding", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Close the add modal", {always: true}, async () => {
    await press(page, `Escape`);
  });
  run.finish();
}
