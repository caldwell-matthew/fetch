// Generated from Mobile/dd_tests_mobile/MOB.353_Work_Asset_Status_Write.json by to_playwright.py — do not edit by hand yet.
// MOB.353_Work_Asset_Status_Write

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, el, optional, wait } from '../support/dd';

export async function mob353(page: Page): Promise<void> {
  try {
    // Navigate to /work — warm the work lookup cache
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Let the lookup prefetch run
    await wait(page, 30);
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 3);
    // GATE: the detail data arrived (tab strip)
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
    // Open the "Assets" tab
    await el(page, `//*[@role="tab"][normalize-space(.)="Assets"]`).click({ timeout: 30000 });
    // "Assets" is now the active tab
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Assets"][@data-active="true"]`, 30000);
    // FIXTURE GUARD: an asset row shows "Progress:" — showAssetStatus is ON
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Text-root ")][starts-with(normalize-space(.), "Progress:")]`, 60000);
    // PREMISE (server): Pump 0102's link is `Active`, sequence 1, the fixed comment; the stage is `Ready`
    await assertFromJavascript(page, `const K = "__dd353_link", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.workStage.status === 'Ready' && (d => { const w = d && d.workStage; const l = w && (w.assets || []).find(a => a && a.id === 'AE09h8JhBBhMtd1wIs98lQ');
  return !!l && l.asset && l.asset.name === 'Pump 0102' && l.status === 'Active' && l.sequence === 1 && l.comment === 'Chemical dosing pump, model PDM 2000, plastic housing with digital control panel, horizontal mount.'; })(data)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id status assets { id status sequence comment asset: assetId { id name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Escape any open menu first
    await page.keyboard.press(`Escape`);
    // Let it close
    await wait(page, 1);
    // The Assets tab shows ONE row — Pump 0102's — with the badge `Active`
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
if (!tabEl || (tabEl.textContent || '').trim() !== 'Assets') return false;
const p = tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
if (!p) return false;
const rows = [...p.querySelectorAll('.mantine-Accordion-item')];
const mine = rows.filter(r => { const c = r.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('Pump 0102'); });
const target = mine.length === 1 ? mine[0].querySelector('[aria-haspopup="menu"]') : null;
const badge = target ? (target.querySelector('.mantine-Badge-label') || {}).textContent : null;
return rows.length === 1 && !!target && (badge || '').trim() === 'Active';`, 45000);
    // Open Pump 0102's status menu (the `Progress:` badge — its wrapper stops propagation, so the row never expands)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Text-root ")][starts-with(normalize-space(.), "Progress:")])[1]`).click({ timeout: 30000 });
    // 🛑 GUARD: the open menu is Pump 0102's (its target is expanded, the badge reads `Active`) and offers `Mark as Completed` — the next click writes with no confirm
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
if (!tabEl || (tabEl.textContent || '').trim() !== 'Assets') return false;
const p = tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
if (!p) return false;
const rows = [...p.querySelectorAll('.mantine-Accordion-item')];
const mine = rows.filter(r => { const c = r.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('Pump 0102'); });
const target = mine.length === 1 ? mine[0].querySelector('[aria-haspopup="menu"]') : null;
const badge = target ? (target.querySelector('.mantine-Badge-label') || {}).textContent : null;
if (rows.length !== 1 || !target || (badge || '').trim() !== 'Active') return false;
if (target.getAttribute('aria-expanded') !== 'true') return false;
const items = [...document.querySelectorAll('.mantine-Menu-dropdown .mantine-Menu-item')]
  .map(i => (i.textContent || '').trim());
return items.includes('Mark as Completed') && !items.includes('Mark as Active');`, 30000);
    // Click `Mark as Completed` (writes immediately)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Mark as Completed"]`).click({ timeout: 30000 });
    await optional("The `Fields updated` toast (optional: transient)", async () => {
      await assertPageContains(page, `Fields updated`, 10000);
    });
    // The badge now reads `Completed` (the CACHE write — not the proof)
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
if (!tabEl || (tabEl.textContent || '').trim() !== 'Assets') return false;
const p = tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
if (!p) return false;
const rows = [...p.querySelectorAll('.mantine-Accordion-item')];
const mine = rows.filter(r => { const c = r.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('Pump 0102'); });
const target = mine.length === 1 ? mine[0].querySelector('[aria-haspopup="menu"]') : null;
const badge = target ? (target.querySelector('.mantine-Badge-label') || {}).textContent : null;
return rows.length === 1 && !!target && (badge || '').trim() === 'Completed';`, 30000);
    // ⭐ SERVER: Pump 0102's link is now `Completed` — asked over /graphql, not read from the cache
    await assertFromJavascript(page, `const K = "__dd353_link", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((d => { const w = d && d.workStage; const l = w && (w.assets || []).find(a => a && a.id === 'AE09h8JhBBhMtd1wIs98lQ');
  return !!l && l.asset && l.asset.name === 'Pump 0102' && l.status === 'Completed'; })(data)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id status assets { id status sequence comment asset: assetId { id name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd353_link', '__dd353_link:inflight', '__dd353_link:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd353_link', '__dd353_link:inflight', '__dd353_link:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Escape any open menu first
    await page.keyboard.press(`Escape`);
    // Let it close
    await wait(page, 1);
    // The Assets tab shows ONE row — Pump 0102's — with the badge `Completed`
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
if (!tabEl || (tabEl.textContent || '').trim() !== 'Assets') return false;
const p = tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
if (!p) return false;
const rows = [...p.querySelectorAll('.mantine-Accordion-item')];
const mine = rows.filter(r => { const c = r.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('Pump 0102'); });
const target = mine.length === 1 ? mine[0].querySelector('[aria-haspopup="menu"]') : null;
const badge = target ? (target.querySelector('.mantine-Badge-label') || {}).textContent : null;
return rows.length === 1 && !!target && (badge || '').trim() === 'Completed';`, 45000);
    // Open Pump 0102's status menu (the `Progress:` badge — its wrapper stops propagation, so the row never expands)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Text-root ")][starts-with(normalize-space(.), "Progress:")])[1]`).click({ timeout: 30000 });
    // 🛑 GUARD: the open menu is Pump 0102's (its target is expanded, the badge reads `Completed`) and offers `Mark as Active` — the next click writes with no confirm
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
if (!tabEl || (tabEl.textContent || '').trim() !== 'Assets') return false;
const p = tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
if (!p) return false;
const rows = [...p.querySelectorAll('.mantine-Accordion-item')];
const mine = rows.filter(r => { const c = r.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('Pump 0102'); });
const target = mine.length === 1 ? mine[0].querySelector('[aria-haspopup="menu"]') : null;
const badge = target ? (target.querySelector('.mantine-Badge-label') || {}).textContent : null;
if (rows.length !== 1 || !target || (badge || '').trim() !== 'Completed') return false;
if (target.getAttribute('aria-expanded') !== 'true') return false;
const items = [...document.querySelectorAll('.mantine-Menu-dropdown .mantine-Menu-item')]
  .map(i => (i.textContent || '').trim());
return items.includes('Mark as Active') && !items.includes('Mark as Completed');`, 30000);
    // Click `Mark as Active` (writes immediately)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Mark as Active"]`).click({ timeout: 30000 });
    await optional("The `Fields updated` toast (optional: transient)", async () => {
      await assertPageContains(page, `Fields updated`, 10000);
    });
    // The badge now reads `Active` (the CACHE write — not the proof)
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
if (!tabEl || (tabEl.textContent || '').trim() !== 'Assets') return false;
const p = tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
if (!p) return false;
const rows = [...p.querySelectorAll('.mantine-Accordion-item')];
const mine = rows.filter(r => { const c = r.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('Pump 0102'); });
const target = mine.length === 1 ? mine[0].querySelector('[aria-haspopup="menu"]') : null;
const badge = target ? (target.querySelector('.mantine-Badge-label') || {}).textContent : null;
return rows.length === 1 && !!target && (badge || '').trim() === 'Active';`, 30000);
    // ⭐ RESTORED (server): the UI wrote `Active` back
    await assertFromJavascript(page, `const K = "__dd353_link", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((d => { const w = d && d.workStage; const l = w && (w.assets || []).find(a => a && a.id === 'AE09h8JhBBhMtd1wIs98lQ');
  return !!l && l.asset && l.asset.name === 'Pump 0102' && l.status === 'Active'; })(data)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id status assets { id status sequence comment asset: assetId { id name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd353_link', '__dd353_link:inflight', '__dd353_link:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Escape — leave no menu open
    await page.keyboard.press(`Escape`);
    // BACKSTOP: if the link is not `Active`, send `updateWorkStageAsset` with the FIXED rest status (reads first; sends nothing when the UI restore landed)
    await assertFromJavascript(page, `const K = '__dd353_net';
const st = sessionStorage.getItem(K);
if (st === 'done') return true;
if (st === 'asking') return false;
sessionStorage.setItem(K, 'asking');
const post = body => window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' }, body: JSON.stringify(body) });
post({ query: 'query($id: ID!) { workStage(id: $id) { id status assets { id status sequence comment asset: assetId { id name } } } }', variables: { id: 'EYRpYJ9QYdQ1JFF10JtB0Q' } })
  .then(r => r.json())
  .then(j => {
    if ((d => { const w = d && d.workStage; const l = w && (w.assets || []).find(a => a && a.id === 'AE09h8JhBBhMtd1wIs98lQ');
  return !!l && l.asset && l.asset.name === 'Pump 0102' && l.status === 'Active'; })(j && j.data)) { sessionStorage.setItem(K, 'done'); return; }
    sessionStorage.setItem(K + ':sent', '1');
    return post({ query: 'mutation($id: ID!, $data: JSON!) { updateWorkStageAsset(id: $id, data: $data) { id } }', variables: { id: 'AE09h8JhBBhMtd1wIs98lQ', data: { status: 'Active' } } })
      .then(() => sessionStorage.setItem(K, 'done'));
  })
  .catch(() => sessionStorage.setItem(K, 'done'));
return false;`, 45000);
    // Remove the backstop's sessionStorage keys
    await assertFromJavascript(page, `['__dd353_net', '__dd353_net:sent'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // ⭐ AT REST (server): Pump 0102's link is `Active`, sequence 1, comment untouched; the stage still `Ready`
    await assertFromJavascript(page, `const K = "__dd353_link", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.workStage.status === 'Ready' && (d => { const w = d && d.workStage; const l = w && (w.assets || []).find(a => a && a.id === 'AE09h8JhBBhMtd1wIs98lQ');
  return !!l && l.asset && l.asset.name === 'Pump 0102' && l.status === 'Active' && l.sequence === 1 && l.comment === 'Chemical dosing pump, model PDM 2000, plastic housing with digital control panel, horizontal mount.'; })(data)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id status assets { id status sequence comment asset: assetId { id name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd353_link', '__dd353_link:inflight', '__dd353_link:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  }
}
