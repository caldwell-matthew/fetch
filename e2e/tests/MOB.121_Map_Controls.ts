// Generated from Mobile/dd_tests_mobile/MOB.121_Map_Controls.json by to_playwright.py — do not edit by hand yet.
// MOB.121_Map_Controls

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, el, wait } from '../support/dd';

export async function mob121(page: Page): Promise<void> {
  try {
    // Navigate to the mobile map
    await page.goto(`https://dev.mentorapm.com/apm-mobile/map`);
    // Let the map begin initialising
    await wait(page, 5);
    // Test the "Map" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Map")]`, `Map`, 30000);
    // PROOF: the Mapbox WebGL canvas rendered
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
    // The style control offers "Satellite"
    await assertElementPresent(page, `//button[@data-tooltip-content="Satellite"]`, 30000);
    // Switch the basemap to Satellite
    await el(page, `//button[@data-tooltip-content="Satellite"]`).click({ timeout: 30000 });
    // Let the style load
    await wait(page, 6);
    // PROOF: the style changed — the control now offers "Street"
    await assertElementPresent(page, `//button[@data-tooltip-content="Street"]`, 30000);
    // The layers control is headed `Layers` (`Map/Layers/layersList.tsx:116`)
    await assertElementContent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " layers-title ")]//h4`, `Layers`, 30000);
    // Open the Layers panel
    await el(page, `//div[contains(concat(" ", normalize-space(@class), " "), " layers-title ")]`).click({ timeout: 30000 });
    // Wait for the layers modal
    await wait(page, 3);
    // PROOF: the Layers modal opened
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]`, 30000);
    // The zoom controls render
    await assertElementPresent(page, `//button[contains(@class,"mapboxgl-ctrl-zoom-in")]`, 30000);
    // Zoom in
    await el(page, `//button[contains(@class,"mapboxgl-ctrl-zoom-in")]`).click({ timeout: 30000 });
    // Let the zoom animate
    await wait(page, 3);
    // Zoom out
    await el(page, `//button[contains(@class,"mapboxgl-ctrl-zoom-out")]`).click({ timeout: 30000 });
    // Let the zoom animate
    await wait(page, 3);
    // The map survived zooming (LIMIT: the zoom level is not exposed to the DOM)
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Switch back to Street
    await el(page, `//button[@data-tooltip-content="Street"]`).click({ timeout: 30000 });
    // Let the style load
    await wait(page, 6);
    // RESTORED: the control offers "Satellite" again
    await assertElementPresent(page, `//button[@data-tooltip-content="Satellite"]`, 30000);
    // Close the layers modal
    await page.keyboard.press(`Escape`);
    // Wait for it to close
    await wait(page, 2);
  }
}
