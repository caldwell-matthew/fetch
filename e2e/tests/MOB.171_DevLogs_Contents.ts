// Generated from Mobile/dd_tests_mobile/MOB.171_DevLogs_Contents.json by to_playwright.py — do not edit by hand yet.
// MOB.171_DevLogs_Contents

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, assertFromJavascript, assertPageContains, el, wait } from '../support/dd';

export async function mob171(page: Page): Promise<void> {
  try {
    // Navigate to the Dev Logs screen
    await page.goto(`https://dev.mentorapm.com/apm-mobile/logz`);
    // Let the page render
    await wait(page, 3);
    // The Developer Logs heading rendered
    await assertPageContains(page, `Developer Logs`, 60000);
    // The log-level select renders
    await assertElementPresent(page, `//input[@class and not(@type="checkbox")][ancestor::*[contains(@class,"mantine-Select")]]`, 30000);
    // The "Refresh" button renders
    await assertElementPresent(page, `//button[normalize-space(.)="Refresh"]`, 30000);
    // The "Clear Logs" button renders (asserted, NEVER clicked — it wipes the store)
    await assertElementPresent(page, `//button[normalize-space(.)="Clear Logs"]`, 30000);
    // The "Email me the JSON" button renders (asserted, NEVER clicked — it POSTs to /api/attachment/email)
    await assertElementPresent(page, `//button[normalize-space(.)="Email me the JSON"]`, 30000);
    // EXACTLY ONE of: log entries, or the 'No logs found.' empty state
    await assertFromJavascript(page, `const t = document.body.innerText || '';
const empty = /No logs found\\./.test(t);
const entries = [...document.querySelectorAll('.mantine-Paper-root')].filter(e => /(INFO|ERROR|DEBUG|WARN)/.test(e.textContent||'')).length > 0;
return empty !== entries;`, 30000);
    // Click "Refresh" (the only non-destructive button on this screen)
    await el(page, `//button[normalize-space(.)="Refresh"]`).click({ timeout: 30000 });
    // Let the refresh settle
    await wait(page, 3);
    // The screen survived the refresh
    await assertPageContains(page, `Developer Logs`, 30000);
    // Open the log-level select (leg 1 — change it)
    await el(page, `//input[@class and not(@type="checkbox")][ancestor::*[contains(@class,"mantine-Select")]]`).click({ timeout: 30000 });
    // Let the options render
    await wait(page, 1);
    // Choose "verbose"
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-option ")][normalize-space(.)="verbose"]`).click({ timeout: 30000 });
    // Let the level apply
    await wait(page, 2);
    // PERSISTED: sessionStorage['log_level'] is now 'verbose'
    await assertFromJavascript(page, `return sessionStorage.getItem('log_level') === 'verbose';`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Open the log-level select (leg 2 — put it back)
    await el(page, `//input[@class and not(@type="checkbox")][ancestor::*[contains(@class,"mantine-Select")]]`).click({ timeout: 30000 });
    // Let the options render
    await wait(page, 1);
    // Choose "default"
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-option ")][normalize-space(.)="default"]`).click({ timeout: 30000 });
    // Let the level apply
    await wait(page, 2);
    // PERSISTED: sessionStorage['log_level'] is now 'default'
    await assertFromJavascript(page, `return sessionStorage.getItem('log_level') === 'default';`, 30000);
  }
}
