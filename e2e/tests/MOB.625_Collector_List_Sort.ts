// Generated from Mobile/dd_tests_mobile/MOB.625_Collector_List_Sort.json by to_playwright.py — do not edit by hand yet.
// MOB.625_Collector_List_Sort

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertFromJavascript, el, optional, wait } from '../support/dd';

export async function mob625(page: Page): Promise<void> {
  const soft = new Soft();
  try {
    // Navigate to the Asset Collector
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`);
    // Let the collected list load
    await wait(page, 5);
    // The collected list rendered rows, each with a name and a creator line
    await assertFromJavascript(page, `const rows = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')].map(it => {
  const c = it.querySelector('[class*="mantine-Accordion-control"]');
  if (!c) return null;
  const nm = c.querySelector('[class*="mantine-Highlight-root"]');
  const lab = c.querySelector('[class*="mantine-Accordion-label"]') || c;
  const last = lab.lastElementChild;
  const by = last && /mantine-Text-root/.test(last.className)
    && !last.querySelector('[class*="mantine-Highlight-root"]') ? last : null;
  const name = nm ? (nm.textContent || '').trim() : '';
  const line = by ? (by.textContent || '').trim() : '';
  const i = line.indexOf(', ');
  return name && i > 0 ? { name, creator: line.slice(0, i), key: name + '\\u0001' + line } : null;
});
if (!rows.length || rows.some(r => !r)) return false;
return rows.length >= 2;`, 30000);
    // STASH: remember `mobile-MobileJob-sort` as it was, so the restore can put it back
    await assertFromJavascript(page, `if (sessionStorage.getItem('__dd625_prevJobSort') === null)
  sessionStorage.setItem('__dd625_prevJobSort', JSON.stringify({ v: sessionStorage.getItem('mobile-MobileJob-sort') }));
return sessionStorage.getItem('__dd625_prevJobSort') !== null;`, 30000);
    await soft.run("PREMISE (data): the unfiltered window shows rows by at least 2 creators \u2014 `Collected By Me` has something to remove", async () => {
      await assertFromJavascript(page, `const rows = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')].map(it => {
  const c = it.querySelector('[class*="mantine-Accordion-control"]');
  if (!c) return null;
  const nm = c.querySelector('[class*="mantine-Highlight-root"]');
  const lab = c.querySelector('[class*="mantine-Accordion-label"]') || c;
  const last = lab.lastElementChild;
  const by = last && /mantine-Text-root/.test(last.className)
    && !last.querySelector('[class*="mantine-Highlight-root"]') ? last : null;
  const name = nm ? (nm.textContent || '').trim() : '';
  const line = by ? (by.textContent || '').trim() : '';
  const i = line.indexOf(', ');
  return name && i > 0 ? { name, creator: line.slice(0, i), key: name + '\\u0001' + line } : null;
});
if (!rows.length || rows.some(r => !r)) return false;
window.__ddCreators = [...new Set(rows.map(r => r.creator))];
return window.__ddCreators.length >= 2;`, 30000);
    });
    // Search "DD SYNTHETIC MOBILE" — this suite's own residue
    await assertFromJavascript(page, `const el = document.querySelector('input[placeholder="Find Asset(s)"]');
if (!el) return false;
const view = el.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value').set;
setter.call(el, 'DD SYNTHETIC MOBILE');
el.dispatchEvent(new view.Event('input', { bubbles: true }));
return el.value === 'DD SYNTHETIC MOBILE';`, 30000);
    // Let the debounced search (300 ms) apply
    await wait(page, 2);
    // NARROWED: 2 to 15 rows, every one ours, all distinct — and CAPTURE the server's default order (no sort chosen yet)
    await assertFromJavascript(page, `const rows = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')].map(it => {
  const c = it.querySelector('[class*="mantine-Accordion-control"]');
  if (!c) return null;
  const nm = c.querySelector('[class*="mantine-Highlight-root"]');
  const lab = c.querySelector('[class*="mantine-Accordion-label"]') || c;
  const last = lab.lastElementChild;
  const by = last && /mantine-Text-root/.test(last.className)
    && !last.querySelector('[class*="mantine-Highlight-root"]') ? last : null;
  const name = nm ? (nm.textContent || '').trim() : '';
  const line = by ? (by.textContent || '').trim() : '';
  const i = line.indexOf(', ');
  return name && i > 0 ? { name, creator: line.slice(0, i), key: name + '\\u0001' + line } : null;
});
if (!rows.length || rows.some(r => !r)) return false;
if (rows.length < 2 || rows.length > 15) return false;
if (!rows.every(r => r.name.includes('DD SYNTHETIC MOBILE'))) return false;
const keys = rows.map(r => r.key);
if (new Set(keys).size !== keys.length) return false;
window.__ddDefault = keys;
return true;`, 30000);
    // Open the sort dropdown
    await el(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 30000 });
    // Wait for the sort modal
    await wait(page, 2);
    // Open the sort options
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: 30000 });
    // Wait for the options
    await wait(page, 1);
    // Pick "Created At ▲"
    await el(page, `//*[@role="option"][normalize-space(.)="Created At ▲"]`).click({ timeout: 30000 });
    // Let the list re-order
    await wait(page, 2);
    await soft.run("\u2b50 CREATED AT \u25b2: exactly the reverse of the server's createdAt-DESC order", async () => {
      await assertFromJavascript(page, `const rows = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')].map(it => {
  const c = it.querySelector('[class*="mantine-Accordion-control"]');
  if (!c) return null;
  const nm = c.querySelector('[class*="mantine-Highlight-root"]');
  const lab = c.querySelector('[class*="mantine-Accordion-label"]') || c;
  const last = lab.lastElementChild;
  const by = last && /mantine-Text-root/.test(last.className)
    && !last.querySelector('[class*="mantine-Highlight-root"]') ? last : null;
  const name = nm ? (nm.textContent || '').trim() : '';
  const line = by ? (by.textContent || '').trim() : '';
  const i = line.indexOf(', ');
  return name && i > 0 ? { name, creator: line.slice(0, i), key: name + '\\u0001' + line } : null;
});
if (!rows.length || rows.some(r => !r)) return false;
const def = window.__ddDefault || [];
const now = rows.map(r => r.key);
const inNow = new Set(now), inDef = new Set(def);
const d = def.filter(k => inNow.has(k)), n = now.filter(k => inDef.has(k));
if (d.length < 2) return false;
d.reverse();
return n.join('\\u0000') === d.join('\\u0000');`, 30000);
    });
    // Open the sort dropdown
    await el(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 30000 });
    // Wait for the sort modal
    await wait(page, 2);
    // Open the sort options
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: 30000 });
    // Wait for the options
    await wait(page, 1);
    // Pick "Created At ▼"
    await el(page, `//*[@role="option"][normalize-space(.)="Created At ▼"]`).click({ timeout: 30000 });
    // Let the list re-order
    await wait(page, 2);
    await soft.run("\u2b50 CREATED AT \u25bc: the server's own order again", async () => {
      await assertFromJavascript(page, `const rows = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')].map(it => {
  const c = it.querySelector('[class*="mantine-Accordion-control"]');
  if (!c) return null;
  const nm = c.querySelector('[class*="mantine-Highlight-root"]');
  const lab = c.querySelector('[class*="mantine-Accordion-label"]') || c;
  const last = lab.lastElementChild;
  const by = last && /mantine-Text-root/.test(last.className)
    && !last.querySelector('[class*="mantine-Highlight-root"]') ? last : null;
  const name = nm ? (nm.textContent || '').trim() : '';
  const line = by ? (by.textContent || '').trim() : '';
  const i = line.indexOf(', ');
  return name && i > 0 ? { name, creator: line.slice(0, i), key: name + '\\u0001' + line } : null;
});
if (!rows.length || rows.some(r => !r)) return false;
const def = window.__ddDefault || [];
const now = rows.map(r => r.key);
const inNow = new Set(now), inDef = new Set(def);
const d = def.filter(k => inNow.has(k)), n = now.filter(k => inDef.has(k));
if (d.length < 2) return false;
return n.join('\\u0000') === d.join('\\u0000');`, 30000);
    });
    // Open the sort dropdown
    await el(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 30000 });
    // Wait for the sort modal
    await wait(page, 2);
    // Open the sort options
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: 30000 });
    // Wait for the options
    await wait(page, 1);
    // Pick "Name ▲"
    await el(page, `//*[@role="option"][normalize-space(.)="Name ▲"]`).click({ timeout: 30000 });
    // Let the list re-order
    await wait(page, 2);
    await soft.run("\u2b50 NAME \u25b2: the rendered names are their own `localeCompare` order", async () => {
      await assertFromJavascript(page, `const rows = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')].map(it => {
  const c = it.querySelector('[class*="mantine-Accordion-control"]');
  if (!c) return null;
  const nm = c.querySelector('[class*="mantine-Highlight-root"]');
  const lab = c.querySelector('[class*="mantine-Accordion-label"]') || c;
  const last = lab.lastElementChild;
  const by = last && /mantine-Text-root/.test(last.className)
    && !last.querySelector('[class*="mantine-Highlight-root"]') ? last : null;
  const name = nm ? (nm.textContent || '').trim() : '';
  const line = by ? (by.textContent || '').trim() : '';
  const i = line.indexOf(', ');
  return name && i > 0 ? { name, creator: line.slice(0, i), key: name + '\\u0001' + line } : null;
});
if (!rows.length || rows.some(r => !r)) return false;
const names = rows.map(r => r.name);
if (names.length < 2) return false;
const sorted = [...names].sort((a, b) => a.localeCompare(b));
return JSON.stringify(names) === JSON.stringify(sorted);`, 30000);
    });
    // Open the sort dropdown
    await el(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 30000 });
    // Wait for the sort modal
    await wait(page, 2);
    // Open the sort options
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: 30000 });
    // Wait for the options
    await wait(page, 1);
    // Pick "Name ▼"
    await el(page, `//*[@role="option"][normalize-space(.)="Name ▼"]`).click({ timeout: 30000 });
    // Let the list re-order
    await wait(page, 2);
    await soft.run("\u2b50 NAME \u25bc: exactly that order reversed", async () => {
      await assertFromJavascript(page, `const rows = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')].map(it => {
  const c = it.querySelector('[class*="mantine-Accordion-control"]');
  if (!c) return null;
  const nm = c.querySelector('[class*="mantine-Highlight-root"]');
  const lab = c.querySelector('[class*="mantine-Accordion-label"]') || c;
  const last = lab.lastElementChild;
  const by = last && /mantine-Text-root/.test(last.className)
    && !last.querySelector('[class*="mantine-Highlight-root"]') ? last : null;
  const name = nm ? (nm.textContent || '').trim() : '';
  const line = by ? (by.textContent || '').trim() : '';
  const i = line.indexOf(', ');
  return name && i > 0 ? { name, creator: line.slice(0, i), key: name + '\\u0001' + line } : null;
});
if (!rows.length || rows.some(r => !r)) return false;
const names = rows.map(r => r.name);
if (names.length < 2) return false;
const sorted = [...names].sort((a, b) => a.localeCompare(b));
sorted.reverse();
return JSON.stringify(names) === JSON.stringify(sorted);`, 30000);
    });
    // Clear the search
    await assertFromJavascript(page, `const el = document.querySelector('input[placeholder="Find Asset(s)"]');
if (!el) return false;
const view = el.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value').set;
setter.call(el, '');
el.dispatchEvent(new view.Event('input', { bubbles: true }));
return el.value === '';`, 30000);
    // Let the debounced search (300 ms) apply
    await wait(page, 2);
    // Open the sort dropdown
    await el(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 30000 });
    // Wait for the sort modal
    await wait(page, 2);
    // Open the sort options
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: 30000 });
    // Wait for the options
    await wait(page, 1);
    // Pick "Collected By Me"
    await el(page, `//*[@role="option"][normalize-space(.)="Collected By Me"]`).click({ timeout: 30000 });
    // Let the list re-order
    await wait(page, 2);
    await soft.run("\u2b50 COLLECTED BY ME: every rendered row has ONE creator, it was among the creators before, and one of those rows is ours \u2014 so it is the test account", async () => {
      await assertFromJavascript(page, `const rows = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')].map(it => {
  const c = it.querySelector('[class*="mantine-Accordion-control"]');
  if (!c) return null;
  const nm = c.querySelector('[class*="mantine-Highlight-root"]');
  const lab = c.querySelector('[class*="mantine-Accordion-label"]') || c;
  const last = lab.lastElementChild;
  const by = last && /mantine-Text-root/.test(last.className)
    && !last.querySelector('[class*="mantine-Highlight-root"]') ? last : null;
  const name = nm ? (nm.textContent || '').trim() : '';
  const line = by ? (by.textContent || '').trim() : '';
  const i = line.indexOf(', ');
  return name && i > 0 ? { name, creator: line.slice(0, i), key: name + '\\u0001' + line } : null;
});
if (!rows.length || rows.some(r => !r)) return false;
const creators = [...new Set(rows.map(r => r.creator))];
if (creators.length !== 1) return false;
if (!(window.__ddCreators || []).includes(creators[0])) return false;
return rows.some(r => r.name.includes('DD SYNTHETIC MOBILE'));`, 30000);
    });
    await soft.run("\u2026and it REMOVED rows: fewer creators than before the filter", async () => {
      await assertFromJavascript(page, `const rows = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')].map(it => {
  const c = it.querySelector('[class*="mantine-Accordion-control"]');
  if (!c) return null;
  const nm = c.querySelector('[class*="mantine-Highlight-root"]');
  const lab = c.querySelector('[class*="mantine-Accordion-label"]') || c;
  const last = lab.lastElementChild;
  const by = last && /mantine-Text-root/.test(last.className)
    && !last.querySelector('[class*="mantine-Highlight-root"]') ? last : null;
  const name = nm ? (nm.textContent || '').trim() : '';
  const line = by ? (by.textContent || '').trim() : '';
  const i = line.indexOf(', ');
  return name && i > 0 ? { name, creator: line.slice(0, i), key: name + '\\u0001' + line } : null;
});
if (!rows.length || rows.some(r => !r)) return false;
return (window.__ddCreators || []).length > new Set(rows.map(r => r.creator)).size;`, 30000);
    });
    await optional("Open the sort dropdown", async () => {
      await el(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 30000 });
    });
    await optional("Wait for the sort modal", async () => {
      await wait(page, 2);
    });
    await optional("Open the sort options", async () => {
      await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`).click({ timeout: 30000 });
    });
    await optional("Wait for the options", async () => {
      await wait(page, 1);
    });
    await optional("Pick \"Name \u25bc\"", async () => {
      await el(page, `//*[@role="option"][normalize-space(.)="Name ▼"]`).click({ timeout: 30000 });
    });
    await optional("Let the list re-order", async () => {
      await wait(page, 2);
    });
    await optional("SENTINEL (bugs \u00a738): the collector's pick was written to `mobile-MobileJob-sort` \u2014 the Asset Verification JOB LIST's key", async () => {
      await assertFromJavascript(page, `let v = null; try { v = JSON.parse(sessionStorage.getItem('mobile-MobileJob-sort') || 'null'); } catch (e) {}
return !!v && v.id === 'name_DESC';`, 15000);
    });
    // Navigate to the Asset Verification job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    await optional("Let the job list mount (it reads the key on mount)", async () => {
      await wait(page, 5);
    });
    await optional("Open the job list's sort dropdown", async () => {
      await el(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`).click({ timeout: 30000 });
    });
    await optional("Wait for the sort modal", async () => {
      await wait(page, 2);
    });
    await optional("SENTINEL (bugs \u00a738): the JOB LIST now sorts by a Name \u25bc nobody chose on it \u2014 its default is `Created At \u25bc`. Red here means it was fixed: rewrite this step", async () => {
      await assertFromJavascript(page, `const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Sort Criteria'));
const inp = m && m.querySelector('input[class*="mantine-Select-input"]');
const v = inp ? inp.value.trim() : '';
return /Name/.test(v) && v.endsWith('▼') && !/Created At/.test(v);`, 15000);
    });
    await optional("Close the sort modal", async () => {
      await page.keyboard.press(`Escape`);
    });
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // RESTORE: put `mobile-MobileJob-sort` back as it was before this test
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('__dd625_prevJobSort');
if (raw === null) return false;
const prev = JSON.parse(raw).v;
if (prev === null) sessionStorage.removeItem('mobile-MobileJob-sort');
else sessionStorage.setItem('mobile-MobileJob-sort', prev);
sessionStorage.removeItem('__dd625_prevJobSort');
window.__ddRestoredJobSort = prev;
return true;`, 30000);
    // RESTORED: `mobile-MobileJob-sort` holds its original value and the stash is gone
    await assertFromJavascript(page, `return sessionStorage.getItem('__dd625_prevJobSort') === null
  && sessionStorage.getItem('mobile-MobileJob-sort') === (window.__ddRestoredJobSort ?? null);`, 30000);
  }
  soft.check();
}
