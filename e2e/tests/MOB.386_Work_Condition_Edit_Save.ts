// Generated from Mobile/dd_tests_mobile/MOB.386_Work_Condition_Edit_Save.json by to_playwright.py — do not edit by hand yet.
// MOB.386_Work_Condition_Edit_Save

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementPresent, assertFromJavascript, assertPageContains, el, optional, wait } from '../support/dd';

export async function mob386(page: Page): Promise<void> {
  const soft = new Soft();
  try {
    // Navigate to the fixture work order (premise)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the Condition tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`).click({ timeout: 30000 });
    // Let the condition cards render
    await wait(page, 2);
    await soft.run("PREMISE: exactly one `Pump 0102 \u00b7 Mounting/Support` card on screen", async () => {
      await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...new Set([...document.querySelectorAll('li')]
  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)
  .map(li => li.closest('[class*="mantine-Paper-root"]')))].filter(Boolean);
const orig = cards.filter(c => {
  const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
  const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
  const b = c.querySelector('button');
  return a && norm(a.textContent) === 'Pump 0102' && b && norm(b.textContent) === 'Mounting/Support';
});
return orig.length === 1;`, 30000);
    });
    await soft.run("PREMISE (server): the Mounting/Support condition holds Condition Left 2 \u2014 the fixed restore value", async () => {
      await assertFromJavascript(page, `const K = "__dd386_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.workStage.condition.filter(c => c.inspectionElementId && c.inspectionElementId.name === 'Mounting/Support').length === 1 && data.workStage.condition.find(c => c.inspectionElementId && c.inspectionElementId.name === 'Mounting/Support').conditionScore === 2); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { condition { conditionScore inspectionElementId { name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    });
    // Open the `Pump 0102 · Mounting/Support` card's gear
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...new Set([...document.querySelectorAll('li')]
  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)
  .map(li => li.closest('[class*="mantine-Paper-root"]')))].filter(Boolean);
const orig = cards.filter(c => {
  const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
  const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
  const b = c.querySelector('button');
  return a && norm(a.textContent) === 'Pump 0102' && b && norm(b.textContent) === 'Mounting/Support';
});
if (orig.length !== 1) return false;
const g = orig[0].querySelector('[aria-label="Menu"]');
if (!g) return false;
g.click();
return true;`, 30000);
    // Let the menu open
    await wait(page, 1);
    // Click `Edit Item`
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Item"])[1]`).click({ timeout: 30000 });
    // Let the edit form mount (it loads the WorkStageCondition schema)
    await wait(page, 3);
    // The condition form opened
    await assertElementPresent(page, `//form[@id="work-condition-form"]`, 30000);
    // Focus the Condition Left lookup (`#conditionScore`)
    await el(page, `//*[@id="conditionScore"]`).click({ timeout: 30000 });
    // Wait for the score options
    await wait(page, 2);
    // Pick 4 — the one VISIBLE option titled exactly "4"
    await assertFromJavascript(page, `const vis = [...document.querySelectorAll('[role="option"]')].filter(o => {
  const t = o.querySelector('[class*="option-title"]');
  return t && (t.textContent || '').trim() === '4' && o.offsetParent !== null;
});
if (vis.length !== 1) return false;
vis[0].click();
return true;`, 20000);
    // The form now holds Condition Left 4
    await assertFromJavascript(page, `const el = document.getElementById('conditionScore');
return !!el && (el.value || '').trim() === '4';`, 20000);
    // Submit is ARMED — `button[form="work-condition-form"]` is `type="submit"` (valid AND dirty; trap 8)
    await assertFromJavascript(page, `const b = document.querySelector('button[form="work-condition-form"]');
return !!b && b.type === 'submit';`, 30000);
    // Submit the edit
    await el(page, `//button[@form="work-condition-form"]`).click({ timeout: 30000 });
    // Let the update reach the server
    await wait(page, 3);
    await soft.run("\u2b50 SERVER: the FIRST `Edit Item` after the page loads SAVED \u2014 Condition Left is 4 (bugs \u00a742: red until fixed; the modal proves nothing here)", async () => {
      await assertFromJavascript(page, `const K = "__dd386_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.workStage.condition.filter(c => c.inspectionElementId && c.inspectionElementId.name === 'Mounting/Support').length === 1 && data.workStage.condition.find(c => c.inspectionElementId && c.inspectionElementId.name === 'Mounting/Support').conditionScore === 4); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { condition { conditionScore inspectionElementId { name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    });
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd386_server', '__dd386_server:inflight', '__dd386_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd386_server', '__dd386_server:inflight', '__dd386_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Navigate to the fixture work order (restore)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the Condition tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`).click({ timeout: 30000 });
    // Let the condition cards render
    await wait(page, 2);
    // Open the `Pump 0102 · Mounting/Support` card's gear
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...new Set([...document.querySelectorAll('li')]
  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)
  .map(li => li.closest('[class*="mantine-Paper-root"]')))].filter(Boolean);
const orig = cards.filter(c => {
  const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
  const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
  const b = c.querySelector('button');
  return a && norm(a.textContent) === 'Pump 0102' && b && norm(b.textContent) === 'Mounting/Support';
});
if (orig.length !== 1) return false;
const g = orig[0].querySelector('[aria-label="Menu"]');
if (!g) return false;
g.click();
return true;`, 30000);
    // Let the menu open
    await wait(page, 1);
    // Click `Edit Item`
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Item"])[1]`).click({ timeout: 30000 });
    // Let the edit form mount (it loads the WorkStageCondition schema)
    await wait(page, 3);
    // The condition form opened
    await assertElementPresent(page, `//form[@id="work-condition-form"]`, 30000);
    // Close it unsaved — `GET_SCHEMA` is now cached, so the NEXT form builds the full schema (bugs §42)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`).click({ timeout: 30000 });
    // The condition form is closed
    await assertFromJavascript(page, `return !document.getElementById('work-condition-form');`, 20000);
    // Open the `Pump 0102 · Mounting/Support` card's gear
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...new Set([...document.querySelectorAll('li')]
  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)
  .map(li => li.closest('[class*="mantine-Paper-root"]')))].filter(Boolean);
const orig = cards.filter(c => {
  const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
  const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
  const b = c.querySelector('button');
  return a && norm(a.textContent) === 'Pump 0102' && b && norm(b.textContent) === 'Mounting/Support';
});
if (orig.length !== 1) return false;
const g = orig[0].querySelector('[aria-label="Menu"]');
if (!g) return false;
g.click();
return true;`, 30000);
    // Let the menu open
    await wait(page, 1);
    // Click `Edit Item`
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Item"])[1]`).click({ timeout: 30000 });
    // Let the edit form mount (it loads the WorkStageCondition schema)
    await wait(page, 3);
    // The condition form opened
    await assertElementPresent(page, `//form[@id="work-condition-form"]`, 30000);
    // Focus the Condition Left lookup (`#conditionScore`)
    await el(page, `//*[@id="conditionScore"]`).click({ timeout: 30000 });
    // Wait for the score options
    await wait(page, 2);
    // Pick 2 — the one VISIBLE option titled exactly "2"
    await assertFromJavascript(page, `const vis = [...document.querySelectorAll('[role="option"]')].filter(o => {
  const t = o.querySelector('[class*="option-title"]');
  return t && (t.textContent || '').trim() === '2' && o.offsetParent !== null;
});
if (vis.length !== 1) return false;
vis[0].click();
return true;`, 20000);
    // The form now holds Condition Left 2
    await assertFromJavascript(page, `const el = document.getElementById('conditionScore');
return !!el && (el.value || '').trim() === '2';`, 20000);
    await optional("Submit is ARMED \u2014 `button[form=\"work-condition-form\"]` is `type=\"submit\"` (valid AND dirty; trap 8) \u2014 optional: the form is not dirty when the edit never saved", async () => {
      await assertFromJavascript(page, `const b = document.querySelector('button[form="work-condition-form"]');
return !!b && b.type === 'submit';`, 15000);
    });
    // Submit the edit
    await el(page, `//button[@form="work-condition-form"]`).click({ timeout: 30000 });
    // Let the update reach the server
    await wait(page, 3);
    // ⭐ RESTORED (server): Condition Left is back to 2
    await assertFromJavascript(page, `const K = "__dd386_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.workStage.condition.filter(c => c.inspectionElementId && c.inspectionElementId.name === 'Mounting/Support').length === 1 && data.workStage.condition.find(c => c.inspectionElementId && c.inspectionElementId.name === 'Mounting/Support').conditionScore === 2); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { condition { conditionScore inspectionElementId { name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd386_server', '__dd386_server:inflight', '__dd386_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  }
  soft.check();
}
