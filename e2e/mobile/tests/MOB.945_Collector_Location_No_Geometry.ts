// MOB.945_Collector_Location_No_Geometry — written for Playwright (not converted from Datadog).
//
// The collector's `Location` on a new asset goes to the server as an `UPDATE_ASSET` queued behind the collect
// (`AssetCollector/utils/createAsset.ts:166-204`): the address when `Include Address` is on, and the coordinates
// (`centroid`) only when `Include GIS` is on AND the asset's type has a geometry (`assetTypeHasGeometry`). MOB.600 proves
// the Point-type branch on the server; this is the other one — a type whose record has NO geometry, `Visual Fault
// Locator`. The location is captured BEFORE the type is picked, with `Include GIS` on (the form disables it once a
// no-geometry type is chosen); the update must still carry the address and no centroid — `createAsset` drops it.
//
// Read-only: the update waits in the queue for the collect (`waitForKeys`), and a REFUSED collect drops it unsent — so
// the collect is ANSWERED in the browser as the server answers it (`fixtures/collect_asset_response.json`, a real answer
// with this run's id and name, and the picked type with no geometry), and the update that follows is refused. What the
// app SENT is what the test reads; a server read afterwards proves no asset carries this run's name. The geolocation
// and Mapbox stubs are MOB.629's.
import path from 'path';
import fs from 'fs';
import { expect, Page, Request, Route } from '@playwright/test';
import { failOperation } from '../../support/network';
import { runId } from '../../support/env';
import { appUrl, serverRead } from '../support/session';

const TYPE = 'Visual Fault Locator'; // an asset type whose record has no geometry (2026-09-28)
const REJECTION = 'DD SYNTHETIC 945: the test refused this asset';
const COLLECT_ANSWER = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'fixtures', 'collect_asset_response.json'), 'utf8'));

export async function mob945(page: Page): Promise<{ toggles: boolean[] }> {
  const name = `DD SYNTHETIC MOBILE 945 ${runId('numeric', 8)}`;
  const updates: Record<string, unknown>[] = [];
  const onRequest = (r: Request) => {
    if (!r.url().endsWith('/graphql') || r.method() !== 'POST') return;
    try {
      const b = r.postDataJSON();
      if (/\bupdateAsset\s*\(/.test(b?.query ?? '')) updates.push(b.variables?.data ?? {});
    } catch { /* not JSON */ }
  };
  page.on('request', onRequest);
  let toggles: boolean[] = [];

  try {
    await page.goto(appUrl('asset-collector'), { waitUntil: 'load' });
    await page.locator('.mantine-Affix-root button').first().click({ timeout: 60_000 });
    const form = page.locator('#asset-collector');
    await expect(form, 'the new-asset form opened').toBeVisible({ timeout: 30_000 });
    await form.locator('#name').fill(name);

    // MOB.629's stubs: a fixed position, and Mapbox's geocode answered (everything else passes)
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      if (!w.__ddOrigFetch) w.__ddOrigFetch = window.fetch;
      navigator.geolocation.getCurrentPosition = ((ok: PositionCallback) =>
        ok({ coords: { latitude: 41.8781, longitude: -87.6298, accuracy: 5 } } as GeolocationPosition)) as typeof navigator.geolocation.getCurrentPosition;
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const u = typeof input === 'string' ? input : ((input as { url?: string })?.url || String(input));
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
    const row = form.locator('[class*="mantine-Group-root"]').filter({ has: page.locator('p', { hasText: /^Location$/ }) }).first();
    await row.locator('[class*="mantine-ActionIcon-root"]').filter({ has: page.locator('svg[data-icon="location-crosshairs"]') }).click();
    const loc = page.locator('#mobile-geolocate');
    await expect(loc, 'the location form opened').toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => (await loc.locator('input').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))).join('|'),
      { message: 'prefilled from the geocode', timeout: 30_000 }).toContain('1600 Main Street');
    // No type is picked yet, so `Include GIS` is allowed and on (`Form/index.tsx:167-168`) — picked first, a no-geometry
    // type disables it in this form (`AssetGeolocate.tsx:86`). The type comes AFTER, so the guard in `createAsset` is
    // what must drop the coordinates.
    toggles = await loc.locator('input[type="checkbox"]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).checked));
    expect(toggles, 'Include GIS and Include Address both on, before a type is picked').toEqual([true, true]);
    await page.locator('button[form="mobile-geolocate"]').click();
    await expect(loc, 'the location form closed').toHaveCount(0, { timeout: 20_000 });
    await expect(form, 'the new-asset form holds the location').toContainText('1600 Main Street', { timeout: 15_000 });
    await form.locator('#typeId').click();
    await form.locator('#typeId').pressSequentially(TYPE);
    await page.getByRole('option').filter({ hasText: new RegExp(`^${TYPE}$`) }).first().click({ timeout: 30_000 });

    // the collect, answered here — never sent to dev
    let collects = 0;
    const answer = async (route: Route) => {
      let b: { query?: string; variables?: { data?: { id: string; name: string; desc?: string; typeId?: string } } } | null = null;
      try { b = route.request().postDataJSON(); } catch { /* not JSON */ }
      if (!/\bcollectAsset\s*\(/.test(b?.query ?? '')) return route.fallback();
      collects++;
      const d = b!.variables!.data!;
      const now = new Date().toISOString();
      const asset = { ...COLLECT_ANSWER.data.collectAsset, id: d.id, name: d.name, desc: d.desc ?? null, createdAt: now, updatedAt: now,
        statusDate: now, attachments: [], typeId: { ...COLLECT_ANSWER.data.collectAsset.typeId, id: d.typeId, name: TYPE, geometry: null } };
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { collectAsset: asset } }) });
    };
    await page.route('**/graphql', answer);
    const update = await failOperation(page, { field: 'updateAsset' }, { kind: 'graphql', message: REJECTION });
    try {
      await page.locator('button[form="asset-collector"]').click();
      await expect.poll(() => updates.length, { message: 'the location update was sent (and refused)', timeout: 30_000 }).toBeGreaterThan(0);
      expect(collects, 'the collect was answered in the browser (nothing created)').toBeGreaterThan(0);
      expect(update.hits, 'the update was refused (nothing written)').toBeGreaterThan(0);
    } finally {
      await update.stop();
      await page.unroute('**/graphql', answer);
    }
    const sent = updates[0];
    expect(sent.address, 'the update carries the address').toBe('1600 Main Street');
    expect('centroid' in sent && sent.centroid !== undefined && sent.centroid !== null,
      `no coordinates for a type with no geometry — sent ${JSON.stringify(sent)}`).toBe(false);
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.945-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    page.off('request', onRequest);
  }
  const found = (await serverRead(page, 'query($p: TableQuery) { assets(params: $p) { edges { id } } }',
    { p: { limit: 2, query: { connector: 'AND', conditions: [{ column: 'name', operator: 'CONTAINS', value: name }] } } })).assets.edges;
  expect(found.length, 'the server holds no asset with this run\'s name').toBe(0);
  return { toggles };
}
