// Generated from legacy/Mobile/dd_tests_mobile/MOB.600_Collector_Create_Asset.json by to_playwright.py — do not edit by hand yet.
// MOB.600_Collector_Create_Asset
//
// ⛔ THIS TEST CANNOT RUN OUTSIDE DATADOG. Steps below were recorded without an xpath, so only
//    Datadog's own multiLocator can find their element. Its suite marks it `fixme`, so it is
//    reported as skipped and never as a pass:
//      - Open the photo picker ("Add Asset Photo"): step has no xpath locator

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, uploadStandIn, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob600(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
  const run = new Sequence();
  await run.step("Navigate to the asset collector", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the collector to load its lookup cache", {}, async () => {
    await wait(page, 15);
  });
  await run.step("Test the collector page rendered", {}, async () => {
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the new-asset form (affixed + button)", {}, async () => {
    await click(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the form to mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the new-asset form opened", {}, async () => {
    await assertElementPresent(page, `//button[@form="asset-collector"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Enter the asset name", {}, async () => {
    await typeText(page, `//*[@id="name"]`, `DD SYNTHETIC MOBILE ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Enter the asset description", {}, async () => {
    await typeText(page, `//*[@id="desc"]`, `Created by Datadog Synthetics - safe to delete`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the asset type lookup", {}, async () => {
    await click(page, `//*[@id="typeId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for asset type options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick Actuator Tools", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Actuator Tools")]`, DEFAULT_TIMEOUT);
  });
  // ⛔ NOT PORTABLE — Open the photo picker ("Add Asset Photo"): step has no xpath locator
  await run.step("Reveal the hidden gallery file input (useFileDialog appends it to <body>)", {}, async () => {
    await assertFromJavascript(page, `const inputs = [...document.querySelectorAll('input[type="file"]')];
const el = inputs.find(i => !i.capture);
if (!el) return false;
el.setAttribute('data-dd-upload', '1');
Object.assign(el.style, {
  display: 'block', opacity: '1', position: 'fixed',
  top: '0', left: '0', width: '240px', height: '40px', zIndex: '99999'
});
return true;
`, DEFAULT_TIMEOUT);
  });
  await run.step("Upload file", {}, async () => {
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
  });
  await run.step("\u2b50 The photo-source modal closed ITSELF once the file arrived \u2014 `onDialogChange` calls `close()` (2026-09). Nothing clicks an X: closing early unmounted the component and destroyed the very <input> the upload needs", {}, async () => {
    await assertPageLacks(page, `Select Photo Source`, 30000);
  });
  await run.step("Wait for the modal to close", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Submit the new asset", {}, async () => {
    await click(page, `//button[@form="asset-collector"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the collect mutation", {}, async () => {
    await wait(page, 5);
  });
  await run.step("Test the form closed (durable success signal)", {}, async () => {
    await assertPageLacks(page, `Create Asset`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the form closed (affixed + button is back)", {}, async () => {
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the collected list to refresh", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF OF CREATION: this run's asset is in the collected list", {}, async () => {
    await assertPageContains(page, `DD SYNTHETIC MOBILE ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the 'Asset collected' toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Asset collected`, DEFAULT_TIMEOUT);
  });
  await run.step("SERVER PROOF: navigate to Asset Lookup (its search is a network-only query)", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the page to mount", {}, async () => {
    await wait(page, 5);
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, 30000);
  });
  await run.step("Select any persisted query first (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for this run's asset by its exact name", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `DD SYNTHETIC MOBILE ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter \u2014 there is no search button)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Wait for the search results", {}, async () => {
    await wait(page, 5);
  });
  await run.step("\u2b50 SERVER PROOF: the asset comes back from the SERVER \u2014 a result row carries this run's name (bugs \u00a734: the collected list's row is client-prepended and proves nothing)", {allow: 'soft'}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")])[1][contains(., "DD SYNTHETIC MOBILE ${RUNID}")]`, 30000);
  });
  run.finish();
}
