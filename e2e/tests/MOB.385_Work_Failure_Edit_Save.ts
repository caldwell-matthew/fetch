// Generated from Mobile/dd_tests_mobile/MOB.385_Work_Failure_Edit_Save.json by to_playwright.py — do not edit by hand yet.
// MOB.385_Work_Failure_Edit_Save

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementPresent, assertFromJavascript, assertPageContains, el, wait } from '../support/dd';

export async function mob385(page: Page): Promise<void> {
  const soft = new Soft();
  try {
    // Navigate to the fixture work order (premise)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the Failure tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`).click({ timeout: 30000 });
    // Let the failure cards render
    await wait(page, 2);
    await soft.run("PREMISE: exactly one `Pump 0102 \u00b7 BELT (R-L1) \u00b7 MISSED \u00b7 TIME` card on screen", async () => {
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
    await soft.run("PREMISE (server): the fixture's one failure is BELT (R-L1) \u00b7 MISSED \u00b7 TIME \u2014 the fixed restore value", async () => {
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
    // Open the `Pump 0102 · BELT (R-L1) · TIME` failure card's gear — exactly one such card reading MISSED
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
    // Let the menu open
    await wait(page, 1);
    // Click `Edit Item`
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Item"])[1]`).click({ timeout: 30000 });
    // Let the edit form mount (it loads the WorkStageFailure schema)
    await wait(page, 3);
    // The failure form opened
    await assertElementPresent(page, `//form[@id="work-failure-form"]`, 30000);
    // The form opened PREFILLED from this card: `#failureTypeId` BELT (R-L1), `#repairTypeId` MISSED, `#rootCauseTypeId` TIME
    await assertFromJavascript(page, `const v = id => { const el = document.getElementById(id); return el ? (el.value || '').trim() : null; };
return v('failureTypeId') === 'BELT (R-L1)' && v('repairTypeId') === 'MISSED' && v('rootCauseTypeId') === 'TIME';`, 30000);
    // Focus the Repair Type lookup (`#repairTypeId`)
    await el(page, `//*[@id="repairTypeId"]`).click({ timeout: 30000 });
    // Wait for the repair type options
    await wait(page, 2);
    // Pick REPAIR — the one VISIBLE option titled exactly "REPAIR"
    await assertFromJavascript(page, `const vis = [...document.querySelectorAll('[role="option"]')].filter(o => {
  const t = o.querySelector('[class*="option-title"]');
  return t && (t.textContent || '').trim() === 'REPAIR' && o.offsetParent !== null;
});
if (vis.length !== 1) return false;
vis[0].click();
return true;`, 20000);
    // The form now holds Repair Type REPAIR
    await assertFromJavascript(page, `const el = document.getElementById('repairTypeId');
return !!el && (el.value || '').trim() === 'REPAIR';`, 20000);
    // Failure Type and Root Cause are still BELT (R-L1) / TIME (no cascade cleared them)
    await assertFromJavascript(page, `const v = id => { const el = document.getElementById(id); return el ? (el.value || '').trim() : null; };
return v('failureTypeId') === 'BELT (R-L1)' && v('rootCauseTypeId') === 'TIME';`, 20000);
    // Submit is ARMED — `button[form="work-failure-form"]` is `type="submit"` (trap 8)
    await assertFromJavascript(page, `const b = document.querySelector('button[form="work-failure-form"]');
return !!b && b.type === 'submit';`, 30000);
    // Submit the edit
    await el(page, `//button[@form="work-failure-form"]`).click({ timeout: 30000 });
    // Let the update reach the server
    await wait(page, 3);
    await soft.run("\u2b50 SERVER: the FIRST `Edit Item` after the page loads SAVED \u2014 the same failure now holds Repair Type REPAIR (bugs \u00a742: red until fixed; the modal proves nothing here)", async () => {
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
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd385_server', '__dd385_server:inflight', '__dd385_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd385_server', '__dd385_server:inflight', '__dd385_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Navigate to the fixture work order (restore)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the Failure tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`).click({ timeout: 30000 });
    // Let the failure cards render
    await wait(page, 2);
    // Open the `Pump 0102 · BELT (R-L1) · TIME` failure card's gear — exactly one such card
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
    // Let the menu open
    await wait(page, 1);
    // Click `Edit Item`
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Item"])[1]`).click({ timeout: 30000 });
    // Let the edit form mount (it loads the WorkStageFailure schema)
    await wait(page, 3);
    // The failure form opened
    await assertElementPresent(page, `//form[@id="work-failure-form"]`, 30000);
    // Close it unsaved — `GET_SCHEMA` is now cached, so the NEXT form builds the full schema (bugs §42)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`).click({ timeout: 30000 });
    // The failure form is closed
    await assertFromJavascript(page, `return !document.getElementById('work-failure-form');`, 20000);
    // Open the `Pump 0102 · BELT (R-L1) · TIME` failure card's gear — exactly one such card
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
    // Let the menu open
    await wait(page, 1);
    // Click `Edit Item`
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Item"])[1]`).click({ timeout: 30000 });
    // Let the edit form mount (it loads the WorkStageFailure schema)
    await wait(page, 3);
    // The failure form opened
    await assertElementPresent(page, `//form[@id="work-failure-form"]`, 30000);
    // Focus the Repair Type lookup (`#repairTypeId`)
    await el(page, `//*[@id="repairTypeId"]`).click({ timeout: 30000 });
    // Wait for the repair type options
    await wait(page, 2);
    // Pick MISSED — the one VISIBLE option titled exactly "MISSED"
    await assertFromJavascript(page, `const vis = [...document.querySelectorAll('[role="option"]')].filter(o => {
  const t = o.querySelector('[class*="option-title"]');
  return t && (t.textContent || '').trim() === 'MISSED' && o.offsetParent !== null;
});
if (vis.length !== 1) return false;
vis[0].click();
return true;`, 20000);
    // The form now holds Repair Type MISSED
    await assertFromJavascript(page, `const el = document.getElementById('repairTypeId');
return !!el && (el.value || '').trim() === 'MISSED';`, 20000);
    // Failure Type and Root Cause are still BELT (R-L1) / TIME (no cascade cleared them)
    await assertFromJavascript(page, `const v = id => { const el = document.getElementById(id); return el ? (el.value || '').trim() : null; };
return v('failureTypeId') === 'BELT (R-L1)' && v('rootCauseTypeId') === 'TIME';`, 20000);
    // Submit is ARMED — `button[form="work-failure-form"]` is `type="submit"` (trap 8)
    await assertFromJavascript(page, `const b = document.querySelector('button[form="work-failure-form"]');
return !!b && b.type === 'submit';`, 30000);
    // Submit the edit
    await el(page, `//button[@form="work-failure-form"]`).click({ timeout: 30000 });
    // Let the update reach the server
    await wait(page, 3);
    // ⭐ RESTORED (server): the failure is back to BELT (R-L1) · MISSED · TIME
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
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd385_server', '__dd385_server:inflight', '__dd385_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  }
  soft.check();
}
