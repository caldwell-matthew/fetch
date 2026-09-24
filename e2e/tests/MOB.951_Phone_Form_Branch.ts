// Generated from legacy/Mobile/dd_tests_mobile/MOB.951_Phone_Form_Branch.json by to_playwright.py — do not edit by hand yet.
// MOB.951_Phone_Form_Branch

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, click, wait } from '../support/dd';

export async function mob951(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 warm the work lookup cache", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertPageContains(page, `Work Orders`, 30000);
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
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 30000);
  });
  await run.step("DEVICE: this session is PHONE width \u2014 `screen.availWidth` < 750 (the form's threshold)", {}, async () => {
    await assertFromJavascript(page, `const w = window.screen.availWidth;
return w > 0 && w < 750;`, 15000);
  });
  await run.step("Open the Forms tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Form")]`, 30000);
  });
  await run.step("GATE: the Forms tab is SELECTED \u2014 re-clicked every 3s until it is (a click on the settling tab strip can miss)", {}, async () => {
    await assertFromJavascript(page, `const tab = [...document.querySelectorAll('[role="tab"]')].find(t => (t.textContent || '').trim() === 'Forms');
if (!tab) return false;
if (tab.getAttribute('aria-selected') === 'true') return true;
const at = Number(sessionStorage.getItem('__dd951_forms_click') || 0);
if (Date.now() - at > 3000) { sessionStorage.setItem('__dd951_forms_click', String(Date.now())); tab.click(); }
return false;`, 30000);
  });
  await run.step("Remove the gate's sessionStorage key", {always: true}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd951_forms_click');
return true;`, 15000);
  });
  await run.step("Wait for the forms list", {}, async () => {
    await wait(page, 3);
  });
  await run.step("FIXTURE GUARD: the work order has at least one form card", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]`, 30000);
  });
  await run.step("Open the first form card", {}, async () => {
    await click(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]`, 30000);
  });
  await run.step("Let the form page render", {}, async () => {
    await wait(page, 4);
  });
  await run.step("ROUTE: we are on /work/<id>/form/<id>", {}, async () => {
    await assertFromJavascript(page, `return /\\/work\\/[^/]+\\/form\\/[^/]+$/.test(location.pathname);`, 30000);
  });
  await run.step("\u2b50 THE MOBILE FORM BRANCH: `#senor-work-form` rendered, and the desktop `#apm-dv-tabpanel` did NOT (`FormDetails.tsx`, `availWidth < 750`)", {}, async () => {
    await assertFromJavascript(page, `return !!document.getElementById('senor-work-form') && !document.getElementById('apm-dv-tabpanel');`, 30000);
  });
  await run.step("\u2b50 IMAGE FIELD (server): the form has an image field exactly when an `Upload Photo` button renders (`Forms/ImageInput.tsx:145`)", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd951_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const formId = (location.pathname.match(/\\/form\\/([^/?#]+)/) || [])[1];
  const form = ((data.workStage && data.workStage.forms) || []).find(f => f && f.id === formId);
  if (!form || !document.getElementById('senor-work-form')) return false;
  const hasImage = (form.fields || []).some(x => x && x.__typename === 'WorkStageFormDetail'
    && x.attributeTypeId && x.attributeTypeId.type === 'image');
  const button = [...document.querySelectorAll('button')]
    .some(b => (b.textContent || '').replace(/\\s+/g, ' ').trim() === 'Upload Photo');
  return hasImage === button;
})()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { forms { id fields { __typename ... on WorkStageFormDetail { id attributeTypeId { type } } } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd951_server', '__dd951_server:inflight', '__dd951_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  run.finish();
}
