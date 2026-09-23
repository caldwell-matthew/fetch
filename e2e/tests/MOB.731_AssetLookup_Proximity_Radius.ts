// Generated from Mobile/dd_tests_mobile/MOB.731_AssetLookup_Proximity_Radius.json by to_playwright.py — do not edit by hand yet.
// MOB.731_AssetLookup_Proximity_Radius

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, wait } from '../support/dd';

export async function mob731(page: Page): Promise<void> {
  try {
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Let the page mount
    await wait(page, 4);
    // GATE: the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 60000);
    // BASELINE: no radius is stored in sessionStorage['asset_lookup_proximity_radius']
    await assertFromJavascript(page, `const v = sessionStorage.getItem('asset_lookup_proximity_radius');
return v === null || v === 'null' || v === '';`, 30000);
    // BASELINE: the button reads "Near Me" — no radius active
    await assertElementPresent(page, `//button[contains(normalize-space(.), "Near Me")]`, 60000);
    // STUB: install a fixed position over getCurrentPosition / watchPosition
    await assertFromJavascript(page, `
try {
  var pos = { coords: { latitude: 41.8781, longitude: -87.6298, accuracy: 5,
                        altitude: null, altitudeAccuracy: null, heading: null, speed: null },
              timestamp: Date.now() };
  var g = navigator.geolocation;
  var ok = function (cb) { setTimeout(function () { cb(pos); }, 0); };
  g.getCurrentPosition = function (s) { ok(s); };
  g.watchPosition = function (s) { ok(s); return 1; };
  g.clearWatch = function () {};
  g.getCurrentPosition.__dd = true;
  return true;
} catch (e) { return false; }
`, 15000);
    // GUARD: the stub is really installed — a tagged function, not just any callable
    await assertFromJavascript(page, `var f = navigator.geolocation && navigator.geolocation.getCurrentPosition;
return !!f && f.__dd === true;`, 15000);
    // Open the "Near Me" menu
    await el(page, `(//button[contains(normalize-space(.), "Near Me")])[1]`).click({ timeout: 30000 });
    // GATE: poll until "25 mi/km" exists — not a fixed wait
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="25 mi" or normalize-space(.)="25 km"]`, 30000);
    // Choose "25 mi" (or "25 km") — calls locate() → the stubbed getCurrentPosition
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="25 mi" or normalize-space(.)="25 km"]`).click({ timeout: 30000 });
    // Let locate() resolve, then the list refetch with the radius filter
    await wait(page, 6);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // ⭐ the button now reads "Within 25 mi/km" — the app consumed the position
    await assertFromJavascript(page, `return [...document.querySelectorAll('button')].some(b => /Within\\s+25\\s*(mi|km)\\b/.test((b.textContent || '').trim()));`, 30000);
    // "Near Me" is GONE — the label swapped rather than a second button appearing
    await assertFromJavascript(page, `return ![...document.querySelectorAll('button')].some(b => /^Near Me$/.test((b.textContent || '').trim()));`, 15000);
    // the radius persisted to sessionStorage — 25
    await assertFromJavascript(page, `return String(sessionStorage.getItem('asset_lookup_proximity_radius') || '').indexOf('25') >= 0;`, 15000);
    // ⭐⭐ the radius reached the QUERY — rows show "mi/km away", or the empty state reads "No Assets Within 25 mi/km"
    await assertFromJavascript(page, `const t = document.body.innerText || '';
return /No Assets Within\\s+25\\s*(mi|km)\\b/.test(t) || /\\d+(\\.\\d+)?\\s*(mi|km) away/.test(t);`, 30000);
    // Re-open the menu to read its conditional items
    await el(page, `(//button[contains(normalize-space(.), "Within 25")])[1]`).click({ timeout: 30000 });
    // GATE: poll until "Update my location" exists — not a fixed wait
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Update my location"]`, 30000);
    // "Update my location" and "Clear" have APPEARED — MOB.730 proves they are absent without a radius, so the pair proves the `{!!value}` branch
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
return items.includes('Update my location') && items.includes('Clear');`, 30000);
    // Click "Update my location" — toasts only if a position RESOLVES
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Update my location"]`).click({ timeout: 30000 });
    // Let locate() resolve and the toast render
    await wait(page, 4);
    // ⭐ a "Location updated" toast appeared — the stub resolved a second time
    await assertFromJavascript(page, `return /Location updated/.test(document.body.innerText || '');`, 30000);
    // Re-open the menu to Clear
    await el(page, `(//button[contains(normalize-space(.), "Within 25")])[1]`).click({ timeout: 30000 });
    // GATE: poll until "Clear" exists — not a fixed wait
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Clear"]`, 30000);
    // RESTORE: click "Clear" — also covers the clear path
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Clear"]`).click({ timeout: 30000 });
    // Let the list refetch unfiltered
    await wait(page, 4);
    // RESTORED: the button reads "Near Me" again — the radius is off
    await assertFromJavascript(page, `return [...document.querySelectorAll('button')].some(b => /^Near Me$/.test((b.textContent || '').trim()));`, 30000);
    // RESTORE (braces): remove sessionStorage['asset_lookup_proximity_radius'] directly
    await assertFromJavascript(page, `try { sessionStorage.removeItem('asset_lookup_proximity_radius'); } catch (e) {}
return true;`, 15000);
    // RESTORED: sessionStorage['asset_lookup_proximity_radius'] is empty — no later subtest will auto-locate on mount
    await assertFromJavascript(page, `const v = sessionStorage.getItem('asset_lookup_proximity_radius');
return v === null || v === 'null' || v === '';`, 30000);
  }
}
