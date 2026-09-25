// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.585_AssetVerify_Map_Toggle.json. This file is the source now: edit it directly.
// MOB.585_AssetVerify_Map_Toggle

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';
import { waitForPrefetch } from '../support/prefetch';

export async function mob585(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await waitForPrefetch(page);
  });
  await run.step("Test the job list rendered", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the lookup prefetch finished (feeds schemaQuery)", {}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open \"DATADOG MOBILE JOB\" by clicking its row (not a deep link)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`, 30000);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("BASELINE: the asset list is NOT in map view", {}, async () => {
    await assertFromJavascript(page, `return sessionStorage.getItem('show-mobile-asset-ver-map') === null || sessionStorage.getItem('show-mobile-asset-ver-map') === 'false';`, 30000);
  });
  await run.step("The map toggle is present (permissions.map.read)", {}, async () => {
    await assertElementPresent(page, `//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ") or @data-icon="earth-americas" or contains(concat(" ", normalize-space(@class), " "), " fa-earth-americas ")]]`, 30000);
  });
  await run.step("Switch the asset list to map view", {}, async () => {
    await click(page, `//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ") or @data-icon="earth-americas" or contains(concat(" ", normalize-space(@class), " "), " fa-earth-americas ")]]`, 30000);
  });
  await run.step("Let Mapbox initialise", {}, async () => {
    await wait(page, 6);
  });
  await run.step("PROOF: sessionStorage['show-mobile-asset-ver-map'] is now 'true'", {}, async () => {
    await assertFromJavascript(page, `return sessionStorage.getItem('show-mobile-asset-ver-map') === 'true';`, 30000);
  });
  await run.step("PROOF: the Mapbox WebGL canvas rendered", {}, async () => {
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
  });
  await run.step("PROOF: the asset accordion is gone \u2014 the map replaced it", {}, async () => {
    await assertFromJavascript(page, `return document.querySelectorAll('.mantine-Accordion-item').length === 0;`, 30000);
  });
  await run.step("Switch back to the asset list (restore)", {always: true}, async () => {
    await click(page, `//button[.//*[@data-icon="list" or contains(concat(" ", normalize-space(@class), " "), " fa-list ") or @data-icon="list-ul" or contains(concat(" ", normalize-space(@class), " "), " fa-list-ul ")]]`, 30000);
  });
  await run.step("Let the accordion re-render", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("RESTORED: sessionStorage['show-mobile-asset-ver-map'] is back to 'false'", {always: true}, async () => {
    await assertFromJavascript(page, `return sessionStorage.getItem('show-mobile-asset-ver-map') === 'false';`, 30000);
  });
  await run.step("RESTORED: the asset rows are listed again", {always: true}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  run.finish();
}
