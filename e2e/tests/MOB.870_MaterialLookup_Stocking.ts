// Generated from Mobile/dd_tests_mobile/MOB.870_MaterialLookup_Stocking.json by to_playwright.py — do not edit by hand yet.
// MOB.870_MaterialLookup_Stocking

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';

export async function mob870(page: Page): Promise<void> {
    // Navigate to material lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/material-lookup`);
    // Wait for the page to mount
    await wait(page, 6);
    // Test the "Material Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]`, `Material Lookup`, DEFAULT_TIMEOUT);
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
    // Open the stock modal for 000-000-000 Adamantium
    await el(page, `//tr[contains(normalize-space(.), "000-000-000 Adamantium")]//button[.//*[@data-icon="arrow-up-right-from-square" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-up-right-from-square ")]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the modal
    await wait(page, 3);
    // The modal opened on the adjustment tab
    await assertPageContains(page, `Current Quantity`, DEFAULT_TIMEOUT);
    // Switch to the "Stock Item" tab
    await el(page, `//label[normalize-space(.)="Stock Item"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the stocking form
    await wait(page, 2);
    // FIELD GUARD: the Stocked Quantity input rendered
    await assertElementPresent(page, `//*[@id="quantity"]`, DEFAULT_TIMEOUT);
    // FIELD GUARD: the Unit Price input rendered (REQUIRED — leaving it empty makes Submit a silent no-op)
    await assertElementPresent(page, `//*[@id="unitPrice"]`, DEFAULT_TIMEOUT);
    // Focus Stocked Quantity
    await el(page, `//*[@id="quantity"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Stock a quantity of 1 (kept small — this is permanent)
    await el(page, `//*[@id="quantity"]`).fill(`1`, { timeout: DEFAULT_TIMEOUT });
    // Focus Unit Price
    await el(page, `//*[@id="unitPrice"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Enter a unit price of 1
    await el(page, `//*[@id="unitPrice"]`).fill(`1`, { timeout: DEFAULT_TIMEOUT });
    // Submit the stocking form
    await el(page, `//button[normalize-space(.)="Submit"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Brief wait for the toast
    await wait(page, 2);
    await optional("Stocked toast (optional: transient)", async () => {
      await assertPageContains(page, `Storeroom item stocked`, DEFAULT_TIMEOUT);
    });
    // Wait for the stock mutation to settle
    await wait(page, 5);
    // PROOF: the stocking was accepted — the modal closed, which only happens inside the mutation's update() with no optimisticResponse
    await assertPageLacks(page, `Current Quantity`, DEFAULT_TIMEOUT);
}
