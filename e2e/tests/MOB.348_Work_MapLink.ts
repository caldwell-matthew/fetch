// Generated from Mobile/dd_tests_mobile/MOB.348_Work_MapLink.json by to_playwright.py — do not edit by hand yet.
// MOB.348_Work_MapLink

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, optional, wait } from '../support/dd';

export async function mob348(page: Page): Promise<void> {
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
    // The MapLink globe control renders on the title
    await assertElementPresent(page, `//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]`, 60000);
    // Open the MapLink menu
    await el(page, `(//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]])[1]`).click({ timeout: 30000 });
    // Let the menu open
    await wait(page, 2);
    // The menu offers "View in Map" (asserted, NEVER clicked — it navigates away to /map)
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="View in Map"]`, 30000);
    // The menu offers "Edit Location"
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Location"]`, 30000);
    // "Edit Location" is ENABLED — the session role has work.update
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Menu-item')].find(e => (e.textContent||'').trim() === 'Edit Location');
if (!it) return false;
return !it.disabled && it.getAttribute('data-disabled') === null;`, 30000);
    // Open the location form via "Edit Location"
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Location"]`).click({ timeout: 30000 });
    // Let the modal open
    await wait(page, 2);
    // The location form mounted
    await assertElementPresent(page, `//form[@id="locationform"]`, 60000);
    // It has all three fields — Address, X and Y
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return false;
const t = f.innerText || '';
return /\\bAddress\\b/.test(t) && /\\bX\\b/.test(t) && /\\bY\\b/.test(t);`, 30000);
    // The geolocate control renders inside the form — anchored on the ICON, so it fails if the control disappears (using it is MOB.911's job)
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return false;
const icon = f.querySelector('[data-icon="location-crosshairs"], .fa-location-crosshairs');
if (!icon) return false;
// and it must sit inside a real ActionIcon, not be a loose decorative svg
return !!icon.closest('.mantine-ActionIcon-root');`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    await optional("Dismiss via the modal's close button", async () => {
      await el(page, `//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ") or @aria-label="Close"]`).click({ timeout: 15000 });
    });
    // Let the modal react
    await wait(page, 1);
    await optional("Fallback: dismiss by clicking the overlay", async () => {
      await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-overlay ")]`).click({ timeout: 15000 });
    });
    // Let the modal close
    await wait(page, 2);
    // The location form was DISMISSED and the page is still alive
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.getElementById('locationform');`, 30000);
  }
}
