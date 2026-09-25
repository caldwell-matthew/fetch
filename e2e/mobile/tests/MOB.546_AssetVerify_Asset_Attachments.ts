// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.546_AssetVerify_Asset_Attachments.json. This file is the source now: edit it directly.
// MOB.546_AssetVerify_Asset_Attachments

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';
import { waitForPrefetch } from '../support/prefetch';

export async function mob546(page: Page): Promise<void> {
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
  await run.step("\u2b50 The ACTIVE panel holds the attachments UI, and the inactive tabs are empty shells \u2014 `keepMounted={false}` drops children, not the panel element", {}, async () => {
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
  });
  await run.step("SEGMENTS: exactly two, values 1 (Photos) and 2 (Docs)", {}, async () => {
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
  });
  await run.step("Switch to the \"Photos\" segment by VALUE (1) \u2014 never by label (it can render icon-only)", {}, async () => {
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
  await run.step("Let the Photos panel render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 PHOTOS: a carousel with at least one slide, `Add Photo`, and NO `Add File`", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const t = [...p.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const slides = p.querySelectorAll('[class*="mantine-Carousel-slide"]').length;
return slides >= 1 && t.includes('Add Photo') && !t.includes('Add File');`, 30000);
  });
  await run.step("Switch to the \"Docs\" segment by VALUE (2) \u2014 never by label (it can render icon-only)", {}, async () => {
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
  });
  await run.step("Let the Docs panel render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 DOCS: a real download row, `Add File`, NO `Add Photo`, NO carousel \u2014 the biconditional closes with both sides populated", {}, async () => {
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
  });
  await run.step("Switch to the \"Photos\" segment by VALUE (1) \u2014 never by label (it can render icon-only)", {}, async () => {
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
  await run.step("Let the Photos panel render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("RESTORE: back to the \"General Info\" tab", {always: true}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "General Info")]`, 30000);
  });
  await run.step("Let the first tab render", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: the \"General Info\" tab is the selected one", {always: true}, async () => {
    await assertFromJavascript(page, `const sel = document.querySelector('[role="tab"][aria-selected="true"]');
return !!sel && (sel.textContent || '').includes('General Info');`, 30000);
  });
  run.finish();
}
