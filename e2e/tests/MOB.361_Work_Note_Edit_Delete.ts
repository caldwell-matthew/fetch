// Generated from Mobile/dd_tests_mobile/MOB.361_Work_Note_Edit_Delete.json by to_playwright.py — do not edit by hand yet.
// MOB.361_Work_Note_Edit_Delete

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob361(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Wait for the workstage pages and the lookup prefetch", {}, async () => {
    await wait(page, 20);
  });
  await run.step("The work list rendered its search box", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 1/3: the initial fetch finished", {}, async () => {
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 2/3: paging through workstages finished", {}, async () => {
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 3/3: the per-stage detail downloads finished", {}, async () => {
    await assertPageLacks(page, `workstages downloaded`, 360000);
  });
  await run.step("Clear this test's sessionStorage keys \u2014 only THIS run's premise may license the delete", {}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd361_before');
sessionStorage.removeItem('__dd361_id');
return sessionStorage.getItem('__dd361_before') === null;`, 15000);
  });
  await run.step("Navigate to the fixture work order (add)", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the Notes tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Notes")]`, 30000);
  });
  await run.step("The Notes tab rendered its `Add` button", {}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Let the note cards render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("PREMISE (server): no job note carries `DD SYNTHETIC MOBILE 361` \u2014 so the one found after the add is THIS run's; store the note ids the server holds (the delete's licence and the cleanup's baseline)", {}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd361_server', '__dd361_server:inflight', '__dd361_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Open the add form", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("The note form opened", {}, async () => {
    await assertElementPresent(page, `//form[@id="work-collection-form"]`, 30000);
  });
  await run.step("Focus the rich text editor", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//div[@contenteditable="true"]`, 30000);
  });
  await run.step("Type the run's marker note", {}, async () => {
    await typeText(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//div[@contenteditable="true"]`, `DD SYNTHETIC MOBILE 361 NOTE ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit is ARMED \u2014 `button[form=\"work-collection-form\"]` is `type=\"submit\"` (trap 8)", {}, async () => {
    await assertFromJavascript(page, `const b = document.querySelector('button[form="work-collection-form"]');
return !!b && b.type === 'submit';`, 30000);
  });
  await run.step("Submit the new note", {}, async () => {
    await click(page, `//button[@form="work-collection-form"]`, 30000);
  });
  await run.step("Let the add reach the server", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 SERVER: exactly ONE note carries `DD SYNTHETIC MOBILE 361 NOTE <8 digits>`, and it is new \u2014 store its id", {allow: 'soft'}, async () => {
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
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd361_server', '__dd361_server:inflight', '__dd361_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Navigate to the fixture work order (reload: edit its note)", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the Notes tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Notes")]`, 30000);
  });
  await run.step("The Notes tab rendered its `Add` button", {}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Let the note cards render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Open the gear of the ONE card carrying `DD SYNTHETIC MOBILE 361` (the premise proved none pre-dated this run)", {allow: 'soft'}, async () => {
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
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Click `Edit Item`", {allow: 'soft'}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Item"])[1]`, 30000);
  });
  await run.step("The note edit form opened", {allow: 'soft'}, async () => {
    await assertElementPresent(page, `//form[@id="work-collection-form"]`, 30000);
  });
  await run.step("The editor opened PREFILLED with this run's note (`DD SYNTHETIC MOBILE 361 NOTE`)", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')];
const eds = m.flatMap(x => [...x.querySelectorAll('[contenteditable="true"]')]);
return eds.length === 1 && (eds[0].textContent || '').indexOf('DD SYNTHETIC MOBILE 361 NOTE') !== -1;`, 30000);
  });
  await run.step("Focus the rich text editor", {allow: 'soft'}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//div[@contenteditable="true"]`, 30000);
  });
  await run.step("Select all of the note text", {allow: 'soft'}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Replace it with the EDITED marker", {allow: 'soft'}, async () => {
    await typeText(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//div[@contenteditable="true"]`, `DD SYNTHETIC MOBILE 361 EDITED ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("The editor now reads `DD SYNTHETIC MOBILE 361 EDITED \u2026` and no longer `DD SYNTHETIC MOBILE 361 NOTE`", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')];
const eds = m.flatMap(x => [...x.querySelectorAll('[contenteditable="true"]')]);
const t = eds.length === 1 ? (eds[0].textContent || '') : '';
return t.indexOf('DD SYNTHETIC MOBILE 361 EDITED') === 0 && t.indexOf('DD SYNTHETIC MOBILE 361 NOTE') === -1;`, 20000);
  });
  await run.step("Submit is ARMED \u2014 `button[form=\"work-collection-form\"]` is `type=\"submit\"` (trap 8)", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const b = document.querySelector('button[form="work-collection-form"]');
return !!b && b.type === 'submit';`, 30000);
  });
  await run.step("Submit the edit", {allow: 'soft'}, async () => {
    await click(page, `//button[@form="work-collection-form"]`, 30000);
  });
  await run.step("Let the update reach the server", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 SERVER: the run's note (its stored id) now holds `DD SYNTHETIC MOBILE 361 EDITED <8 digits>` \u2014 `UPDATE_WORKSTAGE_JOB_NOTE` saved (the modal proves nothing: optimistic)", {allow: 'soft'}, async () => {
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
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd361_server', '__dd361_server:inflight', '__dd361_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Navigate to the fixture work order (reload: delete its note)", {always: true}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {always: true}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the Notes tab", {always: true}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Notes")]`, 30000);
  });
  await run.step("The Notes tab rendered its `Add` button", {always: true}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add"]`, 30000);
  });
  await run.step("Let the note cards render", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("\ud83d\uded1 GUARD + open its gear: only if THIS run's premise passed (`__dd361_before` set: no `DD SYNTHETIC MOBILE 361` note pre-dated the run) and exactly ONE card carries the prefix", {always: true, allow: 'soft'}, async () => {
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
  await run.step("Let the menu open", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("Click `Delete Item` \u2014 on THIS card (its own record id)", {always: true, allow: 'soft'}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Delete Item"])[1]`, 30000);
  });
  await run.step("Let the confirmation open", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("Confirm: \"Yes\"", {always: true, allow: 'soft'}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Are you sure you want to delete this record?")]]//button[normalize-space(.)="Yes"]`, 30000);
  });
  await run.step("Wait for the remove mutation", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 SERVER: no note carries `DD SYNTHETIC MOBILE 361`, and the note ids are EXACTLY those before the run \u2014 deleted, and nothing else touched (`REMOVE_JOB_NOTE_FROM_WORKSTAGE`; a reload would show the cache's word)", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd361_server', '__dd361_server:inflight', '__dd361_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Remove this test's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd361_before');
sessionStorage.removeItem('__dd361_id');
return true;`, 15000);
  });
  run.finish();
}
