// Generated from Mobile/dd_tests_mobile/MOB.359_Work_Asset_Geolocate_Submit.json by to_playwright.py — do not edit by hand yet.
// MOB.359_Work_Asset_Geolocate_Submit

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, el, optional, wait } from '../support/dd';

export async function mob359(page: Page): Promise<void> {
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
    // "Assets" is now the active tab
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Assets"][@data-active="true"]`, 30000);
    // PREMISE (server): Pump 0102's address fields are at rest (`230 North Alexander Street` · New Orleans · LA · 70119 · US) and so are its coordinates
    await assertFromJavascript(page, `const K = "__dd359_asset", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((a => !!a && a.address === '230 North Alexander Street' && a.city === 'New Orleans' && a.postalCode === '70119' && !!a.state && a.state.id === 'LA' && !!a.countryCode && a.countryCode.id === 'US')(data.asset) && (a => !!a && Math.abs(Number(a.latitude) - (29.9782827)) < 1e-7 && Math.abs(Number(a.longitude) - (-90.1025785)) < 1e-7 && a.latitude !== null && a.longitude !== null)(data.asset)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { asset(id: $id) { id name address city postalCode latitude longitude state { id } countryCode { id } } }", variables: {"id": "oB5BUN1Es1Jctw8FVYwYBh"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // SCHEMA WARM: open `Add Asset` (its picker queries the Asset schema)
    await el(page, `//button[normalize-space(.)="Add Asset"]`).click({ timeout: 30000 });
    // SCHEMA WARM: choose `Add Existing Asset`
    await el(page, `//label[contains(concat(" ", normalize-space(@class), " "), " mantine-SegmentedControl-label ")][normalize-space(.)="Add Existing Asset"]`).click({ timeout: 30000 });
    // SCHEMA WARM: the picker mounted (nothing is searched or picked)
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@name="asset-search"]`, 60000);
    // SCHEMA WARM: close the picker (its CloseButton beside the segmented control)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-SegmentedControl-root ")]/following-sibling::button[contains(concat(" ", normalize-space(@class), " "), " mantine-CloseButton-root ")]`).click({ timeout: 30000 });
    // SCHEMA WARM: the picker closed and the page is still alive
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.querySelector('input[name="asset-search"]');`, 30000);
    // GATE: Pump 0102's row now renders the geolocate control (the schema is cached)
    await assertElementPresent(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[@data-icon="location-crosshairs" or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")])[1]`, 60000);
    // Escape any open modal first
    await page.keyboard.press(`Escape`);
    // Let it close
    await wait(page, 1);
    // Install the geolocation + Mapbox stubs — the geocode answers the written address (after the last go() — G7)
    await assertFromJavascript(page, `if (!window.__ddOrigFetch) window.__ddOrigFetch = window.fetch;
if (!window.__ddOrigGeo) window.__ddOrigGeo = navigator.geolocation.getCurrentPosition;
window.__dd359Features = [{place_type:['address'],text:'DD MOB Test Street',address:'359',properties:{}},{place_type:['place'],text:'Metairie',properties:{}},{place_type:['region'],text:'Louisiana',properties:{short_code:'US-LA'}},{place_type:['country'],text:'United States',properties:{short_code:'us'}},{place_type:['postcode'],text:'70001',properties:{}}];
navigator.geolocation.getCurrentPosition = function (ok) {
  ok({ coords: { latitude: 29.9782827, longitude: -90.1025785, accuracy: 5 } });
};
// Mapbox ONLY — Apollo and the /graphql reads use fetch, so everything else passes through.
window.fetch = function (input) {
  var u = typeof input === 'string' ? input : ((input && input.url) || '');
  if (u.indexOf('api.mapbox.com/geocoding') !== -1) {
    return Promise.resolve(new Response(JSON.stringify({ features: window.__dd359Features }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  }
  return window.__ddOrigFetch.apply(window, arguments);
};
return typeof window.__ddOrigFetch === 'function' && window.__dd359Features[0].address === '359';`, 30000);
    // Tap Pump 0102's geolocate control (the ActionIcon ROOT — MOB.911)
    await el(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-ActionIcon-root ")][.//*[@data-icon="location-crosshairs" or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")]])[1]`).click({ timeout: 30000 });
    // The modal opened — "Updating Asset Location"
    await assertPageContains(page, `Updating Asset Location`, 60000);
    // The location form mounted
    await assertElementPresent(page, `//form[@id="mobile-geolocate"]`, 60000);
    // The form holds the stubbed written address — `359 DD MOB Test Street` · Metairie · LA · 70001 · US
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const vals = [...f.querySelectorAll('input')].map(i => (i.value || '').trim());
return vals.includes('359 DD MOB Test Street') && vals.includes('Metairie') && vals.includes('70001')
  && vals.includes('LA') && vals.includes('US');`, 30000);
    // Untick `Include GIS` BY FIELD ID and prove it off, with `Include Address` on, in the same step
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const gis = f.querySelector('input#includeGis'), adr = f.querySelector('input#includeAddress');
if (!gis || !adr || gis.type !== 'checkbox' || adr.type !== 'checkbox') return false;
if (gis.checked) gis.click();
return gis.checked === false && adr.checked === true;`, 30000);
    // Let the form revalidate
    await wait(page, 1);
    // Submit is ARMED (`type="submit"`) with GIS off and Address on
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
const gis = f && f.querySelector('input#includeGis'), adr = f && f.querySelector('input#includeAddress');
const b = document.querySelector('button[form="mobile-geolocate"]');
return !!gis && !gis.checked && !!adr && adr.checked && !!b && b.type === 'submit';`, 30000);
    // Submit the written address
    await el(page, `//button[@form="mobile-geolocate"]`).click({ timeout: 30000 });
    await optional("The `Asset location updated` toast (optional: it fires before the answer)", async () => {
      await assertPageContains(page, `Asset location updated`, 10000);
    });
    // The location form is GONE and the page is still alive (not the proof)
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.getElementById('mobile-geolocate');`, 30000);
    // ⭐ SERVER: Pump 0102 now holds `359 DD MOB Test Street` · Metairie · LA · 70001 · US — and its coordinates are UNCHANGED (no GIS write)
    await assertFromJavascript(page, `const K = "__dd359_asset", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((a => !!a && a.address === '359 DD MOB Test Street' && a.city === 'Metairie' && a.postalCode === '70001' && !!a.state && a.state.id === 'LA' && !!a.countryCode && a.countryCode.id === 'US')(data.asset) && (a => !!a && Math.abs(Number(a.latitude) - (29.9782827)) < 1e-7 && Math.abs(Number(a.longitude) - (-90.1025785)) < 1e-7 && a.latitude !== null && a.longitude !== null)(data.asset)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { asset(id: $id) { id name address city postalCode latitude longitude state { id } countryCode { id } } }", variables: {"id": "oB5BUN1Es1Jctw8FVYwYBh"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd359_asset', '__dd359_asset:inflight', '__dd359_asset:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd359_asset', '__dd359_asset:inflight', '__dd359_asset:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Escape any open modal first
    await page.keyboard.press(`Escape`);
    // Let it close
    await wait(page, 1);
    // Install the geolocation + Mapbox stubs — the geocode answers the rest address (after the last go() — G7)
    await assertFromJavascript(page, `if (!window.__ddOrigFetch) window.__ddOrigFetch = window.fetch;
if (!window.__ddOrigGeo) window.__ddOrigGeo = navigator.geolocation.getCurrentPosition;
window.__dd359Features = [{place_type:['address'],text:'North Alexander Street',address:'230',properties:{}},{place_type:['place'],text:'New Orleans',properties:{}},{place_type:['region'],text:'Louisiana',properties:{short_code:'US-LA'}},{place_type:['country'],text:'United States',properties:{short_code:'us'}},{place_type:['postcode'],text:'70119',properties:{}}];
navigator.geolocation.getCurrentPosition = function (ok) {
  ok({ coords: { latitude: 29.9782827, longitude: -90.1025785, accuracy: 5 } });
};
// Mapbox ONLY — Apollo and the /graphql reads use fetch, so everything else passes through.
window.fetch = function (input) {
  var u = typeof input === 'string' ? input : ((input && input.url) || '');
  if (u.indexOf('api.mapbox.com/geocoding') !== -1) {
    return Promise.resolve(new Response(JSON.stringify({ features: window.__dd359Features }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  }
  return window.__ddOrigFetch.apply(window, arguments);
};
return typeof window.__ddOrigFetch === 'function' && window.__dd359Features[0].address === '230';`, 30000);
    // Tap Pump 0102's geolocate control (the ActionIcon ROOT — MOB.911)
    await el(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-ActionIcon-root ")][.//*[@data-icon="location-crosshairs" or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")]])[1]`).click({ timeout: 30000 });
    // The modal opened — "Updating Asset Location"
    await assertPageContains(page, `Updating Asset Location`, 60000);
    // The location form mounted
    await assertElementPresent(page, `//form[@id="mobile-geolocate"]`, 60000);
    // The form holds the stubbed rest address — `230 North Alexander Street` · New Orleans · LA · 70119 · US
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const vals = [...f.querySelectorAll('input')].map(i => (i.value || '').trim());
return vals.includes('230 North Alexander Street') && vals.includes('New Orleans') && vals.includes('70119')
  && vals.includes('LA') && vals.includes('US');`, 30000);
    // Untick `Include GIS` BY FIELD ID and prove it off, with `Include Address` on, in the same step
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const gis = f.querySelector('input#includeGis'), adr = f.querySelector('input#includeAddress');
if (!gis || !adr || gis.type !== 'checkbox' || adr.type !== 'checkbox') return false;
if (gis.checked) gis.click();
return gis.checked === false && adr.checked === true;`, 30000);
    // Let the form revalidate
    await wait(page, 1);
    // Submit is ARMED (`type="submit"`) with GIS off and Address on
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
const gis = f && f.querySelector('input#includeGis'), adr = f && f.querySelector('input#includeAddress');
const b = document.querySelector('button[form="mobile-geolocate"]');
return !!gis && !gis.checked && !!adr && adr.checked && !!b && b.type === 'submit';`, 30000);
    // Submit the rest address
    await el(page, `//button[@form="mobile-geolocate"]`).click({ timeout: 30000 });
    await optional("The `Asset location updated` toast (optional: it fires before the answer)", async () => {
      await assertPageContains(page, `Asset location updated`, 10000);
    });
    // The location form is GONE and the page is still alive (not the proof)
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.getElementById('mobile-geolocate');`, 30000);
    // ⭐ RESTORED (server): the UI wrote the rest address fields back, coordinates unchanged
    await assertFromJavascript(page, `const K = "__dd359_asset", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((a => !!a && a.address === '230 North Alexander Street' && a.city === 'New Orleans' && a.postalCode === '70119' && !!a.state && a.state.id === 'LA' && !!a.countryCode && a.countryCode.id === 'US')(data.asset) && (a => !!a && Math.abs(Number(a.latitude) - (29.9782827)) < 1e-7 && Math.abs(Number(a.longitude) - (-90.1025785)) < 1e-7 && a.latitude !== null && a.longitude !== null)(data.asset)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { asset(id: $id) { id name address city postalCode latitude longitude state { id } countryCode { id } } }", variables: {"id": "oB5BUN1Es1Jctw8FVYwYBh"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd359_asset', '__dd359_asset:inflight', '__dd359_asset:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Escape — leave no modal open
    await page.keyboard.press(`Escape`);
    // RESTORED: both stubs removed
    await assertFromJavascript(page, `if (window.__ddOrigFetch) { window.fetch = window.__ddOrigFetch; delete window.__ddOrigFetch; }
if (window.__ddOrigGeo) { navigator.geolocation.getCurrentPosition = window.__ddOrigGeo; delete window.__ddOrigGeo; }
delete window.__dd359Features;
return !window.__ddOrigFetch && !window.__ddOrigGeo && !window.__dd359Features;`, 30000);
    // BACKSTOP: if an address field is not at rest, send `updateAsset` with the FIXED rest address fields — never latitude/longitude/centroid (reads first; sends nothing when the UI restore landed)
    await assertFromJavascript(page, `const K = '__dd359_net';
const st = sessionStorage.getItem(K);
if (st === 'done') return true;
if (st === 'asking') return false;
sessionStorage.setItem(K, 'asking');
const post = body => window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' }, body: JSON.stringify(body) });
post({ query: 'query($id: ID!) { asset(id: $id) { id name address city postalCode latitude longitude state { id } countryCode { id } } }', variables: { id: 'oB5BUN1Es1Jctw8FVYwYBh' } })
  .then(r => r.json())
  .then(j => {
    if ((a => !!a && a.address === '230 North Alexander Street' && a.city === 'New Orleans' && a.postalCode === '70119' && !!a.state && a.state.id === 'LA' && !!a.countryCode && a.countryCode.id === 'US')(j && j.data && j.data.asset)) { sessionStorage.setItem(K, 'done'); return; }
    sessionStorage.setItem(K + ':sent', '1');
    return post({ query: 'mutation($id: ID!, $data: UpdateAssetInput!) { updateAsset(id: $id, data: $data) { id } }', variables: { id: 'oB5BUN1Es1Jctw8FVYwYBh', data: { address: '230 North Alexander Street', city: 'New Orleans', postalCode: '70119', state: 'LA', countryCode: 'US' } } })
      .then(() => sessionStorage.setItem(K, 'done'));
  })
  .catch(() => sessionStorage.setItem(K, 'done'));
return false;`, 45000);
    // Remove the backstop's sessionStorage keys
    await assertFromJavascript(page, `['__dd359_net', '__dd359_net:sent'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // ⭐ AT REST (server): Pump 0102's address fields and coordinates are the fixed rest values
    await assertFromJavascript(page, `const K = "__dd359_asset", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((a => !!a && a.address === '230 North Alexander Street' && a.city === 'New Orleans' && a.postalCode === '70119' && !!a.state && a.state.id === 'LA' && !!a.countryCode && a.countryCode.id === 'US')(data.asset) && (a => !!a && Math.abs(Number(a.latitude) - (29.9782827)) < 1e-7 && Math.abs(Number(a.longitude) - (-90.1025785)) < 1e-7 && a.latitude !== null && a.longitude !== null)(data.asset)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { asset(id: $id) { id name address city postalCode latitude longitude state { id } countryCode { id } } }", variables: {"id": "oB5BUN1Es1Jctw8FVYwYBh"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd359_asset', '__dd359_asset:inflight', '__dd359_asset:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  }
}
