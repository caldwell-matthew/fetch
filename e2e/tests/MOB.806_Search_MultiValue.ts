// Generated from Mobile/dd_tests_mobile/MOB.806_Search_MultiValue.json by to_playwright.py — do not edit by hand yet.
// MOB.806_Search_MultiValue

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, wait } from '../support/dd';

export async function mob806(page: Page): Promise<void> {
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
    // Pick Operator = "contains" (the SINGLE-value branch)
    await el(page, `//*[@role="option"][normalize-space(.)="contains"]`).click({ timeout: 30000 });
    // Let the value input render
    await wait(page, 2);
    // BASELINE: the single-value `#value` input is what renders for `contains`
    await assertFromJavascript(page, `const v = document.getElementById('value');
const tags = document.querySelector('input[placeholder="Type and press Enter..."]');
return !!v && !tags;`, 30000);
    // Open the Operator select again
    await el(page, `//*[@id="operator"]`).click({ timeout: 30000 });
    // Wait for Operator options
    await wait(page, 1);
    // GATE: the Operator option "includes" is VISIBLE (re-opens the select if the click was lost)
    await assertFromJavascript(page, `const want = "includes";
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
    // Pick Operator = "includes" (the MULTI-value branch)
    await el(page, `//*[@role="option"][normalize-space(.)="includes"]`).click({ timeout: 30000 });
    // Let the value input swap
    await wait(page, 2);
    // The `TagsInput` rendered
    await assertElementPresent(page, `//input[@placeholder="Type and press Enter..."]`, 30000);
    // ⭐ IT IS A SWAP: the single-value `#value` input is GONE
    await assertFromJavascript(page, `const v = document.getElementById('value');
const tags = document.querySelector('input[placeholder="Type and press Enter..."]');
return !!tags && !v;`, 30000);
    // ⭐ VALIDITY 1/2: with NO tags, `Add Filter` is INERT (type=button)
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').trim() === 'Add Filter');
if (!b) return false;
return b.type === 'button';`, 30000);
    // Focus the tags input
    await el(page, `//input[@placeholder="Type and press Enter..."]`).click({ timeout: 30000 });
    // Type "Pump"
    await el(page, `//input[@placeholder="Type and press Enter..."]`).fill(`Pump`, { timeout: DEFAULT_TIMEOUT });
    // Press Enter to commit the tag
    await page.keyboard.press(`Enter`);
    // Let the draft revalidate
    await wait(page, 2);
    // The tag "Pump" was committed as a pill
    await assertFromJavascript(page, `const d = document.querySelector('.mantine-Drawer-content') || document;
return [...d.querySelectorAll('.mantine-Pill-label')].some(p => (p.textContent || '').trim() === 'Pump');`, 30000);
    // ⭐ VALIDITY 2/2: with one tag, `Add Filter` is LIVE (type=submit)
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').trim() === 'Add Filter');
if (!b) return false;
return b.type === 'submit';`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Escape — close WITHOUT adding the filter
    await page.keyboard.press(`Escape`);
    // Let the drawer close
    await wait(page, 2);
    // RESTORED: no filter was added — the trigger still reads `Filters (0)`
    await assertFromJavascript(page, `const b = document.querySelector('.asset-lookup-filter-button');
if (!b) return false;
return /Filters\\s*\\(0\\)/.test(b.textContent || '');`, 30000);
  }
}
