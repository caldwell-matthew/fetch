// Generated from Mobile/dd_tests_mobile/MOB.460_Global_Module_Resync.json by to_playwright.py — do not edit by hand yet.
// MOB.460_Global_Module_Resync

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';

export async function mob460(page: Page): Promise<void> {
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Wait for the job list and its prefetch
    await wait(page, 30);
    // Baseline: the prefetch has settled
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
    // The resync timestamp is rendered
    await assertPageContains(page, `Data synced on`, DEFAULT_TIMEOUT);
    // Click the module resync button
    await el(page, `//button[.//*[@data-icon="sync" or contains(concat(" ", normalize-space(@class), " "), " fa-sync ") or @data-icon="arrows-rotate" or contains(concat(" ", normalize-space(@class), " "), " fa-arrows-rotate ") or @data-icon="rotate" or contains(concat(" ", normalize-space(@class), " "), " fa-rotate ")]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Let the list refetch return and the detail download start
    await wait(page, 3);
    await optional("Resync fired: job details are re-downloading (optional: transient)", async () => {
      await assertPageContains(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    });
    // Wait for the resync to finish
    await wait(page, 30);
    // Nothing left hanging after the resync
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    // The job list still renders after resync
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
}
