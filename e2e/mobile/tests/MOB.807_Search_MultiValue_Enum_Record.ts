// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.807_Search_MultiValue_Enum_Record.json. This file is the source now: edit it directly.
// MOB.807_Search_MultiValue_Enum_Record

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertFromJavascript, click, press, wait } from '../../support/dd';

export async function mob807(page: Page): Promise<void> {
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
  await run.step("Let the asset list render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("CAPTURE: the unfiltered list's first rendered rows", {}, async () => {
    await assertFromJavascript(page, `const win = [...document.querySelectorAll('[class*="mantine-Accordion-control"]')]
  .slice(0, 8).map(c => (c.textContent || '').trim());
if (win.length < 3) return false;
window.__ddUnfiltered = JSON.stringify(win);
return true;`, 30000);
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
  await run.step("GATE: the Field option \"Failure Curve\" is VISIBLE (re-opens the select if the click was lost)", {}, async () => {
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
  });
  await run.step("Pick Field = \"Failure Curve\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Failure Curve"]`, 30000);
  });
  await run.step("Open the Operator select", {}, async () => {
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
  await run.step("FAILURE CURVE: a MultiSelect rendered \u2014 not the TagsInput, not `#value`", {}, async () => {
    await assertFromJavascript(page, `return !!document.querySelector('input[placeholder="Choose values..."]')
  && !document.querySelector('input[placeholder="Type and press Enter..."]')
  && !document.getElementById('value');`, 30000);
  });
  await run.step("Open the values dropdown", {}, async () => {
    await click(page, `//input[@placeholder="Choose values..."]`, 30000);
  });
  await run.step("Let the options load", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 ENUM: the options are PRE-LOADED from the schema \u2014 several, `flat` among them, nothing typed", {}, async () => {
    await assertFromJavascript(page, `const inp = document.querySelector('input[placeholder="Choose values..."]');
const host = inp && inp.closest('[aria-controls]');
const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');
if (!lb) return false;
const opts = [...lb.querySelectorAll('[role="option"]')];
const labels = opts.map(o => (o.textContent || '').trim());
return labels.length >= 2 && labels.includes('flat');`, 30000);
  });
  await run.step("Pick \"flat\" from the MultiSelect's own listbox", {}, async () => {
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
  });
  await run.step("Let the pick register", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Close the values dropdown (blur) so it cannot sit over `Add Filter`", {}, async () => {
    await assertFromJavascript(page, `if (document.activeElement) document.activeElement.blur();
return true;`, 15000);
  });
  await run.step("Let the dropdown close", {}, async () => {
    await wait(page, 1);
  });
  await run.step("VALID: with one value chosen, `Add Filter` is LIVE (type=submit)", {}, async () => {
    await assertFromJavascript(page, `const add = [...document.querySelectorAll('button')]
  .find(x => (x.textContent || '').trim() === 'Add Filter');
if (!add) return false;
return add.type === 'submit';`, 30000);
  });
  await run.step("Add the filter", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add Filter"]`, 30000);
  });
  await run.step("Let the filter apply and the list re-query", {}, async () => {
    await wait(page, 4);
  });
  await run.step("\u2b50 ENUM: the pill reads `Failure Curve includes flat`", {}, async () => {
    await assertFromJavascript(page, `const pill = [...document.querySelectorAll('[class*="mantine-Pill-root"]')]
  .find(p => (p.textContent || '').includes('Failure Curve'));
if (!pill) return false;
const ptext = (pill.textContent || '').replace(/\\s+/g, ' ').trim();
return ptext.includes('includes') && ptext.endsWith('flat');`, 30000);
  });
  await run.step("Close the drawer to see the list", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the drawer close", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 ENUM: the list RE-QUERIED \u2014 its first rows are not the unfiltered ones", {}, async () => {
    await assertFromJavascript(page, `const win = [...document.querySelectorAll('[class*="mantine-Accordion-control"]')]
  .slice(0, 8).map(c => (c.textContent || '').trim());
return win.length >= 1 && JSON.stringify(win) !== window.__ddUnfiltered;`, 30000);
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
  await run.step("Restore: \"Clear all\"", {always: true}, async () => {
    await click(page, `//button[normalize-space(.)="Clear all"]`, 30000);
  });
  await run.step("Let the unfiltered re-query run", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("RESTORED: no active filter pills remain", {always: true}, async () => {
    await assertFromJavascript(page, `return document.querySelectorAll('[class*="mantine-Pill-root"]').length === 0;`, 30000);
  });
  await run.step("Close the Filters drawer", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the drawer close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("The list is unfiltered again \u2014 the same first rows as at the start", {}, async () => {
    await assertFromJavascript(page, `const win = [...document.querySelectorAll('[class*="mantine-Accordion-control"]')]
  .slice(0, 8).map(c => (c.textContent || '').trim());
return JSON.stringify(win) === window.__ddUnfiltered;`, 30000);
  });
  await run.step("Open the Filters drawer for the record field", {}, async () => {
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
  await run.step("GATE: the Field option \"Asset Type\" is VISIBLE (re-opens the select if the click was lost)", {}, async () => {
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
  });
  await run.step("Pick Field = \"Asset Type\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Asset Type"]`, 30000);
  });
  await run.step("Open the Operator select", {}, async () => {
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
  await run.step("ASSET TYPE: a MultiSelect rendered \u2014 not the TagsInput, not `#value`", {}, async () => {
    await assertFromJavascript(page, `return !!document.querySelector('input[placeholder="Choose values..."]')
  && !document.querySelector('input[placeholder="Type and press Enter..."]')
  && !document.getElementById('value');`, 30000);
  });
  await run.step("Open the values dropdown", {}, async () => {
    await click(page, `//input[@placeholder="Choose values..."]`, 30000);
  });
  await run.step("Let the options load", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 RECORD: the options arrived from the SERVER (`loadFilterOptions`) \u2014 capture the first one", {}, async () => {
    await assertFromJavascript(page, `const inp = document.querySelector('input[placeholder="Choose values..."]');
const host = inp && inp.closest('[aria-controls]');
const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');
if (!lb) return false;
const opts = [...lb.querySelectorAll('[role="option"]')];
const labels = opts.map(o => (o.textContent || '').trim());
if (!labels.length || !labels[0]) return false;
window.__ddRecordPick = labels[0];
return true;`, 30000);
  });
  await run.step("Pick that option from the MultiSelect's own listbox", {}, async () => {
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
  });
  await run.step("Let the pick register", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Close the values dropdown (blur) so it cannot sit over `Add Filter`", {}, async () => {
    await assertFromJavascript(page, `if (document.activeElement) document.activeElement.blur();
return true;`, 15000);
  });
  await run.step("Let the dropdown close", {}, async () => {
    await wait(page, 1);
  });
  await run.step("VALID: with one value chosen, `Add Filter` is LIVE (type=submit)", {}, async () => {
    await assertFromJavascript(page, `const add = [...document.querySelectorAll('button')]
  .find(x => (x.textContent || '').trim() === 'Add Filter');
if (!add) return false;
return add.type === 'submit';`, 30000);
  });
  await run.step("Add the filter", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add Filter"]`, 30000);
  });
  await run.step("Let the filter apply and the list re-query", {}, async () => {
    await wait(page, 4);
  });
  await run.step("SENTINEL (bugs \u00a739): the pill reads `Asset Type includes` with NO value \u2014 `addFilter` took `.label` of an ARRAY. Red here means it was fixed: rewrite this step", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const pill = [...document.querySelectorAll('[class*="mantine-Pill-root"]')]
  .find(p => (p.textContent || '').includes('Asset Type'));
if (!pill) return false;
const ptext = (pill.textContent || '').replace(/\\s+/g, ' ').trim();
return ptext.endsWith('includes')
  && !ptext.includes(window.__ddRecordPick || '\\u0000');`, 30000);
  });
  await run.step("Close the drawer to see the list", {allow: 'ignore'}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the drawer close", {allow: 'ignore'}, async () => {
    await wait(page, 2);
  });
  await run.step("SENTINEL (bugs \u00a739): \u2026and the list did NOT narrow \u2014 the first rows are the unfiltered ones; the server ignored a condition with no value", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const win = [...document.querySelectorAll('[class*="mantine-Accordion-control"]')]
  .slice(0, 8).map(c => (c.textContent || '').trim());
return JSON.stringify(win) === window.__ddUnfiltered;`, 30000);
  });
  await run.step("Reopen the Filters drawer to clear", {always: true}, async () => {
    await click(page, `//button[contains(concat(" ", normalize-space(@class), " "), " asset-lookup-filter-button ")]`, 30000);
  });
  await run.step("Wait for the drawer", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("Test the Filters drawer opened (re-clicks Filters if the click was swallowed)", {always: true}, async () => {
    await assertFromJavascript(page, `
const up = [...document.querySelectorAll('button')]
  .some(b => b.textContent.trim() === 'Add Filter');
if (up) return true;
const btn = document.querySelector('button.asset-lookup-filter-button');
if (btn) btn.click();
return false;
`, 30000);
  });
  await run.step("Restore: \"Clear all\"", {always: true}, async () => {
    await click(page, `//button[normalize-space(.)="Clear all"]`, 30000);
  });
  await run.step("Let the unfiltered re-query run", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("RESTORED: no active filter pills remain", {always: true}, async () => {
    await assertFromJavascript(page, `return document.querySelectorAll('[class*="mantine-Pill-root"]').length === 0;`, 30000);
  });
  await run.step("Close the Filters drawer", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the drawer close", {always: true}, async () => {
    await wait(page, 2);
  });
  run.finish();
}
