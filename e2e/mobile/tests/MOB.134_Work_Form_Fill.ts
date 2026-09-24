// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.134_Work_Form_Fill.json. This file is the source now: edit it directly.
// MOB.134_Work_Form_Fill

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, press, typeText, wait } from '../../support/dd';

export async function mob134(page: Page): Promise<void> {
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
  await run.step("Open the Forms tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Form")]`, 30000);
  });
  await run.step("Wait for the forms list", {}, async () => {
    await wait(page, 3);
  });
  await run.step("FIXTURE GUARD: the work order has at least one form card", {allow: 'soft'}, async () => {
    await assertElementPresent(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]`, 60000);
  });
  await run.step("Open the first form card", {}, async () => {
    await click(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]`, 60000);
  });
  await run.step("Let the form page render", {}, async () => {
    await wait(page, 4);
  });
  await run.step("ROUTE: we are on /work/<id>/form/<id>", {}, async () => {
    await assertFromJavascript(page, `return /\\/work\\/[^/]+\\/form\\/[^/]+$/.test(location.pathname);`, 60000);
  });
  await run.step("The desktop form container mounted", {}, async () => {
    await assertElementPresent(page, `//*[@id="apm-dv-tabpanel"]`, 60000);
  });
  await run.step("\ud83d\uded1 FIELD GUARD (server): the first number input is this form's INTEGER field, empty (or holding this test's 134) \u2014 tags it `data-dd134`; nothing types without the tag", {allow: 'soft'}, async () => {
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
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd134_server', '__dd134_server:inflight', '__dd134_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Focus the tagged integer field (write)", {}, async () => {
    await click(page, `//input[@data-dd134="target"]`, 30000);
  });
  await run.step("Select any existing value (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type 134 \u2014 digits (a `NumberInput` drops letters: the archived test's blocker)", {}, async () => {
    await typeText(page, `//input[@data-dd134="target"]`, `134`, DEFAULT_TIMEOUT);
  });
  await run.step("The input holds '134' BEFORE the blur", {}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('[data-dd134="target"]');
return !!el && el.value === '134';`, 15000);
  });
  await run.step("Tab out \u2014 the form saves the field on BLUR (`Form.tsx:148`)", {}, async () => {
    await press(page, `Tab`);
  });
  await run.step("Let the update reach the server", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 SERVER: the field holds 134 \u2014 asked over /graphql", {}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd134_server', '__dd134_server:inflight', '__dd134_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("RE-TAG (restore): the stored field's input gets `data-dd134` again \u2014 the save re-rendered it", {always: true}, async () => {
    await assertFromJavascript(page, `const id = sessionStorage.getItem('__dd134_field');
const el = id ? document.getElementById(id) : null;
if (!el || el.offsetParent === null) return false;
el.setAttribute('data-dd134', 'target');
return true;`, 30000);
  });
  await run.step("Focus the tagged integer field (restore)", {always: true}, async () => {
    await click(page, `//input[@data-dd134="target"]`, 30000);
  });
  await run.step("Clear it as React sees a user's edit \u2014 the native value setter and an `input` event (Datadog's `Delete` key left `134` in place)", {always: true}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('[data-dd134="target"]');
if (!el) return false;
el.focus();
Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
el.dispatchEvent(new window.Event('input', { bubbles: true }));
return el.value === '';`, 15000);
  });
  await run.step("The input holds '' BEFORE the blur", {always: true}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('[data-dd134="target"]');
return !!el && el.value === '';`, 15000);
  });
  await run.step("Tab out \u2014 the form saves the field on BLUR (`Form.tsx:148`)", {always: true}, async () => {
    await press(page, `Tab`);
  });
  await run.step("Let the update reach the server", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 RESTORED (server): the field holds no value again \u2014 saved by the UI clear", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd134_server', '__dd134_server:inflight', '__dd134_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("SAFETY NET (always): write the tagged field back to empty over /graphql \u2014 a no-op when the UI restore above saved", {always: true}, async () => {
    await assertFromJavascript(page, `const id = sessionStorage.getItem('__dd134_field');
if (!id || sessionStorage.getItem('__dd134_net')) return true;   // nothing tagged, or already sent
sessionStorage.setItem('__dd134_net', '1');
window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
  body: JSON.stringify({ query: 'mutation($id: ID!, $data: UpdateWorkStageFormDetailInput!) { updateWorkStageFormDetail(id: $id, data: $data) { __typename } }', variables: { id, data: { value: null } } }) });
return true;`, 15000);
  });
  await run.step("Let the safety-net write land", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("AT REST (server): the field is empty after the safety net", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd134_server', '__dd134_server:inflight', '__dd134_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Remove the tag's and the safety net's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd134_field', '__dd134_net'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  run.finish();
}
