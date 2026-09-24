// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.135_Work_Form_Signature_Pad.json. This file is the source now: edit it directly.
// MOB.135_Work_Form_Signature_Pad

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageLacks, click, wait } from '../../support/dd';

export async function mob135(page: Page): Promise<void> {
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
  await run.step("Open the `\ud83d\udd0e Inspection` form card \u2014 by NAME, not position", {}, async () => {
    await click(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")][contains(normalize-space(.), "Inspection")]])[1]`, 60000);
  });
  await run.step("Let the form page render", {}, async () => {
    await wait(page, 4);
  });
  await run.step("ROUTE: we are on /work/<id>/form/<id>", {}, async () => {
    await assertFromJavascript(page, `return /\\/work\\/[^/]+\\/form\\/[^/]+$/.test(location.pathname);`, 60000);
  });
  await run.step("\u2b50 The DESKTOP GRID mounted (`#apm-dv-tabpanel`) \u2014 this 768-wide tablet takes the wide branch (`screen.availWidth >= 750`), which is where the new signature cell lives", {}, async () => {
    await assertFromJavascript(page, `return !!document.getElementById('apm-dv-tabpanel') && window.screen.availWidth >= 750;`, 60000);
  });
  await run.step("PREMISE (server): the Inspection form holds ONE signature field, `Add a signature label`, UNSIGNED", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd135_sig", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((w => { const f = (w.forms || []).filter(f => (f.name || '').indexOf('Inspection') !== -1);
  if (f.length !== 1) return false;
  const s = f[0].widgets.filter(x => x.__typename === 'WorkflowFormSignature');
  return s.length === 1 && s[0].label === 'Add a signature label' && !s[0].signature; })(data.workStage)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { forms { name widgets { __typename ... on WorkflowFormSignature { id label signature } } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd135_sig', '__dd135_sig:inflight', '__dd135_sig:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\u2b50 The grid draws it with the MOBILE control: exactly one `.mobile-signature-cell`, labelled `Add a signature label`, its button reading `Add Signature`, no signature image yet", {}, async () => {
    await assertFromJavascript(page, `const cells = [...document.querySelectorAll('#apm-dv-tabpanel .mobile-signature-cell')];
const cell = cells.length === 1 ? cells[0] : null;
const btn = cell && [...cell.querySelectorAll('button')].find(b => b.getAttribute('title') === 'Add Signature');
return !!btn && (btn.textContent || '').trim() === 'Add Signature'
  && (cell.textContent || '').includes('Add a signature label')
  && !cell.querySelector('[data-testid="signature-image"]');`, 45000);
  });
  await run.step("Open the pad (`Add Signature`)", {}, async () => {
    await assertFromJavascript(page, `const cells = [...document.querySelectorAll('#apm-dv-tabpanel .mobile-signature-cell')];
const cell = cells.length === 1 ? cells[0] : null;
const btn = cell && [...cell.querySelectorAll('button')].find(b => b.getAttribute('title') === 'Add Signature');
if (!btn) return false;
btn.click();
return true;`, 20000);
  });
  await run.step("\u2b50 The pad opened in a modal \u2014 a canvas and its `Clear` control (NOT clicked: Clear would queue a null signature that the close then saves)", {}, async () => {
    await assertFromJavascript(page, `const pad = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(m => m.querySelector('canvas') && m.querySelector('[title="Clear"]'));
return !!pad;`, 30000);
  });
  await run.step("Close the pad WITHOUT drawing \u2014 its modal's close button", {always: true}, async () => {
    await assertFromJavascript(page, `const pad = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(m => m.querySelector('canvas') && m.querySelector('[title="Clear"]'));
const c = pad && pad.querySelector('.mantine-Modal-close');
if (!c) return false;
c.click();
return true;`, 20000);
  });
  await run.step("The pad is gone", {always: true}, async () => {
    await assertFromJavascript(page, `const pad = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(m => m.querySelector('canvas') && m.querySelector('[title="Clear"]'));
return !pad;`, 20000);
  });
  await run.step("Give a (wrong) save on close time to reach the server", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 SERVER: closing an untouched pad saved NOTHING \u2014 the signature is still null (`MobileSignatureField` saves only a pending stroke, on close)", {always: true}, async () => {
    await assertFromJavascript(page, `const K = "__dd135_sig", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((w => { const f = (w.forms || []).filter(f => (f.name || '').indexOf('Inspection') !== -1);
  if (f.length !== 1) return false;
  const s = f[0].widgets.filter(x => x.__typename === 'WorkflowFormSignature');
  return s.length === 1 && s[0].label === 'Add a signature label' && !s[0].signature; })(data.workStage)); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { forms { name widgets { __typename ... on WorkflowFormSignature { id label signature } } } } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd135_sig', '__dd135_sig:inflight', '__dd135_sig:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\u2026and the cell still reads `Add Signature`, with no image", {always: true}, async () => {
    await assertFromJavascript(page, `const cells = [...document.querySelectorAll('#apm-dv-tabpanel .mobile-signature-cell')];
const cell = cells.length === 1 ? cells[0] : null;
const btn = cell && [...cell.querySelectorAll('button')].find(b => b.getAttribute('title') === 'Add Signature');
return !!btn && !cell.querySelector('[data-testid="signature-image"]');`, 20000);
  });
  run.finish();
}
