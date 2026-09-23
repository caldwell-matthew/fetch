// Generated from Mobile/dd_tests_mobile/MOB.551_AssetVerify_Reading_History.json by to_playwright.py — do not edit by hand yet.
// MOB.551_AssetVerify_Reading_History

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob551(page: Page): Promise<void> {
  const soft = new Soft();
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
    // Expand the "Tank 0000" row by its CHEVRON (the name navigates away)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`).click({ timeout: 30000 });
    // Let the detail panel mount
    await wait(page, 3);
    // Open the "Readings" tab
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[@role="tab"][normalize-space(.)="Readings"]`).click({ timeout: 30000 });
    // Let the readings panel mount
    await wait(page, 3);
    // The "Readings" tab is active
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[@role="tab"][normalize-space(.)="Readings"][@data-active]`, 30000);
    await soft.run("FIXTURE GUARD: \"Tank 0000\" has a reading with a history icon (MOB.550 residue)", async () => {
      await assertElementPresent(page, `((//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[@data-icon="clock-rotate-left" or contains(concat(" ", normalize-space(@class), " "), " fa-clock-rotate-left ") or @data-icon="history" or contains(concat(" ", normalize-space(@class), " "), " fa-history ")])[1]`, 30000);
    });
    // BASELINE: no popover dropdown is open
    await assertFromJavascript(page, `return document.querySelectorAll('.mantine-Popover-dropdown').length === 0;`, 30000);
    // Open the reading history popover (the clock icon)
    await el(page, `((//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[@data-icon="clock-rotate-left" or contains(concat(" ", normalize-space(@class), " "), " fa-clock-rotate-left ") or @data-icon="history" or contains(concat(" ", normalize-space(@class), " "), " fa-history ")])[1]`).click({ timeout: 30000 });
    // Let the popover mount and its history query fire
    await wait(page, 2);
    // ⭐ OPEN: exactly one dropdown, and it names a reading type (its bold heading)
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
const head = d.querySelector('p, span, div');
return !!head && (head.textContent || '').trim().length > 0;`, 30000);
    // ⭐ RESOLVED: EXACTLY ONE of `No readings recorded.` or >= 1 timeline item — `Loading history...` is neither, so this polls until the fetch lands
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
const items = d.querySelectorAll('[class*="mantine-Timeline-item"]').length;
if (/Loading history\\.\\.\\./.test(txt)) return false;
const empty = txt.includes('No readings recorded.');
return empty !== (items > 0);`, 45000);
    // VIEW 1: the Timeline container is present and the chart is NOT
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
const chart = !!d.querySelector('.recharts-responsive-container, .recharts-wrapper');
const timeline = !!d.querySelector('[class*="mantine-Timeline-root"]');
return timeline && !chart;`, 30000);
    // Toggle to the chart (the dropdown's ActionIcon)
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
const b = d.querySelector('button');
if (!b) return false;
b.click();
return true;`, 30000);
    // Let the chart render
    await wait(page, 2);
    // ⭐ VIEW 2: the chart container is present and the Timeline is NOT — the biconditional closes
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
const chart = !!d.querySelector('.recharts-responsive-container, .recharts-wrapper');
const timeline = !!d.querySelector('[class*="mantine-Timeline-root"]');
return chart && !timeline;`, 30000);
    // BASELINE: the offline message is NOT in the dropdown while online
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
return !txt.includes('This feature requires an internet connection.');`, 30000);
    // Dispatch a window 'offline' event (MOB.910's technique — `useNetwork` flips)
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline')); return true;`, DEFAULT_TIMEOUT);
    // Let React re-render
    await wait(page, 2);
    // ⭐ OFFLINE: the dropdown shows the offline message
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
return txt.includes('This feature requires an internet connection.');`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Toggle back to the timeline
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
const b = d.querySelector('button');
if (!b) return false;
b.click();
return true;`, 30000);
    // Let the timeline render
    await wait(page, 2);
    // RESTORED: Timeline back, chart gone
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
const chart = !!d.querySelector('.recharts-responsive-container, .recharts-wrapper');
const timeline = !!d.querySelector('[class*="mantine-Timeline-root"]');
return timeline && !chart;`, 30000);
    // Dispatch a window 'online' event
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online')); return true;`, DEFAULT_TIMEOUT);
    // Let React re-render
    await wait(page, 2);
    // RESTORED: the offline message is gone again
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
return !txt.includes('This feature requires an internet connection.');`, 30000);
    // Close the popover by clicking its icon again
    await el(page, `((//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[@data-icon="clock-rotate-left" or contains(concat(" ", normalize-space(@class), " "), " fa-clock-rotate-left ") or @data-icon="history" or contains(concat(" ", normalize-space(@class), " "), " fa-history ")])[1]`).click({ timeout: 30000 });
    // Let it close
    await wait(page, 1);
    // RESTORED: no popover dropdown is open
    await assertFromJavascript(page, `return document.querySelectorAll('.mantine-Popover-dropdown').length === 0;`, 30000);
    // Collapse the row again
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`).click({ timeout: 30000 });
    // Let the panel close
    await wait(page, 2);
  }
  soft.check();
}
