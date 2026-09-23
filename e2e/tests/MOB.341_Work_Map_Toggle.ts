// Generated from Mobile/dd_tests_mobile/MOB.341_Work_Map_Toggle.json by to_playwright.py — do not edit by hand yet.
// MOB.341_Work_Map_Toggle

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageLacks, el, wait } from '../support/dd';

export async function mob341(page: Page): Promise<void> {
  try {
    // Navigate to /work — the work order list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Wait for the workstage pages and the lookup prefetch
    await wait(page, 20);
    // The work list rendered its search box
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
    // LOADEDALL 1/3: the initial fetch finished
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
    // LOADEDALL 2/3: paging through workstages finished
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
    // LOADEDALL 3/3: the per-stage detail downloads finished
    await assertPageLacks(page, `workstages downloaded`, 180000);
    // BASELINE: the list is NOT in map view
    await assertFromJavascript(page, `return sessionStorage.getItem('show-mobile-work-map') === null || sessionStorage.getItem('show-mobile-work-map') === 'false';`, 30000);
    // BASELINE: the list container is showing and no map canvas exists yet
    await assertFromJavascript(page, `const list = document.querySelector('[data-virtuoso-scroller], [data-testid*="virtuoso"]');
return !!list && !document.querySelector('canvas.mapboxgl-canvas');`, 30000);
    // The map toggle is present (permissions.map.read)
    await assertElementPresent(page, `//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ") or @data-icon="earth-americas" or contains(concat(" ", normalize-space(@class), " "), " fa-earth-americas ")]]`, 30000);
    // Switch the work list to map view
    await el(page, `//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ") or @data-icon="earth-americas" or contains(concat(" ", normalize-space(@class), " "), " fa-earth-americas ")]]`).click({ timeout: 30000 });
    // Let Mapbox initialise
    await wait(page, 6);
    // PROOF: sessionStorage['show-mobile-work-map'] is now 'true'
    await assertFromJavascript(page, `return sessionStorage.getItem('show-mobile-work-map') === 'true';`, 30000);
    // PROOF: the Mapbox WebGL canvas rendered on /work
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
    // PROOF: the LIST container is gone — the map replaced it, it did not stack
    await assertFromJavascript(page, `return !document.querySelector('[data-virtuoso-scroller], [data-testid*="virtuoso"]');`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Switch back to the list view (restore)
    await el(page, `//button[.//*[@data-icon="list" or contains(concat(" ", normalize-space(@class), " "), " fa-list ") or @data-icon="list-ul" or contains(concat(" ", normalize-space(@class), " "), " fa-list-ul ")]]`).click({ timeout: 30000 });
    // Let the list re-render
    await wait(page, 4);
    // RESTORED: sessionStorage['show-mobile-work-map'] is back to 'false'
    await assertFromJavascript(page, `return sessionStorage.getItem('show-mobile-work-map') === 'false';`, 30000);
    // RESTORED: the list container is back and the map canvas is gone
    await assertFromJavascript(page, `const list = document.querySelector('[data-virtuoso-scroller], [data-testid*="virtuoso"]');
const canvas = document.querySelector('canvas.mapboxgl-canvas');
return !!list && !canvas;`, 60000);
  }
}
