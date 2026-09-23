// Generated from Mobile/dd_tests_mobile/MOB.364_Work_Attach_Form.json by to_playwright.py — do not edit by hand yet.
// MOB.364_Work_Attach_Form

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, el, optional, wait } from '../support/dd';

export async function mob364(page: Page): Promise<void> {
  const soft = new Soft();
  try {
    // Navigate to /work — warm the work lookup cache
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Let the lookup prefetch run
    await wait(page, 30);
    // Navigate to the add-form work order (20260910-16)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/xohY0klBZktB9VBRxc8k4J`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // PREMISE (server): read this stage's forms — their names are what the picker must hide and the baseline for +1
    await assertFromJavascript(page, `const K = "__dd364_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const f = data.workStage.forms;
  sessionStorage.removeItem('__dd364_pick');   // a killed run's pick must not steer this one
  ['__dd364_before_ids', '__dd364_new', '__dd364_deleted'].forEach(k => sessionStorage.removeItem(k));   // nor its delete licence
  if (data.workStage.id !== 'xohY0klBZktB9VBRxc8k4J' || !Array.isArray(f)) return false;
  sessionStorage.setItem('__dd364_before', JSON.stringify(f.map(x => (x.name || '').trim())));
  sessionStorage.setItem('__dd364_before_ids', JSON.stringify(f.map(x => x.id)));
  return true; })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id forms { id name } } }", variables: {"id": "xohY0klBZktB9VBRxc8k4J"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Open the Forms tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Form")]`).click({ timeout: 30000 });
    // Let the form cards render
    await wait(page, 2);
    // Open the add-form modal ("Add")
    await el(page, `//button[normalize-space(.)="Add"]`).click({ timeout: 30000 });
    // Wait for the modal
    await wait(page, 2);
    // The form picker rendered in the modal
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@id="formId"]`, 30000);
    // Open the picker
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@id="formId"]`).click({ timeout: 30000 });
    // Wait for the template options (MOBILE_AD_HOC_FORMS)
    await wait(page, 3);
    await soft.run("FIXTURE GUARD + PICK: the picker offers a form this stage does not hold (trap 10); click the first VISIBLE one and keep its name", async () => {
      await assertFromJavascript(page, `const before = JSON.parse(sessionStorage.getItem('__dd364_before') || 'null');
const pick0 = sessionStorage.getItem('__dd364_pick');
if (!Array.isArray(before)) return false;
const vis = [...document.querySelectorAll('[role="option"]')]
  .filter(o => o.offsetParent !== null)
  .map(o => ({ o, t: ((o.querySelector('[class*="option-title"]') || {}).textContent || '').trim() }))
  .filter(x => x.t && !before.includes(x.t));
if (!vis.length) return false;
const x = pick0 ? vis.find(v => v.t === pick0) : vis[0];   // a re-poll never picks a second one
if (!x) return false;
sessionStorage.setItem('__dd364_pick', x.t);
x.o.click();
return true;`, 30000);
    });
    await soft.run("The picker now holds the picked form's name", async () => {
      await assertFromJavascript(page, `const pick = sessionStorage.getItem('__dd364_pick');
const el = document.getElementById('formId');
return !!pick && !!el && (el.value || '').trim() === pick;`, 20000);
    });
    await soft.run("Submit is ARMED \u2014 `button[form=\"adhoc-form\"]` is `type=\"submit\"` (trap 8)", async () => {
      await assertFromJavascript(page, `const b = document.querySelector('button[form="adhoc-form"]');
return !!b && b.type === 'submit';`, 30000);
    });
    await soft.run("Submit \u2014 attach the form", async () => {
      await el(page, `//button[@form="adhoc-form"]`).click({ timeout: 30000 });
    });
    // Let CREATE_WORKSTAGE_FORM reach the server
    await wait(page, 3);
    await optional("The `Form added` toast (optional: it fires BEFORE the mutation \u2014 trap 7)", async () => {
      await assertPageContains(page, `Form added`, DEFAULT_TIMEOUT);
    });
    await soft.run("The add-form modal closed and the Forms tab's `Add` is back on screen (UI only: it closes on the optimistic result \u2014 trap 6)", async () => {
      await assertFromJavascript(page, `if (document.getElementById('adhoc-form')) return false;
return [...document.querySelectorAll('button')].some(b => (b.textContent || '').trim() === 'Add');`, 30000);
    });
    await optional("SENTINEL (optional): before any reload, the Forms tab shows the new card (what the add wrote to the page's cache)", async () => {
      await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const pick = sessionStorage.getItem('__dd364_pick');
if (!pick) return false;
return [...p.querySelectorAll('[class*="mantine-Title-root"]')]
  .filter(t => (t.textContent || '').trim() === pick).length === 1;`, 20000);
    });
    await soft.run("\u2b50 SERVER: exactly ONE more form than at the premise, and exactly one named what this run picked \u2014 asked over /graphql", async () => {
      await assertFromJavascript(page, `const K = "__dd364_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const f = data.workStage.forms.map(x => (x.name || '').trim());
  const before = JSON.parse(sessionStorage.getItem('__dd364_before') || 'null'), pick = sessionStorage.getItem('__dd364_pick');
  if (!Array.isArray(before) || !pick || before.includes(pick)) return false;
  return f.length === before.length + 1 && f.filter(n => n === pick).length === 1; })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id forms { id name } } }", variables: {"id": "xohY0klBZktB9VBRxc8k4J"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
    });
    // Navigate to the add-form work order (reload: the persisted cache holds no refused optimistic add)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/xohY0klBZktB9VBRxc8k4J`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Reopen the Forms tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Form")]`).click({ timeout: 30000 });
    // Let the form cards render
    await wait(page, 2);
    await optional("SENTINEL (optional): after the reload, WITHOUT a resync, the Forms tab shows the new card \u2014 locally it did not: the page drew the cached work order and sent no read (trace 2026-09-15)", async () => {
      await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const pick = sessionStorage.getItem('__dd364_pick');
if (!pick) return false;
return [...p.querySelectorAll('[class*="mantine-Title-root"]')]
  .filter(t => (t.textContent || '').trim() === pick).length === 1;`, 10000);
    });
    // Press the page's ⟳ resync (`ResyncButton` beside `Data synced on` → refetch)
    await el(page, `//p[starts-with(normalize-space(.), "Data synced on")]/following-sibling::button[1]`).click({ timeout: 30000 });
    // Let the refetch land
    await wait(page, 4);
    await soft.run("\u2b50 After a RELOAD the Forms tab shows exactly one card titled with the picked form (after the page's \u27f3 resync)", async () => {
      await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const pick = sessionStorage.getItem('__dd364_pick');
if (!pick) return false;
return [...p.querySelectorAll('[class*="mantine-Title-root"]')]
  .filter(t => (t.textContent || '').trim() === pick).length === 1;`, 30000);
    });
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd364_server', '__dd364_server:inflight', '__dd364_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd364_server', '__dd364_server:inflight', '__dd364_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // CLEANUP (server): find the ONE form this run attached — an id new since the premise, named the pick
    await assertFromJavascript(page, `const K = "__dd364_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const f = data.workStage.forms;
  const ids = JSON.parse(sessionStorage.getItem('__dd364_before_ids') || 'null'), pick = sessionStorage.getItem('__dd364_pick');
  if (data.workStage.id !== 'xohY0klBZktB9VBRxc8k4J' || !Array.isArray(f) || !Array.isArray(ids)) return false;
  const fresh = f.filter(x => !ids.includes(x.id));
  if (fresh.length === 0) return true;   // nothing attached: nothing to delete
  if (fresh.length !== 1 || !pick || (fresh[0].name || '').trim() !== pick) return false;
  sessionStorage.setItem('__dd364_new', fresh[0].id);
  return true; })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id forms { id name } } }", variables: {"id": "xohY0klBZktB9VBRxc8k4J"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd364_server', '__dd364_server:inflight', '__dd364_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // CLEANUP: delete THAT form over /graphql (`deleteWorkStageForm` — mobile has no remove; owner 2026-09-15). One shot; refuses an id the stage held before this run
    await assertFromJavascript(page, `const id = sessionStorage.getItem('__dd364_new');
const ids = JSON.parse(sessionStorage.getItem('__dd364_before_ids') || 'null');
if (!id || sessionStorage.getItem('__dd364_deleted')) return true;   // nothing of this run's to delete, or already sent
if (!Array.isArray(ids) || ids.includes(id)) return false;   // never a form the stage held before this run
sessionStorage.setItem('__dd364_deleted', '1');
window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
  body: JSON.stringify({ query: 'mutation($id: ID!) { deleteWorkStageForm(id: $id) }', variables: { id } }) });
return true;`, 15000);
    // Let the delete reach the server
    await wait(page, 3);
    // ⭐ CLEANED (server): the stage's form ids are exactly the premise's
    await assertFromJavascript(page, `const K = "__dd364_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const f = data.workStage.forms;
  const ids = JSON.parse(sessionStorage.getItem('__dd364_before_ids') || 'null');
  if (!Array.isArray(f) || !Array.isArray(ids)) return false;
  const now = f.map(x => x.id).sort(), was = ids.slice().sort();
  return now.length === was.length && now.every((v, i) => v === was[i]); })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { id forms { id name } } }", variables: {"id": "xohY0klBZktB9VBRxc8k4J"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd364_server', '__dd364_server:inflight', '__dd364_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove this test's sessionStorage keys
    await assertFromJavascript(page, `["__dd364_before", "__dd364_pick", "__dd364_before_ids", "__dd364_new", "__dd364_deleted"].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  }
  soft.check();
}
