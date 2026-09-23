// Generated from Mobile/dd_tests_mobile/MOB.396_Work_Create_From_Asset.json by to_playwright.py — do not edit by hand yet.
// MOB.396_Work_Create_From_Asset

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob396(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Let the page begin rendering
    await wait(page, 3);
    // Test the "Mobile Jobs" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
    // Wait for the lookup prefetch and batched detail downloads
    await wait(page, 25);
    // Test the job list rendered
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
    // Test the lookup prefetch finished (feeds schemaQuery)
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
    // Test the batched job-detail downloads finished
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    // FIXTURE GUARD: "DATADOG MOBILE JOB" is in this crew's list
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open "DATADOG MOBILE JOB" by clicking its row (not a deep link)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`).click({ timeout: 30000 });
    // Wait for the job detail to render
    await wait(page, 5);
    // ASSET LIST GUARD: the job's asset rows have rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
    // Open Tank 0000's full-page detail
    await el(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`).click({ timeout: DEFAULT_TIMEOUT });
    // Let the asset detail route begin rendering
    await wait(page, 2);
    // The full-page asset detail rendered
    await assertPageContains(page, `Asset Type:`, 30000);
    // Click "Add Work"
    await el(page, `//button[contains(normalize-space(.), "Add Work")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the create modal
    await wait(page, 3);
    // The create modal opened from the ASSET entry point
    await assertPageContains(page, `Creating New Work Order`, DEFAULT_TIMEOUT);
    // Let the auto-filter effect settle (it queries the asset's workflows)
    await wait(page, 3);
    // Turn OFF whichever workflow filters are ON (reads the input, clicks the label)
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
    // Let the workflow list re-query unfiltered
    await wait(page, 3);
    // Both workflow filters are now OFF
    await assertFromJavascript(page, `
const ids = ['filterWorkflowByAsset', 'filterWorkflowByPMField'];
return ids.every(id => {
  const el = document.getElementById(id);
  return el && el.checked === false;
});
`, 30000);
    // Focus the Workflow lookup
    await el(page, `//*[@id="workflowTitleId"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Search for the Datadog Test workflow
    await el(page, `//*[@id="workflowTitleId"]`).fill(`Datadog Test`, { timeout: DEFAULT_TIMEOUT });
    // Wait for workflow options
    await wait(page, 3);
    // Pick the "Datadog Test" workflow
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Datadog Test")]`).click({ timeout: 30000 });
    // Type the synthetic marker into Problem Description
    await el(page, `//*[@id="problemDesc"]`).fill(`DD SYNTHETIC MOBILE ${RUNID}`, { timeout: DEFAULT_TIMEOUT });
    // Click "Create Work Order"
    await el(page, `//button[normalize-space(.)="Create Work Order"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Brief wait for the toast
    await wait(page, 2);
    await optional("Success toast (optional: transient, autoClose 5000)", async () => {
      await assertPageContains(page, `Work order successfully created!`, DEFAULT_TIMEOUT);
    });
    // Wait for the create mutation to resolve
    await wait(page, 5);
    // PROOF: the modal closed inside Apollo's update()
    await assertPageLacks(page, `Creating New Work Order`, DEFAULT_TIMEOUT);
}
