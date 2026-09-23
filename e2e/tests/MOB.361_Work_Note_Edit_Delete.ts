// Generated from Mobile/dd_tests_mobile/MOB.361_Work_Note_Edit_Delete.json by to_playwright.py — do not edit by hand yet.
// MOB.361_Work_Note_Edit_Delete

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob361(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
  const soft = new Soft();
  try {
    // Navigate to /work — the work order list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Wait for the workstage pages and the lookup prefetch
    await wait(page, 20);
    // The work list rendered its search box
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
    // LOADEDALL 1/3: the initial fetch finished
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
    // LOADEDALL 2/3: paging through workstages finished
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
    // LOADEDALL 3/3: the per-stage detail downloads finished
    await assertPageLacks(page, `workstages downloaded`, 180000);
    // Clear this test's sessionStorage keys — only THIS run's premise may license the delete
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd361_before');
sessionStorage.removeItem('__dd361_id');
return sessionStorage.getItem('__dd361_before') === null;`, 15000);
    // Navigate to the fixture work order (add)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the Notes tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Notes")]`).click({ timeout: 30000 });
    // The Notes tab rendered its `Add` button
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
    // Let the note cards render
    await wait(page, 2);
    // PREMISE (server): no job note carries `DD SYNTHETIC MOBILE 361` — so the one found after the add is THIS run's; store the note ids the server holds (the delete's licence and the cleanup's baseline)
    await assertFromJavascript(page, `const K = "__dd361_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const ns = data.workStage.jobNotes; const P = 'DD SYNTHETIC MOBILE 361';
  const mine = ns.filter(n => (n.desc || '').indexOf(P) !== -1);
  const before = JSON.parse(sessionStorage.getItem('__dd361_before') || 'null');
  if (mine.length !== 0) return false;
  sessionStorage.setItem('__dd361_before', JSON.stringify(ns.map(n => n.id).sort()));
  return true; })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { jobNotes { id desc } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Open the add form
    await el(page, `//button[normalize-space(.)="Add"]`).click({ timeout: 30000 });
    // The note form opened
    await assertElementPresent(page, `//form[@id="work-collection-form"]`, 30000);
    // Focus the rich text editor
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//div[@contenteditable="true"]`).click({ timeout: 30000 });
    // Type the run's marker note
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//div[@contenteditable="true"]`).fill(`DD SYNTHETIC MOBILE 361 NOTE ${RUNID}`, { timeout: DEFAULT_TIMEOUT });
    // Submit is ARMED — `button[form="work-collection-form"]` is `type="submit"` (trap 8)
    await assertFromJavascript(page, `const b = document.querySelector('button[form="work-collection-form"]');
return !!b && b.type === 'submit';`, 30000);
    // Submit the new note
    await el(page, `//button[@form="work-collection-form"]`).click({ timeout: 30000 });
    // Let the add reach the server
    await wait(page, 3);
    await soft.run("\u2b50 SERVER: exactly ONE note carries `DD SYNTHETIC MOBILE 361 NOTE <8 digits>`, and it is new \u2014 store its id", async () => {
      await assertFromJavascript(page, `const K = "__dd361_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const ns = data.workStage.jobNotes; const P = 'DD SYNTHETIC MOBILE 361';
  const mine = ns.filter(n => (n.desc || '').indexOf(P) !== -1);
  const before = JSON.parse(sessionStorage.getItem('__dd361_before') || 'null');
  if (!Array.isArray(before) || mine.length !== 1 || ns.length !== before.length + 1) return false;
  if (before.indexOf(mine[0].id) !== -1) return false;
  if (!/DD SYNTHETIC MOBILE 361 NOTE \\d{8}/.test(mine[0].desc)) return false;
  sessionStorage.setItem('__dd361_id', mine[0].id);
  return true; })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { jobNotes { id desc } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    });
    // Navigate to the fixture work order (reload: edit its note)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the Notes tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Notes")]`).click({ timeout: 30000 });
    // The Notes tab rendered its `Add` button
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
    // Let the note cards render
    await wait(page, 2);
    await soft.run("Open the gear of the ONE card carrying `DD SYNTHETIC MOBILE 361` (the premise proved none pre-dated this run)", async () => {
      await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const panel = byId || [...document.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!panel) return false;
const has = el => (el.textContent || '').replace(/\\s+/g, ' ').indexOf('DD SYNTHETIC MOBILE 361') !== -1;
const papers = [...panel.querySelectorAll('.mantine-Paper-root')];
const mine = papers.filter(c => has(c) && !papers.some(o => o !== c && c.contains(o) && has(o)));
if (!sessionStorage.getItem('__dd361_before') || mine.length !== 1) return false;
const g = mine[0].querySelector('[aria-label="Menu"]');
if (!g) return false;
g.click();
return true;`, 30000);
    });
    // Let the menu open
    await wait(page, 1);
    await soft.run("Click `Edit Item`", async () => {
      await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Item"])[1]`).click({ timeout: 30000 });
    });
    await soft.run("The note edit form opened", async () => {
      await assertElementPresent(page, `//form[@id="work-collection-form"]`, 30000);
    });
    await soft.run("The editor opened PREFILLED with this run's note (`DD SYNTHETIC MOBILE 361 NOTE`)", async () => {
      await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')];
const eds = m.flatMap(x => [...x.querySelectorAll('[contenteditable="true"]')]);
return eds.length === 1 && (eds[0].textContent || '').indexOf('DD SYNTHETIC MOBILE 361 NOTE') !== -1;`, 30000);
    });
    await soft.run("Focus the rich text editor", async () => {
      await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//div[@contenteditable="true"]`).click({ timeout: 30000 });
    });
    await soft.run("Select all of the note text", async () => {
      await page.keyboard.press(`Control+a`);
    });
    await soft.run("Replace it with the EDITED marker", async () => {
      await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//div[@contenteditable="true"]`).fill(`DD SYNTHETIC MOBILE 361 EDITED ${RUNID}`, { timeout: DEFAULT_TIMEOUT });
    });
    await soft.run("The editor now reads `DD SYNTHETIC MOBILE 361 EDITED \u2026` and no longer `DD SYNTHETIC MOBILE 361 NOTE`", async () => {
      await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')];
const eds = m.flatMap(x => [...x.querySelectorAll('[contenteditable="true"]')]);
const t = eds.length === 1 ? (eds[0].textContent || '') : '';
return t.indexOf('DD SYNTHETIC MOBILE 361 EDITED') === 0 && t.indexOf('DD SYNTHETIC MOBILE 361 NOTE') === -1;`, 20000);
    });
    await soft.run("Submit is ARMED \u2014 `button[form=\"work-collection-form\"]` is `type=\"submit\"` (trap 8)", async () => {
      await assertFromJavascript(page, `const b = document.querySelector('button[form="work-collection-form"]');
return !!b && b.type === 'submit';`, 30000);
    });
    await soft.run("Submit the edit", async () => {
      await el(page, `//button[@form="work-collection-form"]`).click({ timeout: 30000 });
    });
    // Let the update reach the server
    await wait(page, 3);
    await soft.run("\u2b50 SERVER: the run's note (its stored id) now holds `DD SYNTHETIC MOBILE 361 EDITED <8 digits>` \u2014 `UPDATE_WORKSTAGE_JOB_NOTE` saved (the modal proves nothing: optimistic)", async () => {
      await assertFromJavascript(page, `const K = "__dd361_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const ns = data.workStage.jobNotes; const P = 'DD SYNTHETIC MOBILE 361';
  const mine = ns.filter(n => (n.desc || '').indexOf(P) !== -1);
  const before = JSON.parse(sessionStorage.getItem('__dd361_before') || 'null');
  const id = sessionStorage.getItem('__dd361_id');
  if (!Array.isArray(before) || !id || mine.length !== 1 || mine[0].id !== id || ns.length !== before.length + 1) return false;
  return /DD SYNTHETIC MOBILE 361 EDITED \\d{8}/.test(mine[0].desc) && mine[0].desc.indexOf('DD SYNTHETIC MOBILE 361 NOTE') === -1; })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { jobNotes { id desc } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    });
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd361_server', '__dd361_server:inflight', '__dd361_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd361_server', '__dd361_server:inflight', '__dd361_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd361_server', '__dd361_server:inflight', '__dd361_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Navigate to the fixture work order (reload: delete its note)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the Notes tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Notes")]`).click({ timeout: 30000 });
    // The Notes tab rendered its `Add` button
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
    // Let the note cards render
    await wait(page, 2);
    await soft.run("\ud83d\uded1 GUARD + open its gear: only if THIS run's premise passed (`__dd361_before` set: no `DD SYNTHETIC MOBILE 361` note pre-dated the run) and exactly ONE card carries the prefix", async () => {
      await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const panel = byId || [...document.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!panel) return false;
const has = el => (el.textContent || '').replace(/\\s+/g, ' ').indexOf('DD SYNTHETIC MOBILE 361') !== -1;
const papers = [...panel.querySelectorAll('.mantine-Paper-root')];
const mine = papers.filter(c => has(c) && !papers.some(o => o !== c && c.contains(o) && has(o)));
if (!sessionStorage.getItem('__dd361_before') || mine.length !== 1) return false;
const g = mine[0].querySelector('[aria-label="Menu"]');
if (!g) return false;
g.click();
return true;`, 30000);
    });
    // Let the menu open
    await wait(page, 1);
    await soft.run("Click `Delete Item` \u2014 on THIS card (its own record id)", async () => {
      await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Delete Item"])[1]`).click({ timeout: 30000 });
    });
    // Let the confirmation open
    await wait(page, 1);
    await soft.run("Confirm: \"Yes\"", async () => {
      await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Are you sure you want to delete this record?")]]//button[normalize-space(.)="Yes"]`).click({ timeout: 30000 });
    });
    // Wait for the remove mutation
    await wait(page, 3);
    // ⭐ SERVER: no note carries `DD SYNTHETIC MOBILE 361`, and the note ids are EXACTLY those before the run — deleted, and nothing else touched (`REMOVE_JOB_NOTE_FROM_WORKSTAGE`; a reload would show the cache's word)
    await assertFromJavascript(page, `const K = "__dd361_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const ns = data.workStage.jobNotes; const P = 'DD SYNTHETIC MOBILE 361';
  const mine = ns.filter(n => (n.desc || '').indexOf(P) !== -1);
  const before = JSON.parse(sessionStorage.getItem('__dd361_before') || 'null');
  if (!Array.isArray(before) || mine.length !== 0) return false;
  const now = ns.map(n => n.id).sort();
  return now.length === before.length && now.every((x, i) => x === before[i]); })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { jobNotes { id desc } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd361_server', '__dd361_server:inflight', '__dd361_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove this test's sessionStorage keys
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd361_before');
sessionStorage.removeItem('__dd361_id');
return true;`, 15000);
  }
  soft.check();
}
