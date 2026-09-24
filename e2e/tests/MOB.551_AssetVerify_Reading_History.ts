// Generated from legacy/Mobile/dd_tests_mobile/MOB.551_AssetVerify_Reading_History.json by to_playwright.py — do not edit by hand yet.
// MOB.551_AssetVerify_Reading_History

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../support/dd';

export async function mob551(page: Page): Promise<void> {
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
  await run.step("Expand the \"Tank 0000\" row by its CHEVRON (the name navigates away)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`, 30000);
  });
  await run.step("Let the detail panel mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Open the \"Readings\" tab", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[@role="tab"][normalize-space(.)="Readings"]`, 30000);
  });
  await run.step("Let the readings panel mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Readings\" tab is active", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[@role="tab"][normalize-space(.)="Readings"][@data-active]`, 30000);
  });
  await run.step("FIXTURE GUARD: \"Tank 0000\" has a reading with a history icon (MOB.550 residue)", {allow: 'soft'}, async () => {
    await assertElementPresent(page, `((//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[@data-icon="clock-rotate-left" or contains(concat(" ", normalize-space(@class), " "), " fa-clock-rotate-left ") or @data-icon="history" or contains(concat(" ", normalize-space(@class), " "), " fa-history ")])[1]`, 30000);
  });
  await run.step("BASELINE: no popover dropdown is open", {}, async () => {
    await assertFromJavascript(page, `return document.querySelectorAll('.mantine-Popover-dropdown').length === 0;`, 30000);
  });
  await run.step("Open the reading history popover (the clock icon)", {}, async () => {
    await click(page, `((//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[@data-icon="clock-rotate-left" or contains(concat(" ", normalize-space(@class), " "), " fa-clock-rotate-left ") or @data-icon="history" or contains(concat(" ", normalize-space(@class), " "), " fa-history ")])[1]`, 30000);
  });
  await run.step("Let the popover mount and its history query fire", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 OPEN: exactly one dropdown, and it names a reading type (its bold heading)", {}, async () => {
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
const head = d.querySelector('p, span, div');
return !!head && (head.textContent || '').trim().length > 0;`, 30000);
  });
  await run.step("\u2b50 RESOLVED: EXACTLY ONE of `No readings recorded.` or >= 1 timeline item \u2014 `Loading history...` is neither, so this polls until the fetch lands", {}, async () => {
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
const items = d.querySelectorAll('[class*="mantine-Timeline-item"]').length;
if (/Loading history\\.\\.\\./.test(txt)) return false;
const empty = txt.includes('No readings recorded.');
return empty !== (items > 0);`, 45000);
  });
  await run.step("VIEW 1: the Timeline container is present and the chart is NOT", {}, async () => {
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
const chart = !!d.querySelector('.recharts-responsive-container, .recharts-wrapper');
const timeline = !!d.querySelector('[class*="mantine-Timeline-root"]');
return timeline && !chart;`, 30000);
  });
  await run.step("Toggle to the chart (the dropdown's ActionIcon)", {}, async () => {
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
const b = d.querySelector('button');
if (!b) return false;
b.click();
return true;`, 30000);
  });
  await run.step("Let the chart render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 VIEW 2: the chart container is present and the Timeline is NOT \u2014 the biconditional closes", {}, async () => {
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
const chart = !!d.querySelector('.recharts-responsive-container, .recharts-wrapper');
const timeline = !!d.querySelector('[class*="mantine-Timeline-root"]');
return chart && !timeline;`, 30000);
  });
  await run.step("Toggle back to the timeline", {always: true}, async () => {
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
const b = d.querySelector('button');
if (!b) return false;
b.click();
return true;`, 30000);
  });
  await run.step("Let the timeline render", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: Timeline back, chart gone", {always: true}, async () => {
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
const chart = !!d.querySelector('.recharts-responsive-container, .recharts-wrapper');
const timeline = !!d.querySelector('[class*="mantine-Timeline-root"]');
return timeline && !chart;`, 30000);
  });
  await run.step("BASELINE: the offline message is NOT in the dropdown while online", {}, async () => {
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
return !txt.includes('This feature requires an internet connection.');`, 30000);
  });
  await run.step("Dispatch a window 'offline' event (MOB.910's technique \u2014 `useNetwork` flips)", {}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline')); return true;`, DEFAULT_TIMEOUT);
  });
  await run.step("Let React re-render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 OFFLINE: the dropdown shows the offline message", {}, async () => {
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
return txt.includes('This feature requires an internet connection.');`, 30000);
  });
  await run.step("Dispatch a window 'online' event", {always: true}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online')); return true;`, DEFAULT_TIMEOUT);
  });
  await run.step("Let React re-render", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: the offline message is gone again", {always: true}, async () => {
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Popover-dropdown');
if (dds.length !== 1) return false;
const d = dds[0];
const txt = d.textContent || '';
return !txt.includes('This feature requires an internet connection.');`, 30000);
  });
  await run.step("Close the popover by clicking its icon again", {always: true}, async () => {
    await click(page, `((//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[@data-icon="clock-rotate-left" or contains(concat(" ", normalize-space(@class), " "), " fa-clock-rotate-left ") or @data-icon="history" or contains(concat(" ", normalize-space(@class), " "), " fa-history ")])[1]`, 30000);
  });
  await run.step("Let it close", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("RESTORED: no popover dropdown is open", {always: true}, async () => {
    await assertFromJavascript(page, `return document.querySelectorAll('.mantine-Popover-dropdown').length === 0;`, 30000);
  });
  await run.step("Collapse the row again", {always: true}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`, 30000);
  });
  await run.step("Let the panel close", {always: true}, async () => {
    await wait(page, 2);
  });
  run.finish();
}
