// Generated from legacy/Mobile/dd_tests_mobile/MOB.123_Map_Switch_Map.json by to_playwright.py — do not edit by hand yet.
// MOB.123_Map_Switch_Map

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, wait } from '../support/dd';

export async function mob123(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile map", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/map`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the map begin initialising", {}, async () => {
    await wait(page, 5);
  });
  await run.step("Test the \"Map\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Map")]`, `Map`, 30000);
  });
  await run.step("The Mapbox WebGL canvas rendered", {}, async () => {
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
  });
  await run.step("CAPTURE: `mobile-map-id` holds the map on screen (written on mount from the user's default map)", {}, async () => {
    await assertFromJavascript(page, `let stored = null;
try { stored = JSON.parse(sessionStorage.getItem('mobile-map-id') || 'null'); }
catch (e) { return false; }
if (typeof stored !== 'string' || !stored) return false;
window.__ddMapBefore = stored;
return true;`, 30000);
  });
  await run.step("OPEN: the `Switch Map` control is ENABLED \u2014 the org has \u2265 2 maps", {}, async () => {
    await assertFromJavascript(page, `const b = document.querySelector('button[aria-label="Switch Map"]');
return !!b && !b.disabled;`, 60000);
  });
  await run.step("OPEN: click `Switch Map`", {}, async () => {
    await click(page, `//button[@aria-label="Switch Map"]`, 30000);
  });
  await run.step("Let the picker open", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 OPEN: the `Select a map` modal holds the STORED map, by id, and names it", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
if (!m) return false;
const hidden = m.querySelector('input[type="hidden"]');
const shown = m.querySelector('input:not([type="hidden"])');
return !!window.__ddMapBefore && !!hidden && hidden.value === window.__ddMapBefore
  && !!shown && shown.value.trim().length > 0;`, 30000);
  });
  await run.step("Open the map dropdown", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Select a map")]]//input[not(@type="hidden")]`, 30000);
  });
  await run.step("Let the options render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 OPTIONS: at least 2 maps listed, exactly one checked, and it is the stored map \u2014 the name in the input is that option's", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
const opts = [...document.querySelectorAll('[role="listbox"] [role="option"]')];
if (!m || opts.length < 2) return false;
const checked = opts.filter(o => o.getAttribute('aria-selected') === 'true');
if (checked.length !== 1) return false;
const shown = m.querySelector('input:not([type="hidden"])');
return checked[0].getAttribute('value') === window.__ddMapBefore
  && !!shown && shown.value === (checked[0].textContent || '').trim();`, 30000);
  });
  await run.step("Close the picker with its close button", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
if (!m) return false;
const x = m.querySelector('button[class*="mantine-Modal-close"]');
if (!x) return false;
x.click();
return true;`, 30000);
  });
  await run.step("Let the picker close", {}, async () => {
    await wait(page, 2);
  });
  await run.step("DISMISS: the picker is gone and `mobile-map-id` is UNCHANGED \u2014 closing is not a switch", {}, async () => {
    await assertFromJavascript(page, `let stored = null;
try { stored = JSON.parse(sessionStorage.getItem('mobile-map-id') || 'null'); }
catch (e) { return false; }
const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
return !m && stored === window.__ddMapBefore;`, 30000);
  });
  await run.step("SWITCH: the `Switch Map` control is ENABLED \u2014 the org has \u2265 2 maps", {}, async () => {
    await assertFromJavascript(page, `const b = document.querySelector('button[aria-label="Switch Map"]');
return !!b && !b.disabled;`, 60000);
  });
  await run.step("SWITCH: click `Switch Map`", {}, async () => {
    await click(page, `//button[@aria-label="Switch Map"]`, 30000);
  });
  await run.step("Let the picker open", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Open the map dropdown", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Select a map")]]//input[not(@type="hidden")]`, 30000);
  });
  await run.step("Let the options render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("CAPTURE: the first map that is NOT the current one \u2014 the option the next click will pick", {}, async () => {
    await assertFromJavascript(page, `const opts = [...document.querySelectorAll('[role="listbox"] [role="option"]')];
const o = opts.find(x => x.getAttribute('aria-selected') !== 'true');
const v = o && o.getAttribute('value');
if (!v || v === window.__ddMapBefore) return false;
window.__ddMapPicked = v;
return true;`, 30000);
  });
  await run.step("Pick that map", {}, async () => {
    await click(page, `(//*[@role="listbox"]//*[@role="option"][not(@aria-selected="true")])[1]`, 30000);
  });
  await run.step("Let the map remount on the new map id", {}, async () => {
    await wait(page, 5);
  });
  await run.step("SWITCHED: the Mapbox canvas rendered again", {}, async () => {
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
  });
  await run.step("\u2b50 SWITCHED: `mobile-map-id` now holds the PICKED map, not the original \u2014 and the picker closed, because `<MapGl key={mapId}>` remounts the control stack", {}, async () => {
    await assertFromJavascript(page, `let stored = null;
try { stored = JSON.parse(sessionStorage.getItem('mobile-map-id') || 'null'); }
catch (e) { return false; }
const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
return !m && !!window.__ddMapPicked && stored === window.__ddMapPicked
  && stored !== window.__ddMapBefore;`, 30000);
  });
  await run.step("READBACK: the `Switch Map` control is ENABLED \u2014 the org has \u2265 2 maps", {}, async () => {
    await assertFromJavascript(page, `const b = document.querySelector('button[aria-label="Switch Map"]');
return !!b && !b.disabled;`, 60000);
  });
  await run.step("READBACK: click `Switch Map`", {}, async () => {
    await click(page, `//button[@aria-label="Switch Map"]`, 30000);
  });
  await run.step("Let the picker open", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 READBACK: the reopened picker holds the NEW map \u2014 the component reads back the value it wrote", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
if (!m) return false;
const hidden = m.querySelector('input[type="hidden"]');
const shown = m.querySelector('input:not([type="hidden"])');
return !!window.__ddMapPicked && !!hidden && hidden.value === window.__ddMapPicked
  && !!shown && shown.value.trim().length > 0;`, 30000);
  });
  await run.step("Open the map dropdown", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Select a map")]]//input[not(@type="hidden")]`, 30000);
  });
  await run.step("Let the options render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("READBACK: the NEW map is the one checked option", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
const opts = [...document.querySelectorAll('[role="listbox"] [role="option"]')];
if (!m || opts.length < 2) return false;
const checked = opts.filter(o => o.getAttribute('aria-selected') === 'true');
if (checked.length !== 1) return false;
const shown = m.querySelector('input:not([type="hidden"])');
return checked[0].getAttribute('value') === window.__ddMapPicked
  && !!shown && shown.value === (checked[0].textContent || '').trim();`, 30000);
  });
  await run.step("RESTORE: pick the original map back", {always: true}, async () => {
    await assertFromJavascript(page, `const opts = [...document.querySelectorAll('[role="listbox"] [role="option"]')];
const o = opts.find(x => x.getAttribute('value') === window.__ddMapBefore);
if (!o) return false;
o.click();
return true;`, 30000);
  });
  await run.step("Let the map remount on the new map id", {always: true}, async () => {
    await wait(page, 5);
  });
  await run.step("RESTORED: the Mapbox canvas rendered again", {always: true}, async () => {
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
  });
  await run.step("RESTORED: no picker is open and `mobile-map-id` is the ORIGINAL map again", {always: true}, async () => {
    await assertFromJavascript(page, `let stored = null;
try { stored = JSON.parse(sessionStorage.getItem('mobile-map-id') || 'null'); }
catch (e) { return false; }
const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
return !m && !!window.__ddMapBefore && stored === window.__ddMapBefore;`, 30000);
  });
  run.finish();
}
