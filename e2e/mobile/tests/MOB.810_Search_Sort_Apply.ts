// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.810_Search_Sort_Apply.json. This file is the source now: edit it directly.
// MOB.810_Search_Sort_Apply

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';

export async function mob810(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Open the sort dropdown", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 40000);
  });
  await run.step("The Sort Criteria modal opened", {}, async () => {
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the sort options", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Pick \"Created At \u25b2\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Created At ▲"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the sort to apply", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The sort modal closed on selection", {}, async () => {
    await assertPageLacks(page, `Sort Criteria`, DEFAULT_TIMEOUT);
  });
  await run.step("The choice was persisted as \"Created At \u25b2\"", {}, async () => {
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('mobile-MobileJob-sort');
if (!raw) return false;
return JSON.parse(raw).label === 'Created At ▲';`, DEFAULT_TIMEOUT);
  });
  await run.step("Navigate to /work", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the work list", {}, async () => {
    await wait(page, 8);
  });
  await run.step("Navigate to back to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin loading", {}, async () => {
    await wait(page, 5);
  });
  await run.step("PROOF: \"Created At \u25b2\" survived a page load", {}, async () => {
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('mobile-MobileJob-sort');
if (!raw) return false;
return JSON.parse(raw).label === 'Created At ▲';`, 40000);
  });
  await run.step("Open the sort dropdown", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 40000);
  });
  await run.step("The Sort Criteria modal opened", {}, async () => {
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the sort options", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Pick \"Created At \u25bc\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Created At ▼"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the sort to apply", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The sort modal closed on selection", {}, async () => {
    await assertPageLacks(page, `Sort Criteria`, DEFAULT_TIMEOUT);
  });
  await run.step("The descending option applied (\"Created At \u25bc\")", {}, async () => {
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('mobile-MobileJob-sort');
if (!raw) return false;
return JSON.parse(raw).label === 'Created At ▼';`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
