// Generated from Mobile/dd_tests_mobile/MOB.810_Search_Sort_Apply.json by to_playwright.py — do not edit by hand yet.
// MOB.810_Search_Sort_Apply

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob810(page: Page): Promise<void> {
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Let the page begin loading
    await wait(page, 5);
    // Open the sort dropdown
    await el(page, `//button[.//*[@data-icon="sort-alt" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 40000 });
    // Wait for the sort modal
    await wait(page, 2);
    // The Sort Criteria modal opened
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
    // Open the sort options
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the sort options
    await wait(page, 2);
    // Pick "Created At ▲"
    await el(page, `//*[@role="option"][normalize-space(.)="Created At ▲"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the sort to apply
    await wait(page, 3);
    // The sort modal closed on selection
    await assertPageLacks(page, `Sort Criteria`, DEFAULT_TIMEOUT);
    // The choice was persisted as "Created At ▲"
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('mobile-MobileJob-sort');
if (!raw) return false;
return JSON.parse(raw).label === 'Created At ▲';`, DEFAULT_TIMEOUT);
    // Navigate to /work
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Wait for the work list
    await wait(page, 8);
    // Navigate to back to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Let the page begin loading
    await wait(page, 5);
    // PROOF: "Created At ▲" survived a page load
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('mobile-MobileJob-sort');
if (!raw) return false;
return JSON.parse(raw).label === 'Created At ▲';`, 40000);
    // Open the sort dropdown
    await el(page, `//button[.//*[@data-icon="sort-alt" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 40000 });
    // Wait for the sort modal
    await wait(page, 2);
    // The Sort Criteria modal opened
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
    // Open the sort options
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the sort options
    await wait(page, 2);
    // Pick "Created At ▼"
    await el(page, `//*[@role="option"][normalize-space(.)="Created At ▼"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the sort to apply
    await wait(page, 3);
    // The sort modal closed on selection
    await assertPageLacks(page, `Sort Criteria`, DEFAULT_TIMEOUT);
    // The descending option applied ("Created At ▼")
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('mobile-MobileJob-sort');
if (!raw) return false;
return JSON.parse(raw).label === 'Created At ▼';`, DEFAULT_TIMEOUT);
}
