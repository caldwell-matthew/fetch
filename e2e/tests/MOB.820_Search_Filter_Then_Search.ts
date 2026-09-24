// Generated from legacy/Mobile/dd_tests_mobile/MOB.820_Search_Filter_Then_Search.json by to_playwright.py — do not edit by hand yet.
// MOB.820_Search_Filter_Then_Search

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../support/dd';

export async function mob820(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to asset lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin loading", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test the \"Asset Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Search for Pump 0102", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter - there is no search button)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Let the search start", {}, async () => {
    await wait(page, 2);
  });
  await run.step("BASELINE: Pump 0102 is a result row when nothing is filtered", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Pump 0102")]`, 30000);
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
  await run.step("Pick \"Name\"", {}, async () => {
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
  await run.step("Pick \"contains\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="contains"]`, 30000);
  });
  await run.step("Enter the non-matching value ZZZZ-NO-SUCH-ASSET", {}, async () => {
    await typeText(page, `//*[@id="value"]`, `ZZZZ-NO-SUCH-ASSET`, DEFAULT_TIMEOUT);
  });
  await run.step("Add the filter", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add Filter"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the filter to apply", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Close the Filters drawer", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Wait for the results to re-query", {}, async () => {
    await wait(page, 8);
  });
  await run.step("The filter hides Pump 0102 (the filter is genuinely applied)", {}, async () => {
    await assertPageLacks(page, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Select the baseline search first (typeText APPENDS \u2014 trap 17; a local replay typed `Pump 0102Pump 0102`)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for Pump 0102 with the filter still active", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Wait for BOTH racing requests to settle", {}, async () => {
    await wait(page, 10);
  });
  await run.step("The filter still REPORTS as active", {}, async () => {
    await assertPageContains(page, `Filters (1)`, DEFAULT_TIMEOUT);
  });
  await run.step("The filter SURVIVED the search \u2014 no result row for Pump 0102 while the pill says Filters (1)", {}, async () => {
    await assertFromJavascript(page, `const rows = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')];
return !rows.some(r => (r.textContent || '').includes('Pump 0102'));`, 30000);
  });
  await run.step("Reopen the Filters drawer to clear", {always: true}, async () => {
    await click(page, `//button[contains(concat(" ", normalize-space(@class), " "), " asset-lookup-filter-button ")]`, 30000);
  });
  await run.step("Wait for the drawer", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Clear all filters", {always: true}, async () => {
    await click(page, `//button[normalize-space(.)="Clear all"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the clear to apply", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("Close the Filters drawer", {always: true}, async () => {
    await press(page, `Escape`);
  });
  run.finish();
}
