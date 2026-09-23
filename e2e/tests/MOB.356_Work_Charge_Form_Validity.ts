// Generated from Mobile/dd_tests_mobile/MOB.356_Work_Charge_Form_Validity.json by to_playwright.py — do not edit by hand yet.
// MOB.356_Work_Charge_Form_Validity

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, el, wait } from '../support/dd';

export async function mob356(page: Page): Promise<void> {
  try {
    // Navigate to /work — warm the work lookup cache
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Let the lookup prefetch run
    await wait(page, 30);
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 3);
    // GATE: the work order detail rendered
    await assertPageContains(page, `Status:`, 60000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Equipment: open the tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Equipment")]`).click({ timeout: 30000 });
    // Equipment: open the Add form
    await el(page, `//button[normalize-space(.)="Add"]`).click({ timeout: 30000 });
    // Equipment: GATE — poll until the form itself exists
    await assertElementPresent(page, `//form[@id="work-collection-form"]`, 30000);
    // Equipment: ⭐ TRAP 8 — Submit is type="button" (INERT) on the untouched form
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
return b.getAttribute('type') === 'button';`, 30000);
    // Equipment: the button is also DIMMED (opacity 0.5) — a second, independent read of the same `isValid` state
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
const o = parseFloat(getComputedStyle(b).opacity);
return !isNaN(o) && o < 0.9;`, 30000);
    // Equipment: close the form WITHOUT submitting
    await page.keyboard.press(`Escape`);
    // Equipment: let the modal close
    await wait(page, 2);
    // Equipment: the form was DISMISSED (page still alive — the no-submit proof is the trap-8 step above, not this one)
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;  // alive
return !document.getElementById('work-collection-form');`, 30000);
    // Labor: open the tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Labor")]`).click({ timeout: 30000 });
    // Labor: open the Add form
    await el(page, `//button[normalize-space(.)="Add"]`).click({ timeout: 30000 });
    // Labor: GATE — poll until the form itself exists
    await assertElementPresent(page, `//form[@id="work-collection-form"]`, 30000);
    // Labor: ⭐ TRAP 8 — Submit is type="button" (INERT) on the untouched form
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
return b.getAttribute('type') === 'button';`, 30000);
    // Labor: the button is also DIMMED (opacity 0.5) — a second, independent read of the same `isValid` state
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
const o = parseFloat(getComputedStyle(b).opacity);
return !isNaN(o) && o < 0.9;`, 30000);
    // Labor: close the form WITHOUT submitting
    await page.keyboard.press(`Escape`);
    // Labor: let the modal close
    await wait(page, 2);
    // Labor: the form was DISMISSED (page still alive — the no-submit proof is the trap-8 step above, not this one)
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;  // alive
return !document.getElementById('work-collection-form');`, 30000);
    // Material: open the tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Material")]`).click({ timeout: 30000 });
    // Material: open the Add form
    await el(page, `//button[normalize-space(.)="Add"]`).click({ timeout: 30000 });
    // Material: GATE — poll until the form itself exists
    await assertElementPresent(page, `//form[@id="work-collection-form"]`, 30000);
    // Material: ⭐ TRAP 8 — Submit is type="button" (INERT) on the untouched form
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
return b.getAttribute('type') === 'button';`, 30000);
    // Material: the button is also DIMMED (opacity 0.5) — a second, independent read of the same `isValid` state
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
const o = parseFloat(getComputedStyle(b).opacity);
return !isNaN(o) && o < 0.9;`, 30000);
    // Material: close the form WITHOUT submitting
    await page.keyboard.press(`Escape`);
    // Material: let the modal close
    await wait(page, 2);
    // Material: the form was DISMISSED (page still alive — the no-submit proof is the trap-8 step above, not this one)
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;  // alive
return !document.getElementById('work-collection-form');`, 30000);
    // Other: open the tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Other")]`).click({ timeout: 30000 });
    // Other: open the Add form
    await el(page, `//button[normalize-space(.)="Add"]`).click({ timeout: 30000 });
    // Other: GATE — poll until the form itself exists
    await assertElementPresent(page, `//form[@id="work-collection-form"]`, 30000);
    // Other: ⭐ TRAP 8 — Submit is type="button" (INERT) on the untouched form
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
return b.getAttribute('type') === 'button';`, 30000);
    // Other: the button is also DIMMED (opacity 0.5) — a second, independent read of the same `isValid` state
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('form') === 'work-collection-form');
if (!b) return false;
const o = parseFloat(getComputedStyle(b).opacity);
return !isNaN(o) && o < 0.9;`, 30000);
    // Other: close the form WITHOUT submitting
    await page.keyboard.press(`Escape`);
    // Other: let the modal close
    await wait(page, 2);
    // Other: the form was DISMISSED (page still alive — the no-submit proof is the trap-8 step above, not this one)
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;  // alive
return !document.getElementById('work-collection-form');`, 30000);
  }
}
