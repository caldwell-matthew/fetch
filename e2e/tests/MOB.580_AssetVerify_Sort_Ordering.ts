// Generated from Mobile/dd_tests_mobile/MOB.580_AssetVerify_Sort_Ordering.json by to_playwright.py — do not edit by hand yet.
// MOB.580_AssetVerify_Sort_Ordering

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';

export async function mob580(page: Page): Promise<void> {
  const soft = new Soft();
  try {
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Let the page begin rendering
    await wait(page, 3);
    // Test the "Mobile Jobs" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
    // Wait for the lookup prefetch and batched detail downloads
    await wait(page, 25);
    // Test the job list rendered
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
    // Test the lookup prefetch finished (feeds schemaQuery)
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
    // Test the batched job-detail downloads finished
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    // FIXTURE GUARD: "DATADOG MOBILE JOB" is in this crew's list
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open "DATADOG MOBILE JOB" by clicking its row (not a deep link)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`).click({ timeout: 30000 });
    // Wait for the job detail to render
    await wait(page, 5);
    // ASSET LIST GUARD: the job's asset rows have rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
    // Open the sort dropdown
    await el(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 30000 });
    // Wait for the sort modal
    await wait(page, 2);
    // The Sort Criteria modal opened
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
    // Open the sort options
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the options
    await wait(page, 2);
    // Pick "Name ▲"
    await el(page, `//*[@role="option"][normalize-space(.)="Name ▲"]`).click({ timeout: 30000 });
    // Wait for the list to re-order
    await wait(page, 3);
    await optional("DIAG: the app stored the \"Name \u25b2\" selection (`mobile-Asset-sort` = name_ASC)", async () => {
      await assertFromJavascript(page, `let raw = null;
try { raw = sessionStorage.getItem('mobile-Asset-sort'); } catch (e) { return false; }
if (!raw) return false;
let v = null;
try { v = JSON.parse(raw); } catch (e) { return false; }
return !!v && v.id === 'name_ASC';`, 15000);
    });
    await soft.run("PROOF (ascending): the rendered names ARE the sorted order", async () => {
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
    // Open the sort dropdown
    await el(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 30000 });
    // Wait for the sort modal
    await wait(page, 2);
    // The Sort Criteria modal opened
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
    // Open the sort options
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the options
    await wait(page, 2);
    // Pick "Name ▼"
    await el(page, `//*[@role="option"][normalize-space(.)="Name ▼"]`).click({ timeout: 30000 });
    // Wait for the list to re-order
    await wait(page, 3);
    await optional("DIAG: the app stored the \"Name \u25bc\" selection (`mobile-Asset-sort` = name_DESC)", async () => {
      await assertFromJavascript(page, `let raw = null;
try { raw = sessionStorage.getItem('mobile-Asset-sort'); } catch (e) { return false; }
if (!raw) return false;
let v = null;
try { v = JSON.parse(raw); } catch (e) { return false; }
return !!v && v.id === 'name_DESC';`, 15000);
    });
    await soft.run("PROOF (descending): the rendered names are that order EXACTLY REVERSED", async () => {
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
    // Open the sort dropdown
    await el(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 30000 });
    // Wait for the sort modal
    await wait(page, 2);
    // The Sort Criteria modal opened
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
    // Open the sort options
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the options
    await wait(page, 2);
    // Pick "Name ▲"
    await el(page, `//*[@role="option"][normalize-space(.)="Name ▲"]`).click({ timeout: 30000 });
    // Wait for the list to re-order
    await wait(page, 3);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    await soft.run("RESTORED: ascending order again", async () => {
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
  }
  soft.check();
}
