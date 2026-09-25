// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.300_Work_Create.json. This file is the source now: edit it directly.
// MOB.300_Work_Create
//
// The form's `Assign to Crew` (since 2026-09-18, `WorkOrders/components/InsertForm/index.tsx:44-58,298`; shown with the
// `crewassignment.create` permission) starts at the user's crew, and the create sends it as the stage's `roleId` —
// before, every mobile-made work order went to the user's crew with no choice. The test leaves it as it is, and proves
// that the create sends the session's crew as `roleId` and the new stage holds it (the server adds it to the
// crews the workflow assigns itself — `server/…/work/work/create/index.ts:285-308`). Clearing it or picking another crew
// leaves work outside the crew's list: an owner decision, not made here.

import { expect, Page, Response } from '@playwright/test';
import { serverRead } from '../support/session';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, click, typeText, wait } from '../../support/dd';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';

export async function mob300(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
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
  await run.step("\u2b50 SERVER: the create sent the session's crew, and the new stage holds it \u2014 asked over /graphql", {}, async () => {
    const res = await created!;
    expect(res.request().postDataJSON()?.variables?.data?.roleId, "the create's roleId is the session's crew").toBe(crew.id);
    const stages: { id: string }[] = (await res.json()).data.createWork.stages;
    expect(stages.length, 'the create made a stage').toBeGreaterThan(0);
    // The workflow assigns crews of its own too ("Datadog Test": seven more), so the crew is one of several.
    for (const stage of stages) {
      const crews = (await serverRead(page, 'query($p: ChildTableQuery!) { workStageAssignments(params: $p) { edges { name } } }',
        { p: { parentId: stage.id, limit: 100 } })).workStageAssignments.edges.map((e: { name: string }) => e.name);
      expect(crews, `stage ${stage.id} is assigned to ${crew.name}`).toContain(crew.name);
    }
  });
  run.finish();
}
