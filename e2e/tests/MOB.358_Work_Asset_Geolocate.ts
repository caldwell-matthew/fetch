// Generated from Mobile/dd_tests_mobile/MOB.358_Work_Asset_Geolocate.json by to_playwright.py — do not edit by hand yet.
// MOB.358_Work_Asset_Geolocate

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';

export async function mob358(page: Page): Promise<void> {
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
    // GATE: the detail data arrived (tab strip)
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
    // Open the "Assets" tab
    await el(page, `//*[@role="tab"][normalize-space(.)="Assets"]`).click({ timeout: 30000 });
    // Wait for the asset list
    await wait(page, 3);
    // "Assets" is now the active tab
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Assets"][@data-active="true"]`, 30000);
    // FIXTURE GUARD: an asset row renders the geolocate control
    await assertElementPresent(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[@data-icon="location-crosshairs" or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")])[1]`, 60000);
    // The control is ENABLED — it gates on `online`, and we are online
    await assertFromJavascript(page, `const icon = document.querySelector('[data-icon="location-crosshairs"]');
if (!icon) return false;
const root = icon.closest('.mantine-ActionIcon-root');
if (!root) return false;
return !root.hasAttribute('data-disabled') && navigator.onLine === true;`, 30000);
    // Install the geolocation + Mapbox stubs (must follow the last go() — G7)
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
    // Tap the geolocate control (click the ActionIcon ROOT — MOB.911)
    await el(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-ActionIcon-root ")][.//*[@data-icon="location-crosshairs" or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")]])[1]`).click({ timeout: 30000 });
    // The modal opened — "Updating Asset Location"
    await assertPageContains(page, `Updating Asset Location`, 60000);
    // The location form mounted
    await assertElementPresent(page, `//form[@id="mobile-geolocate"]`, 60000);
    // …with its `Include GIS` control
    await assertPageContains(page, `Include GIS`, 30000);
    // …and its `Include Address` control
    await assertPageContains(page, `Include Address`, 30000);
    // ⭐ THE STUBBED GEOCODE REACHED THE FORM — address, city and postcode
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const vals = [...f.querySelectorAll('input')].map(i => (i.value || '').trim());
const joined = vals.join('|');
// address = \`\${streetNumber} \${street}\` per AssetGeolocate defaultValues
return joined.includes('1600 Main Street')
  && joined.includes('Chicago')
  && joined.includes('60601');`, 30000);
    // …and the region/country short_codes were unwrapped (US-IL -> IL, us -> US)
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const joined = [...f.querySelectorAll('input')].map(i => (i.value || '').trim()).join('|');
return /(^|\\|)IL(\\||$)/.test(joined) && /(^|\\|)US(\\||$)/.test(joined);`, 30000);
    // ⭐ VALIDITY 1/2: Submit is `submit` iff some include-box is checked
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
    // CHECKBOX GUARD: the form has exactly two include-boxes, so [2] is unambiguous
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
return f.querySelectorAll('input[type=checkbox]').length === 2;`, 30000);
    // ⭐ TOGGLE + PROOF: flip `Include Address` (BY FIELD ID) and confirm it changed
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
    await optional("DIAG: the `includeAddress` field id resolved (if this fails, the toggle above fell back to position and the id needs re-reading)", async () => {
      await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
return !!f.querySelector('#includeAddress, input[name="includeAddress"]');`, 15000);
    });
    // Let the form revalidate
    await wait(page, 2);
    // ⭐ VALIDITY 2/2: the invariant still holds after a real toggle
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
    // OFFLINE LEG: define an own `onLine` getter (false) — no `offline` event, so the control stays enabled
    await assertFromJavascript(page, `Object.defineProperty(navigator, 'onLine', { configurable: true, get: function () { return false; } });
return navigator.onLine === false;`, 15000);
    // Tap the geolocate control again (property offline)
    await el(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-ActionIcon-root ")][.//*[@data-icon="location-crosshairs" or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")]])[1]`).click({ timeout: 30000 });
    // The modal opened again — "Updating Asset Location"
    await assertPageContains(page, `Updating Asset Location`, 60000);
    // ⭐ OFFLINE FORM: `Location details are unavailable offline.` + `Submit to update latitude/longitude.` in `#mobile-geolocate-offline` — and the online form is NOT there
    await assertFromJavascript(page, `const off = document.getElementById('mobile-geolocate-offline');
const t = off ? (off.textContent || '') : '';
return t.includes('Location details are unavailable offline.')
  && t.includes('Submit to update latitude/longitude.')
  && !document.getElementById('mobile-geolocate');`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Escape — close WITHOUT submitting
    await page.keyboard.press(`Escape`);
    // Let the modal close
    await wait(page, 2);
    // RESTORED: the modal is gone and nothing was submitted
    await assertPageLacks(page, `Updating Asset Location`, 30000);
    // Escape — close the offline form WITHOUT submitting
    await page.keyboard.press(`Escape`);
    // Let the modal close
    await wait(page, 2);
    // RESTORE: remove the `onLine` getter
    await assertFromJavascript(page, `try { delete navigator.onLine; } catch (e) {}
return navigator.onLine === true;`, 15000);
    // RESTORED: the modal is gone again, nothing submitted
    await assertPageLacks(page, `Updating Asset Location`, 30000);
    // RESTORED: both stubs removed
    await assertFromJavascript(page, `if (window.__ddOrigFetch) { window.fetch = window.__ddOrigFetch; delete window.__ddOrigFetch; }
if (window.__ddOrigGeo) { navigator.geolocation.getCurrentPosition = window.__ddOrigGeo; delete window.__ddOrigGeo; }
return !window.__ddOrigFetch && !window.__ddOrigGeo;
`, 30000);
  }
}
