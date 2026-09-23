// Generated from Mobile/dd_tests_mobile/MOB.547_AssetVerify_Photo_Tag_Search.json by to_playwright.py — do not edit by hand yet.
// MOB.547_AssetVerify_Photo_Tag_Search

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob547(page: Page): Promise<void> {
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
    // Let the asset detail begin rendering
    await wait(page, 2);
    // The full-page asset detail rendered
    await assertPageContains(page, `Asset Type:`, 30000);
    // Open the "Attachments" tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Attachments")]`).click({ timeout: 30000 });
    // Wait for the panel
    await wait(page, 3);
    // Make sure the Photos segment is showing (value 1)
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
    // Let the carousel render
    await wait(page, 3);
    // Open the tag editor from the carousel's tag badge (a NAME badge when the photo has 1–3 tags, `Edit Tags (n)` otherwise)
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
    // Let the tag modal mount
    await wait(page, 3);
    // ⭐ The FULL TagSelector opened — `Search tags...`, not the mini `Auto-apply tags?`
    await assertElementPresent(page, `//input[@placeholder="Search tags..."]`, 30000);
    // Type the partial term "Batter" into the tag search
    await assertFromJavascript(page, `const el = document.querySelector('input[placeholder="Search tags..."]');
if (!el) return false;
const view = el.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(el, "Batter");
el.dispatchEvent(new view.Event('input', { bubbles: true }));
return true;`, 30000);
    // Let the dropdown re-filter
    await wait(page, 2);
    // ⭐ PARTIAL: "Batter" lists `Battery Pack` **and** offers to create it — under the old rule (results ⇒ no create) this was impossible
    await assertFromJavascript(page, `const opts = [...document.querySelectorAll('[role="option"]')]
  .map(o => (o.textContent || '').trim());
const create = opts.filter(t => t.indexOf('+ Create Tag') === 0);
const tags = opts.filter(t => t.indexOf('+ Create Tag') !== 0);
const hit = tags.some(t => t.indexOf('Battery Pack') !== -1);
const offer = create.some(t => t.indexOf("'Batter'") !== -1);
return hit && offer;`, 30000);
    // Type the padded, mis-cased exact term "  cUSTOM  " into the tag search
    await assertFromJavascript(page, `const el = document.querySelector('input[placeholder="Search tags..."]');
if (!el) return false;
const view = el.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(el, "  cUSTOM  ");
el.dispatchEvent(new view.Event('input', { bubbles: true }));
return true;`, 30000);
    // Let the dropdown re-filter
    await wait(page, 2);
    // ⭐ EXACT: "  cUSTOM  " still matches `Custom` (trimmed, lower-cased) and the create button is GONE — while results are still listed
    await assertFromJavascript(page, `const opts = [...document.querySelectorAll('[role="option"]')]
  .map(o => (o.textContent || '').trim());
const create = opts.filter(t => t.indexOf('+ Create Tag') === 0);
const tags = opts.filter(t => t.indexOf('+ Create Tag') !== 0);
const hit = tags.some(t => t.trim() === 'Custom');
return hit && tags.length >= 2 && create.length === 0;`, 30000);
    // Type a term that matches nothing into the tag search
    await assertFromJavascript(page, `const el = document.querySelector('input[placeholder="Search tags..."]');
if (!el) return false;
const view = el.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(el, "ZZZZ-NO-SUCH-TAG");
el.dispatchEvent(new view.Event('input', { bubbles: true }));
return true;`, 30000);
    // Let the dropdown re-filter
    await wait(page, 2);
    // NO MATCH: no tag options, and the create button is offered
    await assertFromJavascript(page, `const opts = [...document.querySelectorAll('[role="option"]')]
  .map(o => (o.textContent || '').trim());
const create = opts.filter(t => t.indexOf('+ Create Tag') === 0);
const tags = opts.filter(t => t.indexOf('+ Create Tag') !== 0);
return tags.length === 0 && create.some(t => t.indexOf("'ZZZZ-NO-SUCH-TAG'") !== -1);`, 30000);
    // Type an empty term (clearing the search) into the tag search
    await assertFromJavascript(page, `const el = document.querySelector('input[placeholder="Search tags..."]');
if (!el) return false;
const view = el.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(
  view.HTMLInputElement.prototype, 'value').set;
setter.call(el, "");
el.dispatchEvent(new view.Event('input', { bubbles: true }));
return true;`, 30000);
    // Let the dropdown re-filter
    await wait(page, 2);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Close the tag editor with its own `Done` (selecting an option would WRITE)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[normalize-space(.)="Done"]`).click({ timeout: 30000 });
    // Let the tag modal close
    await wait(page, 2);
    // RESTORED: the tag editor is gone
    await assertPageLacks(page, `Search tags...`, DEFAULT_TIMEOUT);
    // RESTORE: back to the "General Info" tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "General Info")]`).click({ timeout: 30000 });
    // Let the first tab render
    await wait(page, 2);
  }
}
