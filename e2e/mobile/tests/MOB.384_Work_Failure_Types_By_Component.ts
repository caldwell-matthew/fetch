// MOB.384_Work_Failure_Types_By_Component — written for Playwright (not converted from Datadog).
//
// The Failure form's `Failure Type` list comes from a failure profile: the asset's own (`fp`), or — once a component is
// picked — that COMPONENT's (`WorkOrders/components/Failures/Form.tsx:36-43`). Picking another asset or component
// empties the failure type, and picking another failure type empties repair type, root cause and discovery code
// (`:133-151`), since each of those lists belongs to the failure type. MOB.391 adds a failure with no component; this
// drives the component path, on the fixture's `Pump 0102`, whose asset profile and whose component `BASEMECH-RIGID`'s
// profile hold different types (both read from the server first). Reads only: the form is closed unsent, and a route
// stops and counts any mutation.
import { expect, Page, Route } from '@playwright/test';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';
import { appUrl, FIXTURE_WO, serverRead } from '../support/session';
import { PUMP_0102 } from '../support/fixtures';

const COMPONENT = 'BASEMECH-RIGID';
const FIRST = 'BELT (R-L1)'; // has repair types and root causes (MOB.391 saves ADJUST · TIME)
const PROFILES = `query($id: ID!) { asset(id: $id) { failureProfileId { failureTypes { name } }
  assetStandardId { componentTypes { name failureProfileId { failureTypes { name } } } } } }`;
type Named = { name: string };

export async function mob384(page: Page): Promise<void> {
  const asset = (await serverRead(page, PROFILES, { id: PUMP_0102 })).asset;
  const assetTypes: string[] = (asset.failureProfileId?.failureTypes ?? []).map((t: Named) => t.name).sort();
  const component = (asset.assetStandardId?.componentTypes ?? []).find((c: Named) => c.name === COMPONENT);
  const componentTypes: string[] = (component?.failureProfileId?.failureTypes ?? []).map((t: Named) => t.name).sort();
  expect(assetTypes.length, "PREMISE: Pump 0102's own failure profile has types").toBeGreaterThan(0);
  expect(componentTypes.length, `PREMISE: its component ${COMPONENT} has a failure profile with types`).toBeGreaterThan(0);
  expect(componentTypes, 'PREMISE: the two profiles differ').not.toEqual(assetTypes);
  expect(assetTypes, `PREMISE: the asset's types include ${FIRST} (MOB.391's) and another`).toContain(FIRST);
  const second = assetTypes.find((t) => t !== FIRST)!;

  const stopped: string[] = [];
  const guard = async (route: Route) => {
    let query = '';
    try { query = route.request().postDataJSON()?.query ?? ''; } catch { /* not JSON */ }
    if (!/^\s*mutation\b/.test(query)) return route.fallback();
    stopped.push(query.slice(0, 60));
    return route.abort('failed');
  };
  await page.route('**/graphql', guard);
  const form = page.locator('#work-failure-form');
  const offered = async (field: string): Promise<string[]> => {
    await form.locator(`#${field}`).click();
    await expect(page.getByRole('option').first(), `the ${field} list opened`).toBeVisible({ timeout: 15_000 });
    const names = (await page.getByRole('option').allInnerTexts()).map((t) => t.trim()).sort();
    await form.locator(`#${field}`).press('Tab'); // Escape would close the whole modal
    return names;
  };
  const choose = async (field: string, name: string) => {
    await form.locator(`#${field}`).click();
    await page.getByRole('option').filter({ hasText: new RegExp(`^${name.replace(/[()]/g, '\\$&')}$`) }).first().click();
    await expect(form.locator(`#${field}`), `${field} holds ${name}`).toHaveValue(name, { timeout: 10_000 });
  };

  try {
    // Through /work first: its prefetch loads the Failure form's schema (bugs §42 hits a form opened before it).
    await page.goto(appUrl('work'), { waitUntil: 'load' });
    await expect(page.locator('#page-title h4', { hasText: 'Work Orders' })).toBeVisible({ timeout: 60_000 });
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
    await page.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
    await expect(page.getByRole('tab').first(), 'the work order opened').toBeVisible({ timeout: 60_000 });
    await page.getByRole('tab', { name: /Failure/ }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(form, 'the Failure form opened').toBeVisible({ timeout: 30_000 });

    // The asset alone: its own profile's types.
    await choose('assetId', 'Pump 0102');
    expect(await offered('failureTypeId'), "no component: the asset's own failure types").toEqual(assetTypes);

    // A failure type, then a repair type and root cause from it; another failure type empties both.
    await choose('failureTypeId', FIRST);
    await choose('repairTypeId', 'ADJUST');
    await choose('rootCauseTypeId', 'TIME');
    await choose('failureTypeId', second);
    await expect(form.locator('#repairTypeId'), 'another failure type: the repair type emptied').toHaveValue('', { timeout: 10_000 });
    await expect(form.locator('#rootCauseTypeId'), '...and the root cause').toHaveValue('', { timeout: 10_000 });

    // A component: the failure type empties, and the list is now the component's.
    await choose('componentTypeId', COMPONENT);
    await expect(form.locator('#failureTypeId'), 'a component picked: the failure type emptied').toHaveValue('', { timeout: 10_000 });
    expect(await offered('failureTypeId'), `${COMPONENT}: exactly its profile's failure types`).toEqual(componentTypes);
    await page.screenshot({ path: 'results/MOB.384-component.png' });
    await page.locator('.mantine-Modal-content').filter({ has: page.locator('#work-failure-form') }).locator('.mantine-Modal-close').click();
    await expect(form, 'the form closed unsent').toHaveCount(0, { timeout: 15_000 });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.384-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.unroute('**/graphql', guard);
  }
  expect(stopped, 'no mutation was sent').toEqual([]);
}
