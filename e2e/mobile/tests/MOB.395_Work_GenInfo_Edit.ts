// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.395_Work_GenInfo_Edit.json. This file is the source now: edit it directly.
// MOB.395_Work_GenInfo_Edit

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../../support/dd';
import { runId } from '../../support/env';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';

export async function mob395(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Wait for the workstage pages and the lookup prefetch", {}, async () => {
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
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
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the General Info tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "General Info")]`, DEFAULT_TIMEOUT);
  });
  await run.step("FIELD GUARD: the Description input is on this tab", {}, async () => {
    await assertElementPresent(page, `//*[@id="desc"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the Description field", {}, async () => {
    await click(page, `//*[@id="desc"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Select the existing text (typeText APPENDS without this)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type the Description value", {}, async () => {
    await typeText(page, `//*[@id="desc"]`, `DD SYNTHETIC EDIT ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the General Info form", {}, async () => {
    await click(page, `//button[@form="mobile-genInfo"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Brief wait for the toast to appear", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Record Updated toast (optional: fires optimistically)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Record Updated`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the update mutation to reach the server", {}, async () => {
    await wait(page, 5);
  });
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Wait for the workstage pages and the lookup prefetch", {}, async () => {
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
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
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the General Info tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "General Info")]`, DEFAULT_TIMEOUT);
  });
  await run.step("FIELD GUARD: the Description input is on this tab", {}, async () => {
    await assertElementPresent(page, `//*[@id="desc"]`, DEFAULT_TIMEOUT);
  });
  await run.step("PROOF: after a reload the description is no longer the baseline", {}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('#desc');
if (!el) return false;
return el.value.trim() !== 'DATADOG FIXTURE';`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the Description field", {}, async () => {
    await click(page, `//*[@id="desc"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Select the existing text (typeText APPENDS without this)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type the Description value", {}, async () => {
    await typeText(page, `//*[@id="desc"]`, `DATADOG FIXTURE`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the restore", {}, async () => {
    await click(page, `//button[@form="mobile-genInfo"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the restore mutation", {}, async () => {
    await wait(page, 6);
  });
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Wait for the workstage pages and the lookup prefetch", {}, async () => {
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
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
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the General Info tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "General Info")]`, DEFAULT_TIMEOUT);
  });
  await run.step("FIELD GUARD: the Description input is on this tab", {}, async () => {
    await assertElementPresent(page, `//*[@id="desc"]`, DEFAULT_TIMEOUT);
  });
  await run.step("RESTORED: the description is exactly \"DATADOG FIXTURE\" again", {}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('#desc');
if (!el) return false;
return el.value.trim() === 'DATADOG FIXTURE';`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
