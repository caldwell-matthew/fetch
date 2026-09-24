// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.391_Work_Add_Failure.json. This file is the source now: edit it directly.
// MOB.391_Work_Add_Failure

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';

export async function mob391(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Wait for the workstage pages and the lookup prefetch", {}, async () => {
    await wait(page, 20);
  });
  await run.step("The work list rendered its search box", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 1/3: the initial fetch finished", {}, async () => {
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 2/3: paging through workstages finished", {}, async () => {
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 3/3: the per-stage detail downloads finished", {}, async () => {
    await assertPageLacks(page, `workstages downloaded`, 360000);
  });
  await run.step("LOADEDALL: start the idle clock", {}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd_worklist_idle_since');
return true;`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL: no loading bar on screen for 10s straight (all six phases, and the gaps between them)", {}, async () => {
    await assertFromJavascript(page, `const K = '__dd_worklist_idle_since';
if (document.querySelector('.mantine-Progress-root')) {
  sessionStorage.removeItem(K);
  return false;
}
const since = Number(sessionStorage.getItem(K)) || 0;
if (!since) { sessionStorage.setItem(K, String(Date.now())); return false; }
return Date.now() - since >= 10000;`, 360000);
  });
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the Failure tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the Failure cards render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("PREMISE: no failure with the run's key (BELT (R-L1) \u00b7 ADJUST \u00b7 TIME) exists \u2014 so the one found after the add is THIS run's; and COUNT the original (BELT (R-L1) \u00b7 MISSED \u00b7 TIME)", {}, async () => {
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
  });
  await run.step("Open the add form", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the asset lookup", {}, async () => {
    await click(page, `//*[@id="assetId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for asset options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick Pump 0102", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Pump 0102")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the failure type lookup", {}, async () => {
    await click(page, `//*[@id="failureTypeId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for failure type options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick BELT (R-L1)", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "BELT (R-L1)")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the repair type lookup", {}, async () => {
    await click(page, `//*[@id="repairTypeId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for repair type options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick ADJUST", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "ADJUST")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the root cause type lookup", {}, async () => {
    await click(page, `//*[@id="rootCauseTypeId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for root cause type options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick TIME", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "TIME")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit is ARMED \u2014 `button[form=\"work-failure-form\"]` is `type=\"submit\"` (the form validated; trap 8)", {}, async () => {
    await assertFromJavascript(page, `const b = document.querySelector('button[form="work-failure-form"]');
return !!b && b.type === 'submit';`, 30000);
  });
  await run.step("Submit the form", {}, async () => {
    await click(page, `//button[@form="work-failure-form"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the add mutation", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the form modal closed (durable success signal) \u2014 red while bugs \u00a742 is open: the first add after a page load does not submit", {allow: 'soft'}, async () => {
    await assertPageLacks(page, `Submit`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the server answer before reloading", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Navigate to the fixture work order (reload: the server's answer)", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the Failure tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`, 30000);
  });
  await run.step("Let the Failure cards render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 SERVER PROOF: exactly ONE failure with the run's key after a RELOAD, carrying the picked values", {allow: 'soft'}, async () => {
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
  await run.step("\u2b50 SERVER: exactly ONE failure with the run's key \u2014 asked over /graphql", {allow: 'soft'}, async () => {
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
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd39x_server', '__dd39x_server:inflight', '__dd39x_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\ud83d\uded1 GUARD + open its gear: only if exactly one failure has the run's key (the premise proved it was absent before this run's add)", {allow: 'soft'}, async () => {
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
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Click `Delete Item` \u2014 on THIS card (its own record id)", {allow: 'soft'}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Delete Item"])[1]`, 30000);
  });
  await run.step("Let the confirmation open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Confirm: \"Yes\"", {allow: 'soft'}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Are you sure you want to delete this record?")]]//button[normalize-space(.)="Yes"]`, 30000);
  });
  await run.step("Wait for the remove mutation", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Navigate to the fixture work order (reload: after the delete)", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the Failure tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`, 30000);
  });
  await run.step("Let the Failure cards render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 CLEANED: no failure with the run's key, and the original (BELT (R-L1) \u00b7 MISSED \u00b7 TIME) is untouched \u2014 same count as before (after a reload: the cache the delete already edited)", {allow: 'soft'}, async () => {
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
  await run.step("\u2b50 SERVER: the run's failure is gone and the original (BELT (R-L1) \u00b7 MISSED \u00b7 TIME) is untouched \u2014 asked over /graphql", {allow: 'soft'}, async () => {
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
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd39x_server', '__dd39x_server:inflight', '__dd39x_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Remove this test's sessionStorage key", {always: true}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd39x_origCount');
return true;`, 15000);
  });
  run.finish();
}
