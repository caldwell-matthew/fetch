// Generated from Mobile/dd_tests_mobile/MOB.354_Work_Asset_Add_Remove.json by to_playwright.py — do not edit by hand yet.
// MOB.354_Work_Asset_Add_Remove

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, click, press, typeText, wait } from '../support/dd';

export async function mob354(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 warm the work lookup cache", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Let the lookup prefetch run", {}, async () => {
    await wait(page, 30);
  });
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("GATE: the detail data arrived (tab strip)", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
  });
  await run.step("Open the \"Assets\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][normalize-space(.)="Assets"]`, 30000);
  });
  await run.step("\"Assets\" is now the active tab", {}, async () => {
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Assets"][@data-active="true"]`, 30000);
  });
  await run.step("PREMISE (server): the stage links ONLY Pump 0102 (its link at rest), no Bypass Valve 0001; rest address/x/y, `Ready` \u2014 and record its condition/failure ids", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd354_links", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((w => (w => !!w && w.status === 'Ready' && w.address === '230 North Alexander Street, New Orleans, LA 70119' && Math.abs(Number(w.x) - (-90.1025785)) < 1e-6 && Math.abs(Number(w.y) - (29.9782827)) < 1e-6)(w) && (w => { const p = (w.assets || []).filter(a => a && a.id === 'AE09h8JhBBhMtd1wIs98lQ');
  return p.length === 1 && !!p[0].asset && p[0].asset.id === 'oB5BUN1Es1Jctw8FVYwYBh' && p[0].status === 'Active' && p[0].sequence === 1 && p[0].comment === 'Chemical dosing pump, model PDM 2000, plastic housing with digital control panel, horizontal mount.'; })(w) && w.assets.length === 1 && (w => (w.assets || []).filter(a => a && a.asset && a.asset.id === 'wFRo1MMwoAMkdxA4hVpIhB'))(w).length === 0
  && (sessionStorage.setItem('__dd354_cf', (w => JSON.stringify([(w.condition || []).map(c => c.id).sort(), (w.failures || []).map(f => f.id).sort()]))(w)), true))(data.workStage)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id status address x y condition { id } failures { id } assets { id status sequence comment asset: assetId { id name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd354_links', '__dd354_links:inflight', '__dd354_links:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("PREMISE PASSED \u2014 mark this run (the backstop acts only on a run that proved Bypass Valve 0001 absent first)", {}, async () => {
    await assertFromJavascript(page, `sessionStorage.setItem('__dd354_premise', '1');
return sessionStorage.getItem('__dd354_premise') === '1';`, 15000);
  });
  await run.step("STASH the persisted Asset Lookup query \u2014 the picker's search writes `asset_lookup_query`", {}, async () => {
    await assertFromJavascript(page, `if (sessionStorage.getItem('__dd354_prevQuery') === null)
  sessionStorage.setItem('__dd354_prevQuery', JSON.stringify(sessionStorage.getItem('asset_lookup_query')));
return true;`, 15000);
  });
  await run.step("The Assets tab lists ONE row \u2014 Pump 0102's \u2014 and no Bypass Valve 0001", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
if (!tabEl || (tabEl.textContent || '').trim() !== 'Assets') return false;
const p = tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
if (!p) return false;
const rows = [...p.querySelectorAll('.mantine-Accordion-item')];
const named = n => rows.filter(r => { const c = r.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes(n); });
return rows.length === 1 && named('Pump 0102').length === 1 && named('Bypass Valve 0001').length === 0;`, 60000);
  });
  await run.step("Open `Add Asset`", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add Asset"]`, 30000);
  });
  await run.step("The add modal offers `Add Existing Asset`", {}, async () => {
    await assertElementPresent(page, `//label[contains(concat(" ", normalize-space(@class), " "), " mantine-SegmentedControl-label ")][normalize-space(.)="Add Existing Asset"]`, 30000);
  });
  await run.step("Choose `Add Existing Asset`", {}, async () => {
    await click(page, `//label[contains(concat(" ", normalize-space(@class), " "), " mantine-SegmentedControl-label ")][normalize-space(.)="Add Existing Asset"]`, 30000);
  });
  await run.step("The picker's search box mounted (in the modal)", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@name="asset-search"]`, 60000);
  });
  await run.step("The picker finished its first load \u2014 no LoadingOverlay over it, and it rendered rows or `No Results`", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')].find(x => x.querySelector('input[name="asset-search"]'));
if (!m) return false;
if (m.querySelector('.mantine-LoadingOverlay-overlay, .mantine-LoadingOverlay-root')) return false;
return m.querySelectorAll('.mantine-Accordion-item').length > 0 || /No Results/.test(m.textContent || '');`, 60000);
  });
  await run.step("Focus the picker's search box", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@name="asset-search"]`, 30000);
  });
  await run.step("Select any persisted query first (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for Bypass Valve 0001", {}, async () => {
    await typeText(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@name="asset-search"]`, `Bypass Valve 0001`, 30000);
  });
  await run.step("Submit the search (Enter)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("The picker lists exactly one `Bypass Valve 0001` row, UNCHECKED, and the footer reads `Add 0 Asset(s)`", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')].find(x => x.querySelector('input[name="asset-search"]'));
if (!m) return false;
const items = [...m.querySelectorAll('.mantine-Accordion-item')];
const bv = items.filter(i => ((i.querySelector('.mantine-Accordion-control') || {}).textContent || '').trim() === 'Bypass Valve 0001');
const btn = [...m.querySelectorAll('button')].find(b => /^Add \\d+ Asset\\(s\\)$/.test((b.textContent || '').trim()));
const cb = bv.length === 1 ? bv[0].querySelector('input[type="checkbox"]') : null;
if (!cb || !btn) return false;
return !cb.checked && btn.textContent.trim() === 'Add 0 Asset(s)';`, 60000);
  });
  await run.step("Check Bypass Valve 0001's box", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][normalize-space(.)="Bypass Valve 0001"]]//input[@type="checkbox"]`, 30000);
  });
  await run.step("Bypass Valve 0001 is CHECKED and the footer reads `Add 1 Asset(s)`", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')].find(x => x.querySelector('input[name="asset-search"]'));
if (!m) return false;
const items = [...m.querySelectorAll('.mantine-Accordion-item')];
const bv = items.filter(i => ((i.querySelector('.mantine-Accordion-control') || {}).textContent || '').trim() === 'Bypass Valve 0001');
const btn = [...m.querySelectorAll('button')].find(b => /^Add \\d+ Asset\\(s\\)$/.test((b.textContent || '').trim()));
const cb = bv.length === 1 ? bv[0].querySelector('input[type="checkbox"]') : null;
if (!cb || !btn) return false;
return cb.checked && btn.textContent.trim() === 'Add 1 Asset(s)';`, 30000);
  });
  await run.step("Click `Add 1 Asset(s)`", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[normalize-space(.)="Add 1 Asset(s)"]`, 30000);
  });
  await run.step("The `Asset added to workstage!` toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Asset added to workstage!`, 10000);
  });
  await run.step("The picker closed and the page is still alive (it closes on click \u2014 not the proof)", {}, async () => {
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.querySelector('input[name="asset-search"]');`, 30000);
  });
  await run.step("\u2b50 SERVER: the stage now links Bypass Valve 0001 beside Pump 0102 (untouched); address/x/y unchanged \u2014 asked over /graphql", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd354_links", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((w => (w => !!w && w.status === 'Ready' && w.address === '230 North Alexander Street, New Orleans, LA 70119' && Math.abs(Number(w.x) - (-90.1025785)) < 1e-6 && Math.abs(Number(w.y) - (29.9782827)) < 1e-6)(w) && (w => { const p = (w.assets || []).filter(a => a && a.id === 'AE09h8JhBBhMtd1wIs98lQ');
  return p.length === 1 && !!p[0].asset && p[0].asset.id === 'oB5BUN1Es1Jctw8FVYwYBh' && p[0].status === 'Active' && p[0].sequence === 1 && p[0].comment === 'Chemical dosing pump, model PDM 2000, plastic housing with digital control panel, horizontal mount.'; })(w) && w.assets.length === 2 && (w => (w.assets || []).filter(a => a && a.asset && a.asset.id === 'wFRo1MMwoAMkdxA4hVpIhB'))(w).length === 1)(data.workStage)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id status address x y condition { id } failures { id } assets { id status sequence comment asset: assetId { id name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd354_links', '__dd354_links:inflight', '__dd354_links:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("The Assets tab now lists Bypass Valve 0001 beside Pump 0102", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
if (!tabEl || (tabEl.textContent || '').trim() !== 'Assets') return false;
const p = tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
if (!p) return false;
const rows = [...p.querySelectorAll('.mantine-Accordion-item')];
const named = n => rows.filter(r => { const c = r.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes(n); });
return rows.length === 2 && named('Bypass Valve 0001').length === 1 && named('Pump 0102').length === 1;`, 60000);
  });
  await run.step("GATE (\ud83d\udc1e crash workaround): the Asset schema is cached \u2014 every row renders its geolocate control \u2014 so expanding a row cannot hit the AssetLookupDetails crash", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
if (!tabEl || (tabEl.textContent || '').trim() !== 'Assets') return false;
const p = tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
if (!p) return false;
const rows = [...p.querySelectorAll('.mantine-Accordion-item')];
const named = n => rows.filter(r => { const c = r.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes(n); });
return rows.length === 2 && rows.every(r => !!r.querySelector('[data-icon="location-crosshairs"]'));`, 60000);
  });
  await run.step("Expand Bypass Valve 0001's row by its chevron", {}, async () => {
    await click(page, `(//*[@role="tabpanel"]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(normalize-space(.), "Bypass Valve 0001")]]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")])[1]`, 30000);
  });
  await run.step("Bypass Valve 0001's row expanded \u2014 its panel holds exactly one gear, and the page did not crash", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
if (!tabEl || (tabEl.textContent || '').trim() !== 'Assets') return false;
const p = tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
if (!p) return false;
const rows = [...p.querySelectorAll('.mantine-Accordion-item')];
const named = n => rows.filter(r => { const c = r.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes(n); });
const mine = named('Bypass Valve 0001');
const panel = mine.length === 1 ? mine[0].querySelector('.mantine-Accordion-panel') : null;
return !!panel && panel.querySelectorAll('[aria-label="Menu"]').length === 1;`, 30000);
  });
  await run.step("\ud83d\uded1 GUARD + open its gear: only on a run whose premise passed, with exactly two rows, exactly one named Bypass Valve 0001 (not Pump 0102), holding exactly one gear", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
if (!tabEl || (tabEl.textContent || '').trim() !== 'Assets') return false;
const p = tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
if (!p) return false;
const rows = [...p.querySelectorAll('.mantine-Accordion-item')];
const named = n => rows.filter(r => { const c = r.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes(n); });
if (sessionStorage.getItem('__dd354_premise') !== '1') return false;
const mine = named('Bypass Valve 0001');
if (rows.length !== 2 || mine.length !== 1) return false;
if ((mine[0].querySelector('.mantine-Accordion-control').textContent || '').includes('Pump 0102')) return false;
const panel = mine[0].querySelector('.mantine-Accordion-panel');
const gears = panel ? [...panel.querySelectorAll('[aria-label="Menu"]')] : [];
if (gears.length !== 1) return false;
gears[0].click();
return true;`, 30000);
  });
  await run.step("The gear menu offers `Delete Item`", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Delete Item"]`, 30000);
  });
  await run.step("Click `Delete Item` \u2014 on Bypass Valve 0001's link", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Delete Item"]`, 30000);
  });
  await run.step("The confirmation opened", {}, async () => {
    await assertPageContains(page, `Are you sure you want to delete this record?`, 30000);
  });
  await run.step("Confirm: \"Yes\"", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Are you sure you want to delete this record?")]]//button[normalize-space(.)="Yes"]`, 30000);
  });
  await run.step("\u2b50 SERVER: no Bypass Valve 0001 link remains; the Pump 0102 link, the condition/failure ids and address/x/y are untouched", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd354_links", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((w => (w => !!w && w.status === 'Ready' && w.address === '230 North Alexander Street, New Orleans, LA 70119' && Math.abs(Number(w.x) - (-90.1025785)) < 1e-6 && Math.abs(Number(w.y) - (29.9782827)) < 1e-6)(w) && (w => { const p = (w.assets || []).filter(a => a && a.id === 'AE09h8JhBBhMtd1wIs98lQ');
  return p.length === 1 && !!p[0].asset && p[0].asset.id === 'oB5BUN1Es1Jctw8FVYwYBh' && p[0].status === 'Active' && p[0].sequence === 1 && p[0].comment === 'Chemical dosing pump, model PDM 2000, plastic housing with digital control panel, horizontal mount.'; })(w) && w.assets.length === 1 && (w => (w.assets || []).filter(a => a && a.asset && a.asset.id === 'wFRo1MMwoAMkdxA4hVpIhB'))(w).length === 0
  && sessionStorage.getItem('__dd354_cf') === (w => JSON.stringify([(w.condition || []).map(c => c.id).sort(), (w.failures || []).map(f => f.id).sort()]))(w))(data.workStage)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id status address x y condition { id } failures { id } assets { id status sequence comment asset: assetId { id name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd354_links', '__dd354_links:inflight', '__dd354_links:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("The Assets tab lists only Pump 0102 again", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
if (!tabEl || (tabEl.textContent || '').trim() !== 'Assets') return false;
const p = tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
if (!p) return false;
const rows = [...p.querySelectorAll('.mantine-Accordion-item')];
const named = n => rows.filter(r => { const c = r.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes(n); });
return rows.length === 1 && named('Pump 0102').length === 1 && named('Bypass Valve 0001').length === 0;`, 30000);
  });
  await run.step("Escape \u2014 leave no menu or modal open", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("RESTORE the persisted Asset Lookup query to what it was before the picker's search", {always: true}, async () => {
    await assertFromJavascript(page, `const raw = sessionStorage.getItem('__dd354_prevQuery');
if (raw === null) return true;
const prev = JSON.parse(raw);
if (prev === null) sessionStorage.removeItem('asset_lookup_query');
else sessionStorage.setItem('asset_lookup_query', prev);
sessionStorage.removeItem('__dd354_prevQuery');
return sessionStorage.getItem('asset_lookup_query') === prev;`, 15000);
  });
  await run.step("BACKSTOP: on a run whose premise passed, if exactly one Bypass Valve 0001 link remains, remove THAT link id (never Pump 0102's) over /graphql", {always: true}, async () => {
    await assertFromJavascript(page, `const K = '__dd354_net';
if (sessionStorage.getItem('__dd354_premise') !== '1') return true;   // this run never proved it absent: touch nothing
const st = sessionStorage.getItem(K);
if (st === 'done') return true;
if (st === 'asking') return false;
sessionStorage.setItem(K, 'asking');
const post = body => window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' }, body: JSON.stringify(body) });
post({ query: 'query($id: ID!) { workStage(id: $id) { id status address x y condition { id } failures { id } assets { id status sequence comment asset: assetId { id name } } } }', variables: { id: 'EYRpYJ9QYdQ1JFF10JtB0Q' } })
  .then(r => r.json())
  .then(j => {
    const w = j && j.data && j.data.workStage;
    const ids = w ? (w.assets || []).filter(a => a && a.asset && a.asset.id === 'wFRo1MMwoAMkdxA4hVpIhB' && a.id !== 'AE09h8JhBBhMtd1wIs98lQ').map(a => a.id) : [];
    if (ids.length !== 1) { sessionStorage.setItem(K, 'done'); return; }
    sessionStorage.setItem(K + ':sent', ids[0]);
    return post({ query: 'mutation($ids: [ID!]!, $parentId: ID!) { removeWorkStageAssetLinks(ids: $ids, parentId: $parentId) }', variables: { ids: ids, parentId: 'EYRpYJ9QYdQ1JFF10JtB0Q' } })
      .then(() => sessionStorage.setItem(K, 'done'));
  })
  .catch(() => sessionStorage.setItem(K, 'done'));
return false;`, 45000);
  });
  await run.step("Remove the backstop's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd354_net', '__dd354_net:sent'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\u2b50 AT REST (server): only Pump 0102's link (at rest), the same condition/failure ids, rest address/x/y, `Ready`", {always: true}, async () => {
    await assertFromJavascript(page, `const K = "__dd354_links", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((w => (w => !!w && w.status === 'Ready' && w.address === '230 North Alexander Street, New Orleans, LA 70119' && Math.abs(Number(w.x) - (-90.1025785)) < 1e-6 && Math.abs(Number(w.y) - (29.9782827)) < 1e-6)(w) && (w => { const p = (w.assets || []).filter(a => a && a.id === 'AE09h8JhBBhMtd1wIs98lQ');
  return p.length === 1 && !!p[0].asset && p[0].asset.id === 'oB5BUN1Es1Jctw8FVYwYBh' && p[0].status === 'Active' && p[0].sequence === 1 && p[0].comment === 'Chemical dosing pump, model PDM 2000, plastic housing with digital control panel, horizontal mount.'; })(w) && w.assets.length === 1 && (w => (w.assets || []).filter(a => a && a.asset && a.asset.id === 'wFRo1MMwoAMkdxA4hVpIhB'))(w).length === 0
  && sessionStorage.getItem('__dd354_cf') === (w => JSON.stringify([(w.condition || []).map(c => c.id).sort(), (w.failures || []).map(f => f.id).sort()]))(w))(data.workStage)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id status address x y condition { id } failures { id } assets { id status sequence comment asset: assetId { id name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd354_links', '__dd354_links:inflight', '__dd354_links:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Remove this test's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd354_premise', '__dd354_cf'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  run.finish();
}
