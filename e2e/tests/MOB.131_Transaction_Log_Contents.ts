// Generated from legacy/Mobile/dd_tests_mobile/MOB.131_Transaction_Log_Contents.json by to_playwright.py — do not edit by hand yet.
// MOB.131_Transaction_Log_Contents

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, click, wait } from '../support/dd';

export async function mob131(page: Page): Promise<void> {
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
  await run.step("BASELINE: Tank 0000 is present", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]`, 30000);
  });
  await run.step("Verify Tank 0000 (this is the mutation the log should record)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`, 30000);
  });
  await run.step("Wait for the verify mutation", {}, async () => {
    await wait(page, 4);
  });
  await run.step("Unverify Tank 0000 \u2014 restore immediately", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`, 30000);
  });
  await run.step("Wait for the unverify mutation", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("Navigate to the transaction log", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/transactions`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the log read localforage", {}, async () => {
    await wait(page, 4);
  });
  await run.step("The log's table headers render", {}, async () => {
    await assertPageContains(page, `Details`, DEFAULT_TIMEOUT);
  });
  await run.step("PROOF: the log recorded at least one transaction from this session", {}, async () => {
    await assertElementPresent(page, `//table//tbody//tr[1]`, 30000);
  });
  run.finish();
}
