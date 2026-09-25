// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.353_Work_Asset_Status_Write.json. This file is the source now: edit it directly.
// MOB.353_Work_Asset_Status_Write

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, click, press, wait } from '../../support/dd';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';

export async function mob353(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 warm the work lookup cache", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Let the lookup prefetch run", {}, async () => {
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
  });
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
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
  await run.step("FIXTURE GUARD: an asset row shows \"Progress:\" \u2014 showAssetStatus is ON", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Text-root ")][starts-with(normalize-space(.), "Progress:")]`, 60000);
  });
  await run.step("PREMISE (server): Pump 0102's link is `Active`, sequence 1, the fixed comment; the stage is `Ready`", {}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd353_link', '__dd353_link:inflight', '__dd353_link:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Escape any open menu first", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let it close", {}, async () => {
    await wait(page, 1);
  });
  await run.step("The Assets tab shows ONE row \u2014 Pump 0102's \u2014 with the badge `Active`", {}, async () => {
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
  });
  await run.step("Open Pump 0102's status menu (the `Progress:` badge \u2014 its wrapper stops propagation, so the row never expands)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Text-root ")][starts-with(normalize-space(.), "Progress:")])[1]`, 30000);
  });
  await run.step("\ud83d\uded1 GUARD: the open menu is Pump 0102's (its target is expanded, the badge reads `Active`) and offers `Mark as Completed` \u2014 the next click writes with no confirm", {}, async () => {
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
  });
  await run.step("Click `Mark as Completed` (writes immediately)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Mark as Completed"]`, 30000);
  });
  await run.step("The `Fields updated` toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Fields updated`, 10000);
  });
  await run.step("The badge now reads `Completed` (the CACHE write \u2014 not the proof)", {}, async () => {
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
  });
  await run.step("\u2b50 SERVER: Pump 0102's link is now `Completed` \u2014 asked over /graphql, not read from the cache", {}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd353_link', '__dd353_link:inflight', '__dd353_link:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Escape any open menu first", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let it close", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("The Assets tab shows ONE row \u2014 Pump 0102's \u2014 with the badge `Completed`", {always: true}, async () => {
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
  });
  await run.step("Open Pump 0102's status menu (the `Progress:` badge \u2014 its wrapper stops propagation, so the row never expands)", {always: true}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Text-root ")][starts-with(normalize-space(.), "Progress:")])[1]`, 30000);
  });
  await run.step("\ud83d\uded1 GUARD: the open menu is Pump 0102's (its target is expanded, the badge reads `Completed`) and offers `Mark as Active` \u2014 the next click writes with no confirm", {always: true}, async () => {
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
  });
  await run.step("Click `Mark as Active` (writes immediately)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Mark as Active"]`, 30000);
  });
  await run.step("The `Fields updated` toast (optional: transient)", {always: true, allow: 'ignore'}, async () => {
    await assertPageContains(page, `Fields updated`, 10000);
  });
  await run.step("The badge now reads `Active` (the CACHE write \u2014 not the proof)", {always: true}, async () => {
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
  });
  await run.step("\u2b50 RESTORED (server): the UI wrote `Active` back", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd353_link', '__dd353_link:inflight', '__dd353_link:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Escape \u2014 leave no menu open", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("BACKSTOP: if the link is not `Active`, send `updateWorkStageAsset` with the FIXED rest status (reads first; sends nothing when the UI restore landed)", {always: true}, async () => {
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
  });
  await run.step("Remove the backstop's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd353_net', '__dd353_net:sent'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\u2b50 AT REST (server): Pump 0102's link is `Active`, sequence 1, comment untouched; the stage still `Ready`", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd353_link', '__dd353_link:inflight', '__dd353_link:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  run.finish();
}
