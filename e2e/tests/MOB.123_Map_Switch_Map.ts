// Generated from Mobile/dd_tests_mobile/MOB.123_Map_Switch_Map.json by to_playwright.py — do not edit by hand yet.
// MOB.123_Map_Switch_Map

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, wait } from '../support/dd';

export async function mob123(page: Page): Promise<void> {
  try {
    // Navigate to the mobile map
    await page.goto(`https://dev.mentorapm.com/apm-mobile/map`);
    // Let the map begin initialising
    await wait(page, 5);
    // Test the "Map" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Map")]`, `Map`, 30000);
    // The Mapbox WebGL canvas rendered
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
    // CAPTURE: `mobile-map-id` holds the map on screen (written on mount from the user's default map)
    await assertFromJavascript(page, `let stored = null;
try { stored = JSON.parse(sessionStorage.getItem('mobile-map-id') || 'null'); }
catch (e) { return false; }
if (typeof stored !== 'string' || !stored) return false;
window.__ddMapBefore = stored;
return true;`, 30000);
    // OPEN: the `Switch Map` control is ENABLED — the org has ≥ 2 maps
    await assertFromJavascript(page, `const b = document.querySelector('button[aria-label="Switch Map"]');
return !!b && !b.disabled;`, 60000);
    // OPEN: click `Switch Map`
    await el(page, `//button[@aria-label="Switch Map"]`).click({ timeout: 30000 });
    // Let the picker open
    await wait(page, 2);
    // ⭐ OPEN: the `Select a map` modal holds the STORED map, by id, and names it
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
if (!m) return false;
const hidden = m.querySelector('input[type="hidden"]');
const shown = m.querySelector('input:not([type="hidden"])');
return !!window.__ddMapBefore && !!hidden && hidden.value === window.__ddMapBefore
  && !!shown && shown.value.trim().length > 0;`, 30000);
    // Open the map dropdown
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Select a map")]]//input[not(@type="hidden")]`).click({ timeout: 30000 });
    // Let the options render
    await wait(page, 2);
    // ⭐ OPTIONS: at least 2 maps listed, exactly one checked, and it is the stored map — the name in the input is that option's
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
const opts = [...document.querySelectorAll('[role="listbox"] [role="option"]')];
if (!m || opts.length < 2) return false;
const checked = opts.filter(o => o.getAttribute('aria-selected') === 'true');
if (checked.length !== 1) return false;
const shown = m.querySelector('input:not([type="hidden"])');
return checked[0].getAttribute('value') === window.__ddMapBefore
  && !!shown && shown.value === (checked[0].textContent || '').trim();`, 30000);
    // Close the picker with its close button
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
if (!m) return false;
const x = m.querySelector('button[class*="mantine-Modal-close"]');
if (!x) return false;
x.click();
return true;`, 30000);
    // Let the picker close
    await wait(page, 2);
    // DISMISS: the picker is gone and `mobile-map-id` is UNCHANGED — closing is not a switch
    await assertFromJavascript(page, `let stored = null;
try { stored = JSON.parse(sessionStorage.getItem('mobile-map-id') || 'null'); }
catch (e) { return false; }
const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
return !m && stored === window.__ddMapBefore;`, 30000);
    // SWITCH: the `Switch Map` control is ENABLED — the org has ≥ 2 maps
    await assertFromJavascript(page, `const b = document.querySelector('button[aria-label="Switch Map"]');
return !!b && !b.disabled;`, 60000);
    // SWITCH: click `Switch Map`
    await el(page, `//button[@aria-label="Switch Map"]`).click({ timeout: 30000 });
    // Let the picker open
    await wait(page, 2);
    // Open the map dropdown
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Select a map")]]//input[not(@type="hidden")]`).click({ timeout: 30000 });
    // Let the options render
    await wait(page, 2);
    // CAPTURE: the first map that is NOT the current one — the option the next click will pick
    await assertFromJavascript(page, `const opts = [...document.querySelectorAll('[role="listbox"] [role="option"]')];
const o = opts.find(x => x.getAttribute('aria-selected') !== 'true');
const v = o && o.getAttribute('value');
if (!v || v === window.__ddMapBefore) return false;
window.__ddMapPicked = v;
return true;`, 30000);
    // Pick that map
    await el(page, `(//*[@role="listbox"]//*[@role="option"][not(@aria-selected="true")])[1]`).click({ timeout: 30000 });
    // Let the map remount on the new map id
    await wait(page, 5);
    // SWITCHED: the Mapbox canvas rendered again
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
    // ⭐ SWITCHED: `mobile-map-id` now holds the PICKED map, not the original — and the picker closed, because `<MapGl key={mapId}>` remounts the control stack
    await assertFromJavascript(page, `let stored = null;
try { stored = JSON.parse(sessionStorage.getItem('mobile-map-id') || 'null'); }
catch (e) { return false; }
const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
return !m && !!window.__ddMapPicked && stored === window.__ddMapPicked
  && stored !== window.__ddMapBefore;`, 30000);
    // READBACK: the `Switch Map` control is ENABLED — the org has ≥ 2 maps
    await assertFromJavascript(page, `const b = document.querySelector('button[aria-label="Switch Map"]');
return !!b && !b.disabled;`, 60000);
    // READBACK: click `Switch Map`
    await el(page, `//button[@aria-label="Switch Map"]`).click({ timeout: 30000 });
    // Let the picker open
    await wait(page, 2);
    // ⭐ READBACK: the reopened picker holds the NEW map — the component reads back the value it wrote
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
if (!m) return false;
const hidden = m.querySelector('input[type="hidden"]');
const shown = m.querySelector('input:not([type="hidden"])');
return !!window.__ddMapPicked && !!hidden && hidden.value === window.__ddMapPicked
  && !!shown && shown.value.trim().length > 0;`, 30000);
    // Open the map dropdown
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Select a map")]]//input[not(@type="hidden")]`).click({ timeout: 30000 });
    // Let the options render
    await wait(page, 2);
    // READBACK: the NEW map is the one checked option
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
const opts = [...document.querySelectorAll('[role="listbox"] [role="option"]')];
if (!m || opts.length < 2) return false;
const checked = opts.filter(o => o.getAttribute('aria-selected') === 'true');
if (checked.length !== 1) return false;
const shown = m.querySelector('input:not([type="hidden"])');
return checked[0].getAttribute('value') === window.__ddMapPicked
  && !!shown && shown.value === (checked[0].textContent || '').trim();`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // RESTORE: pick the original map back
    await assertFromJavascript(page, `const opts = [...document.querySelectorAll('[role="listbox"] [role="option"]')];
const o = opts.find(x => x.getAttribute('value') === window.__ddMapBefore);
if (!o) return false;
o.click();
return true;`, 30000);
    // Let the map remount on the new map id
    await wait(page, 5);
    // RESTORED: the Mapbox canvas rendered again
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
    // RESTORED: no picker is open and `mobile-map-id` is the ORIGINAL map again
    await assertFromJavascript(page, `let stored = null;
try { stored = JSON.parse(sessionStorage.getItem('mobile-map-id') || 'null'); }
catch (e) { return false; }
const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select a map'));
return !m && !!window.__ddMapBefore && stored === window.__ddMapBefore;`, 30000);
  }
}
