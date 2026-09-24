// Generated from legacy/Mobile/dd_tests_mobile/MOB.356_Work_Charge_Form_Validity.json by to_playwright.py — do not edit by hand yet.
// MOB.356_Work_Charge_Form_Validity

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, click, press, wait } from '../support/dd';

export async function mob356(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 warm the work lookup cache", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Let the lookup prefetch run", {}, async () => {
    await wait(page, 30);
  });
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("GATE: the work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 60000);
  });
  await run.step("Equipment: open the tab", {always: true}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Equipment")]`, 30000);
  });
  await run.step("Equipment: open the Add form", {always: true}, async () => {
    await click(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Equipment: GATE \u2014 poll until the form itself exists", {always: true}, async () => {
    await assertElementPresent(page, `//form[@id="work-collection-form"]`, 30000);
  });
  await run.step("Equipment: \u2b50 TRAP 8 \u2014 Submit is type=\"button\" (INERT) on the untouched form", {always: true}, async () => {
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
return b.getAttribute('type') === 'button';`, 30000);
  });
  await run.step("Equipment: the button is also DIMMED (opacity 0.5) \u2014 a second, independent read of the same `isValid` state", {always: true}, async () => {
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
const o = parseFloat(getComputedStyle(b).opacity);
return !isNaN(o) && o < 0.9;`, 30000);
  });
  await run.step("Equipment: close the form WITHOUT submitting", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Equipment: let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Equipment: the form was DISMISSED (page still alive \u2014 the no-submit proof is the trap-8 step above, not this one)", {always: true}, async () => {
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;  // alive
return !document.getElementById('work-collection-form');`, 30000);
  });
  await run.step("Labor: open the tab", {always: true}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Labor")]`, 30000);
  });
  await run.step("Labor: open the Add form", {always: true}, async () => {
    await click(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Labor: GATE \u2014 poll until the form itself exists", {always: true}, async () => {
    await assertElementPresent(page, `//form[@id="work-collection-form"]`, 30000);
  });
  await run.step("Labor: \u2b50 TRAP 8 \u2014 Submit is type=\"button\" (INERT) on the untouched form", {always: true}, async () => {
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
return b.getAttribute('type') === 'button';`, 30000);
  });
  await run.step("Labor: the button is also DIMMED (opacity 0.5) \u2014 a second, independent read of the same `isValid` state", {always: true}, async () => {
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
const o = parseFloat(getComputedStyle(b).opacity);
return !isNaN(o) && o < 0.9;`, 30000);
  });
  await run.step("Labor: close the form WITHOUT submitting", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Labor: let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Labor: the form was DISMISSED (page still alive \u2014 the no-submit proof is the trap-8 step above, not this one)", {always: true}, async () => {
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;  // alive
return !document.getElementById('work-collection-form');`, 30000);
  });
  await run.step("Material: open the tab", {always: true}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Material")]`, 30000);
  });
  await run.step("Material: open the Add form", {always: true}, async () => {
    await click(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Material: GATE \u2014 poll until the form itself exists", {always: true}, async () => {
    await assertElementPresent(page, `//form[@id="work-collection-form"]`, 30000);
  });
  await run.step("Material: \u2b50 TRAP 8 \u2014 Submit is type=\"button\" (INERT) on the untouched form", {always: true}, async () => {
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
return b.getAttribute('type') === 'button';`, 30000);
  });
  await run.step("Material: the button is also DIMMED (opacity 0.5) \u2014 a second, independent read of the same `isValid` state", {always: true}, async () => {
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
const o = parseFloat(getComputedStyle(b).opacity);
return !isNaN(o) && o < 0.9;`, 30000);
  });
  await run.step("Material: close the form WITHOUT submitting", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Material: let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Material: the form was DISMISSED (page still alive \u2014 the no-submit proof is the trap-8 step above, not this one)", {always: true}, async () => {
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;  // alive
return !document.getElementById('work-collection-form');`, 30000);
  });
  await run.step("Other: open the tab", {always: true}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Other")]`, 30000);
  });
  await run.step("Other: open the Add form", {always: true}, async () => {
    await click(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Other: GATE \u2014 poll until the form itself exists", {always: true}, async () => {
    await assertElementPresent(page, `//form[@id="work-collection-form"]`, 30000);
  });
  await run.step("Other: \u2b50 TRAP 8 \u2014 Submit is type=\"button\" (INERT) on the untouched form", {always: true}, async () => {
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
return b.getAttribute('type') === 'button';`, 30000);
  });
  await run.step("Other: the button is also DIMMED (opacity 0.5) \u2014 a second, independent read of the same `isValid` state", {always: true}, async () => {
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
const o = parseFloat(getComputedStyle(b).opacity);
return !isNaN(o) && o < 0.9;`, 30000);
  });
  await run.step("Other: close the form WITHOUT submitting", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Other: let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Other: the form was DISMISSED (page still alive \u2014 the no-submit proof is the trap-8 step above, not this one)", {always: true}, async () => {
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;  // alive
return !document.getElementById('work-collection-form');`, 30000);
  });
  run.finish();
}
