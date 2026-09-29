/**
 * Opening an asset's card on the map, the way a user does: Asset Lookup → search → expand → "View in Map".
 *
 * The map then opens the asset's card by itself (`Map/index.tsx:139-186`), but only for an icon it has DRAWN, and only
 * on a source event (trap 42) — so when it misses, a tap just below the purple marker's tip opens it. The page must
 * have touch (`freshSession(browser, { touch: true })`): the map selects on `touchend` alone.
 */
import { expect, Locator, Page } from '@playwright/test';
import { appUrl, serverRead } from './session';

/** Returns the card's options gear (`aria-label="map-options"`), visible. */
export async function openAssetCard(page: Page, asset: string): Promise<Locator> {
  await page.goto(appUrl('asset-lookup'), { waitUntil: 'load' });
  const search = page.locator('input[name="asset-search"]');
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.fill(asset);
  await search.press('Enter');
  const result = page.locator('.mantine-Accordion-item').filter({ hasText: asset }).first();
  await expect(result, `a result row for ${asset}`).toBeVisible({ timeout: 60_000 });
  await result.locator('.mantine-Accordion-control').click();
  await result.getByRole('button', { name: 'View in Map' }).click();

  await expect(page, 'on the map').toHaveURL(/\/map/, { timeout: 30_000 });
  const gear = page.locator('[aria-label="map-options"]');
  try {
    await expect(gear).toBeVisible({ timeout: 20_000 });
  } catch {
    const pin = (await page.locator('.mapboxgl-marker').first().boundingBox())!;
    await page.touchscreen.tap(pin.x + pin.width / 2, pin.y + pin.height + 8);
  }
  await expect(gear, 'the asset card opened, with its options menu').toBeVisible({ timeout: 30_000 });
  return gear;
}

/** The work layer MOB.928/930/128 switch on so a work stage is DRAWN (every work layer is off for the test account). */
export const MY_WORK_READY = 'My Work: Ready';
const SETTINGS = 'query($mapId: ID!) { _mapSettings(mapId: $mapId) { id displayedLayers } }';

/** The map in use, kept in session storage (`Map/index.tsx:61`). The page must be on the map. */
export async function readMapId(page: Page): Promise<string> {
  let id = '';
  await expect.poll(async () => (id = await page.evaluate(() => {
    const raw = sessionStorage.getItem('mobile-map-id') ?? '';
    try { return String(JSON.parse(raw) ?? ''); } catch { return raw; }
  })), { message: 'the map has an id', timeout: 30_000 }).not.toBe('');
  return id;
}

/** The layers the server holds as shown for the account, sorted. */
export async function shownLayers(page: Page, mapId: string): Promise<string[]> {
  return [...((await serverRead(page, SETTINGS, { mapId }))._mapSettings.displayedLayers ?? [])].sort();
}

/** Tick or untick one layer in the map's Layers panel — the app's own path, which saves the account's settings. */
export async function setLayer(page: Page, on: boolean, layer = MY_WORK_READY): Promise<void> {
  await page.goto(appUrl('map'), { waitUntil: 'load' }); // fresh: nothing a failed step left open is in the way
  await expect(page.locator('canvas.mapboxgl-canvas'), 'the map rendered').toBeVisible({ timeout: 60_000 });
  await page.getByText('Layers', { exact: true }).click();
  const box = page.getByRole('checkbox', { name: layer, exact: true });
  await expect(box, `the Layers panel lists "${layer}"`).toHaveCount(1, { timeout: 30_000 });
  await box.scrollIntoViewIfNeeded();
  if ((await box.isChecked()) !== on) await box.click();
  await expect(box, `"${layer}" is ${on ? 'on' : 'off'}`).toBeChecked({ checked: on });
  await page.getByText('Hide All').locator('xpath=ancestor::*[.//button][1]').locator('button.mantine-CloseButton-root, button[class*="CloseButton"]').first()
    .click().catch(() => page.keyboard.press('Escape'));
}

/**
 * Open a work stage's card on the map as a user does: the work order → its globe → "View in Map". The map opens the
 * card by itself when the stage is DRAWN (a work layer on, e.g. `MY_WORK_READY`); when it misses, a tap just below
 * the purple marker's tip (unless `tapFallback: false` — the card must open by itself). Returns the card's options
 * gear, visible. The page must have touch.
 */
export async function openWorkStageCard(page: Page, stageId: string, workSequence: string, opts: { tapFallback?: boolean } = {}): Promise<Locator> {
  // Through the list first: its prefetch loads what the detail needs.
  await page.goto(appUrl('work'), { waitUntil: 'load' });
  await expect(page.locator('#page-title h4', { hasText: 'Work Orders' })).toBeVisible({ timeout: 60_000 });
  await page.goto(appUrl(`work/${stageId}`), { waitUntil: 'load' });
  await expect(page.getByRole('tab').first(), 'the work order opened').toBeVisible({ timeout: 60_000 });
  await page.locator('button:has([data-icon="globe"])').first().click();
  await page.locator('.mantine-Menu-item', { hasText: 'View in Map' }).click();
  await expect(page, 'on the map').toHaveURL(/\/map/, { timeout: 30_000 });

  const gear = page.locator('[aria-label="map-options"]');
  if (opts.tapFallback === false) {
    await expect(gear, 'PREMISE: the map opened the work stage card by itself').toBeVisible({ timeout: 40_000 });
  } else {
    try {
      await expect(gear).toBeVisible({ timeout: 20_000 });
    } catch {
      const pin = (await page.locator('.mapboxgl-marker').first().boundingBox())!;
      await page.touchscreen.tap(pin.x + pin.width / 2, pin.y + pin.height + 8);
    }
  }
  await expect(gear, 'the work stage card opened, with its options menu').toBeVisible({ timeout: 30_000 });
  // A work card is titled with the stage's sequence number (`Map/Card/WorkCard.tsx:26`).
  await expect(page.getByText(workSequence, { exact: true }).first(), `the card is ${workSequence}'s`).toBeVisible();
  return gear;
}

/**
 * The card's gear → "Change Asset" → `ChangeAssetPopup`. It renders only once the card's work stage has loaded
 * (`CardHeader.tsx:216`), so reopen until it shows. Found by its Cancel button, which both of its states show — the
 * question goes once a choice is made. Returns the popup.
 */
export async function openChangeAsset(page: Page, gear: Locator): Promise<Locator> {
  const popup = page.locator('.mantine-Modal-content').filter({ has: page.getByRole('button', { name: 'Cancel' }) });
  const question = popup.getByText('How would you like to change the asset information for this work stage?');
  await expect(async () => {
    await gear.click();
    await page.getByRole('menuitem', { name: 'Change Asset' }).click({ timeout: 5_000 });
    await expect(question).toBeVisible({ timeout: 3_000 });
  }, 'the Change Asset popup opened').toPass({ timeout: 60_000 });
  return popup;
}

/**
 * RUNS IN THE PAGE. Find the page's Mapbox map through React's fiber, from the map container up to the object with
 * `project` and `queryRenderedFeatures` (trap 55), and keep it on `window.__ddMap`. Found again when the map it holds
 * has left the page. Returns whether there is one.
 */
function findMapInPage(): boolean {
  const w = window as unknown as { __ddMap?: any };
  if (w.__ddMap?.getContainer?.()?.isConnected) return true;
  w.__ddMap = undefined;
  const el = document.querySelector('.mapboxgl-map') as any;
  const key = Object.keys(el ?? {}).find((k) => k.startsWith('__reactFiber'));
  const seen = new Set<unknown>();
  const look = (v: any, depth: number): any => {
    if (!v || typeof v !== 'object' || seen.has(v) || depth > 4) return null;
    seen.add(v);
    if (typeof v.project === 'function' && typeof v.queryRenderedFeatures === 'function') return v;
    for (const k of ['current', 'memoizedState', 'next', 'queue', 'baseState', 'map']) {
      const m = k in v ? look(v[k], depth + 1) : null;
      if (m) return m;
    }
    return null;
  };
  for (let f = key ? el[key] : null, i = 0; f && !w.__ddMap && i < 60; f = f.return, i++) {
    w.__ddMap = look(f.memoizedState, 0) ?? look(f.stateNode, 0);
  }
  return !!w.__ddMap;
}

/** Make the page's Mapbox map available as `window.__ddMap` (see `findMapInPage`). */
export async function attachMap(page: Page): Promise<void> {
  expect(await page.evaluate(findMapInPage), "the page's Mapbox instance").toBe(true);
}

/** What Mapbox does not publish to the DOM: the map's zoom, pitch and centre. */
export async function mapView(page: Page): Promise<{ zoom: number; pitch: number; lng: number; lat: number }> {
  await attachMap(page);
  return page.evaluate(() => {
    const m = (window as unknown as { __ddMap: any }).__ddMap;
    const c = m.getCenter();
    return { zoom: m.getZoom(), pitch: m.getPitch(), lng: c.lng, lat: c.lat };
  });
}
