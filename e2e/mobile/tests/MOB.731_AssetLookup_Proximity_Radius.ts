// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.731_AssetLookup_Proximity_Radius.json. This file is the source now: edit it directly.
// MOB.731_AssetLookup_Proximity_Radius

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, wait } from '../../support/dd';

export async function mob731(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to asset lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page mount", {}, async () => {
    await wait(page, 4);
  });
  await run.step("GATE: the \"Asset Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 60000);
  });
  await run.step("BASELINE: no radius is stored in sessionStorage['asset_lookup_proximity_radius']", {}, async () => {
    await assertFromJavascript(page, `const v = sessionStorage.getItem('asset_lookup_proximity_radius');
return v === null || v === 'null' || v === '';`, 30000);
  });
  await run.step("BASELINE: the button reads \"Near Me\" \u2014 no radius active", {}, async () => {
    await assertElementPresent(page, `//button[contains(normalize-space(.), "Near Me")]`, 60000);
  });
  await run.step("STUB: install a fixed position over getCurrentPosition / watchPosition", {}, async () => {
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
  });
  await run.step("GUARD: the stub is really installed \u2014 a tagged function, not just any callable", {}, async () => {
    await assertFromJavascript(page, `var f = navigator.geolocation && navigator.geolocation.getCurrentPosition;
return !!f && f.__dd === true;`, 15000);
  });
  await run.step("Open the \"Near Me\" menu", {}, async () => {
    await click(page, `(//button[contains(normalize-space(.), "Near Me")])[1]`, 30000);
  });
  await run.step("GATE: poll until \"25 mi/km\" exists \u2014 not a fixed wait", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="25 mi" or normalize-space(.)="25 km"]`, 30000);
  });
  await run.step("Choose \"25 mi\" (or \"25 km\") \u2014 calls locate() \u2192 the stubbed getCurrentPosition", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="25 mi" or normalize-space(.)="25 km"]`, 30000);
  });
  await run.step("Let locate() resolve, then the list refetch with the radius filter", {}, async () => {
    await wait(page, 6);
  });
  await run.step("\u2b50 the button now reads \"Within 25 mi/km\" \u2014 the app consumed the position", {always: true}, async () => {
    await assertFromJavascript(page, `return [...document.querySelectorAll('button')].some(b => /Within\\s+25\\s*(mi|km)\\b/.test((b.textContent || '').trim()));`, 30000);
  });
  await run.step("\"Near Me\" is GONE \u2014 the label swapped rather than a second button appearing", {always: true}, async () => {
    await assertFromJavascript(page, `return ![...document.querySelectorAll('button')].some(b => /^Near Me$/.test((b.textContent || '').trim()));`, 15000);
  });
  await run.step("the radius persisted to sessionStorage \u2014 25", {always: true}, async () => {
    await assertFromJavascript(page, `return String(sessionStorage.getItem('asset_lookup_proximity_radius') || '').indexOf('25') >= 0;`, 15000);
  });
  await run.step("\u2b50\u2b50 the radius reached the QUERY \u2014 rows show \"mi/km away\", or the empty state reads \"No Assets Within 25 mi/km\"", {always: true}, async () => {
    await assertFromJavascript(page, `const t = document.body.innerText || '';
return /No Assets Within\\s+25\\s*(mi|km)\\b/.test(t) || /\\d+(\\.\\d+)?\\s*(mi|km) away/.test(t);`, 30000);
  });
  await run.step("Re-open the menu to read its conditional items", {always: true}, async () => {
    await click(page, `(//button[contains(normalize-space(.), "Within 25")])[1]`, 30000);
  });
  await run.step("GATE: poll until \"Update my location\" exists \u2014 not a fixed wait", {always: true}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Update my location"]`, 30000);
  });
  await run.step("\"Update my location\" and \"Clear\" have APPEARED \u2014 MOB.730 proves they are absent without a radius, so the pair proves the `{!!value}` branch", {always: true}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
return items.includes('Update my location') && items.includes('Clear');`, 30000);
  });
  await run.step("Click \"Update my location\" \u2014 toasts only if a position RESOLVES", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Update my location"]`, 30000);
  });
  await run.step("Let locate() resolve and the toast render", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("\u2b50 a \"Location updated\" toast appeared \u2014 the stub resolved a second time", {always: true}, async () => {
    await assertFromJavascript(page, `return /Location updated/.test(document.body.innerText || '');`, 30000);
  });
  await run.step("Re-open the menu to Clear", {always: true}, async () => {
    await click(page, `(//button[contains(normalize-space(.), "Within 25")])[1]`, 30000);
  });
  await run.step("GATE: poll until \"Clear\" exists \u2014 not a fixed wait", {always: true}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Clear"]`, 30000);
  });
  await run.step("RESTORE: click \"Clear\" \u2014 also covers the clear path", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Clear"]`, 30000);
  });
  await run.step("Let the list refetch unfiltered", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("RESTORED: the button reads \"Near Me\" again \u2014 the radius is off", {always: true}, async () => {
    await assertFromJavascript(page, `return [...document.querySelectorAll('button')].some(b => /^Near Me$/.test((b.textContent || '').trim()));`, 30000);
  });
  await run.step("RESTORE (braces): remove sessionStorage['asset_lookup_proximity_radius'] directly", {always: true}, async () => {
    await assertFromJavascript(page, `try { sessionStorage.removeItem('asset_lookup_proximity_radius'); } catch (e) {}
return true;`, 15000);
  });
  await run.step("RESTORED: sessionStorage['asset_lookup_proximity_radius'] is empty \u2014 no later subtest will auto-locate on mount", {always: true}, async () => {
    await assertFromJavascript(page, `const v = sessionStorage.getItem('asset_lookup_proximity_radius');
return v === null || v === 'null' || v === '';`, 30000);
  });
  run.finish();
}
