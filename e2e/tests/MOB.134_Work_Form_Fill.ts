// Generated from Mobile/dd_tests_mobile/MOB.134_Work_Form_Fill.json by to_playwright.py — do not edit by hand yet.
// MOB.134_Work_Form_Fill

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementContent, assertElementPresent, assertFromJavascript, el, wait } from '../support/dd';

export async function mob134(page: Page): Promise<void> {
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
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 3);
    // GATE: the detail data arrived (tab strip)
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
    // Open the Forms tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Form")]`).click({ timeout: 30000 });
    // Wait for the forms list
    await wait(page, 3);
    await soft.run("FIXTURE GUARD: the work order has at least one form card", async () => {
      await assertElementPresent(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]`, 60000);
    });
    // Open the first form card
    await el(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]`).click({ timeout: 60000 });
    // Let the form page render
    await wait(page, 4);
    // ROUTE: we are on /work/<id>/form/<id>
    await assertFromJavascript(page, `return /\\/work\\/[^/]+\\/form\\/[^/]+$/.test(location.pathname);`, 60000);
    // The desktop form container mounted
    await assertElementPresent(page, `//*[@id="apm-dv-tabpanel"]`, 60000);
    await soft.run("\ud83d\uded1 FIELD GUARD (server): the first number input is this form's INTEGER field, empty (or holding this test's 134) \u2014 tags it `data-dd134`; nothing types without the tag", async () => {
      await assertFromJavascript(page, `const K = "__dd134_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const formId = (location.pathname.match(/\\/form\\/([^/?#]+)/) || [])[1];
  const form = ((data.workStage && data.workStage.forms) || []).find(f => f && f.id === formId);
  const el = [...document.querySelectorAll('#apm-dv-tabpanel input.mantine-NumberInput-input')].find(e => e.offsetParent !== null);
  if (!form || !el || !el.id) return false;
  const f = (form.fields || []).find(x => x && x.id === el.id);
  if (!f || f.__typename !== 'WorkStageFormDetail' || !f.attributeTypeId || f.attributeTypeId.type !== 'integer') return false;
  if (!((v => v === null || v === undefined || v === '')(f.value) || String(f.value) === '134')) return false;
  el.setAttribute('data-dd134', 'target');
  sessionStorage.setItem('__dd134_field', el.id);
  return true;
})()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { forms { id fields { __typename ... on WorkStageFormDetail { id value attributeTypeId { type } } } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    });
    // Focus the tagged integer field (write)
    await el(page, `//input[@data-dd134="target"]`).click({ timeout: 30000 });
    // Select any existing value (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Type 134 — digits (a `NumberInput` drops letters: the archived test's blocker)
    await el(page, `//input[@data-dd134="target"]`).fill(`134`, { timeout: DEFAULT_TIMEOUT });
    // The input holds '134' BEFORE the blur
    await assertFromJavascript(page, `const el = document.querySelector('[data-dd134="target"]');
return !!el && el.value === '134';`, 15000);
    // Tab out — the form saves the field on BLUR (`Form.tsx:148`)
    await page.keyboard.press(`Tab`);
    // Let the update reach the server
    await wait(page, 3);
    // ⭐ SERVER: the field holds 134 — asked over /graphql
    await assertFromJavascript(page, `const K = "__dd134_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((f => !!f && String(f.value) === '134')((() => { const formId = (location.pathname.match(/\\/form\\/([^/?#]+)/) || [])[1];
  const form = ((data.workStage && data.workStage.forms) || []).find(f => f && f.id === formId);
  const id = sessionStorage.getItem('__dd134_field');
  return form && id ? (form.fields || []).find(x => x && x.id === id) : null; })())); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { forms { id fields { __typename ... on WorkStageFormDetail { id value attributeTypeId { type } } } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd134_server', '__dd134_server:inflight', '__dd134_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd134_server', '__dd134_server:inflight', '__dd134_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // RE-TAG (restore): the stored field's input gets `data-dd134` again — the save re-rendered it
    await assertFromJavascript(page, `const id = sessionStorage.getItem('__dd134_field');
const el = id ? document.getElementById(id) : null;
if (!el || el.offsetParent === null) return false;
el.setAttribute('data-dd134', 'target');
return true;`, 30000);
    // Focus the tagged integer field (restore)
    await el(page, `//input[@data-dd134="target"]`).click({ timeout: 30000 });
    // Clear it as React sees a user's edit — the native value setter and an `input` event (Datadog's `Delete` key left `134` in place)
    await assertFromJavascript(page, `const el = document.querySelector('[data-dd134="target"]');
if (!el) return false;
el.focus();
Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
el.dispatchEvent(new window.Event('input', { bubbles: true }));
return el.value === '';`, 15000);
    // The input holds '' BEFORE the blur
    await assertFromJavascript(page, `const el = document.querySelector('[data-dd134="target"]');
return !!el && el.value === '';`, 15000);
    // Tab out — the form saves the field on BLUR (`Form.tsx:148`)
    await page.keyboard.press(`Tab`);
    // Let the update reach the server
    await wait(page, 3);
    // ⭐ RESTORED (server): the field holds no value again — saved by the UI clear
    await assertFromJavascript(page, `const K = "__dd134_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((f => !!f && (v => v === null || v === undefined || v === '')(f.value))((() => { const formId = (location.pathname.match(/\\/form\\/([^/?#]+)/) || [])[1];
  const form = ((data.workStage && data.workStage.forms) || []).find(f => f && f.id === formId);
  const id = sessionStorage.getItem('__dd134_field');
  return form && id ? (form.fields || []).find(x => x && x.id === id) : null; })())); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { forms { id fields { __typename ... on WorkStageFormDetail { id value attributeTypeId { type } } } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd134_server', '__dd134_server:inflight', '__dd134_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // SAFETY NET (always): write the tagged field back to empty over /graphql — a no-op when the UI restore above saved
    await assertFromJavascript(page, `const id = sessionStorage.getItem('__dd134_field');
if (!id || sessionStorage.getItem('__dd134_net')) return true;   // nothing tagged, or already sent
sessionStorage.setItem('__dd134_net', '1');
window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
  body: JSON.stringify({ query: 'mutation($id: ID!, $data: UpdateWorkStageFormDetailInput!) { updateWorkStageFormDetail(id: $id, data: $data) { __typename } }', variables: { id, data: { value: null } } }) });
return true;`, 15000);
    // Let the safety-net write land
    await wait(page, 3);
    // AT REST (server): the field is empty after the safety net
    await assertFromJavascript(page, `const K = "__dd134_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((f => !!f && (v => v === null || v === undefined || v === '')(f.value))((() => { const formId = (location.pathname.match(/\\/form\\/([^/?#]+)/) || [])[1];
  const form = ((data.workStage && data.workStage.forms) || []).find(f => f && f.id === formId);
  const id = sessionStorage.getItem('__dd134_field');
  return form && id ? (form.fields || []).find(x => x && x.id === id) : null; })())); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { forms { id fields { __typename ... on WorkStageFormDetail { id value attributeTypeId { type } } } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd134_server', '__dd134_server:inflight', '__dd134_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the tag's and the safety net's sessionStorage keys
    await assertFromJavascript(page, `['__dd134_field', '__dd134_net'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  }
  soft.check();
}
