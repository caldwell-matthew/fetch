// Generated from Mobile/dd_tests_mobile/MOB.331_Work_GenInfo_Value_Modal.json by to_playwright.py — do not edit by hand yet.
// MOB.331_Work_GenInfo_Value_Modal

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../support/dd';

export async function mob331(page: Page): Promise<void> {
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
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the \"General Info\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][normalize-space(.)="General Info"]`, 30000);
  });
  await run.step("\"General Info\" is the active tab", {}, async () => {
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="General Info"][@data-active]`, 30000);
  });
  await run.step("PREMISE: the form shows Stage Notes (`#desc`) = `DATADOG FIXTURE` and an empty Problem Description (`#problemDesc`) \u2014 the two multiline fields", {}, async () => {
    await assertFromJavascript(page, `const d = document.getElementById('desc'), p = document.getElementById('problemDesc');
return !!document.getElementById('mobile-genInfo') && !!d && d.value === 'DATADOG FIXTURE' && !!p && !p.value;`, 45000);
  });
  await run.step("\u2b50 The value arrow renders beside Stage Notes (it holds a value) and NOT beside Problem Description (empty) \u2014 `MultiLineLabel` returns nothing for an empty value", {}, async () => {
    await assertFromJavascript(page, `const field = id => {
  const i = document.getElementById(id);
  return i && i.closest('.form-group');
};
const arrow = w => w && w.querySelector('svg[data-icon="square-arrow-up-right"]');
return !!arrow(field('desc')) && !!field('problemDesc') && !arrow(field('problemDesc'));`, 30000);
  });
  await run.step("Click Stage Notes' arrow \u2014 dispatched on the ICON, which carries the onClick (its ActionIcon's `aria-label` is `Settings` and does nothing)", {}, async () => {
    await assertFromJavascript(page, `const field = id => {
  const i = document.getElementById(id);
  return i && i.closest('.form-group');
};
const arrow = w => w && w.querySelector('svg[data-icon="square-arrow-up-right"]');
const a = arrow(field('desc'));
if (!a) return false;
a.dispatchEvent(new MouseEvent('click', { bubbles: true }));
return true;`, 20000);
  });
  await run.step("\u2b50 A modal opened showing the field's VALUE \u2014 exactly `DATADOG FIXTURE` (not its label `Stage Notes`)", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => ((x.querySelector('.mantine-Modal-body') || {}).textContent || '').trim() === 'DATADOG FIXTURE');
return !!m;`, 20000);
  });
  await run.step("Close it with its own close button", {always: true}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => ((x.querySelector('.mantine-Modal-body') || {}).textContent || '').trim() === 'DATADOG FIXTURE');
const c = m && m.querySelector('.mantine-Modal-close');
if (!c) return false;
c.click();
return true;`, 20000);
  });
  await run.step("The value modal is gone", {always: true}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => ((x.querySelector('.mantine-Modal-body') || {}).textContent || '').trim() === 'DATADOG FIXTURE');
return !m;`, 20000);
  });
  await run.step("RESTORED: the form is untouched \u2014 Stage Notes still `DATADOG FIXTURE`, nothing typed", {always: true}, async () => {
    await assertFromJavascript(page, `const d = document.getElementById('desc');
return !!d && d.value === 'DATADOG FIXTURE';`, 20000);
  });
  run.finish();
}
