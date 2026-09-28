// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.600_Collector_Create_Asset.json. This file is the source now: edit it directly.
// MOB.600_Collector_Create_Asset
//
// Collects an asset WITHOUT a photo, and proves the server has it. A photo attached in the collector goes up through
// the native shell's `UPLOAD_THUMBNAILS` bridge (`AssetCollector/utils/createAsset.ts`, `graphql/links/UploadLink.ts`);
// in a browser there is no shell, the bridge never answers, and the collect is never sent — a harness limit, not a
// mobile bug (the app runs only in the native shell on phones; owner, 2026-09-28). Photos on a SAVED asset go up by
// tus in a browser too, and MOB.623 / MOB.627 / MOB.933–936 cover them.

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../../support/dd';
import { runId } from '../../support/env';

export async function mob600(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
  const run = new Sequence();
  await run.step("Navigate to the asset collector", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the collector page rendered", {}, async () => {
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the new-asset form (affixed + button)", {}, async () => {
    await click(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`, DEFAULT_TIMEOUT);
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
  await run.step("Pick Actuator Tools", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Actuator Tools")]`, DEFAULT_TIMEOUT);
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
  await run.step("PROOF OF CREATION: this run's asset is in the collected list", {}, async () => {
    await assertPageContains(page, `DD SYNTHETIC MOBILE ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the 'Asset collected' toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Asset collected`, DEFAULT_TIMEOUT);
  });
  await run.step("SERVER PROOF: navigate to Asset Lookup (its search is a network-only query)", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
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
  await run.step("\u2b50 SERVER PROOF: the asset comes back from the SERVER \u2014 a result row carries this run's name (the collected list's row is client-prepended and proves nothing)", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")])[1][contains(., "DD SYNTHETIC MOBILE ${RUNID}")]`, 30000);
  });
  run.finish();
}
