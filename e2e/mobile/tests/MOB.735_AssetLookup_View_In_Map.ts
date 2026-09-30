// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.735_AssetLookup_View_In_Map.json. This file is the source now: edit it directly.
// MOB.735_AssetLookup_View_In_Map
//
// Ends on the map with the asset MARKED: for an `Asset` handed over by the router, the map sets a purple marker at the
// asset's coordinates once its work source loads (`Map/index.tsx:156-168`). The marker is checked against the page's
// Mapbox instance (trap 55): the asset's coordinates, from the server, project to the middle of the pin.

import { expect, Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, press, typeText, wait } from '../../support/dd';
import { appUrl, serverRead } from '../support/session';
import { PUMP_0102 } from '../support/fixtures';
import { attachMap } from '../support/map';

export async function mob735(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to asset lookup", {}, async () => {
    await page.goto(`${appUrl()}asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the \"Asset Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, 30000);
  });
  await run.step("Select any persisted query first (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for Pump 0102", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter \u2014 there is no search button)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("RESULT GUARD: a result row for Pump 0102 rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1][contains(., "Pump 0102")]`, 60000);
  });
  await run.step("Expand the first result", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`, 30000);
  });
  await run.step("FIXTURE GUARD: \"View in Map\" renders \u2014 i.e. Pump 0102 has lat AND lng", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//button[normalize-space(.)="View in Map"]`, 60000);
  });
  await run.step("Its sibling \"Add Work\" is there too (proves this is the row's button group)", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//button[normalize-space(.)="Add Work"]`, 30000);
  });
  await run.step("BASELINE: we are on /asset-lookup, not /map", {}, async () => {
    await assertFromJavascript(page, `return location.pathname.endsWith('/asset-lookup');`, 30000);
  });
  await run.step("Click \"View in Map\"", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//button[normalize-space(.)="View in Map"]`, 30000);
  });
  await run.step("Let the router navigate and the map begin initialising", {}, async () => {
    await wait(page, 8);
  });
  await run.step("NAVIGATED: location.pathname is now /map", {}, async () => {
    await assertFromJavascript(page, `return location.pathname.endsWith('/map');`, 30000);
  });
  await run.step("The \"Map\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Map")]`, `Map`, 60000);
  });
  await run.step("PROOF: the Mapbox WebGL canvas rendered", {}, async () => {
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
  });
  await run.step("\u2b50 THE ROUTER STATE ARRIVED: recordType 'Asset' with an id and coordinates", {}, async () => {
    await assertFromJavascript(page, `const s = (history.state && history.state.usr) || null;
if (!s) return false;
return s.recordType === 'Asset'
  && typeof s.recordId === 'string' && s.recordId.length > 0
  && s.lat != null && s.lng != null
  && !isNaN(Number(s.lat)) && !isNaN(Number(s.lng));`, 30000);
  });
  await run.step("\u2026and they are real coordinates, not a 0/0 placeholder", {}, async () => {
    await assertFromJavascript(page, `const s = history.state.usr;
const lat = Number(s.lat), lng = Number(s.lng);
return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);`, 30000);
  });
  await run.step("\u2b50 THE MARKER: a purple pin stands on Pump 0102's coordinates, as the server holds them", {}, async () => {
    const asset = (await serverRead(page, 'query($id: ID!) { asset(id: $id) { latitude longitude } }', { id: PUMP_0102 })).asset;
    const handed = await page.evaluate(() => (history.state as { usr: { recordId: string; lat: number; lng: number } }).usr);
    expect(handed.recordId, 'the router handed over Pump 0102').toBe(PUMP_0102);
    await attachMap(page);
    const marker = page.locator('.mapboxgl-marker');
    await expect(marker, 'one marker').toHaveCount(1, { timeout: 30_000 });
    await expect(marker.locator('path[fill="purple"], [fill="purple"]').first(), 'it is the purple one').toBeAttached();
    // Where the asset's coordinates fall on screen, against the pin's box: centred across it, and within its height.
    await expect.poll(async () => {
      const box = await marker.boundingBox();
      const at = await page.evaluate(([lng, lat]) => {
        const m = (window as unknown as { __ddMap: any }).__ddMap;
        const p = m.project([lng, lat]);
        const r = m.getContainer().getBoundingClientRect();
        return { x: r.left + p.x, y: r.top + p.y };
      }, [asset.longitude, asset.latitude]);
      if (!box) return 'no box';
      const dx = Math.abs(box.x + box.width / 2 - at.x);
      return dx <= 2 && at.y >= box.y && at.y <= box.y + box.height ? 'on the pin' : `off by ${dx.toFixed(1)}px across, y ${at.y.toFixed(0)} vs ${box.y.toFixed(0)}-${(box.y + box.height).toFixed(0)}`;
    }, { message: "the asset's coordinates project onto the pin", timeout: 30_000 }).toBe('on the pin');
  });
  run.finish();
}
