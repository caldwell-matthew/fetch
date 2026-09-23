// Generated from Mobile/dd_tests_mobile/MOB.585_AssetVerify_Map_Toggle.json by to_playwright.py — do not edit by hand yet.
// MOB.585_AssetVerify_Map_Toggle

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob585(page: Page): Promise<void> {
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
    // BASELINE: the asset list is NOT in map view
    await assertFromJavascript(page, `return sessionStorage.getItem('show-mobile-asset-ver-map') === null || sessionStorage.getItem('show-mobile-asset-ver-map') === 'false';`, 30000);
    // The map toggle is present (permissions.map.read)
    await assertElementPresent(page, `//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ") or @data-icon="earth-americas" or contains(concat(" ", normalize-space(@class), " "), " fa-earth-americas ")]]`, 30000);
    // Switch the asset list to map view
    await el(page, `//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ") or @data-icon="earth-americas" or contains(concat(" ", normalize-space(@class), " "), " fa-earth-americas ")]]`).click({ timeout: 30000 });
    // Let Mapbox initialise
    await wait(page, 6);
    // PROOF: sessionStorage['show-mobile-asset-ver-map'] is now 'true'
    await assertFromJavascript(page, `return sessionStorage.getItem('show-mobile-asset-ver-map') === 'true';`, 30000);
    // PROOF: the Mapbox WebGL canvas rendered
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
    // PROOF: the asset accordion is gone — the map replaced it
    await assertFromJavascript(page, `return document.querySelectorAll('.mantine-Accordion-item').length === 0;`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Switch back to the asset list (restore)
    await el(page, `//button[.//*[@data-icon="list" or contains(concat(" ", normalize-space(@class), " "), " fa-list ") or @data-icon="list-ul" or contains(concat(" ", normalize-space(@class), " "), " fa-list-ul ")]]`).click({ timeout: 30000 });
    // Let the accordion re-render
    await wait(page, 4);
    // RESTORED: sessionStorage['show-mobile-asset-ver-map'] is back to 'false'
    await assertFromJavascript(page, `return sessionStorage.getItem('show-mobile-asset-ver-map') === 'false';`, 30000);
    // RESTORED: the asset rows are listed again
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  }
}
