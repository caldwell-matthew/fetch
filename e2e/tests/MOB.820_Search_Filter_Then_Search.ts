// Generated from Mobile/dd_tests_mobile/MOB.820_Search_Filter_Then_Search.json by to_playwright.py — do not edit by hand yet.
// MOB.820_Search_Filter_Then_Search

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob820(page: Page): Promise<void> {
  try {
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Let the page begin loading
    await wait(page, 2);
    // Test the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Search for Pump 0102
    await el(page, `//input[@name="asset-search"]`).fill(`Pump 0102`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter - there is no search button)
    await page.keyboard.press(`Enter`);
    // Let the search start
    await wait(page, 2);
    // BASELINE: Pump 0102 is a result row when nothing is filtered
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Pump 0102")]`, 30000);
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
    // Pick "Name"
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
    // Pick "contains"
    await el(page, `//*[@role="option"][normalize-space(.)="contains"]`).click({ timeout: 30000 });
    // Enter the non-matching value ZZZZ-NO-SUCH-ASSET
    await el(page, `//*[@id="value"]`).fill(`ZZZZ-NO-SUCH-ASSET`, { timeout: DEFAULT_TIMEOUT });
    // Add the filter
    await el(page, `//button[normalize-space(.)="Add Filter"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the filter to apply
    await wait(page, 3);
    // Close the Filters drawer
    await page.keyboard.press(`Escape`);
    // Wait for the results to re-query
    await wait(page, 8);
    // The filter hides Pump 0102 (the filter is genuinely applied)
    await assertPageLacks(page, `Pump 0102`, DEFAULT_TIMEOUT);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Select the baseline search first (typeText APPENDS — trap 17; a local replay typed `Pump 0102Pump 0102`)
    await page.keyboard.press(`Control+a`);
    // Search for Pump 0102 with the filter still active
    await el(page, `//input[@name="asset-search"]`).fill(`Pump 0102`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search
    await page.keyboard.press(`Enter`);
    // Wait for BOTH racing requests to settle
    await wait(page, 10);
    // The filter still REPORTS as active
    await assertPageContains(page, `Filters (1)`, DEFAULT_TIMEOUT);
    // BUG 20 (pinned): the search DISCARDED the filter — Pump 0102 is back as a result row while the pill still says Filters (1). FIX THE APP AND THIS STEP FAILS.
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Pump 0102")]`, DEFAULT_TIMEOUT);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Reopen the Filters drawer to clear
    await el(page, `//button[contains(concat(" ", normalize-space(@class), " "), " asset-lookup-filter-button ")]`).click({ timeout: 30000 });
    // Wait for the drawer
    await wait(page, 2);
    // Clear all filters
    await el(page, `//button[normalize-space(.)="Clear all"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the clear to apply
    await wait(page, 3);
    // Close the Filters drawer
    await page.keyboard.press(`Escape`);
  }
}
