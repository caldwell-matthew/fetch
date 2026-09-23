// Generated from Mobile/dd_tests_mobile/MOB.351_Work_Charge_Estimates.json by to_playwright.py — do not edit by hand yet.
// MOB.351_Work_Charge_Estimates

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, wait } from '../support/dd';

export async function mob351(page: Page): Promise<void> {
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
  await run.step("GATE: the detail data arrived (tab strip)", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
  });
  await run.step("Equipment: open the tab", {always: true}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Equipment")]`, 30000);
  });
  await run.step("Equipment: GATE \u2014 the CHARGES/ESTIMATES segmented control mounted", {always: true}, async () => {
    await assertElementPresent(page, `//label[normalize-space(.)="ESTIMATES"]`, 30000);
  });
  await run.step("Equipment: the control offers EXACTLY `CHARGES` and `ESTIMATES` \u2014 counted from the control's own radio group, so a third section cannot slip in unnoticed", {always: true}, async () => {
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const vals = group.map(i => i.value).sort();
return vals.length === 2 && vals[0] === 'CHARGES' && vals[1] === 'ESTIMATES';`, 30000);
  });
  await run.step("Equipment: on CHARGES the `Add` button is PRESENT \u2014 half of the biconditional", {always: true}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Equipment: switch to ESTIMATES", {always: true}, async () => {
    await click(page, `//label[normalize-space(.)="ESTIMATES"]`, 30000);
  });
  await run.step("Equipment: GATE \u2014 ESTIMATES is now the CHECKED option of the group", {always: true}, async () => {
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const on = group.find(i => i.checked);
return !!on && on.value === 'ESTIMATES';`, 30000);
  });
  await run.step("Equipment: \u2b50 on ESTIMATES the `Add` button is GONE \u2014 `{section === 'CHARGES' && InsertForm}` pinned in the other direction. Its positive control is the assertion two steps above, on the same button", {always: true}, async () => {
    await assertFromJavascript(page, `return ![...document.querySelectorAll('button')].some(b => (b.textContent || '').trim() === 'Add');`, 30000);
  });
  await run.step("\ud83d\udcca REPORT ONLY, never fails \u2014 Equipment: did the ESTIMATES panel render any cards? (green = yes, red = none present. Neither is a defect)", {always: true, allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const panel = document.querySelector('[role=tabpanel]:not([hidden])') || document.body;
const cards = [...panel.querySelectorAll('.mantine-Paper-root')];
return cards.length > 0;`, 15000);
  });
  await run.step("Equipment: switch back to CHARGES", {always: true}, async () => {
    await click(page, `//label[normalize-space(.)="CHARGES"]`, 30000);
  });
  await run.step("Equipment: RESTORED \u2014 `Add` is back, so the toggle is two-way and the tab is as it was found", {always: true}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Labor: open the tab", {always: true}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Labor")]`, 30000);
  });
  await run.step("Labor: GATE \u2014 the CHARGES/ESTIMATES segmented control mounted", {always: true}, async () => {
    await assertElementPresent(page, `//label[normalize-space(.)="ESTIMATES"]`, 30000);
  });
  await run.step("Labor: the control offers EXACTLY `CHARGES` and `ESTIMATES` \u2014 counted from the control's own radio group, so a third section cannot slip in unnoticed", {always: true}, async () => {
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const vals = group.map(i => i.value).sort();
return vals.length === 2 && vals[0] === 'CHARGES' && vals[1] === 'ESTIMATES';`, 30000);
  });
  await run.step("Labor: on CHARGES the `Add` button is PRESENT \u2014 half of the biconditional", {always: true}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Labor: switch to ESTIMATES", {always: true}, async () => {
    await click(page, `//label[normalize-space(.)="ESTIMATES"]`, 30000);
  });
  await run.step("Labor: GATE \u2014 ESTIMATES is now the CHECKED option of the group", {always: true}, async () => {
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const on = group.find(i => i.checked);
return !!on && on.value === 'ESTIMATES';`, 30000);
  });
  await run.step("Labor: \u2b50 on ESTIMATES the `Add` button is GONE \u2014 `{section === 'CHARGES' && InsertForm}` pinned in the other direction. Its positive control is the assertion two steps above, on the same button", {always: true}, async () => {
    await assertFromJavascript(page, `return ![...document.querySelectorAll('button')].some(b => (b.textContent || '').trim() === 'Add');`, 30000);
  });
  await run.step("\ud83d\udcca REPORT ONLY, never fails \u2014 Labor: did the ESTIMATES panel render any cards? (green = yes, red = none present. Neither is a defect)", {always: true, allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const panel = document.querySelector('[role=tabpanel]:not([hidden])') || document.body;
const cards = [...panel.querySelectorAll('.mantine-Paper-root')];
return cards.length > 0;`, 15000);
  });
  await run.step("Labor: switch back to CHARGES", {always: true}, async () => {
    await click(page, `//label[normalize-space(.)="CHARGES"]`, 30000);
  });
  await run.step("Labor: RESTORED \u2014 `Add` is back, so the toggle is two-way and the tab is as it was found", {always: true}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Material: open the tab", {always: true}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Material")]`, 30000);
  });
  await run.step("Material: GATE \u2014 the CHARGES/ESTIMATES segmented control mounted", {always: true}, async () => {
    await assertElementPresent(page, `//label[normalize-space(.)="ESTIMATES"]`, 30000);
  });
  await run.step("Material: the control offers EXACTLY `CHARGES` and `ESTIMATES` \u2014 counted from the control's own radio group, so a third section cannot slip in unnoticed", {always: true}, async () => {
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const vals = group.map(i => i.value).sort();
return vals.length === 2 && vals[0] === 'CHARGES' && vals[1] === 'ESTIMATES';`, 30000);
  });
  await run.step("Material: on CHARGES the `Add` button is PRESENT \u2014 half of the biconditional", {always: true}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Material: switch to ESTIMATES", {always: true}, async () => {
    await click(page, `//label[normalize-space(.)="ESTIMATES"]`, 30000);
  });
  await run.step("Material: GATE \u2014 ESTIMATES is now the CHECKED option of the group", {always: true}, async () => {
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const on = group.find(i => i.checked);
return !!on && on.value === 'ESTIMATES';`, 30000);
  });
  await run.step("Material: \u2b50 on ESTIMATES the `Add` button is GONE \u2014 `{section === 'CHARGES' && InsertForm}` pinned in the other direction. Its positive control is the assertion two steps above, on the same button", {always: true}, async () => {
    await assertFromJavascript(page, `return ![...document.querySelectorAll('button')].some(b => (b.textContent || '').trim() === 'Add');`, 30000);
  });
  await run.step("\ud83d\udcca REPORT ONLY, never fails \u2014 Material: did the ESTIMATES panel render any cards? (green = yes, red = none present. Neither is a defect)", {always: true, allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const panel = document.querySelector('[role=tabpanel]:not([hidden])') || document.body;
const cards = [...panel.querySelectorAll('.mantine-Paper-root')];
return cards.length > 0;`, 15000);
  });
  await run.step("Material: switch back to CHARGES", {always: true}, async () => {
    await click(page, `//label[normalize-space(.)="CHARGES"]`, 30000);
  });
  await run.step("Material: RESTORED \u2014 `Add` is back, so the toggle is two-way and the tab is as it was found", {always: true}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Other: open the tab", {always: true}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Other")]`, 30000);
  });
  await run.step("Other: GATE \u2014 the CHARGES/ESTIMATES segmented control mounted", {always: true}, async () => {
    await assertElementPresent(page, `//label[normalize-space(.)="ESTIMATES"]`, 30000);
  });
  await run.step("Other: the control offers EXACTLY `CHARGES` and `ESTIMATES` \u2014 counted from the control's own radio group, so a third section cannot slip in unnoticed", {always: true}, async () => {
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const vals = group.map(i => i.value).sort();
return vals.length === 2 && vals[0] === 'CHARGES' && vals[1] === 'ESTIMATES';`, 30000);
  });
  await run.step("Other: on CHARGES the `Add` button is PRESENT \u2014 half of the biconditional", {always: true}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Other: switch to ESTIMATES", {always: true}, async () => {
    await click(page, `//label[normalize-space(.)="ESTIMATES"]`, 30000);
  });
  await run.step("Other: GATE \u2014 ESTIMATES is now the CHECKED option of the group", {always: true}, async () => {
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')].find(e => (e.textContent || '').trim() === 'CHARGES');
if (!lbl) return false;
const anchor = document.getElementById(lbl.getAttribute('for') || '');
if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;
const group = [...document.querySelectorAll('input[type="radio"]')].filter(i => i.name === anchor.name);
const on = group.find(i => i.checked);
return !!on && on.value === 'ESTIMATES';`, 30000);
  });
  await run.step("Other: \u2b50 on ESTIMATES the `Add` button is GONE \u2014 `{section === 'CHARGES' && InsertForm}` pinned in the other direction. Its positive control is the assertion two steps above, on the same button", {always: true}, async () => {
    await assertFromJavascript(page, `return ![...document.querySelectorAll('button')].some(b => (b.textContent || '').trim() === 'Add');`, 30000);
  });
  await run.step("\ud83d\udcca REPORT ONLY, never fails \u2014 Other: did the ESTIMATES panel render any cards? (green = yes, red = none present. Neither is a defect)", {always: true, allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const panel = document.querySelector('[role=tabpanel]:not([hidden])') || document.body;
const cards = [...panel.querySelectorAll('.mantine-Paper-root')];
return cards.length > 0;`, 15000);
  });
  await run.step("Other: switch back to CHARGES", {always: true}, async () => {
    await click(page, `//label[normalize-space(.)="CHARGES"]`, 30000);
  });
  await run.step("Other: RESTORED \u2014 `Add` is back, so the toggle is two-way and the tab is as it was found", {always: true}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  run.finish();
}
