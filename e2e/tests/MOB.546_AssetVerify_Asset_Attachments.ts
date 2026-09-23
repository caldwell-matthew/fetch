// Generated from Mobile/dd_tests_mobile/MOB.546_AssetVerify_Asset_Attachments.json by to_playwright.py — do not edit by hand yet.
// MOB.546_AssetVerify_Asset_Attachments

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob546(page: Page): Promise<void> {
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
    // ⭐ The ACTIVE panel holds the attachments UI, and the inactive tabs are empty shells — `keepMounted={false}` drops children, not the panel element
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const all = [...document.querySelectorAll('[role="tabpanel"]')];
if (all.length < 2) return false;
const withContent = all.filter(x => (x.textContent || '').trim().length > 0);
if (withContent.length !== 1 || withContent[0] !== p) return false;
return !!p.querySelector('[class*="mantine-SegmentedControl-root"]');`, 30000);
    // SEGMENTS: exactly two, values 1 (Photos) and 2 (Docs)
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const root = p.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const vals = [...root.querySelectorAll('input[type="radio"]')].map(i => i.value);
return JSON.stringify(vals) === JSON.stringify(['1', '2']);`, 30000);
    // Switch to the "Photos" segment by VALUE (1) — never by label (it can render icon-only)
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
    // Let the Photos panel render
    await wait(page, 3);
    // ⭐ PHOTOS: a carousel with at least one slide, `Add Photo`, and NO `Add File`
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const t = [...p.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const slides = p.querySelectorAll('[class*="mantine-Carousel-slide"]').length;
return slides >= 1 && t.includes('Add Photo') && !t.includes('Add File');`, 30000);
    // Switch to the "Docs" segment by VALUE (2) — never by label (it can render icon-only)
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const root = p.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const el = root.querySelector('input[type="radio"][value="2"]');
if (!el) return false;
el.click();
return true;`, 30000);
    // Let the Docs panel render
    await wait(page, 3);
    // ⭐ DOCS: a real download row, `Add File`, NO `Add Photo`, NO carousel — the biconditional closes with both sides populated
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const t = [...p.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const files = p.querySelectorAll('a[href^="/api/attachment/"]').length;
return files >= 1 && !p.querySelector('[class*="mantine-Carousel-slide"]')
  && t.includes('Add File') && !t.includes('Add Photo');`, 30000);
    // Switch to the "Photos" segment by VALUE (1) — never by label (it can render icon-only)
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
    // Let the Photos panel render
    await wait(page, 3);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // RESTORE: back to the "General Info" tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "General Info")]`).click({ timeout: 30000 });
    // Let the first tab render
    await wait(page, 2);
    // RESTORED: the "General Info" tab is the selected one
    await assertFromJavascript(page, `const sel = document.querySelector('[role="tab"][aria-selected="true"]');
return !!sel && (sel.textContent || '').includes('General Info');`, 30000);
  }
}
