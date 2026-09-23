// Generated from Mobile/dd_tests_mobile/MOB.855_MaterialLookup_Column_Sort.json by to_playwright.py — do not edit by hand yet.
// MOB.855_MaterialLookup_Column_Sort

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementContent, assertFromJavascript, el, wait } from '../support/dd';

export async function mob855(page: Page): Promise<void> {
  const soft = new Soft();
  try {
    // Navigate to material lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/material-lookup`);
    // Wait for the page to mount
    await wait(page, 6);
    // Test the "Material Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]`, `Material Lookup`, 30000);
    // Open the storeroom dropdown
    await el(page, `//*[@id="storeroomLocationId"]`).click({ timeout: 30000 });
    // Wait for storeroom options
    await wait(page, 2);
    // Pick Central Storeroom
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Central Storeroom")]`).click({ timeout: 30000 });
    // Wait for the material list to load
    await wait(page, 8);
    await soft.run("FIXTURE GUARD: >= 2 rows and >= 2 DISTINCT quantities \u2014 without that, both sort directions are vacuously true", async () => {
      await assertFromJavascript(page, `const table = document.querySelector('table');
if (!table) return false;
const heads = [...table.querySelectorAll('thead th')].map(h => (h.textContent || '').trim());
const qi = heads.indexOf('Qty');
if (qi < 0) return false;
const rows = [...table.querySelectorAll('tbody tr')];
const qty = rows.map(r => {
  const td = r.querySelectorAll('td')[qi];
  return td ? Number((td.textContent || '').replace(/[^0-9.\\-]/g, '')) : NaN;
});
if (qty.some(n => Number.isNaN(n))) return false;
return rows.length >= 2 && new Set(qty).size >= 2;`, 30000);
    });
    // ⭐ MATCH COUNT: rendered rows == min(`N matches`, 500) — the query's `limit`
    await assertFromJavascript(page, `const table = document.querySelector('table');
if (!table) return false;
const heads = [...table.querySelectorAll('thead th')].map(h => (h.textContent || '').trim());
const qi = heads.indexOf('Qty');
if (qi < 0) return false;
const rows = [...table.querySelectorAll('tbody tr')];
const qty = rows.map(r => {
  const td = r.querySelectorAll('td')[qi];
  return td ? Number((td.textContent || '').replace(/[^0-9.\\-]/g, '')) : NaN;
});
if (qty.some(n => Number.isNaN(n))) return false;
const m = (document.body.textContent || '').match(/(\\d[\\d,]*)\\s+matches/);
if (!m) return false;
const matches = Number(m[1].replace(/,/g, ''));
const limit = 500;   // MOBILE_MATERIAL_ITEM_LOOKUP params.limit, no paging
return rows.length === Math.min(matches, limit);`, 30000);
    // BASELINE: the sort chevron sits on `Material Item`, ascending, and on no other header
    await assertFromJavascript(page, `const table = document.querySelector('table');
if (!table) return false;
const heads = [...table.querySelectorAll('thead th')].map(h => (h.textContent || '').trim());
const qi = heads.indexOf('Qty');
if (qi < 0) return false;
const rows = [...table.querySelectorAll('tbody tr')];
const qty = rows.map(r => {
  const td = r.querySelectorAll('td')[qi];
  return td ? Number((td.textContent || '').replace(/[^0-9.\\-]/g, '')) : NaN;
});
if (qty.some(n => Number.isNaN(n))) return false;
const ths = [...table.querySelectorAll('thead th')];
const th = ths.find(h => (h.textContent || '').trim() === 'Material Item');
if (!th) return false;
const mine = th.querySelector('[data-icon="chevron-up"], .fa-chevron-up');
const others = ths.filter(h => h !== th)
  .some(h => h.querySelector('[data-icon="chevron-up"], [data-icon="chevron-down"], .fa-chevron-up, .fa-chevron-down'));
if (!mine || others) return false;
return true;`, 30000);
    // Click the "Qty" header (first click = ASC)
    await el(page, `//th[.//*[normalize-space(.)="Qty"]]//button`).click({ timeout: 30000 });
    // Let the sorted refetch land
    await wait(page, 4);
    // ⭐ ASC: the chevron is on `Qty` pointing up AND the column really is non-decreasing
    await assertFromJavascript(page, `const table = document.querySelector('table');
if (!table) return false;
const heads = [...table.querySelectorAll('thead th')].map(h => (h.textContent || '').trim());
const qi = heads.indexOf('Qty');
if (qi < 0) return false;
const rows = [...table.querySelectorAll('tbody tr')];
const qty = rows.map(r => {
  const td = r.querySelectorAll('td')[qi];
  return td ? Number((td.textContent || '').replace(/[^0-9.\\-]/g, '')) : NaN;
});
if (qty.some(n => Number.isNaN(n))) return false;
const ths = [...table.querySelectorAll('thead th')];
const th = ths.find(h => (h.textContent || '').trim() === 'Qty');
if (!th) return false;
const mine = th.querySelector('[data-icon="chevron-up"], .fa-chevron-up');
const others = ths.filter(h => h !== th)
  .some(h => h.querySelector('[data-icon="chevron-up"], [data-icon="chevron-down"], .fa-chevron-up, .fa-chevron-down'));
if (!mine || others) return false;
return qty.every((v, i) => i === 0 || qty[i - 1] <= v);`, 30000);
    // Click the "Qty" header again (same column = flip to DESC)
    await el(page, `//th[.//*[normalize-space(.)="Qty"]]//button`).click({ timeout: 30000 });
    // Let the sorted refetch land
    await wait(page, 4);
    // ⭐ DESC: the chevron is on `Qty` pointing down AND the column really is non-increasing
    await assertFromJavascript(page, `const table = document.querySelector('table');
if (!table) return false;
const heads = [...table.querySelectorAll('thead th')].map(h => (h.textContent || '').trim());
const qi = heads.indexOf('Qty');
if (qi < 0) return false;
const rows = [...table.querySelectorAll('tbody tr')];
const qty = rows.map(r => {
  const td = r.querySelectorAll('td')[qi];
  return td ? Number((td.textContent || '').replace(/[^0-9.\\-]/g, '')) : NaN;
});
if (qty.some(n => Number.isNaN(n))) return false;
const ths = [...table.querySelectorAll('thead th')];
const th = ths.find(h => (h.textContent || '').trim() === 'Qty');
if (!th) return false;
const mine = th.querySelector('[data-icon="chevron-down"], .fa-chevron-down');
const others = ths.filter(h => h !== th)
  .some(h => h.querySelector('[data-icon="chevron-up"], [data-icon="chevron-down"], .fa-chevron-up, .fa-chevron-down'));
if (!mine || others) return false;
return qty.every((v, i) => i === 0 || qty[i - 1] >= v);`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // RESTORE: click "Material Item" to put the default sort back
    await el(page, `//th[.//*[normalize-space(.)="Material Item"]]//button`).click({ timeout: 30000 });
    // Let the refetch land
    await wait(page, 4);
    // RESTORED: the chevron is back on `Material Item`, ascending
    await assertFromJavascript(page, `const table = document.querySelector('table');
if (!table) return false;
const heads = [...table.querySelectorAll('thead th')].map(h => (h.textContent || '').trim());
const qi = heads.indexOf('Qty');
if (qi < 0) return false;
const rows = [...table.querySelectorAll('tbody tr')];
const qty = rows.map(r => {
  const td = r.querySelectorAll('td')[qi];
  return td ? Number((td.textContent || '').replace(/[^0-9.\\-]/g, '')) : NaN;
});
if (qty.some(n => Number.isNaN(n))) return false;
const ths = [...table.querySelectorAll('thead th')];
const th = ths.find(h => (h.textContent || '').trim() === 'Material Item');
if (!th) return false;
const mine = th.querySelector('[data-icon="chevron-up"], .fa-chevron-up');
const others = ths.filter(h => h !== th)
  .some(h => h.querySelector('[data-icon="chevron-up"], [data-icon="chevron-down"], .fa-chevron-up, .fa-chevron-down'));
if (!mine || others) return false;
return true;`, 30000);
  }
  soft.check();
}
