// Generated from Mobile/dd_tests_mobile/MOB.900_Online_Guard.json by to_playwright.py — do not edit by hand yet.
// MOB.900_Online_Guard

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, wait } from '../support/dd';
import { globals } from '../support/env';

export async function mob900(page: Page): Promise<void> {
  const MOBDEV = globals.MOBDEV;
    // Navigate to mobile home
    await page.goto(`${MOBDEV}`);
    // Let the home screen render
    await wait(page, 3);
    // POSITIVE ANCHOR: the home screen actually rendered
    await assertPageContains(page, `Welcome,`, 60000);
    // POSITIVE ANCHOR: the module tiles rendered
    await assertElementPresent(page, `(//img[starts-with(@alt, "icon for ")])[1]`, 60000);
    // Guard: offline message must not be shown
    await assertPageLacks(page, `This feature requires an internet connection.`, DEFAULT_TIMEOUT);
    // The runner really is online (so the absence above means something)
    await assertFromJavascript(page, `return navigator.onLine === true;`, 30000);
    // ⭐ CRASH GUARD: the ErrorBoundary has NOT tripped — no "Something went wrong."
    await assertPageLacks(page, `Something went wrong.`, 30000);
    // …and its "Reload page" button is absent too (the boundary renders both)
    await assertPageLacks(page, `Reload page`, 30000);
}
