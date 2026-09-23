// Generated from Mobile/dd_tests_mobile/MOB.359_Work_Asset_Geolocate_Submit.json by to_playwright.py — do not edit by hand yet.
// MOB.359_Work_Asset_Geolocate_Submit

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, click, press, wait } from '../support/dd';

export async function mob359(page: Page): Promise<void> {
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
  await run.step("\"Assets\" is now the active tab", {}, async () => {
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Assets"][@data-active="true"]`, 30000);
  });
  await run.step("PREMISE (server): Pump 0102's address fields are at rest (`230 North Alexander Street` \u00b7 New Orleans \u00b7 LA \u00b7 70119 \u00b7 US) and so are its coordinates", {}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd359_asset', '__dd359_asset:inflight', '__dd359_asset:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("SCHEMA WARM: open `Add Asset` (its picker queries the Asset schema)", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add Asset"]`, 30000);
  });
  await run.step("SCHEMA WARM: choose `Add Existing Asset`", {}, async () => {
    await click(page, `//label[contains(concat(" ", normalize-space(@class), " "), " mantine-SegmentedControl-label ")][normalize-space(.)="Add Existing Asset"]`, 30000);
  });
  await run.step("SCHEMA WARM: the picker mounted (nothing is searched or picked)", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@name="asset-search"]`, 60000);
  });
  await run.step("SCHEMA WARM: close the picker (its CloseButton beside the segmented control)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-SegmentedControl-root ")]/following-sibling::button[contains(concat(" ", normalize-space(@class), " "), " mantine-CloseButton-root ")]`, 30000);
  });
  await run.step("SCHEMA WARM: the picker closed and the page is still alive", {}, async () => {
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.querySelector('input[name="asset-search"]');`, 30000);
  });
  await run.step("GATE: Pump 0102's row now renders the geolocate control (the schema is cached)", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[@data-icon="location-crosshairs" or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")])[1]`, 60000);
  });
  await run.step("Escape any open modal first", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let it close", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Install the geolocation + Mapbox stubs \u2014 the geocode answers the written address (after the last go() \u2014 G7)", {}, async () => {
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
  });
  await run.step("Tap Pump 0102's geolocate control (the ActionIcon ROOT \u2014 MOB.911)", {}, async () => {
    await click(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-ActionIcon-root ")][.//*[@data-icon="location-crosshairs" or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")]])[1]`, 30000);
  });
  await run.step("The modal opened \u2014 \"Updating Asset Location\"", {}, async () => {
    await assertPageContains(page, `Updating Asset Location`, 60000);
  });
  await run.step("The location form mounted", {}, async () => {
    await assertElementPresent(page, `//form[@id="mobile-geolocate"]`, 60000);
  });
  await run.step("The form holds the stubbed written address \u2014 `359 DD MOB Test Street` \u00b7 Metairie \u00b7 LA \u00b7 70001 \u00b7 US", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const vals = [...f.querySelectorAll('input')].map(i => (i.value || '').trim());
return vals.includes('359 DD MOB Test Street') && vals.includes('Metairie') && vals.includes('70001')
  && vals.includes('LA') && vals.includes('US');`, 30000);
  });
  await run.step("Untick `Include GIS` BY FIELD ID and prove it off, with `Include Address` on, in the same step", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const gis = f.querySelector('input#includeGis'), adr = f.querySelector('input#includeAddress');
if (!gis || !adr || gis.type !== 'checkbox' || adr.type !== 'checkbox') return false;
if (gis.checked) gis.click();
return gis.checked === false && adr.checked === true;`, 30000);
  });
  await run.step("Let the form revalidate", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Submit is ARMED (`type=\"submit\"`) with GIS off and Address on", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
const gis = f && f.querySelector('input#includeGis'), adr = f && f.querySelector('input#includeAddress');
const b = document.querySelector('button[form="mobile-geolocate"]');
return !!gis && !gis.checked && !!adr && adr.checked && !!b && b.type === 'submit';`, 30000);
  });
  await run.step("Submit the written address", {}, async () => {
    await click(page, `//button[@form="mobile-geolocate"]`, 30000);
  });
  await run.step("The `Asset location updated` toast (optional: it fires before the answer)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Asset location updated`, 10000);
  });
  await run.step("The location form is GONE and the page is still alive (not the proof)", {}, async () => {
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.getElementById('mobile-geolocate');`, 30000);
  });
  await run.step("\u2b50 SERVER: Pump 0102 now holds `359 DD MOB Test Street` \u00b7 Metairie \u00b7 LA \u00b7 70001 \u00b7 US \u2014 and its coordinates are UNCHANGED (no GIS write)", {}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd359_asset', '__dd359_asset:inflight', '__dd359_asset:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Escape any open modal first", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let it close", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("Install the geolocation + Mapbox stubs \u2014 the geocode answers the rest address (after the last go() \u2014 G7)", {always: true}, async () => {
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
  });
  await run.step("Tap Pump 0102's geolocate control (the ActionIcon ROOT \u2014 MOB.911)", {always: true}, async () => {
    await click(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-ActionIcon-root ")][.//*[@data-icon="location-crosshairs" or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")]])[1]`, 30000);
  });
  await run.step("The modal opened \u2014 \"Updating Asset Location\"", {always: true}, async () => {
    await assertPageContains(page, `Updating Asset Location`, 60000);
  });
  await run.step("The location form mounted", {always: true}, async () => {
    await assertElementPresent(page, `//form[@id="mobile-geolocate"]`, 60000);
  });
  await run.step("The form holds the stubbed rest address \u2014 `230 North Alexander Street` \u00b7 New Orleans \u00b7 LA \u00b7 70119 \u00b7 US", {always: true}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const vals = [...f.querySelectorAll('input')].map(i => (i.value || '').trim());
return vals.includes('230 North Alexander Street') && vals.includes('New Orleans') && vals.includes('70119')
  && vals.includes('LA') && vals.includes('US');`, 30000);
  });
  await run.step("Untick `Include GIS` BY FIELD ID and prove it off, with `Include Address` on, in the same step", {always: true}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const gis = f.querySelector('input#includeGis'), adr = f.querySelector('input#includeAddress');
if (!gis || !adr || gis.type !== 'checkbox' || adr.type !== 'checkbox') return false;
if (gis.checked) gis.click();
return gis.checked === false && adr.checked === true;`, 30000);
  });
  await run.step("Let the form revalidate", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("Submit is ARMED (`type=\"submit\"`) with GIS off and Address on", {always: true}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
const gis = f && f.querySelector('input#includeGis'), adr = f && f.querySelector('input#includeAddress');
const b = document.querySelector('button[form="mobile-geolocate"]');
return !!gis && !gis.checked && !!adr && adr.checked && !!b && b.type === 'submit';`, 30000);
  });
  await run.step("Submit the rest address", {always: true}, async () => {
    await click(page, `//button[@form="mobile-geolocate"]`, 30000);
  });
  await run.step("The `Asset location updated` toast (optional: it fires before the answer)", {always: true, allow: 'ignore'}, async () => {
    await assertPageContains(page, `Asset location updated`, 10000);
  });
  await run.step("The location form is GONE and the page is still alive (not the proof)", {always: true}, async () => {
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.getElementById('mobile-geolocate');`, 30000);
  });
  await run.step("\u2b50 RESTORED (server): the UI wrote the rest address fields back, coordinates unchanged", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd359_asset', '__dd359_asset:inflight', '__dd359_asset:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Escape \u2014 leave no modal open", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("RESTORED: both stubs removed", {always: true}, async () => {
    await assertFromJavascript(page, `if (window.__ddOrigFetch) { window.fetch = window.__ddOrigFetch; delete window.__ddOrigFetch; }
if (window.__ddOrigGeo) { navigator.geolocation.getCurrentPosition = window.__ddOrigGeo; delete window.__ddOrigGeo; }
delete window.__dd359Features;
return !window.__ddOrigFetch && !window.__ddOrigGeo && !window.__dd359Features;`, 30000);
  });
  await run.step("BACKSTOP: if an address field is not at rest, send `updateAsset` with the FIXED rest address fields \u2014 never latitude/longitude/centroid (reads first; sends nothing when the UI restore landed)", {always: true}, async () => {
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
  });
  await run.step("Remove the backstop's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd359_net', '__dd359_net:sent'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\u2b50 AT REST (server): Pump 0102's address fields and coordinates are the fixed rest values", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd359_asset', '__dd359_asset:inflight', '__dd359_asset:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  run.finish();
}
