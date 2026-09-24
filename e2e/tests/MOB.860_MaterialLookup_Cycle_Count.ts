// Generated from legacy/Mobile/dd_tests_mobile/MOB.860_MaterialLookup_Cycle_Count.json by to_playwright.py — do not edit by hand yet.
// MOB.860_MaterialLookup_Cycle_Count

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertFromJavascript, assertPageContains, assertPageLacks, click, typeText, wait } from '../support/dd';

export async function mob860(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to material lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/material-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the page to mount", {}, async () => {
    await wait(page, 6);
  });
  await run.step("READY: the material list has loaded \u2014 an `N matches` line shows and no loading overlay covers the page", {}, async () => {
    await assertFromJavascript(page, `const overlay = document.querySelectorAll('.mantine-LoadingOverlay-overlay').length > 0;
const counted = [...document.querySelectorAll('p, div, span')]
  .some(e => e.children.length === 0 && /^\\d[\\d,]* matches$/.test((e.textContent || '').trim()));
return counted && !overlay;`, 60000);
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
  await run.step("Open the stock adjustment for 000-000-000 Adamantium", {}, async () => {
    await click(page, `//tr[contains(normalize-space(.), "000-000-000 Adamantium")]//button[.//*[@data-icon="arrow-up-right-from-square" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-up-right-from-square ")]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the stock adjustment modal", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The adjustment modal opened", {}, async () => {
    await assertPageContains(page, `Current Quantity`, DEFAULT_TIMEOUT);
  });
  await run.step("Enter the +1 adjustment", {}, async () => {
    await typeText(page, `//*[@id="adjustment"]`, `1`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the reason lookup", {}, async () => {
    await click(page, `//*[@id="reason"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for reason options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick reason \"Error Correction\"", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Error Correction")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the adjustment", {}, async () => {
    await click(page, `//button[normalize-space(.)="Submit"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the adjust mutation", {}, async () => {
    await wait(page, 5);
  });
  await run.step("PROOF: the +1 adjustment was accepted (modal closed)", {}, async () => {
    await assertPageLacks(page, `Current Quantity`, DEFAULT_TIMEOUT);
  });
  await run.step("Adjustment toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Storeroom item quantity adjusted`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the stock adjustment for 000-000-000 Adamantium", {}, async () => {
    await click(page, `//tr[contains(normalize-space(.), "000-000-000 Adamantium")]//button[.//*[@data-icon="arrow-up-right-from-square" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-up-right-from-square ")]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the stock adjustment modal", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The adjustment modal opened", {}, async () => {
    await assertPageContains(page, `Current Quantity`, DEFAULT_TIMEOUT);
  });
  await run.step("Enter the -1 (restore) adjustment", {}, async () => {
    await typeText(page, `//*[@id="adjustment"]`, `-1`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the reason lookup", {}, async () => {
    await click(page, `//*[@id="reason"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for reason options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick reason \"Error Correction\"", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Error Correction")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the adjustment", {}, async () => {
    await click(page, `//button[normalize-space(.)="Submit"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the adjust mutation", {}, async () => {
    await wait(page, 5);
  });
  await run.step("PROOF: the -1 (restore) adjustment was accepted (modal closed)", {}, async () => {
    await assertPageLacks(page, `Current Quantity`, DEFAULT_TIMEOUT);
  });
  await run.step("Adjustment toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Storeroom item quantity adjusted`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
