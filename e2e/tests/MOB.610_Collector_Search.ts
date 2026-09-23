// Generated from Mobile/dd_tests_mobile/MOB.610_Collector_Search.json by to_playwright.py — do not edit by hand yet.
// MOB.610_Collector_Search

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, wait } from '../support/dd';

export async function mob610(page: Page): Promise<void> {
  try {
    // Navigate to the collector
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`);
    // Let the page mount
    await wait(page, 3);
    // The Collector page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Collector")]`, `Collector`, 60000);
    // Its search box renders
    await assertElementPresent(page, `//input[@placeholder="Find Asset(s)"]`, 30000);
    // BASELINE GUARD: the collected list has rows to filter
    await assertFromJavascript(page, `const rows = () => [...document.querySelectorAll('.mantine-Accordion-item')];
return rows().length >= 1;`, 60000);
    // Focus the search box (a term nothing can match)
    await el(page, `//input[@placeholder="Find Asset(s)"]`).click({ timeout: 30000 });
    // Select any existing term (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Type a term nothing can match
    await el(page, `//input[@placeholder="Find Asset(s)"]`).fill(`ZZQQXX-NO-SUCH-THING`, { timeout: DEFAULT_TIMEOUT });
    // Let the filter apply
    await wait(page, 3);
    // NEGATIVE: the filter drives the row count to ZERO
    await assertFromJavascript(page, `const rows = () => [...document.querySelectorAll('.mantine-Accordion-item')];
return rows().length === 0;`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Focus the search box (to clear it)
    await el(page, `//input[@placeholder="Find Asset(s)"]`).click({ timeout: 30000 });
    // Select all
    await page.keyboard.press(`Control+a`);
    // Delete — leave the filter as we found it
    await page.keyboard.press(`Delete`);
    // Let the list restore
    await wait(page, 3);
    // RESTORED: clearing brings the rows back
    await assertFromJavascript(page, `const rows = () => [...document.querySelectorAll('.mantine-Accordion-item')];
return rows().length >= 1;`, 60000);
  }
}
