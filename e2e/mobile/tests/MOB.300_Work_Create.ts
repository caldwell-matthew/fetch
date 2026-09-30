// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.300_Work_Create.json. This file is the source now: edit it directly.
// MOB.300_Work_Create
//
// The form's `Assign to Crew` (since 2026-09-18, `WorkOrders/components/InsertForm/index.tsx:44-58,298`; shown with the
// `crewassignment.create` permission) starts at the user's crew, and the create sends it as the stage's `roleId` —
// before, every mobile-made work order went to the user's crew with no choice. The test leaves it as it is, and proves
// that the create sends the session's crew as `roleId` and the new stage holds it (the server adds it to the
// crews the workflow assigns itself — `server/…/work/work/create/index.ts:285-308`). ⚠️ The "Datadog Test" workflow
// assigns `Admin` itself too, so the stage holding it does not show the `roleId` at work — MOB.303 does (cleared, and
// another crew, each against the workflow's own crews).
//
// Two more things a user gets from this form, each proven here:
//   · the Address field's locate button (`InsertForm/index.tsx:278-289`, `ui/GeolocateButton.tsx`) — the device's position,
//     reverse-geocoded by Mapbox, fills the work order's longitude `x`, latitude `y` and `address`. Both are answered in
//     the browser, with MOB.629's values: Chicago, far from the assets the map tests tap. The filled address also gets
//     the multiline arrow (`DetailPage/utils/MultiLineLabel.tsx`, MOB.331/332). The coordinates save; the ADDRESS does
//     not (bugs §59: `CreateWorkInput` has no `address`, and the client's `sanitizeLink` drops it) — so this returns
//     whether it saved, and the suite pins §59;
//   · the new work order is in the list AT ONCE, before any resync — the create writes it into the list's cache when
//     it is assigned to the user's crew (`InsertForm/index.tsx:138-162`). Proved on the status legend, which counts the
//     list's own data (`WorkOrders/index.tsx:202-208`): its total is one higher straight after the create. It is NOT:
//     created before every stage's details have downloaded — as here, which does not wait for them (trap 49) — the
//     cache write reads a query the cache cannot yet answer and is skipped (bugs §60). So this returns whether the
//     total moved, and the suite pins §60.

import { expect, Page, Response, Route } from '@playwright/test';
import { appUrl, serverRead } from '../support/session';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, click, typeText, wait } from '../../support/dd';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';
import { openArrow } from './MOB.332_Multiline_Arrow_Other_Forms';

const GEO = { latitude: 41.8781, longitude: -87.6298 };
// What `GeolocateButton` builds from the geocode's parts: `<number> <street>, <city> <state>, <country>, <postcode>`.
const ADDRESS = '1600 Main Street, Chicago IL, US, 60601';
const GEOCODE = { features: [
  { place_type: ['address'], text: 'Main Street', address: '1600', properties: {} },
  { place_type: ['place'], text: 'Chicago', properties: {} },
  { place_type: ['region'], text: 'Illinois', properties: { short_code: 'US-IL' } },
  { place_type: ['country'], text: 'United States', properties: { short_code: 'us' } },
  { place_type: ['postcode'], text: '60601', properties: {} },
] };

/** The status legend's total — every `Status (n)` entry summed; it counts the list's own data. */
async function legendTotal(page: Page): Promise<number> {
  const entries = await page.locator('li').filter({ hasText: /^\s*[^()]+ \(\d+\)\s*$/ }).allInnerTexts();
  return entries.reduce((sum, t) => sum + Number(/\((\d+)\)/.exec(t)![1]), 0);
}

export async function mob300(page: Page): Promise<{ addressSaved: boolean; listed: boolean }> {
  const run = new Sequence();
  const geocode = (route: Route) => route.fulfill({ json: GEOCODE });
  await page.route('**/api.mapbox.com/geocoding/**', geocode);
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`${appUrl()}work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Wait for the workstage pages and the lookup prefetch", {}, async () => {
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
  });
  await run.step("The work list rendered its search box", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 1/3: the initial fetch finished", {}, async () => {
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 2/3: paging through workstages finished", {}, async () => {
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
  });
  // Not every stage's download: the create button works while they run (the app gates only sorting and the prefetch
  // on `loadedAll`, `WorkOrders/index.tsx:70-164`); MOB.937 clicks it there. Waiting for them cost minutes (trap 49).
  await run.step("The lookup prefetch finished (not every stage's download)", {}, async () => {
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
  });
  let before = 0;
  await run.step("BASELINE: the status legend's total (the list's own count)", {}, async () => {
    await expect.poll(() => legendTotal(page), { message: 'the legend counts something', timeout: 30_000 }).toBeGreaterThan(0);
    before = await legendTotal(page);
  });
  await run.step("Open the create-work-order form", {}, async () => {
    await click(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`, DEFAULT_TIMEOUT);
  });
  await run.step("Test create modal opened", {}, async () => {
    await assertPageContains(page, `Creating New Work Order`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the Workflow lookup", {}, async () => {
    await click(page, `//*[@id="workflowTitleId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Search for the Datadog Test workflow", {}, async () => {
    await typeText(page, `//*[@id="workflowTitleId"]`, `Datadog Test`, DEFAULT_TIMEOUT);
  });
  await run.step("Pick the \"Datadog Test\" workflow", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Datadog Test")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Type the synthetic marker into Problem Description", {}, async () => {
    await typeText(page, `//*[@id="problemDesc"]`, `DD SYNTHETIC MOBILE`, DEFAULT_TIMEOUT);
  });
  const addressField = page.locator('#workorder-insert-form .form-group').filter({ has: page.locator('#address') }).first();
  await run.step("Stub the device's position (a navigation drops it; Mapbox's geocode is answered by a route)", {}, async () => {
    await page.evaluate((g) => {
      navigator.geolocation.getCurrentPosition = (ok: PositionCallback) => ok({ coords: { ...g, accuracy: 5 } } as unknown as GeolocationPosition);
    }, GEO);
  });
  await run.step("Tap the Address field's locate button", {}, async () => {
    await addressField.locator('svg[data-icon="location-crosshairs"]').click();
  });
  await run.step("The address is filled from the geocode", {}, async () => {
    await expect(page.locator('#workorder-insert-form #address')).toHaveValue(ADDRESS, { timeout: 15_000 });
  });
  await run.step("...and the arrow beside Address opens exactly that value", {}, async () => {
    await openArrow(page, addressField, ADDRESS, 'create form Address');
  });
  const crew = (await serverRead(page, '{ session { me { role { id name } } } }')).session.me.role;
  await run.step("`Assign to Crew` shows the session's crew", {}, async () => {
    await expect(page.locator('#workorder-insert-form #crewId')).toHaveValue(crew.name, { timeout: DEFAULT_TIMEOUT });
  });
  let created: Promise<Response> | undefined;
  await run.step("Click \"Create Work Order\"", {}, async () => {
    created = page.waitForResponse((r) => r.url().endsWith('/graphql') && /\bcreateWork\s*\(/.test(r.request().postData() ?? ''),
      { timeout: 60_000 });
    await click(page, `//button[normalize-space(.)="Create Work Order"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the create mutation to resolve", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test create modal closed (durable success signal)", {}, async () => {
    await assertPageLacks(page, `Creating New Work Order`, DEFAULT_TIMEOUT);
  });
  await run.step("Test success toast (optional: transient, autoClose 5000)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Work order successfully created!`, DEFAULT_TIMEOUT);
  });
  let stages: { id: string }[] = [];
  await run.step("\u2b50 SERVER: the create sent the session's crew, and the new stage holds it \u2014 asked over /graphql", {}, async () => {
    const res = await created!;
    expect(res.request().postDataJSON()?.variables?.data?.roleId, "the create's roleId is the session's crew").toBe(crew.id);
    stages = (await res.json()).data.createWork.stages;
    expect(stages.length, 'the create made a stage').toBeGreaterThan(0);
    // The workflow assigns crews of its own too ("Datadog Test": seven more), so the crew is one of several.
    for (const stage of stages) {
      const crews = (await serverRead(page, 'query($p: ChildTableQuery!) { workStageAssignments(params: $p) { edges { name } } }',
        { p: { parentId: stage.id, limit: 100 } })).workStageAssignments.edges.map((e: { name: string }) => e.name);
      expect(crews, `stage ${stage.id} is assigned to ${crew.name}`).toContain(crew.name);
    }
  });
  let addressSaved = false;
  await run.step("\u2b50 SERVER: the new stage holds the located coordinates \u2014 and the address, or nothing (bugs \u00a759)", {}, async () => {
    const st = (await serverRead(page, 'query($id: ID!) { workStage(id: $id) { x y address } }', { id: stages[0].id })).workStage;
    expect(st.x, 'longitude').toBeCloseTo(GEO.longitude, 6);
    expect(st.y, 'latitude').toBeCloseTo(GEO.latitude, 6);
    // Either the located address or none (§59); anything else is a different failure.
    expect([ADDRESS, null], 'the address is the located one, or none').toContain(st.address);
    addressSaved = st.address === ADDRESS;
  });
  let listed = false;
  await run.step("\u2b50 LIST: the new work order is in the list at once \u2014 the legend's total one higher, or unchanged (bugs \u00a760)", {}, async () => {
    // 15s for the total to move; unchanged is §60's symptom, and any other total is a different failure.
    const after = await expect.poll(() => legendTotal(page), { timeout: 15_000 }).toBe(before + stages.length)
      .then(() => before + stages.length, async () => legendTotal(page));
    expect([before, before + stages.length], 'the legend total: one more, or unchanged').toContain(after);
    listed = after === before + stages.length;
  });
  await run.step("Drop the geocode route", { always: true }, async () => {
    await page.unroute('**/api.mapbox.com/geocoding/**', geocode);
  });
  run.finish();
  return { addressSaved, listed };
}
