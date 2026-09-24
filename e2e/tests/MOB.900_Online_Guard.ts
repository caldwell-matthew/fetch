// Generated from legacy/Mobile/dd_tests_mobile/MOB.900_Online_Guard.json by to_playwright.py — do not edit by hand yet.
// MOB.900_Online_Guard

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, wait } from '../support/dd';
import { globals } from '../support/env';

export async function mob900(page: Page): Promise<void> {
  const MOBDEV = globals.MOBDEV;
  const run = new Sequence();
  await run.step("Navigate to mobile home", {}, async () => {
    await page.goto(`${MOBDEV}`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the home screen render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("POSITIVE ANCHOR: the home screen actually rendered", {}, async () => {
    await assertPageContains(page, `Welcome,`, 60000);
  });
  await run.step("POSITIVE ANCHOR: the module tiles rendered", {}, async () => {
    await assertElementPresent(page, `(//img[starts-with(@alt, "icon for ")])[1]`, 60000);
  });
  await run.step("Guard: offline message must not be shown", {}, async () => {
    await assertPageLacks(page, `This feature requires an internet connection.`, DEFAULT_TIMEOUT);
  });
  await run.step("The runner really is online (so the absence above means something)", {}, async () => {
    await assertFromJavascript(page, `return navigator.onLine === true;`, 30000);
  });
  await run.step("\u2b50 CRASH GUARD: the ErrorBoundary has NOT tripped \u2014 no \"Something went wrong.\"", {}, async () => {
    await assertPageLacks(page, `Something went wrong.`, 30000);
  });
  await run.step("\u2026and its \"Reload page\" button is absent too (the boundary renders both)", {}, async () => {
    await assertPageLacks(page, `Reload page`, 30000);
  });
  run.finish();
}
