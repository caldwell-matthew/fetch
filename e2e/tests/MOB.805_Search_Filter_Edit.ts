// Generated from Mobile/dd_tests_mobile/MOB.805_Search_Filter_Edit.json by to_playwright.py — do not edit by hand yet.
// MOB.805_Search_Filter_Edit

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, wait } from '../support/dd';

export async function mob805(page: Page): Promise<void> {
  try {
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Let the page begin loading
    await wait(page, 3);
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
    await el(page, `//button[normalize-space(.)="Add Filter"]`).click({ timeout: 30000 });
    // Let the filter apply
    await wait(page, 3);
    // The filter is now an ACTIVE pill
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Drawer-content ")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Pill-label ")][contains(., "Pump 0102")]`, 30000);
    // BASELINE: not editing — `Add Filter` shown, no `Update Filter`/`Cancel edit`
    await assertFromJavascript(page, `const t = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return t.includes('Add Filter')
  && !t.includes('Update Filter')
  && !t.includes('Cancel edit');`, 30000);
    // BASELINE: the draft form was reset — `#value` is absent or empty
    await assertFromJavascript(page, `const v = document.getElementById('value');
return !v || (v.value || '') === '';`, 30000);
    // Click the pill's LABEL to edit it (never the remove button)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Drawer-content ")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Pill-label ")][contains(., "Pump 0102")]`).click({ timeout: 30000 });
    // Let the draft form rebind
    await wait(page, 2);
    // ⭐ EDIT MODE: `Update Filter` replaced `Add Filter`, and `Cancel edit` appeared
    await assertFromJavascript(page, `const t = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return t.includes('Update Filter')
  && !t.includes('Add Filter')
  && t.includes('Cancel edit');`, 30000);
    // ⭐ THE DRAFT REBOUND FROM THE FILTER — `#value` is now "Pump 0102"
    await assertFromJavascript(page, `const v = document.getElementById('value');
if (!v) return false;
return (v.value || '').trim() === 'Pump 0102';`, 30000);
    // Click "Cancel edit"
    await el(page, `//button[normalize-space(.)="Cancel edit"]`).click({ timeout: 30000 });
    // Let the form reset
    await wait(page, 2);
    // BACK OUT OF EDIT MODE: `Add Filter` returned, `Cancel edit` gone
    await assertFromJavascript(page, `const t = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return t.includes('Add Filter')
  && !t.includes('Update Filter')
  && !t.includes('Cancel edit');`, 30000);
    // 🛑 CANCEL PRESERVED THE FILTER — the pill is still there
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Drawer-content ")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Pill-label ")][contains(., "Pump 0102")]`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Restore: "Clear all"
    await el(page, `//button[normalize-space(.)="Clear all"]`).click({ timeout: 30000 });
    // Let the unfiltered re-query run
    await wait(page, 4);
    // RESTORED: no active filter pills remain
    await assertFromJavascript(page, `return document.querySelectorAll('.mantine-Pill-root').length === 0;`, 30000);
    // Close the Filters drawer
    await page.keyboard.press(`Escape`);
    // Let the drawer close
    await wait(page, 2);
  }
}
