// Generated from Mobile/dd_tests_mobile/MOB.399_Work_Warranties.json by to_playwright.py — do not edit by hand yet.
// MOB.399_Work_Warranties

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../support/dd';

export async function mob399(page: Page): Promise<void> {
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
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the \"Warranties\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][normalize-space(.)="Warranties"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the panel", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Warranties\" tab is active", {}, async () => {
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Warranties"][@data-active]`, DEFAULT_TIMEOUT);
  });
  await run.step("PROOF: the panel rendered warranty content or its empty state, not a blank tab", {}, async () => {
    await assertFromJavascript(page, `
const t = (document.body.textContent || '');
return ['Expiration Date', 'Remaining Days', 'Current Reading', 'Exp. Reading']
  .some(k => t.indexOf(k) !== -1);
`, DEFAULT_TIMEOUT);
  });
  await run.step("BANNER: its presence agrees with whether a warranty is still active", {}, async () => {
    await assertFromJavascript(page, `
const BANNER = 'Assets Related to the Work Order are under Warranty';
const t = document.body.innerText || '';
const banner = t.indexOf(BANNER) !== -1;
const hasAnyWarranty = ['Expiration Date', 'Exp. Reading', 'Remaining Days']
    .some(k => t.indexOf(k) !== -1);
if (!hasAnyWarranty) return !banner;          // no warranties at all -> no banner
const days = [...t.matchAll(/Remaining Days:?\\s*(-?[0-9]+)/g)].map(m => parseInt(m[1], 10));
if (!days.length) return true;                 // reading-based only: nothing parseable here
const anyLive = days.some(d => d > 0);
return banner === anyLive;
`, DEFAULT_TIMEOUT);
  });
  await run.step("Navigate to MOB.302's work order \u2014 its asset has no warranty", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/RcdI0xcpc8NBV8VoRNNBYM`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open its \"Warranties\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][normalize-space(.)="Warranties"]`, 30000);
  });
  await run.step("Wait for the panel", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 EMPTY STATE: the active Warranties panel names `Bypass Valve 0001` and shows `No Warranties Found...` \u2014 no warranty content", {}, async () => {
    await assertFromJavascript(page, `
const tabEl = document.querySelector('[role="tab"][data-active]');
const id = tabEl && tabEl.getAttribute('aria-controls');
const p = id ? document.getElementById(id) : null;
if (!p || (tabEl.textContent || '').trim() !== 'Warranties') return false;
const t = p.textContent || '';
return t.includes('Bypass Valve 0001') && t.includes('No Warranties Found...')
  && !['Expiration Date', 'Remaining Days', 'Current Reading', 'Exp. Reading'].some(k => t.includes(k));
`, 30000);
  });
  await run.step("BANNER: absent on a work order with no warranty (paired with the empty state above)", {}, async () => {
    await assertFromJavascript(page, `return !(document.body.textContent || '').includes('Assets Related to the Work Order are under Warranty');`, 10000);
  });
  run.finish();
}
