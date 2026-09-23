// Generated from Mobile/dd_tests_mobile/MOB.722_AssetLookup_Reading_Capture.json by to_playwright.py — do not edit by hand yet.
// MOB.722_AssetLookup_Reading_Capture

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, click, press, typeText, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob722(page: Page): Promise<void> {
  const RUNID722 = runId('numeric', 5);
  const run = new Sequence();
  await run.step("Navigate to asset lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the page to mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Asset Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, 30000);
  });
  await run.step("Select any persisted query first (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for \"DD SYNTHETIC MOBILE\"", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `DD SYNTHETIC MOBILE`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter \u2014 there is no search button)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("RESULT GUARD: a \"DD SYNTHETIC MOBILE\" row rendered (MOB.600 residue)", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]`, 60000);
  });
  await run.step("Expand that row", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")]`, 30000);
  });
  await run.step("Let the detail panel mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("FIXTURE GUARD: the row's `Name` cell is exactly `DD SYNTHETIC MOBILE <8 digits>` \u2014 a throwaway asset; record the name", {}, async () => {
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
  });
  await run.step("Open the \"Readings\" tab", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"][normalize-space(.)="Readings"]`, 30000);
  });
  await run.step("The \"Readings\" tab is active", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"][normalize-space(.)="Readings"][@data-active]`, 30000);
  });
  await run.step("The asset-scoped readings form mounted", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//form[starts-with(@id, "asset-lookup-readings-")]`, 60000);
  });
  await run.step("ENSURE 1/3: the `Test 1` field is already on the form \u2014 or open `Add reading types` (once, when it is not loading)", {}, async () => {
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
  });
  await run.step("ENSURE 2/3: the field exists \u2014 or `Test 1` is picked in the MultiSelect (a pill)", {}, async () => {
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
  });
  await run.step("ENSURE 3/3: confirm with `Add` if the picker is open \u2014 the `Test 1` field is on the form; tag its input", {}, async () => {
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
  });
  await run.step("Focus the `Test 1` reading input", {}, async () => {
    await click(page, `//input[@data-dd722="reading"]`, 30000);
  });
  await run.step("Enter the reading `722<RUNID>`", {}, async () => {
    await typeText(page, `//input[@data-dd722="reading"]`, `722${RUNID722}`, DEFAULT_TIMEOUT);
  });
  await run.step("The input holds `722` + 5 digits; record it (the JS never reads RUNID)", {}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('input[data-dd722="reading"]');
const v = el ? (el.value || '').trim() : '';
if (!/^722\\d{5}$/.test(v)) return false;
sessionStorage.setItem('__dd722_value', v);
return true;`, 20000);
  });
  await run.step("Tab out \u2014 the form's onBlur recounts `filledInputs` (arms Submit)", {}, async () => {
    await press(page, `Tab`);
  });
  await run.step("Submit is ARMED \u2014 this row's `button[form=\"asset-lookup-readings-\u2026\"]` is `type=\"submit\"` (trap 8)", {}, async () => {
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const b = it.querySelector('button[form^="asset-lookup-readings-"]');
return !!b && b.type === 'submit';`, 30000);
  });
  await run.step("Submit the reading (CREATE_EVENT)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//button[starts-with(@form, "asset-lookup-readings-")]`, 30000);
  });
  await run.step("Brief wait for the toast", {}, async () => {
    await wait(page, 2);
  });
  await run.step("`Event readings captured.` toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Event readings captured.`, DEFAULT_TIMEOUT);
  });
  await run.step("\u2b50 SERVER: the asset's latest `Test 1` reading is exactly the value typed (CREATE_EVENT stored)", {}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd722_server', '__dd722_server:inflight', '__dd722_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("The `Test 1` field now renders that value as its previous entry (the post-save cache write)", {}, async () => {
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
  });
  await run.step("Collapse the row", {always: true}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")]`, 30000);
  });
  await run.step("RESTORED: the row reports itself collapsed", {always: true}, async () => {
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const c = it.querySelector('.mantine-Accordion-control');
return !!c && c.getAttribute('aria-expanded') === 'false';`, 30000);
  });
  await run.step("CLEANUP: remove this test's scratch keys, flags and tag, and the persisted search", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd722_asset', '__dd722_value', 'asset_lookup_query'].forEach(k => sessionStorage.removeItem(k));
delete window.__dd722_open; delete window.__dd722_add;
document.querySelectorAll('[data-dd722]').forEach(n => n.removeAttribute('data-dd722'));
return !sessionStorage.getItem('__dd722_asset') && !sessionStorage.getItem('__dd722_value');`, 15000);
  });
  run.finish();
}
