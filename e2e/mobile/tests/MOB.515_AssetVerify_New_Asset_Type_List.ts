// MOB.515_AssetVerify_New_Asset_Type_List — written for Playwright (not converted from Datadog).
//
// `Get New Asset` from a job is the collector's create form with the job's id, and its Asset Type list asks the server
// for the job's allowed types (`mobileJobAssetTypes`) on every open: when the job has some, the list is exactly those;
// when it has none, it is the org's whole type list (`AssetCollector/Form/index.tsx:61-73`). The fixture job allows NO
// types, so the real answer shows the fallback, and the narrowing needs a job that has some: the same answer is then
// given two — the types of the job's own two assets — in the browser. Reads only: the form is closed unsent.
import { expect, Page, Route } from '@playwright/test';
import { serverRead } from '../support/session';
import { AV_JOB } from '../support/fixtures';
import { openAddAssetModal } from './MOB.513_AssetVerify_Add_New_Asset';

const JOB = 'query($id: ID!) { mobileJob(id: $id) { name assets { assetId { typeId { id name } } } } }';
const ALLOWED = 'query($p: ChildTableQuery) { mobileJobAssetTypes(params: $p) { pageInfo { totalCount } } }';
type Type = { id: string; name: string };

/** Open the job's Get New Asset form, open its Asset Type list, and return the options it offers; then close it all. */
async function offeredTypes(page: Page, jobName: string): Promise<string[]> {
  const body = await openAddAssetModal(page, jobName);
  const form = body.locator('#asset-collector');
  await expect(form, 'Get New Asset: the collector\'s create form').toBeVisible({ timeout: 30_000 });
  await form.locator('#typeId').click();
  await expect(page.getByRole('option').first(), 'the type list opened').toBeVisible({ timeout: 30_000 });
  const offered = (await page.getByRole('option').allInnerTexts()).map((t) => t.trim()).sort();
  // The modal's X is the body's own `CloseButton` (`AssetVerification/NewAssetForm.tsx:146`), beside the two tabs.
  await page.getByRole('dialog').filter({ has: page.locator('#asset-collector') }).locator('.mantine-CloseButton-root').first().click();
  await expect(form, 'the form closed unsent').toHaveCount(0, { timeout: 15_000 });
  return offered;
}

export async function mob515(page: Page): Promise<void> {
  const job = (await serverRead(page, JOB, { id: AV_JOB })).mobileJob;
  const allowedNow = (await serverRead(page, ALLOWED, { p: { parentId: AV_JOB } })).mobileJobAssetTypes.pageInfo.totalCount;
  expect(allowedNow, 'PREMISE: the fixture job allows no asset types').toBe(0);
  const types: Type[] = [...new Map(job.assets.map((a: { assetId: { typeId: Type } }) => [a.assetId.typeId.id, a.assetId.typeId])).values()] as Type[];
  expect(types.length, "PREMISE: the job's two assets are of two types").toBe(2);
  const names = types.map((t) => t.name).sort();

  const stopped: string[] = [];
  const guard = async (route: Route) => {
    let body: { query?: string; operationName?: string } = {};
    try { body = route.request().postDataJSON() ?? {}; } catch { /* not JSON */ }
    if (/^\s*mutation\b/.test(body.query ?? '')) { stopped.push(body.query!.slice(0, 60)); return route.abort('failed'); }
    return route.fallback();
  };
  let given = 0;
  const giveTwo = async (route: Route) => {
    let body: { query?: string } = {};
    try { body = route.request().postDataJSON() ?? {}; } catch { /* not JSON */ }
    if (!/\bmobileJobAssetTypes\s*\(/.test(body.query ?? '')) return route.fallback();
    const res = await route.fetch();
    const json = await res.json();
    json.data.table.edges = types.map((t, i) => ({
      __typename: 'MobileJobAssetType', id: `DD515-${i}`, typeId: { __typename: 'AssetType', ...t },
      createdAt: null, updatedAt: null, createdBy: null, updatedBy: null,
    }));
    json.data.table.pageInfo.totalCount = types.length;
    given++;
    return route.fulfill({ response: res, json });
  };
  await page.route('**/graphql', guard);
  try {
    // The real answer: none allowed, so the org's list (a page of it, alphabetical) — types beyond the job's two.
    const fallback = await offeredTypes(page, job.name);
    expect(fallback.length, 'no allowed types: more than the job\'s two are offered').toBeGreaterThan(names.length);
    expect(fallback.filter((t) => !names.includes(t)).length, 'no allowed types: types the job does not have are offered').toBeGreaterThan(0);

    // Two allowed: exactly those two.
    await page.route('**/graphql', giveTwo);
    const narrowed = await offeredTypes(page, job.name);
    expect(given, 'the form asked for the job\'s allowed types, and got two').toBeGreaterThan(0);
    expect(narrowed, 'two allowed: exactly those two are offered').toEqual(names);
    await page.screenshot({ path: 'results/MOB.515-types.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.515-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.unroute('**/graphql', giveTwo);
    await page.unroute('**/graphql', guard);
  }
  expect(stopped, 'no mutation was sent').toEqual([]);
}
