// Generated from legacy/Mobile/dd_tests_mobile/MOB.531_AssetVerify_Asset_Search.json by to_playwright.py — do not edit by hand yet.
// MOB.531_AssetVerify_Asset_Search

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../support/dd';

export async function mob531(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await wait(page, 25);
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
  await run.step("Wait for the job detail to render", {}, async () => {
    await wait(page, 5);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("BASELINE: both fixture assets are listed", {}, async () => {
    await assertFromJavascript(page, `const rows = () => [...document.querySelectorAll('.mantine-Accordion-item')];
return rows().length >= 2;`, 60000);
  });
  await run.step("Focus the search box (\"Tank 0000\")", {}, async () => {
    await click(page, `//input[@placeholder="Find Asset(s)"]`, 30000);
  });
  await run.step("Select any existing term (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type \"Tank 0000\"", {}, async () => {
    await typeText(page, `//input[@placeholder="Find Asset(s)"]`, `Tank 0000`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the filter apply", {}, async () => {
    await wait(page, 3);
  });
  await run.step("POSITIVE: a row for Tank 0000 survives the filter", {}, async () => {
    await assertFromJavascript(page, `const rows = () => [...document.querySelectorAll('.mantine-Accordion-item')];
return rows().some(r => (r.textContent||'').includes('Tank 0000'));`, 30000);
  });
  await run.step("EXCLUSION: the other asset is GONE \u2014 the filter really filters", {}, async () => {
    await assertFromJavascript(page, `const rows = () => [...document.querySelectorAll('.mantine-Accordion-item')];
return rows().length === 1;`, 30000);
  });
  await run.step("Focus the search box (a term nothing can match)", {}, async () => {
    await click(page, `//input[@placeholder="Find Asset(s)"]`, 30000);
  });
  await run.step("Select any existing term (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type a term nothing can match", {}, async () => {
    await typeText(page, `//input[@placeholder="Find Asset(s)"]`, `ZZQQXX-NO-SUCH-THING`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the filter apply", {}, async () => {
    await wait(page, 3);
  });
  await run.step("NEGATIVE: nothing matches, so no asset rows remain", {}, async () => {
    await assertFromJavascript(page, `const rows = () => [...document.querySelectorAll('.mantine-Accordion-item')];
return rows().length === 0;`, 30000);
  });
  await run.step("Focus the search box (to clear it)", {always: true}, async () => {
    await click(page, `//input[@placeholder="Find Asset(s)"]`, 30000);
  });
  await run.step("Select all", {always: true}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Delete \u2014 leave the filter as we found it", {always: true}, async () => {
    await press(page, `Delete`);
  });
  await run.step("Let the list restore", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("RESTORED: both assets are back", {always: true}, async () => {
    await assertFromJavascript(page, `const rows = () => [...document.querySelectorAll('.mantine-Accordion-item')];
return rows().length >= 2;`, 60000);
  });
  run.finish();
}
