// MOB.367_Work_Assign_Stage_Offline_And_Refused — written for Playwright (not converted from Datadog).
//
// `Assign Work Stage` (`WorkOrders/components/InsertForm/ReassignWork.tsx`) — MOB.398 opens it and cancels; MOB.365 saves
// it both ways (`Keep local copy` off: REMOVE the user's crew + ADD; on: ADD only) and restores. Two branches were left:
//   1  OFFLINE the button is not there at all (`if (!online …) return null`, `:81`) — and back online it returns;
//   2  a REFUSED assignment: the `catch` toasts `Unable to assign work stage.` and the form stays open (`:52-55`).
// On the main fixture, in its own browser: the offline leg only looks; the refused leg keeps `Keep local copy` ON, so
// the one mutation the form sends is the ADD — refused in the browser, as is the REMOVE should it ever go — and a
// server read proves the stage's crews unchanged. The crew picked is `Test Notifications Only` (no one holds it).
import { Browser, expect, Page } from '@playwright/test';
import { failOperation } from '../../support/network';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';
import { appUrl, FIXTURE_WO, freshSession, serverRead } from '../support/session';

const CREW = 'Test Notifications Only';
const CREWS = 'query($p: ChildTableQuery!) { workStageAssignments(params: $p) { edges { name } } }';

export async function mob367(browser: Browser): Promise<void> {
  const page = await freshSession(browser);
  try {
    await run(page);
  } finally {
    await page.context().close();
  }
}

async function crews(page: Page): Promise<string[]> {
  return (await serverRead(page, CREWS, { p: { parentId: FIXTURE_WO, limit: 100 } })).workStageAssignments.edges
    .map((e: { name: string }) => e.name).sort();
}

async function run(page: Page): Promise<void> {
  const before = await crews(page);
  expect(before, `PREMISE: ${CREW} is not one of the fixture's crews`).not.toContain(CREW);
  const add = await failOperation(page, { field: 'addAssignmentToWorkStage' }, { kind: 'graphql', message: 'Refused by the test (MOB.367)' });
  const remove = await failOperation(page, { field: 'removeWorkStageFromCrew' }, { kind: 'graphql', message: 'Refused by the test (MOB.367)' });
  try {
    await page.goto(appUrl('work'), { waitUntil: 'load' });
    await expect(page.locator('#page-title h4', { hasText: 'Work Orders' })).toBeVisible({ timeout: 60_000 });
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
    await page.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
    await expect(page.getByRole('tab').first(), 'the work order opened').toBeVisible({ timeout: 60_000 });
    const button = page.getByRole('button', { name: 'Assign Work Stage' });
    await expect(button, 'online: `Assign Work Stage`').toBeVisible({ timeout: 30_000 });

    // 1 · offline: gone, and back
    await page.context().setOffline(true);
    try {
      await expect(button, 'offline: the button is not rendered').toHaveCount(0, { timeout: 15_000 });
    } finally {
      await page.context().setOffline(false);
    }
    await expect(button, 'back online: it returns').toBeVisible({ timeout: 15_000 });

    // 2 · a refused assignment
    await button.click();
    const form = page.locator('#crewform');
    await expect(form, 'the crew form opened').toBeVisible({ timeout: 15_000 });
    const field = form.locator('#crewId');
    await field.click();
    await field.pressSequentially(CREW);
    await page.getByRole('option').filter({ hasText: CREW }).first().click({ timeout: 30_000 });
    await expect(field, `set to ${CREW}`).toHaveValue(CREW);
    const keep = form.locator('#keepAssignment');
    if (!(await keep.isChecked())) await form.locator('.react-switch-bg').first().click(); // trap 53
    await expect(keep, '`Keep local copy of work?` ON — the ADD is the only mutation').toBeChecked();
    await form.getByRole('button', { name: 'SUBMIT' }).click();
    await expect(page.getByText('Unable to assign work stage.'), 'the refusal reaches the user').toBeVisible({ timeout: 15_000 });
    await expect(form, 'and the form stays open').toBeVisible();
    await expect(page.getByText(/Work stage has been assigned to/), 'no success toast').toHaveCount(0);
    expect(add.hits, 'the ADD was sent — and refused here').toBe(1);
    expect(remove.hits, 'no REMOVE was sent').toBe(0);
    await page.screenshot({ path: 'results/MOB.367-refused.png' });
    await page.keyboard.press('Escape');
    await expect(form, 'closed').toHaveCount(0, { timeout: 15_000 });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.367-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await add.stop();
    await remove.stop();
  }
  expect(await crews(page), "SERVER: the fixture's crews are unchanged").toEqual(before);
}
