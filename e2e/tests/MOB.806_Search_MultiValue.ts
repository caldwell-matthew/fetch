// Generated from legacy/Mobile/dd_tests_mobile/MOB.806_Search_MultiValue.json by to_playwright.py — do not edit by hand yet.
// MOB.806_Search_MultiValue

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, press, typeText, wait } from '../support/dd';

export async function mob806(page: Page): Promise<void> {
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
  await run.step("Pick Operator = \"contains\" (the SINGLE-value branch)", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="contains"]`, 30000);
  });
  await run.step("Let the value input render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("BASELINE: the single-value `#value` input is what renders for `contains`", {}, async () => {
    await assertFromJavascript(page, `const v = document.getElementById('value');
const tags = document.querySelector('input[placeholder="Type and press Enter..."]');
return !!v && !tags;`, 30000);
  });
  await run.step("Open the Operator select again", {}, async () => {
    await click(page, `//*[@id="operator"]`, 30000);
  });
  await run.step("Wait for Operator options", {}, async () => {
    await wait(page, 1);
  });
  await run.step("GATE: the Operator option \"includes\" is VISIBLE (re-opens the select if the click was lost)", {}, async () => {
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
  });
  await run.step("Pick Operator = \"includes\" (the MULTI-value branch)", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="includes"]`, 30000);
  });
  await run.step("Let the value input swap", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The `TagsInput` rendered", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Type and press Enter..."]`, 30000);
  });
  await run.step("\u2b50 IT IS A SWAP: the single-value `#value` input is GONE", {}, async () => {
    await assertFromJavascript(page, `const v = document.getElementById('value');
const tags = document.querySelector('input[placeholder="Type and press Enter..."]');
return !!tags && !v;`, 30000);
  });
  await run.step("\u2b50 VALIDITY 1/2: with NO tags, `Add Filter` is INERT (type=button)", {}, async () => {
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').trim() === 'Add Filter');
if (!b) return false;
return b.type === 'button';`, 30000);
  });
  await run.step("Focus the tags input", {}, async () => {
    await click(page, `//input[@placeholder="Type and press Enter..."]`, 30000);
  });
  await run.step("Type \"Pump\"", {}, async () => {
    await typeText(page, `//input[@placeholder="Type and press Enter..."]`, `Pump`, DEFAULT_TIMEOUT);
  });
  await run.step("Press Enter to commit the tag", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Let the draft revalidate", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The tag \"Pump\" was committed as a pill", {}, async () => {
    await assertFromJavascript(page, `const d = document.querySelector('.mantine-Drawer-content') || document;
return [...d.querySelectorAll('.mantine-Pill-label')].some(p => (p.textContent || '').trim() === 'Pump');`, 30000);
  });
  await run.step("\u2b50 VALIDITY 2/2: with one tag, `Add Filter` is LIVE (type=submit)", {}, async () => {
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').trim() === 'Add Filter');
if (!b) return false;
return b.type === 'submit';`, 30000);
  });
  await run.step("Escape \u2014 close WITHOUT adding the filter", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the drawer close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: no filter was added \u2014 the trigger still reads `Filters (0)`", {always: true}, async () => {
    await assertFromJavascript(page, `const b = document.querySelector('.asset-lookup-filter-button');
if (!b) return false;
return /Filters\\s*\\(0\\)/.test(b.textContent || '');`, 30000);
  });
  run.finish();
}
