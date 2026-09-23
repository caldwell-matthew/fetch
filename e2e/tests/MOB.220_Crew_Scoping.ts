// Generated from Mobile/dd_tests_mobile/MOB.220_Crew_Scoping.json by to_playwright.py — do not edit by hand yet.
// MOB.220_Crew_Scoping

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob220(page: Page): Promise<void> {
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Wait for the job list
    await wait(page, 25);
    // Baseline: "DATADOG MOBILE JOB" is visible under Admin
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open the header menu
    await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Click Switch Crews
    await el(page, `//button[.//div[normalize-space(.)="Switch Crews"]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the crew list
    await wait(page, 2);
    // Select Admin 0100
    await el(page, `//label[contains(normalize-space(.), "0100")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Submit the crew change
    await el(page, `//button[normalize-space(.)="Submit"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the crew change to resync
    await wait(page, 8);
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Wait for the job list to reload for the new crew
    await wait(page, 25);
    // PROOF: "DATADOG MOBILE JOB" is not visible to another crew
    await assertPageLacks(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open the header menu
    await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Click Switch Crews
    await el(page, `//button[.//div[normalize-space(.)="Switch Crews"]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the crew list
    await wait(page, 2);
    // Select Admin (restore)
    await el(page, `//label[normalize-space(.)="Admin"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Submit the crew change
    await el(page, `//button[normalize-space(.)="Submit"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the crew change to resync
    await wait(page, 8);
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Wait for the job list to reload
    await wait(page, 25);
    // RESTORED: "DATADOG MOBILE JOB" is visible again
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
}
