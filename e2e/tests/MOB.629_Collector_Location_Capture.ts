// Generated from Mobile/dd_tests_mobile/MOB.629_Collector_Location_Capture.json by to_playwright.py — do not edit by hand yet.
// MOB.629_Collector_Location_Capture

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, click, wait } from '../support/dd';

export async function mob629(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the asset collector", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the collector to load its lookup cache", {}, async () => {
    await wait(page, 15);
  });
  await run.step("The collector page rendered", {}, async () => {
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, 30000);
  });
  await run.step("Open the new-asset form (affixed + button)", {}, async () => {
    await click(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`, 30000);
  });
  await run.step("The new-asset form opened", {}, async () => {
    await assertElementPresent(page, `//button[@form="asset-collector"]`, 30000);
  });
  await run.step("BASELINE: the Location row reads exactly `No location captured.`, with a geolocate button and NO `Clear location`", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
const label = [...f.querySelectorAll('p')].find(p => (p.textContent || '').trim() === 'Location');
const grp = label && label.closest('[class*="mantine-Group-root"]');
if (!grp) return false;
const after = [];
for (let n = grp.nextElementSibling; n && n.tagName === 'P'; n = n.nextElementSibling)
  after.push((n.textContent || '').trim());
const clear = !!grp.querySelector('button[aria-label="Clear location"]');
const geo = grp.querySelector('svg[data-icon="location-crosshairs"]');
return after.length === 1 && after[0] === 'No location captured.' && !!geo && !clear;`, 30000);
  });
  await run.step("Install the geolocation + Mapbox stubs (after the last `go()` \u2014 they do not survive a navigation)", {}, async () => {
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
`, 15000);
  });
  await run.step("Click the Location row's geolocate button", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
const label = [...f.querySelectorAll('p')].find(p => (p.textContent || '').trim() === 'Location');
const grp = label && label.closest('[class*="mantine-Group-root"]');
if (!grp) return false;
const after = [];
for (let n = grp.nextElementSibling; n && n.tagName === 'P'; n = n.nextElementSibling)
  after.push((n.textContent || '').trim());
const clear = !!grp.querySelector('button[aria-label="Clear location"]');
const geo = grp.querySelector('svg[data-icon="location-crosshairs"]');
const b = geo && geo.closest('[class*="mantine-ActionIcon-root"]');
if (!b) return false;
b.click();
return true;`, 30000);
  });
  await run.step("The `Asset Location` modal opened with the location form", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => x.querySelector('#mobile-geolocate'));
return !!m && (m.textContent || '').includes('Asset Location');`, 30000);
  });
  await run.step("The form is prefilled from the (stubbed) geocode \u2014 address `1600 Main Street`, city `Chicago`", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
if (!f) return false;
const v = [...f.querySelectorAll('input')].map(i => i.value);
return v.includes('1600 Main Street') && v.includes('Chicago');`, 30000);
  });
  await run.step("Both `Include GIS` and `Include Address` start ON (no type picked yet, so GIS is allowed), so Submit is armed", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('mobile-geolocate');
const boxes = f ? [...f.querySelectorAll('input[type=checkbox]')] : [];
const b = document.querySelector('button[form="mobile-geolocate"]');
return boxes.length === 2 && boxes.every(x => x.checked) && !!b && b.type === 'submit';`, 20000);
  });
  await run.step("Submit the location (it goes into the form's reducer \u2014 nothing is written)", {}, async () => {
    await click(page, `//button[@form="mobile-geolocate"]`, 30000);
  });
  await run.step("The `Asset Location` modal closed, and the new-asset form is still open", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => x.querySelector('#mobile-geolocate'));
return !m && !!document.getElementById('asset-collector');`, 20000);
  });
  await run.step("\u2b50 CAPTURED: the Location row reads `1600 Main Street, Chicago, IL, 60601` over `41.878100, -87.629800` \u2014 the placeholder is gone and `Clear location` appeared", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
const label = [...f.querySelectorAll('p')].find(p => (p.textContent || '').trim() === 'Location');
const grp = label && label.closest('[class*="mantine-Group-root"]');
if (!grp) return false;
const after = [];
for (let n = grp.nextElementSibling; n && n.tagName === 'P'; n = n.nextElementSibling)
  after.push((n.textContent || '').trim());
const clear = !!grp.querySelector('button[aria-label="Clear location"]');
const geo = grp.querySelector('svg[data-icon="location-crosshairs"]');
return after.length === 2 && after[0] === '1600 Main Street, Chicago, IL, 60601' && after[1] === '41.878100, -87.629800' && clear;`, 30000);
  });
  await run.step("Click `Clear location`", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
const label = [...f.querySelectorAll('p')].find(p => (p.textContent || '').trim() === 'Location');
const grp = label && label.closest('[class*="mantine-Group-root"]');
if (!grp) return false;
const after = [];
for (let n = grp.nextElementSibling; n && n.tagName === 'P'; n = n.nextElementSibling)
  after.push((n.textContent || '').trim());
const clear = !!grp.querySelector('button[aria-label="Clear location"]');
const geo = grp.querySelector('svg[data-icon="location-crosshairs"]');
const c = grp.querySelector('button[aria-label="Clear location"]');
if (!c) return false;
c.click();
return true;`, 20000);
  });
  await run.step("\u2b50 CLEARED: the Location row reads exactly `No location captured.`, with a geolocate button and NO `Clear location`", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
const label = [...f.querySelectorAll('p')].find(p => (p.textContent || '').trim() === 'Location');
const grp = label && label.closest('[class*="mantine-Group-root"]');
if (!grp) return false;
const after = [];
for (let n = grp.nextElementSibling; n && n.tagName === 'P'; n = n.nextElementSibling)
  after.push((n.textContent || '').trim());
const clear = !!grp.querySelector('button[aria-label="Clear location"]');
const geo = grp.querySelector('svg[data-icon="location-crosshairs"]');
return after.length === 1 && after[0] === 'No location captured.' && !!geo && !clear;`, 30000);
  });
  await run.step("Remove the stubs", {always: true}, async () => {
    await assertFromJavascript(page, `if (window.__ddOrigFetch) { window.fetch = window.__ddOrigFetch; delete window.__ddOrigFetch; }
if (window.__ddOrigGeo) { navigator.geolocation.getCurrentPosition = window.__ddOrigGeo; delete window.__ddOrigGeo; }
return !window.__ddOrigFetch && !window.__ddOrigGeo;
`, 15000);
  });
  await run.step("Close the form with its X \u2014 DISCARDED, never submitted", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`, 30000);
  });
  await run.step("RESTORED: the form is gone, so nothing was created", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.getElementById('asset-collector');`, 20000);
  });
  run.finish();
}
