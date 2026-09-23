// Generated from Mobile/dd_tests_mobile/MOB.570_AssetVerify_Asset_Cycling.json by to_playwright.py — do not edit by hand yet.
// MOB.570_AssetVerify_Asset_Cycling

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../support/dd';

export async function mob570(page: Page): Promise<void> {
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
  await run.step("Open Tank 0000's full-page detail", {}, async () => {
    await click(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`, 30000);
  });
  await run.step("Let the asset detail begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The full-page asset detail rendered", {}, async () => {
    await assertPageContains(page, `Asset Type:`, 30000);
  });
  await run.step("The cycling arrows next to Tank 0000 are rendered", {}, async () => {
    await assertElementPresent(page, `//button[.//*[@data-icon="circle-arrow-right" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-right ")]][parent::*[contains(., "Tank 0000")]]`, 30000);
  });
  await run.step("BASELINE: the cycler shows \"Tank 0000\"", {}, async () => {
    await assertFromJavascript(page, `const groups = [...document.querySelectorAll('button')]
  .filter(b => b.querySelector('[data-icon="circle-arrow-right"]'))
  .map(b => b.parentElement).filter(Boolean);
if (!groups.length) return false;
return groups.some(g => (g.textContent || '').indexOf('Tank 0000') !== -1);`, 30000);
  });
  await run.step("Cycle FORWARD", {}, async () => {
    await click(page, `//button[.//*[@data-icon="circle-arrow-right" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-right ")]][parent::*[contains(., "Tank 0000")]]`, 30000);
  });
  await run.step("Let the next asset render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF: forward moved to \"A/C Motor 0002\"", {}, async () => {
    await assertFromJavascript(page, `const groups = [...document.querySelectorAll('button')]
  .filter(b => b.querySelector('[data-icon="circle-arrow-right"]'))
  .map(b => b.parentElement).filter(Boolean);
if (!groups.length) return false;
return groups.some(g => (g.textContent || '').indexOf('A/C Motor 0002') !== -1);`, 30000);
  });
  await run.step("Cycle FORWARD again \u2014 with 2 assets this must wrap", {}, async () => {
    await click(page, `//button[.//*[@data-icon="circle-arrow-right" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-right ")]][parent::*[contains(., "A/C Motor 0002")]]`, 30000);
  });
  await run.step("Let the wrap render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF: cycling wrapped back to \"Tank 0000\"", {}, async () => {
    await assertFromJavascript(page, `const groups = [...document.querySelectorAll('button')]
  .filter(b => b.querySelector('[data-icon="circle-arrow-right"]'))
  .map(b => b.parentElement).filter(Boolean);
if (!groups.length) return false;
return groups.some(g => (g.textContent || '').indexOf('Tank 0000') !== -1);`, 30000);
  });
  await run.step("Cycle BACK \u2014 the reverse arrow works too", {}, async () => {
    await click(page, `//button[.//*[@data-icon="circle-arrow-left" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-left ")]][parent::*[contains(., "Tank 0000")]]`, 30000);
  });
  await run.step("Let the previous asset render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF: the back arrow moved to \"A/C Motor 0002\"", {}, async () => {
    await assertFromJavascript(page, `const groups = [...document.querySelectorAll('button')]
  .filter(b => b.querySelector('[data-icon="circle-arrow-right"]'))
  .map(b => b.parentElement).filter(Boolean);
if (!groups.length) return false;
return groups.some(g => (g.textContent || '').indexOf('A/C Motor 0002') !== -1);`, 30000);
  });
  run.finish();
}
