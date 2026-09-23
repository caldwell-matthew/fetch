// Generated from Mobile/dd_tests_mobile/MOB.575_AssetVerify_Failure_Condition_Forms.json by to_playwright.py — do not edit by hand yet.
// MOB.575_AssetVerify_Failure_Condition_Forms

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob575(page: Page): Promise<void> {
  try {
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
    await el(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`).click({ timeout: 30000 });
    // Let the asset detail begin rendering
    await wait(page, 2);
    // The full-page asset detail rendered
    await assertPageContains(page, `Asset Type:`, 30000);
    // Open the "Failure" tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`).click({ timeout: 30000 });
    // Wait for the panel
    await wait(page, 3);
    // GATE PASSED: no placeholder on the Failure tab
    await assertPageLacks(page, `A failure profile need to exist`, DEFAULT_TIMEOUT);
    // The "Failure" tab offers its Add button
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
    // Open the Failure add form
    await el(page, `//button[normalize-space(.)="Add"]`).click({ timeout: 30000 });
    // Wait for the form
    await wait(page, 3);
    // PROOF: the Failure form opened with its failure type field
    await assertElementPresent(page, `//*[@id="failureTypeId"]`, 30000);
    // Open the "Condition" tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`).click({ timeout: 30000 });
    // Wait for the panel
    await wait(page, 3);
    // GATE PASSED: no placeholder on the Condition tab
    await assertPageLacks(page, `An asset standard needs to exist`, DEFAULT_TIMEOUT);
    // The "Condition" tab offers its Add button
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
    // Open the Condition add form
    await el(page, `//button[normalize-space(.)="Add"]`).click({ timeout: 30000 });
    // Wait for the form
    await wait(page, 3);
    // PROOF: the Condition form opened with its inspection group field
    await assertElementPresent(page, `//*[@id="assetStandardDetailId"]`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Cancel out without submitting
    await page.keyboard.press(`Escape`);
    // Wait for the form to close
    await wait(page, 2);
    // Cancel out without submitting
    await page.keyboard.press(`Escape`);
    // Wait for the form to close
    await wait(page, 2);
  }
}
