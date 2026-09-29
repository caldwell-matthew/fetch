// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.600_Collector_Create_Asset.json. This file is the source now: edit it directly.
// MOB.600_Collector_Create_Asset
//
// Collects an asset WITHOUT a photo, and proves the server has it. A photo attached in the collector goes up through
// the native shell's `UPLOAD_THUMBNAILS` bridge (`AssetCollector/utils/createAsset.ts`, `graphql/links/UploadLink.ts`);
// in a browser there is no shell, the bridge never answers, and the collect is never sent — a harness limit, not a
// mobile bug (the app runs only in the native shell on phones; owner, 2026-09-28). Photos on a SAVED asset go up by
// tus in a browser too, and MOB.623 / MOB.627 / MOB.933–936 cover them.
//
// The collect also carries a LOCATION (checklist #100): the Location row's geolocate, with MOB.629's geolocation and
// Mapbox stubs, filled into the form; `createAsset` then sends an `UPDATE_ASSET` behind the collect
// (`AssetCollector/utils/createAsset.ts:166-204`). With `Include Address` the address lands on the asset; with
// `Include GIS`, the coordinates too — only for a type with a geometry (`assetTypeHasGeometry`). `Actuator Tools` is a
// `Point` type, so both land. (⚠️ `assetTypeFullList` answers `geometry: null` for EVERY type — 753 of 753, 2026-09-28 —
// while each type's own record has one; the app still sent the centroid, its cache evidently holding the geometry from
// another query. The no-geometry branch is `MOB.945`'s, refused in the browser.)

import { expect, Page } from '@playwright/test';
import { appUrl, serverRead } from '../support/session';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../../support/dd';
import { runId } from '../../support/env';

export async function mob600(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
  const run = new Sequence();
  await run.step("Navigate to the asset collector", {}, async () => {
    await page.goto(`${appUrl()}asset-collector`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the collector page rendered", {}, async () => {
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the new-asset form (affixed + button)", {}, async () => {
    await click(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the new-asset form opened", {}, async () => {
    await assertElementPresent(page, `//button[@form="asset-collector"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Enter the asset name", {}, async () => {
    await typeText(page, `//*[@id="name"]`, `DD SYNTHETIC MOBILE ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Enter the asset description", {}, async () => {
    await typeText(page, `//*[@id="desc"]`, `Created by Datadog Synthetics - safe to delete`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the asset type lookup", {}, async () => {
    await click(page, `//*[@id="typeId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Pick Actuator Tools", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Actuator Tools")]`, DEFAULT_TIMEOUT);
  });
  await run.step("LOCATION: install MOB.629's geolocation + Mapbox stubs (only Mapbox's geocode is answered; Apollo's fetch passes)", {}, async () => {
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      if (!w.__ddOrigFetch) w.__ddOrigFetch = window.fetch;
      if (!w.__ddOrigGeo) w.__ddOrigGeo = navigator.geolocation.getCurrentPosition;
      navigator.geolocation.getCurrentPosition = ((ok: PositionCallback) =>
        ok({ coords: { latitude: 41.8781, longitude: -87.6298, accuracy: 5 } } as GeolocationPosition)) as typeof navigator.geolocation.getCurrentPosition;
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const u = typeof input === 'string' ? input : ((input as Request)?.url || String(input));
        if (u.includes('api.mapbox.com/geocoding')) {
          const body = JSON.stringify({ features: [
            { place_type: ['address'], text: 'Main Street', address: '1600', properties: {} },
            { place_type: ['place'], text: 'Chicago', properties: {} },
            { place_type: ['region'], text: 'Illinois', properties: { short_code: 'US-IL' } },
            { place_type: ['country'], text: 'United States', properties: { short_code: 'us' } },
            { place_type: ['postcode'], text: '60601', properties: {} }] });
          return Promise.resolve(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
        return (w.__ddOrigFetch as typeof fetch)(input, init);
      }) as typeof fetch;
    });
  });
  await run.step("LOCATION: the Location row's geolocate opens `Asset Location`, prefilled from the stubbed geocode", {}, async () => {
    const row = page.locator('#asset-collector [class*="mantine-Group-root"]').filter({ has: page.locator('p', { hasText: /^Location$/ }) }).first();
    await row.locator('[class*="mantine-ActionIcon-root"]').filter({ has: page.locator('svg[data-icon="location-crosshairs"]') }).click();
    const form = page.locator('#mobile-geolocate');
    await expect(form, 'the location form opened').toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => (await form.locator('input').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))).join('|'),
      { message: 'prefilled from the geocode', timeout: 30_000 }).toContain('1600 Main Street');
  });
  await run.step("LOCATION: `Include Address` is on; submit the location into the new-asset form", {}, async () => {
    const boxes = page.locator('#mobile-geolocate input[type="checkbox"]');
    const states = await boxes.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).checked));
    console.log(`  MOB.600: the location form's two toggles (GIS, Address) read ${JSON.stringify(states)} with Actuator Tools picked`);
    expect(states.length, 'Include GIS and Include Address').toBe(2);
    expect(states[1], 'Include Address is on').toBe(true);
    await page.locator('button[form="mobile-geolocate"]').click();
    await expect(page.locator('#mobile-geolocate'), 'the location form closed').toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('#asset-collector'), 'the new-asset form holds the location').toContainText('1600 Main Street', { timeout: 15_000 });
  });
  await run.step("Submit the new asset", {}, async () => {
    await click(page, `//button[@form="asset-collector"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the collect mutation", {}, async () => {
    await wait(page, 5);
  });
  await run.step("Test the form closed (durable success signal)", {}, async () => {
    await assertPageLacks(page, `Create Asset`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the form closed (affixed + button is back)", {}, async () => {
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`, DEFAULT_TIMEOUT);
  });
  await run.step("PROOF OF CREATION: this run's asset is in the collected list", {}, async () => {
    await assertPageContains(page, `DD SYNTHETIC MOBILE ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the 'Asset collected' toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Asset collected`, DEFAULT_TIMEOUT);
  });
  await run.step("SERVER PROOF: navigate to Asset Lookup (its search is a network-only query)", {}, async () => {
    await page.goto(`${appUrl()}asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, 30000);
  });
  await run.step("Select any persisted query first (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for this run's asset by its exact name", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `DD SYNTHETIC MOBILE ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter \u2014 there is no search button)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Wait for the search results", {}, async () => {
    await wait(page, 5);
  });
  await run.step("\u2b50 SERVER PROOF: the asset comes back from the SERVER \u2014 a result row carries this run's name (the collected list's row is client-prepended and proves nothing)", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")])[1][contains(., "DD SYNTHETIC MOBILE ${RUNID}")]`, 30000);
  });
  await run.step("\u2b50 SERVER: the location landed \u2014 the address, city and postal code, and the coordinates (`Actuator Tools` is a Point type)", {}, async () => {
    const read = async () => (await serverRead(page, 'query($p: TableQuery) { assets(params: $p) { edges { name address city postalCode latitude longitude } } }',
      { p: { limit: 2, query: { connector: 'AND', conditions: [{ column: 'name', operator: 'CONTAINS', value: `DD SYNTHETIC MOBILE ${RUNID}` }] } } })).assets.edges[0];
    await expect.poll(async () => { const a = await read(); return a ? `${a.address} · ${a.city} · ${a.postalCode}` : null; },
      { message: 'the address the location form captured', timeout: 30_000 }).toBe('1600 Main Street · Chicago · 60601');
    const a = await read();
    expect([a.latitude, a.longitude], 'the captured coordinates, for a Point type').toEqual([41.8781, -87.6298]);
  });
  run.finish();
}
