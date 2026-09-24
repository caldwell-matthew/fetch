// Generated from legacy/Mobile/dd_tests_mobile/MOB.348_Work_MapLink.json by to_playwright.py — do not edit by hand yet.
// MOB.348_Work_MapLink

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, wait } from '../support/dd';

export async function mob348(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 warm the work lookup cache", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Let the lookup prefetch run", {}, async () => {
    await wait(page, 30);
  });
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("GATE 1/2: the /work/:id route mounted", {}, async () => {
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, 60000);
  });
  await run.step("GATE 2/2: the detail data arrived (tab strip)", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
  });
  await run.step("The MapLink globe control renders on the title", {}, async () => {
    await assertElementPresent(page, `//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]`, 60000);
  });
  await run.step("Open the MapLink menu", {}, async () => {
    await click(page, `(//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]])[1]`, 30000);
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The menu offers \"View in Map\" (asserted, NEVER clicked \u2014 it navigates away to /map)", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="View in Map"]`, 30000);
  });
  await run.step("The menu offers \"Edit Location\"", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Location"]`, 30000);
  });
  await run.step("\"Edit Location\" is ENABLED \u2014 the session role has work.update", {}, async () => {
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Menu-item')].find(e => (e.textContent||'').trim() === 'Edit Location');
if (!it) return false;
return !it.disabled && it.getAttribute('data-disabled') === null;`, 30000);
  });
  await run.step("Open the location form via \"Edit Location\"", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Location"]`, 30000);
  });
  await run.step("Let the modal open", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The location form mounted", {}, async () => {
    await assertElementPresent(page, `//form[@id="locationform"]`, 60000);
  });
  await run.step("It has all three fields \u2014 Address, X and Y", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return false;
const t = f.innerText || '';
return /\\bAddress\\b/.test(t) && /\\bX\\b/.test(t) && /\\bY\\b/.test(t);`, 30000);
  });
  await run.step("The geolocate control renders inside the form \u2014 anchored on the ICON, so it fails if the control disappears (using it is MOB.911's job)", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('locationform');
if (!f) return false;
const icon = f.querySelector('[data-icon="location-crosshairs"], .fa-location-crosshairs');
if (!icon) return false;
// and it must sit inside a real ActionIcon, not be a loose decorative svg
return !!icon.closest('.mantine-ActionIcon-root');`, 30000);
  });
  await run.step("Dismiss via the modal's close button", {always: true, allow: 'ignore'}, async () => {
    await click(page, `//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ") or @aria-label="Close"]`, 15000);
  });
  await run.step("Let the modal react", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("Fallback: dismiss by clicking the overlay", {always: true, allow: 'ignore'}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-overlay ")]`, 15000);
  });
  await run.step("Let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("The location form was DISMISSED and the page is still alive", {always: true}, async () => {
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.getElementById('locationform');`, 30000);
  });
  run.finish();
}
