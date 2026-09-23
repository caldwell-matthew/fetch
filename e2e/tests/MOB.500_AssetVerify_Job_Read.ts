// Generated from Mobile/dd_tests_mobile/MOB.500_AssetVerify_Job_Read.json by to_playwright.py — do not edit by hand yet.
// MOB.500_AssetVerify_Job_Read

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob500(page: Page): Promise<void> {
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
    // Test the verification progress counter renders
    await assertPageContains(page, `Assets Verified`, DEFAULT_TIMEOUT);
    // FIXTURE GUARD: job is at rest ("0 out of 2 Assets Verified")
    await assertPageContains(page, `0 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
    // Test the All/Unverified/Verified filter renders
    await assertElementPresent(page, `//label[.//span[normalize-space(.)="Unverified"]]`, DEFAULT_TIMEOUT);
    // Switch to the "Verified" filter
    await el(page, `//label[.//span[normalize-space(.)="Verified"]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the Verified list to re-render
    await wait(page, 2);
    // Test the Verified tab is empty at rest
    await assertPageContains(page, `No assets found.`, DEFAULT_TIMEOUT);
    // Switch to the "Unverified" filter
    await el(page, `//label[.//span[normalize-space(.)="Unverified"]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the Unverified list to re-render
    await wait(page, 2);
    // Test the Unverified tab is NOT empty at rest
    await assertPageLacks(page, `No assets found.`, DEFAULT_TIMEOUT);
    // Switch to the "All" filter
    await el(page, `//label[.//span[normalize-space(.)="All"]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the All list to re-render
    await wait(page, 2);
}
