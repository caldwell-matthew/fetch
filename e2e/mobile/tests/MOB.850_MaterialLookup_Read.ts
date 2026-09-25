// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.850_MaterialLookup_Read.json. This file is the source now: edit it directly.
// MOB.850_MaterialLookup_Read

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, typeText, wait } from '../../support/dd';

export async function mob850(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to material lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/material-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the \"Material Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]`, `Material Lookup`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the storeroom dropdown renders", {}, async () => {
    await assertElementPresent(page, `//*[@id="storeroomLocationId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("READY: the material list has loaded \u2014 an `N matches` line shows and no loading overlay covers the page", {}, async () => {
    await assertFromJavascript(page, `const overlay = document.querySelectorAll('.mantine-LoadingOverlay-overlay').length > 0;
const counted = [...document.querySelectorAll('p, div, span')]
  .some(e => e.children.length === 0 && /^\\d[\\d,]* matches$/.test((e.textContent || '').trim()));
return counted && !overlay;`, 60000);
  });
  await run.step("Open the storeroom dropdown", {}, async () => {
    await click(page, `//*[@id="storeroomLocationId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Pick Central Storeroom", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Central Storeroom")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the material search", {}, async () => {
    await click(page, `//input[@placeholder="Search for material items by name"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Search for Adamantium", {}, async () => {
    await typeText(page, `//input[@placeholder="Search for material items by name"]`, `Adamantium`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the search debounce", {}, async () => {
    await wait(page, 4);
  });
  await run.step("PROOF: the search finds 000-000-000 Adamantium", {}, async () => {
    await assertPageContains(page, `000-000-000 Adamantium`, DEFAULT_TIMEOUT);
  });
  await run.step("Append junk so the query cannot match", {}, async () => {
    await typeText(page, `//input[@placeholder="Search for material items by name"]`, `ZZZZ-NO-SUCH-ITEM`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the search debounce", {}, async () => {
    await wait(page, 4);
  });
  await run.step("PROOF: a non-matching search hides 000-000-000 Adamantium", {}, async () => {
    await assertPageLacks(page, `000-000-000 Adamantium`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
