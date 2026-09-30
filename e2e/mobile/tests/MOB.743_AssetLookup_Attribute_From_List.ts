// MOB.743_AssetLookup_Attribute_From_List — written for Playwright (not converted from Datadog).
//
// An attribute type with a lookup list (`lookupTypeId`) takes its value from that list: the Attributes tab's value field
// is a record picker loading `lookupsForType` (`AssetLookup/AssetLookupDetails/Attributes.tsx:39-63`), and a save sends
// the picked option's id as both `value` and `lookupId` (`formatAttributeValue`, `:47-55`). The server then answers
// the attribute's `value` with the whole list RECORD (`{ id, name, desc, … }`, seen 2026-09-30), and the row shows its
// name — so the checks read the value's name. MOB.944 covers a plain text attribute; this is the list kind, on the same
// `DD SYNTHETIC MOBILE <8 digits>` test asset, in the test's own browser:
//   1. add `🔎 Inspection` — its picker offers exactly its list's options (`Inspection Types`) — with `Acoustic
//      Inspection` → the server's value names it, and the row shows it;
//   2. edit it to `CCTV Inspection` → the same;
//   3. remove it — the one attribute this run added (owner, 2026-09-28, trap 2); a route refuses any other remove.
import { expect, Page, Route } from '@playwright/test';
import { appUrl, serverRead } from '../support/session';
import { Attr, attributesOf, testAsset } from './MOB.944_AssetLookup_Attributes_Edit';

const ATTRIBUTE = /^🔎 Inspection\b/; // a text attribute type whose value comes from the `Inspection Types` list
const ROW = /🔎\s*Inspection/;      // its row, by its label (the icon is not the row text's first character)
const FIRST = 'Acoustic Inspection';
const SECOND = 'CCTV Inspection';
const TYPES = '{ _attributeTypes(value: "Inspection", category: ASSET) { id name lookupTypeId { id name } } }';
const OPTIONS = 'query($l: ID!) { lookupsForType(lookupTypeId: $l, value: "") { id name } }';

/** A list attribute's value, by name: the server answers the list record; a plain value is its own name. */
const nameOf = (v: unknown): string | null =>
  v && typeof v === 'object' && 'name' in v ? String((v as { name: unknown }).name) : (v == null ? null : String(v));

export async function mob743(page: Page): Promise<void> {
  const types: { id: string; name: string; lookupTypeId: { id: string; name: string } | null }[] = (await serverRead(page, TYPES))._attributeTypes;
  const type = types.find((t) => ATTRIBUTE.test(t.name));
  expect(type?.lookupTypeId, 'PREMISE: `🔎 Inspection` is an attribute type with a lookup list').toBeTruthy();
  const options: string[] = (await serverRead(page, OPTIONS, { l: type!.lookupTypeId!.id })).lookupsForType.map((o: { name: string }) => o.name).sort();
  expect(options, `PREMISE: its list holds "${FIRST}" and "${SECOND}"`).toEqual(expect.arrayContaining([FIRST, SECOND]));
  const asset = await testAsset(page);
  const before = asset.attributes.map((a) => a.id).sort();
  expect(asset.attributes.some((a) => a.attributeId.id === type!.id),
    `PREMISE: ${asset.name} does not hold ${type!.name} (a leftover would be a failed run's — remove it first)`).toBe(false);

  const row = page.locator('.mantine-Accordion-item').filter({ hasText: asset.name }).first();
  const panel = row.getByRole('tabpanel');
  const addButton = panel.getByRole('button', { name: 'Add Attribute' });
  const modal = page.locator('.mantine-Modal-content');
  const ours = async (): Promise<Attr | undefined> =>
    (await attributesOf(page, asset.name)).find((a) => !before.includes(a.id) && a.attributeId.id === type!.id);
  /** Open the value picker, check it offers exactly the list, and pick `name`. */
  const pickValue = async (name: string) => {
    await modal.locator('#value').click();
    await expect.poll(async () => (await page.getByRole('option').allInnerTexts()).map((t) => t.trim()).sort(),
      { message: `the value picker offers exactly the "${type!.lookupTypeId!.name}" list`, timeout: 15_000 }).toEqual(options);
    await page.getByRole('option').filter({ hasText: new RegExp(`^${name}$`) }).first().click();
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
    await expect(addButton, 'Add Attribute is offered').toBeVisible({ timeout: 30_000 });

    // 1 · add it, from its list
    await addButton.click();
    await expect(modal.locator('#attributeId'), 'the add form opened').toBeVisible({ timeout: 15_000 });
    // The asset's type (`Actuator Tools`) has no attribute types: switch the type filter off (as MOB.944 does).
    const filter = modal.locator('#filterByType');
    await expect(async () => {
      await modal.locator('.boolean-switch').filter({ has: page.locator('#filterByType') }).locator('.react-switch-bg').click();
      await expect(filter).not.toBeChecked({ timeout: 2_000 });
    }, 'the type filter switched off').toPass({ timeout: 20_000 });
    await modal.locator('#attributeId').click();
    await modal.locator('#attributeId').pressSequentially('Inspection');
    await page.getByRole('option').filter({ hasText: ATTRIBUTE }).first().click({ timeout: 30_000 });
    await expect(modal.locator('#value'), 'a value field for the picked type').toBeVisible({ timeout: 15_000 });
    await pickValue(FIRST);
    await modal.getByRole('button', { name: 'Add Attribute' }).click();
    await expect(modal, 'the form closes on success').toHaveCount(0, { timeout: 30_000 });
    await expect.poll(async () => nameOf((await ours())?.value),
      { message: `the server's value is the option "${FIRST}"`, timeout: 30_000 }).toBe(FIRST);
    ourId = (await ours())!.id;
    const ourRow = panel.locator('tr').filter({ hasText: ROW });
    await expect(ourRow, `the row shows "${FIRST}"`).toContainText(FIRST, { timeout: 15_000 });

    // 2 · edit it to another option
    await ourRow.locator('button[aria-label^="Edit "]').click();
    await expect(modal.getByRole('button', { name: 'Update Attribute' }), 'the edit form opened').toBeVisible({ timeout: 15_000 });
    await pickValue(SECOND);
    await modal.getByRole('button', { name: 'Update Attribute' }).click();
    await expect(modal).toHaveCount(0, { timeout: 30_000 });
    await expect.poll(async () => nameOf((await attributesOf(page, asset.name)).find((a) => a.id === ourId)?.value),
      { message: `the server's value is the option "${SECOND}"`, timeout: 30_000 }).toBe(SECOND);
    await expect(ourRow, `the row shows "${SECOND}"`).toContainText(SECOND, { timeout: 15_000 });
    await page.screenshot({ path: 'results/MOB.743-edited.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.743-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    // 3 · remove it — only ever the attribute this run added (trap 2). Found on the server, so a run that failed
    // before `ourId` was set still cleans up what it added.
    ourId = ourId ?? (await ours().catch(() => undefined))?.id ?? null;
    if (ourId) {
      try {
        await panel.locator('tr').filter({ hasText: ROW }).locator('button[aria-label^="Edit "]').click();
        await modal.getByRole('button', { name: 'Remove Attribute' }).click();
        await modal.filter({ hasText: 'Are you sure you want to remove' }).getByRole('button', { name: 'Yes' }).click();
        await expect.poll(async () => (await attributesOf(page, asset.name)).map((a) => a.id).sort(),
          { message: 'the asset is back to the attributes it had', timeout: 30_000 }).toEqual(before);
      } finally {
        await page.unroute('**/graphql', guard);
      }
      expect(stopped, 'no remove for any other attribute was attempted').toBe(0);
      expect(removes, 'exactly one remove, for our attribute').toBe(1);
    } else {
      await page.unroute('**/graphql', guard);
    }
  }
}
