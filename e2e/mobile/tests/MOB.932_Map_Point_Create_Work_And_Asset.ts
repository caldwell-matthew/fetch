// MOB.932_Map_Point_Create_Work_And_Asset — written for Playwright (not converted from Datadog).
//
// The mobile map's one drawing tool is the POINT (`mentor-map/src/overlay/mapDrawControl.ts:68-73`: `point: true`,
// and `displayControlsDefault: !isMobile` hides the rest; `DrawControls.tsx:41` "Only displaying draw_point right
// now"). The mobile handler ignores any other geometry (`Map/MapGL/index.tsx:252`), and its lasso handler is
// `console.log` (`Map/index.tsx:423`) — so there is no lasso, line or polygon to test on mobile.
//
// A dropped point is reverse-geocoded and opens the geocoder popup at that spot (`MapGL/index.tsx:251-266`) with its
// Latitude and Longitude and two actions (`Map/Popup/GeocoderPopup.tsx`): "Add Work" — a new work order at the
// point — and "Add Asset" — a new asset placed there (`createAsset`, then `UPDATE_ASSET_LOCATION`). The same form's
// "Add Existing Asset" would MOVE a real asset to the point: never used, and a route stops any location update for an
// asset that is not this run's.
//
// Both records are marked `DD SYNTHETIC MOBILE MAP <run>` and left as residue (owner, 2026-09-23);
// `cleanup_residue.py` prunes them. Both are proven over `/graphql`, at the dropped point's coordinates.
import { Browser, expect, Page, Route } from '@playwright/test';
import { runId } from '../../support/env';
import { appUrl, freshSession, serverRead, serverReadDirect } from '../support/session';

const STAGES = 'query($p: TableQuery) { workStages(params: $p) { edges { id x y workId { problemDesc } } } }';
const ASSETS = 'query($p: TableQuery) { assets(params: $p) { edges { id name latitude longitude } } }';
const containing = (column: string, value: string) =>
  ({ p: { limit: 10, query: { connector: 'AND', conditions: [{ column, operator: 'CONTAINS', value }] } } });
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/** In its own browser, with touch: the draw tool places the point on a tap. */
export async function mob932(browser: Browser): Promise<void> {
  const page = await freshSession(browser, { touch: true });
  try {
    await dropAndCreate(page);
  } finally {
    await page.context().close();
  }
}

async function dropAndCreate(page: Page): Promise<void> {
  const marker = `DD SYNTHETIC MOBILE MAP ${runId('numeric', 8)}`;

  // Only THIS run's asset may be given a location.
  const moved: string[] = [];
  const guard = async (route: Route) => {
    let body: { query?: string; variables?: { assetId?: string } } | null = null;
    try { body = route.request().postDataJSON(); } catch { /* not JSON */ }
    if (!/\bupdateAssetLocation\b/.test(body?.query ?? '')) return route.fallback(); // by field, not name (trap 43)
    const name = (await serverReadDirect(page, 'query($id: ID!) { asset(id: $id) { name } }', { id: body?.variables?.assetId }))
      .asset?.name;
    moved.push(name ?? '(unknown)');
    return name === marker ? route.fallback() : route.abort('failed');
  };
  await page.route('**/graphql', guard);

  try {
    await page.goto(appUrl('map'), { waitUntil: 'load' });
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await expect(canvas, 'the map rendered').toBeVisible({ timeout: 60_000 });
    const tool = page.locator('button.mapbox-gl-draw_point');
    await expect(tool, 'the point tool is offered').toBeVisible({ timeout: 30_000 });
    await expect(page.locator('button.mapbox-gl-draw_line, button.mapbox-gl-draw_polygon'), 'and no line or polygon tool')
      .toHaveCount(0);

    // Drop a point a little below the centre, clear of the controls.
    await tool.click();
    const box = (await canvas.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width * 0.45, box.y + box.height * 0.6);

    const popup = page.locator('.mapboxgl-popup').filter({ hasText: 'Latitude' });
    await expect(popup, "the point's popup opened").toBeVisible({ timeout: 30_000 });
    const coord = async (label: string) =>
      Number(await popup.locator('tr', { hasText: label }).locator('td').nth(1).innerText());
    const lat = await coord('Latitude');
    const lng = await coord('Longitude');
    expect(Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0), `the point has coordinates (${lat}, ${lng})`)
      .toBe(true);

    // "Add Work" → a work order at the point (MOB.122's form).
    await popup.getByRole('button', { name: 'Add Work' }).click();
    const workModal = page.locator('.mantine-Modal-content', { hasText: 'Creating New Work Order' });
    await expect(workModal, 'the create modal opened from the point').toBeVisible({ timeout: 30_000 });
    await workModal.locator('#workflowTitleId').click();
    await workModal.locator('#workflowTitleId').fill('Datadog Test');
    await page.getByRole('option').filter({ hasText: 'Datadog Test' }).first().click({ timeout: 30_000 });
    await workModal.locator('#problemDesc').fill(marker);
    await workModal.getByRole('button', { name: 'Create Work Order' }).click();
    await expect(workModal, 'the create modal closed').toHaveCount(0, { timeout: 60_000 });

    await expect.poll(async () => {
      const edges = (await serverRead(page, STAGES, containing('problemDesc', marker))).workStages.edges
        .filter((s: { workId: { problemDesc: string | null } }) => (s.workId?.problemDesc ?? '').trim() === marker);
      return edges.length === 1 && near(edges[0].x, lng) && near(edges[0].y, lat);
    }, { message: `the server has ONE work order "${marker}" at (${lat}, ${lng})`, timeout: 60_000 }).toBe(true);

    // "Add Asset" → Get New Asset → an asset placed at the point.
    await expect(popup, 'the popup is still open').toBeVisible({ timeout: 15_000 });
    await popup.getByRole('button', { name: 'Add Asset' }).click();
    const form = page.locator('form#asset-collector');
    await expect(form, 'the new-asset form opened').toBeVisible({ timeout: 30_000 });
    await form.locator('#name').fill(marker);
    await form.locator('#desc').fill('Created by the Playwright suite - safe to delete');
    await form.locator('#typeId').click();
    await page.getByRole('option').filter({ hasText: 'Actuator Tools' }).first().click({ timeout: 30_000 });
    await page.locator('button[form="asset-collector"]').click();
    await expect(form, 'the new-asset form closed').toHaveCount(0, { timeout: 60_000 });

    await expect.poll(async () => {
      const edges = (await serverRead(page, ASSETS, containing('name', marker))).assets.edges
        .filter((a: { name: string }) => a.name === marker);
      return edges.length === 1 && near(edges[0].latitude, lat) && near(edges[0].longitude, lng);
    }, { message: `the server has ONE asset "${marker}" at (${lat}, ${lng})`, timeout: 90_000 }).toBe(true);
  } finally {
    await page.unroute('**/graphql', guard);
  }
  expect(moved.every((n) => n === marker), `only this run's asset was given a location (${moved.join(', ')})`).toBe(true);
}
