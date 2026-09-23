// Generated from Mobile/dd_tests_mobile/MOB.805_Search_Filter_Edit.json by to_playwright.py — do not edit by hand yet.
// MOB.805_Search_Filter_Edit

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, press, typeText, wait } from '../support/dd';

export async function mob805(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to asset lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin loading", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Asset Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
  });
  await run.step("Open the Filters drawer", {}, async () => {
    await click(page, `//button[contains(concat(" ", normalize-space(@class), " "), " asset-lookup-filter-button ")]`, 30000);
  });
  await run.step("Wait for the drawer", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Test the Filters drawer opened (re-clicks Filters if the click was swallowed)", {}, async () => {
    await assertFromJavascript(page, `
const up = [...document.querySelectorAll('button')]
  .some(b => b.textContent.trim() === 'Add Filter');
if (up) return true;
const btn = document.querySelector('button.asset-lookup-filter-button');
if (btn) btn.click();
return false;
`, 30000);
  });
  await run.step("Open the Field select", {}, async () => {
    await click(page, `//*[@id="fieldId"]`, 30000);
  });
  await run.step("Wait for Field options", {}, async () => {
    await wait(page, 1);
  });
  await run.step("GATE: the Field option \"Name\" is VISIBLE (re-opens the select if the click was lost)", {}, async () => {
    await assertFromJavascript(page, `const want = "Name";
const vis = e => { if (!e || !e.isConnected) return false;
  const r = e.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return false;
  for (let n = e; n && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false; }
  return true; };
const opts = [...document.querySelectorAll('[role="option"]')]
  .filter(o => (o.textContent || '').replace(/\\s+/g, ' ').trim() === want);
const key = '__dd_pick_' + "fieldId" + '_' + want;
if (opts.some(vis)) { delete window[key]; return true; }
const now = Date.now();
// first poll only starts the clock - a dropdown still animating open must not be clicked shut
if (!window[key]) { window[key] = now; return false; }
if (now - window[key] > 2500) {
  window[key] = now;
  const input = document.getElementById("fieldId");
  if (input) input.click();
}
return false;`, 30000);
  });
  await run.step("Pick Field = \"Name\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Name"]`, 30000);
  });
  await run.step("Open the Operator select", {}, async () => {
    await click(page, `//*[@id="operator"]`, 30000);
  });
  await run.step("Wait for Operator options", {}, async () => {
    await wait(page, 1);
  });
  await run.step("GATE: the Operator option \"contains\" is VISIBLE (re-opens the select if the click was lost)", {}, async () => {
    await assertFromJavascript(page, `const want = "contains";
const vis = e => { if (!e || !e.isConnected) return false;
  const r = e.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return false;
  for (let n = e; n && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false; }
  return true; };
const opts = [...document.querySelectorAll('[role="option"]')]
  .filter(o => (o.textContent || '').replace(/\\s+/g, ' ').trim() === want);
const key = '__dd_pick_' + "operator" + '_' + want;
if (opts.some(vis)) { delete window[key]; return true; }
const now = Date.now();
// first poll only starts the clock - a dropdown still animating open must not be clicked shut
if (!window[key]) { window[key] = now; return false; }
if (now - window[key] > 2500) {
  window[key] = now;
  const input = document.getElementById("operator");
  if (input) input.click();
}
return false;`, 30000);
  });
  await run.step("Pick Operator = \"contains\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="contains"]`, 30000);
  });
  await run.step("Enter the value Pump 0102", {}, async () => {
    await typeText(page, `//*[@id="value"]`, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Add the filter", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add Filter"]`, 30000);
  });
  await run.step("Let the filter apply", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The filter is now an ACTIVE pill", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Drawer-content ")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Pill-label ")][contains(., "Pump 0102")]`, 30000);
  });
  await run.step("BASELINE: not editing \u2014 `Add Filter` shown, no `Update Filter`/`Cancel edit`", {}, async () => {
    await assertFromJavascript(page, `const t = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return t.includes('Add Filter')
  && !t.includes('Update Filter')
  && !t.includes('Cancel edit');`, 30000);
  });
  await run.step("BASELINE: the draft form was reset \u2014 `#value` is absent or empty", {}, async () => {
    await assertFromJavascript(page, `const v = document.getElementById('value');
return !v || (v.value || '') === '';`, 30000);
  });
  await run.step("Click the pill's LABEL to edit it (never the remove button)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Drawer-content ")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Pill-label ")][contains(., "Pump 0102")]`, 30000);
  });
  await run.step("Let the draft form rebind", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 EDIT MODE: `Update Filter` replaced `Add Filter`, and `Cancel edit` appeared", {}, async () => {
    await assertFromJavascript(page, `const t = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return t.includes('Update Filter')
  && !t.includes('Add Filter')
  && t.includes('Cancel edit');`, 30000);
  });
  await run.step("\u2b50 THE DRAFT REBOUND FROM THE FILTER \u2014 `#value` is now \"Pump 0102\"", {}, async () => {
    await assertFromJavascript(page, `const v = document.getElementById('value');
if (!v) return false;
return (v.value || '').trim() === 'Pump 0102';`, 30000);
  });
  await run.step("Click \"Cancel edit\"", {}, async () => {
    await click(page, `//button[normalize-space(.)="Cancel edit"]`, 30000);
  });
  await run.step("Let the form reset", {}, async () => {
    await wait(page, 2);
  });
  await run.step("BACK OUT OF EDIT MODE: `Add Filter` returned, `Cancel edit` gone", {}, async () => {
    await assertFromJavascript(page, `const t = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return t.includes('Add Filter')
  && !t.includes('Update Filter')
  && !t.includes('Cancel edit');`, 30000);
  });
  await run.step("\ud83d\uded1 CANCEL PRESERVED THE FILTER \u2014 the pill is still there", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Drawer-content ")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Pill-label ")][contains(., "Pump 0102")]`, 30000);
  });
  await run.step("Restore: \"Clear all\"", {always: true}, async () => {
    await click(page, `//button[normalize-space(.)="Clear all"]`, 30000);
  });
  await run.step("Let the unfiltered re-query run", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("RESTORED: no active filter pills remain", {always: true}, async () => {
    await assertFromJavascript(page, `return document.querySelectorAll('.mantine-Pill-root').length === 0;`, 30000);
  });
  await run.step("Close the Filters drawer", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the drawer close", {always: true}, async () => {
    await wait(page, 2);
  });
  run.finish();
}
