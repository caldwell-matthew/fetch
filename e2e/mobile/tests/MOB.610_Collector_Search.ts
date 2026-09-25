// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.610_Collector_Search.json. This file is the source now: edit it directly.
// MOB.610_Collector_Search

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, press, typeText, wait } from '../../support/dd';

export async function mob610(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the collector", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("The Collector page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Collector")]`, `Collector`, 60000);
  });
  await run.step("Its search box renders", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Asset(s)"]`, 30000);
  });
  await run.step("BASELINE GUARD: the collected list has rows to filter", {}, async () => {
    await assertFromJavascript(page, `const rows = () => [...document.querySelectorAll('.mantine-Accordion-item')];
return rows().length >= 1;`, 60000);
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
  await run.step("NEGATIVE: the filter drives the row count to ZERO", {}, async () => {
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
  await run.step("RESTORED: clearing brings the rows back", {always: true}, async () => {
    await assertFromJavascript(page, `const rows = () => [...document.querySelectorAll('.mantine-Accordion-item')];
return rows().length >= 1;`, 60000);
  });
  run.finish();
}
