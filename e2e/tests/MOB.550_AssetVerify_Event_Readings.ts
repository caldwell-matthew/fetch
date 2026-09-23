// Generated from Mobile/dd_tests_mobile/MOB.550_AssetVerify_Event_Readings.json by to_playwright.py — do not edit by hand yet.
// MOB.550_AssetVerify_Event_Readings

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';

export async function mob550(page: Page): Promise<void> {
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
    // Open Tank 0000's full-page detail
    await el(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`).click({ timeout: 30000 });
    // Wait for the asset detail route
    await wait(page, 6);
    // The full-page asset detail rendered
    await assertPageContains(page, `Asset Type:`, DEFAULT_TIMEOUT);
    // Open the Event Readings tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Event Readings")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the Event Readings panel
    await wait(page, 3);
    // FIELD GUARD: the readings form rendered
    await assertElementPresent(page, `(//form[@id="av-event-readings"]//input)[1]`, DEFAULT_TIMEOUT);
    // SERVER PROOF: a previous run's reading (4242 or 1337) came back from the server on a COLD cache
    await assertFromJavascript(page, `const form = document.querySelector('#av-event-readings');
if (!form) return false;
const boxes = form.querySelectorAll(':scope > div > div');
const first = boxes[0];
if (!first) return false;
const txt = first.textContent || '';
return ['4242', '1337'].some(v => txt.indexOf(v) !== -1);`, DEFAULT_TIMEOUT);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Focus the first reading field (leg 1)
    await el(page, `(//form[@id="av-event-readings"]//input)[1]`).click({ timeout: DEFAULT_TIMEOUT });
    // Enter a reading of 4242
    await el(page, `(//form[@id="av-event-readings"]//input)[1]`).fill(`4242`, { timeout: DEFAULT_TIMEOUT });
    // Tab out to trigger the form's onBlur (arms the Submit button)
    await page.keyboard.press(`Tab`);
    // Let the blur handler re-render the footer
    await wait(page, 2);
    // Submit the readings
    await el(page, `//button[@form="av-event-readings"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Brief wait for the toast
    await wait(page, 2);
    await optional("Readings captured toast (optional: transient, and it fires unconditionally)", async () => {
      await assertPageContains(page, `Event readings captured.`, DEFAULT_TIMEOUT);
    });
    // Let the field remount with the new previous-entry
    await wait(page, 3);
    // The reading 4242 is now rendered as the field's previous entry (leg 1)
    await assertFromJavascript(page, `const form = document.querySelector('#av-event-readings');
if (!form) return false;
const boxes = form.querySelectorAll(':scope > div > div');
const first = boxes[0];
if (!first) return false;
const txt = first.textContent || '';
return ['4242'].some(v => txt.indexOf(v) !== -1);`, DEFAULT_TIMEOUT);
    // Focus the first reading field (leg 2 - leaves the known end state)
    await el(page, `(//form[@id="av-event-readings"]//input)[1]`).click({ timeout: DEFAULT_TIMEOUT });
    // Enter a reading of 1337
    await el(page, `(//form[@id="av-event-readings"]//input)[1]`).fill(`1337`, { timeout: DEFAULT_TIMEOUT });
    // Tab out to trigger the form's onBlur (arms the Submit button)
    await page.keyboard.press(`Tab`);
    // Let the blur handler re-render the footer
    await wait(page, 2);
    // Submit the readings
    await el(page, `//button[@form="av-event-readings"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Brief wait for the toast
    await wait(page, 2);
    await optional("Readings captured toast (optional: transient, and it fires unconditionally)", async () => {
      await assertPageContains(page, `Event readings captured.`, DEFAULT_TIMEOUT);
    });
    // Let the field remount with the new previous-entry
    await wait(page, 3);
    // The reading 1337 is now rendered as the field's previous entry (leg 2 - leaves the known end state)
    await assertFromJavascript(page, `const form = document.querySelector('#av-event-readings');
if (!form) return false;
const boxes = form.querySelectorAll(':scope > div > div');
const first = boxes[0];
if (!first) return false;
const txt = first.textContent || '';
return ['1337'].some(v => txt.indexOf(v) !== -1);`, DEFAULT_TIMEOUT);
  }
}
