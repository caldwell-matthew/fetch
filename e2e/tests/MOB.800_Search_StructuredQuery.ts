// Generated from Mobile/dd_tests_mobile/MOB.800_Search_StructuredQuery.json by to_playwright.py — do not edit by hand yet.
// MOB.800_Search_StructuredQuery

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob800(page: Page): Promise<void> {
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Let the page begin loading
    await wait(page, 2);
    // Test the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
    // Open the Filters drawer
    await el(page, `//button[contains(concat(" ", normalize-space(@class), " "), " asset-lookup-filter-button ")]`).click({ timeout: 30000 });
    // Wait for the drawer
    await wait(page, 1);
    // Test the Filters drawer opened (re-clicks Filters if the click was swallowed)
    await assertFromJavascript(page, `
const up = [...document.querySelectorAll('button')]
  .some(b => b.textContent.trim() === 'Add Filter');
if (up) return true;
const btn = document.querySelector('button.asset-lookup-filter-button');
if (btn) btn.click();
return false;
`, 30000);
    // Open the Field select
    await el(page, `//*[@id="fieldId"]`).click({ timeout: 30000 });
    // Wait for Field options
    await wait(page, 1);
    // GATE: the Field option "Name" is VISIBLE (re-opens the select if the click was lost)
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
    // Pick Field = "Name"
    await el(page, `//*[@role="option"][normalize-space(.)="Name"]`).click({ timeout: 30000 });
    // Open the Operator select
    await el(page, `//*[@id="operator"]`).click({ timeout: 30000 });
    // Wait for Operator options
    await wait(page, 1);
    // GATE: the Operator option "contains" is VISIBLE (re-opens the select if the click was lost)
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
    // Pick Operator = "contains"
    await el(page, `//*[@role="option"][normalize-space(.)="contains"]`).click({ timeout: 30000 });
    // Enter the value Pump 0102
    await el(page, `//*[@id="value"]`).fill(`Pump 0102`, { timeout: DEFAULT_TIMEOUT });
    // Add the filter
    await el(page, `//button[normalize-space(.)="Add Filter"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the filter to apply
    await wait(page, 3);
    // Close the Filters drawer
    await page.keyboard.press(`Escape`);
    // Let the re-query start
    await wait(page, 2);
    // PROOF: Pump 0102 is a RESULT ROW, not just a filter pill
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Pump 0102")]`, 30000);
    // Reopen the Filters drawer
    await el(page, `//button[contains(concat(" ", normalize-space(@class), " "), " asset-lookup-filter-button ")]`).click({ timeout: 30000 });
    // Wait for the drawer
    await wait(page, 1);
    // Test the Filters drawer opened (re-clicks Filters if the click was swallowed)
    await assertFromJavascript(page, `
const up = [...document.querySelectorAll('button')]
  .some(b => b.textContent.trim() === 'Add Filter');
if (up) return true;
const btn = document.querySelector('button.asset-lookup-filter-button');
if (btn) btn.click();
return false;
`, 30000);
    // Clear the matching filter (Clear all is inside the drawer)
    await el(page, `//button[normalize-space(.)="Clear all"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the unfiltered re-query
    await wait(page, 4);
    // Open the Field select
    await el(page, `//*[@id="fieldId"]`).click({ timeout: 30000 });
    // Wait for Field options
    await wait(page, 1);
    // GATE: the Field option "Name" is VISIBLE (re-opens the select if the click was lost)
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
    // Pick Field = "Name"
    await el(page, `//*[@role="option"][normalize-space(.)="Name"]`).click({ timeout: 30000 });
    // Open the Operator select
    await el(page, `//*[@id="operator"]`).click({ timeout: 30000 });
    // Wait for Operator options
    await wait(page, 1);
    // GATE: the Operator option "contains" is VISIBLE (re-opens the select if the click was lost)
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
    // Pick Operator = "contains"
    await el(page, `//*[@role="option"][normalize-space(.)="contains"]`).click({ timeout: 30000 });
    // Enter a value that cannot match
    await el(page, `//*[@id="value"]`).fill(`ZZZZ-NO-SUCH-ASSET`, { timeout: DEFAULT_TIMEOUT });
    // Add the non-matching filter
    await el(page, `//button[normalize-space(.)="Add Filter"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the filter to apply
    await wait(page, 3);
    // Close the Filters drawer
    await page.keyboard.press(`Escape`);
    // Wait for the results to re-query
    await wait(page, 6);
    // PROOF: the non-matching filter hides Pump 0102
    await assertPageLacks(page, `Pump 0102`, DEFAULT_TIMEOUT);
    // Reopen the Filters drawer to clear
    await el(page, `//button[contains(concat(" ", normalize-space(@class), " "), " asset-lookup-filter-button ")]`).click({ timeout: 30000 });
    // Wait for the drawer
    await wait(page, 1);
    // Test the Filters drawer opened (re-clicks Filters if the click was swallowed)
    await assertFromJavascript(page, `
const up = [...document.querySelectorAll('button')]
  .some(b => b.textContent.trim() === 'Add Filter');
if (up) return true;
const btn = document.querySelector('button.asset-lookup-filter-button');
if (btn) btn.click();
return false;
`, 30000);
    // Clear all filters
    await el(page, `//button[normalize-space(.)="Clear all"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the clear
    await wait(page, 2);
    // Close the Filters drawer
    await page.keyboard.press(`Escape`);
    // Wait for the unfiltered re-query
    await wait(page, 6);
    // RESTORED: no filters remain
    await assertPageContains(page, `Filters (0)`, DEFAULT_TIMEOUT);
}
