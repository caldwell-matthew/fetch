// MOB.944_AssetLookup_Attributes_Edit — written for Playwright (not converted from Datadog).
//
// Build 127 made an expanded asset's Attributes tab editable (`AssetLookup/AssetLookupDetails/Attributes.tsx`) — in
// Asset Lookup, the collector, Asset Verify jobs and a work order's Assets tab alike. Online only (`:167-195`), each
// action behind its permission: `Add Attribute` (a record picker of the attribute types the asset lacks, narrowed by
// `Only attributes for <type>` when the asset has a type, then a value), a pencil per row (`aria-label="Edit <label>"`)
// → `Update Attribute`, and `Remove Attribute` → `Are you sure you want to remove <label>?` → `Yes`. A save that fails
// toasts `Unable to save attribute. Please try again.` (`:137-151`).
//
// On a `DD SYNTHETIC MOBILE <8 digits>` test asset (MOB.600's), in Asset Lookup, in the test's own browser:
//   1. offline → neither `Add Attribute` nor a pencil;
//   2. an add the server refuses (answered in the browser) → the error toast, nothing on the server;
//   3. the type filter: `Actuator Tools` has no attribute types, so the picker is empty until it is switched off;
//   4. add `🔤 string 1` with this run's value → proved over `/graphql`;
//   5. edit it → proved; 6. remove it — the one attribute this run added (owner, 2026-09-28, trap 2) → proved gone,
//      the asset back to the attributes it had. A route refuses any remove whose ids are not exactly that one.
import { expect, Page, Route } from '@playwright/test';
import { failOperation } from '../../support/network';
import { runId } from '../../support/env';
import { appUrl, serverRead } from '../support/session';

const ATTRIBUTE = '🔤 string 1'; // a plain text attribute type (not a lookup)
const ASSETS = 'query($p: TableQuery) { assets(params: $p) { edges { id name typeId { name } attributes { id value attributeId { id name } } } } }';
type Attr = { id: string; value: string | null; attributeId: { id: string; name: string } };
type Asset = { id: string; name: string; typeId: { name: string } | null; attributes: Attr[] };

async function testAsset(page: Page): Promise<Asset> {
  const edges: Asset[] = (await serverRead(page, ASSETS, { p: { limit: 20, query: { connector: 'AND',
    conditions: [{ column: 'name', operator: 'CONTAINS', value: 'DD SYNTHETIC MOBILE' }] } } })).assets.edges;
  const ours = edges.filter((a) => /^DD SYNTHETIC MOBILE \d{8}$/.test(a.name)).sort((a, b) => b.name.localeCompare(a.name));
  expect(ours.length, 'PREMISE: a DD SYNTHETIC MOBILE test asset exists (MOB.600 residue)').toBeGreaterThan(0);
  return ours[0];
}
async function attributesOf(page: Page, name: string): Promise<Attr[]> {
  const edges: Asset[] = (await serverRead(page, ASSETS, { p: { limit: 5, query: { connector: 'AND',
    conditions: [{ column: 'name', operator: 'CONTAINS', value: name }] } } })).assets.edges;
  return edges.filter((a) => a.name === name)[0].attributes;
}

export async function mob944(page: Page): Promise<void> {
  const asset = await testAsset(page);
  const before = asset.attributes.map((a) => a.id).sort();
  expect(asset.attributes.some((a) => a.attributeId.name === ATTRIBUTE),
    `PREMISE: ${asset.name} does not hold ${ATTRIBUTE} (a leftover would be a failed run's — remove it first)`).toBe(false);
  const value = `DD944 ${runId('numeric', 8)}`;
  const edited = `${value} EDITED`;
  const refused = 'DD SYNTHETIC 944: the test refused this attribute';

  const row = page.locator('.mantine-Accordion-item').filter({ hasText: asset.name }).first();
  const panel = row.getByRole('tabpanel'); // the visible one — Mantine keeps the other tabs' panels mounted, hidden
  const addButton = panel.getByRole('button', { name: 'Add Attribute' });
  const pencils = panel.locator('button[aria-label^="Edit "]');
  const modal = page.locator('.mantine-Modal-content');
  const openAdd = async () => {
    await addButton.click();
    await expect(modal.locator('#attributeId'), 'the add form opened').toBeVisible({ timeout: 15_000 });
  };
  const pickAttribute = async () => {
    await modal.locator('#attributeId').click();
    await modal.locator('#attributeId').pressSequentially('string 1');
    await page.getByRole('option').filter({ hasText: new RegExp(`^${ATTRIBUTE}$`) }).first().click({ timeout: 30_000 });
    await expect(modal.locator('#value'), 'a value field for the picked type').toBeVisible({ timeout: 15_000 });
  };

  // Only the ONE attribute this run added may be removed (trap 2): any other remove is refused in the browser.
  let ourId: string | null = null, removes = 0, stopped = 0;
  const guard = async (route: Route) => {
    let body: { query?: string; variables?: { ids?: string[] } } | null = null;
    try { body = route.request().postDataJSON(); } catch { /* not JSON */ }
    if (!/\bremoveAttributeFromAsset\s*\(/.test(body?.query ?? '')) return route.fallback();
    const ids = body?.variables?.ids ?? [];
    if (!ourId || ids.length !== 1 || ids[0] !== ourId) { stopped++; return route.abort('failed'); }
    removes++;
    return route.fallback();
  };
  await page.route('**/graphql', guard);

  try {
    await page.goto(appUrl('asset-lookup'), { waitUntil: 'load' });
    const search = page.locator('input[name="asset-search"]');
    await expect(search).toBeVisible({ timeout: 60_000 });
    await search.fill(asset.name);
    await search.press('Enter');
    await expect(row, `a result row for ${asset.name}`).toBeVisible({ timeout: 60_000 });
    await row.locator('.mantine-Accordion-control').click();
    await row.getByRole('tab', { name: 'Attributes', exact: true }).click();
    await expect(addButton, 'online: Add Attribute is offered').toBeVisible({ timeout: 30_000 });

    // 1 · offline: attribute editing needs the server
    await page.context().setOffline(true);
    try {
      await expect(addButton, 'offline: no Add Attribute').toHaveCount(0, { timeout: 15_000 });
      await expect(pencils, 'offline: no pencils').toHaveCount(0);
    } finally {
      await page.context().setOffline(false);
    }
    await expect(addButton, 'back online: Add Attribute returns').toBeVisible({ timeout: 15_000 });

    // 2 · a refused add: the error, and nothing saved
    const failing = await failOperation(page, { field: 'addAttributeToAsset' }, { kind: 'graphql', message: refused });
    try {
      await openAdd();
      // 3 · the type filter: this asset's type has no attribute types, so switch it off to reach the full list
      const filter = modal.locator('#filterByType');
      await expect(filter, `the add form offers "Only attributes for ${asset.typeId?.name}", on`).toBeChecked({ timeout: 15_000 });
      await modal.locator('#attributeId').click();
      await expect(page.getByRole('option'), `filtered to ${asset.typeId?.name}: no attribute types`).toHaveCount(0, { timeout: 15_000 });
      // a react-switch: its background takes the tap, not the hidden input; the first tap may only close the open picker
      await expect(async () => {
        await modal.locator('.boolean-switch').filter({ has: page.locator('#filterByType') }).locator('.react-switch-bg').click();
        await expect(filter).not.toBeChecked({ timeout: 2_000 });
      }, 'the type filter switched off').toPass({ timeout: 20_000 });
      await pickAttribute();
      await modal.locator('#value').fill(value);
      await modal.getByRole('button', { name: 'Add Attribute' }).click();
      await expect(page.getByText('Unable to save attribute. Please try again.'), 'the app says the save failed')
        .toBeVisible({ timeout: 30_000 });
      expect(failing.hits, 'the add really was refused (not a vacuous pass)').toBeGreaterThan(0);
    } finally {
      await failing.stop();
    }
    await expect(modal, 'the form stays open after a failed save').toBeVisible();
    expect((await attributesOf(page, asset.name)).map((a) => a.id).sort(), 'nothing reached the server').toEqual(before);

    // 4 · the real add (the same form, sent again)
    await modal.getByRole('button', { name: 'Add Attribute' }).click();
    await expect(modal, 'the form closes on success').toHaveCount(0, { timeout: 30_000 });
    let ours: Attr | undefined;
    await expect.poll(async () => {
      ours = (await attributesOf(page, asset.name)).find((a) => !before.includes(a.id) && a.attributeId.name === ATTRIBUTE);
      return ours?.value ?? null;
    }, { message: `the server holds ${ATTRIBUTE} = the run's value`, timeout: 30_000 }).toBe(value);
    ourId = ours!.id;
    const ourRow = panel.locator('tr').filter({ hasText: value });
    await expect(ourRow, 'the new attribute is listed with its value').toHaveCount(1, { timeout: 15_000 });

    // 5 · edit it
    await ourRow.locator('button[aria-label^="Edit "]').click();
    await expect(modal.getByRole('button', { name: 'Update Attribute' }), 'the edit form opened').toBeVisible({ timeout: 15_000 });
    await modal.locator('#value').fill(edited);
    await modal.getByRole('button', { name: 'Update Attribute' }).click();
    await expect(modal).toHaveCount(0, { timeout: 30_000 });
    await expect.poll(async () => (await attributesOf(page, asset.name)).find((a) => a.id === ourId)?.value ?? null,
      { message: 'the server holds the edited value', timeout: 30_000 }).toBe(edited);
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.944-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    // 6 · remove it — only ever the attribute this run added (trap 2)
    if (ourId) {
      try {
        const ourRow = panel.locator('tr').filter({ hasText: 'DD944' });
        await ourRow.locator('button[aria-label^="Edit "]').click();
        await modal.getByRole('button', { name: 'Remove Attribute' }).click();
        await modal.filter({ hasText: 'Are you sure you want to remove' }).getByRole('button', { name: 'Yes' }).click();
        await expect.poll(async () => (await attributesOf(page, asset.name)).map((a) => a.id).sort(),
          { message: "the asset is back to the attributes it had", timeout: 30_000 }).toEqual(before);
      } finally {
        await page.unroute('**/graphql', guard);
      }
      expect(stopped, 'no remove for any other attribute was attempted').toBe(0);
      expect(removes, 'exactly one remove, for our attribute').toBe(1);
    } else {
      await page.unroute('**/graphql', guard);
    }
  }
  await page.screenshot({ path: 'results/MOB.944-after.png' });
}
