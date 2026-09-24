// Generated from legacy/Mobile/dd_tests_mobile/MOB.410_Menu_Resync.json by to_playwright.py — do not edit by hand yet.
// MOB.410_Menu_Resync

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, click, wait } from '../support/dd';
import { globals } from '../support/env';

export async function mob410(page: Page): Promise<void> {
  const MOBDEV = globals.MOBDEV;
  const run = new Sequence();
  await run.step("Navigate to mobile home", {}, async () => {
    await page.goto(`${MOBDEV}`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Open the hamburger menu", {}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Click ReSync", {}, async () => {
    await click(page, `//button[normalize-space(.)="ReSync"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the resync to complete", {}, async () => {
    await wait(page, 10);
  });
  await run.step("Test app shell survived the resync", {}, async () => {
    await assertElementPresent(page, `//button[@aria-label="Toggle navigation"]`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
