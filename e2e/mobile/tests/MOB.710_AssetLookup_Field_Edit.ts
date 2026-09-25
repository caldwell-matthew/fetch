// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.710_AssetLookup_Field_Edit.json. This file is the source now: edit it directly.
// MOB.710_AssetLookup_Field_Edit

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, click, press, typeText, wait } from '../../support/dd';
import { runId } from '../../support/env';

export async function mob710(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
  const run = new Sequence();
  await run.step("Navigate to asset lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Select any existing search term (typeText APPENDS without this)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for Pump 0102", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter - there is no search button)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Test Pump 0102 is in the results", {}, async () => {
    await assertPageContains(page, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Expand the first result", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the Description edit form (leg 1)", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//tr[.//b[normalize-space(.)="Description"]]//button[.//*[@data-icon="pen-to-square" or contains(concat(" ", normalize-space(@class), " "), " fa-pen-to-square ")]]`, DEFAULT_TIMEOUT);
  });
  await run.step("The edit modal opened on the Description field", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@id="desc"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the Description field", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@id="desc"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Select the existing text (typeText APPENDS without this)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type the Description value", {}, async () => {
    await typeText(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@id="desc"]`, `DD SYNTHETIC EDIT ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the edit", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[normalize-space(.)="Submit" or normalize-space(.)="Update Asset"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Brief wait for the toast to appear", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Description updated toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `updated`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the update mutation", {}, async () => {
    await wait(page, 5);
  });
  await run.step("Navigate to asset lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Select any existing search term (typeText APPENDS without this)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for Pump 0102", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter - there is no search button)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Test Pump 0102 is in the results", {}, async () => {
    await assertPageContains(page, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Expand the first result", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the detail panel to mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF: after a reload the description is no longer the baseline", {}, async () => {
    await assertFromJavascript(page, `const row = [...document.querySelectorAll('tr')].find(t => {
  const b = t.querySelector('b');
  return b && b.textContent.trim() === 'Description';
});
if (!row || row.cells.length < 2) return false;
return row.cells[1].textContent.trim() !== 'DATADOG FIXTURE';`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the Description edit form (restore)", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//tr[.//b[normalize-space(.)="Description"]]//button[.//*[@data-icon="pen-to-square" or contains(concat(" ", normalize-space(@class), " "), " fa-pen-to-square ")]]`, DEFAULT_TIMEOUT);
  });
  await run.step("The edit modal opened on the Description field", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@id="desc"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the Description field", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@id="desc"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Select the existing text (typeText APPENDS without this)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type the Description value", {}, async () => {
    await typeText(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@id="desc"]`, `DATADOG FIXTURE`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the edit", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[normalize-space(.)="Submit" or normalize-space(.)="Update Asset"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Brief wait for the toast to appear", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Description updated toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `updated`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the update mutation", {}, async () => {
    await wait(page, 5);
  });
  await run.step("Navigate to asset lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Select any existing search term (typeText APPENDS without this)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for Pump 0102", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter - there is no search button)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Test Pump 0102 is in the results", {}, async () => {
    await assertPageContains(page, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Expand the first result", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the detail panel to mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("RESTORED: the description cell reads exactly \"DATADOG FIXTURE\"", {}, async () => {
    await assertFromJavascript(page, `const row = [...document.querySelectorAll('tr')].find(t => {
  const b = t.querySelector('b');
  return b && b.textContent.trim() === 'Description';
});
if (!row || row.cells.length < 2) return false;
return row.cells[1].textContent.trim() === 'DATADOG FIXTURE';`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
