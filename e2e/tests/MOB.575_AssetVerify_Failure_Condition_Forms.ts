// Generated from legacy/Mobile/dd_tests_mobile/MOB.575_AssetVerify_Failure_Condition_Forms.json by to_playwright.py — do not edit by hand yet.
// MOB.575_AssetVerify_Failure_Condition_Forms

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, click, press, wait } from '../support/dd';

export async function mob575(page: Page): Promise<void> {
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
    await click(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`, 30000);
  });
  await run.step("Let the asset detail begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The full-page asset detail rendered", {}, async () => {
    await assertPageContains(page, `Asset Type:`, 30000);
  });
  await run.step("Open the \"Failure\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`, 30000);
  });
  await run.step("Wait for the panel", {}, async () => {
    await wait(page, 3);
  });
  await run.step("GATE PASSED: no placeholder on the Failure tab", {}, async () => {
    await assertPageLacks(page, `A failure profile need to exist`, DEFAULT_TIMEOUT);
  });
  await run.step("The \"Failure\" tab offers its Add button", {}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Open the Failure add form", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Wait for the form", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF: the Failure form opened with its failure type field", {}, async () => {
    await assertElementPresent(page, `//*[@id="failureTypeId"]`, 30000);
  });
  await run.step("Cancel out without submitting", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Wait for the form to close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Open the \"Condition\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`, 30000);
  });
  await run.step("Wait for the panel", {}, async () => {
    await wait(page, 3);
  });
  await run.step("GATE PASSED: no placeholder on the Condition tab", {}, async () => {
    await assertPageLacks(page, `An asset standard needs to exist`, DEFAULT_TIMEOUT);
  });
  await run.step("The \"Condition\" tab offers its Add button", {}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Open the Condition add form", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Wait for the form", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF: the Condition form opened with its inspection group field", {}, async () => {
    await assertElementPresent(page, `//*[@id="assetStandardDetailId"]`, 30000);
  });
  await run.step("Cancel out without submitting", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Wait for the form to close", {always: true}, async () => {
    await wait(page, 2);
  });
  run.finish();
}
