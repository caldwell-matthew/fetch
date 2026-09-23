// Generated from Mobile/dd_tests_mobile/MOB.535_AssetVerify_Sort_Ordering.json by to_playwright.py — do not edit by hand yet.
// MOB.535_AssetVerify_Sort_Ordering

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';

export async function mob535(page: Page): Promise<void> {
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
    // TWO-JOB GUARD: at least TWO job rows are rendered — ordering is vacuous with one (trap 5)
    await assertFromJavascript(page, `const NAMES = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => /out of \\d+ Assets Verified/.test(e.textContent || '')
            && !e.querySelector('.mantine-Paper-root'))
  .map(e => ((e.querySelector('.mantine-Title-root') || {}).textContent || '')
             .replace(/\\s+/g, ' ').trim());
return NAMES().length >= 2;`, 60000);
    // DISTINCTNESS GUARD: the rendered jobs do not all share one name
    await assertFromJavascript(page, `const NAMES = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => /out of \\d+ Assets Verified/.test(e.textContent || '')
            && !e.querySelector('.mantine-Paper-root'))
  .map(e => ((e.querySelector('.mantine-Title-root') || {}).textContent || '')
             .replace(/\\s+/g, ' ').trim());
const n = NAMES();
return new Set(n).size >= 2;`, 30000);
    // Open the sort dropdown (for Name ascending)
    await el(page, `//button[.//*[@data-icon="sort-alt" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 30000 });
    // The Sort Criteria modal opened
    await assertPageContains(page, `Sort Criteria`, 30000);
    // Open the sort options
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: 30000 });
    // GATE: a "Name ▲" option exists
    await assertElementPresent(page, `//*[@role="option"][contains(normalize-space(.), "Name")][contains(normalize-space(.), "▲")]`, 30000);
    // Pick "Name ▲"
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Name")][contains(normalize-space(.), "▲")]`).click({ timeout: 30000 });
    // Let the sort apply and the list re-render
    await wait(page, 3);
    // The ascending Name sort was persisted
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('mobile-MobileJob-sort');
if (!raw) return false;
const v = JSON.parse(raw);
return v.column === 'name' && String(v.label || '').includes('▲');`, 30000);
    // ⭐ PROOF ASC: the rendered job names are in non-DECREASING order
    await assertFromJavascript(page, `const NAMES = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => /out of \\d+ Assets Verified/.test(e.textContent || '')
            && !e.querySelector('.mantine-Paper-root'))
  .map(e => ((e.querySelector('.mantine-Title-root') || {}).textContent || '')
             .replace(/\\s+/g, ' ').trim());
const n = NAMES();
if (n.length < 2) return false;
// lodash sortBy uses plain < / > on strings (code-unit order), NOT
// localeCompare — match it, or mixed case reads as a sort bug.
for (let i = 1; i < n.length; i++) if (n[i - 1] > n[i]) return false;
return true;`, 30000);
    // Open the sort dropdown (for Name descending)
    await el(page, `//button[.//*[@data-icon="sort-alt" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 30000 });
    // The Sort Criteria modal opened
    await assertPageContains(page, `Sort Criteria`, 30000);
    // Open the sort options
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: 30000 });
    // GATE: a "Name ▼" option exists
    await assertElementPresent(page, `//*[@role="option"][contains(normalize-space(.), "Name")][contains(normalize-space(.), "▼")]`, 30000);
    // Pick "Name ▼"
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Name")][contains(normalize-space(.), "▼")]`).click({ timeout: 30000 });
    // Let the sort apply and the list re-render
    await wait(page, 3);
    // The descending Name sort was persisted
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('mobile-MobileJob-sort');
if (!raw) return false;
const v = JSON.parse(raw);
return v.column === 'name' && String(v.label || '').includes('▼');`, 30000);
    // ⭐ PROOF DESC: the rendered job names are in non-INCREASING order
    await assertFromJavascript(page, `const NAMES = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => /out of \\d+ Assets Verified/.test(e.textContent || '')
            && !e.querySelector('.mantine-Paper-root'))
  .map(e => ((e.querySelector('.mantine-Title-root') || {}).textContent || '')
             .replace(/\\s+/g, ' ').trim());
const n = NAMES();
if (n.length < 2) return false;
for (let i = 1; i < n.length; i++) if (n[i - 1] < n[i]) return false;
return true;`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    await optional("DIAG: how many rows Virtuoso has mounted (informational \u2014 always true)", async () => {
      await assertFromJavascript(page, `const NAMES = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => /out of \\d+ Assets Verified/.test(e.textContent || '')
            && !e.querySelector('.mantine-Paper-root'))
  .map(e => ((e.querySelector('.mantine-Title-root') || {}).textContent || '')
             .replace(/\\s+/g, ' ').trim());
const n = NAMES();
return n.length >= 1 || true;`, 15000);
    });
    // RESTORE: clear the persisted sort
    await assertFromJavascript(page, `sessionStorage.removeItem('mobile-MobileJob-sort');
return !sessionStorage.getItem('mobile-MobileJob-sort');`, 30000);
  }
}
