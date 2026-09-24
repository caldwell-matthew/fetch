// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.122_Map_Create_Work.json. This file is the source now: edit it directly.
// MOB.122_Map_Create_Work

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertPageContains, assertPageLacks, click, typeText, wait } from '../../support/dd';
import { runId } from '../../support/env';

export async function mob122(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
  const run = new Sequence();
  await run.step("Navigate to the mobile map", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/map`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the map begin initialising", {}, async () => {
    await wait(page, 5);
  });
  await run.step("The Mapbox canvas rendered", {}, async () => {
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
  });
  await run.step("The geocoder search control rendered", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Search by address"]`, 30000);
  });
  await run.step("Focus the geocoder", {}, async () => {
    await click(page, `//input[@placeholder="Search by address"]`, 30000);
  });
  await run.step("Search for \"1600 Pennsylvania Ave\" (>=5 chars, or it never queries)", {}, async () => {
    await typeText(page, `//input[@placeholder="Search by address"]`, `1600 Pennsylvania Ave`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the Mapbox geocoding response", {}, async () => {
    await wait(page, 5);
  });
  await run.step("PROOF: the geocoder returned suggestions", {}, async () => {
    await assertElementPresent(page, `(//ul[contains(concat(" ", normalize-space(@class), " "), " suggestions ")]//li)[1]`, 30000);
  });
  await run.step("Pick the first suggestion", {}, async () => {
    await click(page, `(//ul[contains(concat(" ", normalize-space(@class), " "), " suggestions ")]//li)[1]`, 30000);
  });
  await run.step("Let the map fly to the result and open its popup", {}, async () => {
    await wait(page, 6);
  });
  await run.step("PROOF: the geocoder popup opened (it shows coordinates)", {}, async () => {
    await assertPageContains(page, `Latitude`, DEFAULT_TIMEOUT);
  });
  await run.step("\u2026and its `Longitude` row (`GeocoderPopup.tsx:33`)", {}, async () => {
    await assertPageContains(page, `Longitude`, 15000);
  });
  await run.step("The popup offers \"Add Work\"", {}, async () => {
    await assertElementPresent(page, `//button[contains(normalize-space(.), "Add Work")]`, 30000);
  });
  await run.step("Click \"Add Work\"", {}, async () => {
    await click(page, `//button[contains(normalize-space(.), "Add Work")]`, 30000);
  });
  await run.step("Wait for the create modal", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The create modal opened FROM THE MAP", {}, async () => {
    await assertPageContains(page, `Creating New Work Order`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the Workflow lookup", {}, async () => {
    await click(page, `//*[@id="workflowTitleId"]`, 30000);
  });
  await run.step("Search for the Datadog Test workflow", {}, async () => {
    await typeText(page, `//*[@id="workflowTitleId"]`, `Datadog Test`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for workflow options", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Pick the \"Datadog Test\" workflow", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Datadog Test")]`, 30000);
  });
  await run.step("Type the synthetic marker into Problem Description", {}, async () => {
    await typeText(page, `//*[@id="problemDesc"]`, `DD SYNTHETIC MOBILE ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Click \"Create Work Order\"", {}, async () => {
    await click(page, `//button[normalize-space(.)="Create Work Order"]`, 30000);
  });
  await run.step("Brief wait for the toast", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Success toast (optional: transient, autoClose 5000)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Work order successfully created!`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the create mutation to resolve", {}, async () => {
    await wait(page, 5);
  });
  await run.step("PROOF: the modal closed inside Apollo's update()", {}, async () => {
    await assertPageLacks(page, `Creating New Work Order`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
