// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.530_AssetVerify_Search_Filter_Sort.json. This file is the source now: edit it directly.
// MOB.530_AssetVerify_Search_Filter_Sort

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../../support/dd';

export async function mob530(page: Page): Promise<void> {
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
  await run.step("Baseline: the fixture job is listed", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Filter by \"In Progress\"", {}, async () => {
    await click(page, `//li[contains(normalize-space(.), "In Progress:")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the list to re-filter", {}, async () => {
    await wait(page, 2);
  });
  await run.step("PROOF: a READY job is hidden by the In Progress filter", {}, async () => {
    await assertPageLacks(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Untoggle \"In Progress\"", {}, async () => {
    await click(page, `//li[contains(normalize-space(.), "In Progress:")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the list to restore", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The fixture job is back", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Filter by \"Ready\"", {}, async () => {
    await click(page, `//li[contains(normalize-space(.), "Ready:")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the list to re-filter", {}, async () => {
    await wait(page, 2);
  });
  await run.step("PROOF: the Ready filter keeps the fixture job", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Untoggle \"Ready\"", {}, async () => {
    await click(page, `//li[contains(normalize-space(.), "Ready:")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the list to restore", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Focus the job search box", {}, async () => {
    await click(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Search for the fixture job", {}, async () => {
    await typeText(page, `//input[@placeholder="Find Mobile Job(s)"]`, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the 300ms search debounce", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The fixture job matches its own name", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Append junk so the query cannot match", {}, async () => {
    await typeText(page, `//input[@placeholder="Find Mobile Job(s)"]`, `ZZZZ-NO-SUCH-JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the 300ms search debounce", {}, async () => {
    await wait(page, 2);
  });
  await run.step("PROOF: a non-matching search hides the fixture job", {}, async () => {
    await assertPageLacks(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the sort dropdown", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the sort modal", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The Sort Criteria modal opened", {}, async () => {
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
  });
  await run.step("Dismiss the sort modal", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Wait for the modal to close", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The sort modal closed", {}, async () => {
    await assertPageLacks(page, `Sort Criteria`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
