// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.625_Collector_List_Sort.json. This file is the source now: edit it directly.
// MOB.625_Collector_List_Sort

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertFromJavascript, click, press, wait } from '../../support/dd';

export async function mob625(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the Asset Collector", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the collected list load", {}, async () => {
    await wait(page, 5);
  });
  await run.step("The collected list rendered rows, each with a name and a creator line", {}, async () => {
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
  });
  await run.step("STASH: remember `mobile-MobileJob-sort` as it was, so the restore can put it back", {}, async () => {
    await assertFromJavascript(page, `if (sessionStorage.getItem('__dd625_prevJobSort') === null)
  sessionStorage.setItem('__dd625_prevJobSort', JSON.stringify({ v: sessionStorage.getItem('mobile-MobileJob-sort') }));
return sessionStorage.getItem('__dd625_prevJobSort') !== null;`, 30000);
  });
  await run.step("PREMISE (data): the unfiltered window shows rows by at least 2 creators \u2014 `Collected By Me` has something to remove", {allow: 'soft'}, async () => {
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
  await run.step("Search \"DD SYNTHETIC MOBILE\" \u2014 this suite's own residue", {}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('input[placeholder="Find Asset(s)"]');
if (!el) return false;
const view = el.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value').set;
setter.call(el, 'DD SYNTHETIC MOBILE');
el.dispatchEvent(new view.Event('input', { bubbles: true }));
return el.value === 'DD SYNTHETIC MOBILE';`, 30000);
  });
  await run.step("Let the debounced search (300 ms) apply", {}, async () => {
    await wait(page, 2);
  });
  await run.step("NARROWED: 2 to 15 rows, every one ours, all distinct \u2014 and CAPTURE the server's default order (no sort chosen yet)", {}, async () => {
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
  });
  await run.step("Open the sort dropdown", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 30000);
  });
  await run.step("Wait for the sort modal", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Open the sort options", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, 30000);
  });
  await run.step("Wait for the options", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Pick \"Created At \u25b2\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Created At ▲"]`, 30000);
  });
  await run.step("Let the list re-order", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 CREATED AT \u25b2: exactly the reverse of the server's createdAt-DESC order", {allow: 'soft'}, async () => {
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
  await run.step("Open the sort dropdown", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 30000);
  });
  await run.step("Wait for the sort modal", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Open the sort options", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, 30000);
  });
  await run.step("Wait for the options", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Pick \"Created At \u25bc\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Created At ▼"]`, 30000);
  });
  await run.step("Let the list re-order", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 CREATED AT \u25bc: the server's own order again", {allow: 'soft'}, async () => {
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
  await run.step("Open the sort dropdown", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 30000);
  });
  await run.step("Wait for the sort modal", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Open the sort options", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, 30000);
  });
  await run.step("Wait for the options", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Pick \"Name \u25b2\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Name ▲"]`, 30000);
  });
  await run.step("Let the list re-order", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 NAME \u25b2: the rendered names are their own `localeCompare` order", {allow: 'soft'}, async () => {
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
  await run.step("Open the sort dropdown", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 30000);
  });
  await run.step("Wait for the sort modal", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Open the sort options", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, 30000);
  });
  await run.step("Wait for the options", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Pick \"Name \u25bc\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Name ▼"]`, 30000);
  });
  await run.step("Let the list re-order", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 NAME \u25bc: exactly that order reversed", {allow: 'soft'}, async () => {
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
  await run.step("Clear the search", {}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('input[placeholder="Find Asset(s)"]');
if (!el) return false;
const view = el.ownerDocument.defaultView;
const setter = Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value').set;
setter.call(el, '');
el.dispatchEvent(new view.Event('input', { bubbles: true }));
return el.value === '';`, 30000);
  });
  await run.step("Let the debounced search (300 ms) apply", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Open the sort dropdown", {}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 30000);
  });
  await run.step("Wait for the sort modal", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Open the sort options", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, 30000);
  });
  await run.step("Wait for the options", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Pick \"Collected By Me\"", {}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Collected By Me"]`, 30000);
  });
  await run.step("Let the list re-order", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 COLLECTED BY ME: every rendered row has ONE creator, it was among the creators before, and one of those rows is ours \u2014 so it is the test account", {allow: 'soft'}, async () => {
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
  await run.step("\u2026and it REMOVED rows: fewer creators than before the filter", {allow: 'soft'}, async () => {
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
  await run.step("Open the sort dropdown", {allow: 'ignore'}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 30000);
  });
  await run.step("Wait for the sort modal", {allow: 'ignore'}, async () => {
    await wait(page, 2);
  });
  await run.step("Open the sort options", {allow: 'ignore'}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Sort Criteria")]//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]`, 30000);
  });
  await run.step("Wait for the options", {allow: 'ignore'}, async () => {
    await wait(page, 1);
  });
  await run.step("Pick \"Name \u25bc\"", {allow: 'ignore'}, async () => {
    await click(page, `//*[@role="option"][normalize-space(.)="Name ▼"]`, 30000);
  });
  await run.step("Let the list re-order", {allow: 'ignore'}, async () => {
    await wait(page, 2);
  });
  await run.step("SENTINEL (bugs \u00a738): the collector's pick was written to `mobile-MobileJob-sort` \u2014 the Asset Verification JOB LIST's key", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `let v = null; try { v = JSON.parse(sessionStorage.getItem('mobile-MobileJob-sort') || 'null'); } catch (e) {}
return !!v && v.id === 'name_DESC';`, 15000);
  });
  await run.step("Navigate to the Asset Verification job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the job list mount (it reads the key on mount)", {allow: 'ignore'}, async () => {
    await wait(page, 5);
  });
  await run.step("Open the job list's sort dropdown", {allow: 'ignore'}, async () => {
    await click(page, `//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up" or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ") or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]`, 30000);
  });
  await run.step("Wait for the sort modal", {allow: 'ignore'}, async () => {
    await wait(page, 2);
  });
  await run.step("SENTINEL (bugs \u00a738): the JOB LIST now sorts by a Name \u25bc nobody chose on it \u2014 its default is `Created At \u25bc`. Red here means it was fixed: rewrite this step", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Sort Criteria'));
const inp = m && m.querySelector('input[class*="mantine-Select-input"]');
const v = inp ? inp.value.trim() : '';
return /Name/.test(v) && v.endsWith('▼') && !/Created At/.test(v);`, 15000);
  });
  await run.step("Close the sort modal", {allow: 'ignore'}, async () => {
    await press(page, `Escape`);
  });
  await run.step("RESTORE: put `mobile-MobileJob-sort` back as it was before this test", {always: true}, async () => {
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('__dd625_prevJobSort');
if (raw === null) return false;
const prev = JSON.parse(raw).v;
if (prev === null) sessionStorage.removeItem('mobile-MobileJob-sort');
else sessionStorage.setItem('mobile-MobileJob-sort', prev);
sessionStorage.removeItem('__dd625_prevJobSort');
window.__ddRestoredJobSort = prev;
return true;`, 30000);
  });
  await run.step("RESTORED: `mobile-MobileJob-sort` holds its original value and the stash is gone", {always: true}, async () => {
    await assertFromJavascript(page, `return sessionStorage.getItem('__dd625_prevJobSort') === null
  && sessionStorage.getItem('mobile-MobileJob-sort') === (window.__ddRestoredJobSort ?? null);`, 30000);
  });
  run.finish();
}
