// Generated from Mobile/dd_tests_mobile/MOB.351_Work_Charge_Estimates.json by to_playwright.py — do not edit by hand yet.
// MOB.351_Work_Charge_Estimates

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, optional, wait } from '../support/dd';

export async function mob351(page: Page): Promise<void> {
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
    // GATE: the detail data arrived (tab strip)
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Equipment: open the tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Equipment")]`).click({ timeout: 30000 });
    // Equipment: GATE — the CHARGES/ESTIMATES segmented control mounted
    await assertElementPresent(page, `//label[normalize-space(.)="ESTIMATES"]`, 30000);
    // Equipment: the control offers EXACTLY `CHARGES` and `ESTIMATES` — counted from the control's own radio group, so a third section cannot slip in unnoticed
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const vals = group.map(i => i.value).sort();
return vals.length === 2 && vals[0] === 'CHARGES' && vals[1] === 'ESTIMATES';`, 30000);
    // Equipment: on CHARGES the `Add` button is PRESENT — half of the biconditional
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
    // Equipment: switch to ESTIMATES
    await el(page, `//label[normalize-space(.)="ESTIMATES"]`).click({ timeout: 30000 });
    // Equipment: GATE — ESTIMATES is now the CHECKED option of the group
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const on = group.find(i => i.checked);
return !!on && on.value === 'ESTIMATES';`, 30000);
    // Equipment: ⭐ on ESTIMATES the `Add` button is GONE — `{section === 'CHARGES' && InsertForm}` pinned in the other direction. Its positive control is the assertion two steps above, on the same button
    await assertFromJavascript(page, `return ![...document.querySelectorAll('button')].some(b => (b.textContent || '').trim() === 'Add');`, 30000);
    await optional("\ud83d\udcca REPORT ONLY, never fails \u2014 Equipment: did the ESTIMATES panel render any cards? (green = yes, red = none present. Neither is a defect)", async () => {
      await assertFromJavascript(page, `const panel = document.querySelector('[role=tabpanel]:not([hidden])') || document.body;
const cards = [...panel.querySelectorAll('.mantine-Paper-root')];
return cards.length > 0;`, 15000);
    });
    // Equipment: switch back to CHARGES
    await el(page, `//label[normalize-space(.)="CHARGES"]`).click({ timeout: 30000 });
    // Equipment: RESTORED — `Add` is back, so the toggle is two-way and the tab is as it was found
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
    // Labor: open the tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Labor")]`).click({ timeout: 30000 });
    // Labor: GATE — the CHARGES/ESTIMATES segmented control mounted
    await assertElementPresent(page, `//label[normalize-space(.)="ESTIMATES"]`, 30000);
    // Labor: the control offers EXACTLY `CHARGES` and `ESTIMATES` — counted from the control's own radio group, so a third section cannot slip in unnoticed
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const vals = group.map(i => i.value).sort();
return vals.length === 2 && vals[0] === 'CHARGES' && vals[1] === 'ESTIMATES';`, 30000);
    // Labor: on CHARGES the `Add` button is PRESENT — half of the biconditional
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
    // Labor: switch to ESTIMATES
    await el(page, `//label[normalize-space(.)="ESTIMATES"]`).click({ timeout: 30000 });
    // Labor: GATE — ESTIMATES is now the CHECKED option of the group
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const on = group.find(i => i.checked);
return !!on && on.value === 'ESTIMATES';`, 30000);
    // Labor: ⭐ on ESTIMATES the `Add` button is GONE — `{section === 'CHARGES' && InsertForm}` pinned in the other direction. Its positive control is the assertion two steps above, on the same button
    await assertFromJavascript(page, `return ![...document.querySelectorAll('button')].some(b => (b.textContent || '').trim() === 'Add');`, 30000);
    await optional("\ud83d\udcca REPORT ONLY, never fails \u2014 Labor: did the ESTIMATES panel render any cards? (green = yes, red = none present. Neither is a defect)", async () => {
      await assertFromJavascript(page, `const panel = document.querySelector('[role=tabpanel]:not([hidden])') || document.body;
const cards = [...panel.querySelectorAll('.mantine-Paper-root')];
return cards.length > 0;`, 15000);
    });
    // Labor: switch back to CHARGES
    await el(page, `//label[normalize-space(.)="CHARGES"]`).click({ timeout: 30000 });
    // Labor: RESTORED — `Add` is back, so the toggle is two-way and the tab is as it was found
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
    // Material: open the tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Material")]`).click({ timeout: 30000 });
    // Material: GATE — the CHARGES/ESTIMATES segmented control mounted
    await assertElementPresent(page, `//label[normalize-space(.)="ESTIMATES"]`, 30000);
    // Material: the control offers EXACTLY `CHARGES` and `ESTIMATES` — counted from the control's own radio group, so a third section cannot slip in unnoticed
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const vals = group.map(i => i.value).sort();
return vals.length === 2 && vals[0] === 'CHARGES' && vals[1] === 'ESTIMATES';`, 30000);
    // Material: on CHARGES the `Add` button is PRESENT — half of the biconditional
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
    // Material: switch to ESTIMATES
    await el(page, `//label[normalize-space(.)="ESTIMATES"]`).click({ timeout: 30000 });
    // Material: GATE — ESTIMATES is now the CHECKED option of the group
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const on = group.find(i => i.checked);
return !!on && on.value === 'ESTIMATES';`, 30000);
    // Material: ⭐ on ESTIMATES the `Add` button is GONE — `{section === 'CHARGES' && InsertForm}` pinned in the other direction. Its positive control is the assertion two steps above, on the same button
    await assertFromJavascript(page, `return ![...document.querySelectorAll('button')].some(b => (b.textContent || '').trim() === 'Add');`, 30000);
    await optional("\ud83d\udcca REPORT ONLY, never fails \u2014 Material: did the ESTIMATES panel render any cards? (green = yes, red = none present. Neither is a defect)", async () => {
      await assertFromJavascript(page, `const panel = document.querySelector('[role=tabpanel]:not([hidden])') || document.body;
const cards = [...panel.querySelectorAll('.mantine-Paper-root')];
return cards.length > 0;`, 15000);
    });
    // Material: switch back to CHARGES
    await el(page, `//label[normalize-space(.)="CHARGES"]`).click({ timeout: 30000 });
    // Material: RESTORED — `Add` is back, so the toggle is two-way and the tab is as it was found
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
    // Other: open the tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Other")]`).click({ timeout: 30000 });
    // Other: GATE — the CHARGES/ESTIMATES segmented control mounted
    await assertElementPresent(page, `//label[normalize-space(.)="ESTIMATES"]`, 30000);
    // Other: the control offers EXACTLY `CHARGES` and `ESTIMATES` — counted from the control's own radio group, so a third section cannot slip in unnoticed
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const vals = group.map(i => i.value).sort();
return vals.length === 2 && vals[0] === 'CHARGES' && vals[1] === 'ESTIMATES';`, 30000);
    // Other: on CHARGES the `Add` button is PRESENT — half of the biconditional
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
    // Other: switch to ESTIMATES
    await el(page, `//label[normalize-space(.)="ESTIMATES"]`).click({ timeout: 30000 });
    // Other: GATE — ESTIMATES is now the CHECKED option of the group
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const on = group.find(i => i.checked);
return !!on && on.value === 'ESTIMATES';`, 30000);
    // Other: ⭐ on ESTIMATES the `Add` button is GONE — `{section === 'CHARGES' && InsertForm}` pinned in the other direction. Its positive control is the assertion two steps above, on the same button
    await assertFromJavascript(page, `return ![...document.querySelectorAll('button')].some(b => (b.textContent || '').trim() === 'Add');`, 30000);
    await optional("\ud83d\udcca REPORT ONLY, never fails \u2014 Other: did the ESTIMATES panel render any cards? (green = yes, red = none present. Neither is a defect)", async () => {
      await assertFromJavascript(page, `const panel = document.querySelector('[role=tabpanel]:not([hidden])') || document.body;
const cards = [...panel.querySelectorAll('.mantine-Paper-root')];
return cards.length > 0;`, 15000);
    });
    // Other: switch back to CHARGES
    await el(page, `//label[normalize-space(.)="CHARGES"]`).click({ timeout: 30000 });
    // Other: RESTORED — `Add` is back, so the toggle is two-way and the tab is as it was found
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
  }
}
