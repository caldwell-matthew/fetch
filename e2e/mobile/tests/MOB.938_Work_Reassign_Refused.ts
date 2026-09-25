// MOB.938_Work_Reassign_Refused — written for Playwright (not converted from Datadog).
//
// `Assign Work Stage` now waits for the server (`InsertForm/ReassignWork.tsx:32-57`): with `Keep local copy of work?`
// off it removes the stage from the user's crew, THEN adds the picked crew, and a refusal of either shows `Unable to
// assign work stage.` with the modal still open — it used to send both without waiting and toast success from the
// cache. The browser refuses BOTH mutations (`removeWorkStageFromCrew`, `addAssignmentToWorkStage`, matched on their
// fields — trap 43), so neither can reach dev whichever the app sends; the remove goes first and, refused, stops the
// add. The fixture work order's crews are read over `/graphql` before and after: unchanged. Reads only.
import { expect, Page } from '@playwright/test';
import { failOperation } from '../../support/network';
import { appUrl, FIXTURE_WO, serverRead } from '../support/session';

const REJECTION = 'DD SYNTHETIC 938: the test refused this assignment';
const CREW = 'Account Executive'; // MOB.365's target: not one of the fixture's crews
const CREWS = 'query($p: ChildTableQuery!) { workStageAssignments(params: $p) { edges { id name } } }';

export async function mob938(page: Page): Promise<void> {
  const crews = async () => (await serverRead(page, CREWS, { p: { parentId: FIXTURE_WO, limit: 100 } }))
    .workStageAssignments.edges.map((e: { id: string }) => e.id).sort().join(',');
  const before = await crews();

  try {
    await page.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
    await expect(page.getByText('Status:').first()).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: 'Assign Work Stage' }).click();
    const form = page.locator('#crewform');
    await expect(form, 'the crew form opened').toBeVisible({ timeout: 30_000 });
    await form.locator('#crewId').pressSequentially(CREW);
    // the one visible option titled exactly the crew (MOB.365)
    await page.getByRole('option').filter({ has: page.locator('[class*="option-title"]', { hasText: new RegExp(`^${CREW}$`) }) })
      .first().click();
    await expect(form.locator('#crewId')).toHaveValue(CREW);

    const remove = await failOperation(page, { field: 'removeWorkStageFromCrew' }, { kind: 'graphql', message: REJECTION });
    const add = await failOperation(page, { field: 'addAssignmentToWorkStage' }, { kind: 'graphql', message: REJECTION });
    try {
      await form.getByRole('button', { name: 'SUBMIT', exact: true }).click();
      await expect(page.getByText('Unable to assign work stage.'), 'the app says the assignment failed')
        .toBeVisible({ timeout: 30_000 });
      expect(remove.hits + add.hits, 'the assignment really was refused (not a vacuous pass)').toBeGreaterThan(0);
      expect(remove.hits, '`Keep local copy` is off, so the remove went first').toBe(1);
      expect(add.hits, 'and, refused, it stopped the add').toBe(0);
    } finally {
      await remove.stop();
      await add.stop();
    }
    await expect(page.getByText('Work stage has been assigned to'), 'no success toast').toHaveCount(0);
    await expect(form, 'the modal stays open').toBeVisible();
    await expect(form.getByRole('button', { name: 'SUBMIT', exact: true }), 'and can be sent again').toBeEnabled();
    await page.keyboard.press('Escape');
    await expect(form, 'closed unsent').toHaveCount(0, { timeout: 15_000 });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.938-failure.png' }).catch(() => undefined);
    throw err;
  }
  expect(await crews(), "the fixture work order's crews are exactly as before").toBe(before);
}
