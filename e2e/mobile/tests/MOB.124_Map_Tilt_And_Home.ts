// MOB.124_Map_Tilt_And_Home — written for Playwright (not converted from Datadog).
//
// The map's own control buttons (`Map/MapGL/ControlButtons.tsx`), beside the Mapbox zoom group (`MapGL/MapControls.tsx`,
// `.mapboxgl-ctrl-group`): `Home` recentres on the map's starting point, the tilt button eases between flat and a 3D
// pitch, and the style button is MOB.121's. The tilt button's label is meant to read `3D` while flat and `2D` while
// tilted (`ControlButtons.tsx:59-60`), but the map hands it a constant `viewport={{ pitch: 0 }}` (`MapGL/index.tsx:322`),
// so it always reads `3D` — bugs §55; the label is RETURNED, not asserted, and the suite pins it. They change the VIEW only: no
// setting is saved (the pitch and the style are the component's state). Mapbox publishes neither the pitch nor the
// centre to the page, so the proof is the button's own label and a map that survives — the limit MOB.121 notes for zoom.
// Reads only.
import { expect, Page } from '@playwright/test';
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
    await tilt.click();
    await page.waitForTimeout(1_500); // the ease animates
    labelWhileTilted = await tilt.getAttribute('data-tooltip-content');
    await expect(map.locator('canvas.mapboxgl-canvas'), 'the map survived tilting').toBeVisible();
    await tilt.click(); // back to flat
    await page.waitForTimeout(1_500);

    const home = controls.locator('button[data-tooltip-content="Home"]');
    await expect(home, 'the Home button').toBeVisible();
    await home.click();
    await page.waitForTimeout(1_500); // the fly-to animates
    await expect(map.locator('canvas.mapboxgl-canvas'), 'the map survived Home').toBeVisible();
    await expect(page.getByText('Something went wrong.'), 'no crash').toHaveCount(0);
    return { labelWhileTilted };
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.124-failure.png' }).catch(() => undefined);
    throw err;
  }
}
