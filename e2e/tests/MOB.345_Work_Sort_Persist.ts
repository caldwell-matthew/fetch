// Generated from Mobile/dd_tests_mobile/MOB.345_Work_Sort_Persist.json by to_playwright.py — do not edit by hand yet.
// MOB.345_Work_Sort_Persist

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';

export async function mob345(page: Page): Promise<void> {
  try {
    // Navigate to /work — the work order list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Wait for the workstage pages and the lookup prefetch
    await wait(page, 20);
    // The work list rendered its search box
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
    // LOADEDALL 1/3: the initial fetch finished
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
    // LOADEDALL 2/3: paging through workstages finished
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
    // LOADEDALL 3/3: the per-stage detail downloads finished
    await assertPageLacks(page, `workstages downloaded`, 180000);
    // WORK ROW GUARD: at least one work order rendered
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 60000);
    await optional("Open the menu (to reach the List view)", async () => {
      await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: 30000 });
    });
    // Let the menu open
    await wait(page, 1);
    await optional("Click \"Toggle Work Order List View\" (absent unless the crew role is SCHEDULED)", async () => {
      await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][contains(normalize-space(.), "Toggle Work Order List View")]`).click({ timeout: 10000 });
    });
    await optional("Close the menu if the item was not there", async () => {
      await page.keyboard.press(`Escape`);
    });
    // Let the list re-render
    await wait(page, 3);
    // VIEW: the work list is rendering the List view (no Past Due / Today / Tomorrow / Future grouping)
    await assertFromJavascript(page, `const rows = [...document.querySelectorAll('[class*="mantine-Paper-root"]')]
  .filter(p => (p.textContent || '').includes('Description:')).length;
if (!rows) return false;
const g = [...document.querySelectorAll('button')]
  .filter(b => /^(Past Due|Today|Tomorrow|Future)\\b/.test((b.textContent || '').trim())).length;
return g === 0;`, 30000);
    // Focus the work list search box
    await el(page, `//input[@placeholder="Find Workstage(s)"]`).click({ timeout: 30000 });
    // Narrow the list to "permit" — fewer rows, readable failures
    await el(page, `//input[@placeholder="Find Workstage(s)"]`).fill(`permit`, { timeout: DEFAULT_TIMEOUT });
    // Let the 300ms debounce fire and the list re-render
    await wait(page, 4);
    // NARROWED: at least 2 rows render and each is DISTINCT (a duplicate identity would let the proof pass on nothing)
    await assertFromJavascript(page, `const T = e => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'))
  .map(e => T(e.firstElementChild) + ' | ' + T(e.children[1]));
const o = ORDER();
if (o.length < 2) return false;
return new Set(o).size === o.length;`, 30000);
    // Open the sort dropdown
    await el(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 30000 });
    // Wait for the sort modal
    await wait(page, 3);
    // The Sort Criteria modal opened
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
    // Open the sort options
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: 30000 });
    // Wait for the options
    await wait(page, 2);
    // Pick "Created At ▲"
    await el(page, `//*[@role="option"][normalize-space(.)="Created At ▲"]`).click({ timeout: 30000 });
    // Let the list re-sort and the choice persist
    await wait(page, 3);
    // PROOF: the choice persisted to sessionStorage["mobile-WorkStage-sort"]
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('mobile-WorkStage-sort');
if (!raw) return false;
let v; try { v = JSON.parse(raw); } catch (e) { return false; }
return v && v.label === 'Created At ▲';`, 30000);
    // Close the sort modal
    await page.keyboard.press(`Escape`);
    // Let the modal close
    await wait(page, 2);
    // Scroll the work list back to the top
    await assertFromJavascript(page, `for (const e of document.querySelectorAll('div')) {
  if (e.scrollHeight > e.clientHeight + 4) e.scrollTop = 0;
}
if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
return true;`, 30000);
    // Let Virtuoso re-render the head of the list
    await wait(page, 3);
    // CAPTURE: record the ascending row order (needs >=2 rows to mean anything)
    await assertFromJavascript(page, `const T = e => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'))
  .map(e => T(e.firstElementChild) + ' | ' + T(e.children[1]));
const o = ORDER();
// <2 rows makes any ordering claim vacuous (trap 5), so fail loudly instead.
if (o.length < 2) return false;
sessionStorage.setItem('__dd345_asc', JSON.stringify(o));
return true;`, 30000);
    // The Sort Criteria modal opened
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
    // Scroll to the last rendered row (pass 1 of 3) — Virtuoso mounts the next slice each time
    await assertFromJavascript(page, `const T = e => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'))
  .map(e => T(e.firstElementChild) + ' | ' + T(e.children[1]));
const rows = [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
if (!rows.length) return false;
rows[rows.length - 1].scrollIntoView({block: 'end'});
return true;`, 30000);
    // Let Virtuoso mount the next slice
    await wait(page, 3);
    // Scroll to the last rendered row (pass 2 of 3) — Virtuoso mounts the next slice each time
    await assertFromJavascript(page, `const T = e => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'))
  .map(e => T(e.firstElementChild) + ' | ' + T(e.children[1]));
const rows = [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
if (!rows.length) return false;
rows[rows.length - 1].scrollIntoView({block: 'end'});
return true;`, 30000);
    // Let Virtuoso mount the next slice
    await wait(page, 3);
    // Scroll to the last rendered row (pass 3 of 3) — Virtuoso mounts the next slice each time
    await assertFromJavascript(page, `const T = e => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'))
  .map(e => T(e.firstElementChild) + ' | ' + T(e.children[1]));
const rows = [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
if (!rows.length) return false;
rows[rows.length - 1].scrollIntoView({block: 'end'});
return true;`, 30000);
    // Let Virtuoso mount the next slice
    await wait(page, 3);
    // PROOF: every row rendered in BOTH orders comes out exactly reversed
    await assertFromJavascript(page, `const T = e => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'))
  .map(e => T(e.firstElementChild) + ' | ' + T(e.children[1]));
const raw = sessionStorage.getItem('__dd345_asc');
if (!raw) return false;
let asc; try { asc = JSON.parse(raw); } catch (e) { return false; }
const desc = ORDER();
const inDesc = new Set(desc), inAsc = new Set(asc);
const ascCommon = asc.filter(r => inDesc.has(r));
const descCommon = desc.filter(r => inAsc.has(r));
// <2 rows in common proves nothing - and means the narrowing stopped working.
if (ascCommon.length < 2) return false;
return descCommon.join('\\u0000') === [...ascCommon].reverse().join('\\u0000');`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Open the sort dropdown
    await el(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 30000 });
    // Wait for the sort modal
    await wait(page, 3);
    // Open the sort options
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: 30000 });
    // Wait for the options
    await wait(page, 2);
    // Pick "Created At ▼"
    await el(page, `//*[@role="option"][normalize-space(.)="Created At ▼"]`).click({ timeout: 30000 });
    // Let the list re-sort and the choice persist
    await wait(page, 3);
    // RESTORED: sessionStorage holds the default "Created At ▼"
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('mobile-WorkStage-sort');
if (!raw) return false;
let v; try { v = JSON.parse(raw); } catch (e) { return false; }
return v && v.label === 'Created At ▼';`, 30000);
    // Close the sort modal
    await page.keyboard.press(`Escape`);
    // Let the modal close and the list re-sort
    await wait(page, 3);
    await optional("DIAG: ASC and DESC rendered the SAME NUMBER of rows (they need not \u2014 the descending capture is taken at the END of the list)", async () => {
      await assertFromJavascript(page, `const T = e => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'))
  .map(e => T(e.firstElementChild) + ' | ' + T(e.children[1]));
const raw = sessionStorage.getItem('__dd345_asc');
if (!raw) return false;
let asc; try { asc = JSON.parse(raw); } catch (e) { return false; }
const desc = ORDER();
return desc.length === asc.length;`, 15000);
    });
    await optional("DIAG: the two captures OVERLAP by at least 2 rows \u2014 if this is the only ERR, the windows were disjoint and the proof had nothing to compare", async () => {
      await assertFromJavascript(page, `const T = e => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'))
  .map(e => T(e.firstElementChild) + ' | ' + T(e.children[1]));
const raw = sessionStorage.getItem('__dd345_asc');
if (!raw) return false;
let asc; try { asc = JSON.parse(raw); } catch (e) { return false; }
const desc = ORDER();
const inDesc = new Set(desc);
return asc.filter(r => inDesc.has(r)).length >= 2;`, 15000);
    });
    await optional("DIAG: the rendered order actually CHANGED between ASC and DESC", async () => {
      await assertFromJavascript(page, `const T = e => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'))
  .map(e => T(e.firstElementChild) + ' | ' + T(e.children[1]));
const raw = sessionStorage.getItem('__dd345_asc');
if (!raw) return false;
let asc; try { asc = JSON.parse(raw); } catch (e) { return false; }
const desc = ORDER();
return desc.join('\\u0000') !== asc.join('\\u0000');`, 15000);
    });
    await optional("DIAG: the list is in SCHEDULED view (group headers present) \u2014 which would explain a non-reversal, since ScheduledWork re-buckets rows by group", async () => {
      await assertFromJavascript(page, `return [...document.querySelectorAll('button')].filter(b => /^(Past Due|Today|Tomorrow|Future)\\b/.test((b.textContent||'').trim())).length > 0;`, 15000);
    });
    // CLEANUP: drop the test-owned scratch key
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd345_asc');
return sessionStorage.getItem('__dd345_asc') === null;`, 30000);
    await optional("Scroll the work list back to the top", async () => {
      await assertFromJavascript(page, `for (const e of document.querySelectorAll('div')) {
  if (e.scrollHeight > e.clientHeight + 4) e.scrollTop = 0;
}
if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
return true;`, 30000);
    });
    // Let Virtuoso re-render the head of the list
    await wait(page, 3);
    await optional("Focus the search box to clear it", async () => {
      await el(page, `//input[@placeholder="Find Workstage(s)"]`).click({ timeout: 30000 });
    });
    await optional("CLEAR the search term", async () => {
      await el(page, `//input[@placeholder="Find Workstage(s)"]`).fill(``, { timeout: DEFAULT_TIMEOUT });
    });
    // Let the full list come back
    await wait(page, 4);
    await optional("Open the menu (to reach the Scheduled view)", async () => {
      await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: 30000 });
    });
    // Let the menu open
    await wait(page, 1);
    await optional("Click \"Toggle Work Order Scheduled View\" (absent unless the crew role is SCHEDULED)", async () => {
      await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][contains(normalize-space(.), "Toggle Work Order Scheduled View")]`).click({ timeout: 10000 });
    });
    await optional("Close the menu if the item was not there", async () => {
      await page.keyboard.press(`Escape`);
    });
    // Let the list re-render
    await wait(page, 3);
  }
}
