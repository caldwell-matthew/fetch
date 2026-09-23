// Generated from Mobile/dd_tests_mobile/MOB.531_AssetVerify_Asset_Search.json by to_playwright.py — do not edit by hand yet.
// MOB.531_AssetVerify_Asset_Search

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob531(page: Page): Promise<void> {
  try {
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Let the page begin rendering
    await wait(page, 3);
    // Test the "Mobile Jobs" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
    // Wait for the lookup prefetch and batched detail downloads
    await wait(page, 25);
    // Test the job list rendered
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
    // Test the lookup prefetch finished (feeds schemaQuery)
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
    // Test the batched job-detail downloads finished
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    // FIXTURE GUARD: "DATADOG MOBILE JOB" is in this crew's list
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open "DATADOG MOBILE JOB" by clicking its row (not a deep link)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`).click({ timeout: 30000 });
    // Wait for the job detail to render
    await wait(page, 5);
    // ASSET LIST GUARD: the job's asset rows have rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
    // BASELINE: both fixture assets are listed
    await assertFromJavascript(page, `const rows = () => [...document.querySelectorAll('.mantine-Accordion-item')];
return rows().length >= 2;`, 60000);
    // Focus the search box ("Tank 0000")
    await el(page, `//input[@placeholder="Find Asset(s)"]`).click({ timeout: 30000 });
    // Select any existing term (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Type "Tank 0000"
    await el(page, `//input[@placeholder="Find Asset(s)"]`).fill(`Tank 0000`, { timeout: DEFAULT_TIMEOUT });
    // Let the filter apply
    await wait(page, 3);
    // POSITIVE: a row for Tank 0000 survives the filter
    await assertFromJavascript(page, `const rows = () => [...document.querySelectorAll('.mantine-Accordion-item')];
return rows().some(r => (r.textContent||'').includes('Tank 0000'));`, 30000);
    // EXCLUSION: the other asset is GONE — the filter really filters
    await assertFromJavascript(page, `const rows = () => [...document.querySelectorAll('.mantine-Accordion-item')];
return rows().length === 1;`, 30000);
    // Focus the search box (a term nothing can match)
    await el(page, `//input[@placeholder="Find Asset(s)"]`).click({ timeout: 30000 });
    // Select any existing term (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Type a term nothing can match
    await el(page, `//input[@placeholder="Find Asset(s)"]`).fill(`ZZQQXX-NO-SUCH-THING`, { timeout: DEFAULT_TIMEOUT });
    // Let the filter apply
    await wait(page, 3);
    // NEGATIVE: nothing matches, so no asset rows remain
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
    // RESTORED: both assets are back
    await assertFromJavascript(page, `const rows = () => [...document.querySelectorAll('.mantine-Accordion-item')];
return rows().length >= 2;`, 60000);
  }
}
