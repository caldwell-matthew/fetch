// Generated from Mobile/dd_tests_mobile/MOB.720_AssetLookup_Event_Readings.json by to_playwright.py — do not edit by hand yet.
// MOB.720_AssetLookup_Event_Readings

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';

export async function mob720(page: Page): Promise<void> {
  try {
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for the page to mount
    await wait(page, 3);
    // Test the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: 30000 });
    // Select any persisted query first (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Search for Pump 0102
    await el(page, `//input[@name="asset-search"]`).fill(`Pump 0102`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter — there is no search button)
    await page.keyboard.press(`Enter`);
    // Wait for the search results
    await wait(page, 5);
    // RESULT GUARD: a result row for Pump 0102 rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1][contains(., "Pump 0102")]`, 60000);
    // Expand the first result
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`).click({ timeout: 30000 });
    // Wait for the detail panel to mount
    await wait(page, 3);
    // The "Readings" tab exists — the SIXTH tab
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Readings"]`, 60000);
    // The expanded result's tab strip has SIX tabs
    await assertFromJavascript(page, `const it = document.querySelector('.mantine-Accordion-item');
if (!it) return false;
return it.querySelectorAll('[role=tab]').length === 6;`, 30000);
    // Open the "Readings" tab
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Readings"]`).click({ timeout: 30000 });
    // Let the readings panel mount
    await wait(page, 3);
    // The "Readings" tab is now the active one
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Readings"][@data-active="true"]`, 30000);
    // The asset-scoped readings FORM mounted
    await assertElementPresent(page, `//form[starts-with(@id, "asset-lookup-readings-")]`, 60000);
    // EXACTLY ONE of: a 'recorded recently' progress row, or the empty state
    await assertFromJavascript(page, `const f = document.querySelector('form[id^="asset-lookup-readings-"]');
if (!f) return false;
const panel = f.closest('[role=tabpanel]') || f.parentElement;
const txt = (panel.textContent || '');
const hasProgress = /recorded recently \\(in 24h\\)/.test(txt);
const hasEmpty = /No readings recorded for this asset\\./.test(txt);
return hasProgress !== hasEmpty;`, 30000);
    // The "Add reading types" control renders
    await assertElementPresent(page, `//button[@aria-label="Add reading types"]`, 30000);
    // Open the Add Reading Types modal
    await el(page, `//button[@aria-label="Add reading types"]`).click({ timeout: 30000 });
    // Let the modal open
    await wait(page, 2);
    // The modal's title rendered
    await assertPageContains(page, `Add Reading Types`, 30000);
    // Its reading-type search box rendered
    await assertElementPresent(page, `//input[@placeholder="Search reading types"]`, 30000);
    // The "Add" button is DISABLED while nothing is selected
    await assertFromJavascript(page, `const bs = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Add');
if (!bs.length) return false;
return bs.every(b => b.disabled);`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    await optional("Try Escape first (optional \u2014 measured not to close this modal)", async () => {
      await page.keyboard.press(`Escape`);
    });
    // Let the modal react
    await wait(page, 1);
    await optional("Dismiss by clicking the overlay (closeOnClickOutside)", async () => {
      await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-overlay ")]`).click({ timeout: 15000 });
    });
    // Let the modal close
    await wait(page, 2);
    // The modal is gone — nothing was added
    await assertPageLacks(page, `Add Reading Types`, 30000);
  }
}
