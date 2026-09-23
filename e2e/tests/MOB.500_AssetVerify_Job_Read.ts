// Generated from Mobile/dd_tests_mobile/MOB.500_AssetVerify_Job_Read.json by to_playwright.py — do not edit by hand yet.
// MOB.500_AssetVerify_Job_Read

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, click, wait } from '../support/dd';

export async function mob500(page: Page): Promise<void> {
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
  await run.step("Test the verification progress counter renders", {}, async () => {
    await assertPageContains(page, `Assets Verified`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: job is at rest (\"0 out of 2 Assets Verified\")", {}, async () => {
    await assertPageContains(page, `0 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the All/Unverified/Verified filter renders", {}, async () => {
    await assertElementPresent(page, `//label[.//span[normalize-space(.)="Unverified"]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Switch to the \"Verified\" filter", {}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="Verified"]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the Verified list to re-render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test the Verified tab is empty at rest", {}, async () => {
    await assertPageContains(page, `No assets found.`, DEFAULT_TIMEOUT);
  });
  await run.step("Switch to the \"Unverified\" filter", {}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="Unverified"]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the Unverified list to re-render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test the Unverified tab is NOT empty at rest", {}, async () => {
    await assertPageLacks(page, `No assets found.`, DEFAULT_TIMEOUT);
  });
  await run.step("Switch to the \"All\" filter", {}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="All"]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the All list to re-render", {}, async () => {
    await wait(page, 2);
  });
  run.finish();
}
