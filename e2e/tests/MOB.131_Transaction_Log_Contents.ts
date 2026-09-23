// Generated from Mobile/dd_tests_mobile/MOB.131_Transaction_Log_Contents.json by to_playwright.py — do not edit by hand yet.
// MOB.131_Transaction_Log_Contents

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob131(page: Page): Promise<void> {
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
    // BASELINE: Tank 0000 is present
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]`, 30000);
    // Verify Tank 0000 (this is the mutation the log should record)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`).click({ timeout: 30000 });
    // Wait for the verify mutation
    await wait(page, 4);
    // Navigate to the transaction log
    await page.goto(`https://dev.mentorapm.com/apm-mobile/transactions`);
    // Let the log read localforage
    await wait(page, 4);
    // The log's table headers render
    await assertPageContains(page, `Details`, DEFAULT_TIMEOUT);
    // PROOF: the log recorded at least one transaction from this session
    await assertElementPresent(page, `//table//tbody//tr[1]`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Unverify Tank 0000 — restore immediately
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`).click({ timeout: 30000 });
    // Wait for the unverify mutation
    await wait(page, 4);
  }
}
