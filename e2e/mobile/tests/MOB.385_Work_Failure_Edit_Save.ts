// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.385_Work_Failure_Edit_Save.json. This file is the source now: edit it directly.
// MOB.385_Work_Failure_Edit_Save

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, click, wait } from '../../support/dd';

export async function mob385(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the fixture work order (premise)", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the Failure tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`, 30000);
  });
  await run.step("Let the failure cards render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("PREMISE: exactly one `Pump 0102 \u00b7 BELT (R-L1) \u00b7 MISSED \u00b7 TIME` card on screen", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...document.querySelectorAll('table')]
  .filter(t => /Failure Type/.test(t.textContent || ''))
  .map(t => { const c = t.closest('[class*="mantine-Paper-root"]'); if (!c) return null;
    const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
    const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
    const row = {}; [...t.querySelectorAll('tr')].forEach(tr => { const td = [...tr.children].map(x => norm(x.textContent)); if (td.length >= 2) row[td[0]] = td[1]; });
    return { el: c, asset: a ? norm(a.textContent) : '', row }; }).filter(Boolean);
const orig = cards.filter(c => c.asset === 'Pump 0102' && c.row['Failure Type'] === 'BELT (R-L1)'
  && c.row['Root Cause'] === 'TIME' && ['MISSED', 'REPAIR'].indexOf(c.row['Repair Type']) !== -1);
return orig.length === 1 && orig[0].row['Repair Type'] === 'MISSED';`, 30000);
  });
  await run.step("PREMISE (server): the fixture's one failure is BELT (R-L1) \u00b7 MISSED \u00b7 TIME \u2014 the fixed restore value", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const K = "__dd385_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.workStage.failures.length === 1 && ((f) => f.id === 'YxYAgs5xtV5pQJFopUw5xN' && !!f.assetId && f.assetId.name === 'Pump 0102' && !f.componentTypeId && !!f.failureTypeId && f.failureTypeId.name === 'BELT (R-L1)' && !!f.rootCauseTypeId && f.rootCauseTypeId.name === 'TIME' && !f.discoveryCodeId && !!f.repairTypeId && f.repairTypeId.name === 'MISSED')(data.workStage.failures[0])); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { failures { id assetId { name } componentTypeId { id } failureTypeId { name } repairTypeId { name } rootCauseTypeId { name } discoveryCodeId { id } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd385_server', '__dd385_server:inflight', '__dd385_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Open the `Pump 0102 \u00b7 BELT (R-L1) \u00b7 TIME` failure card's gear \u2014 exactly one such card reading MISSED", {}, async () => {
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...document.querySelectorAll('table')]
  .filter(t => /Failure Type/.test(t.textContent || ''))
  .map(t => { const c = t.closest('[class*="mantine-Paper-root"]'); if (!c) return null;
    const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
    const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
    const row = {}; [...t.querySelectorAll('tr')].forEach(tr => { const td = [...tr.children].map(x => norm(x.textContent)); if (td.length >= 2) row[td[0]] = td[1]; });
    return { el: c, asset: a ? norm(a.textContent) : '', row }; }).filter(Boolean);
const orig = cards.filter(c => c.asset === 'Pump 0102' && c.row['Failure Type'] === 'BELT (R-L1)'
  && c.row['Root Cause'] === 'TIME' && ['MISSED', 'REPAIR'].indexOf(c.row['Repair Type']) !== -1);
if (orig.length !== 1 || orig[0].row['Repair Type'] !== 'MISSED') return false;
const g = orig[0].el.querySelector('[aria-label="Menu"]');
if (!g) return false;
g.click();
return true;`, 30000);
  });
  await run.step("Click `Edit Item`", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Item"])[1]`, 30000);
  });
  await run.step("The failure form opened", {}, async () => {
    await assertElementPresent(page, `//form[@id="work-failure-form"]`, 30000);
  });
  await run.step("The form opened PREFILLED from this card: `#failureTypeId` BELT (R-L1), `#repairTypeId` MISSED, `#rootCauseTypeId` TIME", {}, async () => {
    await assertFromJavascript(page, `const v = id => { const el = document.getElementById(id); return el ? (el.value || '').trim() : null; };
return v('failureTypeId') === 'BELT (R-L1)' && v('repairTypeId') === 'MISSED' && v('rootCauseTypeId') === 'TIME';`, 30000);
  });
  await run.step("Focus the Repair Type lookup (`#repairTypeId`)", {}, async () => {
    await click(page, `//*[@id="repairTypeId"]`, 30000);
  });
  await run.step("Wait for the repair type options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick REPAIR \u2014 the one VISIBLE option titled exactly \"REPAIR\"", {}, async () => {
    await assertFromJavascript(page, `const vis = [...document.querySelectorAll('[role="option"]')].filter(o => {
  const t = o.querySelector('[class*="option-title"]');
  return t && (t.textContent || '').trim() === 'REPAIR' && o.offsetParent !== null;
});
if (vis.length !== 1) return false;
vis[0].click();
return true;`, 20000);
  });
  await run.step("The form now holds Repair Type REPAIR", {}, async () => {
    await assertFromJavascript(page, `const el = document.getElementById('repairTypeId');
return !!el && (el.value || '').trim() === 'REPAIR';`, 20000);
  });
  await run.step("Failure Type and Root Cause are still BELT (R-L1) / TIME (no cascade cleared them)", {}, async () => {
    await assertFromJavascript(page, `const v = id => { const el = document.getElementById(id); return el ? (el.value || '').trim() : null; };
return v('failureTypeId') === 'BELT (R-L1)' && v('rootCauseTypeId') === 'TIME';`, 20000);
  });
  await run.step("Submit is ARMED \u2014 `button[form=\"work-failure-form\"]` is `type=\"submit\"` (trap 8)", {}, async () => {
    await assertFromJavascript(page, `const b = document.querySelector('button[form="work-failure-form"]');
return !!b && b.type === 'submit';`, 30000);
  });
  await run.step("Submit the edit", {}, async () => {
    await click(page, `//button[@form="work-failure-form"]`, 30000);
  });
  await run.step("Let the update reach the server", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 SERVER: the FIRST `Edit Item` after the page loads SAVED \u2014 the same failure now holds Repair Type REPAIR (bugs \u00a742: red until fixed; the modal proves nothing here)", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const K = "__dd385_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.workStage.failures.length === 1 && ((f) => f.id === 'YxYAgs5xtV5pQJFopUw5xN' && !!f.assetId && f.assetId.name === 'Pump 0102' && !f.componentTypeId && !!f.failureTypeId && f.failureTypeId.name === 'BELT (R-L1)' && !!f.rootCauseTypeId && f.rootCauseTypeId.name === 'TIME' && !f.discoveryCodeId && !!f.repairTypeId && f.repairTypeId.name === 'REPAIR')(data.workStage.failures[0])); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { failures { id assetId { name } componentTypeId { id } failureTypeId { name } repairTypeId { name } rootCauseTypeId { name } discoveryCodeId { id } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd385_server', '__dd385_server:inflight', '__dd385_server:at'].forEach(k => sessionStorage.removeItem(k));
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
  await run.step("Open the Failure tab", {always: true}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`, 30000);
  });
  await run.step("Let the failure cards render", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Open the `Pump 0102 \u00b7 BELT (R-L1) \u00b7 TIME` failure card's gear \u2014 exactly one such card", {always: true}, async () => {
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...document.querySelectorAll('table')]
  .filter(t => /Failure Type/.test(t.textContent || ''))
  .map(t => { const c = t.closest('[class*="mantine-Paper-root"]'); if (!c) return null;
    const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
    const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
    const row = {}; [...t.querySelectorAll('tr')].forEach(tr => { const td = [...tr.children].map(x => norm(x.textContent)); if (td.length >= 2) row[td[0]] = td[1]; });
    return { el: c, asset: a ? norm(a.textContent) : '', row }; }).filter(Boolean);
const orig = cards.filter(c => c.asset === 'Pump 0102' && c.row['Failure Type'] === 'BELT (R-L1)'
  && c.row['Root Cause'] === 'TIME' && ['MISSED', 'REPAIR'].indexOf(c.row['Repair Type']) !== -1);
if (orig.length !== 1) return false;
const g = orig[0].el.querySelector('[aria-label="Menu"]');
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
  await run.step("Let the edit form mount (it loads the WorkStageFailure schema)", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("The failure form opened", {always: true}, async () => {
    await assertElementPresent(page, `//form[@id="work-failure-form"]`, 30000);
  });
  await run.step("Close it unsaved \u2014 `GET_SCHEMA` is now cached, so the NEXT form builds the full schema (bugs \u00a742)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`, 30000);
  });
  await run.step("The failure form is closed", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.getElementById('work-failure-form');`, 20000);
  });
  await run.step("Open the `Pump 0102 \u00b7 BELT (R-L1) \u00b7 TIME` failure card's gear \u2014 exactly one such card", {always: true}, async () => {
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...document.querySelectorAll('table')]
  .filter(t => /Failure Type/.test(t.textContent || ''))
  .map(t => { const c = t.closest('[class*="mantine-Paper-root"]'); if (!c) return null;
    const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
    const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
    const row = {}; [...t.querySelectorAll('tr')].forEach(tr => { const td = [...tr.children].map(x => norm(x.textContent)); if (td.length >= 2) row[td[0]] = td[1]; });
    return { el: c, asset: a ? norm(a.textContent) : '', row }; }).filter(Boolean);
const orig = cards.filter(c => c.asset === 'Pump 0102' && c.row['Failure Type'] === 'BELT (R-L1)'
  && c.row['Root Cause'] === 'TIME' && ['MISSED', 'REPAIR'].indexOf(c.row['Repair Type']) !== -1);
if (orig.length !== 1) return false;
const g = orig[0].el.querySelector('[aria-label="Menu"]');
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
  await run.step("Let the edit form mount (it loads the WorkStageFailure schema)", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("The failure form opened", {always: true}, async () => {
    await assertElementPresent(page, `//form[@id="work-failure-form"]`, 30000);
  });
  await run.step("Focus the Repair Type lookup (`#repairTypeId`)", {always: true}, async () => {
    await click(page, `//*[@id="repairTypeId"]`, 30000);
  });
  await run.step("Wait for the repair type options", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick MISSED \u2014 the one VISIBLE option titled exactly \"MISSED\"", {always: true}, async () => {
    await assertFromJavascript(page, `const vis = [...document.querySelectorAll('[role="option"]')].filter(o => {
  const t = o.querySelector('[class*="option-title"]');
  return t && (t.textContent || '').trim() === 'MISSED' && o.offsetParent !== null;
});
if (vis.length !== 1) return false;
vis[0].click();
return true;`, 20000);
  });
  await run.step("The form now holds Repair Type MISSED", {always: true}, async () => {
    await assertFromJavascript(page, `const el = document.getElementById('repairTypeId');
return !!el && (el.value || '').trim() === 'MISSED';`, 20000);
  });
  await run.step("Failure Type and Root Cause are still BELT (R-L1) / TIME (no cascade cleared them)", {always: true}, async () => {
    await assertFromJavascript(page, `const v = id => { const el = document.getElementById(id); return el ? (el.value || '').trim() : null; };
return v('failureTypeId') === 'BELT (R-L1)' && v('rootCauseTypeId') === 'TIME';`, 20000);
  });
  await run.step("Submit is ARMED \u2014 `button[form=\"work-failure-form\"]` is `type=\"submit\"` (trap 8)", {always: true}, async () => {
    await assertFromJavascript(page, `const b = document.querySelector('button[form="work-failure-form"]');
return !!b && b.type === 'submit';`, 30000);
  });
  await run.step("Submit the edit", {always: true}, async () => {
    await click(page, `//button[@form="work-failure-form"]`, 30000);
  });
  await run.step("Let the update reach the server", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 RESTORED (server): the failure is back to BELT (R-L1) \u00b7 MISSED \u00b7 TIME", {always: true}, async () => {
    await assertFromJavascript(page, `const K = "__dd385_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.workStage.failures.length === 1 && ((f) => f.id === 'YxYAgs5xtV5pQJFopUw5xN' && !!f.assetId && f.assetId.name === 'Pump 0102' && !f.componentTypeId && !!f.failureTypeId && f.failureTypeId.name === 'BELT (R-L1)' && !!f.rootCauseTypeId && f.rootCauseTypeId.name === 'TIME' && !f.discoveryCodeId && !!f.repairTypeId && f.repairTypeId.name === 'MISSED')(data.workStage.failures[0])); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { failures { id assetId { name } componentTypeId { id } failureTypeId { name } repairTypeId { name } rootCauseTypeId { name } discoveryCodeId { id } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd385_server', '__dd385_server:inflight', '__dd385_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  run.finish();
}
