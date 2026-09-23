// Generated from Mobile/dd_tests_mobile/MOB.399_Work_Warranties.json by to_playwright.py — do not edit by hand yet.
// MOB.399_Work_Warranties

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob399(page: Page): Promise<void> {
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
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the "Warranties" tab
    await el(page, `//*[@role="tab"][normalize-space(.)="Warranties"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the panel
    await wait(page, 3);
    // The "Warranties" tab is active
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Warranties"][@data-active]`, DEFAULT_TIMEOUT);
    // PROOF: the panel rendered warranty content or its empty state, not a blank tab
    await assertFromJavascript(page, `
const t = (document.body.textContent || '');
return ['Expiration Date', 'Remaining Days', 'Current Reading', 'Exp. Reading']
  .some(k => t.indexOf(k) !== -1);
`, DEFAULT_TIMEOUT);
    // BANNER: its presence agrees with whether a warranty is still active
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
    // Navigate to MOB.302's work order — its asset has no warranty
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/RcdI0xcpc8NBV8VoRNNBYM`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open its "Warranties" tab
    await el(page, `//*[@role="tab"][normalize-space(.)="Warranties"]`).click({ timeout: 30000 });
    // Wait for the panel
    await wait(page, 3);
    // ⭐ EMPTY STATE: the active Warranties panel names `Bypass Valve 0001` and shows `No Warranties Found...` — no warranty content
    await assertFromJavascript(page, `
const tabEl = document.querySelector('[role="tab"][data-active]');
const id = tabEl && tabEl.getAttribute('aria-controls');
const p = id ? document.getElementById(id) : null;
if (!p || (tabEl.textContent || '').trim() !== 'Warranties') return false;
const t = p.textContent || '';
return t.includes('Bypass Valve 0001') && t.includes('No Warranties Found...')
  && !['Expiration Date', 'Remaining Days', 'Current Reading', 'Exp. Reading'].some(k => t.includes(k));
`, 30000);
    // BANNER: absent on a work order with no warranty (paired with the empty state above)
    await assertFromJavascript(page, `return !(document.body.textContent || '').includes('Assets Related to the Work Order are under Warranty');`, 10000);
}
