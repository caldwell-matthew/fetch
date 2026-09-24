// Generated from legacy/Mobile/dd_tests_mobile/MOB.347_Work_Asset_Status.json by to_playwright.py — do not edit by hand yet.
// MOB.347_Work_Asset_Status

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, click, press, wait } from '../support/dd';

export async function mob347(page: Page): Promise<void> {
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
  await run.step("Open the \"Assets\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][normalize-space(.)="Assets"]`, 30000);
  });
  await run.step("Wait for the asset list", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Assets\" tab is now active", {}, async () => {
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Assets"][@data-active="true"]`, 30000);
  });
  await run.step("FIXTURE GUARD: an asset row shows \"Progress:\" \u2014 showAssetStatus is ON", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Text-root ")][starts-with(normalize-space(.), "Progress:")]`, 60000);
  });
  await run.step("The progress badge shows one of the five real status labels", {}, async () => {
    await assertFromJavascript(page, `const ok = ['No Status','Active','Completed','Not Completed','Canceled'];
const els = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && /^(No Status|Active|Completed|Not Completed|Canceled)$/.test((e.textContent||'').trim()));
return els.length > 0;`, 30000);
  });
  await run.step("Open the asset status menu", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Text-root ")][starts-with(normalize-space(.), "Progress:")])[1]`, 30000);
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The menu offers \"Mark as ...\" options (NOT clicked \u2014 they write instantly)", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')].filter(e => /^Mark as /.test((e.textContent||'').trim()));
return items.length >= 1;`, 30000);
  });
  await run.step("At most four options are offered \u2014 the current status is filtered out", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')].filter(e => /^Mark as /.test((e.textContent||'').trim()));
return items.length <= 4;`, 30000);
  });
  await run.step("Close the menu without choosing anything", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the menu close", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("GUARD: no status was applied \u2014 the menu is closed and nothing was clicked", {always: true}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')].filter(e => /^Mark as /.test((e.textContent||'').trim()));
return items.length === 0;`, 30000);
  });
  await run.step("Open the asset status FORM via the comment icon", {}, async () => {
    await click(page, `(//*[@data-icon="comment" or contains(concat(" ", normalize-space(@class), " "), " fa-comment ")])[1]`, 30000);
  });
  await run.step("Let the modal open", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The asset status form mounted", {}, async () => {
    await assertElementPresent(page, `//form[@id="asset-status-form"]`, 60000);
  });
  await run.step("It has the Asset Status field", {}, async () => {
    await assertPageContains(page, `Asset Status`, 30000);
  });
  await run.step("It has the Asset Sequence field", {}, async () => {
    await assertPageContains(page, `Asset Sequence`, 30000);
  });
  await run.step("It has the Comment field", {}, async () => {
    await assertPageContains(page, `Comment`, 30000);
  });
  await run.step("TRAP 8: Submit is type=\"button\" (inert) while the form is untouched", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-status-form');
if (!f) return false;
const b = [...document.querySelectorAll('button')].find(x => (x.getAttribute('form') === 'asset-status-form') || /^Submit$/.test((x.textContent||'').trim()));
if (!b) return false;
return b.getAttribute('type') === 'button';`, 30000);
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
  await run.step("The form was DISMISSED and the page is still alive (nothing was submitted \u2014 the form was never valid)", {always: true}, async () => {
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.getElementById('asset-status-form');`, 30000);
  });
  run.finish();
}
