// Generated from Mobile/dd_tests_mobile/MOB.741_Work_Attachments_Docs.json by to_playwright.py — do not edit by hand yet.
// MOB.741_Work_Attachments_Docs

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, uploadStandIn, wait } from '../support/dd';

export async function mob741(page: Page): Promise<void> {
  try {
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for the page to mount
    await wait(page, 3);
    // Test the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: 30000 });
    // Select any persisted query first (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Search for Pump 0102
    await el(page, `//input[@name="asset-search"]`).fill(`Pump 0102`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter — there is no search button)
    await page.keyboard.press(`Enter`);
    // Wait for the search results
    await wait(page, 5);
    // RESULT GUARD: a result row for Pump 0102 rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1][contains(., "Pump 0102")]`, 60000);
    // Expand the first result
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`).click({ timeout: 30000 });
    // Wait for the detail panel to mount
    await wait(page, 3);
    // Open the "Work History" tab
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Work History"]`).click({ timeout: 60000 });
    // Let the work history query resolve
    await wait(page, 5);
    // FIXTURE GUARD: Pump 0102 has at least one work history row
    await assertElementPresent(page, `((//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 60000);
    // Open the first work history record (opens a modal, not a route)
    await el(page, `((//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`).click({ timeout: 30000 });
    // Let MOBILE_WORK_ORDER_DETAILS resolve and the panel mount
    await wait(page, 6);
    // The work history modal opened
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]`, 60000);
    // Open the "Attachments" tab
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Attachments"]`).click({ timeout: 30000 });
    // Let WorkStageAttachments mount
    await wait(page, 3);
    // "Attachments" is the active tab
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Attachments"][@data-active="true"]`, 30000);
    // The panel offers EXACTLY TWO segments (Photos / Docs), read by value not label
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const vals = [...root.querySelectorAll('input[type=radio]')].map(i => i.value);
if (vals.length) return JSON.stringify(vals) === JSON.stringify(['1','2']);
// no radios in this Mantine build — fall back to counting the controls
return root.querySelectorAll('[class*="SegmentedControl-control"]').length === 2;`, 30000);
    // 🛑 PHOTOS tab: the add button is present and reads the COMPONENT DEFAULT "Add Photo" — and no "Add File" (asserted, never uploaded to)
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const want = t.includes('Add Photo'), other = t.includes('Add File');
return want && !other;
`, 30000);
    // Switch to the Docs segment by VALUE (never by text — it can render icon-only)
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
    // Let the Docs panel render
    await wait(page, 2);
    // DOCS tab: "Add File" is present and the carousel button is GONE — the two are mutually exclusive by construction
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const want = t.includes('Add File'), other = t.includes('Add Photo');
return want && !other;
`, 30000);
    // Reveal the hidden "Add File" input (Mantine FileButton, accept="*/*")
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
    // ⭐ Upload an IMAGE through the FILE button — the branch that must reject it
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
    // ⭐ The rejection toast fired — the filter ran and counted the image
    await assertFromJavascript(page, `return /image file\\(s\\) were ignored/.test(document.body.textContent || '');`, 30000);
    // ⭐ The image really landed on the input, really was an image, and really did NOT reach the attachment table
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
    // …and the panel is still usable — "Add File" is still there
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const want = t.includes('Add File'), other = t.includes('Add Photo');
return want && !other;
`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Close the modal (its CloseButton — Escape and the overlay are no-ops here)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-CloseButton-root ")]`).click({ timeout: 30000 });
    // Let the modal close
    await wait(page, 2);
    // RESTORED: no modal is left open, and nothing was attached
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Modal-content');`, 30000);
  }
}
