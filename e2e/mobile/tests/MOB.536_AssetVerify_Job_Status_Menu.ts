// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.536_AssetVerify_Job_Status_Menu.json. This file is the source now: edit it directly.
// MOB.536_AssetVerify_Job_Status_Menu

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, wait } from '../../support/dd';
import { waitForPrefetch } from '../support/prefetch';

export async function mob536(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await waitForPrefetch(page);
  });
  await run.step("Test the job list rendered", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the lookup prefetch finished (feeds schemaQuery)", {}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open \"DATADOG MOBILE JOB\" by clicking its row (not a deep link)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`, 30000);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("PREMISE: the job is not canceled (no alert) \u2014 at rest READY", {}, async () => {
    await assertFromJavascript(page, `const t = (document.body.textContent || '');
return !t.includes('This verification job has been canceled.');`, 30000);
  });
  await run.step("Open the job's status menu (the dot beside its title)", {}, async () => {
    await assertFromJavascript(page, `const title = [...document.querySelectorAll('[class*="mantine-Title-root"]')]
  .find(h => (h.textContent || '').includes('DATADOG MOBILE JOB'));
const row = title && title.closest('[class*="mantine-Flex-root"]');
const dot = row && row.querySelector('[class*="mantine-Indicator-root"]');
if (!dot) return false;
dot.click();
return true;`, 30000);
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("MENU: exactly READY's three exits \u2014 `Mark as IN PROGRESS`, `Mark as COMPLETED`, `Mark as CANCELED` (never the current status, and READY is never an item)", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()).filter(x => x.indexOf('Mark as') === 0);
const want = ['Mark as IN PROGRESS', 'Mark as COMPLETED', 'Mark as CANCELED'];
return items.length === want.length && want.every(w => items.includes(w));`, 20000);
  });
  await run.step("Mark as CANCELED", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Mark as CANCELED"])[1]`, 30000);
  });
  await run.step("Let the status change render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 CANCELED: `This verification job has been canceled.` is shown (`Job.tsx`)", {}, async () => {
    await assertFromJavascript(page, `const t = (document.body.textContent || '');
return t.includes('This verification job has been canceled.');`, 30000);
  });
  await run.step("Open the job's status menu (the dot beside its title)", {}, async () => {
    await assertFromJavascript(page, `const title = [...document.querySelectorAll('[class*="mantine-Title-root"]')]
  .find(h => (h.textContent || '').includes('DATADOG MOBILE JOB'));
const row = title && title.closest('[class*="mantine-Flex-root"]');
const dot = row && row.querySelector('[class*="mantine-Indicator-root"]');
if (!dot) return false;
dot.click();
return true;`, 30000);
  });
  await run.step("Mark as IN PROGRESS", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Mark as IN PROGRESS"])[1]`, 30000);
  });
  await run.step("Let the status change render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("BACK IN PROGRESS: the canceled alert is gone", {}, async () => {
    await assertFromJavascript(page, `const t = (document.body.textContent || '');
return !t.includes('This verification job has been canceled.');`, 30000);
  });
  await run.step("Open the job's status menu to read its exits", {}, async () => {
    await assertFromJavascript(page, `const title = [...document.querySelectorAll('[class*="mantine-Title-root"]')]
  .find(h => (h.textContent || '').includes('DATADOG MOBILE JOB'));
const row = title && title.closest('[class*="mantine-Flex-root"]');
const dot = row && row.querySelector('[class*="mantine-Indicator-root"]');
if (!dot) return false;
dot.click();
return true;`, 30000);
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("\u2b50 BACK IN PROGRESS (`Mark as COMPLETED` + `Mark as CANCELED`): the menu offers exactly IN PROGRESS's exits", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()).filter(x => x.indexOf('Mark as') === 0);
const want = ['Mark as COMPLETED', 'Mark as CANCELED'];
return items.length === want.length && want.every(w => items.includes(w));`, 20000);
  });
  await run.step("Close the menu (Escape \u2014 nothing picked)", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let it close", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("RESTORE: if the job still reads canceled, open its status menu", {always: true}, async () => {
    await assertFromJavascript(page, `const t = (document.body.textContent || '');
if (!t.includes('This verification job has been canceled.')) return true;
const title = [...document.querySelectorAll('[class*="mantine-Title-root"]')]
  .find(h => (h.textContent || '').includes('DATADOG MOBILE JOB'));
const row = title && title.closest('[class*="mantine-Flex-root"]');
const dot = row && row.querySelector('[class*="mantine-Indicator-root"]');
if (!dot) return false;
dot.click();
return true;`, 20000);
  });
  await run.step("RESTORE: \u2026and pick `Mark as IN PROGRESS` (only if the menu is open)", {always: true}, async () => {
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Menu-item')]
  .find(i => (i.textContent || '').trim() === 'Mark as IN PROGRESS');
if (it) it.click();
return true;`, 15000);
  });
  await run.step("Let the status reach the server", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("Put the asset filter on All (it persists across subtests)", {always: true}, async () => {
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')]
  .find(l => (l.textContent || '').trim() === 'All');
if (lbl) lbl.click();
return true;`, 20000);
  });
  await run.step("Let the list re-render", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("BACK TO READY: verify Tank 0000", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`, 30000);
  });
  await run.step("Wait for the verify mutation", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("BACK TO READY: unverify Tank 0000 \u2014 0 of 2 verified recomputes the job to READY", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`, 30000);
  });
  await run.step("Wait for the unverify mutation and the status it recomputes", {always: true}, async () => {
    await wait(page, 5);
  });
  await run.step("Navigate to the mobile job list", {always: true}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin rendering", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {always: true}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {always: true}, async () => {
    await wait(page, 25);
  });
  await run.step("Test the job list rendered", {always: true}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the lookup prefetch finished (feeds schemaQuery)", {always: true}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {always: true}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {always: true}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open \"DATADOG MOBILE JOB\" by clicking its row (not a deep link)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`, 30000);
  });
  await run.step("Wait for the job detail to render", {always: true}, async () => {
    await wait(page, 5);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {always: true}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("After a reload: the job is in the crew's list again, with no canceled alert", {always: true}, async () => {
    await assertFromJavascript(page, `const t = (document.body.textContent || '');
return t.includes('DATADOG MOBILE JOB') && !t.includes('This verification job has been canceled.');`, 30000);
  });
  await run.step("Open the job's status menu to read its exits", {always: true}, async () => {
    await assertFromJavascript(page, `const title = [...document.querySelectorAll('[class*="mantine-Title-root"]')]
  .find(h => (h.textContent || '').includes('DATADOG MOBILE JOB'));
const row = title && title.closest('[class*="mantine-Flex-root"]');
const dot = row && row.querySelector('[class*="mantine-Indicator-root"]');
if (!dot) return false;
dot.click();
return true;`, 30000);
  });
  await run.step("Let the menu open", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("\u2b50 SERVER (after a reload \u2014 UPDATE_MOBILE_JOB_STATUS is optimistic, so the reload is server-acknowledged, and READY means the recompute landed) (all three exits \u2014 the menu cannot offer the current status, and never offers READY): the menu offers exactly READY's exits", {always: true}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()).filter(x => x.indexOf('Mark as') === 0);
const want = ['Mark as IN PROGRESS', 'Mark as COMPLETED', 'Mark as CANCELED'];
return items.length === want.length && want.every(w => items.includes(w));`, 20000);
  });
  await run.step("Close the menu (Escape \u2014 nothing picked)", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let it close", {always: true}, async () => {
    await wait(page, 1);
  });
  run.finish();
}
