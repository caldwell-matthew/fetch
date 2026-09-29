// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.397_Work_Assign_Followup.json. This file is the source now: edit it directly.
// MOB.397_Work_Assign_Followup

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../../support/dd';
import { runId } from '../../support/env';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';
import { FIXTURE_WO } from '../support/fixtures';
import { appUrl } from '../support/session';

export async function mob397(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
  const run = new Sequence();
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
  await run.step("LOADEDALL 3/3: the per-stage detail downloads finished", {}, async () => {
    await assertPageLacks(page, `workstages downloaded`, 360000);
  });
  await run.step("LOADEDALL: start the idle clock", {}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd_worklist_idle_since');
return true;`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL: no loading bar on screen for 10s straight (all six phases, and the gaps between them)", {}, async () => {
    await assertFromJavascript(page, `const K = '__dd_worklist_idle_since';
if (document.querySelector('.mantine-Progress-root')) {
  sessionStorage.removeItem(K);
  return false;
}
const since = Number(sessionStorage.getItem(K)) || 0;
if (!since) { sessionStorage.setItem(K, String(Date.now())); return false; }
return Date.now() - since >= 10000;`, 360000);
  });
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`${appUrl()}work/${FIXTURE_WO}`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the \"Assets\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][normalize-space(.)="Assets"]`, DEFAULT_TIMEOUT);
  });
  await run.step("The \"Assets\" tab is active", {}, async () => {
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Assets"][@data-active]`, DEFAULT_TIMEOUT);
  });
  await run.step("Expand the first asset row (the gear menu lives in the panel)", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`, 30000);
  });
  await run.step("A collection item with a gear menu exists", {}, async () => {
    await assertElementPresent(page, `//button[@aria-label="Menu"]`, 30000);
  });
  await run.step("Open the first item's gear menu", {}, async () => {
    await click(page, `(//button[@aria-label="Menu"])[1]`, DEFAULT_TIMEOUT);
  });
  await run.step("Click \"Assign Follow-up Work\" (EXACT text \u2014 this menu also has \"Delete Item\")", {}, async () => {
    await click(page, `//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Assign Follow-up Work"]`, DEFAULT_TIMEOUT);
  });
  await run.step("The follow-up modal opened", {}, async () => {
    await assertPageContains(page, `Create Follow-up Work`, DEFAULT_TIMEOUT);
  });
  await run.step("Turn OFF \"Filter Workflows By Asset\" (both default ON and hide the workflow)", {}, async () => {
    await click(page, `//label[@for="filterWorkflowByAsset"]`, 30000);
  });
  await run.step("Turn OFF \"Exclude PM Workflows\" (both default ON and hide the workflow)", {}, async () => {
    await click(page, `//label[@for="filterWorkflowByPMField"]`, 30000);
  });
  await run.step("Let the workflow list re-query unfiltered", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Both workflow filters are now OFF", {}, async () => {
    await assertFromJavascript(page, `
const ids = ['filterWorkflowByAsset', 'filterWorkflowByPMField'];
return ids.every(id => {
  const el = document.getElementById(id);
  return el && el.checked === false;
});
`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the Workflow lookup", {}, async () => {
    await click(page, `//*[@id="workflowTitleId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Search for the Datadog Test workflow", {}, async () => {
    await typeText(page, `//*[@id="workflowTitleId"]`, `Datadog Test`, DEFAULT_TIMEOUT);
  });
  await run.step("Pick the \"Datadog Test\" workflow", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Datadog Test")]`, 30000);
  });
  await run.step("Type the synthetic marker into Problem Description", {}, async () => {
    await typeText(page, `//*[@id="problemDesc"]`, `DD SYNTHETIC MOBILE ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Click \"Create Work Order\"", {}, async () => {
    await click(page, `//button[normalize-space(.)="Create Work Order"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Brief wait for the toast", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Success toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Work order successfully created!`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the create mutation", {}, async () => {
    await wait(page, 5);
  });
  await run.step("PROOF: the follow-up modal closed", {}, async () => {
    await assertPageLacks(page, `Create Follow-up Work`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
