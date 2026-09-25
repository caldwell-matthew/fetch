// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.855_MaterialLookup_Column_Sort.json. This file is the source now: edit it directly.
// MOB.855_MaterialLookup_Column_Sort

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertFromJavascript, click, wait } from '../../support/dd';

export async function mob855(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to material lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/material-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the \"Material Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]`, `Material Lookup`, 30000);
  });
  await run.step("Open the storeroom dropdown", {}, async () => {
    await click(page, `//*[@id="storeroomLocationId"]`, 30000);
  });
  await run.step("Pick Central Storeroom", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Central Storeroom")]`, 30000);
  });
  await run.step("Wait for the material list to load", {}, async () => {
    await wait(page, 8);
  });
  await run.step("FIXTURE GUARD: >= 2 rows and >= 2 DISTINCT quantities \u2014 without that, both sort directions are vacuously true", {allow: 'soft'}, async () => {
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
  await run.step("\u2b50 MATCH COUNT: rendered rows == min(`N matches`, 500) \u2014 the query's `limit`", {}, async () => {
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
  });
  await run.step("BASELINE: the sort chevron sits on `Material Item`, ascending, and on no other header", {}, async () => {
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
  });
  await run.step("Click the \"Qty\" header (first click = ASC)", {}, async () => {
    await click(page, `//th[.//*[normalize-space(.)="Qty"]]//button`, 30000);
  });
  await run.step("Let the sorted refetch land", {}, async () => {
    await wait(page, 4);
  });
  await run.step("\u2b50 ASC: the chevron is on `Qty` pointing up AND the column really is non-decreasing", {}, async () => {
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
  });
  await run.step("Click the \"Qty\" header again (same column = flip to DESC)", {}, async () => {
    await click(page, `//th[.//*[normalize-space(.)="Qty"]]//button`, 30000);
  });
  await run.step("Let the sorted refetch land", {}, async () => {
    await wait(page, 4);
  });
  await run.step("\u2b50 DESC: the chevron is on `Qty` pointing down AND the column really is non-increasing", {}, async () => {
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
  });
  await run.step("RESTORE: click \"Material Item\" to put the default sort back", {always: true}, async () => {
    await click(page, `//th[.//*[normalize-space(.)="Material Item"]]//button`, 30000);
  });
  await run.step("Let the refetch land", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("RESTORED: the chevron is back on `Material Item`, ascending", {always: true}, async () => {
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
  });
  run.finish();
}
