// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.220_Crew_Scoping.json. This file is the source now: edit it directly.
// MOB.220_Crew_Scoping

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';

export async function mob220(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Baseline: \"DATADOG MOBILE JOB\" is visible under Admin", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the header menu", {}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Click Switch Crews", {}, async () => {
    await click(page, `//button[.//div[normalize-space(.)="Switch Crews"]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Select Admin 0100", {}, async () => {
    await click(page, `//label[contains(normalize-space(.), "0100")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the crew change", {}, async () => {
    await click(page, `//button[normalize-space(.)="Submit"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the crew change to resync", {}, async () => {
    await wait(page, 8);
  });
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the job list to reload for the new crew", {}, async () => {
    await wait(page, 25);
  });
  await run.step("PROOF: \"DATADOG MOBILE JOB\" is not visible to another crew", {}, async () => {
    await assertPageLacks(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the header menu", {}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Click Switch Crews", {}, async () => {
    await click(page, `//button[.//div[normalize-space(.)="Switch Crews"]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Select Admin (restore)", {}, async () => {
    await click(page, `//label[normalize-space(.)="Admin"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the crew change", {}, async () => {
    await click(page, `//button[normalize-space(.)="Submit"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the crew change to resync", {}, async () => {
    await wait(page, 8);
  });
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the job list to reload", {}, async () => {
    await wait(page, 25);
  });
  await run.step("RESTORED: \"DATADOG MOBILE JOB\" is visible again", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
