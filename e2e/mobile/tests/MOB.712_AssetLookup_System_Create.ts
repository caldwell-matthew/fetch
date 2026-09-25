// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.712_AssetLookup_System_Create.json. This file is the source now: edit it directly.
// MOB.712_AssetLookup_System_Create

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, click, press, typeText, wait } from '../../support/dd';
import { runId } from '../../support/env';

export async function mob712(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
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
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]`, 60000);
  });
  await run.step("Expand that row", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")]`, 30000);
  });
  await run.step("Let the detail panel mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("FIXTURE GUARD: the row's `Name` cell is exactly `DD SYNTHETIC MOBILE <8 digits>` \u2014 a throwaway asset; record the name", {}, async () => {
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const cell = label => {
  const tr = [...it.querySelectorAll('tr')].find(t => {
    const b = t.querySelector('b');
    return b && b.textContent.trim() === label;
  });
  return tr && tr.cells.length >= 2 ? tr.cells[1] : null;
};
const c = cell('Name');
const name = c ? c.textContent.trim() : '';
if (!/^DD SYNTHETIC MOBILE \\d{8}$/.test(name)) return false;
sessionStorage.setItem('__dd712_asset', name);
return true;`, 30000);
  });
  await run.step("Open the General Info column picker (`table-columns`)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//button[.//*[@data-icon="table-columns" or contains(concat(" ", normalize-space(@class), " "), " fa-table-columns ")]]`, 30000);
  });
  await run.step("The column picker is open (`Find Column(s)`)", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Column(s)"]`, 30000);
  });
  await run.step("BEFORE: record the General Info column selection (localStorage \u2014 restored at the end)", {}, async () => {
    await assertFromJavascript(page, `const v = localStorage.getItem('_assetlookup_generalinfo_cols_');
if (!v) return false;
try { JSON.parse(v); } catch (e) { return false; }
sessionStorage.setItem('__dd712_cols', v);
return true;`, 30000);
  });
  await run.step("Tick `System` in the picker \u2014 its checkbox is now checked", {}, async () => {
    await assertFromJavascript(page, `const roots = [...document.querySelectorAll('.mantine-Menu-dropdown .mantine-Checkbox-root')]
  .filter(r => { const l = r.querySelector('.mantine-Checkbox-label');
    return l && l.textContent.trim() === 'System'; });
if (roots.length !== 1) return false;
const box = roots[0].querySelector('input[type="checkbox"]');
if (!box) return false;
if (!box.checked && !window.__dd712_ticked) { window.__dd712_ticked = 1; box.click(); }
return box.checked;`, 30000);
  });
  await run.step("Close the column picker", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("The `System` row now renders in General Info, with its edit pencil (`allowUpdate` and `asset.update`)", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//tr[.//b[normalize-space(.)="System"]]//button[.//*[@data-icon="pen-to-square" or contains(concat(" ", normalize-space(@class), " "), " fa-pen-to-square ")]]`, 30000);
  });
  await run.step("Open the System edit form", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//tr[.//b[normalize-space(.)="System"]]//button[.//*[@data-icon="pen-to-square" or contains(concat(" ", normalize-space(@class), " "), " fa-pen-to-square ")]]`, 30000);
  });
  await run.step("The edit modal opened on the System lookup (`#systemId`)", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@id="systemId"]`, 30000);
  });
  await run.step("Focus the System lookup", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@id="systemId"]`, 30000);
  });
  await run.step("Select any current System name (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type a new System name \"DD SYNTHETIC MOBILE {{ RUNID }}\"", {}, async () => {
    await typeText(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@id="systemId"]`, `DD SYNTHETIC MOBILE ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("The lookup holds `DD SYNTHETIC MOBILE <8 digits>`; record it (the JS never reads RUNID)", {}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('.mantine-Modal-content #systemId');
const v = el ? (el.value || '').trim() : '';
if (!/^DD SYNTHETIC MOBILE \\d{8}$/.test(v)) return false;
sessionStorage.setItem('__dd712_system', v);
return true;`, 30000);
  });
  await run.step("The dropdown offers exactly ONE option `+ Create '<that name>'` (`ListFilter`, `noMatch`)", {}, async () => {
    await assertFromJavascript(page, `const n = sessionStorage.getItem('__dd712_system');
if (!n) return false;
const hits = [...document.querySelectorAll('[role="option"]')]
  .filter(o => (o.textContent || '').trim().indexOf('+ Create') === 0);
return hits.length === 1 && hits[0].textContent.trim() === "+ Create '" + n + "'";`, 30000);
  });
  await run.step("Click `+ Create` \u2014 `onCreate`: CREATE_SYSTEM, then UPDATE_ASSET systemId", {}, async () => {
    await click(page, `//*[@role="option"][starts-with(normalize-space(.), "+ Create")]`, 30000);
  });
  await run.step("Brief wait for the toast", {}, async () => {
    await wait(page, 2);
  });
  await run.step("`System updated` toast (optional: transient \u2014 UPDATE_ASSET's `update()`)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `System updated`, DEFAULT_TIMEOUT);
  });
  await run.step("The System lookup's modal is gone and the row is still expanded (it closes whatever the server says \u2014 not proof)", {}, async () => {
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const c = it.querySelector('.mantine-Accordion-control');
return !document.querySelector('.mantine-Modal-content #systemId')
  && !!c && c.getAttribute('aria-expanded') === 'true';`, 30000);
  });
  await run.step("\u2b50 SERVER: exactly ONE System carries the typed name (CREATE_SYSTEM stored it, once)", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd712_server_system", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const n = sessionStorage.getItem('__dd712_system'); if (!n) return false;
  return data.systems.edges.filter(s => s.name === n).length === 1; })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: TableQuery!) { systems(params: $p) { edges { id name } } }", variables: {"p": {"limit": 100, "query": {"conditions": [{"column": "name", "operator": "CONTAINS", "value": "DD SYNTHETIC MOBILE"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd712_server_system', '__dd712_server_system:inflight', '__dd712_server_system:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\u2b50 SERVER: the asset's `systemId` IS that System \u2014 same id, same name (UPDATE_ASSET)", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd712_server_asset", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const a = sessionStorage.getItem('__dd712_asset'), n = sessionStorage.getItem('__dd712_system');
  if (!a || !n) return false;
  const as = data.assets.edges.filter(e => e.name === a);
  const ss = data.systems.edges.filter(s => s.name === n);
  return as.length === 1 && ss.length === 1 && !!as[0].systemId
    && as[0].systemId.id === ss[0].id && as[0].systemId.name === n; })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: TableQuery!) { assets(params: $p) { edges { id name systemId { id name } } } systems(params: $p) { edges { id name } } }", variables: {"p": {"limit": 100, "query": {"conditions": [{"column": "name", "operator": "CONTAINS", "value": "DD SYNTHETIC MOBILE"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd712_server_asset', '__dd712_server_asset:inflight', '__dd712_server_asset:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Close anything still open (optional)", {always: true, allow: 'ignore'}, async () => {
    await press(page, `Escape`);
  });
  await run.step("No System lookup modal is left open, and the marker row is still on the page", {always: true}, async () => {
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
return !document.querySelector('.mantine-Modal-content #systemId');`, 15000);
  });
  await run.step("Open the General Info column picker (`table-columns`)", {always: true}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//button[.//*[@data-icon="table-columns" or contains(concat(" ", normalize-space(@class), " "), " fa-table-columns ")]]`, 30000);
  });
  await run.step("The column picker is open (`Find Column(s)`)", {always: true}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Column(s)"]`, 30000);
  });
  await run.step("RESTORE: untick `System` in the picker \u2014 its checkbox is now unchecked", {always: true}, async () => {
    await assertFromJavascript(page, `const roots = [...document.querySelectorAll('.mantine-Menu-dropdown .mantine-Checkbox-root')]
  .filter(r => { const l = r.querySelector('.mantine-Checkbox-label');
    return l && l.textContent.trim() === 'System'; });
if (roots.length !== 1) return false;
const box = roots[0].querySelector('input[type="checkbox"]');
if (!box) return false;
if (box.checked && !window.__dd712_unticked) { window.__dd712_unticked = 1; box.click(); }
return !box.checked;`, 30000);
  });
  await run.step("Close the column picker", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("RESTORED: localStorage no longer shows `systemId`, and every other column is as recorded", {always: true}, async () => {
    await assertFromJavascript(page, `let cur, before;
try { cur = JSON.parse(localStorage.getItem('_assetlookup_generalinfo_cols_') || 'null');
  before = JSON.parse(sessionStorage.getItem('__dd712_cols') || 'null'); } catch (e) { return false; }
if (!cur || cur.systemId) return false;
if (!before) return true;
const keys = new Set([...Object.keys(before), ...Object.keys(cur)]);
keys.delete('systemId');
return [...keys].every(k => !!cur[k] === !!before[k]);`, 30000);
  });
  await run.step("Collapse the row", {always: true}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")]`, 30000);
  });
  await run.step("RESTORED: the row reports itself collapsed", {always: true}, async () => {
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const c = it.querySelector('.mantine-Accordion-control');
return !!c && c.getAttribute('aria-expanded') === 'false';`, 30000);
  });
  await run.step("CLEANUP: remove this test's scratch keys and flags, and the persisted search", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd712_asset', '__dd712_system', '__dd712_cols', 'asset_lookup_query'].forEach(k => sessionStorage.removeItem(k));
delete window.__dd712_ticked; delete window.__dd712_unticked;
return !sessionStorage.getItem('__dd712_asset') && !sessionStorage.getItem('__dd712_system');`, 15000);
  });
  run.finish();
}
