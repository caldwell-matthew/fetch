// Generated from Mobile/dd_tests_mobile/MOB.913_Offline_Transaction_Queue.json by to_playwright.py — do not edit by hand yet.
// MOB.913_Offline_Transaction_Queue

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';

export async function mob913(page: Page): Promise<void> {
  try {
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Let the page begin rendering
    await wait(page, 3);
    // Test the "Mobile Jobs" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
    // Wait for the lookup prefetch and batched detail downloads
    await wait(page, 25);
    // Test the job list rendered
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
    // Test the lookup prefetch finished (feeds schemaQuery)
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
    // Test the batched job-detail downloads finished
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    // FIXTURE GUARD: "DATADOG MOBILE JOB" is in this crew's list
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open "DATADOG MOBILE JOB" by clicking its row (not a deep link)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`).click({ timeout: 30000 });
    // Wait for the job detail to render
    await wait(page, 5);
    // ASSET LIST GUARD: the job's asset rows have rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
    // Switch to the "All" filter
    await el(page, `//label[.//span[normalize-space(.)="All"]]`).click({ timeout: 30000 });
    // Wait for the All list to re-render
    await wait(page, 2);
    // FIXTURE GUARD (leg 1): job at rest ("0 out of 2 Assets Verified")
    await assertPageContains(page, `0 out of 2 Assets Verified`, 30000);
    // BASELINE (leg 1): no pending-transactions indicator, and the online wifi icon is showing (the header rendered)
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === null && !!document.querySelector('[data-icon="wifi"]');`, 30000);
    // Dispatch a window 'offline' event — the queue closes (`gateQueueLinkOnNetworkChange`, browser fallback)
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
    // Let the header re-render
    await wait(page, 2);
    // OFFLINE (leg 1): the offline icon is showing — the event was delivered
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi-slash"]');`, 20000);
    // Verify the first asset (VERIFY_ASSET — optimistic)
    await el(page, `(//input[@type="checkbox"])[1]`).click({ timeout: 30000 });
    // Let both mutations reach the closed queue
    await wait(page, 2);
    // ⭐ QUEUED (leg 1): the pending indicator reads 2 — `VERIFY_ASSET` and the `UPDATE_MOBILE_JOB_STATUS` its update() recomputes (READY → IN_PROGRESS)
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === '2';`, 20000);
    // Hold offline — an in-flight request would have resolved by now
    await wait(page, 6);
    // ⭐ HELD (leg 1): still 2 pending after 6s offline — neither request left
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === '2';`, 10000);
    // Open the pending-transactions list (the indicator's icon)
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
if (!up) return false;
up.dispatchEvent(new MouseEvent('click', { bubbles: true }));
return true;`, 20000);
    // Let the list read IndexedDB
    await wait(page, 2);
    // ⭐ LISTED: `Pending Transactions` shows BOTH held operations — `VERIFY_ASSET` with verified:true, and `UPDATE_MOBILE_JOB_STATUS` with IN_PROGRESS
    await assertFromJavascript(page, `const t = (document.body.textContent || '');
return t.includes('Pending Transactions') && t.includes('VERIFY_ASSET')
  && /"verified":\\s*true/.test(t)
  && t.includes('UPDATE_MOBILE_JOB_STATUS')
  && /"status":\\s*"IN_PROGRESS"/.test(t);`, 20000);
    await optional("UI (optional: records whether the job counter follows the optimistic verify while it is unsent)", async () => {
      await assertFromJavascript(page, `const t = (document.body.textContent || '');
return t.includes('1 out of 2 Assets Verified');`, 10000);
    });
    // Dispatch a window 'online' event — the queue opens (`gateQueueLinkOnNetworkChange`, browser fallback)
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
    // Let the queue drain
    await wait(page, 4);
    // ⭐ DRAINED: the pending indicator is gone once back online
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === null;`, 30000);
    // ⭐ EMPTIED: the still-open list, refreshed, reads `No logs found.` — neither VERIFY_ASSET nor UPDATE_MOBILE_JOB_STATUS left (`PendingTransactionLogs.tsx:58`)
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
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Let the page begin rendering
    await wait(page, 3);
    // Test the "Mobile Jobs" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
    // Wait for the lookup prefetch and batched detail downloads
    await wait(page, 25);
    // Test the job list rendered
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
    // Test the lookup prefetch finished (feeds schemaQuery)
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
    // Test the batched job-detail downloads finished
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    // FIXTURE GUARD: "DATADOG MOBILE JOB" is in this crew's list
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open "DATADOG MOBILE JOB" by clicking its row (not a deep link)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`).click({ timeout: 30000 });
    // Wait for the job detail to render
    await wait(page, 5);
    // ASSET LIST GUARD: the job's asset rows have rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
    // Switch to the "All" filter
    await el(page, `//label[.//span[normalize-space(.)="All"]]`).click({ timeout: 30000 });
    // Wait for the All list to re-render
    await wait(page, 2);
    // ⭐ SERVER HAS IT: after a reload the job reads "1 out of 2 Assets Verified"
    await assertPageContains(page, `1 out of 2 Assets Verified`, 30000);
    // Dispatch a window 'offline' event — the queue closes (`gateQueueLinkOnNetworkChange`, browser fallback)
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
    // Let the header re-render
    await wait(page, 2);
    // OFFLINE (leg 2): the offline icon is showing — the event was delivered
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi-slash"]');`, 20000);
    // Verify the first asset (VERIFY_ASSET — optimistic)
    await el(page, `(//input[@type="checkbox"])[1]`).click({ timeout: 30000 });
    // Let both mutations reach the closed queue
    await wait(page, 2);
    // ⭐ QUEUED (leg 2): the pending indicator reads 2 — `VERIFY_ASSET` and the `UPDATE_MOBILE_JOB_STATUS` its update() recomputes (READY → IN_PROGRESS)
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === '2';`, 20000);
    // Hold offline — an in-flight request would have resolved by now
    await wait(page, 6);
    // ⭐ HELD (leg 2): still 2 pending after 6s offline — neither request left
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === '2';`, 10000);
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Let the page begin rendering
    await wait(page, 3);
    // Test the "Mobile Jobs" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
    // Wait for the lookup prefetch and batched detail downloads
    await wait(page, 25);
    // Test the job list rendered
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
    // Test the lookup prefetch finished (feeds schemaQuery)
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
    // Test the batched job-detail downloads finished
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    // FIXTURE GUARD: "DATADOG MOBILE JOB" is in this crew's list
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open "DATADOG MOBILE JOB" by clicking its row (not a deep link)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`).click({ timeout: 30000 });
    // Wait for the job detail to render
    await wait(page, 5);
    // ASSET LIST GUARD: the job's asset rows have rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
    // Switch to the "All" filter
    await el(page, `//label[.//span[normalize-space(.)="All"]]`).click({ timeout: 30000 });
    // Wait for the All list to re-render
    await wait(page, 2);
    // ⭐ REPLAYED: the reloaded app sent the persisted op — "1 out of 2 Assets Verified"
    await assertPageContains(page, `1 out of 2 Assets Verified`, 30000);
    // ⭐ …and nothing is pending any more (IndexedDB drained on startup)
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === null;`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the refresh gate's sessionStorage key
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd913_refresh');
return true;`, 15000);
    // Close the list
    await page.keyboard.press(`Escape`);
    // Let it close
    await wait(page, 1);
    // Dispatch a window 'online' event — the queue opens (`gateQueueLinkOnNetworkChange`, browser fallback)
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
    // Let the queue drain
    await wait(page, 4);
    // RESTORE (leg 1): unverify every checked asset — the fixture's at rest is none
    await assertFromJavascript(page, `[...document.querySelectorAll('input[type="checkbox"]')]
  .filter(b => b.checked).forEach(b => b.click());
return true;`, 20000);
    // Let the unverify reach the server
    await wait(page, 4);
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Let the page begin rendering
    await wait(page, 3);
    // Test the "Mobile Jobs" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
    // Wait for the lookup prefetch and batched detail downloads
    await wait(page, 25);
    // Test the job list rendered
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
    // Test the lookup prefetch finished (feeds schemaQuery)
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
    // Test the batched job-detail downloads finished
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    // FIXTURE GUARD: "DATADOG MOBILE JOB" is in this crew's list
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open "DATADOG MOBILE JOB" by clicking its row (not a deep link)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`).click({ timeout: 30000 });
    // Wait for the job detail to render
    await wait(page, 5);
    // ASSET LIST GUARD: the job's asset rows have rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
    // Switch to the "All" filter
    await el(page, `//label[.//span[normalize-space(.)="All"]]`).click({ timeout: 30000 });
    // Wait for the All list to re-render
    await wait(page, 2);
    // RESTORED (leg 1): job back at rest ("0 out of 2 Assets Verified") after a reload
    await assertPageContains(page, `0 out of 2 Assets Verified`, 30000);
    // RESTORED (leg 1): nothing pending
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === null;`, 30000);
    // Dispatch a window 'online' event — the queue opens (`gateQueueLinkOnNetworkChange`, browser fallback)
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
    // Let the queue drain
    await wait(page, 4);
    // RESTORE (leg 2): unverify every checked asset — the fixture's at rest is none
    await assertFromJavascript(page, `[...document.querySelectorAll('input[type="checkbox"]')]
  .filter(b => b.checked).forEach(b => b.click());
return true;`, 20000);
    // Let the unverify reach the server
    await wait(page, 4);
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Let the page begin rendering
    await wait(page, 3);
    // Test the "Mobile Jobs" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
    // Wait for the lookup prefetch and batched detail downloads
    await wait(page, 25);
    // Test the job list rendered
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
    // Test the lookup prefetch finished (feeds schemaQuery)
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
    // Test the batched job-detail downloads finished
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    // FIXTURE GUARD: "DATADOG MOBILE JOB" is in this crew's list
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open "DATADOG MOBILE JOB" by clicking its row (not a deep link)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`).click({ timeout: 30000 });
    // Wait for the job detail to render
    await wait(page, 5);
    // ASSET LIST GUARD: the job's asset rows have rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
    // Switch to the "All" filter
    await el(page, `//label[.//span[normalize-space(.)="All"]]`).click({ timeout: 30000 });
    // Wait for the All list to re-render
    await wait(page, 2);
    // RESTORED (leg 2): job back at rest ("0 out of 2 Assets Verified") after a reload
    await assertPageContains(page, `0 out of 2 Assets Verified`, 30000);
    // RESTORED (leg 2): nothing pending
    await assertFromJavascript(page, `const up = document.querySelector('svg[data-icon="upload"]');
const root = up && up.closest('[class*="mantine-Indicator-root"]');
const lab = root && root.querySelector('[class*="mantine-Indicator-indicator"]');
const pending = lab ? (lab.textContent || '').trim() : null;
return pending === null;`, 30000);
  }
}
