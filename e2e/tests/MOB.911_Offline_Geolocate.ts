// Generated from Mobile/dd_tests_mobile/MOB.911_Offline_Geolocate.json by to_playwright.py — do not edit by hand yet.
// MOB.911_Offline_Geolocate

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, wait } from '../support/dd';

export async function mob911(page: Page): Promise<void> {
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
    // Open the MapLink menu
    await el(page, `(//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]])[1]`).click({ timeout: 30000 });
    // GATE: poll until "Edit Location" exists — not a fixed wait
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Location"]`, 30000);
    // Open the location form via "Edit Location"
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Location"]`).click({ timeout: 30000 });
    // GATE: the location form mounted
    await assertElementPresent(page, `//form[@id="locationform"]`, 30000);
    // BASELINE: the geolocate control renders in the form
    await assertElementPresent(page, `(//form[@id="locationform"]//*[@data-icon="location-crosshairs" or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")])[1]`, 30000);
    // BASELINE: it is ENABLED while online — the state we are about to change
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return null;
let el = f.querySelector('.mantine-ActionIcon-root');
if (!el) {
  const icon = f.querySelector('[data-icon="location-crosshairs"], .fa-location-crosshairs');
  el = icon && icon.closest('[data-disabled]');
}
if (!el) return false;
return !el.hasAttribute('data-disabled') && !el.disabled;`, 30000);
    // BASELINE: the offline message is NOT on screen yet
    await assertFromJavascript(page, `return !(document.body.innerText || '').includes('This feature requires an internet connection.');`, 15000);
    // Dispatch a window 'offline' event
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
    // Let React re-render the gated controls
    await wait(page, 3);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // ⭐ the geolocate control is now DISABLED — it gates on `online`
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return null;
let el = f.querySelector('.mantine-ActionIcon-root');
if (!el) {
  const icon = f.querySelector('[data-icon="location-crosshairs"], .fa-location-crosshairs');
  el = icon && icon.closest('[data-disabled]');
}
if (!el) return false;
return el.hasAttribute('data-disabled') || el.disabled === true;`, 30000);
    // Click the disabled control — its onClick is what opens the Popover
    await el(page, `(//form[@id="locationform"]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-ActionIcon-root ")])[1]`).click({ timeout: 30000 });
    // Let the popover open
    await wait(page, 2);
    // ⭐⭐ OFFLINE_FEATURE_MESSAGE is shown — "This feature requires an internet connection."
    await assertFromJavascript(page, `return (document.body.innerText || '').includes('This feature requires an internet connection.');`, 30000);
    // it is in a POPOVER, not loose page text — the `!online` branch of GeolocateButton, not something else on the page saying the same thing
    await assertFromJavascript(page, `const ds = [...document.querySelectorAll('.mantine-Popover-dropdown')];
return ds.some(d => (d.textContent || '').includes('This feature requires an internet connection.'));`, 30000);
    // Dispatch a window 'online' event
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
    // Let React re-render
    await wait(page, 3);
    // RESTORED: the control is ENABLED again
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return null;
let el = f.querySelector('.mantine-ActionIcon-root');
if (!el) {
  const icon = f.querySelector('[data-icon="location-crosshairs"], .fa-location-crosshairs');
  el = icon && icon.closest('[data-disabled]');
}
if (!el) return false;
return !el.hasAttribute('data-disabled') && !el.disabled;`, 30000);
    // Close the popover
    await page.keyboard.press(`Escape`);
    // Let the popover close
    await wait(page, 1);
    // Close the location modal WITHOUT submitting
    await page.keyboard.press(`Escape`);
    // Let the modal close
    await wait(page, 2);
    // RESTORED: the location form is gone — nothing was submitted
    await assertFromJavascript(page, `return !document.getElementById('locationform');`, 30000);
  }
}
