// Generated from legacy/Mobile/dd_tests_mobile/MOB.397_Work_Assign_Followup.json by to_playwright.py — do not edit by hand yet.
// MOB.397_Work_Assign_Followup

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob397(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
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
  await run.step("Open the \"Assets\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][normalize-space(.)="Assets"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the panel", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Assets\" tab is active", {}, async () => {
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Assets"][@data-active]`, DEFAULT_TIMEOUT);
  });
  await run.step("\u00a745 GUARD: open `Add Asset` \u2014 its picker is what loads the Asset schema", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add Asset"]`, 30000);
  });
  await run.step("\u00a745 GUARD: choose `Add Existing Asset` (mounts `AssetLookup` \u2192 `useQuery(GET_SCHEMA Asset)`)", {}, async () => {
    await click(page, `//label[contains(concat(" ", normalize-space(@class), " "), " mantine-SegmentedControl-label ")][normalize-space(.)="Add Existing Asset"]`, 30000);
  });
  await run.step("\u00a745 GUARD: the picker's search box mounted", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@name="asset-search"]`, 60000);
  });
  await run.step("\u00a745 GUARD: the picker finished its first load \u2014 no LoadingOverlay, and rows or `No Results`", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')].find(x => x.querySelector('input[name="asset-search"]'));
if (!m) return false;
if (m.querySelector('.mantine-LoadingOverlay-overlay, .mantine-LoadingOverlay-root')) return false;
return m.querySelectorAll('.mantine-Accordion-item').length > 0 || /No Results/.test(m.textContent || '');`, 60000);
  });
  await run.step("\u00a745 GUARD: close the picker UNUSED \u2014 nothing picked, nothing written", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("\u00a745 GUARD: the picker is closed", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')].find(x => x.querySelector('input[name="asset-search"]'));
return !m;`, 20000);
  });
  await run.step("\u00a745 GATE: the Asset schema is cached \u2014 every asset row renders its geolocate control (`AssetGeolocate` renders null without it), so expanding a row cannot crash the page", {}, async () => {
    await assertFromJavascript(page, `const t = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
if (!t || (t.textContent || '').trim() !== 'Assets') return false;
const p = t.getAttribute('aria-controls') ? document.getElementById(t.getAttribute('aria-controls')) : null;
if (!p) return false;
const rows = [...p.querySelectorAll('.mantine-Accordion-item')];
return rows.length > 0 && rows.every(r => !!r.querySelector('[data-icon="location-crosshairs"]'));`, 60000);
  });
  await run.step("Expand the first asset row (the gear menu lives in the panel)", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`, 30000);
  });
  await run.step("Wait for the panel to expand", {}, async () => {
    await wait(page, 3);
  });
  await run.step("A collection item with a gear menu exists", {}, async () => {
    await assertElementPresent(page, `//button[@aria-label="Menu"]`, 30000);
  });
  await run.step("Open the first item's gear menu", {}, async () => {
    await click(page, `(//button[@aria-label="Menu"])[1]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the dropdown", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Click \"Assign Follow-up Work\" (EXACT text \u2014 this menu also has \"Delete Item\")", {}, async () => {
    await click(page, `//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Assign Follow-up Work"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the follow-up modal", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The follow-up modal opened", {}, async () => {
    await assertPageContains(page, `Create Follow-up Work`, DEFAULT_TIMEOUT);
  });
  await run.step("Turn OFF \"Filter Workflows By Asset\" (both default ON and hide the workflow)", {}, async () => {
    await click(page, `//label[@for="filterWorkflowByAsset"]`, 30000);
  });
  await run.step("Turn OFF \"Exclude PM Workflows\" (both default ON and hide the workflow)", {}, async () => {
    await click(page, `//label[@for="filterWorkflowByPMField"]`, 30000);
  });
  await run.step("Let the workflow list re-query unfiltered", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Both workflow filters are now OFF", {}, async () => {
    await assertFromJavascript(page, `
const ids = ['filterWorkflowByAsset', 'filterWorkflowByPMField'];
return ids.every(id => {
  const el = document.getElementById(id);
  return el && el.checked === false;
});
`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the Workflow lookup", {}, async () => {
    await click(page, `//*[@id="workflowTitleId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Search for the Datadog Test workflow", {}, async () => {
    await typeText(page, `//*[@id="workflowTitleId"]`, `Datadog Test`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for workflow options", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Pick the \"Datadog Test\" workflow", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Datadog Test")]`, 30000);
  });
  await run.step("Type the synthetic marker into Problem Description", {}, async () => {
    await typeText(page, `//*[@id="problemDesc"]`, `DD SYNTHETIC MOBILE ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Click \"Create Work Order\"", {}, async () => {
    await click(page, `//button[normalize-space(.)="Create Work Order"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Brief wait for the toast", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Success toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Work order successfully created!`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the create mutation", {}, async () => {
    await wait(page, 5);
  });
  await run.step("PROOF: the follow-up modal closed", {}, async () => {
    await assertPageLacks(page, `Create Follow-up Work`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
