// Generated from legacy/Mobile/dd_tests_mobile/MOB.358_Work_Asset_Geolocate.json by to_playwright.py — do not edit by hand yet.
// MOB.358_Work_Asset_Geolocate

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, wait } from '../support/dd';

export async function mob358(page: Page): Promise<void> {
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
  await run.step("GATE: the detail data arrived (tab strip)", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
  });
  await run.step("Open the \"Assets\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][normalize-space(.)="Assets"]`, 30000);
  });
  await run.step("Wait for the asset list", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\"Assets\" is now the active tab", {}, async () => {
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Assets"][@data-active="true"]`, 30000);
  });
  await run.step("FIXTURE GUARD: an asset row renders the geolocate control", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[@data-icon="location-crosshairs" or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")])[1]`, 60000);
  });
  await run.step("The control is ENABLED \u2014 it gates on `online`, and we are online", {}, async () => {
    await assertFromJavascript(page, `const icon = document.querySelector('[data-icon="location-crosshairs"]');
if (!icon) return false;
const root = icon.closest('.mantine-ActionIcon-root');
if (!root) return false;
return !root.hasAttribute('data-disabled') && navigator.onLine === true;`, 30000);
  });
  await run.step("Install the geolocation + Mapbox stubs (must follow the last go() \u2014 G7)", {}, async () => {
    await assertFromJavascript(page, `if (!window.__ddOrigFetch) window.__ddOrigFetch = window.fetch;
if (!window.__ddOrigGeo) window.__ddOrigGeo = navigator.geolocation.getCurrentPosition;
navigator.geolocation.getCurrentPosition = function (ok) {
  ok({ coords: { latitude: 41.8781, longitude: -87.6298, accuracy: 5 } });
};
// Mapbox ONLY — Apollo uses fetch, so everything else must pass through untouched.
window.fetch = function (input) {
  var u = typeof input === 'string' ? input : ((input && input.url) || '');
  if (u.indexOf('api.mapbox.com/geocoding') !== -1) {
    var body = JSON.stringify({features:[{place_type:['address'],text:'Main Street',address:'1600',properties:{}},{place_type:['place'],text:'Chicago',properties:{}},{place_type:['region'],text:'Illinois',properties:{short_code:'US-IL'}},{place_type:['country'],text:'United States',properties:{short_code:'us'}},{place_type:['postcode'],text:'60601',properties:{}}]});
    return Promise.resolve(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
  }
  return window.__ddOrigFetch.apply(window, arguments);
};
return typeof window.fetch === 'function';
`, 30000);
  });
  await run.step("Tap the geolocate control (click the ActionIcon ROOT \u2014 MOB.911)", {}, async () => {
    await click(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-ActionIcon-root ")][.//*[@data-icon="location-crosshairs" or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")]])[1]`, 30000);
  });
  await run.step("The modal opened \u2014 \"Updating Asset Location\"", {}, async () => {
    await assertPageContains(page, `Updating Asset Location`, 60000);
  });
  await run.step("The location form mounted", {}, async () => {
    await assertElementPresent(page, `//form[@id="mobile-geolocate"]`, 60000);
  });
  await run.step("\u2026with its `Include GIS` control", {}, async () => {
    await assertPageContains(page, `Include GIS`, 30000);
  });
  await run.step("\u2026and its `Include Address` control", {}, async () => {
    await assertPageContains(page, `Include Address`, 30000);
  });
  await run.step("\u2b50 THE STUBBED GEOCODE REACHED THE FORM \u2014 address, city and postcode", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const vals = [...f.querySelectorAll('input')].map(i => (i.value || '').trim());
const joined = vals.join('|');
// address = \`\${streetNumber} \${street}\` per AssetGeolocate defaultValues
return joined.includes('1600 Main Street')
  && joined.includes('Chicago')
  && joined.includes('60601');`, 30000);
  });
  await run.step("\u2026and the region/country short_codes were unwrapped (US-IL -> IL, us -> US)", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const joined = [...f.querySelectorAll('input')].map(i => (i.value || '').trim()).join('|');
return /(^|\\|)IL(\\||$)/.test(joined) && /(^|\\|)US(\\||$)/.test(joined);`, 30000);
  });
  await run.step("\u2b50 VALIDITY 1/2: Submit is `submit` iff some include-box is checked", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const boxes = [...f.querySelectorAll('input[type=checkbox]')];
if (boxes.length < 2) return false;
const anyChecked = boxes.some(b => b.checked);
const btn = document.querySelector('button[form="mobile-geolocate"]')
  || [...document.querySelectorAll('button')].find(b => (b.textContent || '').trim() === 'Submit');
if (!btn) return false;
// SubmitButton.tsx: type={isValid ? 'submit' : 'button'}, isValid = includeGis || includeAddress
return anyChecked ? btn.type === 'submit' : btn.type === 'button';
`, 30000);
  });
  await run.step("CHECKBOX GUARD: the form has exactly two include-boxes, so [2] is unambiguous", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
return f.querySelectorAll('input[type=checkbox]').length === 2;`, 30000);
  });
  await run.step("\u2b50 TOGGLE + PROOF: flip `Include Address` (BY FIELD ID) and confirm it changed", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
let el = f.querySelector('#includeAddress, input[name="includeAddress"]');
if (!el) {
  const boxes = [...f.querySelectorAll('input[type=checkbox]')];
  if (boxes.length !== 2) return false;   // shape changed — refuse to guess
  el = boxes[1];
}
const before = el.checked;
el.click();                // real click event — React's onChange fires
return el.checked !== before;`, 30000);
  });
  await run.step("DIAG: the `includeAddress` field id resolved (if this fails, the toggle above fell back to position and the id needs re-reading)", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
return !!f.querySelector('#includeAddress, input[name="includeAddress"]');`, 15000);
  });
  await run.step("Let the form revalidate", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 VALIDITY 2/2: the invariant still holds after a real toggle", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const boxes = [...f.querySelectorAll('input[type=checkbox]')];
if (boxes.length < 2) return false;
const anyChecked = boxes.some(b => b.checked);
const btn = document.querySelector('button[form="mobile-geolocate"]')
  || [...document.querySelectorAll('button')].find(b => (b.textContent || '').trim() === 'Submit');
if (!btn) return false;
// SubmitButton.tsx: type={isValid ? 'submit' : 'button'}, isValid = includeGis || includeAddress
return anyChecked ? btn.type === 'submit' : btn.type === 'button';
`, 30000);
  });
  await run.step("Escape \u2014 close WITHOUT submitting", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: the modal is gone and nothing was submitted", {always: true}, async () => {
    await assertPageLacks(page, `Updating Asset Location`, 30000);
  });
  await run.step("OFFLINE LEG: define an own `onLine` getter (false) \u2014 no `offline` event, so the control stays enabled", {}, async () => {
    await assertFromJavascript(page, `Object.defineProperty(navigator, 'onLine', { configurable: true, get: function () { return false; } });
return navigator.onLine === false;`, 15000);
  });
  await run.step("Tap the geolocate control again (property offline)", {}, async () => {
    await click(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-ActionIcon-root ")][.//*[@data-icon="location-crosshairs" or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")]])[1]`, 30000);
  });
  await run.step("The modal opened again \u2014 \"Updating Asset Location\"", {}, async () => {
    await assertPageContains(page, `Updating Asset Location`, 60000);
  });
  await run.step("\u2b50 OFFLINE FORM: `Location details are unavailable offline.` + `Submit to update latitude/longitude.` in `#mobile-geolocate-offline` \u2014 and the online form is NOT there", {}, async () => {
    await assertFromJavascript(page, `const off = document.getElementById('mobile-geolocate-offline');
const t = off ? (off.textContent || '') : '';
return t.includes('Location details are unavailable offline.')
  && t.includes('Submit to update latitude/longitude.')
  && !document.getElementById('mobile-geolocate');`, 30000);
  });
  await run.step("Escape \u2014 close the offline form WITHOUT submitting", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORE: remove the `onLine` getter", {always: true}, async () => {
    await assertFromJavascript(page, `try { delete navigator.onLine; } catch (e) {}
return navigator.onLine === true;`, 15000);
  });
  await run.step("RESTORED: the modal is gone again, nothing submitted", {always: true}, async () => {
    await assertPageLacks(page, `Updating Asset Location`, 30000);
  });
  await run.step("RESTORED: both stubs removed", {always: true}, async () => {
    await assertFromJavascript(page, `if (window.__ddOrigFetch) { window.fetch = window.__ddOrigFetch; delete window.__ddOrigFetch; }
if (window.__ddOrigGeo) { navigator.geolocation.getCurrentPosition = window.__ddOrigGeo; delete window.__ddOrigGeo; }
return !window.__ddOrigFetch && !window.__ddOrigGeo;
`, 30000);
  });
  run.finish();
}
