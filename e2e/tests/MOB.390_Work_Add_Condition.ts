// Generated from Mobile/dd_tests_mobile/MOB.390_Work_Add_Condition.json by to_playwright.py — do not edit by hand yet.
// MOB.390_Work_Add_Condition

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob390(page: Page): Promise<void> {
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
    // Open the Condition tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Let the Condition cards render
    await wait(page, 2);
    // PREMISE: no condition with the run's key (Pump 0102 · Structural · Pump Body) exists — so the one found after the add is THIS run's; and COUNT the original (Mounting/Support)
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...new Set([...document.querySelectorAll('li')]
  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)
  .map(li => li.closest('[class*="mantine-Paper-root"]')))].filter(Boolean).map(c => {
    const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
    const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
    const b = c.querySelector('button');
    return { el: c, asset: a ? norm(a.textContent) : '', label: b ? norm(b.textContent) : '',
             text: norm(c.textContent), lis: [...c.querySelectorAll('li')].map(li => norm(li.textContent)) };
  });
const isKey = (c, el) => c.asset === 'Pump 0102' && c.label === el && c.text.indexOf('Structural') !== -1;
const mine = cards.filter(c => isKey(c, 'Pump Body'));
const orig = cards.filter(c => isKey(c, 'Mounting/Support'));
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
    // Focus the inspection group lookup
    await el(page, `//*[@id="assetStandardDetailId"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for inspection group options
    await wait(page, 2);
    // Pick Structural
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Structural")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Focus the inspection element lookup
    await el(page, `//*[@id="inspectionElementId"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for inspection element options
    await wait(page, 2);
    // Pick Pump Body
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Pump Body")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Focus the condition found lookup
    await el(page, `//*[@id="conditionFound"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for condition found options
    await wait(page, 2);
    // Pick 1 — the one VISIBLE option titled exactly "1"
    await assertFromJavascript(page, `const vis = [...document.querySelectorAll('[role="option"]')].filter(o => {
  const t = o.querySelector('[class*="option-title"]');
  return t && (t.textContent || '').trim() === '1' && o.offsetParent !== null;
});
if (vis.length !== 1) return false;
vis[0].click();
return true;`, 20000);
    // Focus the condition left lookup
    await el(page, `//*[@id="conditionScore"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for condition left options
    await wait(page, 2);
    // Pick 2 — the one VISIBLE option titled exactly "2"
    await assertFromJavascript(page, `const vis = [...document.querySelectorAll('[role="option"]')].filter(o => {
  const t = o.querySelector('[class*="option-title"]');
  return t && (t.textContent || '').trim() === '2' && o.offsetParent !== null;
});
if (vis.length !== 1) return false;
vis[0].click();
return true;`, 20000);
    // Focus the stress score lookup
    await el(page, `//*[@id="stressScore"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for stress score options
    await wait(page, 2);
    // Pick 3 — the one VISIBLE option titled exactly "3"
    await assertFromJavascript(page, `const vis = [...document.querySelectorAll('[role="option"]')].filter(o => {
  const t = o.querySelector('[class*="option-title"]');
  return t && (t.textContent || '').trim() === '3' && o.offsetParent !== null;
});
if (vis.length !== 1) return false;
vis[0].click();
return true;`, 20000);
    // Submit is ARMED — `button[form="work-condition-form"]` is `type="submit"` (the form validated; trap 8)
    await assertFromJavascript(page, `const b = document.querySelector('button[form="work-condition-form"]');
return !!b && b.type === 'submit';`, 30000);
    // Submit the form
    await el(page, `//button[@form="work-condition-form"]`).click({ timeout: DEFAULT_TIMEOUT });
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
    // Open the Condition tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`).click({ timeout: 30000 });
    // Let the Condition cards render
    await wait(page, 2);
    await soft.run("\u2b50 SERVER PROOF: exactly ONE condition with the run's key after a RELOAD, carrying the picked values", async () => {
      await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...new Set([...document.querySelectorAll('li')]
  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)
  .map(li => li.closest('[class*="mantine-Paper-root"]')))].filter(Boolean).map(c => {
    const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
    const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
    const b = c.querySelector('button');
    return { el: c, asset: a ? norm(a.textContent) : '', label: b ? norm(b.textContent) : '',
             text: norm(c.textContent), lis: [...c.querySelectorAll('li')].map(li => norm(li.textContent)) };
  });
const isKey = (c, el) => c.asset === 'Pump 0102' && c.label === el && c.text.indexOf('Structural') !== -1;
const mine = cards.filter(c => isKey(c, 'Pump Body'));
const orig = cards.filter(c => isKey(c, 'Mounting/Support'));
return mine.length === 1 && ['Condition Found: 1', 'Condition Score: 2', 'Stress Score: 3'].every(v => mine[0].lis.includes(v));`, 30000);
    });
    await soft.run("\u2b50 SERVER: exactly ONE condition with the run's key \u2014 asked over /graphql", async () => {
      await assertFromJavascript(page, `const K = "__dd39x_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const cs = data.workStage.condition;
  return { mine: cs.filter(c => c.inspectionElementId && c.inspectionElementId.name === 'Pump Body').length,
           orig: cs.filter(c => c.inspectionElementId && c.inspectionElementId.name === 'Mounting/Support').length }; })().mine === 1); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { condition { inspectionElementId { name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    });
    await soft.run("\ud83d\uded1 GUARD + open its gear: only if exactly one condition has the run's key (the premise proved it was absent before this run's add)", async () => {
      await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...new Set([...document.querySelectorAll('li')]
  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)
  .map(li => li.closest('[class*="mantine-Paper-root"]')))].filter(Boolean).map(c => {
    const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
    const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
    const b = c.querySelector('button');
    return { el: c, asset: a ? norm(a.textContent) : '', label: b ? norm(b.textContent) : '',
             text: norm(c.textContent), lis: [...c.querySelectorAll('li')].map(li => norm(li.textContent)) };
  });
const isKey = (c, el) => c.asset === 'Pump 0102' && c.label === el && c.text.indexOf('Structural') !== -1;
const mine = cards.filter(c => isKey(c, 'Pump Body'));
const orig = cards.filter(c => isKey(c, 'Mounting/Support'));
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
    // Open the Condition tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`).click({ timeout: 30000 });
    // Let the Condition cards render
    await wait(page, 2);
    await soft.run("\u2b50 CLEANED: no condition with the run's key, and the original (Mounting/Support) is untouched \u2014 same count as before (after a reload: the cache the delete already edited)", async () => {
      await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...new Set([...document.querySelectorAll('li')]
  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)
  .map(li => li.closest('[class*="mantine-Paper-root"]')))].filter(Boolean).map(c => {
    const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
    const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
    const b = c.querySelector('button');
    return { el: c, asset: a ? norm(a.textContent) : '', label: b ? norm(b.textContent) : '',
             text: norm(c.textContent), lis: [...c.querySelectorAll('li')].map(li => norm(li.textContent)) };
  });
const isKey = (c, el) => c.asset === 'Pump 0102' && c.label === el && c.text.indexOf('Structural') !== -1;
const mine = cards.filter(c => isKey(c, 'Pump Body'));
const orig = cards.filter(c => isKey(c, 'Mounting/Support'));
const before = sessionStorage.getItem('__dd39x_origCount');
return mine.length === 0 && before !== null && orig.length === Number(before);`, 30000);
    });
    await soft.run("\u2b50 SERVER: the run's condition is gone and the original (Mounting/Support) is untouched \u2014 asked over /graphql", async () => {
      await assertFromJavascript(page, `const K = "__dd39x_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const r = (() => { const cs = data.workStage.condition;
  return { mine: cs.filter(c => c.inspectionElementId && c.inspectionElementId.name === 'Pump Body').length,
           orig: cs.filter(c => c.inspectionElementId && c.inspectionElementId.name === 'Mounting/Support').length }; })(); return r.mine === 0 && r.orig === Number(sessionStorage.getItem('__dd39x_origCount')); })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { condition { inspectionElementId { name } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
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
