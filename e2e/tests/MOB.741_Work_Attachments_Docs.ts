// Generated from legacy/Mobile/dd_tests_mobile/MOB.741_Work_Attachments_Docs.json by to_playwright.py — do not edit by hand yet.
// MOB.741_Work_Attachments_Docs

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, press, typeText, uploadStandIn, wait } from '../support/dd';

export async function mob741(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to asset lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the page to mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Asset Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, 30000);
  });
  await run.step("Select any persisted query first (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for Pump 0102", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter \u2014 there is no search button)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Wait for the search results", {}, async () => {
    await wait(page, 5);
  });
  await run.step("RESULT GUARD: a result row for Pump 0102 rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1][contains(., "Pump 0102")]`, 60000);
  });
  await run.step("Expand the first result", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`, 30000);
  });
  await run.step("Wait for the detail panel to mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Open the \"Work History\" tab", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Work History"]`, 60000);
  });
  await run.step("Let the work history query resolve", {}, async () => {
    await wait(page, 5);
  });
  await run.step("FIXTURE GUARD: Pump 0102 has at least one work history row", {}, async () => {
    await assertElementPresent(page, `((//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 60000);
  });
  await run.step("Open the first work history record (opens a modal, not a route)", {}, async () => {
    await click(page, `((//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 30000);
  });
  await run.step("Let MOBILE_WORK_ORDER_DETAILS resolve and the panel mount", {}, async () => {
    await wait(page, 6);
  });
  await run.step("The work history modal opened", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]`, 60000);
  });
  await run.step("Open the \"Attachments\" tab", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Attachments"]`, 30000);
  });
  await run.step("Let WorkStageAttachments mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\"Attachments\" is the active tab", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Attachments"][@data-active="true"]`, 30000);
  });
  await run.step("The panel offers EXACTLY TWO segments (Photos / Docs), read by value not label", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const vals = [...root.querySelectorAll('input[type=radio]')].map(i => i.value);
if (vals.length) return JSON.stringify(vals) === JSON.stringify(['1','2']);
// no radios in this Mantine build — fall back to counting the controls
return root.querySelectorAll('[class*="SegmentedControl-control"]').length === 2;`, 30000);
  });
  await run.step("\ud83d\uded1 PHOTOS tab: the add button is present and reads the COMPONENT DEFAULT \"Add Photo\" \u2014 and no \"Add File\" (asserted, never uploaded to)", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const want = t.includes('Add Photo'), other = t.includes('Add File');
return want && !other;
`, 30000);
  });
  await run.step("Switch to the Docs segment by VALUE (never by text \u2014 it can render icon-only)", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
let el = root.querySelector('input[type="radio"][value="2"]');
if (!el) {
  // structural fallback: the options render in the order they are declared
  const c = [...root.querySelectorAll('label, button, [class*="SegmentedControl-control"]')];
  el = c[1];
}
if (!el) return false;
el.click();
return true;
`, 30000);
  });
  await run.step("Let the Docs panel render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("DOCS tab: \"Add File\" is present and the carousel button is GONE \u2014 the two are mutually exclusive by construction", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const want = t.includes('Add File'), other = t.includes('Add Photo');
return want && !other;
`, 30000);
  });
  await run.step("Reveal the hidden \"Add File\" input (Mantine FileButton, accept=\"*/*\")", {}, async () => {
    await assertFromJavascript(page, `const root = document.querySelector('.mantine-Modal-content');
if (!root) return false;
const hits = [...root.querySelectorAll('input[type="file"][accept="*/*"]')];
if (hits.length !== 1) return false;   // 0 = not rendered, >1 = ambiguous, see above
const el = hits[0];
if (!el) return false;
el.setAttribute('data-dd-upload', '1');
Object.assign(el.style, {
  display: 'block', opacity: '1', position: 'fixed',
  top: '0', left: '0', width: '240px', height: '40px', zIndex: '99999'
});
return true;
`, DEFAULT_TIMEOUT);
  });
  await run.step("\u2b50 Upload an IMAGE through the FILE button \u2014 the branch that must reject it", {}, async () => {
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
  });
  await run.step("\u2b50 The rejection toast fired \u2014 the filter ran and counted the image", {}, async () => {
    await assertFromJavascript(page, `return /image file\\(s\\) were ignored/.test(document.body.textContent || '');`, 30000);
  });
  await run.step("\u2b50 The image really landed on the input, really was an image, and really did NOT reach the attachment table", {}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('input[data-dd-upload="1"]');
if (!el || !el.files || el.files.length !== 1) return false;   // it arrived
const f = el.files[0];
if (!/^image\\//.test(f.type)) return false;                    // it is an image
const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const tbl = m.querySelector('table');
const shown = tbl ? (tbl.textContent || '') : '';
return !shown.includes(f.name.slice(0, 20));                   // it was rejected
`, 30000);
  });
  await run.step("\u2026and the panel is still usable \u2014 \"Add File\" is still there", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const want = t.includes('Add File'), other = t.includes('Add Photo');
return want && !other;
`, 30000);
  });
  await run.step("Close the modal (its CloseButton \u2014 Escape and the overlay are no-ops here)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-CloseButton-root ")]`, 30000);
  });
  await run.step("Let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: no modal is left open, and nothing was attached", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Modal-content');`, 30000);
  });
  run.finish();
}
