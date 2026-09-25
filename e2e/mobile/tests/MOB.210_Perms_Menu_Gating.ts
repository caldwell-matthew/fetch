// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.210_Perms_Menu_Gating.json. This file is the source now: edit it directly.
// MOB.210_Perms_Menu_Gating

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, wait } from '../../support/dd';

export async function mob210(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile home page", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Open the menu to read the session role", {}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Role is now \"Admin\"", {}, async () => {
    await assertPageContains(page, `Admin`, DEFAULT_TIMEOUT);
  });
  await run.step("Baseline: \"Work Orders\" is in the menu under Admin", {}, async () => {
    await assertPageContains(page, `Work Orders`, DEFAULT_TIMEOUT);
  });
  await run.step("Close the menu", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("HOME TILES: exactly 6 permission-gated tile(s) rendered", {}, async () => {
    await assertFromJavascript(page, `return document.querySelectorAll('img[alt^="icon for "]').length === 6;`, 30000);
  });
  await run.step("Baseline: the \"Work Orders\" home TILE is present under Admin", {}, async () => {
    await assertElementPresent(page, `//img[@alt="icon for Work Orders url"]`, 30000);
  });
  await run.step("Open the header menu", {}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Click Switch Crews", {}, async () => {
    await click(page, `//button[.//div[normalize-space(.)="Switch Crews"]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Select Admin 0000", {}, async () => {
    await click(page, `//label[contains(normalize-space(.), "0000")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the crew change", {}, async () => {
    await click(page, `//button[normalize-space(.)="Submit"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the crew change to resync", {}, async () => {
    await wait(page, 8);
  });
  await run.step("Navigate to the mobile home page", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Open the menu to read the session role", {}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Role is now \"0000\"", {}, async () => {
    await assertPageContains(page, `0000`, DEFAULT_TIMEOUT);
  });
  await run.step("PROOF: \"Work Orders\" is hidden without read permission", {}, async () => {
    await assertPageLacks(page, `Work Orders`, DEFAULT_TIMEOUT);
  });
  await run.step("Close the menu", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("PROOF: Home falls through to its \"No valid permissions\" empty state", {}, async () => {
    await assertPageContains(page, `No valid permissions`, DEFAULT_TIMEOUT);
  });
  await run.step("HOME TILES: exactly 0 permission-gated tile(s) rendered", {}, async () => {
    await assertFromJavascript(page, `return document.querySelectorAll('img[alt^="icon for "]').length === 0;`, 30000);
  });
  await run.step("Open the header menu", {}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Click Switch Crews", {}, async () => {
    await click(page, `//button[.//div[normalize-space(.)="Switch Crews"]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Select Admin (restore)", {}, async () => {
    await click(page, `//label[normalize-space(.)="Admin"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the crew change", {}, async () => {
    await click(page, `//button[normalize-space(.)="Submit"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the crew change to resync", {}, async () => {
    await wait(page, 8);
  });
  await run.step("Navigate to the mobile home page", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Open the menu to read the session role", {}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Role is now \"Admin\"", {}, async () => {
    await assertPageContains(page, `Admin`, DEFAULT_TIMEOUT);
  });
  await run.step("RESTORED: \"Work Orders\" is back in the menu", {}, async () => {
    await assertPageContains(page, `Work Orders`, DEFAULT_TIMEOUT);
  });
  await run.step("Close the menu", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("HOME TILES: exactly 6 permission-gated tile(s) rendered", {}, async () => {
    await assertFromJavascript(page, `return document.querySelectorAll('img[alt^="icon for "]').length === 6;`, 30000);
  });
  await run.step("RESTORED: the empty state is gone", {}, async () => {
    await assertPageLacks(page, `No valid permissions`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
