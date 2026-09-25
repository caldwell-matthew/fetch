// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.720_AssetLookup_Event_Readings.json. This file is the source now: edit it directly.
// MOB.720_AssetLookup_Event_Readings

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../../support/dd';

export async function mob720(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to asset lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
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
  await run.step("Search for Pump 0102", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter \u2014 there is no search button)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("RESULT GUARD: a result row for Pump 0102 rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1][contains(., "Pump 0102")]`, 60000);
  });
  await run.step("Expand the first result", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`, 30000);
  });
  await run.step("The \"Readings\" tab exists \u2014 the SIXTH tab", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Readings"]`, 60000);
  });
  await run.step("The expanded result's tab strip has SIX tabs", {}, async () => {
    await assertFromJavascript(page, `const it = document.querySelector('.mantine-Accordion-item');
if (!it) return false;
return it.querySelectorAll('[role=tab]').length === 6;`, 30000);
  });
  await run.step("Open the \"Readings\" tab", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Readings"]`, 30000);
  });
  await run.step("The \"Readings\" tab is now the active one", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Readings"][@data-active="true"]`, 30000);
  });
  await run.step("The asset-scoped readings FORM mounted", {}, async () => {
    await assertElementPresent(page, `//form[starts-with(@id, "asset-lookup-readings-")]`, 60000);
  });
  await run.step("EXACTLY ONE of: a 'recorded recently' progress row, or the empty state", {}, async () => {
    await assertFromJavascript(page, `const f = document.querySelector('form[id^="asset-lookup-readings-"]');
if (!f) return false;
const panel = f.closest('[role=tabpanel]') || f.parentElement;
const txt = (panel.textContent || '');
const hasProgress = /recorded recently \\(in 24h\\)/.test(txt);
const hasEmpty = /No readings recorded for this asset\\./.test(txt);
return hasProgress !== hasEmpty;`, 30000);
  });
  await run.step("The \"Add reading types\" control renders", {}, async () => {
    await assertElementPresent(page, `//button[@aria-label="Add reading types"]`, 30000);
  });
  await run.step("Open the Add Reading Types modal", {}, async () => {
    await click(page, `//button[@aria-label="Add reading types"]`, 30000);
  });
  await run.step("The modal's title rendered", {}, async () => {
    await assertPageContains(page, `Add Reading Types`, 30000);
  });
  await run.step("Its reading-type search box rendered", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Search reading types"]`, 30000);
  });
  await run.step("The \"Add\" button is DISABLED while nothing is selected", {}, async () => {
    await assertFromJavascript(page, `const bs = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Add');
if (!bs.length) return false;
return bs.every(b => b.disabled);`, 30000);
  });
  await run.step("Try Escape first (optional \u2014 measured not to close this modal)", {always: true, allow: 'ignore'}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the modal react", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("Dismiss by clicking the overlay (closeOnClickOutside)", {always: true, allow: 'ignore'}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-overlay ")]`, 15000);
  });
  await run.step("Let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("The modal is gone \u2014 nothing was added", {always: true}, async () => {
    await assertPageLacks(page, `Add Reading Types`, 30000);
  });
  run.finish();
}
