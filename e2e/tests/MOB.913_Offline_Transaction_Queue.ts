// Generated from Mobile/dd_tests_mobile/MOB.913_Offline_Transaction_Queue.json by to_playwright.py — do not edit by hand yet.
// MOB.913_Offline_Transaction_Queue

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, wait } from '../support/dd';

export async function mob913(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await wait(page, 25);
  });
  await run.step("Test the job list rendered", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the lookup prefetch finished (feeds schemaQuery)", {}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open \"DATADOG MOBILE JOB\" by clicking its row (not a deep link)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`, 30000);
  });
  await run.step("Wait for the job detail to render", {}, async () => {
    await wait(page, 5);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Switch to the \"All\" filter", {}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="All"]]`, 30000);
  });
  await run.step("Wait for the All list to re-render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("FIXTURE GUARD (leg 1): job at rest (\"0 out of 2 Assets Verified\")", {}, async () => {
    await assertPageContains(page, `0 out of 2 Assets Verified`, 30000);
  });
  await run.step("BASELINE (leg 1): no pending-transactions indicator, and the online wifi icon is showing (the header rendered)", {}, async () => {
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === null && !!document.querySelector('[data-icon="wifi"]');`, 30000);
  });
  await run.step("Dispatch a window 'offline' event \u2014 the queue closes (`gateQueueLinkOnNetworkChange`, browser fallback)", {}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
  });
  await run.step("Let the header re-render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("OFFLINE (leg 1): the offline icon is showing \u2014 the event was delivered", {}, async () => {
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi-slash"]');`, 20000);
  });
  await run.step("Verify the first asset (VERIFY_ASSET \u2014 optimistic)", {}, async () => {
    await click(page, `(//input[@type="checkbox"])[1]`, 30000);
  });
  await run.step("Let both mutations reach the closed queue", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 QUEUED (leg 1): the pending indicator reads 2 \u2014 `VERIFY_ASSET` and the `UPDATE_MOBILE_JOB_STATUS` its update() recomputes (READY \u2192 IN_PROGRESS)", {}, async () => {
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === '2';`, 20000);
  });
  await run.step("Hold offline \u2014 an in-flight request would have resolved by now", {}, async () => {
    await wait(page, 6);
  });
  await run.step("\u2b50 HELD (leg 1): still 2 pending after 6s offline \u2014 neither request left", {}, async () => {
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === '2';`, 10000);
  });
  await run.step("Open the pending-transactions list (the indicator's icon)", {}, async () => {
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
if (!up) return false;
up.dispatchEvent(new MouseEvent('click', { bubbles: true }));
return true;`, 20000);
  });
  await run.step("Let the list read IndexedDB", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 LISTED: `Pending Transactions` shows BOTH held operations \u2014 `VERIFY_ASSET` with verified:true, and `UPDATE_MOBILE_JOB_STATUS` with IN_PROGRESS", {}, async () => {
    await assertFromJavascript(page, `const t = (document.body.textContent || '');
return t.includes('Pending Transactions') && t.includes('VERIFY_ASSET')
  && /"verified":\\s*true/.test(t)
  && t.includes('UPDATE_MOBILE_JOB_STATUS')
  && /"status":\\s*"IN_PROGRESS"/.test(t);`, 20000);
  });
  await run.step("UI (optional: records whether the job counter follows the optimistic verify while it is unsent)", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const t = (document.body.textContent || '');
return t.includes('1 out of 2 Assets Verified');`, 10000);
  });
  await run.step("Dispatch a window 'online' event \u2014 the queue opens (`gateQueueLinkOnNetworkChange`, browser fallback)", {}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
  });
  await run.step("Let the queue drain", {}, async () => {
    await wait(page, 4);
  });
  await run.step("\u2b50 DRAINED: the pending indicator is gone once back online", {}, async () => {
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === null;`, 30000);
  });
  await run.step("\u2b50 EMPTIED: the still-open list, refreshed, reads `No logs found.` \u2014 neither VERIFY_ASSET nor UPDATE_MOBILE_JOB_STATUS left (`PendingTransactionLogs.tsx:58`)", {}, async () => {
    await assertFromJavascript(page, `const title = [...document.querySelectorAll('h3')].find(h => (h.textContent || '').trim() === 'Pending Transactions');
const box = title && title.parentElement && title.parentElement.parentElement;
if (!box) return false;
const t = box.textContent || '';
if (t.includes('No logs found.') && !t.includes('VERIFY_ASSET')
    && !t.includes('UPDATE_MOBILE_JOB_STATUS')) return true;
const at = Number(sessionStorage.getItem('__dd913_refresh') || 0);
if (Date.now() - at > 2000) {
  sessionStorage.setItem('__dd913_refresh', String(Date.now()));
  const b = [...box.querySelectorAll('button')].find(x => (x.textContent || '').trim() === 'Refresh');
  if (b) b.click();
}
return false;`, 30000);
  });
  await run.step("Remove the refresh gate's sessionStorage key", {always: true}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd913_refresh');
return true;`, 15000);
  });
  await run.step("Close the list", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let it close", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await wait(page, 25);
  });
  await run.step("Test the job list rendered", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the lookup prefetch finished (feeds schemaQuery)", {}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open \"DATADOG MOBILE JOB\" by clicking its row (not a deep link)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`, 30000);
  });
  await run.step("Wait for the job detail to render", {}, async () => {
    await wait(page, 5);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Switch to the \"All\" filter", {}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="All"]]`, 30000);
  });
  await run.step("Wait for the All list to re-render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 SERVER HAS IT: after a reload the job reads \"1 out of 2 Assets Verified\"", {}, async () => {
    await assertPageContains(page, `1 out of 2 Assets Verified`, 30000);
  });
  await run.step("Dispatch a window 'online' event \u2014 the queue opens (`gateQueueLinkOnNetworkChange`, browser fallback)", {always: true}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
  });
  await run.step("Let the queue drain", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("RESTORE (leg 1): unverify every checked asset \u2014 the fixture's at rest is none", {always: true}, async () => {
    await assertFromJavascript(page, `[...document.querySelectorAll('input[type="checkbox"]')]
  .filter(b => b.checked).forEach(b => b.click());
return true;`, 20000);
  });
  await run.step("Let the unverify reach the server", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("Navigate to the mobile job list", {always: true}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin rendering", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {always: true}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {always: true}, async () => {
    await wait(page, 25);
  });
  await run.step("Test the job list rendered", {always: true}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the lookup prefetch finished (feeds schemaQuery)", {always: true}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {always: true}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {always: true}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open \"DATADOG MOBILE JOB\" by clicking its row (not a deep link)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`, 30000);
  });
  await run.step("Wait for the job detail to render", {always: true}, async () => {
    await wait(page, 5);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {always: true}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Switch to the \"All\" filter", {always: true}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="All"]]`, 30000);
  });
  await run.step("Wait for the All list to re-render", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED (leg 1): job back at rest (\"0 out of 2 Assets Verified\") after a reload", {always: true}, async () => {
    await assertPageContains(page, `0 out of 2 Assets Verified`, 30000);
  });
  await run.step("RESTORED (leg 1): nothing pending", {always: true}, async () => {
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === null;`, 30000);
  });
  await run.step("Dispatch a window 'offline' event \u2014 the queue closes (`gateQueueLinkOnNetworkChange`, browser fallback)", {}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
  });
  await run.step("Let the header re-render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("OFFLINE (leg 2): the offline icon is showing \u2014 the event was delivered", {}, async () => {
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi-slash"]');`, 20000);
  });
  await run.step("Verify the first asset (VERIFY_ASSET \u2014 optimistic)", {}, async () => {
    await click(page, `(//input[@type="checkbox"])[1]`, 30000);
  });
  await run.step("Let both mutations reach the closed queue", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 QUEUED (leg 2): the pending indicator reads 2 \u2014 `VERIFY_ASSET` and the `UPDATE_MOBILE_JOB_STATUS` its update() recomputes (READY \u2192 IN_PROGRESS)", {}, async () => {
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === '2';`, 20000);
  });
  await run.step("Hold offline \u2014 an in-flight request would have resolved by now", {}, async () => {
    await wait(page, 6);
  });
  await run.step("\u2b50 HELD (leg 2): still 2 pending after 6s offline \u2014 neither request left", {}, async () => {
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === '2';`, 10000);
  });
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await wait(page, 25);
  });
  await run.step("Test the job list rendered", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the lookup prefetch finished (feeds schemaQuery)", {}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open \"DATADOG MOBILE JOB\" by clicking its row (not a deep link)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`, 30000);
  });
  await run.step("Wait for the job detail to render", {}, async () => {
    await wait(page, 5);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Switch to the \"All\" filter", {}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="All"]]`, 30000);
  });
  await run.step("Wait for the All list to re-render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 REPLAYED: the reloaded app sent the persisted op \u2014 \"1 out of 2 Assets Verified\"", {}, async () => {
    await assertPageContains(page, `1 out of 2 Assets Verified`, 30000);
  });
  await run.step("\u2b50 \u2026and nothing is pending any more (IndexedDB drained on startup)", {}, async () => {
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === null;`, 30000);
  });
  await run.step("Dispatch a window 'online' event \u2014 the queue opens (`gateQueueLinkOnNetworkChange`, browser fallback)", {always: true}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
  });
  await run.step("Let the queue drain", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("RESTORE (leg 2): unverify every checked asset \u2014 the fixture's at rest is none", {always: true}, async () => {
    await assertFromJavascript(page, `[...document.querySelectorAll('input[type="checkbox"]')]
  .filter(b => b.checked).forEach(b => b.click());
return true;`, 20000);
  });
  await run.step("Let the unverify reach the server", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("Navigate to the mobile job list", {always: true}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin rendering", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {always: true}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {always: true}, async () => {
    await wait(page, 25);
  });
  await run.step("Test the job list rendered", {always: true}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the lookup prefetch finished (feeds schemaQuery)", {always: true}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {always: true}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {always: true}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open \"DATADOG MOBILE JOB\" by clicking its row (not a deep link)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`, 30000);
  });
  await run.step("Wait for the job detail to render", {always: true}, async () => {
    await wait(page, 5);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {always: true}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Switch to the \"All\" filter", {always: true}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="All"]]`, 30000);
  });
  await run.step("Wait for the All list to re-render", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED (leg 2): job back at rest (\"0 out of 2 Assets Verified\") after a reload", {always: true}, async () => {
    await assertPageContains(page, `0 out of 2 Assets Verified`, 30000);
  });
  await run.step("RESTORED (leg 2): nothing pending", {always: true}, async () => {
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === null;`, 30000);
  });
  run.finish();
}
