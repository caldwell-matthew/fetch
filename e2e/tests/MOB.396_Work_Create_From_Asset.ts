// Generated from legacy/Mobile/dd_tests_mobile/MOB.396_Work_Create_From_Asset.json by to_playwright.py — do not edit by hand yet.
// MOB.396_Work_Create_From_Asset

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, typeText, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob396(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
  const run = new Sequence();
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await wait(page, 25);
  });
  await run.step("Test the job list rendered", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the lookup prefetch finished (feeds schemaQuery)", {}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open \"DATADOG MOBILE JOB\" by clicking its row (not a deep link)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`, 30000);
  });
  await run.step("Wait for the job detail to render", {}, async () => {
    await wait(page, 5);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Open Tank 0000's full-page detail", {}, async () => {
    await click(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the asset detail route begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The full-page asset detail rendered", {}, async () => {
    await assertPageContains(page, `Asset Type:`, 30000);
  });
  await run.step("Click \"Add Work\"", {}, async () => {
    await click(page, `//button[contains(normalize-space(.), "Add Work")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the create modal", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The create modal opened from the ASSET entry point", {}, async () => {
    await assertPageContains(page, `Creating New Work Order`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the auto-filter effect settle (it queries the asset's workflows)", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Turn OFF whichever workflow filters are ON (reads the input, clicks the label)", {}, async () => {
    await assertFromJavascript(page, `
const ids = ['filterWorkflowByAsset', 'filterWorkflowByPMField'];
let seen = 0;
for (const id of ids) {
  const el = document.getElementById(id);
  const lab = document.querySelector('label[for="' + id + '"]');
  if (!el || !lab) continue;
  seen += 1;
  if (el.checked) lab.click();
}
return seen === ids.length;
`, DEFAULT_TIMEOUT);
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
`, 30000);
  });
  await run.step("Focus the Workflow lookup", {}, async () => {
    await click(page, `//*[@id="workflowTitleId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Search for the Datadog Test workflow", {}, async () => {
    await typeText(page, `//*[@id="workflowTitleId"]`, `Datadog Test`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for workflow options", {}, async () => {
    await wait(page, 3);
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
  await run.step("Success toast (optional: transient, autoClose 5000)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Work order successfully created!`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the create mutation to resolve", {}, async () => {
    await wait(page, 5);
  });
  await run.step("PROOF: the modal closed inside Apollo's update()", {}, async () => {
    await assertPageLacks(page, `Creating New Work Order`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
