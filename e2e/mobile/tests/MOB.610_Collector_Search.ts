// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.610_Collector_Search.json. This file is the source now: edit it directly.
// MOB.610_Collector_Search

import { expect, Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, press, typeText, wait } from '../../support/dd';
import { appUrl } from '../support/session';

export async function mob610(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the collector", {}, async () => {
    await page.goto(`${appUrl()}asset-collector`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
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
  // A row's name is `ui/TruncatedText`'s one-line text (`AssetCollector/index.tsx:185-189`: `TruncateText`, lineClamp 1).
  await run.step("A row's name is its one-line truncated title (`#truncation-text`, clamped to 1 line)", {}, async () => {
    const title = page.locator('.mantine-Accordion-item').first().locator('#truncation-text');
    await expect(title, 'the first row has its truncated title').toHaveCount(1, { timeout: 30_000 });
    await expect(title).not.toHaveText('');
    expect(await title.evaluate((el) => getComputedStyle(el).webkitLineClamp), 'clamped to one line').toBe('1');
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
