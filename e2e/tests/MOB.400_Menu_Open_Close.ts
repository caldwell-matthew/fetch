// Generated from legacy/Mobile/dd_tests_mobile/MOB.400_Menu_Open_Close.json by to_playwright.py — do not edit by hand yet.
// MOB.400_Menu_Open_Close

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertPageContains, assertPageLacks, click, press } from '../support/dd';
import { globals } from '../support/env';

export async function mob400(page: Page): Promise<void> {
  const MOBDEV = globals.MOBDEV;
  const run = new Sequence();
  await run.step("Navigate to mobile home", {}, async () => {
    await page.goto(`${MOBDEV}`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Open the hamburger menu", {}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test ReSync item is listed", {}, async () => {
    await assertPageContains(page, `ReSync`, DEFAULT_TIMEOUT);
  });
  await run.step("Test Switch Crews item is listed", {}, async () => {
    await assertPageContains(page, `Switch Crews`, DEFAULT_TIMEOUT);
  });
  await run.step("Test Log Out item is listed", {}, async () => {
    await assertPageContains(page, `Log Out`, DEFAULT_TIMEOUT);
  });
  await run.step("Close the menu with Escape", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Test menu closed", {}, async () => {
    await assertPageLacks(page, `Switch Crews`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
