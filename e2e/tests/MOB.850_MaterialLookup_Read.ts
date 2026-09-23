// Generated from Mobile/dd_tests_mobile/MOB.850_MaterialLookup_Read.json by to_playwright.py — do not edit by hand yet.
// MOB.850_MaterialLookup_Read

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob850(page: Page): Promise<void> {
    // Navigate to material lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/material-lookup`);
    // Wait for the page to mount
    await wait(page, 6);
    // Test the "Material Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]`, `Material Lookup`, DEFAULT_TIMEOUT);
    // Test the storeroom dropdown renders
    await assertElementPresent(page, `//*[@id="storeroomLocationId"]`, DEFAULT_TIMEOUT);
    // READY: the material list has loaded — an `N matches` line shows and no loading overlay covers the page
    await assertFromJavascript(page, `const overlay = document.querySelectorAll('.mantine-LoadingOverlay-overlay').length > 0;
const counted = [...document.querySelectorAll('p, div, span')]
  .some(e => e.children.length === 0 && /^\\d[\\d,]* matches$/.test((e.textContent || '').trim()));
return counted && !overlay;`, 60000);
    // Open the storeroom dropdown
    await el(page, `//*[@id="storeroomLocationId"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for storeroom options
    await wait(page, 2);
    // Pick Central Storeroom
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Central Storeroom")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the material list to load
    await wait(page, 8);
    // Focus the material search
    await el(page, `//input[@placeholder="Search for material items by name"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Search for Adamantium
    await el(page, `//input[@placeholder="Search for material items by name"]`).fill(`Adamantium`, { timeout: DEFAULT_TIMEOUT });
    // Wait for the search debounce
    await wait(page, 4);
    // PROOF: the search finds 000-000-000 Adamantium
    await assertPageContains(page, `000-000-000 Adamantium`, DEFAULT_TIMEOUT);
    // Append junk so the query cannot match
    await el(page, `//input[@placeholder="Search for material items by name"]`).fill(`ZZZZ-NO-SUCH-ITEM`, { timeout: DEFAULT_TIMEOUT });
    // Wait for the search debounce
    await wait(page, 4);
    // PROOF: a non-matching search hides 000-000-000 Adamantium
    await assertPageLacks(page, `000-000-000 Adamantium`, DEFAULT_TIMEOUT);
}
