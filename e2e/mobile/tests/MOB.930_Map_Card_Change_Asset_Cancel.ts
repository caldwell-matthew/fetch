// MOB.930_Map_Card_Change_Asset_Cancel — written for Playwright (not converted from Datadog).
//
// A work stage's card on the map offers "Change Asset" (`Map/Card/CardHeader.tsx:92-101`), which opens
// `ChangeAssetPopup` (`Map/Popup/ChangeAssetPopup.tsx`): a question, "Warning: This action cannot be undone.", and two
// choices — "Add new assets." and "Replace existing assets." (the second removes EVERY asset from the stage,
// `CardHeader.tsx:144-151`). Choosing one shows "Adding assets..." / "Replacing assets..." with Add/Replace, Use Map
// and Back; Cancel closes it.
//
// Owner, 2026-09-23: open and CANCEL only — never confirm. So this test opens both choices, backs out of each, and
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
import { appUrl, FIXTURE_WO, freshSession, serverRead } from '../support/session';

const STAGE = 'query($id: ID!) { workStage(id: $id) { _workSequence x y assets { id } } }';
const SETTINGS = 'query($mapId: ID!) { _mapSettings(mapId: $mapId) { id displayedLayers } }';
const LAYER = 'My Work: Ready';

async function shownLayers(page: Page, mapId: string): Promise<string[]> {
  return [...((await serverRead(page, SETTINGS, { mapId }))._mapSettings.displayedLayers ?? [])].sort();
}

/** Tick or untick one layer in the map's Layers panel — the app's own path, which saves the account's settings. */
async function setLayer(page: Page, on: boolean): Promise<void> {
  await page.goto(appUrl('map'), { waitUntil: 'load' }); // fresh: nothing a failed step left open is in the way
  await expect(page.locator('canvas.mapboxgl-canvas'), 'the map rendered').toBeVisible({ timeout: 60_000 });
  await page.getByText('Layers', { exact: true }).click();
  const box = page.getByRole('checkbox', { name: LAYER, exact: true });
  await expect(box, `the Layers panel lists "${LAYER}"`).toHaveCount(1, { timeout: 30_000 });
  await box.scrollIntoViewIfNeeded();
  if ((await box.isChecked()) !== on) await box.click();
  await expect(box, `"${LAYER}" is ${on ? 'on' : 'off'}`).toBeChecked({ checked: on });
  await page.getByText('Hide All').locator('xpath=ancestor::*[.//button][1]').locator('button.mantine-CloseButton-root, button[class*="CloseButton"]').first()
    .click().catch(() => page.keyboard.press('Escape'));
}

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
  // The map in use is kept in session storage (`Map/index.tsx:61`).
  const readMapId = () => page.evaluate(() => {
    const raw = sessionStorage.getItem('mobile-map-id') ?? '';
    try { return String(JSON.parse(raw) ?? ''); } catch { return raw; }
  });
  await expect.poll(readMapId, { message: 'the map has an id', timeout: 30_000 }).not.toBe('');
  const mapId = await readMapId();
  const layersBefore = await shownLayers(page, mapId);
  try {
    await setLayer(page, true);
    await expect.poll(async () => (await shownLayers(page, mapId)).length,
      { message: `the server saved "${LAYER}" on for the account`, timeout: 30_000 }).toBe(layersBefore.length + 1);

    // The work order → its globe → "View in Map". Through the list first: its prefetch loads what the detail needs.
    await page.goto(appUrl('work'), { waitUntil: 'load' });
    await expect(page.locator('#page-title h4', { hasText: 'Work Orders' })).toBeVisible({ timeout: 60_000 });
    await page.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
    await expect(page.getByRole('tab').first(), 'the work order opened').toBeVisible({ timeout: 60_000 });
    await page.locator('button:has([data-icon="globe"])').first().click();
    await page.locator('.mantine-Menu-item', { hasText: 'View in Map' }).click();
    await expect(page, 'on the map').toHaveURL(/\/map/, { timeout: 30_000 });

    const gear = page.locator('[aria-label="map-options"]');
    try {
      await expect(gear).toBeVisible({ timeout: 20_000 });
    } catch {
      const pin = (await page.locator('.mapboxgl-marker').first().boundingBox())!;
      await page.touchscreen.tap(pin.x + pin.width / 2, pin.y + pin.height + 8);
    }
    await expect(gear, 'the work stage card opened, with its options menu').toBeVisible({ timeout: 30_000 });
    // A work card is titled with the stage's sequence number (`Map/Card/WorkCard.tsx:26`).
    await expect(page.getByText(stage._workSequence, { exact: true }).first(), `the card is ${stage._workSequence}'s`).toBeVisible();

    // The popup renders only once the card's work stage has loaded (`CardHeader.tsx:216`), so reopen until it shows.
    // Found by its Cancel button, which both of its states show — the question goes once a choice is made.
    const popup = page.locator('.mantine-Modal-content').filter({ has: page.getByRole('button', { name: 'Cancel' }) });
    const question = popup.getByText('How would you like to change the asset information for this work stage?');
    await expect(async () => {
      await gear.click();
      await page.getByRole('menuitem', { name: 'Change Asset' }).click({ timeout: 5_000 });
      await expect(question).toBeVisible({ timeout: 3_000 });
    }, 'the Change Asset popup opened').toPass({ timeout: 60_000 });

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
