// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.870_MaterialLookup_Stocking.json. This file is the source now: edit it directly.
// MOB.870_MaterialLookup_Stocking

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, click, typeText, wait } from '../../support/dd';

export async function mob870(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to material lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/material-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the page to mount", {}, async () => {
    await wait(page, 6);
  });
  await run.step("Test the \"Material Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]`, `Material Lookup`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the storeroom dropdown", {}, async () => {
    await click(page, `//*[@id="storeroomLocationId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for storeroom options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick Central Storeroom", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Central Storeroom")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the material list to load", {}, async () => {
    await wait(page, 8);
  });
  await run.step("Focus the material search", {}, async () => {
    await click(page, `//input[@placeholder="Search for material items by name"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Search for Adamantium", {}, async () => {
    await typeText(page, `//input[@placeholder="Search for material items by name"]`, `Adamantium`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the search debounce", {}, async () => {
    await wait(page, 4);
  });
  await run.step("The fixture item is listed", {}, async () => {
    await assertPageContains(page, `000-000-000 Adamantium`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the stock modal for 000-000-000 Adamantium", {}, async () => {
    await click(page, `//tr[contains(normalize-space(.), "000-000-000 Adamantium")]//button[.//*[@data-icon="arrow-up-right-from-square" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-up-right-from-square ")]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the modal", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The modal opened on the adjustment tab", {}, async () => {
    await assertPageContains(page, `Current Quantity`, DEFAULT_TIMEOUT);
  });
  await run.step("Switch to the \"Stock Item\" tab", {}, async () => {
    await click(page, `//label[normalize-space(.)="Stock Item"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the stocking form", {}, async () => {
    await wait(page, 2);
  });
  await run.step("FIELD GUARD: the Stocked Quantity input rendered", {}, async () => {
    await assertElementPresent(page, `//*[@id="quantity"]`, DEFAULT_TIMEOUT);
  });
  await run.step("FIELD GUARD: the Unit Price input rendered (REQUIRED \u2014 leaving it empty makes Submit a silent no-op)", {}, async () => {
    await assertElementPresent(page, `//*[@id="unitPrice"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus Stocked Quantity", {}, async () => {
    await click(page, `//*[@id="quantity"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Stock a quantity of 1 (kept small \u2014 this is permanent)", {}, async () => {
    await typeText(page, `//*[@id="quantity"]`, `1`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus Unit Price", {}, async () => {
    await click(page, `//*[@id="unitPrice"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Enter a unit price of 1", {}, async () => {
    await typeText(page, `//*[@id="unitPrice"]`, `1`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the stocking form", {}, async () => {
    await click(page, `//button[normalize-space(.)="Submit"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Brief wait for the toast", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Stocked toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Storeroom item stocked`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the stock mutation to settle", {}, async () => {
    await wait(page, 5);
  });
  await run.step("PROOF: the stocking was accepted \u2014 the modal closed, which only happens inside the mutation's update() with no optimisticResponse", {}, async () => {
    await assertPageLacks(page, `Current Quantity`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
