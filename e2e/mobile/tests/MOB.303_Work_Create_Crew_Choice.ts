// MOB.303_Work_Create_Crew_Choice — written for Playwright (not converted from Datadog).
//
// The create form's `Assign to Crew` starts at the user's crew (MOB.300 leaves it). Here it is changed, twice
// (owner, 2026-09-29): CLEARED — its `Clear value` button — and set to ANOTHER crew. The create sends the field as the
// stage's `roleId`, "unassigned if cleared" (`WorkOrders/components/InsertForm/index.tsx:96-126`); the server adds that
// crew to the ones the workflow assigns itself, and adds NOTHING when it is empty (`server/…/work/work/create/index.ts:
// 283-310`). The "Datadog Test" workflow's stage assigns eight crews itself — `Admin` among them (read over `/graphql`,
// 2026-09-29) — so the new stage is in the crew's list either way, and the proof is the stage's assignments against the
// workflow's own, read at run time: exactly the workflow's when cleared, the workflow's plus the other crew when picked.
//
// The other crew is `Test Notifications Only`, the role made on 2026-09-28 for the tests alone — no user holds it — and
// marked a crew on 2026-09-29 (`crew: true`, owner) so the picker offers it: whatever an assignment sends reaches no
// developer (trap 51). Both work orders are residue, `DD SYNTHETIC MOBILE …`,
// pruned by `cleanup_residue.py`.
import { expect, Page, Response } from '@playwright/test';
import { runId } from '../../support/env';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';
import { appUrl, serverRead } from '../support/session';
import { DATADOG_TEST_WORKFLOW, TEST_NOTIFICATIONS_CREW } from '../support/fixtures';

const OTHER = { name: 'Test Notifications Only', id: TEST_NOTIFICATIONS_CREW };
const ASSIGNED = 'query($p: ChildTableQuery!) { workStageAssignments(params: $p) { edges { name } } }';
const WORKFLOW = DATADOG_TEST_WORKFLOW; // the "☢️ Datadog Test" workflow title
const WORKFLOW_CREWS = `query($p: ChildTableQuery!) { workflowStagesForTitle(params: $p) { edges { id } } }`;

/** Create a `Datadog Test` work order with the crew field cleared (`null`) or set to `crew`; returns what was sent and the new stage. */
async function create(page: Page, desc: string, crew: string | null): Promise<{ roleId: unknown; stageId: string }> {
  await page.goto(appUrl('work'), { waitUntil: 'load' });
  await expect(page.locator('#page-title h4', { hasText: 'Work Orders' })).toBeVisible({ timeout: 60_000 });
  await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
  await page.locator('.mantine-Affix-root button').click();
  const form = page.locator('#workorder-insert-form');
  await expect(form, 'the create form opened').toBeVisible({ timeout: 30_000 });
  await form.locator('#workflowTitleId').click();
  await form.locator('#workflowTitleId').pressSequentially('Datadog Test');
  await page.getByRole('option').filter({ hasText: 'Datadog Test' }).first().click();
  await form.locator('#problemDesc').fill(desc);

  const field = form.locator('#crewId');
  await expect(field, "`Assign to Crew` starts at the user's crew").toHaveValue('Admin', { timeout: 30_000 });
  const wrapper = form.locator('.mantine-TextInput-root').filter({ has: page.locator('#crewId') });
  await wrapper.getByRole('button', { name: 'Clear value' }).click();
  await expect(field, 'cleared').toHaveValue('');
  if (crew) {
    // The list opens on the first crews only (dev has 193 roles): type to reach this one.
    await field.click();
    await field.pressSequentially(crew);
    await page.getByRole('option', { name: crew, exact: true }).click({ timeout: 30_000 });
    await expect(field, `set to ${crew}`).toHaveValue(crew);
  }
  // Clearing opens the crew list, which then covers `Create Work Order`: close it by moving to another field.
  await form.locator('#problemDesc').click();
  await expect(page.locator('.mantine-Combobox-dropdown:visible'), 'the crew list closed').toHaveCount(0, { timeout: 10_000 });
  await expect(field, 'and the crew field kept its value').toHaveValue(crew ?? '');

  const created: Promise<Response> = page.waitForResponse((r) => r.url().endsWith('/graphql')
    && /\bcreateWork\s*\(/.test(r.request().postData() ?? ''), { timeout: 60_000 });
  await page.getByRole('button', { name: 'Create Work Order', exact: true }).click();
  const res = await created;
  const stages: { id: string }[] = (await res.json()).data.createWork.stages;
  expect(stages.length, 'the create made a stage').toBeGreaterThan(0);
  await expect(page.getByText('Creating New Work Order'), 'the form closed').toHaveCount(0, { timeout: 30_000 });
  return { roleId: res.request().postDataJSON()?.variables?.data?.roleId, stageId: stages[0].id };
}

async function crews(page: Page, stageId: string): Promise<string[]> {
  return (await serverRead(page, ASSIGNED, { p: { parentId: stageId, limit: 100 } })).workStageAssignments.edges.map((e: { name: string }) => e.name);
}

export async function mob303(page: Page): Promise<void> {
  const me = (await serverRead(page, '{ session { me { role { id name } } } }')).session.me.role;
  expect(me.name, "PREMISE: the session's crew is Admin").toBe('Admin');
  const run = runId('numeric', 8);
  const stagesOfWorkflow = (await serverRead(page, WORKFLOW_CREWS, { p: { parentId: WORKFLOW, limit: 10 } })).workflowStagesForTitle.edges;
  expect(stagesOfWorkflow.length, 'PREMISE: the Datadog Test workflow has one stage').toBe(1);
  const own: string[] = (await serverRead(page, 'query($p: ChildTableQuery!) { workflowAssignments(params: $p) { edges { name } } }',
    { p: { parentId: stagesOfWorkflow[0].id, limit: 100 } })).workflowAssignments.edges.map((e: { name: string }) => e.name).sort();
  expect(own.length, "PREMISE: the workflow assigns crews of its own").toBeGreaterThan(0);
  expect(own, `PREMISE: ${OTHER.name} is not one of them`).not.toContain(OTHER.name);
  try {
    // CLEARED: no crew sent; the stage holds exactly the workflow's crews — the create added none.
    const cleared = await create(page, `DD SYNTHETIC MOBILE ${run} CLEARED`, null);
    expect(cleared.roleId ?? null, 'a cleared crew sends no roleId').toBeNull();
    await expect.poll(async () => (await crews(page, cleared.stageId)).sort(), { message: "exactly the workflow's own crews", timeout: 30_000 }).toEqual(own);

    // ANOTHER crew: sent as roleId, and the stage holds the workflow's crews plus it.
    const other = await create(page, `DD SYNTHETIC MOBILE ${run} OTHER`, OTHER.name);
    expect(other.roleId, 'the picked crew is sent as roleId').toBe(OTHER.id);
    await expect.poll(async () => (await crews(page, other.stageId)).sort(), { message: `the workflow's crews and ${OTHER.name}`, timeout: 30_000 })
      .toEqual([...own, OTHER.name].sort());
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.303-failure.png' }).catch(() => undefined);
    throw err;
  }
}
