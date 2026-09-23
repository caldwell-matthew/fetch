// Generated from Mobile/dd_tests_mobile/MOB.122_Map_Create_Work.json by to_playwright.py — do not edit by hand yet.
// MOB.122_Map_Create_Work

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob122(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
    // Navigate to the mobile map
    await page.goto(`https://dev.mentorapm.com/apm-mobile/map`);
    // Let the map begin initialising
    await wait(page, 5);
    // The Mapbox canvas rendered
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
    // The geocoder search control rendered
    await assertElementPresent(page, `//input[@placeholder="Search by address"]`, 30000);
    // Focus the geocoder
    await el(page, `//input[@placeholder="Search by address"]`).click({ timeout: 30000 });
    // Search for "1600 Pennsylvania Ave" (>=5 chars, or it never queries)
    await el(page, `//input[@placeholder="Search by address"]`).fill(`1600 Pennsylvania Ave`, { timeout: DEFAULT_TIMEOUT });
    // Wait for the Mapbox geocoding response
    await wait(page, 5);
    // PROOF: the geocoder returned suggestions
    await assertElementPresent(page, `(//ul[contains(concat(" ", normalize-space(@class), " "), " suggestions ")]//li)[1]`, 30000);
    // Pick the first suggestion
    await el(page, `(//ul[contains(concat(" ", normalize-space(@class), " "), " suggestions ")]//li)[1]`).click({ timeout: 30000 });
    // Let the map fly to the result and open its popup
    await wait(page, 6);
    // PROOF: the geocoder popup opened (it shows coordinates)
    await assertPageContains(page, `Latitude`, DEFAULT_TIMEOUT);
    // …and its `Longitude` row (`GeocoderPopup.tsx:33`)
    await assertPageContains(page, `Longitude`, 15000);
    // The popup offers "Add Work"
    await assertElementPresent(page, `//button[contains(normalize-space(.), "Add Work")]`, 30000);
    // Click "Add Work"
    await el(page, `//button[contains(normalize-space(.), "Add Work")]`).click({ timeout: 30000 });
    // Wait for the create modal
    await wait(page, 3);
    // The create modal opened FROM THE MAP
    await assertPageContains(page, `Creating New Work Order`, DEFAULT_TIMEOUT);
    // Focus the Workflow lookup
    await el(page, `//*[@id="workflowTitleId"]`).click({ timeout: 30000 });
    // Search for the Datadog Test workflow
    await el(page, `//*[@id="workflowTitleId"]`).fill(`Datadog Test`, { timeout: DEFAULT_TIMEOUT });
    // Wait for workflow options
    await wait(page, 3);
    // Pick the "Datadog Test" workflow
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Datadog Test")]`).click({ timeout: 30000 });
    // Type the synthetic marker into Problem Description
    await el(page, `//*[@id="problemDesc"]`).fill(`DD SYNTHETIC MOBILE ${RUNID}`, { timeout: DEFAULT_TIMEOUT });
    // Click "Create Work Order"
    await el(page, `//button[normalize-space(.)="Create Work Order"]`).click({ timeout: 30000 });
    // Brief wait for the toast
    await wait(page, 2);
    await optional("Success toast (optional: transient, autoClose 5000)", async () => {
      await assertPageContains(page, `Work order successfully created!`, DEFAULT_TIMEOUT);
    });
    // Wait for the create mutation to resolve
    await wait(page, 5);
    // PROOF: the modal closed inside Apollo's update()
    await assertPageLacks(page, `Creating New Work Order`, DEFAULT_TIMEOUT);
}
