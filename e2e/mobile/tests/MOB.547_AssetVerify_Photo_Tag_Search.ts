// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.547_AssetVerify_Photo_Tag_Search.json. This file is the source now: edit it directly.
// MOB.547_AssetVerify_Photo_Tag_Search

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';
import { waitForPrefetch } from '../support/prefetch';

export async function mob547(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await waitForPrefetch(page);
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
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Open Tank 0000's full-page detail", {}, async () => {
    await click(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`, 30000);
  });
  await run.step("The full-page asset detail rendered", {}, async () => {
    await assertPageContains(page, `Asset Type:`, 30000);
  });
  await run.step("Open the \"Attachments\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Attachments")]`, 30000);
  });
  await run.step("Wait for the panel", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Make sure the Photos segment is showing (value 1)", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const root = p.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const el = root.querySelector('input[type="radio"][value="1"]');
if (!el) return false;
el.click();
return true;`, 30000);
  });
  await run.step("Let the carousel render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Open the tag editor from the carousel's tag badge (a NAME badge when the photo has 1\u20133 tags, `Edit Tags (n)` otherwise)", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const isTagBadge = b => {
  const st = b.getAttribute('style') || '';
  // 🛑 The component writes \`outline: 1px solid #8dc63f\`, but the browser
  // SERIALISES hex colours as rgb() - matching '8dc63f' finds nothing in
  // Chrome. \`cursor: pointer\` is the other half of the same style object and
  // survives serialisation untouched, so it leads; the colour forms are kept
  // as fallbacks in case the cursor rule moves.
  if (st.indexOf('cursor: pointer') !== -1) return true;
  if (st.indexOf('8dc63f') !== -1) return true;
  if (st.indexOf('141, 198, 63') !== -1) return true;
  return /Edit Tags \\(\\d+\\)/.test(b.textContent || '');
};
const badges = [...p.querySelectorAll('[class*="mantine-Badge-root"]')]
  .filter(isTagBadge);
if (!badges.length) return false;
badges[badges.length - 1].click();
return true;`, 30000);
  });
  await run.step("\u2b50 The FULL TagSelector opened \u2014 `Search tags...`, not the mini `Auto-apply tags?`", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Search tags..."]`, 30000);
  });
  await run.step("Type the partial term \"Batter\" into the tag search", {}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('input[placeholder="Search tags..."]');
if (!el) return false;
const view = el.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(el, "Batter");
el.dispatchEvent(new view.Event('input', { bubbles: true }));
return true;`, 30000);
  });
  await run.step("Let the dropdown re-filter", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 PARTIAL: \"Batter\" lists `Battery Pack` **and** offers to create it \u2014 under the old rule (results \u21d2 no create) this was impossible", {}, async () => {
    await assertFromJavascript(page, `const opts = [...document.querySelectorAll('[role="option"]')]
  .map(o => (o.textContent || '').trim());
const create = opts.filter(t => t.indexOf('+ Create Tag') === 0);
const tags = opts.filter(t => t.indexOf('+ Create Tag') !== 0);
const hit = tags.some(t => t.indexOf('Battery Pack') !== -1);
const offer = create.some(t => t.indexOf("'Batter'") !== -1);
return hit && offer;`, 30000);
  });
  await run.step("Type the padded, mis-cased exact term \"  cUSTOM  \" into the tag search", {}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('input[placeholder="Search tags..."]');
if (!el) return false;
const view = el.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(el, "  cUSTOM  ");
el.dispatchEvent(new view.Event('input', { bubbles: true }));
return true;`, 30000);
  });
  await run.step("Let the dropdown re-filter", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 EXACT: \"  cUSTOM  \" still matches `Custom` (trimmed, lower-cased) and the create button is GONE \u2014 while results are still listed", {}, async () => {
    await assertFromJavascript(page, `const opts = [...document.querySelectorAll('[role="option"]')]
  .map(o => (o.textContent || '').trim());
const create = opts.filter(t => t.indexOf('+ Create Tag') === 0);
const tags = opts.filter(t => t.indexOf('+ Create Tag') !== 0);
const hit = tags.some(t => t.trim() === 'Custom');
return hit && tags.length >= 2 && create.length === 0;`, 30000);
  });
  await run.step("Type a term that matches nothing into the tag search", {}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('input[placeholder="Search tags..."]');
if (!el) return false;
const view = el.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(el, "ZZZZ-NO-SUCH-TAG");
el.dispatchEvent(new view.Event('input', { bubbles: true }));
return true;`, 30000);
  });
  await run.step("Let the dropdown re-filter", {}, async () => {
    await wait(page, 2);
  });
  await run.step("NO MATCH: no tag options, and the create button is offered", {}, async () => {
    await assertFromJavascript(page, `const opts = [...document.querySelectorAll('[role="option"]')]
  .map(o => (o.textContent || '').trim());
const create = opts.filter(t => t.indexOf('+ Create Tag') === 0);
const tags = opts.filter(t => t.indexOf('+ Create Tag') !== 0);
return tags.length === 0 && create.some(t => t.indexOf("'ZZZZ-NO-SUCH-TAG'") !== -1);`, 30000);
  });
  await run.step("Type an empty term (clearing the search) into the tag search", {}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('input[placeholder="Search tags..."]');
if (!el) return false;
const view = el.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(el, "");
el.dispatchEvent(new view.Event('input', { bubbles: true }));
return true;`, 30000);
  });
  await run.step("Let the dropdown re-filter", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Close the tag editor with its own `Done` (selecting an option would WRITE)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[normalize-space(.)="Done"]`, 30000);
  });
  await run.step("Let the tag modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: the tag editor is gone", {always: true}, async () => {
    await assertPageLacks(page, `Search tags...`, DEFAULT_TIMEOUT);
  });
  await run.step("RESTORE: back to the \"General Info\" tab", {always: true}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "General Info")]`, 30000);
  });
  await run.step("Let the first tab render", {always: true}, async () => {
    await wait(page, 2);
  });
  run.finish();
}
