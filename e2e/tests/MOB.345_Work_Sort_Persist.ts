// Generated from Mobile/dd_tests_mobile/MOB.345_Work_Sort_Persist.json by to_playwright.py — do not edit by hand yet.
// MOB.345_Work_Sort_Persist

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../support/dd';

export async function mob345(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Wait for the workstage pages and the lookup prefetch", {}, async () => {
    await wait(page, 20);
  });
  await run.step("The work list rendered its search box", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 1/3: the initial fetch finished", {}, async () => {
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 2/3: paging through workstages finished", {}, async () => {
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 3/3: the per-stage detail downloads finished", {}, async () => {
    await assertPageLacks(page, `workstages downloaded`, 360000);
  });
  await run.step("LOADEDALL: start the idle clock", {}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd_worklist_idle_since');
return true;`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL: no loading bar on screen for 10s straight (all six phases, and the gaps between them)", {}, async () => {
    await assertFromJavascript(page, `const K = '__dd_worklist_idle_since';
if (document.querySelector('.mantine-Progress-root')) {
  sessionStorage.removeItem(K);
  return false;
}
const since = Number(sessionStorage.getItem(K)) || 0;
if (!since) { sessionStorage.setItem(K, String(Date.now())); return false; }
return Date.now() - since >= 10000;`, 360000);
  });
  await run.step("WORK ROW GUARD: at least one work order rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 60000);
  });
  await run.step("Open the menu (to reach the List view)", {allow: 'ignore'}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, 30000);
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Click \"Toggle Work Order List View\" (absent unless the crew role is SCHEDULED)", {allow: 'ignore'}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][contains(normalize-space(.), "Toggle Work Order List View")]`, 10000);
  });
  await run.step("Close the menu if the item was not there", {allow: 'ignore'}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the list re-render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("VIEW: the work list is rendering the List view (no Past Due / Today / Tomorrow / Future grouping)", {}, async () => {
    await assertFromJavascript(page, `const rows = [...document.querySelectorAll('[class*="mantine-Paper-root"]')]
  .filter(p => (p.textContent || '').includes('Description:')).length;
if (!rows) return false;
const g = [...document.querySelectorAll('button')]
  .filter(b => /^(Past Due|Today|Tomorrow|Future)\\b/.test((b.textContent || '').trim())).length;
return g === 0;`, 30000);
  });
  await run.step("Focus the work list search box", {}, async () => {
    await click(page, `//input[@placeholder="Find Workstage(s)"]`, 30000);
  });
  await run.step("Narrow the list to \"USED IN DATADOG\" \u2014 fewer rows, readable failures", {}, async () => {
    await typeText(page, `//input[@placeholder="Find Workstage(s)"]`, `USED IN DATADOG`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the 300ms debounce fire and the list re-render", {}, async () => {
    await wait(page, 4);
  });
  await run.step("NARROWED: exactly the 2 fixture stages render, each DISTINCT (a duplicate identity would let the proof pass on nothing)", {}, async () => {
    await assertFromJavascript(page, `const T = e => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'))
  .map(e => T(e.firstElementChild) + ' | ' + T(e.children[1]));
const o = ORDER();
if (o.length !== 2) return false;
return new Set(o).size === o.length;`, 30000);
  });
  await run.step("Open the sort dropdown", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 30000);
  });
  await run.step("Wait for the sort modal", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The Sort Criteria modal opened", {}, async () => {
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the sort options", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, 30000);
  });
  await run.step("Wait for the options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick \"Created At \u25b2\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Created At ▲"]`, 30000);
  });
  await run.step("Let the list re-sort and the choice persist", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF: the choice persisted to sessionStorage[\"mobile-WorkStage-sort\"]", {}, async () => {
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('mobile-WorkStage-sort');
if (!raw) return false;
let v; try { v = JSON.parse(raw); } catch (e) { return false; }
return v && v.label === 'Created At ▲';`, 30000);
  });
  await run.step("Close the sort modal", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the modal close", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Scroll the work list back to the top", {}, async () => {
    await assertFromJavascript(page, `for (const e of document.querySelectorAll('div')) {
  if (e.scrollHeight > e.clientHeight + 4) e.scrollTop = 0;
}
if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
return true;`, 30000);
  });
  await run.step("Let Virtuoso re-render the head of the list", {}, async () => {
    await wait(page, 3);
  });
  await run.step("CAPTURE: record the ascending row order (needs >=2 rows to mean anything)", {}, async () => {
    await assertFromJavascript(page, `const T = e => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'))
  .map(e => T(e.firstElementChild) + ' | ' + T(e.children[1]));
const o = ORDER();
// <2 rows makes any ordering claim vacuous (trap 5), so fail loudly instead.
if (o.length < 2) return false;
sessionStorage.setItem('__dd345_asc', JSON.stringify(o));
return true;`, 30000);
  });
  await run.step("Open the sort dropdown", {always: true}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 30000);
  });
  await run.step("Wait for the sort modal", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("The Sort Criteria modal opened", {}, async () => {
    await assertPageContains(page, `Sort Criteria`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the sort options", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, 30000);
  });
  await run.step("Wait for the options", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick \"Created At \u25bc\"", {always: true}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Created At ▼"]`, 30000);
  });
  await run.step("Let the list re-sort and the choice persist", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("RESTORED: sessionStorage holds the default \"Created At \u25bc\"", {always: true}, async () => {
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('mobile-WorkStage-sort');
if (!raw) return false;
let v; try { v = JSON.parse(raw); } catch (e) { return false; }
return v && v.label === 'Created At ▼';`, 30000);
  });
  await run.step("Close the sort modal", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the modal close and the list re-sort", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("Scroll to the last rendered row (pass 1 of 3) \u2014 Virtuoso mounts the next slice each time", {}, async () => {
    await assertFromJavascript(page, `const T = e => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'))
  .map(e => T(e.firstElementChild) + ' | ' + T(e.children[1]));
const rows = [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
if (!rows.length) return false;
rows[rows.length - 1].scrollIntoView({block: 'end'});
return true;`, 30000);
  });
  await run.step("Let Virtuoso mount the next slice", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Scroll to the last rendered row (pass 2 of 3) \u2014 Virtuoso mounts the next slice each time", {}, async () => {
    await assertFromJavascript(page, `const T = e => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'))
  .map(e => T(e.firstElementChild) + ' | ' + T(e.children[1]));
const rows = [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
if (!rows.length) return false;
rows[rows.length - 1].scrollIntoView({block: 'end'});
return true;`, 30000);
  });
  await run.step("Let Virtuoso mount the next slice", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Scroll to the last rendered row (pass 3 of 3) \u2014 Virtuoso mounts the next slice each time", {}, async () => {
    await assertFromJavascript(page, `const T = e => (e && e.textContent || '').replace(/\\s+/g, ' ').trim();
const ORDER = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'))
  .map(e => T(e.firstElementChild) + ' | ' + T(e.children[1]));
const rows = [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
if (!rows.length) return false;
rows[rows.length - 1].scrollIntoView({block: 'end'});
return true;`, 30000);
  });
  await run.step("Let Virtuoso mount the next slice", {}, async () => {
    await wait(page, 3);
  });
  await run.step("DIAG: ASC and DESC rendered the SAME NUMBER of rows (they need not \u2014 the descending capture is taken at the END of the list)", {always: true, allow: 'ignore'}, async () => {
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
  await run.step("DIAG: the two captures OVERLAP by at least 2 rows \u2014 if this is the only ERR, the windows were disjoint and the proof had nothing to compare", {always: true, allow: 'ignore'}, async () => {
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
  await run.step("DIAG: the rendered order actually CHANGED between ASC and DESC", {always: true, allow: 'ignore'}, async () => {
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
  await run.step("DIAG: the list is in SCHEDULED view (group headers present) \u2014 which would explain a non-reversal, since ScheduledWork re-buckets rows by group", {always: true, allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `return [...document.querySelectorAll('button')].filter(b => /^(Past Due|Today|Tomorrow|Future)\\b/.test((b.textContent||'').trim())).length > 0;`, 15000);
  });
  await run.step("PROOF: every row rendered in BOTH orders comes out exactly reversed", {}, async () => {
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
  });
  await run.step("CLEANUP: drop the test-owned scratch key", {always: true}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd345_asc');
return sessionStorage.getItem('__dd345_asc') === null;`, 30000);
  });
  await run.step("Scroll the work list back to the top", {always: true, allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `for (const e of document.querySelectorAll('div')) {
  if (e.scrollHeight > e.clientHeight + 4) e.scrollTop = 0;
}
if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
return true;`, 30000);
  });
  await run.step("Let Virtuoso re-render the head of the list", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("Focus the search box to clear it", {always: true, allow: 'ignore'}, async () => {
    await click(page, `//input[@placeholder="Find Workstage(s)"]`, 30000);
  });
  await run.step("CLEAR the search term", {always: true, allow: 'ignore'}, async () => {
    await typeText(page, `//input[@placeholder="Find Workstage(s)"]`, ``, DEFAULT_TIMEOUT);
  });
  await run.step("Let the full list come back", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("Open the menu (to reach the Scheduled view)", {always: true, allow: 'ignore'}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, 30000);
  });
  await run.step("Let the menu open", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("Click \"Toggle Work Order Scheduled View\" (absent unless the crew role is SCHEDULED)", {always: true, allow: 'ignore'}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][contains(normalize-space(.), "Toggle Work Order Scheduled View")]`, 10000);
  });
  await run.step("Close the menu if the item was not there", {always: true, allow: 'ignore'}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the list re-render", {always: true}, async () => {
    await wait(page, 3);
  });
  run.finish();
}
