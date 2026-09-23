// Generated from Mobile/dd_tests_mobile/MOB.352_Work_Location_Save.json by to_playwright.py — do not edit by hand yet.
// MOB.352_Work_Location_Save

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, el, optional, wait } from '../support/dd';

export async function mob352(page: Page): Promise<void> {
  try {
    // Navigate to /work — warm the work lookup cache
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Let the lookup prefetch run
    await wait(page, 30);
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 3);
    // GATE 1/2: the /work/:id route mounted
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, 60000);
    // GATE 2/2: the detail data arrived (tab strip)
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
    // PREMISE (server): the stage's address/x/y are the fixed rest values, status `Ready`
    await assertFromJavascript(page, `const K = "__dd352_loc", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.workStage.status === 'Ready' && (w => !!w && w.address === '230 North Alexander Street, New Orleans, LA 70119' && Math.abs(Number(w.x) - (-90.1025785)) < 1e-6 && Math.abs(Number(w.y) - (29.9782827)) < 1e-6)(data.workStage)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id status address x y } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Escape any open menu or modal first
    await page.keyboard.press(`Escape`);
    // Let it close
    await wait(page, 1);
    // The globe control renders on the title (the write)
    await assertElementPresent(page, `//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]`, 60000);
    // No toast is covering the page (a Datadog click would land on it)
    await assertFromJavascript(page, `
const vis = e => { const r = e.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0'; };
return ![...document.querySelectorAll('.Toastify__toast')].some(vis);
`, 30000);
    // Open the MapLink menu (the write)
    await el(page, `(//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]])[1]`).click({ timeout: 30000 });
    // The menu offers "Edit Location" (re-opens the MapLink menu if the click was lost)
    await assertFromJavascript(page, `const want = "Edit Location";
const vis = e => { if (!e || !e.isConnected) return false;
  const r = e.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return false;
  for (let n = e; n && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false; }
  return true; };
const items = [...document.querySelectorAll('.mantine-Menu-item')]
  .filter(i => (i.textContent || '').replace(/\\s+/g, ' ').trim() === want);
const key = '__dd_menu_' + want;
if (items.some(vis)) { delete window[key]; return true; }
const now = Date.now();
// first poll only starts the clock - a menu still animating open must not be clicked shut
if (!window[key]) { window[key] = now; return false; }
if (now - window[key] > 2500) {
  window[key] = now;
  const t = document.evaluate("(//button[.//*[@data-icon=\\"globe\\" or contains(concat(\\" \\", normalize-space(@class), \\" \\"), \\" fa-globe \\")]])[1]", document, null,
    XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (t) t.click();
}
return false;`, 45000);
    // Open the location form via "Edit Location"
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Location"]`).click({ timeout: 30000 });
    // The location form mounted
    await assertElementPresent(page, `//form[@id="locationform"]`, 60000);
    // The form is PREFILLED with the rest values (defaultValues from the work stage)
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return false;
const v = id => { const el = f.querySelector('input#' + id); return el ? el.value : null; };
return v('address') === '230 North Alexander Street, New Orleans, LA 70119' && v('x') !== '' && Math.abs(Number(v('x')) - (-90.1025785)) < 1e-6
  && v('y') !== '' && Math.abs(Number(v('y')) - (29.9782827)) < 1e-6;`, 30000);
    // Clear the form's Address (native value setter + input event — trap 17)
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
const el = f && f.querySelector('input#address');
if (!el) return false;
el.focus();
Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
el.dispatchEvent(new window.Event('input', { bubbles: true }));
return el.value === '';`, 30000);
    // Type Address: DD MOB.352 LOCATION SAVE
    await el(page, `//form[@id="locationform"]//input[@id="address"]`).fill(`DD MOB.352 LOCATION SAVE`, { timeout: 30000 });
    // Clear the form's X (native value setter + input event — trap 17)
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
const el = f && f.querySelector('input#x');
if (!el) return false;
el.focus();
Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
el.dispatchEvent(new window.Event('input', { bubbles: true }));
return el.value === '';`, 30000);
    // Type X: -90.0812
    await el(page, `//form[@id="locationform"]//input[@id="x"]`).fill(`-90.0812`, { timeout: 30000 });
    // Clear the form's Y (native value setter + input event — trap 17)
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
const el = f && f.querySelector('input#y');
if (!el) return false;
el.focus();
Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
el.dispatchEvent(new window.Event('input', { bubbles: true }));
return el.value === '';`, 30000);
    // Type Y: 29.9511
    await el(page, `//form[@id="locationform"]//input[@id="y"]`).fill(`29.9511`, { timeout: 30000 });
    // The form now holds the marker values — address `DD MOB.352 LOCATION SAVE`, x -90.0812, y 29.9511
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return false;
const v = id => { const el = f.querySelector('input#' + id); return el ? el.value : null; };
return v('address') === 'DD MOB.352 LOCATION SAVE' && v('x') !== '' && Math.abs(Number(v('x')) - (-90.0812)) < 1e-6
  && v('y') !== '' && Math.abs(Number(v('y')) - (29.9511)) < 1e-6;`, 30000);
    // Submit is ARMED — `type="submit"` inside #locationform (trap 8)
    await assertFromJavascript(page, `const b = document.querySelector('#locationform button[type="submit"]');
return !!b && (b.textContent || '').trim() === 'SUBMIT';`, 30000);
    // SUBMIT the marker location
    await el(page, `//form[@id="locationform"]//button[normalize-space(.)="SUBMIT"]`).click({ timeout: 30000 });
    await optional("The `Work stage location has been updated` toast (optional: transient)", async () => {
      await assertPageContains(page, `Work stage location has been updated`, 10000);
    });
    // The location form is GONE and the page is still alive (the modal closes only once the server answers — no optimistic response)
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.getElementById('locationform');`, 45000);
    // ⭐ SERVER: the stage now holds `DD MOB.352 LOCATION SAVE` · x -90.0812 · y 29.9511 — asked over /graphql
    await assertFromJavascript(page, `const K = "__dd352_loc", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((w => !!w && w.address === 'DD MOB.352 LOCATION SAVE' && Math.abs(Number(w.x) - (-90.0812)) < 1e-6 && Math.abs(Number(w.y) - (29.9511)) < 1e-6)(data.workStage)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id status address x y } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd352_loc', '__dd352_loc:inflight', '__dd352_loc:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd352_loc', '__dd352_loc:inflight', '__dd352_loc:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Escape any open menu or modal first
    await page.keyboard.press(`Escape`);
    // Let it close
    await wait(page, 1);
    // The globe control renders on the title (the restore)
    await assertElementPresent(page, `//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]`, 60000);
    // No toast is covering the page (a Datadog click would land on it)
    await assertFromJavascript(page, `
const vis = e => { const r = e.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0'; };
return ![...document.querySelectorAll('.Toastify__toast')].some(vis);
`, 30000);
    // Open the MapLink menu (the restore)
    await el(page, `(//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]])[1]`).click({ timeout: 30000 });
    // The menu offers "Edit Location" (re-opens the MapLink menu if the click was lost)
    await assertFromJavascript(page, `const want = "Edit Location";
const vis = e => { if (!e || !e.isConnected) return false;
  const r = e.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return false;
  for (let n = e; n && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false; }
  return true; };
const items = [...document.querySelectorAll('.mantine-Menu-item')]
  .filter(i => (i.textContent || '').replace(/\\s+/g, ' ').trim() === want);
const key = '__dd_menu_' + want;
if (items.some(vis)) { delete window[key]; return true; }
const now = Date.now();
// first poll only starts the clock - a menu still animating open must not be clicked shut
if (!window[key]) { window[key] = now; return false; }
if (now - window[key] > 2500) {
  window[key] = now;
  const t = document.evaluate("(//button[.//*[@data-icon=\\"globe\\" or contains(concat(\\" \\", normalize-space(@class), \\" \\"), \\" fa-globe \\")]])[1]", document, null,
    XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (t) t.click();
}
return false;`, 45000);
    // Open the location form via "Edit Location"
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Location"]`).click({ timeout: 30000 });
    // The location form mounted
    await assertElementPresent(page, `//form[@id="locationform"]`, 60000);
    // Clear the form's Address (native value setter + input event — trap 17)
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
const el = f && f.querySelector('input#address');
if (!el) return false;
el.focus();
Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
el.dispatchEvent(new window.Event('input', { bubbles: true }));
return el.value === '';`, 30000);
    // Type Address: 230 North Alexander Street, New Orleans, LA 70119
    await el(page, `//form[@id="locationform"]//input[@id="address"]`).fill(`230 North Alexander Street, New Orleans, LA 70119`, { timeout: 30000 });
    // Clear the form's X (native value setter + input event — trap 17)
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
const el = f && f.querySelector('input#x');
if (!el) return false;
el.focus();
Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
el.dispatchEvent(new window.Event('input', { bubbles: true }));
return el.value === '';`, 30000);
    // Type X: -90.1025785
    await el(page, `//form[@id="locationform"]//input[@id="x"]`).fill(`-90.1025785`, { timeout: 30000 });
    // Clear the form's Y (native value setter + input event — trap 17)
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
const el = f && f.querySelector('input#y');
if (!el) return false;
el.focus();
Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
el.dispatchEvent(new window.Event('input', { bubbles: true }));
return el.value === '';`, 30000);
    // Type Y: 29.9782827
    await el(page, `//form[@id="locationform"]//input[@id="y"]`).fill(`29.9782827`, { timeout: 30000 });
    // The form now holds the rest values — address `230 North Alexander Street, New Orleans, LA 70119`, x -90.1025785, y 29.9782827
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return false;
const v = id => { const el = f.querySelector('input#' + id); return el ? el.value : null; };
return v('address') === '230 North Alexander Street, New Orleans, LA 70119' && v('x') !== '' && Math.abs(Number(v('x')) - (-90.1025785)) < 1e-6
  && v('y') !== '' && Math.abs(Number(v('y')) - (29.9782827)) < 1e-6;`, 30000);
    // Submit is ARMED — `type="submit"` inside #locationform (trap 8)
    await assertFromJavascript(page, `const b = document.querySelector('#locationform button[type="submit"]');
return !!b && (b.textContent || '').trim() === 'SUBMIT';`, 30000);
    // SUBMIT the rest location
    await el(page, `//form[@id="locationform"]//button[normalize-space(.)="SUBMIT"]`).click({ timeout: 30000 });
    await optional("The `Work stage location has been updated` toast (optional: transient)", async () => {
      await assertPageContains(page, `Work stage location has been updated`, 10000);
    });
    // The location form is GONE and the page is still alive (the modal closes only once the server answers — no optimistic response)
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.getElementById('locationform');`, 45000);
    // ⭐ RESTORED (server): the UI wrote the fixed rest address/x/y back
    await assertFromJavascript(page, `const K = "__dd352_loc", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((w => !!w && w.address === '230 North Alexander Street, New Orleans, LA 70119' && Math.abs(Number(w.x) - (-90.1025785)) < 1e-6 && Math.abs(Number(w.y) - (29.9782827)) < 1e-6)(data.workStage)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id status address x y } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd352_loc', '__dd352_loc:inflight', '__dd352_loc:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Escape — leave no modal open
    await page.keyboard.press(`Escape`);
    // BACKSTOP: if the server is not at rest, send `updateWorkStage` with the FIXED rest values (reads first; sends nothing when the UI restore landed)
    await assertFromJavascript(page, `const K = '__dd352_net';
const st = sessionStorage.getItem(K);
if (st === 'done') return true;
if (st === 'asking') return false;
sessionStorage.setItem(K, 'asking');
const post = body => window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' }, body: JSON.stringify(body) });
post({ query: 'query($id: ID!) { workStage(id: $id) { id status address x y } }', variables: { id: 'EYRpYJ9QYdQ1JFF10JtB0Q' } })
  .then(r => r.json())
  .then(j => {
    const w = j && j.data && j.data.workStage;
    if ((w => !!w && w.address === '230 North Alexander Street, New Orleans, LA 70119' && Math.abs(Number(w.x) - (-90.1025785)) < 1e-6 && Math.abs(Number(w.y) - (29.9782827)) < 1e-6)(w)) { sessionStorage.setItem(K, 'done'); return; }
    sessionStorage.setItem(K + ':sent', '1');
    return post({ query: 'mutation($id: ID!, $data: UpdateWorkStageInput!) { updateWorkStage(id: $id, data: $data) { id } }', variables: { id: 'EYRpYJ9QYdQ1JFF10JtB0Q', data: { address: '230 North Alexander Street, New Orleans, LA 70119', x: -90.1025785, y: 29.9782827 } } })
      .then(() => sessionStorage.setItem(K, 'done'));
  })
  .catch(() => sessionStorage.setItem(K, 'done'));
return false;`, 45000);
    // Remove the backstop's sessionStorage keys
    await assertFromJavascript(page, `['__dd352_net', '__dd352_net:sent'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // ⭐ AT REST (server): address/x/y are the fixed rest values and the status is still `Ready`
    await assertFromJavascript(page, `const K = "__dd352_loc", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.workStage.status === 'Ready' && (w => !!w && w.address === '230 North Alexander Street, New Orleans, LA 70119' && Math.abs(Number(w.x) - (-90.1025785)) < 1e-6 && Math.abs(Number(w.y) - (29.9782827)) < 1e-6)(data.workStage)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id status address x y } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd352_loc', '__dd352_loc:inflight', '__dd352_loc:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  }
}
