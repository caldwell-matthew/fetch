// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.580_AssetVerify_Sort_Ordering.json. This file is the source now: edit it directly.
// MOB.580_AssetVerify_Sort_Ordering

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';

export async function mob580(page: Page): Promise<void> {
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
  await run.step("Open the sort dropdown", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 30000);
  });
  await run.step("Wait for the sort modal", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The Sort Criteria modal opened", {}, async () => {
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the sort options", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick \"Name \u25b2\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Name ▲"]`, 30000);
  });
  await run.step("Wait for the list to re-order", {}, async () => {
    await wait(page, 3);
  });
  await run.step("DIAG: the app stored the \"Name \u25b2\" selection (`mobile-Asset-sort` = name_ASC)", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `let raw = null;
try { raw = sessionStorage.getItem('mobile-Asset-sort'); } catch (e) { return false; }
if (!raw) return false;
let v = null;
try { v = JSON.parse(raw); } catch (e) { return false; }
return !!v && v.id === 'name_ASC';`, 15000);
  });
  await run.step("PROOF (ascending): the rendered names ARE the sorted order", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const nameOf = it => {
  const c = it.querySelector('[class*="mantine-Accordion-control"]');
  if (!c) return null;
  const el = c.querySelector('span[style*="underline"]')
    || c.querySelector('[class*="mantine-Highlight-root"]')
    || c.querySelector('[class*="mantine-Text-root"]');
  return el ? (el.textContent || '').trim() : null;
};
const names = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')]
  .map(nameOf);
if (names.length < 2 || names.some(n => !n)) return false;
if (!names.some(n => n.indexOf('A/C Motor 0002') !== -1)) return false;
if (!names.some(n => n.indexOf('Tank 0000') !== -1)) return false;
const sorted = [...names].sort((a, b) => a.localeCompare(b));
return JSON.stringify(names) === JSON.stringify(sorted);`, 30000);
  });
  await run.step("Open the sort dropdown", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 30000);
  });
  await run.step("Wait for the sort modal", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The Sort Criteria modal opened", {}, async () => {
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the sort options", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick \"Name \u25bc\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Name ▼"]`, 30000);
  });
  await run.step("Wait for the list to re-order", {}, async () => {
    await wait(page, 3);
  });
  await run.step("DIAG: the app stored the \"Name \u25bc\" selection (`mobile-Asset-sort` = name_DESC)", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `let raw = null;
try { raw = sessionStorage.getItem('mobile-Asset-sort'); } catch (e) { return false; }
if (!raw) return false;
let v = null;
try { v = JSON.parse(raw); } catch (e) { return false; }
return !!v && v.id === 'name_DESC';`, 15000);
  });
  await run.step("PROOF (descending): the rendered names are that order EXACTLY REVERSED", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const nameOf = it => {
  const c = it.querySelector('[class*="mantine-Accordion-control"]');
  if (!c) return null;
  const el = c.querySelector('span[style*="underline"]')
    || c.querySelector('[class*="mantine-Highlight-root"]')
    || c.querySelector('[class*="mantine-Text-root"]');
  return el ? (el.textContent || '').trim() : null;
};
const names = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')]
  .map(nameOf);
if (names.length < 2 || names.some(n => !n)) return false;
if (!names.some(n => n.indexOf('A/C Motor 0002') !== -1)) return false;
if (!names.some(n => n.indexOf('Tank 0000') !== -1)) return false;
const sorted = [...names].sort((a, b) => a.localeCompare(b));
sorted.reverse();
return JSON.stringify(names) === JSON.stringify(sorted);`, 30000);
  });
  await run.step("Open the sort dropdown", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 30000);
  });
  await run.step("Wait for the sort modal", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The Sort Criteria modal opened", {}, async () => {
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the sort options", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick \"Name \u25b2\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Name ▲"]`, 30000);
  });
  await run.step("Wait for the list to re-order", {}, async () => {
    await wait(page, 3);
  });
  await run.step("RESTORED: ascending order again", {always: true, allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const nameOf = it => {
  const c = it.querySelector('[class*="mantine-Accordion-control"]');
  if (!c) return null;
  const el = c.querySelector('span[style*="underline"]')
    || c.querySelector('[class*="mantine-Highlight-root"]')
    || c.querySelector('[class*="mantine-Text-root"]');
  return el ? (el.textContent || '').trim() : null;
};
const names = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')]
  .map(nameOf);
if (names.length < 2 || names.some(n => !n)) return false;
if (!names.some(n => n.indexOf('A/C Motor 0002') !== -1)) return false;
if (!names.some(n => n.indexOf('Tank 0000') !== -1)) return false;
const sorted = [...names].sort((a, b) => a.localeCompare(b));
return JSON.stringify(names) === JSON.stringify(sorted);`, 30000);
  });
  run.finish();
}
