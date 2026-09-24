// Generated from legacy/Mobile/dd_tests_mobile/MOB.352_Work_Location_Save.json by to_playwright.py — do not edit by hand yet.
// MOB.352_Work_Location_Save

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, click, press, typeText, wait } from '../support/dd';

export async function mob352(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 warm the work lookup cache", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Let the lookup prefetch run", {}, async () => {
    await wait(page, 30);
  });
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("GATE 1/2: the /work/:id route mounted", {}, async () => {
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, 60000);
  });
  await run.step("GATE 2/2: the detail data arrived (tab strip)", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
  });
  await run.step("PREMISE (server): the stage's address/x/y are the fixed rest values, status `Ready`", {}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd352_loc', '__dd352_loc:inflight', '__dd352_loc:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Escape any open menu or modal first", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let it close", {}, async () => {
    await wait(page, 1);
  });
  await run.step("The globe control renders on the title (the write)", {}, async () => {
    await assertElementPresent(page, `//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]`, 60000);
  });
  await run.step("No toast is covering the page (a Datadog click would land on it)", {}, async () => {
    await assertFromJavascript(page, `
const vis = e => { const r = e.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0'; };
return ![...document.querySelectorAll('.Toastify__toast')].some(vis);
`, 30000);
  });
  await run.step("Open the MapLink menu (the write)", {}, async () => {
    await click(page, `(//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]])[1]`, 30000);
  });
  await run.step("The menu offers \"Edit Location\" (re-opens the MapLink menu if the click was lost)", {}, async () => {
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
  });
  await run.step("Open the location form via \"Edit Location\"", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Location"]`, 30000);
  });
  await run.step("The location form mounted", {}, async () => {
    await assertElementPresent(page, `//form[@id="locationform"]`, 60000);
  });
  await run.step("The form is PREFILLED with the rest values (defaultValues from the work stage)", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return false;
const v = id => { const el = f.querySelector('input#' + id); return el ? el.value : null; };
return v('address') === '230 North Alexander Street, New Orleans, LA 70119' && v('x') !== '' && Math.abs(Number(v('x')) - (-90.1025785)) < 1e-6
  && v('y') !== '' && Math.abs(Number(v('y')) - (29.9782827)) < 1e-6;`, 30000);
  });
  await run.step("Clear the form's Address (native value setter + input event \u2014 trap 17)", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
const el = f && f.querySelector('input#address');
if (!el) return false;
el.focus();
Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
el.dispatchEvent(new window.Event('input', { bubbles: true }));
return el.value === '';`, 30000);
  });
  await run.step("Type Address: DD MOB.352 LOCATION SAVE", {}, async () => {
    await typeText(page, `//form[@id="locationform"]//input[@id="address"]`, `DD MOB.352 LOCATION SAVE`, 30000);
  });
  await run.step("Clear the form's X (native value setter + input event \u2014 trap 17)", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
const el = f && f.querySelector('input#x');
if (!el) return false;
el.focus();
Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
el.dispatchEvent(new window.Event('input', { bubbles: true }));
return el.value === '';`, 30000);
  });
  await run.step("Type X: -90.0812", {}, async () => {
    await typeText(page, `//form[@id="locationform"]//input[@id="x"]`, `-90.0812`, 30000);
  });
  await run.step("Clear the form's Y (native value setter + input event \u2014 trap 17)", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
const el = f && f.querySelector('input#y');
if (!el) return false;
el.focus();
Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
el.dispatchEvent(new window.Event('input', { bubbles: true }));
return el.value === '';`, 30000);
  });
  await run.step("Type Y: 29.9511", {}, async () => {
    await typeText(page, `//form[@id="locationform"]//input[@id="y"]`, `29.9511`, 30000);
  });
  await run.step("The form now holds the marker values \u2014 address `DD MOB.352 LOCATION SAVE`, x -90.0812, y 29.9511", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return false;
const v = id => { const el = f.querySelector('input#' + id); return el ? el.value : null; };
return v('address') === 'DD MOB.352 LOCATION SAVE' && v('x') !== '' && Math.abs(Number(v('x')) - (-90.0812)) < 1e-6
  && v('y') !== '' && Math.abs(Number(v('y')) - (29.9511)) < 1e-6;`, 30000);
  });
  await run.step("Submit is ARMED \u2014 `type=\"submit\"` inside #locationform (trap 8)", {}, async () => {
    await assertFromJavascript(page, `const b = document.querySelector('#locationform button[type="submit"]');
return !!b && (b.textContent || '').trim() === 'SUBMIT';`, 30000);
  });
  await run.step("SUBMIT the marker location", {}, async () => {
    await click(page, `//form[@id="locationform"]//button[normalize-space(.)="SUBMIT"]`, 30000);
  });
  await run.step("The `Work stage location has been updated` toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Work stage location has been updated`, 10000);
  });
  await run.step("The location form is GONE and the page is still alive (the modal closes only once the server answers \u2014 no optimistic response)", {}, async () => {
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.getElementById('locationform');`, 45000);
  });
  await run.step("\u2b50 SERVER: the stage now holds `DD MOB.352 LOCATION SAVE` \u00b7 x -90.0812 \u00b7 y 29.9511 \u2014 asked over /graphql", {}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd352_loc', '__dd352_loc:inflight', '__dd352_loc:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Escape any open menu or modal first", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let it close", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("The globe control renders on the title (the restore)", {always: true}, async () => {
    await assertElementPresent(page, `//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]`, 60000);
  });
  await run.step("No toast is covering the page (a Datadog click would land on it)", {always: true}, async () => {
    await assertFromJavascript(page, `
const vis = e => { const r = e.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0'; };
return ![...document.querySelectorAll('.Toastify__toast')].some(vis);
`, 30000);
  });
  await run.step("Open the MapLink menu (the restore)", {always: true}, async () => {
    await click(page, `(//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]])[1]`, 30000);
  });
  await run.step("The menu offers \"Edit Location\" (re-opens the MapLink menu if the click was lost)", {always: true}, async () => {
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
  });
  await run.step("Open the location form via \"Edit Location\"", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Location"]`, 30000);
  });
  await run.step("The location form mounted", {always: true}, async () => {
    await assertElementPresent(page, `//form[@id="locationform"]`, 60000);
  });
  await run.step("Clear the form's Address (native value setter + input event \u2014 trap 17)", {always: true}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
const el = f && f.querySelector('input#address');
if (!el) return false;
el.focus();
Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
el.dispatchEvent(new window.Event('input', { bubbles: true }));
return el.value === '';`, 30000);
  });
  await run.step("Type Address: 230 North Alexander Street, New Orleans, LA 70119", {always: true}, async () => {
    await typeText(page, `//form[@id="locationform"]//input[@id="address"]`, `230 North Alexander Street, New Orleans, LA 70119`, 30000);
  });
  await run.step("Clear the form's X (native value setter + input event \u2014 trap 17)", {always: true}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
const el = f && f.querySelector('input#x');
if (!el) return false;
el.focus();
Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
el.dispatchEvent(new window.Event('input', { bubbles: true }));
return el.value === '';`, 30000);
  });
  await run.step("Type X: -90.1025785", {always: true}, async () => {
    await typeText(page, `//form[@id="locationform"]//input[@id="x"]`, `-90.1025785`, 30000);
  });
  await run.step("Clear the form's Y (native value setter + input event \u2014 trap 17)", {always: true}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
const el = f && f.querySelector('input#y');
if (!el) return false;
el.focus();
Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
el.dispatchEvent(new window.Event('input', { bubbles: true }));
return el.value === '';`, 30000);
  });
  await run.step("Type Y: 29.9782827", {always: true}, async () => {
    await typeText(page, `//form[@id="locationform"]//input[@id="y"]`, `29.9782827`, 30000);
  });
  await run.step("The form now holds the rest values \u2014 address `230 North Alexander Street, New Orleans, LA 70119`, x -90.1025785, y 29.9782827", {always: true}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return false;
const v = id => { const el = f.querySelector('input#' + id); return el ? el.value : null; };
return v('address') === '230 North Alexander Street, New Orleans, LA 70119' && v('x') !== '' && Math.abs(Number(v('x')) - (-90.1025785)) < 1e-6
  && v('y') !== '' && Math.abs(Number(v('y')) - (29.9782827)) < 1e-6;`, 30000);
  });
  await run.step("Submit is ARMED \u2014 `type=\"submit\"` inside #locationform (trap 8)", {always: true}, async () => {
    await assertFromJavascript(page, `const b = document.querySelector('#locationform button[type="submit"]');
return !!b && (b.textContent || '').trim() === 'SUBMIT';`, 30000);
  });
  await run.step("SUBMIT the rest location", {always: true}, async () => {
    await click(page, `//form[@id="locationform"]//button[normalize-space(.)="SUBMIT"]`, 30000);
  });
  await run.step("The `Work stage location has been updated` toast (optional: transient)", {always: true, allow: 'ignore'}, async () => {
    await assertPageContains(page, `Work stage location has been updated`, 10000);
  });
  await run.step("The location form is GONE and the page is still alive (the modal closes only once the server answers \u2014 no optimistic response)", {always: true}, async () => {
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.getElementById('locationform');`, 45000);
  });
  await run.step("\u2b50 RESTORED (server): the UI wrote the fixed rest address/x/y back", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd352_loc', '__dd352_loc:inflight', '__dd352_loc:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Escape \u2014 leave no modal open", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("BACKSTOP: if the server is not at rest, send `updateWorkStage` with the FIXED rest values (reads first; sends nothing when the UI restore landed)", {always: true}, async () => {
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
  });
  await run.step("Remove the backstop's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd352_net', '__dd352_net:sent'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\u2b50 AT REST (server): address/x/y are the fixed rest values and the status is still `Ready`", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd352_loc', '__dd352_loc:inflight', '__dd352_loc:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  run.finish();
}
