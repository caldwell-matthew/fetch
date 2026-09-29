// MOB.930_Map_Card_Change_Asset_Cancel — written for Playwright (not converted from Datadog).
//
// A work stage's card on the map offers "Change Asset" (`Map/Card/CardHeader.tsx:92-101`), which opens
// `ChangeAssetPopup` (`Map/Popup/ChangeAssetPopup.tsx`): a question, "Warning: This action cannot be undone.", and two
// choices — "Add new assets." and "Replace existing assets." (the second removes EVERY asset from the stage,
// `CardHeader.tsx:144-151`). Choosing one shows "Adding assets..." / "Replacing assets..." with Add/Replace, Use Map
// and Back; Cancel closes it.
//
// This is the FIXTURE work order, so: open and CANCEL only — never confirm (owner, 2026-09-23; the replace itself is
// confirmed on test-made work orders by MOB.128/129). The test opens both choices, backs out of each, and
// cancels. Nothing here should send a mutation at all: every mutation is stopped in the browser and counted, and a
// server read proves the stage's asset links unchanged.
//
// The card is reached as a user reaches it: the work order's globe → "View in Map", and the map opens the stage's
// card by itself (`Map/index.tsx:157-185`). It can only if the stage is DRAWN: work layers are not tappable
// (`interactiveLayerIds: []`), and the auto-open looks in the work tiles, which carry only the layers switched on.
// Every `My Work` / `Status` layer is off for the test account, so the test switches `My Work: Ready` on in the Layers
// panel — the app saves that to the account (`UPDATE_USER_MAP_SETTINGS`) — and ALWAYS switches it off again the same
// way, proving over `/graphql` that the account's shown layers end exactly as they began (owner, 2026-09-24). The
// settings save is the only mutation the guard lets through.
import { Browser, expect, Page, Route } from '@playwright/test';
import { MY_WORK_READY, openChangeAsset, openWorkStageCard, readMapId, setLayer, shownLayers } from '../support/map';
import { appUrl, FIXTURE_WO, freshSession, serverRead } from '../support/session';

const STAGE = 'query($id: ID!) { workStage(id: $id) { _workSequence x y assets { id } } }';
const LAYER = MY_WORK_READY;

/** In its own browser, with touch (see the top). */
export async function mob930(browser: Browser): Promise<void> {
  const page = await freshSession(browser, { touch: true });
  try {
    await openAndCancel(page);
  } finally {
    await page.context().close();
  }
}

async function openAndCancel(page: Page): Promise<void> {
  const stage = (await serverRead(page, STAGE, { id: FIXTURE_WO })).workStage;
  expect(stage.x && stage.y, 'PREMISE: the fixture work order has a location, so "View in Map" is enabled').toBeTruthy();
  const linksBefore = stage.assets.map((a: { id: string }) => a.id).sort();

  const stopped: string[] = [];
  let saves = 0;
  const guard = async (route: Route) => {
    let body: { query?: string; operationName?: string } | null = null;
    try { body = route.request().postDataJSON(); } catch { /* not JSON — an upload; let it be */ }
    if (!/^\s*mutation\b/.test(body?.query ?? '')) return route.fallback();
    if (/\b_updateMapSettings\b/.test(body?.query ?? '')) { saves++; return route.fallback(); } // the layer switch
    stopped.push(body?.operationName ?? (body?.query ?? '').slice(0, 60));
    return route.abort('failed');
  };
  await page.route('**/graphql', guard);

  // The account's layers as they are, then `My Work: Ready` on.
  await page.goto(appUrl('map'), { waitUntil: 'load' });
  await expect(page.locator('canvas.mapboxgl-canvas'), 'the map rendered').toBeVisible({ timeout: 60_000 });
  const mapId = await readMapId(page);
  const layersBefore = await shownLayers(page, mapId);
  try {
    await setLayer(page, true);
    await expect.poll(async () => (await shownLayers(page, mapId)).length,
      { message: `the server saved "${LAYER}" on for the account`, timeout: 30_000 }).toBe(layersBefore.length + 1);

    const gear = await openWorkStageCard(page, FIXTURE_WO, stage._workSequence);
    const popup = await openChangeAsset(page, gear);

    await expect(popup.getByText('Warning: This action cannot be undone.'), 'it warns').toBeVisible();
    const add = popup.getByText('Add new assets.', { exact: true });
    const replace = popup.getByText('Replace existing assets.', { exact: true });
    await expect(add).toBeVisible();
    await expect(popup.getByText('Attach one or more assets to this work stage.')).toBeVisible();
    await expect(replace).toBeVisible();
    await expect(popup.getByText('Remove all assets from this work stage and attach new ones.')).toBeVisible();

    // Each choice, then Back — never its Add/Replace or Use Map.
    for (const [choice, heading, act] of [[add, 'Adding assets...', 'Add'], [replace, 'Replacing assets...', 'Replace']] as const) {
      await choice.click();
      await expect(popup.getByText(heading), `"${heading}"`).toBeVisible({ timeout: 10_000 });
      await expect(popup.getByRole('button', { name: act, exact: true }), `it offers "${act}"`).toBeVisible();
      await expect(popup.getByRole('button', { name: 'Use Map' }), 'and "Use Map"').toBeVisible();
      await popup.getByRole('button', { name: 'Back' }).click();
      await expect(add, 'Back returns to the two choices').toBeVisible({ timeout: 10_000 });
    }

    await popup.getByRole('button', { name: 'Cancel' }).click();
    await expect(popup, 'Cancel closed the popup').toHaveCount(0, { timeout: 10_000 });
    await expect(gear, 'back on the card').toBeVisible();
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.930-failure.png' }).catch(() => undefined); // before the restore reloads
    throw err;
  } finally {
    // ALWAYS switch the layer off again, the same way, and prove the account is back where it was.
    await setLayer(page, false);
    await expect.poll(async () => (await shownLayers(page, mapId)).join(','),
      { message: "the account's shown layers are exactly as before the test", timeout: 30_000 }).toBe(layersBefore.join(','));
    await page.unroute('**/graphql', guard);
  }

  expect(saves, 'the only mutations were the two layer switches').toBeGreaterThanOrEqual(2);
  expect(stopped, 'no other mutation was sent').toEqual([]);
  const linksAfter = (await serverRead(page, STAGE, { id: FIXTURE_WO })).workStage.assets.map((a: { id: string }) => a.id).sort();
  expect(linksAfter, "the stage's asset links are unchanged on the server").toEqual(linksBefore);
}
