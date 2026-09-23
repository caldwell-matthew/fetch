// Generated from Mobile/dd_tests_mobile/MOB.911_Offline_Geolocate.json by to_playwright.py — do not edit by hand yet.
// MOB.911_Offline_Geolocate

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, press, wait } from '../support/dd';

export async function mob911(page: Page): Promise<void> {
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
  await run.step("Open the MapLink menu", {}, async () => {
    await click(page, `(//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]])[1]`, 30000);
  });
  await run.step("GATE: poll until \"Edit Location\" exists \u2014 not a fixed wait", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Location"]`, 30000);
  });
  await run.step("Open the location form via \"Edit Location\"", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Location"]`, 30000);
  });
  await run.step("GATE: the location form mounted", {}, async () => {
    await assertElementPresent(page, `//form[@id="locationform"]`, 30000);
  });
  await run.step("BASELINE: the geolocate control renders in the form", {}, async () => {
    await assertElementPresent(page, `(//form[@id="locationform"]//*[@data-icon="location-crosshairs" or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")])[1]`, 30000);
  });
  await run.step("BASELINE: it is ENABLED while online \u2014 the state we are about to change", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return null;
let el = f.querySelector('.mantine-ActionIcon-root');
if (!el) {
  const icon = f.querySelector('[data-icon="location-crosshairs"], .fa-location-crosshairs');
  el = icon && icon.closest('[data-disabled]');
}
if (!el) return false;
return !el.hasAttribute('data-disabled') && !el.disabled;`, 30000);
  });
  await run.step("BASELINE: the offline message is NOT on screen yet", {}, async () => {
    await assertFromJavascript(page, `return !(document.body.innerText || '').includes('This feature requires an internet connection.');`, 15000);
  });
  await run.step("Dispatch a window 'offline' event", {}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
  });
  await run.step("Let React re-render the gated controls", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 the geolocate control is now DISABLED \u2014 it gates on `online`", {always: true}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return null;
let el = f.querySelector('.mantine-ActionIcon-root');
if (!el) {
  const icon = f.querySelector('[data-icon="location-crosshairs"], .fa-location-crosshairs');
  el = icon && icon.closest('[data-disabled]');
}
if (!el) return false;
return el.hasAttribute('data-disabled') || el.disabled === true;`, 30000);
  });
  await run.step("Click the disabled control \u2014 its onClick is what opens the Popover", {always: true}, async () => {
    await click(page, `(//form[@id="locationform"]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-ActionIcon-root ")])[1]`, 30000);
  });
  await run.step("Let the popover open", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50\u2b50 OFFLINE_FEATURE_MESSAGE is shown \u2014 \"This feature requires an internet connection.\"", {always: true}, async () => {
    await assertFromJavascript(page, `return (document.body.innerText || '').includes('This feature requires an internet connection.');`, 30000);
  });
  await run.step("it is in a POPOVER, not loose page text \u2014 the `!online` branch of GeolocateButton, not something else on the page saying the same thing", {always: true}, async () => {
    await assertFromJavascript(page, `const ds = [...document.querySelectorAll('.mantine-Popover-dropdown')];
return ds.some(d => (d.textContent || '').includes('This feature requires an internet connection.'));`, 30000);
  });
  await run.step("Dispatch a window 'online' event", {always: true}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
  });
  await run.step("Let React re-render", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("RESTORED: the control is ENABLED again", {always: true}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return null;
let el = f.querySelector('.mantine-ActionIcon-root');
if (!el) {
  const icon = f.querySelector('[data-icon="location-crosshairs"], .fa-location-crosshairs');
  el = icon && icon.closest('[data-disabled]');
}
if (!el) return false;
return !el.hasAttribute('data-disabled') && !el.disabled;`, 30000);
  });
  await run.step("Close the popover", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the popover close", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("Close the location modal WITHOUT submitting", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: the location form is gone \u2014 nothing was submitted", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.getElementById('locationform');`, 30000);
  });
  run.finish();
}
