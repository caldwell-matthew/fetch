// MOB.939_Map_Add_To_Work_Refused — written for Playwright (not converted from Datadog).
//
// "Add to Work" on a map card now waits for the server (`InsertForm/index.tsx:357-367`): a refused add shows `Unable to
// add asset to work order.` and leaves the form open — it used to close at once, whatever the server said. The path
// is MOB.929's: Asset Lookup → Tank 0040 → View in Map → its card → Add to Work → a work stage → submit. The browser
// refuses the add (`addWorkStageAssetLink`, the field — the app sends it as `MOBILE_WORK_ADD_ASSET`, trap 43), so dev
// never receives it. The stage picked is one the tests made, as in MOB.929 — made the same day, or it has sorted off the
// picker's page (MOB.929's note; in a full pass MOB.300 makes one first), so even a missed refusal could only link
// the asset to test residue; its links are read over `/graphql` before and after: unchanged. Reads only.
import { expect, Page } from '@playwright/test';
import { failOperation } from '../../support/network';
import { openAssetCard } from '../support/map';
import { FIXTURE_WO, FORMS_WO, serverRead } from '../support/session';

const ASSET = 'Tank 0040';
const MARKER = 'DD SYNTHETIC MOBILE';
const REJECTION = 'DD SYNTHETIC 939: the test refused this link';
const NEVER = new Set([FIXTURE_WO, FORMS_WO, 'RcdI0xcpc8NBV8VoRNNBYM']); // cleanup_residue.FIXTURE_STAGES
const LINKS = 'query($id: ID!) { workStage(id: $id) { assets { id } } }';
// the picker's query (`InsertForm/schemas.ts:27-31`), cut down — its options keep this order (MOB.929)
const PICKER_STAGES = '{ workStages(crew: "<SESSION>", params: { limit: 50, sortId: "displayName" }) '
  + '{ edges { id name workId { problemDesc createdBy { id } } } } }';
type Stage = { id: string; name: string; workId: { problemDesc: string | null; createdBy: { id: string } | null } };

export async function mob939(page: Page): Promise<void> {
  const me = (await serverRead(page, '{ session { me { id } } }')).session.me.id;
  const stages: Stage[] = (await serverRead(page, PICKER_STAGES)).workStages.edges;
  const index = stages.findIndex((s) => !NEVER.has(s.id) && s.workId?.createdBy?.id === me
    && (s.workId.problemDesc ?? '').trim().startsWith(MARKER));
  expect(index, `PREMISE: the picker's first page holds a work order the tests made ("${MARKER}")`).toBeGreaterThanOrEqual(0);
  const target = stages[index];
  const links = async () => (await serverRead(page, LINKS, { id: target.id })).workStage.assets
    .map((l: { id: string }) => l.id).sort().join(',');
  const before = await links();

  try {
    const card = await openAssetCard(page, ASSET);
    // "Add to Work" does nothing until the card's asset has loaded (MOB.929): retry until the form opens
    await expect(async () => {
      await card.click();
      await page.getByRole('menuitem', { name: 'Add to Work' }).click({ timeout: 5_000 });
      await expect(page.getByText('Add Asset to Work Order', { exact: true })).toBeVisible({ timeout: 3_000 });
    }, 'the form opened from the map card').toPass({ timeout: 60_000 });
    const form = page.locator('#add-asset-to-workorder-insert-form');
    await form.locator('#workStageId').click();
    const option = page.getByRole('option').nth(index);
    await expect(option, `option ${index + 1} is "${target.name}"`).toHaveText(target.name, { timeout: 30_000 });
    await option.click();

    const failing = await failOperation(page, { field: 'addWorkStageAssetLink' }, { kind: 'graphql', message: REJECTION });
    try {
      await page.locator('button[form="add-asset-to-workorder-insert-form"]').click();
      await expect(page.getByText('Unable to add asset to work order.'), 'the app says the add failed')
        .toBeVisible({ timeout: 30_000 });
      expect(failing.hits, 'the add really was refused (not a vacuous pass)').toBeGreaterThan(0);
    } finally {
      await failing.stop();
    }
    await expect(page.getByText('Asset added to workstage!'), 'no success toast').toHaveCount(0);
    await expect(page.getByText('Add Asset to Work Order', { exact: true }), 'the form stays open').toBeVisible();
    await expect(page.locator('button[form="add-asset-to-workorder-insert-form"]'), 'and can be sent again').toBeEnabled();
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.939-failure.png' }).catch(() => undefined);
    throw err;
  }
  expect(await links(), `"${target.name}"'s asset links are exactly as before`).toBe(before);
}
