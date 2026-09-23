// Generated from Mobile/dd_tests_mobile/MOB.590_AssetVerify_Unverified_Tab.json by to_playwright.py — do not edit by hand yet.
// MOB.590_AssetVerify_Unverified_Tab

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob590(page: Page): Promise<void> {
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
    // BASELINE: Tank 0000 is present before verifying
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]`, 30000);
    // Verify Tank 0000
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`).click({ timeout: 30000 });
    // Wait for the verify mutation
    await wait(page, 4);
    // Switch to the "Unverified" filter
    await el(page, `//label[.//span[normalize-space(.)="Unverified"]]`).click({ timeout: 30000 });
    // Wait for the list to re-filter
    await wait(page, 3);
    // PROOF: "Tank 0000" is GONE from the Unverified tab once verified
    await assertPageLacks(page, `Tank 0000`, DEFAULT_TIMEOUT);
    // Switch to the "Verified" filter
    await el(page, `//label[.//span[normalize-space(.)="Verified"]]`).click({ timeout: 30000 });
    // Wait for the list to re-filter
    await wait(page, 3);
    // "Tank 0000" is on the Verified tab
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Unverify Tank 0000 from the Verified tab
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`).click({ timeout: 30000 });
    // Wait for the unverify mutation
    await wait(page, 4);
    // Switch back to the "All" filter
    await el(page, `//label[.//span[normalize-space(.)="All"]]`).click({ timeout: 30000 });
    // Wait for the list to restore
    await wait(page, 3);
    // RESTORED: "Tank 0000" is listed again under All
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]`, 30000);
  }
}
