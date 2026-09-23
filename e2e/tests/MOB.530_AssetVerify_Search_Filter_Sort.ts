// Generated from Mobile/dd_tests_mobile/MOB.530_AssetVerify_Search_Filter_Sort.json by to_playwright.py — do not edit by hand yet.
// MOB.530_AssetVerify_Search_Filter_Sort

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob530(page: Page): Promise<void> {
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
    // Baseline: the fixture job is listed
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Filter by "In Progress"
    await el(page, `//li[contains(normalize-space(.), "In Progress:")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the list to re-filter
    await wait(page, 2);
    // PROOF: a READY job is hidden by the In Progress filter
    await assertPageLacks(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Untoggle "In Progress"
    await el(page, `//li[contains(normalize-space(.), "In Progress:")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the list to restore
    await wait(page, 2);
    // The fixture job is back
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Filter by "Ready"
    await el(page, `//li[contains(normalize-space(.), "Ready:")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the list to re-filter
    await wait(page, 2);
    // PROOF: the Ready filter keeps the fixture job
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Untoggle "Ready"
    await el(page, `//li[contains(normalize-space(.), "Ready:")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the list to restore
    await wait(page, 2);
    // Focus the job search box
    await el(page, `//input[@placeholder="Find Mobile Job(s)"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Search for the fixture job
    await el(page, `//input[@placeholder="Find Mobile Job(s)"]`).fill(`DATADOG MOBILE JOB`, { timeout: DEFAULT_TIMEOUT });
    // Wait for the 300ms search debounce
    await wait(page, 2);
    // The fixture job matches its own name
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Append junk so the query cannot match
    await el(page, `//input[@placeholder="Find Mobile Job(s)"]`).fill(`ZZZZ-NO-SUCH-JOB`, { timeout: DEFAULT_TIMEOUT });
    // Wait for the 300ms search debounce
    await wait(page, 2);
    // PROOF: a non-matching search hides the fixture job
    await assertPageLacks(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open the sort dropdown
    await el(page, `//button[.//*[@data-icon="sort-alt" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the sort modal
    await wait(page, 2);
    // The Sort Criteria modal opened
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
    // Dismiss the sort modal
    await page.keyboard.press(`Escape`);
    // Wait for the modal to close
    await wait(page, 2);
    // The sort modal closed
    await assertPageLacks(page, `Sort Criteria`, DEFAULT_TIMEOUT);
}
