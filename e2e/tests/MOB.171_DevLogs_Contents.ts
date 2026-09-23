// Generated from Mobile/dd_tests_mobile/MOB.171_DevLogs_Contents.json by to_playwright.py — do not edit by hand yet.
// MOB.171_DevLogs_Contents

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, click, wait } from '../support/dd';

export async function mob171(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the Dev Logs screen", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/logz`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The Developer Logs heading rendered", {}, async () => {
    await assertPageContains(page, `Developer Logs`, 60000);
  });
  await run.step("The log-level select renders", {}, async () => {
    await assertElementPresent(page, `//input[@class and not(@type="checkbox")][ancestor::*[contains(@class,"mantine-Select")]]`, 30000);
  });
  await run.step("The \"Refresh\" button renders", {}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Refresh"]`, 30000);
  });
  await run.step("The \"Clear Logs\" button renders (asserted, NEVER clicked \u2014 it wipes the store)", {}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Clear Logs"]`, 30000);
  });
  await run.step("The \"Email me the JSON\" button renders (asserted, NEVER clicked \u2014 it POSTs to /api/attachment/email)", {}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Email me the JSON"]`, 30000);
  });
  await run.step("EXACTLY ONE of: log entries, or the 'No logs found.' empty state", {}, async () => {
    await assertFromJavascript(page, `const t = document.body.innerText || '';
const empty = /No logs found\\./.test(t);
const entries = [...document.querySelectorAll('.mantine-Paper-root')].filter(e => /(INFO|ERROR|DEBUG|WARN)/.test(e.textContent||'')).length > 0;
return empty !== entries;`, 30000);
  });
  await run.step("Click \"Refresh\" (the only non-destructive button on this screen)", {}, async () => {
    await click(page, `//button[normalize-space(.)="Refresh"]`, 30000);
  });
  await run.step("Let the refresh settle", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The screen survived the refresh", {}, async () => {
    await assertPageContains(page, `Developer Logs`, 30000);
  });
  await run.step("Open the log-level select (leg 1 \u2014 change it)", {}, async () => {
    await click(page, `//input[@class and not(@type="checkbox")][ancestor::*[contains(@class,"mantine-Select")]]`, 30000);
  });
  await run.step("Let the options render", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Choose \"verbose\"", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-option ")][normalize-space(.)="verbose"]`, 30000);
  });
  await run.step("Let the level apply", {}, async () => {
    await wait(page, 2);
  });
  await run.step("PERSISTED: sessionStorage['log_level'] is now 'verbose'", {}, async () => {
    await assertFromJavascript(page, `return sessionStorage.getItem('log_level') === 'verbose';`, 30000);
  });
  await run.step("Open the log-level select (leg 2 \u2014 put it back)", {always: true}, async () => {
    await click(page, `//input[@class and not(@type="checkbox")][ancestor::*[contains(@class,"mantine-Select")]]`, 30000);
  });
  await run.step("Let the options render", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("Choose \"default\"", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-option ")][normalize-space(.)="default"]`, 30000);
  });
  await run.step("Let the level apply", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("PERSISTED: sessionStorage['log_level'] is now 'default'", {always: true}, async () => {
    await assertFromJavascript(page, `return sessionStorage.getItem('log_level') === 'default';`, 30000);
  });
  run.finish();
}
