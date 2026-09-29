// MOB.125_Map_Address_Search — written for Playwright (not converted from Datadog).
//
// The map's `Search by address` box is Mapbox's geocoder (`components/layout/common/Map/mentor-map/src/geocoder`, no
// marker of its own). Picking a result drops the app's own pin (`Map/MapGL/GeocoderMarker.tsx`) with its popup open
// (`.apm-map-popup-container`): the place as the title, its `Latitude` and `Longitude`, and `Add Work` / the add-asset
// control (`Map/Popup/GeocoderPopup.tsx:23-80`) — the same popup MOB.932 reaches from a dropped point, and writes from.
// The map flies there (the popup must end up ON SCREEN — a popup at coordinates off the canvas is still "visible" to
// Playwright). Here it is only looked at. Mapbox's geocoding is answered in the browser (one fixed Chicago address, as MOB.629's
// stubs do), so the test does not depend on Mapbox's index. Reads only.
import { expect, Page } from '@playwright/test';
import { appUrl } from '../support/session';

const PLACE = '1600 Main Street, Chicago, Illinois 60601, United States';
const LNG = -87.6298, LAT = 41.8781;

export async function mob125(page: Page): Promise<void> {
  let asked = 0;
  await page.route(/api\.mapbox\.com\/(search\/)?geocod/, (route) => {
    asked++;
    const feature = { id: 'address.dd125', type: 'Feature', place_type: ['address'], relevance: 1, text: 'Main Street',
      address: '1600', place_name: PLACE, center: [LNG, LAT], geometry: { type: 'Point', coordinates: [LNG, LAT] },
      properties: { accuracy: 'rooftop' }, context: [] };
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ type: 'FeatureCollection', query: ['1600', 'main'], features: [feature], attribution: '' }) });
  });
  try {
    await page.goto(appUrl('map'), { waitUntil: 'load' });
    await expect(page.locator('canvas.mapboxgl-canvas'), 'the map rendered').toBeVisible({ timeout: 60_000 });
    const box = page.getByPlaceholder('Search by address');
    await expect(box, 'the address search box').toBeVisible({ timeout: 30_000 });
    await box.click();
    await box.pressSequentially('1600 Main');
    const suggestion = page.locator('.mapboxgl-ctrl-geocoder .suggestions li').filter({ hasText: 'Main Street' }).first();
    await expect(suggestion, 'the (answered) suggestion is offered').toBeVisible({ timeout: 30_000 });
    expect(asked, "Mapbox's geocoding was answered in the browser").toBeGreaterThan(0);
    await suggestion.click();

    const popup = page.locator('.apm-map-popup-container');
    await expect(popup, "the pin's popup opened").toBeVisible({ timeout: 30_000 });
    // `toBeVisible` does not need the viewport, and the pin sits at the result's coordinates: the map must FLY there
    // (the geocoder keeps Mapbox's `flyTo`, zoom 17) before a user sees it. Wait until the popup is on screen.
    const vp = page.viewportSize()!;
    await expect.poll(async () => {
      const b = await popup.boundingBox();
      return !!b && b.x >= 0 && b.y >= 0 && b.x + b.width <= vp.width && b.y + b.height <= vp.height;
    }, { message: 'the map flew to the address: its popup is on screen', timeout: 20_000 }).toBe(true);
    await expect(popup.locator('h3'), 'titled with the place').toContainText('1600 Main Street');
    await expect(popup.locator('tr', { hasText: 'Latitude' }), 'its latitude').toContainText(String(LAT));
    await expect(popup.locator('tr', { hasText: 'Longitude' }), 'its longitude').toContainText(String(LNG));
    await expect(popup.getByRole('button', { name: 'Add Work' }), 'and Add Work — not clicked').toBeVisible();
    await page.screenshot({ path: 'results/MOB.125-popup.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.125-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  }
}
