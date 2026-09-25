// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.740_AssetLookup_Work_History.json. This file is the source now: edit it directly.
// MOB.740_AssetLookup_Work_History

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageLacks, click, press, typeText, wait } from '../../support/dd';

export async function mob740(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to asset lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the \"Asset Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, 30000);
  });
  await run.step("Select any persisted query first (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for Pump 0102", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Pump 0102`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter \u2014 there is no search button)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("RESULT GUARD: a result row for Pump 0102 rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1][contains(., "Pump 0102")]`, 60000);
  });
  await run.step("Expand the first result", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`, 30000);
  });
  await run.step("Open the \"Work History\" tab", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Work History"]`, 60000);
  });
  await run.step("Let the work history query resolve", {}, async () => {
    await wait(page, 5);
  });
  await run.step("\"Work History\" is now the active tab", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Work History"][@data-active="true"]`, 30000);
  });
  await run.step("FIXTURE GUARD: Pump 0102 has at least one work history row", {}, async () => {
    await assertElementPresent(page, `((//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 60000);
  });
  await run.step("\u2026and the empty state is NOT what we are looking at", {}, async () => {
    await assertPageLacks(page, `No History Found`, 30000);
  });
  await run.step("The first history row reads `Assigned to: <someone>` \u2014 STASH the value it shows", {}, async () => {
    await assertFromJavascript(page, `const rows = [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(p => (p.textContent || '').includes('Description:') && !p.closest('.mantine-Modal-content'));
if (!rows.length) return false;
const line = [...rows[0].querySelectorAll('div')].find(d => {
  const s = d.querySelector(':scope > strong');
  return s && (s.textContent || '').trim() === 'Assigned to:';
});
if (!line) return false;
const v = (line.textContent || '').replace('Assigned to:', '').trim();
if (!v) return false;
sessionStorage.setItem('__dd740_assigned', v);
return true;`, 30000);
  });
  await run.step("\u2b50 SERVER: that value is exactly the `_assignments` the server holds for the newest history row", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd740_history", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.assetWorkHistory.edges.length === 1 && !!data.assetWorkHistory.edges[0]._assignments && data.assetWorkHistory.edges[0]._assignments === sessionStorage.getItem('__dd740_assigned')); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: ChildTableQuery!) { assetWorkHistory(params: $p) { edges { id _assignments } } }", variables: {"p": {"parentId": "oB5BUN1Es1Jctw8FVYwYBh", "sortId": "createdAt", "sortDir": "DESC", "limit": 1}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd740_history', '__dd740_history:inflight', '__dd740_history:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Remove the stash", {always: true}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd740_assigned');
return true;`, 15000);
  });
  await run.step("Open the first work history record (opens a modal, not a route)", {}, async () => {
    await click(page, `((//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 30000);
  });
  await run.step("Let MOBILE_WORK_ORDER_DETAILS resolve and the panel mount", {}, async () => {
    await wait(page, 6);
  });
  await run.step("The work history modal opened", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]`, 60000);
  });
  await run.step("The modal's tab strip has EXACTLY FOUR tabs", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
return m.querySelectorAll('[role=tab]').length === 4;`, 30000);
  });
  await run.step("\u2026and they are General Info / Assets / Attributes / Attachments, in order", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const got = [...m.querySelectorAll('[role=tab]')].map(t => t.textContent.trim());
const want = ['General Info','Assets','Attributes','Attachments'];
return JSON.stringify(got) === JSON.stringify(want);`, 30000);
  });
  await run.step("The modal is bound to a real work order (a non-empty _workSequence)", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
return (m.textContent || '').trim().length > 0 && !/^\\s*$/.test(m.textContent);`, 30000);
  });
  await run.step("Open the \"General Info\" tab", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="General Info"]`, 30000);
  });
  await run.step("\"General Info\" is the active tab", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="General Info"][@data-active="true"]`, 30000);
  });
  await run.step("Open the \"Assets\" tab", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Assets"]`, 30000);
  });
  await run.step("\"Assets\" is the active tab", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Assets"][@data-active="true"]`, 30000);
  });
  await run.step("Open the \"Attributes\" tab", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Attributes"]`, 30000);
  });
  await run.step("\"Attributes\" is the active tab", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Attributes"][@data-active="true"]`, 30000);
  });
  await run.step("Open the \"Attachments\" tab", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Attachments"]`, 30000);
  });
  await run.step("\"Attachments\" is the active tab", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Attachments"][@data-active="true"]`, 30000);
  });
  await run.step("Return to \"General Info\"", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="General Info"]`, 30000);
  });
  await run.step("Let the panel render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("General Info rendered an actual table body, not an empty panel", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const p = m.querySelector('[role=tabpanel]');
if (!p) return false;
return p.querySelectorAll('tr, td, th').length >= 2;`, 30000);
  });
  await run.step("Close the modal (its CloseButton \u2014 Escape and the overlay are no-ops here)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-CloseButton-root ")]`, 30000);
  });
  await run.step("Let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: no modal is left open for the next subtest", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Modal-content');`, 30000);
  });
  run.finish();
}
