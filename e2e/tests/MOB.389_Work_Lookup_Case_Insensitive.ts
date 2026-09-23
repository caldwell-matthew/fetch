// Generated from Mobile/dd_tests_mobile/MOB.389_Work_Lookup_Case_Insensitive.json by to_playwright.py — do not edit by hand yet.
// MOB.389_Work_Lookup_Case_Insensitive

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob389(page: Page): Promise<void> {
  try {
    // Navigate to /work — the work order list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Wait for the workstage pages and the lookup prefetch
    await wait(page, 20);
    // The work list rendered its search box
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
    // LOADEDALL 1/3: the initial fetch finished
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
    // LOADEDALL 2/3: paging through workstages finished
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
    // LOADEDALL 3/3: the per-stage detail downloads finished
    await assertPageLacks(page, `workstages downloaded`, 180000);
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the Condition tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`).click({ timeout: 30000 });
    // Open the add form
    await el(page, `//button[normalize-space(.)="Add"]`).click({ timeout: 30000 });
    // Let the form load its schema
    await wait(page, 2);
    // The Condition form rendered (past `Loading form…`)
    await assertElementPresent(page, `//form[@id="work-condition-form"]//*[@id="assetId"]`, 30000);
    // Focus the asset lookup
    await el(page, `//form[@id="work-condition-form"]//*[@id="assetId"]`).click({ timeout: 30000 });
    // Let the dropdown open
    await wait(page, 1);
    // Type "ZZZZ-NO-SUCH-ASSET" into the asset lookup
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
if (!inp) return false;
const view = inp.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(inp, "ZZZZ-NO-SUCH-ASSET");
inp.dispatchEvent(new view.Event('input', { bubbles: true }));
return inp.value === "ZZZZ-NO-SUCH-ASSET";`, 30000);
    // Let the lookup re-filter
    await wait(page, 2);
    // CONDITION NO MATCH: the field's own dropdown lists nothing and says `No results found` — the filter really filters
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
const host = inp && inp.closest('[aria-controls]');
const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');
if (!lb) return false;
const titles = [...lb.querySelectorAll('[role="option"] .option-title')]
  .map(t => (t.textContent || '').trim());
return titles.length === 0 && (lb.textContent || '').includes('No results found');`, 30000);
    // Type "pUMP 0102" (the fixture name, case-swapped) into the asset lookup
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
if (!inp) return false;
const view = inp.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(inp, "pUMP 0102");
inp.dispatchEvent(new view.Event('input', { bubbles: true }));
return inp.value === "pUMP 0102";`, 30000);
    // Let the lookup re-filter
    await wait(page, 2);
    // ⭐ CONDITION WRONG CASE: `pUMP 0102` finds exactly `Pump 0102` — before `cad415620c` this was `No results found` (bugs §1)
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
const host = inp && inp.closest('[aria-controls]');
const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');
if (!lb) return false;
const titles = [...lb.querySelectorAll('[role="option"] .option-title')]
  .map(t => (t.textContent || '').trim());
return inp.value === "pUMP 0102" && inp.value !== "Pump 0102"
  && titles.length === 1 && titles[0] === "Pump 0102";`, 30000);
    // Open the Failure tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`).click({ timeout: 30000 });
    // Open the add form
    await el(page, `//button[normalize-space(.)="Add"]`).click({ timeout: 30000 });
    // Let the form load its schema
    await wait(page, 2);
    // The Failure form rendered (past `Loading form…`)
    await assertElementPresent(page, `//form[@id="work-failure-form"]//*[@id="assetId"]`, 30000);
    // Focus the asset lookup
    await el(page, `//form[@id="work-failure-form"]//*[@id="assetId"]`).click({ timeout: 30000 });
    // Let the dropdown open
    await wait(page, 1);
    // Type "ZZZZ-NO-SUCH-ASSET" into the asset lookup
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
if (!inp) return false;
const view = inp.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(inp, "ZZZZ-NO-SUCH-ASSET");
inp.dispatchEvent(new view.Event('input', { bubbles: true }));
return inp.value === "ZZZZ-NO-SUCH-ASSET";`, 30000);
    // Let the lookup re-filter
    await wait(page, 2);
    // FAILURE NO MATCH: the field's own dropdown lists nothing and says `No results found` — the filter really filters
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
const host = inp && inp.closest('[aria-controls]');
const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');
if (!lb) return false;
const titles = [...lb.querySelectorAll('[role="option"] .option-title')]
  .map(t => (t.textContent || '').trim());
return titles.length === 0 && (lb.textContent || '').includes('No results found');`, 30000);
    // Type "pUMP 0102" (the fixture name, case-swapped) into the asset lookup
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
if (!inp) return false;
const view = inp.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(inp, "pUMP 0102");
inp.dispatchEvent(new view.Event('input', { bubbles: true }));
return inp.value === "pUMP 0102";`, 30000);
    // Let the lookup re-filter
    await wait(page, 2);
    // ⭐ FAILURE WRONG CASE: `pUMP 0102` finds exactly `Pump 0102` — before `cad415620c` this was `No results found` (bugs §1)
    await assertFromJavascript(page, `const el0 = document.getElementById('assetId');
const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));
const host = inp && inp.closest('[aria-controls]');
const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');
if (!lb) return false;
const titles = [...lb.querySelectorAll('[role="option"] .option-title')]
  .map(t => (t.textContent || '').trim());
return inp.value === "pUMP 0102" && inp.value !== "Pump 0102"
  && titles.length === 1 && titles[0] === "Pump 0102";`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Close the add form with the modal's close button — nothing is submitted
    await assertFromJavascript(page, `const f = document.getElementById('work-condition-form');
const m = f && f.closest('[class*="mantine-Modal-content"]');
const x = m && m.querySelector('button[class*="mantine-Modal-close"]');
if (!x) return false;
x.click();
return true;`, 30000);
    // Let the modal close
    await wait(page, 2);
    // CLOSED: the Condition form is unmounted
    await assertFromJavascript(page, `return !document.getElementById('work-condition-form');`, 30000);
    // Close the add form with the modal's close button — nothing is submitted
    await assertFromJavascript(page, `const f = document.getElementById('work-failure-form');
const m = f && f.closest('[class*="mantine-Modal-content"]');
const x = m && m.querySelector('button[class*="mantine-Modal-close"]');
if (!x) return false;
x.click();
return true;`, 30000);
    // Let the modal close
    await wait(page, 2);
    // CLOSED: the Failure form is unmounted
    await assertFromJavascript(page, `return !document.getElementById('work-failure-form');`, 30000);
  }
}
