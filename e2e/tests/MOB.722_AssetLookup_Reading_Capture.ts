// Generated from Mobile/dd_tests_mobile/MOB.722_AssetLookup_Reading_Capture.json by to_playwright.py — do not edit by hand yet.
// MOB.722_AssetLookup_Reading_Capture

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, el, optional, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob722(page: Page): Promise<void> {
  const RUNID722 = runId('numeric', 5);
  try {
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for the page to mount
    await wait(page, 3);
    // Test the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: 30000 });
    // Select any persisted query first (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Search for "DD SYNTHETIC MOBILE"
    await el(page, `//input[@name="asset-search"]`).fill(`DD SYNTHETIC MOBILE`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter — there is no search button)
    await page.keyboard.press(`Enter`);
    // RESULT GUARD: a "DD SYNTHETIC MOBILE" row rendered (MOB.600 residue)
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]`, 60000);
    // Expand that row
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")]`).click({ timeout: 30000 });
    // Let the detail panel mount
    await wait(page, 3);
    // FIXTURE GUARD: the row's `Name` cell is exactly `DD SYNTHETIC MOBILE <8 digits>` — a throwaway asset; record the name
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const tr = [...it.querySelectorAll('tr')].find(t => {
  const b = t.querySelector('b');
  return b && b.textContent.trim() === 'Name';
});
const name = tr && tr.cells.length >= 2 ? tr.cells[1].textContent.trim() : '';
if (!/^DD SYNTHETIC MOBILE \\d{8}$/.test(name)) return false;
sessionStorage.setItem('__dd722_asset', name);
return true;`, 30000);
    // Open the "Readings" tab
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"][normalize-space(.)="Readings"]`).click({ timeout: 30000 });
    // The "Readings" tab is active
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"][normalize-space(.)="Readings"][@data-active]`, 30000);
    // The asset-scoped readings form mounted
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//form[starts-with(@id, "asset-lookup-readings-")]`, 60000);
    // ENSURE 1/3: the `Test 1` field is already on the form — or open `Add reading types` (once, when it is not loading)
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const form = it.querySelector('form[id^="asset-lookup-readings-"]');
if (!form) return false;
const field = () => [...form.querySelectorAll('input[placeholder="Enter reading"]')].find(inp => {
  const root = inp.closest('.mantine-NumberInput-root');
  const box = root && root.parentElement;
  const t = box && box.querySelector('.mantine-Text-root');
  return !!t && t.textContent.trim() === 'Test 1';
});
const picker = () => [...document.querySelectorAll('.mantine-Modal-content')]
  .find(m => (m.textContent || '').includes('Add Reading Types'));
if (field() || picker()) return true;
const b = it.querySelector('[aria-label="Add reading types"]');
if (!b || b.disabled || b.hasAttribute('data-loading')) return false;
if (!window.__dd722_open) { window.__dd722_open = 1; b.click(); }
return false;`, 45000);
    // ENSURE 2/3: the field exists — or `Test 1` is picked in the MultiSelect (a pill)
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const form = it.querySelector('form[id^="asset-lookup-readings-"]');
if (!form) return false;
const field = () => [...form.querySelectorAll('input[placeholder="Enter reading"]')].find(inp => {
  const root = inp.closest('.mantine-NumberInput-root');
  const box = root && root.parentElement;
  const t = box && box.querySelector('.mantine-Text-root');
  return !!t && t.textContent.trim() === 'Test 1';
});
const picker = () => [...document.querySelectorAll('.mantine-Modal-content')]
  .find(m => (m.textContent || '').includes('Add Reading Types'));
if (field()) return true;
const m = picker();
if (!m) return false;
if ([...m.querySelectorAll('.mantine-Pill-label')]
  .some(p => p.textContent.trim() === 'Test 1')) return true;
const opts = [...document.querySelectorAll('[role="option"]')]
  .filter(o => o.textContent.trim() === 'Test 1');
if (opts.length === 1) { opts[0].click(); return false; }
const inp = m.querySelector('input');
if (inp) { inp.focus(); inp.click(); }
return false;`, 45000);
    // ENSURE 3/3: confirm with `Add` if the picker is open — the `Test 1` field is on the form; tag its input
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const form = it.querySelector('form[id^="asset-lookup-readings-"]');
if (!form) return false;
const field = () => [...form.querySelectorAll('input[placeholder="Enter reading"]')].find(inp => {
  const root = inp.closest('.mantine-NumberInput-root');
  const box = root && root.parentElement;
  const t = box && box.querySelector('.mantine-Text-root');
  return !!t && t.textContent.trim() === 'Test 1';
});
const picker = () => [...document.querySelectorAll('.mantine-Modal-content')]
  .find(m => (m.textContent || '').includes('Add Reading Types'));
const f = field();
if (f) { document.querySelectorAll('[data-dd722]').forEach(n => n.removeAttribute('data-dd722'));
  f.setAttribute('data-dd722', 'reading'); return true; }
const m = picker();
if (!m) return false;
const add = [...m.querySelectorAll('button')].find(b => b.textContent.trim() === 'Add');
if (add && !add.disabled && !window.__dd722_add) { window.__dd722_add = 1; add.click(); }
return false;`, 45000);
    // Focus the `Test 1` reading input
    await el(page, `//input[@data-dd722="reading"]`).click({ timeout: 30000 });
    // Enter the reading `722<RUNID>`
    await el(page, `//input[@data-dd722="reading"]`).fill(`722${RUNID722}`, { timeout: DEFAULT_TIMEOUT });
    // The input holds `722` + 5 digits; record it (the JS never reads RUNID)
    await assertFromJavascript(page, `const el = document.querySelector('input[data-dd722="reading"]');
const v = el ? (el.value || '').trim() : '';
if (!/^722\\d{5}$/.test(v)) return false;
sessionStorage.setItem('__dd722_value', v);
return true;`, 20000);
    // Tab out — the form's onBlur recounts `filledInputs` (arms Submit)
    await page.keyboard.press(`Tab`);
    // Submit is ARMED — this row's `button[form="asset-lookup-readings-…"]` is `type="submit"` (trap 8)
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const b = it.querySelector('button[form^="asset-lookup-readings-"]');
return !!b && b.type === 'submit';`, 30000);
    // Submit the reading (CREATE_EVENT)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//button[starts-with(@form, "asset-lookup-readings-")]`).click({ timeout: 30000 });
    // Brief wait for the toast
    await wait(page, 2);
    await optional("`Event readings captured.` toast (optional: transient)", async () => {
      await assertPageContains(page, `Event readings captured.`, DEFAULT_TIMEOUT);
    });
    // ⭐ SERVER: the asset's latest `Test 1` reading is exactly the value typed (CREATE_EVENT stored)
    await assertFromJavascript(page, `const K = "__dd722_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const a = sessionStorage.getItem('__dd722_asset'), v = sessionStorage.getItem('__dd722_value');
  if (!a || !v) return false;
  const e = data.assets.edges.filter(x => x.name === a);
  if (e.length !== 1) return false;
  const r = (e[0].latestReadings || []).filter(x => x.readingType && x.readingType.name === 'Test 1');
  return r.length === 1 && Number(r[0].reading) === Number(v); })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: TableQuery!) { assets(params: $p) { edges { id name latestReadings { id reading readingDate readingType { id name } } } } }", variables: {"p": {"limit": 100, "query": {"conditions": [{"column": "name", "operator": "CONTAINS", "value": "DD SYNTHETIC MOBILE"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
    // The `Test 1` field now renders that value as its previous entry (the post-save cache write)
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const form = it.querySelector('form[id^="asset-lookup-readings-"]');
if (!form) return false;
const field = () => [...form.querySelectorAll('input[placeholder="Enter reading"]')].find(inp => {
  const root = inp.closest('.mantine-NumberInput-root');
  const box = root && root.parentElement;
  const t = box && box.querySelector('.mantine-Text-root');
  return !!t && t.textContent.trim() === 'Test 1';
});
const picker = () => [...document.querySelectorAll('.mantine-Modal-content')]
  .find(m => (m.textContent || '').includes('Add Reading Types'));
const v = sessionStorage.getItem('__dd722_value');
const f = field();
const box = f && f.closest('.mantine-NumberInput-root') && f.closest('.mantine-NumberInput-root').parentElement;
const g = box && box.querySelector('.mantine-Group-root');
return !!v && !!g && [...g.querySelectorAll('.mantine-Text-root')].some(t => t.textContent.trim() === v);`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd722_server', '__dd722_server:inflight', '__dd722_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Collapse the row
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")]`).click({ timeout: 30000 });
    // RESTORED: the row reports itself collapsed
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const c = it.querySelector('.mantine-Accordion-control');
return !!c && c.getAttribute('aria-expanded') === 'false';`, 30000);
    // CLEANUP: remove this test's scratch keys, flags and tag, and the persisted search
    await assertFromJavascript(page, `['__dd722_asset', '__dd722_value', 'asset_lookup_query'].forEach(k => sessionStorage.removeItem(k));
delete window.__dd722_open; delete window.__dd722_add;
document.querySelectorAll('[data-dd722]').forEach(n => n.removeAttribute('data-dd722'));
return !sessionStorage.getItem('__dd722_asset') && !sessionStorage.getItem('__dd722_value');`, 15000);
  }
}
