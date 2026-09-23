// Generated from Mobile/dd_tests_mobile/MOB.860_MaterialLookup_Cycle_Count.json by to_playwright.py — do not edit by hand yet.
// MOB.860_MaterialLookup_Cycle_Count

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';

export async function mob860(page: Page): Promise<void> {
    // Navigate to material lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/material-lookup`);
    // Wait for the page to mount
    await wait(page, 6);
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
    // The fixture item is listed
    await assertPageContains(page, `000-000-000 Adamantium`, DEFAULT_TIMEOUT);
    // Open the stock adjustment for 000-000-000 Adamantium
    await el(page, `//tr[contains(normalize-space(.), "000-000-000 Adamantium")]//button[.//*[@data-icon="arrow-up-right-from-square" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-up-right-from-square ")]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the stock adjustment modal
    await wait(page, 3);
    // The adjustment modal opened
    await assertPageContains(page, `Current Quantity`, DEFAULT_TIMEOUT);
    // Enter the +1 adjustment
    await el(page, `//*[@id="adjustment"]`).fill(`1`, { timeout: DEFAULT_TIMEOUT });
    // Open the reason lookup
    await el(page, `//*[@id="reason"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for reason options
    await wait(page, 2);
    // Pick reason "Error Correction"
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Error Correction")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Submit the adjustment
    await el(page, `//button[normalize-space(.)="Submit"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the adjust mutation
    await wait(page, 5);
    // PROOF: the +1 adjustment was accepted (modal closed)
    await assertPageLacks(page, `Current Quantity`, DEFAULT_TIMEOUT);
    await optional("Adjustment toast (optional: transient)", async () => {
      await assertPageContains(page, `Storeroom item quantity adjusted`, DEFAULT_TIMEOUT);
    });
    // Open the stock adjustment for 000-000-000 Adamantium
    await el(page, `//tr[contains(normalize-space(.), "000-000-000 Adamantium")]//button[.//*[@data-icon="arrow-up-right-from-square" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-up-right-from-square ")]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the stock adjustment modal
    await wait(page, 3);
    // The adjustment modal opened
    await assertPageContains(page, `Current Quantity`, DEFAULT_TIMEOUT);
    // Enter the -1 (restore) adjustment
    await el(page, `//*[@id="adjustment"]`).fill(`-1`, { timeout: DEFAULT_TIMEOUT });
    // Open the reason lookup
    await el(page, `//*[@id="reason"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for reason options
    await wait(page, 2);
    // Pick reason "Error Correction"
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Error Correction")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Submit the adjustment
    await el(page, `//button[normalize-space(.)="Submit"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the adjust mutation
    await wait(page, 5);
    // PROOF: the -1 (restore) adjustment was accepted (modal closed)
    await assertPageLacks(page, `Current Quantity`, DEFAULT_TIMEOUT);
    await optional("Adjustment toast (optional: transient)", async () => {
      await assertPageContains(page, `Storeroom item quantity adjusted`, DEFAULT_TIMEOUT);
    });
}
