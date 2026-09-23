// Generated from Mobile/dd_tests_mobile/MOB.460_Global_Module_Resync.json by to_playwright.py — do not edit by hand yet.
// MOB.460_Global_Module_Resync

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertPageContains, assertPageLacks, click, wait } from '../support/dd';

export async function mob460(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the job list and its prefetch", {}, async () => {
    await wait(page, 30);
  });
  await run.step("Baseline: the prefetch has settled", {}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("The resync timestamp is rendered", {}, async () => {
    await assertPageContains(page, `Data synced on`, DEFAULT_TIMEOUT);
  });
  await run.step("Click the module resync button", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sync" or contains(concat(" ", normalize-space(@class), " "), " fa-sync ") or @data-icon="arrows-rotate" or contains(concat(" ", normalize-space(@class), " "), " fa-arrows-rotate ") or @data-icon="rotate" or contains(concat(" ", normalize-space(@class), " "), " fa-rotate ")]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the list refetch return and the detail download start", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Resync fired: job details are re-downloading (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the resync to finish", {}, async () => {
    await wait(page, 30);
  });
  await run.step("Nothing left hanging after the resync", {}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("The job list still renders after resync", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
