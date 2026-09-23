// Generated from Mobile/dd_tests_mobile/MOB.536_AssetVerify_Job_Status_Menu.json by to_playwright.py — do not edit by hand yet.
// MOB.536_AssetVerify_Job_Status_Menu

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob536(page: Page): Promise<void> {
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
    // PREMISE: the job is not canceled (no alert) — at rest READY
    await assertFromJavascript(page, `const t = (document.body.textContent || '');
return !t.includes('This verification job has been canceled.');`, 30000);
    // Open the job's status menu (the dot beside its title)
    await assertFromJavascript(page, `const title = [...document.querySelectorAll('[class*="mantine-Title-root"]')]
  .find(h => (h.textContent || '').includes('DATADOG MOBILE JOB'));
const row = title && title.closest('[class*="mantine-Flex-root"]');
const dot = row && row.querySelector('[class*="mantine-Indicator-root"]');
if (!dot) return false;
dot.click();
return true;`, 30000);
    // Let the menu open
    await wait(page, 1);
    // MENU: exactly READY's three exits — `Mark as IN PROGRESS`, `Mark as COMPLETED`, `Mark as CANCELED` (never the current status, and READY is never an item)
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()).filter(x => x.indexOf('Mark as') === 0);
const want = ['Mark as IN PROGRESS', 'Mark as COMPLETED', 'Mark as CANCELED'];
return items.length === want.length && want.every(w => items.includes(w));`, 20000);
    // Mark as CANCELED
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Mark as CANCELED"])[1]`).click({ timeout: 30000 });
    // Let the status change render
    await wait(page, 3);
    // ⭐ CANCELED: `This verification job has been canceled.` is shown (`Job.tsx`)
    await assertFromJavascript(page, `const t = (document.body.textContent || '');
return t.includes('This verification job has been canceled.');`, 30000);
    // Open the job's status menu (the dot beside its title)
    await assertFromJavascript(page, `const title = [...document.querySelectorAll('[class*="mantine-Title-root"]')]
  .find(h => (h.textContent || '').includes('DATADOG MOBILE JOB'));
const row = title && title.closest('[class*="mantine-Flex-root"]');
const dot = row && row.querySelector('[class*="mantine-Indicator-root"]');
if (!dot) return false;
dot.click();
return true;`, 30000);
    // Let the menu open
    await wait(page, 1);
    // Mark as IN PROGRESS
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Mark as IN PROGRESS"])[1]`).click({ timeout: 30000 });
    // Let the status change render
    await wait(page, 3);
    // BACK IN PROGRESS: the canceled alert is gone
    await assertFromJavascript(page, `const t = (document.body.textContent || '');
return !t.includes('This verification job has been canceled.');`, 30000);
    // Open the job's status menu to read its exits
    await assertFromJavascript(page, `const title = [...document.querySelectorAll('[class*="mantine-Title-root"]')]
  .find(h => (h.textContent || '').includes('DATADOG MOBILE JOB'));
const row = title && title.closest('[class*="mantine-Flex-root"]');
const dot = row && row.querySelector('[class*="mantine-Indicator-root"]');
if (!dot) return false;
dot.click();
return true;`, 30000);
    // Let the menu open
    await wait(page, 1);
    // ⭐ BACK IN PROGRESS (`Mark as COMPLETED` + `Mark as CANCELED`): the menu offers exactly IN PROGRESS's exits
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()).filter(x => x.indexOf('Mark as') === 0);
const want = ['Mark as COMPLETED', 'Mark as CANCELED'];
return items.length === want.length && want.every(w => items.includes(w));`, 20000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Close the menu (Escape — nothing picked)
    await page.keyboard.press(`Escape`);
    // Let it close
    await wait(page, 1);
    // RESTORE: if the job still reads canceled, open its status menu
    await assertFromJavascript(page, `const t = (document.body.textContent || '');
if (!t.includes('This verification job has been canceled.')) return true;
const title = [...document.querySelectorAll('[class*="mantine-Title-root"]')]
  .find(h => (h.textContent || '').includes('DATADOG MOBILE JOB'));
const row = title && title.closest('[class*="mantine-Flex-root"]');
const dot = row && row.querySelector('[class*="mantine-Indicator-root"]');
if (!dot) return false;
dot.click();
return true;`, 20000);
    // RESTORE: …and pick `Mark as IN PROGRESS` (only if the menu is open)
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Menu-item')]
  .find(i => (i.textContent || '').trim() === 'Mark as IN PROGRESS');
if (it) it.click();
return true;`, 15000);
    // Let the status reach the server
    await wait(page, 4);
    // Put the asset filter on All (it persists across subtests)
    await assertFromJavascript(page, `const lbl = [...document.querySelectorAll('label')]
  .find(l => (l.textContent || '').trim() === 'All');
if (lbl) lbl.click();
return true;`, 20000);
    // Let the list re-render
    await wait(page, 2);
    // BACK TO READY: verify Tank 0000
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`).click({ timeout: 30000 });
    // Wait for the verify mutation
    await wait(page, 4);
    // BACK TO READY: unverify Tank 0000 — 0 of 2 verified recomputes the job to READY
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`).click({ timeout: 30000 });
    // Wait for the unverify mutation and the status it recomputes
    await wait(page, 5);
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
    // After a reload: the job is in the crew's list again, with no canceled alert
    await assertFromJavascript(page, `const t = (document.body.textContent || '');
return t.includes('DATADOG MOBILE JOB') && !t.includes('This verification job has been canceled.');`, 30000);
    // Open the job's status menu to read its exits
    await assertFromJavascript(page, `const title = [...document.querySelectorAll('[class*="mantine-Title-root"]')]
  .find(h => (h.textContent || '').includes('DATADOG MOBILE JOB'));
const row = title && title.closest('[class*="mantine-Flex-root"]');
const dot = row && row.querySelector('[class*="mantine-Indicator-root"]');
if (!dot) return false;
dot.click();
return true;`, 30000);
    // Let the menu open
    await wait(page, 1);
    // ⭐ SERVER (after a reload — UPDATE_MOBILE_JOB_STATUS is optimistic, so the reload is server-acknowledged, and READY means the recompute landed) (all three exits — the menu cannot offer the current status, and never offers READY): the menu offers exactly READY's exits
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()).filter(x => x.indexOf('Mark as') === 0);
const want = ['Mark as IN PROGRESS', 'Mark as COMPLETED', 'Mark as CANCELED'];
return items.length === want.length && want.every(w => items.includes(w));`, 20000);
    // Close the menu (Escape — nothing picked)
    await page.keyboard.press(`Escape`);
    // Let it close
    await wait(page, 1);
  }
}
