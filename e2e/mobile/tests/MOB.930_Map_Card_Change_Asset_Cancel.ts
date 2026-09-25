// MOB.930_Map_Card_Change_Asset_Cancel — written for Playwright (not converted from Datadog). ▶ checklist #84 (a).
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
// The card is reached as a user reaches it: the work order's globe → "View in Map". For a work stage the map finds
// the feature in its SOURCE (`Map/index.tsx:161`, `querySourceFeatures`), not among the drawn icons, so the card
// opens by itself even where another icon covers it (unlike an asset's, trap 42). The page has touch anyway, for a
// tap on the marker should the auto-open miss its moment.
import { Browser, expect, Page, Route } from '@playwright/test';
import { appUrl, FIXTURE_WO, freshSession, serverRead } from '../support/session';

const STAGE = 'query($id: ID!) { workStage(id: $id) { _workSequence x y assets { id } } }';

/** In its own browser, with touch (see the top). */
export async function mob930(browser: Browser): Promise<void> {
  const page = await freshSession(browser, { touch: true });
  try {
    await openAndCancel(page);
  } catch (err) {
    // Playwright's failure screenshot is of its own `page` fixture, not this browser — keep this one's.
    await page.screenshot({ path: 'results/MOB.930-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.context().close();
  }
}

async function openAndCancel(page: Page): Promise<void> {
  const stage = (await serverRead(page, STAGE, { id: FIXTURE_WO })).workStage;
  expect(stage.x && stage.y, 'PREMISE: the fixture work order has a location, so "View in Map" is enabled').toBeTruthy();
  const linksBefore = stage.assets.map((a: { id: string }) => a.id).sort();

  const stopped: string[] = [];
  const guard = async (route: Route) => {
    let body: { query?: string; operationName?: string } | null = null;
    try { body = route.request().postDataJSON(); } catch { /* not JSON — an upload; let it be */ }
    if (!/^\s*mutation\b/.test(body?.query ?? '')) return route.fallback();
    stopped.push(body?.operationName ?? (body?.query ?? '').slice(0, 60));
    return route.abort('failed');
  };
  await page.route('**/graphql', guard);
  try {
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
    const popup = page.locator('.mantine-Modal-content')
      .filter({ hasText: 'How would you like to change the asset information for this work stage?' });
    await expect(async () => {
      await gear.click();
      await page.getByRole('menuitem', { name: 'Change Asset' }).click({ timeout: 5_000 });
      await expect(popup).toBeVisible({ timeout: 3_000 });
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
  } finally {
    await page.unroute('**/graphql', guard);
  }

  expect(stopped, 'no mutation was sent').toEqual([]);
  const linksAfter = (await serverRead(page, STAGE, { id: FIXTURE_WO })).workStage.assets.map((a: { id: string }) => a.id).sort();
  expect(linksAfter, "the stage's asset links are unchanged on the server").toEqual(linksBefore);
}
