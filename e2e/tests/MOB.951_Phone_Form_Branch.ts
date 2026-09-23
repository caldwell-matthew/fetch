// Generated from Mobile/dd_tests_mobile/MOB.951_Phone_Form_Branch.json by to_playwright.py — do not edit by hand yet.
// MOB.951_Phone_Form_Branch

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, assertFromJavascript, assertPageContains, el, wait } from '../support/dd';

export async function mob951(page: Page): Promise<void> {
  try {
    // Navigate to /work — warm the work lookup cache
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertPageContains(page, `Work Orders`, 30000);
    // Let the lookup prefetch run
    await wait(page, 30);
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 3);
    // GATE: the detail data arrived (tab strip)
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 30000);
    // DEVICE: this session is PHONE width — `screen.availWidth` < 750 (the form's threshold)
    await assertFromJavascript(page, `const w = window.screen.availWidth;
return w > 0 && w < 750;`, 15000);
    // Open the Forms tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Form")]`).click({ timeout: 30000 });
    // GATE: the Forms tab is SELECTED — re-clicked every 3s until it is (a click on the settling tab strip can miss)
    await assertFromJavascript(page, `const tab = [...document.querySelectorAll('[role="tab"]')].find(t => (t.textContent || '').trim() === 'Forms');
if (!tab) return false;
if (tab.getAttribute('aria-selected') === 'true') return true;
const at = Number(sessionStorage.getItem('__dd951_forms_click') || 0);
if (Date.now() - at > 3000) { sessionStorage.setItem('__dd951_forms_click', String(Date.now())); tab.click(); }
return false;`, 30000);
    // Wait for the forms list
    await wait(page, 3);
    // FIXTURE GUARD: the work order has at least one form card
    await assertElementPresent(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]`, 30000);
    // Open the first form card
    await el(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]`).click({ timeout: 30000 });
    // Let the form page render
    await wait(page, 4);
    // ROUTE: we are on /work/<id>/form/<id>
    await assertFromJavascript(page, `return /\\/work\\/[^/]+\\/form\\/[^/]+$/.test(location.pathname);`, 30000);
    // ⭐ THE MOBILE FORM BRANCH: `#senor-work-form` rendered, and the desktop `#apm-dv-tabpanel` did NOT (`FormDetails.tsx`, `availWidth < 750`)
    await assertFromJavascript(page, `return !!document.getElementById('senor-work-form') && !document.getElementById('apm-dv-tabpanel');`, 30000);
    // ⭐ IMAGE FIELD (server): the form has an image field exactly when an `Upload Photo` button renders (`Forms/ImageInput.tsx:145`)
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
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the gate's sessionStorage key
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd951_forms_click');
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd951_server', '__dd951_server:inflight', '__dd951_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  }
}
