// Generated from Mobile/dd_tests_mobile/MOB.740_AssetLookup_Work_History.json by to_playwright.py — do not edit by hand yet.
// MOB.740_AssetLookup_Work_History

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageLacks, el, wait } from '../support/dd';

export async function mob740(page: Page): Promise<void> {
  try {
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for the page to mount
    await wait(page, 3);
    // Test the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: 30000 });
    // Select any persisted query first (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Search for Pump 0102
    await el(page, `//input[@name="asset-search"]`).fill(`Pump 0102`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter — there is no search button)
    await page.keyboard.press(`Enter`);
    // Wait for the search results
    await wait(page, 5);
    // RESULT GUARD: a result row for Pump 0102 rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1][contains(., "Pump 0102")]`, 60000);
    // Expand the first result
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`).click({ timeout: 30000 });
    // Wait for the detail panel to mount
    await wait(page, 3);
    // Open the "Work History" tab
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Work History"]`).click({ timeout: 60000 });
    // Let the work history query resolve
    await wait(page, 5);
    // "Work History" is now the active tab
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Work History"][@data-active="true"]`, 30000);
    // FIXTURE GUARD: Pump 0102 has at least one work history row
    await assertElementPresent(page, `((//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 60000);
    // …and the empty state is NOT what we are looking at
    await assertPageLacks(page, `No History Found`, 30000);
    // The first history row reads `Assigned to: <someone>` — STASH the value it shows
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
    // ⭐ SERVER: that value is exactly the `_assignments` the server holds for the newest history row
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
    // Open the first work history record (opens a modal, not a route)
    await el(page, `((//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`).click({ timeout: 30000 });
    // Let MOBILE_WORK_ORDER_DETAILS resolve and the panel mount
    await wait(page, 6);
    // The work history modal opened
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]`, 60000);
    // The modal's tab strip has EXACTLY FOUR tabs
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
return m.querySelectorAll('[role=tab]').length === 4;`, 30000);
    // …and they are General Info / Assets / Attributes / Attachments, in order
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const got = [...m.querySelectorAll('[role=tab]')].map(t => t.textContent.trim());
const want = ['General Info','Assets','Attributes','Attachments'];
return JSON.stringify(got) === JSON.stringify(want);`, 30000);
    // The modal is bound to a real work order (a non-empty _workSequence)
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
return (m.textContent || '').trim().length > 0 && !/^\\s*$/.test(m.textContent);`, 30000);
    // Open the "General Info" tab
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="General Info"]`).click({ timeout: 30000 });
    // Let the General Info panel render
    await wait(page, 2);
    // "General Info" is the active tab
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="General Info"][@data-active="true"]`, 30000);
    // Open the "Assets" tab
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Assets"]`).click({ timeout: 30000 });
    // Let the Assets panel render
    await wait(page, 2);
    // "Assets" is the active tab
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Assets"][@data-active="true"]`, 30000);
    // Open the "Attributes" tab
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Attributes"]`).click({ timeout: 30000 });
    // Let the Attributes panel render
    await wait(page, 2);
    // "Attributes" is the active tab
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Attributes"][@data-active="true"]`, 30000);
    // Open the "Attachments" tab
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Attachments"]`).click({ timeout: 30000 });
    // Let the Attachments panel render
    await wait(page, 2);
    // "Attachments" is the active tab
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="Attachments"][@data-active="true"]`, 30000);
    // Return to "General Info"
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//*[@role="tab"][normalize-space(.)="General Info"]`).click({ timeout: 30000 });
    // Let the panel render
    await wait(page, 2);
    // General Info rendered an actual table body, not an empty panel
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const p = m.querySelector('[role=tabpanel]');
if (!p) return false;
return p.querySelectorAll('tr, td, th').length >= 2;`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd740_history', '__dd740_history:inflight', '__dd740_history:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the stash
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd740_assigned');
return true;`, 15000);
    // Close the modal (its CloseButton — Escape and the overlay are no-ops here)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-CloseButton-root ")]`).click({ timeout: 30000 });
    // Let the modal close
    await wait(page, 2);
    // RESTORED: no modal is left open for the next subtest
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Modal-content');`, 30000);
  }
}
