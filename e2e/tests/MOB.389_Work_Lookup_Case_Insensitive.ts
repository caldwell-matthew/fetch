// Generated from Mobile/dd_tests_mobile/MOB.389_Work_Lookup_Case_Insensitive.json by to_playwright.py — do not edit by hand yet.
// MOB.389_Work_Lookup_Case_Insensitive

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../support/dd';

export async function mob389(page: Page): Promise<void> {
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
  await run.step("Open the Condition tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`, 30000);
  });
  await run.step("Open the add form", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Let the form load its schema", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The Condition form rendered (past `Loading form\u2026`)", {}, async () => {
    await assertElementPresent(page, `//form[@id="work-condition-form"]//*[@id="assetId"]`, 30000);
  });
  await run.step("Focus the asset lookup", {}, async () => {
    await click(page, `//form[@id="work-condition-form"]//*[@id="assetId"]`, 30000);
  });
  await run.step("Let the dropdown open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Type \"ZZZZ-NO-SUCH-ASSET\" into the asset lookup", {}, async () => {
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
if (!inp) return false;
const view = inp.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(inp, "ZZZZ-NO-SUCH-ASSET");
inp.dispatchEvent(new view.Event('input', { bubbles: true }));
return inp.value === "ZZZZ-NO-SUCH-ASSET";`, 30000);
  });
  await run.step("Let the lookup re-filter", {}, async () => {
    await wait(page, 2);
  });
  await run.step("CONDITION NO MATCH: the field's own dropdown lists nothing and says `No results found` \u2014 the filter really filters", {}, async () => {
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
const host = inp && inp.closest('[aria-controls]');
const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');
if (!lb) return false;
const titles = [...lb.querySelectorAll('[role="option"] .option-title')]
  .map(t => (t.textContent || '').trim());
return titles.length === 0 && (lb.textContent || '').includes('No results found');`, 30000);
  });
  await run.step("Type \"pUMP 0102\" (the fixture name, case-swapped) into the asset lookup", {}, async () => {
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
if (!inp) return false;
const view = inp.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(inp, "pUMP 0102");
inp.dispatchEvent(new view.Event('input', { bubbles: true }));
return inp.value === "pUMP 0102";`, 30000);
  });
  await run.step("Let the lookup re-filter", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 CONDITION WRONG CASE: `pUMP 0102` finds exactly `Pump 0102` \u2014 before `cad415620c` this was `No results found` (bugs \u00a71)", {}, async () => {
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
const host = inp && inp.closest('[aria-controls]');
const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');
if (!lb) return false;
const titles = [...lb.querySelectorAll('[role="option"] .option-title')]
  .map(t => (t.textContent || '').trim());
return inp.value === "pUMP 0102" && inp.value !== "Pump 0102"
  && titles.length === 1 && titles[0] === "Pump 0102";`, 30000);
  });
  await run.step("Close the add form with the modal's close button \u2014 nothing is submitted", {always: true}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('work-condition-form');
if (!f) return true;
const m = f.closest('[class*="mantine-Modal-content"]');
const x = m && m.querySelector('button[class*="mantine-Modal-close"]');
if (!x) return false;
x.click();
return true;`, 30000);
  });
  await run.step("Let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("CLOSED: the Condition form is unmounted", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.getElementById('work-condition-form');`, 30000);
  });
  await run.step("Open the Failure tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`, 30000);
  });
  await run.step("Open the add form", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Let the form load its schema", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The Failure form rendered (past `Loading form\u2026`)", {}, async () => {
    await assertElementPresent(page, `//form[@id="work-failure-form"]//*[@id="assetId"]`, 30000);
  });
  await run.step("Focus the asset lookup", {}, async () => {
    await click(page, `//form[@id="work-failure-form"]//*[@id="assetId"]`, 30000);
  });
  await run.step("Let the dropdown open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Type \"ZZZZ-NO-SUCH-ASSET\" into the asset lookup", {}, async () => {
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
if (!inp) return false;
const view = inp.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(inp, "ZZZZ-NO-SUCH-ASSET");
inp.dispatchEvent(new view.Event('input', { bubbles: true }));
return inp.value === "ZZZZ-NO-SUCH-ASSET";`, 30000);
  });
  await run.step("Let the lookup re-filter", {}, async () => {
    await wait(page, 2);
  });
  await run.step("FAILURE NO MATCH: the field's own dropdown lists nothing and says `No results found` \u2014 the filter really filters", {}, async () => {
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
const host = inp && inp.closest('[aria-controls]');
const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');
if (!lb) return false;
const titles = [...lb.querySelectorAll('[role="option"] .option-title')]
  .map(t => (t.textContent || '').trim());
return titles.length === 0 && (lb.textContent || '').includes('No results found');`, 30000);
  });
  await run.step("Type \"pUMP 0102\" (the fixture name, case-swapped) into the asset lookup", {}, async () => {
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
if (!inp) return false;
const view = inp.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(inp, "pUMP 0102");
inp.dispatchEvent(new view.Event('input', { bubbles: true }));
return inp.value === "pUMP 0102";`, 30000);
  });
  await run.step("Let the lookup re-filter", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 FAILURE WRONG CASE: `pUMP 0102` finds exactly `Pump 0102` \u2014 before `cad415620c` this was `No results found` (bugs \u00a71)", {}, async () => {
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
const host = inp && inp.closest('[aria-controls]');
const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');
if (!lb) return false;
const titles = [...lb.querySelectorAll('[role="option"] .option-title')]
  .map(t => (t.textContent || '').trim());
return inp.value === "pUMP 0102" && inp.value !== "Pump 0102"
  && titles.length === 1 && titles[0] === "Pump 0102";`, 30000);
  });
  await run.step("Close the add form with the modal's close button \u2014 nothing is submitted", {always: true}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('work-failure-form');
if (!f) return true;
const m = f.closest('[class*="mantine-Modal-content"]');
const x = m && m.querySelector('button[class*="mantine-Modal-close"]');
if (!x) return false;
x.click();
return true;`, 30000);
  });
  await run.step("Let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("CLOSED: the Failure form is unmounted", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.getElementById('work-failure-form');`, 30000);
  });
  run.finish();
}
