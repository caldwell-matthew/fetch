// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.721_AssetLookup_Readings_Empty.json. This file is the source now: edit it directly.
// MOB.721_AssetLookup_Readings_Empty

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertFromJavascript, click, press, typeText, wait } from '../../support/dd';

export async function mob721(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to Asset Lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the page to mount", {}, async () => {
    await wait(page, 5);
  });
  await run.step("Test the \"Asset Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, 30000);
  });
  await run.step("Select any persisted query first (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for Building 0000", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Building 0000`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Wait for the search results (network-only)", {}, async () => {
    await wait(page, 8);
  });
  await run.step("Expand Building 0000's row by its chevron (never the avatar \u2014 bugs \u00a735)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Building 0000")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`, 30000);
  });
  await run.step("Let the detail panel mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Open its \"Readings\" tab", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Building 0000")]])[1]//*[@role="tab"][normalize-space(.)="Readings"]`, 30000);
  });
  await run.step("Let the Readings panel render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The ACTIVE tab of the Building 0000 row is `Readings` (the panel below is its own)", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')];
const it = items.find(i => { const c = i.querySelector('[class*="mantine-Accordion-control"]');
  return c && (c.textContent || '').includes('Building 0000'); });
if (!it) return false;
const tabEl = it.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...it.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!p || !tabEl) return false;
const t = (p.textContent || '');
return (tabEl.textContent || '').trim() === 'Readings';`, 30000);
  });
  await run.step("\u2b50 EMPTY STATE: the panel reads `No readings recorded for this asset.` \u2014 the asset has no readings", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')];
const it = items.find(i => { const c = i.querySelector('[class*="mantine-Accordion-control"]');
  return c && (c.textContent || '').includes('Building 0000'); });
if (!it) return false;
const tabEl = it.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...it.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!p || !tabEl) return false;
const t = (p.textContent || '');
return t.includes('No readings recorded for this asset.');`, 30000);
  });
  run.finish();
}
