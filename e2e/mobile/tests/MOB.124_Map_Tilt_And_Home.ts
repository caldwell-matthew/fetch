// MOB.124_Map_Tilt_And_Home — written for Playwright (not converted from Datadog).
//
// The map's own control buttons (`Map/MapGL/ControlButtons.tsx`), beside the Mapbox zoom group (`MapGL/MapControls.tsx`,
// `.mapboxgl-ctrl-group`): `Home` recentres on the map's starting point, the tilt button eases between flat and a 3D
// pitch, and the style button is MOB.121's. The tilt button's label is meant to read `3D` while flat and `2D` while
// tilted (`ControlButtons.tsx:59-60`), but the map hands it a constant `viewport={{ pitch: 0 }}` (`MapGL/index.tsx:322`),
// so it always reads `3D` — bugs §55; the label is RETURNED, not asserted, and the suite pins it. They change the VIEW only: no
// setting is saved (the pitch and the style are the component's state). Mapbox publishes neither the pitch nor the
// centre to the DOM, so they are read from the page's Mapbox instance (`support/map.ts`, trap 55): the tilt takes the
// pitch above 0 and back, and Home (`map.setCenter` to the starting point, `ControlButtons.tsx:48-55`) brings the centre
// back after a mouse-drag pan. Reads only.
import { expect, Page } from '@playwright/test';
import { mapView } from '../support/map';
import { appUrl } from '../support/session';

export async function mob124(page: Page): Promise<{ labelWhileTilted: string | null }> {
  let labelWhileTilted: string | null = null;
  try {
    await page.goto(appUrl('map'), { waitUntil: 'load' });
    const map = page.locator('.apm-map');
    await expect(map, 'the map container rendered').toBeVisible({ timeout: 60_000 });
    await expect(map.locator('canvas.mapboxgl-canvas'), 'the Mapbox canvas').toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.mapboxgl-ctrl-group').first(), "Mapbox's control group").toBeVisible({ timeout: 30_000 });

    // the app's own control column, below Mapbox's (`ControlButtons.tsx:47`)
    const controls = page.locator('.apm-map-control-container');
    await expect(controls.locator('button[data-tooltip-content]'), 'Home, tilt, style and map pick, in that order')
      .toHaveCount(4, { timeout: 30_000 });
    const tilt = controls.locator('button[data-tooltip-content="3D"], button[data-tooltip-content="2D"]').first();
    await expect(tilt, 'flat at first: the tilt button offers 3D').toHaveAttribute('data-tooltip-content', '3D', { timeout: 30_000 });
    const start = await mapView(page);
    expect(start.pitch, 'flat at first').toBe(0);
    await tilt.click();
    await expect.poll(async () => (await mapView(page)).pitch, { message: 'the map tilted', timeout: 10_000 }).toBeGreaterThan(0);
    labelWhileTilted = await tilt.getAttribute('data-tooltip-content');
    await expect(map.locator('canvas.mapboxgl-canvas'), 'the map survived tilting').toBeVisible();
    await tilt.click(); // back to flat
    await expect.poll(async () => (await mapView(page)).pitch, { message: 'flat again', timeout: 10_000 }).toBe(0);

    // Pan away with a mouse drag, then Home.
    const canvas = (await map.locator('canvas.mapboxgl-canvas').boundingBox())!;
    await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2);
    await page.mouse.down();
    await page.mouse.move(canvas.x + canvas.width / 2 - 200, canvas.y + canvas.height / 2 - 150, { steps: 10 });
    await page.mouse.up();
    const moved = await mapView(page);
    expect(Math.hypot(moved.lng - start.lng, moved.lat - start.lat), 'the drag moved the centre').toBeGreaterThan(1e-6);
    const home = controls.locator('button[data-tooltip-content="Home"]');
    await expect(home, 'the Home button').toBeVisible();
    await home.click();
    await expect.poll(async () => { const v = await mapView(page); return Math.hypot(v.lng - start.lng, v.lat - start.lat); },
      { message: 'Home: the centre is back where the map began', timeout: 10_000 }).toBeLessThan(1e-6);
    await expect(map.locator('canvas.mapboxgl-canvas'), 'the map survived Home').toBeVisible();
    await expect(page.getByText('Something went wrong.'), 'no crash').toHaveCount(0);
    return { labelWhileTilted };
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.124-failure.png' }).catch(() => undefined);
    throw err;
  }
}
