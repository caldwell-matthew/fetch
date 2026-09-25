// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.590_AssetVerify_Unverified_Tab.json. This file is the source now: edit it directly.
// MOB.590_AssetVerify_Unverified_Tab

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';
import { waitForPrefetch } from '../support/prefetch';

export async function mob590(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await waitForPrefetch(page);
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
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("BASELINE: Tank 0000 is present before verifying", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]`, 30000);
  });
  await run.step("Verify Tank 0000", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`, 30000);
  });
  await run.step("Wait for the verify mutation", {}, async () => {
    await wait(page, 4);
  });
  await run.step("Switch to the \"Unverified\" filter", {}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="Unverified"]]`, 30000);
  });
  await run.step("Wait for the list to re-filter", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF: \"Tank 0000\" is GONE from the Unverified tab once verified", {}, async () => {
    await assertPageLacks(page, `Tank 0000`, DEFAULT_TIMEOUT);
  });
  await run.step("Switch to the \"Verified\" filter", {}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="Verified"]]`, 30000);
  });
  await run.step("\"Tank 0000\" is on the Verified tab", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]`, 30000);
  });
  await run.step("Unverify Tank 0000 from the Verified tab", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`, 30000);
  });
  await run.step("Wait for the unverify mutation", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("Switch back to the \"All\" filter", {always: true}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="All"]]`, 30000);
  });
  await run.step("Wait for the list to restore", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("RESTORED: \"Tank 0000\" is listed again under All", {always: true}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]`, 30000);
  });
  run.finish();
}
