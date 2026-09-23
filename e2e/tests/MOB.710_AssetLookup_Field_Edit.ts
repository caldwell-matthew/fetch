// Generated from Mobile/dd_tests_mobile/MOB.710_AssetLookup_Field_Edit.json by to_playwright.py — do not edit by hand yet.
// MOB.710_AssetLookup_Field_Edit

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, assertFromJavascript, assertPageContains, el, optional, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob710(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for the page to mount
    await wait(page, 5);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Select any existing search term (typeText APPENDS without this)
    await page.keyboard.press(`Control+a`);
    // Search for Pump 0102
    await el(page, `//input[@name="asset-search"]`).fill(`Pump 0102`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter - there is no search button)
    await page.keyboard.press(`Enter`);
    // Wait for the search results
    await wait(page, 8);
    // Test Pump 0102 is in the results
    await assertPageContains(page, `Pump 0102`, DEFAULT_TIMEOUT);
    // Expand the first result
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the detail panel to mount
    await wait(page, 3);
    // Open the Description edit form (leg 1)
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//tr[.//b[normalize-space(.)="Description"]]//button[.//*[@data-icon="pen-to-square" or contains(concat(" ", normalize-space(@class), " "), " fa-pen-to-square ")]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the edit modal
    await wait(page, 2);
    // The edit modal opened on the Description field
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@id="desc"]`, DEFAULT_TIMEOUT);
    // Focus the Description field
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@id="desc"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Select the existing text (typeText APPENDS without this)
    await page.keyboard.press(`Control+a`);
    // Type the Description value
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@id="desc"]`).fill(`DD SYNTHETIC EDIT ${RUNID}`, { timeout: DEFAULT_TIMEOUT });
    // Submit the edit
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[normalize-space(.)="Submit" or normalize-space(.)="Update Asset"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Brief wait for the toast to appear
    await wait(page, 2);
    await optional("Description updated toast (optional: transient)", async () => {
      await assertPageContains(page, `updated`, DEFAULT_TIMEOUT);
    });
    // Wait for the update mutation
    await wait(page, 5);
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for the page to mount
    await wait(page, 5);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Select any existing search term (typeText APPENDS without this)
    await page.keyboard.press(`Control+a`);
    // Search for Pump 0102
    await el(page, `//input[@name="asset-search"]`).fill(`Pump 0102`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter - there is no search button)
    await page.keyboard.press(`Enter`);
    // Wait for the search results
    await wait(page, 8);
    // Test Pump 0102 is in the results
    await assertPageContains(page, `Pump 0102`, DEFAULT_TIMEOUT);
    // Expand the first result
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the detail panel to mount
    await wait(page, 3);
    // PROOF: after a reload the description is no longer the baseline
    await assertFromJavascript(page, `const row = [...document.querySelectorAll('tr')].find(t => {
  const b = t.querySelector('b');
  return b && b.textContent.trim() === 'Description';
});
if (!row || row.cells.length < 2) return false;
return row.cells[1].textContent.trim() !== 'DATADOG FIXTURE';`, DEFAULT_TIMEOUT);
    // Open the Description edit form (restore)
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//tr[.//b[normalize-space(.)="Description"]]//button[.//*[@data-icon="pen-to-square" or contains(concat(" ", normalize-space(@class), " "), " fa-pen-to-square ")]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the edit modal
    await wait(page, 2);
    // The edit modal opened on the Description field
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@id="desc"]`, DEFAULT_TIMEOUT);
    // Focus the Description field
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@id="desc"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Select the existing text (typeText APPENDS without this)
    await page.keyboard.press(`Control+a`);
    // Type the Description value
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@id="desc"]`).fill(`DATADOG FIXTURE`, { timeout: DEFAULT_TIMEOUT });
    // Submit the edit
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[normalize-space(.)="Submit" or normalize-space(.)="Update Asset"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Brief wait for the toast to appear
    await wait(page, 2);
    await optional("Description updated toast (optional: transient)", async () => {
      await assertPageContains(page, `updated`, DEFAULT_TIMEOUT);
    });
    // Wait for the update mutation
    await wait(page, 5);
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for the page to mount
    await wait(page, 5);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Select any existing search term (typeText APPENDS without this)
    await page.keyboard.press(`Control+a`);
    // Search for Pump 0102
    await el(page, `//input[@name="asset-search"]`).fill(`Pump 0102`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter - there is no search button)
    await page.keyboard.press(`Enter`);
    // Wait for the search results
    await wait(page, 8);
    // Test Pump 0102 is in the results
    await assertPageContains(page, `Pump 0102`, DEFAULT_TIMEOUT);
    // Expand the first result
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the detail panel to mount
    await wait(page, 3);
    // RESTORED: the description cell reads exactly "DATADOG FIXTURE"
    await assertFromJavascript(page, `const row = [...document.querySelectorAll('tr')].find(t => {
  const b = t.querySelector('b');
  return b && b.textContent.trim() === 'Description';
});
if (!row || row.cells.length < 2) return false;
return row.cells[1].textContent.trim() === 'DATADOG FIXTURE';`, DEFAULT_TIMEOUT);
}
