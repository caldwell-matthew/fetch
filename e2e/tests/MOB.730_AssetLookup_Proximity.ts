// Generated from Mobile/dd_tests_mobile/MOB.730_AssetLookup_Proximity.json by to_playwright.py — do not edit by hand yet.
// MOB.730_AssetLookup_Proximity

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, wait } from '../support/dd';

export async function mob730(page: Page): Promise<void> {
  try {
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Let the page mount
    await wait(page, 3);
    // The "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
    // BASELINE: no radius is stored in sessionStorage['asset_lookup_proximity_radius']
    await assertFromJavascript(page, `const v = sessionStorage.getItem('asset_lookup_proximity_radius');
return v === null || v === 'null' || v === '';`, 30000);
    // The "Near Me" button renders — the no-radius label
    await assertElementPresent(page, `//button[contains(normalize-space(.), "Near Me")]`, 60000);
    // SETTLE GATE: the search input is interactive — the page finished its first render
    await assertElementPresent(page, `//input[@name="asset-search"]`, 60000);
    // Let the first asset query settle before touching the menu
    await wait(page, 4);
    // Open the "Near Me" menu
    await el(page, `(//button[contains(normalize-space(.), "Near Me")])[1]`).click({ timeout: 30000 });
    // The menu is headed "Search radius"
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-label ")][normalize-space(.)="Search radius"]`, 30000);
    // All five radii are offered, and they are exactly ONE locale's set — 5/10/25/50/100 mi or 10/25/50/100/200 km, never a mix
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
const got = items.filter(t => /^\\d+ (mi|km)$/.test(t));
const IMPERIAL = ["5 mi", "10 mi", "25 mi", "50 mi", "100 mi"];
const METRIC = ["10 km", "25 km", "50 km", "100 km", "200 km"];
const same = (a, b) => a.length === b.length && b.every(x => a.includes(x));
return got.length === 5 && (same(got, IMPERIAL) || same(got, METRIC));`, 30000);
    // "Update my location" and "Clear" are ABSENT while no radius is set
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
return !items.includes('Update my location') && !items.includes('Clear');`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Close the menu WITHOUT choosing a radius (a click would call getCurrentPosition — Appendix C)
    await page.keyboard.press(`Escape`);
    // Let the menu close
    await wait(page, 1);
    // GUARD: nothing was chosen — the menu is closed (MEANINGFUL ONLY because the same /^\d+ (mi|km)$/ matched five items above — do not decouple them)
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
return items.filter(t => /^\\d+ (mi|km)$/.test(t)).length === 0;`, 30000);
    // CLEAN: sessionStorage['asset_lookup_proximity_radius'] is still empty
    await assertFromJavascript(page, `const v = sessionStorage.getItem('asset_lookup_proximity_radius');
return v === null || v === 'null' || v === '';`, 30000);
    // RESTORED: the button still reads "Near Me"
    await assertElementPresent(page, `//button[contains(normalize-space(.), "Near Me")]`, 30000);
  }
}
