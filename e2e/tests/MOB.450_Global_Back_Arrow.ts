// Generated from Mobile/dd_tests_mobile/MOB.450_Global_Back_Arrow.json by to_playwright.py — do not edit by hand yet.
// MOB.450_Global_Back_Arrow

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, el, wait } from '../support/dd';

export async function mob450(page: Page): Promise<void> {
    // Navigate to /work
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Wait for the work list
    await wait(page, 8);
    // Start on "Work Orders"
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, DEFAULT_TIMEOUT);
    // Navigate to /asset-lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for asset lookup
    await wait(page, 6);
    // Now on "Asset Lookup"
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, DEFAULT_TIMEOUT);
    // Click the back arrow
    await el(page, `//*[@id="page-title"]//*[@data-icon="chevrons-left" or contains(concat(" ", normalize-space(@class), " "), " fa-chevrons-left ") or @data-icon="chevron-double-left" or contains(concat(" ", normalize-space(@class), " "), " fa-chevron-double-left ") or @data-icon="angles-left" or contains(concat(" ", normalize-space(@class), " "), " fa-angles-left ")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the previous route
    await wait(page, 6);
    // PROOF: back arrow returned to "Work Orders"
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, DEFAULT_TIMEOUT);
}
