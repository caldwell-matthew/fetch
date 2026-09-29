// MOB.128_Map_Replace_Assets_Use_Map — written for Playwright (not converted from Datadog).
//
// A work stage's card → Change Asset → "Replace existing assets." → `Use Map` (MOB.930 opens the same popup and backs
// out) puts the map in pick mode (`Map/Popup/AssetMapPicker/AssetPickOverlay.tsx`): "Tap an asset on the map to
// select it." A tap on anything but an asset — a work stage — keeps pick mode and says "Please tap an asset on the map
// (not a workstage)." (`Map/index.tsx:341-366`). A tap on an asset asks "You selected <asset>. Are you sure?", and
// `Confirm` (`confirmAssetPick`, `:222-326`) removes EVERY asset link from the stage, clears its address and x/y
// ("Assets removed from work stage."), links the picked asset, moves the stage to that asset's address and x/y, and
// ends pick mode.
//
// Ending pick mode rewrites the card's selected work stage with its new x/y, reading the feature's `geometry`
// (`:291-306`). A card the map opened by itself after "View in Map" holds a SPREAD copy of a Mapbox feature
// (`:157-185`), whose `geometry` is a prototype getter the spread drops — so there it throws, and the overlay's
// Confirm spins for good (bugs §56, pinned by MOB.129). A card opened by a TAP copies `geometry` (`:370-392`), so
// this test re-opens the card by tapping the stage's own icon first.
//
// Owner, 2026-09-29 (trap 2): Replace may be CONFIRMED on a work order the tests made — never on a fixture. The target
// is a Ready stage in the crew's list whose work the test account created with a `DD SYNTHETIC MOBILE` description
// (MOB.300's), not a fixture, with at least one asset link, none to Pump 0102 or to the asset picked; the replace
// leaves it linked to that asset alone, and `cleanup_residue.py` prunes it later.
//
// Work stages are tappable only when drawn, so `My Work: Ready` is switched on and ALWAYS off again (MOB.930's
// layer handling). The map draws on a canvas: to know WHERE to tap, the test reads the page's Mapbox instance
// (`support/map.ts`'s `attachMap`, trap 55) and asks it what is drawn under a pixel — the same
// `queryRenderedFeatures(point)` the app runs on `touchend` (`Map/MapGL/index.tsx:99-138`). The taps are real touches,
// and the zooming is the map's own +/- buttons: the work tiles and the asset icons are not both drawn at every zoom
// (measured: Tank 0040 not at 15). Before the run the stage is moved (a server write) ~29 m east of the asset to be
// picked, so the stage's icon, the purple "View in Map" marker and the asset's icon are apart, and moved back there at
// the end (a work stage's icon hides an asset's under it). Every mutation but the layer switches and the replace's own
// four on THIS stage is stopped.
import { Browser, expect, Page, Route } from '@playwright/test';
import { attachMap, MY_WORK_READY, openChangeAsset, openWorkStageCard, readMapId, setLayer, shownLayers } from '../support/map';
import { appUrl, FIXTURE_WO, FORMS_WO, freshSession, serverRead } from '../support/session';
import { MOB302_WO } from '../support/fixtures';

const MARKER = 'DD SYNTHETIC MOBILE';
const NEVER = new Set([FIXTURE_WO, FORMS_WO, MOB302_WO]); // cleanup_residue.FIXTURE_STAGES
export const TANK_0040 = { name: 'Tank 0040', id: 'IRQxYt540QwpMd8BthoN8l' };
export const PUMP_0098 = { name: 'Pump 0098', id: 'ttcBk9ccUJgNUtRY4FosUt' }; // ~22 m from Tank 0040; no test uses it
const OFFSET_LNG = 0.0003; // ~29 m east at 30°N: both icons still on screen at zoom 19 (0.13 m/px, 768 px wide)
const CANDIDATES = '{ session { me { id } } workStages(crew: "<SESSION>", params: { limit: 1000 }) '
  + '{ edges { id status workId { problemDesc createdBy { id } } assets { assetId { name } } } } }';
const ASSET = 'query($id: ID!) { asset(id: $id) { name latitude longitude address } }';
const STAGE = 'query($id: ID!) { workStage(id: $id) { _workSequence x y address assets { id assetId { name } } } }';
const MOVE = 'mutation($id: ID!, $data: UpdateWorkStageInput!) { updateWorkStage(id: $id, data: $data) { id } }';
const REPLACE_FIELDS = /\b(removeWorkStageAssetLinks|addWorkStageAssetLink|updateWorkStage)\s*\(/;

type Pt = { x: number; y: number };
type Spots = { zoom: number; work: number; pick: Pt | null; ours: Pt | null; stage: Pt | null };
type Candidate = { id: string; status: string; workId: { problemDesc: string | null; createdBy: { id: string } | null }; assets: { assetId: { name: string } }[] };
export type Replaced = { stageId: string; ended: boolean };

/** In its own browser, with touch (the map selects on `touchend` alone). Returns the stage it replaced on. */
export async function mob128(browser: Browser): Promise<string> {
  const page = await freshSession(browser, { touch: true });
  try {
    const { stageId } = await replaceByMap(page, { pick: TANK_0040, card: 'tap', test: 'MOB.128' });
    return stageId;
  } finally {
    await page.context().close();
  }
}

/**
 * Page pixels to tap, read from the page's Mapbox instance (null where there is none on screen):
 *  pick   — its first asset (the one `onFeatureTouch` picks) is the asset to pick;
 *  ours   — on this stage's icon, and nothing else the app would select is under it;
 *  stage  — on some work stage's icon, with no asset under it.
 */
async function spots(page: Page, stageId: string, pickId: string): Promise<Spots> {
  await attachMap(page);
  return page.evaluate(({ stageId, pickId }) => {
    const w = window as unknown as { __ddMap?: any };
    const map = w.__ddMap;
    if (!map) throw new Error("the page's Mapbox instance was not found");
    const canvas = (map.getCanvas() as HTMLCanvasElement).getBoundingClientRect();
    const isAsset = (f: any) => !!f.properties?.assetType && !f.properties?.workStageId && typeof f.properties?.id === 'string';
    const isWork = (f: any) => f.source === 'work-mbtiles';
    const onCanvas = (p: Pt) => document.elementFromPoint(canvas.left + p.x, canvas.top + p.y) === map.getCanvas();
    const toPage = (p: Pt | null) => p && { x: canvas.left + p.x, y: canvas.top + p.y };
    const at = (coords: [number, number]) => { const p = map.project(coords); return { x: p.x, y: p.y }; };
    const under = (p: Pt) => map.queryRenderedFeatures([p.x, p.y]);
    const near = (c: Pt, ok: (p: Pt) => boolean): Pt | null => {
      for (let r = 0; r <= 16; r += 2) {
        for (let d = -r; d <= r; d += 2) {
          for (const p of [{ x: c.x + d, y: c.y - r }, { x: c.x + d, y: c.y + r }, { x: c.x - r, y: c.y + d }, { x: c.x + r, y: c.y + d }]) {
            if (p.x < 0 || p.y < 0 || p.x > canvas.width || p.y > canvas.height) continue;
            if (onCanvas(p) && ok(p)) return p;
          }
        }
      }
      return null;
    };
    const drawn = map.queryRenderedFeatures();
    const points = (fs: any[]) => fs.filter((f) => f.geometry?.type === 'Point').slice(0, 30).map((f) => at(f.geometry.coordinates));
    const first = (cs: Pt[], ok: (p: Pt) => boolean): Pt | null => { for (const c of cs) { const p = near(c, ok); if (p) return p; } return null; };
    const pick = first(points(drawn.filter((f: any) => isAsset(f) && f.properties.id === pickId)),
      (p) => under(p).find(isAsset)?.properties.id === pickId);
    const ours = first(points(drawn.filter((f: any) => isWork(f) && f.properties?.id === stageId)),
      (p) => { const fs = under(p).filter((f: any) => isWork(f) || isAsset(f)); return fs.length > 0 && fs.every((f: any) => isWork(f) && f.properties?.id === stageId); });
    const stage = first(points(drawn.filter(isWork)), (p) => { const fs = under(p); return fs.some(isWork) && !fs.some(isAsset); });
    return { zoom: map.getZoom(), work: drawn.filter(isWork).length, pick: toPage(pick), ours: toPage(ours), stage: toPage(stage) };
  }, { stageId, pickId });
}

/**
 * Replace a test-made stage's assets with `pick` through Use Map. `card: 'tap'` re-opens the stage's card by a tap on
 * its icon and also taps a work stage in pick mode; `card: 'auto'` keeps the card the map opened by itself (§56).
 * Proves the replace on the server either way; `ended` is whether the overlay closed. `stageId` reuses a stage.
 */
export async function replaceByMap(page: Page, opts: { pick: { name: string; id: string }; card: 'tap' | 'auto'; test: string; stageId?: string }): Promise<Replaced> {
  const { pick } = opts;
  const asset = (await serverRead(page, ASSET, { id: pick.id })).asset;
  expect(asset?.name, `PREMISE: ${pick.id} is ${pick.name}`).toBe(pick.name);
  expect(asset.latitude && asset.longitude, `PREMISE: ${pick.name} has coordinates`).toBeTruthy();

  let stageId = opts.stageId;
  if (!stageId) {
    const all = await serverRead(page, CANDIDATES);
    const me = all.session.me.id;
    const target = (all.workStages.edges as Candidate[]).find((s) => !NEVER.has(s.id) && s.status === 'Ready'
      && s.workId?.createdBy?.id === me && (s.workId.problemDesc ?? '').trim().startsWith(MARKER)
      && s.assets.length > 0 && !s.assets.some((a) => ['Pump 0102', pick.name].includes(a.assetId.name)));
    expect(target, `PREMISE: a Ready work order the tests made ("${MARKER}", MOB.300) with an asset link, none to Pump 0102 or ${pick.name}`).toBeTruthy();
    stageId = target!.id;
  }
  expect(NEVER.has(stageId), 'never a fixture').toBe(false);

  // Beside the asset, so the stage's icon (and the purple marker over it) and the asset's are apart.
  await serverRead(page, MOVE, { id: stageId, data: { x: asset.longitude + OFFSET_LNG, y: asset.latitude } });
  const before = (await serverRead(page, STAGE, { id: stageId })).workStage;
  expect(before.x, 'the stage was moved beside the asset').toBeCloseTo(asset.longitude + OFFSET_LNG, 6);
  expect(before.assets.length, 'PREMISE: the stage has an asset link to replace').toBeGreaterThan(0);
  expect(before.assets.some((a: { assetId: { name: string } }) => a.assetId.name === pick.name), `PREMISE: not already linked to ${pick.name}`).toBe(false);
  const linksBefore: string[] = before.assets.map((a: { id: string }) => a.id);

  const stopped: string[] = [];
  const sent: string[] = [];
  let saves = 0;
  const guard = async (route: Route) => {
    let body: { query?: string; operationName?: string; variables?: Record<string, unknown> } | null = null;
    try { body = route.request().postDataJSON(); } catch { /* not JSON — an upload; let it be */ }
    const query = body?.query ?? '';
    if (!/^\s*mutation\b/.test(query)) return route.fallback();
    if (/\b_updateMapSettings\b/.test(query)) { saves++; return route.fallback(); } // the layer switch
    const field = REPLACE_FIELDS.exec(query)?.[1];
    const v = body?.variables ?? {};
    if (field && (v.parentId === stageId || v.id === stageId)) { sent.push(field); return route.fallback(); }
    stopped.push(body?.operationName ?? query.slice(0, 60));
    return route.abort('failed');
  };
  await page.route('**/graphql', guard);
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'log' && /TypeError/.test(m.text())) pageErrors.push(m.text().split('\n')[0]); }); // the pick's catch logs

  let ended = false;
  await page.goto(appUrl('map'), { waitUntil: 'load' });
  await expect(page.locator('canvas.mapboxgl-canvas'), 'the map rendered').toBeVisible({ timeout: 60_000 });
  const mapId = await readMapId(page);
  const layersBefore = await shownLayers(page, mapId);
  try {
    await setLayer(page, true);
    await expect.poll(async () => (await shownLayers(page, mapId)).length,
      { message: `the server saved "${MY_WORK_READY}" on for the account`, timeout: 30_000 }).toBe(layersBefore.length + 1);

    let gear = await openWorkStageCard(page, stageId, before._workSequence, { tapFallback: opts.card === 'tap' });
    const find = async (dir: 'in' | 'out', found: (s: Spots) => boolean, limit: number): Promise<Spots> => {
      let s = await spots(page, stageId!, pick.id);
      for (let i = 0; i < 6 && !found(s) && (dir === 'in' ? s.zoom < limit : s.zoom > limit); i++) {
        await page.locator(`.mapboxgl-ctrl-zoom-${dir}`).click();
        await page.waitForTimeout(2_000); // the zoom eases, then tiles and icons load
        s = await spots(page, stageId!, pick.id);
      }
      return s;
    };
    await page.waitForTimeout(2_000); // the work tiles load after the card opens
    if (opts.card === 'tap') {
      const s = await find('in', (x) => !!x.ours, 18);
      expect(s.ours, `a spot on this stage's icon alone (${JSON.stringify(s)})`).toBeTruthy();
      await page.touchscreen.tap(s.ours!.x, s.ours!.y);
      gear = page.locator('[aria-label="map-options"]');
      await expect(gear, 'the tap opened the card').toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(before._workSequence, { exact: true }).first(), `the card is ${before._workSequence}'s`).toBeVisible();
    }

    const popup = await openChangeAsset(page, gear);
    await popup.getByText('Replace existing assets.', { exact: true }).click();
    await expect(popup.getByText('Replacing assets...'), '"Replacing assets..."').toBeVisible({ timeout: 10_000 });
    await popup.getByRole('button', { name: 'Use Map' }).click();
    await expect(popup, 'Use Map closed the popup').toHaveCount(0, { timeout: 10_000 });
    const prompt = page.getByText('Tap an asset on the map to select it.');
    await expect(prompt, 'pick mode: "Tap an asset on the map to select it."').toBeVisible({ timeout: 10_000 });

    if (opts.card === 'tap') {
      const s = await find('out', (x) => !!x.stage, 13);
      expect(s.stage, `a spot on a work stage's icon with no asset under it (${JSON.stringify(s)})`).toBeTruthy();
      await page.touchscreen.tap(s.stage!.x, s.stage!.y);
      await expect(page.getByText('Please tap an asset on the map (not a workstage).'), 'a work stage is refused').toBeVisible({ timeout: 10_000 });
      await expect(prompt, 'and pick mode stays').toBeVisible();
    }

    const s = await find('in', (x) => !!x.pick, 19);
    expect(s.pick, `a spot whose first asset is ${pick.name} (${JSON.stringify(s)})`).toBeTruthy();
    await page.touchscreen.tap(s.pick!.x, s.pick!.y);
    // `You selected <b>name</b>.<br><br>Are you sure?` — no space in its text
    const asked = page.getByText(new RegExp(`You selected\\s*${pick.name}\\.\\s*Are you sure\\?`));
    await expect(asked, `${pick.name} picked: "You selected ${pick.name}. Are you sure?"`).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Pick another' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(page.getByText('Assets removed from work stage.'), 'the old links went').toBeVisible({ timeout: 30_000 });

    // SERVER: exactly one link, to the picked asset, and the stage moved onto it.
    await expect.poll(async () => {
      const st = (await serverRead(page, STAGE, { id: stageId })).workStage;
      return { links: st.assets.map((a: { assetId: { name: string } }) => a.assetId.name), x: st.x, y: st.y, address: st.address };
    }, { message: `the stage holds only ${pick.name}, at ${pick.name}'s address and coordinates`, timeout: 30_000 })
      .toEqual({ links: [pick.name], x: asset.longitude, y: asset.latitude, address: asset.address });
    const after = (await serverRead(page, STAGE, { id: stageId })).workStage;
    expect(after.assets.filter((a: { id: string }) => linksBefore.includes(a.id)), 'none of the old links survived').toEqual([]);

    ended = await expect(asked, 'pick mode ended: the overlay closed').toHaveCount(0, { timeout: 20_000 }).then(() => true, () => false);
    await page.screenshot({ path: `results/${opts.test}-${ended ? 'replaced' : 'stuck'}.png` });
    if (opts.card === 'tap') expect(ended, `pick mode ended: the overlay closed (page errors: ${JSON.stringify(pageErrors)})`).toBe(true);
    else if (!ended) {
      // §56's symptoms, so the pin can tell them from any other failure: the spinner stays, and the pick's own catch logged the throw.
      await expect(page.getByRole('button', { name: 'Cancel' }), 'Cancel stays disabled').toBeDisabled();
      expect(pageErrors.some((e) => /reading 'type'/.test(e)), `the pick threw reading 'type' (${JSON.stringify(pageErrors)})`).toBe(true);
    }
  } catch (err) {
    await page.screenshot({ path: `results/${opts.test}-failure.png` }).catch(() => undefined); // before the restore reloads
    throw err;
  } finally {
    // ALWAYS switch the layer off again, the same way, and prove the account is back where it was.
    await setLayer(page, false);
    await expect.poll(async () => (await shownLayers(page, mapId)).join(','),
      { message: "the account's shown layers are exactly as before the test", timeout: 30_000 }).toBe(layersBefore.join(','));
    await page.unroute('**/graphql', guard);
    // The replace puts the stage ON the asset, and a work stage's icon sits above an asset's and hides it (Mapbox
    // drops colliding symbols): left there, it would bury the icon the next run taps. Back beside it, where it began.
    await serverRead(page, MOVE, { id: stageId, data: { x: asset.longitude + OFFSET_LNG, y: asset.latitude } });
  }

  expect(stopped, 'no other mutation was sent').toEqual([]);
  expect(sent, "the replace's own writes: remove the links, clear the location, link the asset, set the location")
    .toEqual(['removeWorkStageAssetLinks', 'updateWorkStage', 'addWorkStageAssetLink', 'updateWorkStage']);
  expect(saves, 'and the two layer switches').toBeGreaterThanOrEqual(2);
  return { stageId, ended };
}
