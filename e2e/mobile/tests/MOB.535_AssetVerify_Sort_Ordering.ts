// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.535_AssetVerify_Sort_Ordering.json. This file is the source now: edit it directly.
// MOB.535_AssetVerify_Sort_Ordering

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';
import { waitForPrefetch } from '../support/prefetch';

export async function mob535(page: Page): Promise<void> {
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
  await run.step("TWO-JOB GUARD: at least TWO job rows are rendered \u2014 ordering is vacuous with one (trap 5)", {}, async () => {
    await assertFromJavascript(page, `const NAMES = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => /out of \\d+ Assets Verified/.test(e.textContent || '')
            && !e.querySelector('.mantine-Paper-root'))
  .map(e => ((e.querySelector('.mantine-Title-root') || {}).textContent || '')
             .replace(/\\s+/g, ' ').trim());
return NAMES().length >= 2;`, 60000);
  });
  await run.step("DISTINCTNESS GUARD: the rendered jobs do not all share one name", {}, async () => {
    await assertFromJavascript(page, `const NAMES = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => /out of \\d+ Assets Verified/.test(e.textContent || '')
            && !e.querySelector('.mantine-Paper-root'))
  .map(e => ((e.querySelector('.mantine-Title-root') || {}).textContent || '')
             .replace(/\\s+/g, ' ').trim());
const n = NAMES();
return new Set(n).size >= 2;`, 30000);
  });
  await run.step("Open the sort dropdown (for Name ascending)", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 30000);
  });
  await run.step("The Sort Criteria modal opened", {}, async () => {
    await assertPageContains(page, `Sort Criteria`, 30000);
  });
  await run.step("Open the sort options", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, 30000);
  });
  await run.step("GATE: a \"Name \u25b2\" option exists", {}, async () => {
    await assertElementPresent(page, `//*[@role="option"][contains(normalize-space(.), "Name")][contains(normalize-space(.), "▲")]`, 30000);
  });
  await run.step("Pick \"Name \u25b2\"", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Name")][contains(normalize-space(.), "▲")]`, 30000);
  });
  await run.step("Let the sort apply and the list re-render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The ascending Name sort was persisted", {}, async () => {
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('mobile-MobileJob-sort');
if (!raw) return false;
const v = JSON.parse(raw);
return v.column === 'name' && String(v.label || '').includes('▲');`, 30000);
  });
  await run.step("\u2b50 PROOF ASC: the rendered job names are in non-DECREASING order", {}, async () => {
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
  });
  await run.step("Open the sort dropdown (for Name descending)", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 30000);
  });
  await run.step("The Sort Criteria modal opened", {}, async () => {
    await assertPageContains(page, `Sort Criteria`, 30000);
  });
  await run.step("Open the sort options", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, 30000);
  });
  await run.step("GATE: a \"Name \u25bc\" option exists", {}, async () => {
    await assertElementPresent(page, `//*[@role="option"][contains(normalize-space(.), "Name")][contains(normalize-space(.), "▼")]`, 30000);
  });
  await run.step("Pick \"Name \u25bc\"", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Name")][contains(normalize-space(.), "▼")]`, 30000);
  });
  await run.step("Let the sort apply and the list re-render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The descending Name sort was persisted", {}, async () => {
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('mobile-MobileJob-sort');
if (!raw) return false;
const v = JSON.parse(raw);
return v.column === 'name' && String(v.label || '').includes('▼');`, 30000);
  });
  await run.step("\u2b50 PROOF DESC: the rendered job names are in non-INCREASING order", {}, async () => {
    await assertFromJavascript(page, `const NAMES = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => /out of \\d+ Assets Verified/.test(e.textContent || '')
            && !e.querySelector('.mantine-Paper-root'))
  .map(e => ((e.querySelector('.mantine-Title-root') || {}).textContent || '')
             .replace(/\\s+/g, ' ').trim());
const n = NAMES();
if (n.length < 2) return false;
for (let i = 1; i < n.length; i++) if (n[i - 1] < n[i]) return false;
return true;`, 30000);
  });
  await run.step("DIAG: how many rows Virtuoso has mounted (informational \u2014 always true)", {always: true, allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const NAMES = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => /out of \\d+ Assets Verified/.test(e.textContent || '')
            && !e.querySelector('.mantine-Paper-root'))
  .map(e => ((e.querySelector('.mantine-Title-root') || {}).textContent || '')
             .replace(/\\s+/g, ' ').trim());
const n = NAMES();
return n.length >= 1 || true;`, 15000);
  });
  await run.step("RESTORE: clear the persisted sort", {always: true}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('mobile-MobileJob-sort');
return !sessionStorage.getItem('mobile-MobileJob-sort');`, 30000);
  });
  run.finish();
}
