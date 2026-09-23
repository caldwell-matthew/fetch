// Generated from Mobile/dd_tests_mobile/MOB.807_Search_MultiValue_Enum_Record.json by to_playwright.py — do not edit by hand yet.
// MOB.807_Search_MultiValue_Enum_Record

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertFromJavascript, el, optional, wait } from '../support/dd';

export async function mob807(page: Page): Promise<void> {
  try {
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Let the page begin loading
    await wait(page, 3);
    // Test the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
    // Let the asset list render
    await wait(page, 3);
    // CAPTURE: the unfiltered list's first rendered rows
    await assertFromJavascript(page, `const win = [...document.querySelectorAll('[class*="mantine-Accordion-control"]')]
  .slice(0, 8).map(c => (c.textContent || '').trim());
if (win.length < 3) return false;
window.__ddUnfiltered = JSON.stringify(win);
return true;`, 30000);
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
    // GATE: the Field option "Failure Curve" is VISIBLE (re-opens the select if the click was lost)
    await assertFromJavascript(page, `const want = "Failure Curve";
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
    // Pick Field = "Failure Curve"
    await el(page, `//*[@role="option"][normalize-space(.)="Failure Curve"]`).click({ timeout: 30000 });
    // Open the Operator select
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
    // FAILURE CURVE: a MultiSelect rendered — not the TagsInput, not `#value`
    await assertFromJavascript(page, `return !!document.querySelector('input[placeholder="Choose values..."]')
  && !document.querySelector('input[placeholder="Type and press Enter..."]')
  && !document.getElementById('value');`, 30000);
    // Open the values dropdown
    await el(page, `//input[@placeholder="Choose values..."]`).click({ timeout: 30000 });
    // Let the options load
    await wait(page, 3);
    // ⭐ ENUM: the options are PRE-LOADED from the schema — several, `flat` among them, nothing typed
    await assertFromJavascript(page, `const inp = document.querySelector('input[placeholder="Choose values..."]');
const host = inp && inp.closest('[aria-controls]');
const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');
if (!lb) return false;
const opts = [...lb.querySelectorAll('[role="option"]')];
const labels = opts.map(o => (o.textContent || '').trim());
return labels.length >= 2 && labels.includes('flat');`, 30000);
    // Pick "flat" from the MultiSelect's own listbox
    await assertFromJavascript(page, `const inp = document.querySelector('input[placeholder="Choose values..."]');
const host = inp && inp.closest('[aria-controls]');
const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');
if (!lb) return false;
const opts = [...lb.querySelectorAll('[role="option"]')];
const labels = opts.map(o => (o.textContent || '').trim());
const o = opts.find(x => (x.textContent || '').trim() === 'flat');
if (!o) return false;
o.click();
return true;`, 30000);
    // Let the pick register
    await wait(page, 1);
    // Close the values dropdown (blur) so it cannot sit over `Add Filter`
    await assertFromJavascript(page, `if (document.activeElement) document.activeElement.blur();
return true;`, 15000);
    // Let the dropdown close
    await wait(page, 1);
    // VALID: with one value chosen, `Add Filter` is LIVE (type=submit)
    await assertFromJavascript(page, `const add = [...document.querySelectorAll('button')]
  .find(x => (x.textContent || '').trim() === 'Add Filter');
if (!add) return false;
return add.type === 'submit';`, 30000);
    // Add the filter
    await el(page, `//button[normalize-space(.)="Add Filter"]`).click({ timeout: 30000 });
    // Let the filter apply and the list re-query
    await wait(page, 4);
    // ⭐ ENUM: the pill reads `Failure Curve includes flat`
    await assertFromJavascript(page, `const pill = [...document.querySelectorAll('[class*="mantine-Pill-root"]')]
  .find(p => (p.textContent || '').includes('Failure Curve'));
if (!pill) return false;
const ptext = (pill.textContent || '').replace(/\\s+/g, ' ').trim();
return ptext.includes('includes') && ptext.endsWith('flat');`, 30000);
    // Close the drawer to see the list
    await page.keyboard.press(`Escape`);
    // Let the drawer close
    await wait(page, 2);
    // ⭐ ENUM: the list RE-QUERIED — its first rows are not the unfiltered ones
    await assertFromJavascript(page, `const win = [...document.querySelectorAll('[class*="mantine-Accordion-control"]')]
  .slice(0, 8).map(c => (c.textContent || '').trim());
return win.length >= 1 && JSON.stringify(win) !== window.__ddUnfiltered;`, 30000);
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
    // The list is unfiltered again — the same first rows as at the start
    await assertFromJavascript(page, `const win = [...document.querySelectorAll('[class*="mantine-Accordion-control"]')]
  .slice(0, 8).map(c => (c.textContent || '').trim());
return JSON.stringify(win) === window.__ddUnfiltered;`, 30000);
    // Open the Filters drawer for the record field
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
    // GATE: the Field option "Asset Type" is VISIBLE (re-opens the select if the click was lost)
    await assertFromJavascript(page, `const want = "Asset Type";
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
    // Pick Field = "Asset Type"
    await el(page, `//*[@role="option"][normalize-space(.)="Asset Type"]`).click({ timeout: 30000 });
    // Open the Operator select
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
    // ASSET TYPE: a MultiSelect rendered — not the TagsInput, not `#value`
    await assertFromJavascript(page, `return !!document.querySelector('input[placeholder="Choose values..."]')
  && !document.querySelector('input[placeholder="Type and press Enter..."]')
  && !document.getElementById('value');`, 30000);
    // Open the values dropdown
    await el(page, `//input[@placeholder="Choose values..."]`).click({ timeout: 30000 });
    // Let the options load
    await wait(page, 3);
    // ⭐ RECORD: the options arrived from the SERVER (`loadFilterOptions`) — capture the first one
    await assertFromJavascript(page, `const inp = document.querySelector('input[placeholder="Choose values..."]');
const host = inp && inp.closest('[aria-controls]');
const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');
if (!lb) return false;
const opts = [...lb.querySelectorAll('[role="option"]')];
const labels = opts.map(o => (o.textContent || '').trim());
if (!labels.length || !labels[0]) return false;
window.__ddRecordPick = labels[0];
return true;`, 30000);
    // Pick that option from the MultiSelect's own listbox
    await assertFromJavascript(page, `const inp = document.querySelector('input[placeholder="Choose values..."]');
const host = inp && inp.closest('[aria-controls]');
const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');
if (!lb) return false;
const opts = [...lb.querySelectorAll('[role="option"]')];
const labels = opts.map(o => (o.textContent || '').trim());
const o = opts.find(x => (x.textContent || '').trim() === window.__ddRecordPick);
if (!o) return false;
o.click();
return true;`, 30000);
    // Let the pick register
    await wait(page, 1);
    // Close the values dropdown (blur) so it cannot sit over `Add Filter`
    await assertFromJavascript(page, `if (document.activeElement) document.activeElement.blur();
return true;`, 15000);
    // Let the dropdown close
    await wait(page, 1);
    // VALID: with one value chosen, `Add Filter` is LIVE (type=submit)
    await assertFromJavascript(page, `const add = [...document.querySelectorAll('button')]
  .find(x => (x.textContent || '').trim() === 'Add Filter');
if (!add) return false;
return add.type === 'submit';`, 30000);
    // Add the filter
    await el(page, `//button[normalize-space(.)="Add Filter"]`).click({ timeout: 30000 });
    // Let the filter apply and the list re-query
    await wait(page, 4);
    await optional("SENTINEL (bugs \u00a739): the pill reads `Asset Type includes` with NO value \u2014 `addFilter` took `.label` of an ARRAY. Red here means it was fixed: rewrite this step", async () => {
      await assertFromJavascript(page, `const pill = [...document.querySelectorAll('[class*="mantine-Pill-root"]')]
  .find(p => (p.textContent || '').includes('Asset Type'));
if (!pill) return false;
const ptext = (pill.textContent || '').replace(/\\s+/g, ' ').trim();
return ptext.endsWith('includes')
  && !ptext.includes(window.__ddRecordPick || '\\u0000');`, 30000);
    });
    await optional("Close the drawer to see the list", async () => {
      await page.keyboard.press(`Escape`);
    });
    await optional("Let the drawer close", async () => {
      await wait(page, 2);
    });
    await optional("SENTINEL (bugs \u00a739): \u2026and the list did NOT narrow \u2014 the first rows are the unfiltered ones; the server ignored a condition with no value", async () => {
      await assertFromJavascript(page, `const win = [...document.querySelectorAll('[class*="mantine-Accordion-control"]')]
  .slice(0, 8).map(c => (c.textContent || '').trim());
return JSON.stringify(win) === window.__ddUnfiltered;`, 30000);
    });
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Restore: "Clear all"
    await el(page, `//button[normalize-space(.)="Clear all"]`).click({ timeout: 30000 });
    // Let the unfiltered re-query run
    await wait(page, 4);
    // RESTORED: no active filter pills remain
    await assertFromJavascript(page, `return document.querySelectorAll('[class*="mantine-Pill-root"]').length === 0;`, 30000);
    // Close the Filters drawer
    await page.keyboard.press(`Escape`);
    // Let the drawer close
    await wait(page, 2);
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
    // Restore: "Clear all"
    await el(page, `//button[normalize-space(.)="Clear all"]`).click({ timeout: 30000 });
    // Let the unfiltered re-query run
    await wait(page, 4);
    // RESTORED: no active filter pills remain
    await assertFromJavascript(page, `return document.querySelectorAll('[class*="mantine-Pill-root"]').length === 0;`, 30000);
    // Close the Filters drawer
    await page.keyboard.press(`Escape`);
    // Let the drawer close
    await wait(page, 2);
  }
}
