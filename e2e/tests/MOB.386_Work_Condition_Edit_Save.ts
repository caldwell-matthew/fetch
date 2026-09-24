// Generated from legacy/Mobile/dd_tests_mobile/MOB.386_Work_Condition_Edit_Save.json by to_playwright.py — do not edit by hand yet.
// MOB.386_Work_Condition_Edit_Save

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, click, wait } from '../support/dd';

export async function mob386(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the fixture work order (premise)", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the Condition tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`, 30000);
  });
  await run.step("Let the condition cards render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("PREMISE: exactly one `Pump 0102 \u00b7 Mounting/Support` card on screen", {allow: 'soft'}, async () => {
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
  await run.step("PREMISE (server): the Mounting/Support condition holds Condition Left 2 \u2014 the fixed restore value", {allow: 'soft'}, async () => {
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
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd386_server', '__dd386_server:inflight', '__dd386_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Open the `Pump 0102 \u00b7 Mounting/Support` card's gear", {}, async () => {
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
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Click `Edit Item`", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Item"])[1]`, 30000);
  });
  await run.step("Let the edit form mount (it loads the WorkStageCondition schema)", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The condition form opened", {}, async () => {
    await assertElementPresent(page, `//form[@id="work-condition-form"]`, 30000);
  });
  await run.step("Focus the Condition Left lookup (`#conditionScore`)", {}, async () => {
    await click(page, `//*[@id="conditionScore"]`, 30000);
  });
  await run.step("Wait for the score options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick 4 \u2014 the one VISIBLE option titled exactly \"4\"", {}, async () => {
    await assertFromJavascript(page, `const vis = [...document.querySelectorAll('[role="option"]')].filter(o => {
  const t = o.querySelector('[class*="option-title"]');
  return t && (t.textContent || '').trim() === '4' && o.offsetParent !== null;
});
if (vis.length !== 1) return false;
vis[0].click();
return true;`, 20000);
  });
  await run.step("The form now holds Condition Left 4", {}, async () => {
    await assertFromJavascript(page, `const el = document.getElementById('conditionScore');
return !!el && (el.value || '').trim() === '4';`, 20000);
  });
  await run.step("Submit is ARMED \u2014 `button[form=\"work-condition-form\"]` is `type=\"submit\"` (valid AND dirty; trap 8)", {}, async () => {
    await assertFromJavascript(page, `const b = document.querySelector('button[form="work-condition-form"]');
return !!b && b.type === 'submit';`, 30000);
  });
  await run.step("Submit the edit", {}, async () => {
    await click(page, `//button[@form="work-condition-form"]`, 30000);
  });
  await run.step("Let the update reach the server", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 SERVER: the FIRST `Edit Item` after the page loads SAVED \u2014 Condition Left is 4 (bugs \u00a742: red until fixed; the modal proves nothing here)", {allow: 'soft'}, async () => {
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
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd386_server', '__dd386_server:inflight', '__dd386_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Navigate to the fixture work order (restore)", {always: true}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {always: true}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the Condition tab", {always: true}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`, 30000);
  });
  await run.step("Let the condition cards render", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Open the `Pump 0102 \u00b7 Mounting/Support` card's gear", {always: true}, async () => {
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
  });
  await run.step("Let the menu open", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("Click `Edit Item`", {always: true}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Item"])[1]`, 30000);
  });
  await run.step("Let the edit form mount (it loads the WorkStageCondition schema)", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("The condition form opened", {always: true}, async () => {
    await assertElementPresent(page, `//form[@id="work-condition-form"]`, 30000);
  });
  await run.step("Close it unsaved \u2014 `GET_SCHEMA` is now cached, so the NEXT form builds the full schema (bugs \u00a742)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`, 30000);
  });
  await run.step("The condition form is closed", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.getElementById('work-condition-form');`, 20000);
  });
  await run.step("Open the `Pump 0102 \u00b7 Mounting/Support` card's gear", {always: true}, async () => {
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
  });
  await run.step("Let the menu open", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("Click `Edit Item`", {always: true}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Item"])[1]`, 30000);
  });
  await run.step("Let the edit form mount (it loads the WorkStageCondition schema)", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("The condition form opened", {always: true}, async () => {
    await assertElementPresent(page, `//form[@id="work-condition-form"]`, 30000);
  });
  await run.step("Focus the Condition Left lookup (`#conditionScore`)", {always: true}, async () => {
    await click(page, `//*[@id="conditionScore"]`, 30000);
  });
  await run.step("Wait for the score options", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick 2 \u2014 the one VISIBLE option titled exactly \"2\"", {always: true}, async () => {
    await assertFromJavascript(page, `const vis = [...document.querySelectorAll('[role="option"]')].filter(o => {
  const t = o.querySelector('[class*="option-title"]');
  return t && (t.textContent || '').trim() === '2' && o.offsetParent !== null;
});
if (vis.length !== 1) return false;
vis[0].click();
return true;`, 20000);
  });
  await run.step("The form now holds Condition Left 2", {always: true}, async () => {
    await assertFromJavascript(page, `const el = document.getElementById('conditionScore');
return !!el && (el.value || '').trim() === '2';`, 20000);
  });
  await run.step("Submit is ARMED \u2014 `button[form=\"work-condition-form\"]` is `type=\"submit\"` (valid AND dirty; trap 8) \u2014 optional: the form is not dirty when the edit never saved", {always: true, allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const b = document.querySelector('button[form="work-condition-form"]');
return !!b && b.type === 'submit';`, 15000);
  });
  await run.step("Submit the edit", {always: true}, async () => {
    await click(page, `//button[@form="work-condition-form"]`, 30000);
  });
  await run.step("Let the update reach the server", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 RESTORED (server): Condition Left is back to 2", {always: true}, async () => {
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
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd386_server', '__dd386_server:inflight', '__dd386_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  run.finish();
}
