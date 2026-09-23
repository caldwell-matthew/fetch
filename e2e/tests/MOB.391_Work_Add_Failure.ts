// Generated from Mobile/dd_tests_mobile/MOB.391_Work_Add_Failure.json by to_playwright.py — do not edit by hand yet.
// MOB.391_Work_Add_Failure

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob391(page: Page): Promise<void> {
  const soft = new Soft();
  try {
    // Navigate to /work — the work order list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Wait for the workstage pages and the lookup prefetch
    await wait(page, 20);
    // The work list rendered its search box
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
    // LOADEDALL 1/3: the initial fetch finished
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
    // LOADEDALL 2/3: paging through workstages finished
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
    // LOADEDALL 3/3: the per-stage detail downloads finished
    await assertPageLacks(page, `workstages downloaded`, 180000);
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the Failure tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Let the Failure cards render
    await wait(page, 2);
    // PREMISE: no failure with the run's key (BELT (R-L1) · ADJUST · TIME) exists — so the one found after the add is THIS run's; and COUNT the original (BELT (R-L1) · MISSED · TIME)
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...document.querySelectorAll('table')]
  .filter(t => /Failure Type/.test(t.textContent || ''))
  .map(t => { const c = t.closest('[class*="mantine-Paper-root"]'); if (!c) return null;
    const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
    const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
    const row = {}; [...t.querySelectorAll('tr')].forEach(tr => { const td = [...tr.children].map(x => norm(x.textContent)); if (td.length >= 2) row[td[0]] = td[1]; });
    return { el: c, asset: a ? norm(a.textContent) : '', row }; }).filter(Boolean);
const isKey = (c, rep) => c.asset === 'Pump 0102' && c.row['Failure Type'] === 'BELT (R-L1)'
  && c.row['Repair Type'] === rep && c.row['Root Cause'] === 'TIME';
const mine = cards.filter(c => isKey(c, 'ADJUST'));
const orig = cards.filter(c => isKey(c, 'MISSED'));
if (mine.length !== 0 || !document.evaluate("//button[normalize-space(.)=\\"Add\\"]", document, null, 9, null).singleNodeValue) return false;
sessionStorage.setItem('__dd39x_origCount', String(orig.length));
return true;`, 30000);
    // Open the add form
    await el(page, `//button[normalize-space(.)="Add"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Focus the asset lookup
    await el(page, `//*[@id="assetId"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for asset options
    await wait(page, 2);
    // Pick Pump 0102
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Pump 0102")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Focus the failure type lookup
    await el(page, `//*[@id="failureTypeId"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for failure type options
    await wait(page, 2);
    // Pick BELT (R-L1)
    await el(page, `//*[@role="option"][contains(normalize-space(.), "BELT (R-L1)")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Focus the repair type lookup
    await el(page, `//*[@id="repairTypeId"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for repair type options
    await wait(page, 2);
    // Pick ADJUST
    await el(page, `//*[@role="option"][contains(normalize-space(.), "ADJUST")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Focus the root cause type lookup
    await el(page, `//*[@id="rootCauseTypeId"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for root cause type options
    await wait(page, 2);
    // Pick TIME
    await el(page, `//*[@role="option"][contains(normalize-space(.), "TIME")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Submit is ARMED — `button[form="work-failure-form"]` is `type="submit"` (the form validated; trap 8)
    await assertFromJavascript(page, `const b = document.querySelector('button[form="work-failure-form"]');
return !!b && b.type === 'submit';`, 30000);
    // Submit the form
    await el(page, `//button[@form="work-failure-form"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the add mutation
    await wait(page, 3);
    await soft.run("Test the form modal closed (durable success signal) \u2014 red while bugs \u00a742 is open: the first add after a page load does not submit", async () => {
      await assertPageLacks(page, `Submit`, DEFAULT_TIMEOUT);
    });
    // Let the server answer before reloading
    await wait(page, 3);
    // Navigate to the fixture work order (reload: the server's answer)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the Failure tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`).click({ timeout: 30000 });
    // Let the Failure cards render
    await wait(page, 2);
    await soft.run("\u2b50 SERVER PROOF: exactly ONE failure with the run's key after a RELOAD, carrying the picked values", async () => {
      await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...document.querySelectorAll('table')]
  .filter(t => /Failure Type/.test(t.textContent || ''))
  .map(t => { const c = t.closest('[class*="mantine-Paper-root"]'); if (!c) return null;
    const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
    const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
    const row = {}; [...t.querySelectorAll('tr')].forEach(tr => { const td = [...tr.children].map(x => norm(x.textContent)); if (td.length >= 2) row[td[0]] = td[1]; });
    return { el: c, asset: a ? norm(a.textContent) : '', row }; }).filter(Boolean);
const isKey = (c, rep) => c.asset === 'Pump 0102' && c.row['Failure Type'] === 'BELT (R-L1)'
  && c.row['Repair Type'] === rep && c.row['Root Cause'] === 'TIME';
const mine = cards.filter(c => isKey(c, 'ADJUST'));
const orig = cards.filter(c => isKey(c, 'MISSED'));
return mine.length === 1 && true;`, 30000);
    });
    await soft.run("\u2b50 SERVER: exactly ONE failure with the run's key \u2014 asked over /graphql", async () => {
      await assertFromJavascript(page, `const K = "__dd39x_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const fs = data.workStage.failures;
  const is = (f, rep) => f.failureTypeId && f.repairTypeId && f.rootCauseTypeId
    && f.failureTypeId.name === 'BELT (R-L1)' && f.rootCauseTypeId.name === 'TIME' && f.repairTypeId.name === rep;
  return { mine: fs.filter(f => is(f, 'ADJUST')).length, orig: fs.filter(f => is(f, 'MISSED')).length }; })().mine === 1); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { failures { failureTypeId { name } repairTypeId { name } rootCauseTypeId { name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    });
    await soft.run("\ud83d\uded1 GUARD + open its gear: only if exactly one failure has the run's key (the premise proved it was absent before this run's add)", async () => {
      await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...document.querySelectorAll('table')]
  .filter(t => /Failure Type/.test(t.textContent || ''))
  .map(t => { const c = t.closest('[class*="mantine-Paper-root"]'); if (!c) return null;
    const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
    const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
    const row = {}; [...t.querySelectorAll('tr')].forEach(tr => { const td = [...tr.children].map(x => norm(x.textContent)); if (td.length >= 2) row[td[0]] = td[1]; });
    return { el: c, asset: a ? norm(a.textContent) : '', row }; }).filter(Boolean);
const isKey = (c, rep) => c.asset === 'Pump 0102' && c.row['Failure Type'] === 'BELT (R-L1)'
  && c.row['Repair Type'] === rep && c.row['Root Cause'] === 'TIME';
const mine = cards.filter(c => isKey(c, 'ADJUST'));
const orig = cards.filter(c => isKey(c, 'MISSED'));
if (mine.length !== 1) return false;
const g = mine[0].el.querySelector('[aria-label="Menu"]');
if (!g) return false;
g.click();
return true;`, 30000);
    });
    // Let the menu open
    await wait(page, 1);
    await soft.run("Click `Delete Item` \u2014 on THIS card (its own record id)", async () => {
      await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Delete Item"])[1]`).click({ timeout: 30000 });
    });
    // Let the confirmation open
    await wait(page, 1);
    await soft.run("Confirm: \"Yes\"", async () => {
      await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Are you sure you want to delete this record?")]]//button[normalize-space(.)="Yes"]`).click({ timeout: 30000 });
    });
    // Wait for the remove mutation
    await wait(page, 3);
    // Navigate to the fixture work order (reload: after the delete)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the Failure tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`).click({ timeout: 30000 });
    // Let the Failure cards render
    await wait(page, 2);
    await soft.run("\u2b50 CLEANED: no failure with the run's key, and the original (BELT (R-L1) \u00b7 MISSED \u00b7 TIME) is untouched \u2014 same count as before (after a reload: the cache the delete already edited)", async () => {
      await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...document.querySelectorAll('table')]
  .filter(t => /Failure Type/.test(t.textContent || ''))
  .map(t => { const c = t.closest('[class*="mantine-Paper-root"]'); if (!c) return null;
    const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
    const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
    const row = {}; [...t.querySelectorAll('tr')].forEach(tr => { const td = [...tr.children].map(x => norm(x.textContent)); if (td.length >= 2) row[td[0]] = td[1]; });
    return { el: c, asset: a ? norm(a.textContent) : '', row }; }).filter(Boolean);
const isKey = (c, rep) => c.asset === 'Pump 0102' && c.row['Failure Type'] === 'BELT (R-L1)'
  && c.row['Repair Type'] === rep && c.row['Root Cause'] === 'TIME';
const mine = cards.filter(c => isKey(c, 'ADJUST'));
const orig = cards.filter(c => isKey(c, 'MISSED'));
const before = sessionStorage.getItem('__dd39x_origCount');
return mine.length === 0 && before !== null && orig.length === Number(before);`, 30000);
    });
    await soft.run("\u2b50 SERVER: the run's failure is gone and the original (BELT (R-L1) \u00b7 MISSED \u00b7 TIME) is untouched \u2014 asked over /graphql", async () => {
      await assertFromJavascript(page, `const K = "__dd39x_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const r = (() => { const fs = data.workStage.failures;
  const is = (f, rep) => f.failureTypeId && f.repairTypeId && f.rootCauseTypeId
    && f.failureTypeId.name === 'BELT (R-L1)' && f.rootCauseTypeId.name === 'TIME' && f.repairTypeId.name === rep;
  return { mine: fs.filter(f => is(f, 'ADJUST')).length, orig: fs.filter(f => is(f, 'MISSED')).length }; })(); return r.mine === 0 && r.orig === Number(sessionStorage.getItem('__dd39x_origCount')); })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { failures { failureTypeId { name } repairTypeId { name } rootCauseTypeId { name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    });
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd39x_server', '__dd39x_server:inflight', '__dd39x_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd39x_server', '__dd39x_server:inflight', '__dd39x_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove this test's sessionStorage key
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd39x_origCount');
return true;`, 15000);
  }
  soft.check();
}
