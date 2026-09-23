// Generated from Mobile/dd_tests_mobile/MOB.800_Search_StructuredQuery.json by to_playwright.py — do not edit by hand yet.
// MOB.800_Search_StructuredQuery

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../support/dd';

export async function mob800(page: Page): Promise<void> {
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
    await click(page, `//button[normalize-space(.)="Add Filter"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the filter to apply", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Close the Filters drawer", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the re-query start", {}, async () => {
    await wait(page, 2);
  });
  await run.step("PROOF: Pump 0102 is a RESULT ROW, not just a filter pill", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Pump 0102")]`, 30000);
  });
  await run.step("Reopen the Filters drawer", {}, async () => {
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
  await run.step("Clear the matching filter (Clear all is inside the drawer)", {}, async () => {
    await click(page, `//button[normalize-space(.)="Clear all"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the unfiltered re-query", {}, async () => {
    await wait(page, 4);
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
  await run.step("Enter a value that cannot match", {}, async () => {
    await typeText(page, `//*[@id="value"]`, `ZZZZ-NO-SUCH-ASSET`, DEFAULT_TIMEOUT);
  });
  await run.step("Add the non-matching filter", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add Filter"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the filter to apply", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Close the Filters drawer", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Wait for the results to re-query", {}, async () => {
    await wait(page, 6);
  });
  await run.step("PROOF: the non-matching filter hides Pump 0102", {}, async () => {
    await assertPageLacks(page, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Reopen the Filters drawer to clear", {}, async () => {
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
  await run.step("Clear all filters", {}, async () => {
    await click(page, `//button[normalize-space(.)="Clear all"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the clear", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Close the Filters drawer", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Wait for the unfiltered re-query", {}, async () => {
    await wait(page, 6);
  });
  await run.step("RESTORED: no filters remain", {}, async () => {
    await assertPageContains(page, `Filters (0)`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
