// Generated from Mobile/dd_tests_mobile/MOB.735_AssetLookup_View_In_Map.json by to_playwright.py — do not edit by hand yet.
// MOB.735_AssetLookup_View_In_Map

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, wait } from '../support/dd';

export async function mob735(page: Page): Promise<void> {
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for the page to mount
    await wait(page, 3);
    // Test the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: 30000 });
    // Select any persisted query first (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Search for Pump 0102
    await el(page, `//input[@name="asset-search"]`).fill(`Pump 0102`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter — there is no search button)
    await page.keyboard.press(`Enter`);
    // Wait for the search results
    await wait(page, 5);
    // RESULT GUARD: a result row for Pump 0102 rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1][contains(., "Pump 0102")]`, 60000);
    // Expand the first result
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`).click({ timeout: 30000 });
    // Wait for the detail panel to mount
    await wait(page, 3);
    // FIXTURE GUARD: "View in Map" renders — i.e. Pump 0102 has lat AND lng
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//button[normalize-space(.)="View in Map"]`, 60000);
    // Its sibling "Add Work" is there too (proves this is the row's button group)
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//button[normalize-space(.)="Add Work"]`, 30000);
    // BASELINE: we are on /asset-lookup, not /map
    await assertFromJavascript(page, `return location.pathname.endsWith('/asset-lookup');`, 30000);
    // Click "View in Map"
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//button[normalize-space(.)="View in Map"]`).click({ timeout: 30000 });
    // Let the router navigate and the map begin initialising
    await wait(page, 8);
    // NAVIGATED: location.pathname is now /map
    await assertFromJavascript(page, `return location.pathname.endsWith('/map');`, 30000);
    // The "Map" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Map")]`, `Map`, 60000);
    // PROOF: the Mapbox WebGL canvas rendered
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
    // ⭐ THE ROUTER STATE ARRIVED: recordType 'Asset' with an id and coordinates
    await assertFromJavascript(page, `const s = (history.state && history.state.usr) || null;
if (!s) return false;
return s.recordType === 'Asset'
  && typeof s.recordId === 'string' && s.recordId.length > 0
  && s.lat != null && s.lng != null
  && !isNaN(Number(s.lat)) && !isNaN(Number(s.lng));`, 30000);
    // …and they are real coordinates, not a 0/0 placeholder
    await assertFromJavascript(page, `const s = history.state.usr;
const lat = Number(s.lat), lng = Number(s.lng);
return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);`, 30000);
}
