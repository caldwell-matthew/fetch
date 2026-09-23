// Generated from Mobile/dd_tests_mobile/MOB.550_AssetVerify_Event_Readings.json by to_playwright.py — do not edit by hand yet.
// MOB.550_AssetVerify_Event_Readings

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../support/dd';

export async function mob550(page: Page): Promise<void> {
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
  await run.step("Open Tank 0000's full-page detail", {}, async () => {
    await click(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`, 30000);
  });
  await run.step("Wait for the asset detail route", {}, async () => {
    await wait(page, 6);
  });
  await run.step("The full-page asset detail rendered", {}, async () => {
    await assertPageContains(page, `Asset Type:`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the Event Readings tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Event Readings")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the Event Readings panel", {}, async () => {
    await wait(page, 3);
  });
  await run.step("FIELD GUARD: the readings form rendered", {}, async () => {
    await assertElementPresent(page, `(//form[@id="av-event-readings"]//input)[1]`, DEFAULT_TIMEOUT);
  });
  await run.step("SERVER PROOF: a previous run's reading (4242 or 1337) came back from the server on a COLD cache", {}, async () => {
    await assertFromJavascript(page, `const form = document.querySelector('#av-event-readings');
if (!form) return false;
const boxes = form.querySelectorAll(':scope > div > div');
const first = boxes[0];
if (!first) return false;
const txt = first.textContent || '';
return ['4242', '1337'].some(v => txt.indexOf(v) !== -1);`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the first reading field (leg 1)", {always: true}, async () => {
    await click(page, `(//form[@id="av-event-readings"]//input)[1]`, DEFAULT_TIMEOUT);
  });
  await run.step("Enter a reading of 4242", {always: true}, async () => {
    await typeText(page, `(//form[@id="av-event-readings"]//input)[1]`, `4242`, DEFAULT_TIMEOUT);
  });
  await run.step("Tab out to trigger the form's onBlur (arms the Submit button)", {always: true}, async () => {
    await press(page, `Tab`);
  });
  await run.step("Let the blur handler re-render the footer", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Submit the readings", {always: true}, async () => {
    await click(page, `//button[@form="av-event-readings"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Brief wait for the toast", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Readings captured toast (optional: transient, and it fires unconditionally)", {always: true, allow: 'ignore'}, async () => {
    await assertPageContains(page, `Event readings captured.`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the field remount with the new previous-entry", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("The reading 4242 is now rendered as the field's previous entry (leg 1)", {always: true}, async () => {
    await assertFromJavascript(page, `const form = document.querySelector('#av-event-readings');
if (!form) return false;
const boxes = form.querySelectorAll(':scope > div > div');
const first = boxes[0];
if (!first) return false;
const txt = first.textContent || '';
return ['4242'].some(v => txt.indexOf(v) !== -1);`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the first reading field (leg 2 - leaves the known end state)", {always: true}, async () => {
    await click(page, `(//form[@id="av-event-readings"]//input)[1]`, DEFAULT_TIMEOUT);
  });
  await run.step("Enter a reading of 1337", {always: true}, async () => {
    await typeText(page, `(//form[@id="av-event-readings"]//input)[1]`, `1337`, DEFAULT_TIMEOUT);
  });
  await run.step("Tab out to trigger the form's onBlur (arms the Submit button)", {always: true}, async () => {
    await press(page, `Tab`);
  });
  await run.step("Let the blur handler re-render the footer", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Submit the readings", {always: true}, async () => {
    await click(page, `//button[@form="av-event-readings"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Brief wait for the toast", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Readings captured toast (optional: transient, and it fires unconditionally)", {always: true, allow: 'ignore'}, async () => {
    await assertPageContains(page, `Event readings captured.`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the field remount with the new previous-entry", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("The reading 1337 is now rendered as the field's previous entry (leg 2 - leaves the known end state)", {always: true}, async () => {
    await assertFromJavascript(page, `const form = document.querySelector('#av-event-readings');
if (!form) return false;
const boxes = form.querySelectorAll(':scope > div > div');
const first = boxes[0];
if (!first) return false;
const txt = first.textContent || '';
return ['1337'].some(v => txt.indexOf(v) !== -1);`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
