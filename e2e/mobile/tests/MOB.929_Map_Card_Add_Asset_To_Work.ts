// MOB.929_Map_Card_Add_Asset_To_Work — written for Playwright (not converted from Datadog).
//
// An asset's card on the map offers "Add to Work" (`Map/Card/CardHeader.tsx:122`), which opens "Add Asset to Work
// Order" (`AddAssetToWorkInsertForm`) and links the asset to a picked work stage. New to mobile on 2026-09-21.
//
// The card is reached the way a user reaches it from Asset Lookup: "View in Map" hands the asset to the map, which
// centres on it and opens its card (`Map/index.tsx:139-186`) — no tap on the map canvas needed. That auto-open only
// finds an asset whose icon is RENDERED (`queryRenderedFeatures`): Pump 0102's spot is covered by Tank 0040's icon
// at every zoom, so its card never opens (measured 2026-09-23). Tank 0040 is the asset drawn there, and its card
// opens by itself. (A card can also be opened by hand, but only by a touch: the map selects on `touchend` alone,
// `Map/MapGL/index.tsx:99` — a mouse click does nothing.)
//
// The picker offers only the FIRST 50 of the crew's work stages (bugs §50, `InsertForm/schemas.ts:27-40`: one page, and the
// typed text is not sent), so the protected fixtures — 20260910-16 sits on page 9 — cannot be picked. The target is
// a work order the tests made themselves: the first one on that page created by the test account whose problem
// description starts with `DD SYNTHETIC MOBILE` (MOB.122, earlier in this suite, makes one). The fixtures are refused
// by id even so, and `cleanup_residue.py` prunes the work order later whatever happens here.
//
// Owner, 2026-09-23 (trap 2): the test adds ONE link and removes exactly that link. Removal is MOB.354's path: the
// link's gear → `Delete Item` → `Yes`.
import { Browser, expect, Page, Request } from '@playwright/test';
import { openAssetCard } from '../support/map';
import { appUrl, FIXTURE_WO, FORMS_WO, freshSession, persistedCacheHas, serverRead } from '../support/session';

const ASSET = 'Tank 0040';
const MARKER = 'DD SYNTHETIC MOBILE';
const NEVER = new Set([FIXTURE_WO, FORMS_WO, 'RcdI0xcpc8NBV8VoRNNBYM']); // cleanup_residue.FIXTURE_STAGES
const LINKS = 'query($id: ID!) { workStage(id: $id) { assets { id assetId { id name } } } }';
// The picker's query (`WorkOrders/queries/index.gql.ts:264`), cut down: its answer in full is too large to read back.
const PICKER_STAGES = '{ workStages(crew: "<SESSION>", params: { limit: 50, sortId: "displayName" }) '
  + '{ edges { id name workId { problemDesc createdBy { id } } } } }';
const ASSET_SCHEMA_KEY = '_info({\\"schema\\":\\"Asset\\"})'; // as the persisted cache writes it
type Link = { id: string; assetId: { id: string; name: string } };
type Stage = { id: string; name: string; workId: { problemDesc: string | null; createdBy: { id: string } | null } };

/** Is this request the add? Matched on the mutation's field, not its name: the name the app sends
 *  (`MOBILE_WORK_ADD_ASSET`) is not the generated document's (`ADD_ASSET_TO_WORKSTAGE`). */
function isAdd(req: Request): boolean {
  try {
    return /\baddWorkStageAssetLink\b/.test(req.postDataJSON()?.query ?? '');
  } catch {
    return false;
  }
}

async function links(page: Page, stage: string): Promise<Link[]> {
  return (await serverRead(page, LINKS, { id: stage })).workStage.assets;
}

/** MOB.354's removal, on the ONE link this run added — in a fresh browser, whose tabs read the server. */
export async function removeOurLink(browser: Browser, stage: string, before: Set<string>): Promise<void> {
  const page = await freshSession(browser);
  try {
    const ours = (await links(page, stage)).filter((l) => l.assetId.name === ASSET && !before.has(l.id));
    if (!ours.length) return;
    expect(ours.length, `exactly one new link to ${ASSET}`).toBe(1);
    // A work order's Assets tab reads the Asset schema from the cache only (`WorkOrders/components/Assets/index.tsx:42`)
    // and opening an asset without it crashes the page ("reading 'map'"). A fresh browser has not fetched it, so let
    // Asset Lookup fetch it, and reload only once it is persisted (trap 41).
    await page.goto(appUrl('asset-lookup'), { waitUntil: 'load' });
    await expect.poll(() => persistedCacheHas(page, ASSET_SCHEMA_KEY),
      { message: 'the Asset schema is in the persisted cache', timeout: 60_000 }).toBe(true);
    await page.goto(appUrl(`work/${stage}`), { waitUntil: 'load' });
    await expect(page.getByText('Status:').first()).toBeVisible({ timeout: 60_000 });
    await page.locator('xpath=//*[@role="tab"][normalize-space(.)="Assets"]').click();
    const row = page.getByRole('tabpanel').locator('.mantine-Accordion-item')
      .filter({ has: page.locator('.mantine-Accordion-control', { hasText: ASSET }) });
    await expect(row, `one row for ${ASSET} on this work order`).toHaveCount(1, { timeout: 30_000 });
    await row.locator('.mantine-Accordion-chevron').first().click(); // as MOB.354 opens it
    const gears = row.locator('.mantine-Accordion-panel [aria-label="Menu"]');
    await expect(gears, 'its panel holds exactly one gear').toHaveCount(1, { timeout: 15_000 });
    await gears.click();
    await page.locator('.mantine-Menu-item', { hasText: 'Delete Item' }).first().click();
    await page.locator('.mantine-Modal-content', { hasText: 'Are you sure you want to delete this record?' })
      .getByRole('button', { name: 'Yes' }).click();
    await expect.poll(async () => (await links(page, stage)).map((l) => l.id).sort().join(','),
      { message: 'the work order is back to the links it held before the run', timeout: 30_000 })
      .toBe([...before].sort().join(','));
  } finally {
    await page.context().close();
  }
}

/** In its own browser, with touch: the map card may need a tap (see the top). */
export async function mob929(browser: Browser): Promise<void> {
  const page = await freshSession(browser, { touch: true });
  try {
    await addAndRemove(page, browser);
  } finally {
    await page.context().close();
  }
}

async function addAndRemove(page: Page, browser: Browser): Promise<void> {
  const me = (await serverRead(page, '{ session { me { id } } }')).session.me.id;
  const stages: Stage[] = (await serverRead(page, PICKER_STAGES)).workStages.edges;
  // The first test-made work order on the page that does not link the asset yet. One that does holds a run's
  // leftover (its removal failed) — skipped, not failed on: `cleanup_residue.py` prunes that work order whole.
  let index = -1;
  let beforeLinks: Link[] = [];
  for (const [i, s] of stages.entries()) {
    if (NEVER.has(s.id) || s.workId?.createdBy?.id !== me || !(s.workId.problemDesc ?? '').trim().startsWith(MARKER)) continue;
    beforeLinks = await links(page, s.id);
    if (!beforeLinks.some((l) => l.assetId.name === ASSET)) { index = i; break; }
  }
  expect(index, `PREMISE: the picker's first page holds a work order the tests made ("${MARKER}" — MOB.122 makes one)`
    + ` that does not link ${ASSET}`).toBeGreaterThanOrEqual(0);
  const target = stages[index];
  const before = new Set(beforeLinks.map((l) => l.id));

  try {
    // Asset Lookup → Tank 0040 → View in Map → its card (by itself, or a tap below the marker)
    const card = await openAssetCard(page, ASSET);
    await expect(page.getByText(ASSET, { exact: true }).first(), `the card is ${ASSET}'s`).toBeVisible();
    // "Add to Work" silently does nothing until the card's asset record has loaded (`CardHeader.tsx:122`), and the
    // menu opens before that — nothing on the card says when (General Info fills from the map's feature first). A
    // too-early click changes nothing, so open the menu and click again until the form opens.
    await expect(async () => {
      await card.click();
      await page.getByRole('menuitem', { name: 'Add to Work' }).click({ timeout: 5_000 });
      await expect(page.getByText('Add Asset to Work Order')).toBeVisible({ timeout: 3_000 });
    }, 'the form opened from the map card').toPass({ timeout: 60_000 });

    // Add Asset to Work Order → the stage → submit. The options show a stage's name alone, and many share one
    // ("☢️ Datadog Test"), so the option is picked by its place: the picker keeps its answer's order (its filter,
    // `a.id === assetId`, compares a link's id with an asset's and drops nothing).
    const form = page.locator('#add-asset-to-workorder-insert-form');
    await form.locator('#workStageId').click();
    const option = page.getByRole('option').nth(index);
    await expect(option, `option ${index + 1} is "${target.name}"`).toHaveText(target.name, { timeout: 30_000 });

    // Belt and braces: the add goes out ONLY for the target — any other is stopped in the browser, so a wrong pick
    // can never link the asset to someone else's work.
    let sent = 0, stopped = 0;
    const guard = async (route: import('@playwright/test').Route) => {
      if (!isAdd(route.request())) return route.fallback();
      if (route.request().postDataJSON()?.variables?.parentId !== target.id) { stopped++; return route.abort('failed'); }
      sent++;
      return route.fallback();
    };
    await page.route('**/graphql', guard);
    try {
      await option.click();
      await page.locator('button[form="add-asset-to-workorder-insert-form"]').click();
      await expect.poll(() => sent + stopped, { message: 'the add was sent', timeout: 30_000 }).toBe(1);
      expect(stopped, 'the add targeted the test-made work order').toBe(0);
    } finally {
      await page.unroute('**/graphql', guard);
    }

    // the server has the link
    await expect.poll(async () => (await links(page, target.id)).filter((l) => l.assetId.name === ASSET && !before.has(l.id)).length,
      { message: `the server links ${ASSET} to the work order`, timeout: 30_000 }).toBe(1);
  } finally {
    await removeOurLink(browser, target.id, before);
  }
}
