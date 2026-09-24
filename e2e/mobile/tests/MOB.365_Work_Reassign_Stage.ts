// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.365_Work_Reassign_Stage.json. This file is the source now: edit it directly.
// MOB.365_Work_Reassign_Stage

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, click, typeText, wait } from '../../support/dd';

export async function mob365(page: Page): Promise<void> {
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
  await run.step("Navigate to the reassign work order (20260910-16)", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/xohY0klBZktB9VBRxc8k4J`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("PREMISE (server): the stage's crews are exactly the 8 at rest (`Admin` among them), `Account Executive` is not one of them, and the stage has no schedule entry", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const K = "__dd365_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  ["__dd365_premise", "__dd365_net", "__dd365_keep"].forEach(k => sessionStorage.removeItem(k));   // a killed run's keys
const ids = data.a.edges.map(e => e.id).sort();
const same = (want) => JSON.stringify(ids) === JSON.stringify(want);
  const x = data.x.edges.filter(e => e.id === 'thtNo1Nd9th9FRNNoAN5Il' && e.name === 'Account Executive').length;
  if (same(["1ck5xMQ4IMV0BgRx0xsUdk", "5Ylk1wIhslMR8lsg8NAQxA", "BVM9Bxkpox9BlEYd8sp0NR", "cQVVNJU5cFEU9RwIhw0Aps", "cc5MgMoo1h9VJBZtB4ZNFR", "kkBtBwZoBlpcw84F4F9B8s", "kx5sw1dVUFMYFs0UA08Z5M", "l4Jlk4ExMY005JZAF8hclQ"])) sessionStorage.setItem('__dd365_premise', 'rest');
  else if (same(["1ck5xMQ4IMV0BgRx0xsUdk", "5Ylk1wIhslMR8lsg8NAQxA", "BVM9Bxkpox9BlEYd8sp0NR", "cQVVNJU5cFEU9RwIhw0Aps", "cc5MgMoo1h9VJBZtB4ZNFR", "kkBtBwZoBlpcw84F4F9B8s", "kx5sw1dVUFMYFs0UA08Z5M", "thtNo1Nd9th9FRNNoAN5Il"]) || same(["1ck5xMQ4IMV0BgRx0xsUdk", "5Ylk1wIhslMR8lsg8NAQxA", "BVM9Bxkpox9BlEYd8sp0NR", "cQVVNJU5cFEU9RwIhw0Aps", "cc5MgMoo1h9VJBZtB4ZNFR", "kkBtBwZoBlpcw84F4F9B8s", "kx5sw1dVUFMYFs0UA08Z5M", "l4Jlk4ExMY005JZAF8hclQ", "thtNo1Nd9th9FRNNoAN5Il"])) sessionStorage.setItem('__dd365_premise', 'leftover');
  return same(["1ck5xMQ4IMV0BgRx0xsUdk", "5Ylk1wIhslMR8lsg8NAQxA", "BVM9Bxkpox9BlEYd8sp0NR", "cQVVNJU5cFEU9RwIhw0Aps", "cc5MgMoo1h9VJBZtB4ZNFR", "kkBtBwZoBlpcw84F4F9B8s", "kx5sw1dVUFMYFs0UA08Z5M", "l4Jlk4ExMY005JZAF8hclQ"]) && x === 1 && data.workStage.scheduleDates.length === 0;
})()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: ChildTableQuery!, $x: ChildTableQuery!, $id: ID!) { a: workStageAssignments(params: $p) { edges { id name } } x: workStageAssignments(params: $x) { edges { id name } } workStage(id: $id) { id scheduleDates { id } } }", variables: {"id": "xohY0klBZktB9VBRxc8k4J", "p": {"parentId": "xohY0klBZktB9VBRxc8k4J", "limit": 100}, "x": {"parentId": "xohY0klBZktB9VBRxc8k4J", "notInCollection": true, "limit": 100, "query": {"conditions": [{"column": "name", "operator": "CONTAINS", "value": "Account Executive"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd365_server', '__dd365_server:inflight', '__dd365_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Click \"Assign Work Stage\" (forward)", {}, async () => {
    await click(page, `//button[contains(normalize-space(.), "Assign Work Stage")]`, 30000);
  });
  await run.step("Wait for the modal and its auto-opened crew dropdown", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The crew form rendered", {}, async () => {
    await assertElementPresent(page, `//form[@id="crewform"]`, 30000);
  });
  await run.step("Search the crew picker for \"Account Executive\"", {}, async () => {
    await typeText(page, `//form[@id="crewform"]//input[@id="crewId"]`, `Account Executive`, 30000);
  });
  await run.step("Wait for the crew options (network-only)", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Pick \"Account Executive\" \u2014 the one VISIBLE option titled exactly \"Account Executive\"", {}, async () => {
    await assertFromJavascript(page, `const vis = [...document.querySelectorAll('[role="option"]')].filter(o => {
  const t = o.querySelector('[class*="option-title"]');
  return t && (t.textContent || '').trim() === 'Account Executive' && o.offsetParent !== null;
});
if (vis.length !== 1) return false;
vis[0].click();
return true;`, 30000);
  });
  await run.step("The crew field now holds \"Account Executive\"", {}, async () => {
    await assertFromJavascript(page, `const el = document.getElementById('crewId');
return !!el && (el.value || '').trim() === 'Account Executive';`, 20000);
  });
  await run.step("\"Keep local copy of work?\" is OFF (the default) \u2014 the save sends the REMOVE too", {}, async () => {
    await assertFromJavascript(page, `const el = document.getElementById('keepAssignment');
return !!el && el.checked === false;`, 20000);
  });
  await run.step("SUBMIT is ARMED \u2014 `type=\"submit\"` (trap 8)", {}, async () => {
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('#crewform button')]
  .find(x => (x.textContent || '').trim() === 'SUBMIT');
return !!b && b.type === 'submit';`, 30000);
  });
  await run.step("SUBMIT \u2014 assign to Account Executive", {}, async () => {
    await click(page, `//form[@id="crewform"]//button[normalize-space(.)="SUBMIT"]`, 30000);
  });
  await run.step("Let the mutations reach the server", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The `Work stage has been assigned to \u2026` toast for Account Executive (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Work stage has been assigned to`, DEFAULT_TIMEOUT);
  });
  await run.step("The crew modal closed and the detail page's `Assign Work Stage` is back \u2014 the modal closes in ADD_ASSIGNMENT's update() (no optimistic response), so the server answered the ADD", {}, async () => {
    await assertFromJavascript(page, `if (document.getElementById('crewform')) return false;
return [...document.querySelectorAll('button')].some(b => (b.textContent || '').includes('Assign Work Stage'));`, 30000);
  });
  await run.step("\u2b50 SERVER: SAVED \u2014 `Account Executive` holds the stage and `Admin` no longer does (REMOVE + ADD), the other 7 crews untouched \u2014 asked over /graphql", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const K = "__dd365_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const ids = data.a.edges.map(e => e.id).sort();
const same = (want) => JSON.stringify(ids) === JSON.stringify(want);
 return same(["1ck5xMQ4IMV0BgRx0xsUdk", "5Ylk1wIhslMR8lsg8NAQxA", "BVM9Bxkpox9BlEYd8sp0NR", "cQVVNJU5cFEU9RwIhw0Aps", "cc5MgMoo1h9VJBZtB4ZNFR", "kkBtBwZoBlpcw84F4F9B8s", "kx5sw1dVUFMYFs0UA08Z5M", "thtNo1Nd9th9FRNNoAN5Il"]); })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: ChildTableQuery!, $x: ChildTableQuery!, $id: ID!) { a: workStageAssignments(params: $p) { edges { id name } } x: workStageAssignments(params: $x) { edges { id name } } workStage(id: $id) { id scheduleDates { id } } }", variables: {"id": "xohY0klBZktB9VBRxc8k4J", "p": {"parentId": "xohY0klBZktB9VBRxc8k4J", "limit": 100}, "x": {"parentId": "xohY0klBZktB9VBRxc8k4J", "notInCollection": true, "limit": 100, "query": {"conditions": [{"column": "name", "operator": "CONTAINS", "value": "Account Executive"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd365_server', '__dd365_server:inflight', '__dd365_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Navigate to the reassign work order (restore)", {always: true}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/xohY0klBZktB9VBRxc8k4J`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered \u2014 reachable after leaving the Admin crew", {always: true}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Click \"Assign Work Stage\" (restore)", {always: true}, async () => {
    await click(page, `//button[contains(normalize-space(.), "Assign Work Stage")]`, 30000);
  });
  await run.step("Wait for the modal and its auto-opened crew dropdown", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("The crew form rendered", {always: true}, async () => {
    await assertElementPresent(page, `//form[@id="crewform"]`, 30000);
  });
  await run.step("Search the crew picker for \"Admin\"", {always: true}, async () => {
    await typeText(page, `//form[@id="crewform"]//input[@id="crewId"]`, `Admin`, 30000);
  });
  await run.step("Wait for the crew options (network-only)", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("Pick \"Admin\" \u2014 the one VISIBLE option titled exactly \"Admin\"", {always: true}, async () => {
    await assertFromJavascript(page, `const vis = [...document.querySelectorAll('[role="option"]')].filter(o => {
  const t = o.querySelector('[class*="option-title"]');
  return t && (t.textContent || '').trim() === 'Admin' && o.offsetParent !== null;
});
if (vis.length !== 1) return false;
vis[0].click();
return true;`, 30000);
  });
  await run.step("The crew field now holds \"Admin\"", {always: true}, async () => {
    await assertFromJavascript(page, `const el = document.getElementById('crewId');
return !!el && (el.value || '').trim() === 'Admin';`, 20000);
  });
  await run.step("Turn \"Keep local copy of work?\" ON \u2014 so no REMOVE of `Admin` races the ADD", {always: true}, async () => {
    await assertFromJavascript(page, `const el = document.getElementById('keepAssignment');
if (!el) return false;
if (!el.checked && !sessionStorage.getItem('__dd365_keep')) { sessionStorage.setItem('__dd365_keep', '1'); el.click(); }
return el.checked === true;`, 20000);
  });
  await run.step("SUBMIT is ARMED \u2014 `type=\"submit\"` (trap 8)", {always: true}, async () => {
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('#crewform button')]
  .find(x => (x.textContent || '').trim() === 'SUBMIT');
return !!b && b.type === 'submit';`, 30000);
  });
  await run.step("SUBMIT \u2014 assign to Admin", {always: true}, async () => {
    await click(page, `//form[@id="crewform"]//button[normalize-space(.)="SUBMIT"]`, 30000);
  });
  await run.step("Let the mutations reach the server", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("The `Work stage has been assigned to \u2026` toast for Admin (optional: transient)", {always: true, allow: 'ignore'}, async () => {
    await assertPageContains(page, `Work stage has been assigned to`, DEFAULT_TIMEOUT);
  });
  await run.step("The crew modal closed and the detail page's `Assign Work Stage` is back \u2014 the modal closes in ADD_ASSIGNMENT's update() (no optimistic response), so the server answered the ADD", {always: true}, async () => {
    await assertFromJavascript(page, `if (document.getElementById('crewform')) return false;
return [...document.querySelectorAll('button')].some(b => (b.textContent || '').includes('Assign Work Stage'));`, 30000);
  });
  await run.step("\u2b50 RESTORE (UI, server): `Admin` holds the stage again and the keep toggle removed nothing (`Account Executive` is still there until the net)", {always: true, allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const K = "__dd365_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const ids = data.a.edges.map(e => e.id).sort();
const same = (want) => JSON.stringify(ids) === JSON.stringify(want);
 return same(["1ck5xMQ4IMV0BgRx0xsUdk", "5Ylk1wIhslMR8lsg8NAQxA", "BVM9Bxkpox9BlEYd8sp0NR", "cQVVNJU5cFEU9RwIhw0Aps", "cc5MgMoo1h9VJBZtB4ZNFR", "kkBtBwZoBlpcw84F4F9B8s", "kx5sw1dVUFMYFs0UA08Z5M", "l4Jlk4ExMY005JZAF8hclQ", "thtNo1Nd9th9FRNNoAN5Il"]); })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: ChildTableQuery!, $x: ChildTableQuery!, $id: ID!) { a: workStageAssignments(params: $p) { edges { id name } } x: workStageAssignments(params: $x) { edges { id name } } workStage(id: $id) { id scheduleDates { id } } }", variables: {"id": "xohY0klBZktB9VBRxc8k4J", "p": {"parentId": "xohY0klBZktB9VBRxc8k4J", "limit": 100}, "x": {"parentId": "xohY0klBZktB9VBRxc8k4J", "notInCollection": true, "limit": 100, "query": {"conditions": [{"column": "name", "operator": "CONTAINS", "value": "Account Executive"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd365_server', '__dd365_server:inflight', '__dd365_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\ud83d\uded1 NET (always): over /graphql, un-assign `Account Executive` (the UI can only remove the session's crew) and assign `Admin` (a no-op when the UI restore worked) \u2014 only when this run's premise read a state this test produces, and only once", {always: true}, async () => {
    await assertFromJavascript(page, `if (!sessionStorage.getItem('__dd365_premise') || sessionStorage.getItem('__dd365_net')) return true;   // not ours, or already sent
sessionStorage.setItem('__dd365_net', '1');
const post = (query, variables) => window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
  body: JSON.stringify({ query, variables }) });
post("mutation($crew: String!, $ids: [ID!]) { removeWorkStageFromCrew(crew: $crew, workStageIds: $ids) }", { crew: 'thtNo1Nd9th9FRNNoAN5Il', ids: ['xohY0klBZktB9VBRxc8k4J'] });
post("mutation($id: ID!, $data: AddRoleInput!) { addAssignmentToWorkStage(parentId: $id, data: $data) { id } }", { id: 'xohY0klBZktB9VBRxc8k4J', data: { roleId: 'l4Jlk4ExMY005JZAF8hclQ' } });
return true;`, 15000);
  });
  await run.step("Let the restore mutations land", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 RESTORED (server): the stage's crews are EXACTLY the 8 at rest", {always: true}, async () => {
    await assertFromJavascript(page, `const K = "__dd365_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const ids = data.a.edges.map(e => e.id).sort();
const same = (want) => JSON.stringify(ids) === JSON.stringify(want);
 return same(["1ck5xMQ4IMV0BgRx0xsUdk", "5Ylk1wIhslMR8lsg8NAQxA", "BVM9Bxkpox9BlEYd8sp0NR", "cQVVNJU5cFEU9RwIhw0Aps", "cc5MgMoo1h9VJBZtB4ZNFR", "kkBtBwZoBlpcw84F4F9B8s", "kx5sw1dVUFMYFs0UA08Z5M", "l4Jlk4ExMY005JZAF8hclQ"]); })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: ChildTableQuery!, $x: ChildTableQuery!, $id: ID!) { a: workStageAssignments(params: $p) { edges { id name } } x: workStageAssignments(params: $x) { edges { id name } } workStage(id: $id) { id scheduleDates { id } } }", variables: {"id": "xohY0klBZktB9VBRxc8k4J", "p": {"parentId": "xohY0klBZktB9VBRxc8k4J", "limit": 100}, "x": {"parentId": "xohY0klBZktB9VBRxc8k4J", "notInCollection": true, "limit": 100, "query": {"conditions": [{"column": "name", "operator": "CONTAINS", "value": "Account Executive"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd365_server', '__dd365_server:inflight', '__dd365_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Remove this test's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `["__dd365_premise", "__dd365_net", "__dd365_keep"].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  run.finish();
}
