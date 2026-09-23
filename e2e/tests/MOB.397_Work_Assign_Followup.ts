// Generated from Mobile/dd_tests_mobile/MOB.397_Work_Assign_Followup.json by to_playwright.py — do not edit by hand yet.
// MOB.397_Work_Assign_Followup

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob397(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
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
    // Open the "Assets" tab
    await el(page, `//*[@role="tab"][normalize-space(.)="Assets"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the panel
    await wait(page, 3);
    // The "Assets" tab is active
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Assets"][@data-active]`, DEFAULT_TIMEOUT);
    // §45 GUARD: open `Add Asset` — its picker is what loads the Asset schema
    await el(page, `//button[normalize-space(.)="Add Asset"]`).click({ timeout: 30000 });
    // §45 GUARD: choose `Add Existing Asset` (mounts `AssetLookup` → `useQuery(GET_SCHEMA Asset)`)
    await el(page, `//label[contains(concat(" ", normalize-space(@class), " "), " mantine-SegmentedControl-label ")][normalize-space(.)="Add Existing Asset"]`).click({ timeout: 30000 });
    // §45 GUARD: the picker's search box mounted
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@name="asset-search"]`, 60000);
    // §45 GUARD: the picker finished its first load — no LoadingOverlay, and rows or `No Results`
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')].find(x => x.querySelector('input[name="asset-search"]'));
if (!m) return false;
if (m.querySelector('.mantine-LoadingOverlay-overlay, .mantine-LoadingOverlay-root')) return false;
return m.querySelectorAll('.mantine-Accordion-item').length > 0 || /No Results/.test(m.textContent || '');`, 60000);
    // §45 GUARD: close the picker UNUSED — nothing picked, nothing written
    await page.keyboard.press(`Escape`);
    // §45 GUARD: the picker is closed
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')].find(x => x.querySelector('input[name="asset-search"]'));
return !m;`, 20000);
    // §45 GATE: the Asset schema is cached — every asset row renders its geolocate control (`AssetGeolocate` renders null without it), so expanding a row cannot crash the page
    await assertFromJavascript(page, `const t = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
if (!t || (t.textContent || '').trim() !== 'Assets') return false;
const p = t.getAttribute('aria-controls') ? document.getElementById(t.getAttribute('aria-controls')) : null;
if (!p) return false;
const rows = [...p.querySelectorAll('.mantine-Accordion-item')];
return rows.length > 0 && rows.every(r => !!r.querySelector('[data-icon="location-crosshairs"]'));`, 60000);
    // Expand the first asset row (the gear menu lives in the panel)
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`).click({ timeout: 30000 });
    // Wait for the panel to expand
    await wait(page, 3);
    // A collection item with a gear menu exists
    await assertElementPresent(page, `//button[@aria-label="Menu"]`, 30000);
    // Open the first item's gear menu
    await el(page, `(//button[@aria-label="Menu"])[1]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the dropdown
    await wait(page, 2);
    // Click "Assign Follow-up Work" (EXACT text — this menu also has "Delete Item")
    await el(page, `//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Assign Follow-up Work"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the follow-up modal
    await wait(page, 3);
    // The follow-up modal opened
    await assertPageContains(page, `Create Follow-up Work`, DEFAULT_TIMEOUT);
    // Turn OFF "Filter Workflows By Asset" (both default ON and hide the workflow)
    await el(page, `//label[@for="filterWorkflowByAsset"]`).click({ timeout: 30000 });
    // Turn OFF "Exclude PM Workflows" (both default ON and hide the workflow)
    await el(page, `//label[@for="filterWorkflowByPMField"]`).click({ timeout: 30000 });
    // Let the workflow list re-query unfiltered
    await wait(page, 3);
    // Both workflow filters are now OFF
    await assertFromJavascript(page, `
const ids = ['filterWorkflowByAsset', 'filterWorkflowByPMField'];
return ids.every(id => {
  const el = document.getElementById(id);
  return el && el.checked === false;
});
`, DEFAULT_TIMEOUT);
    // Focus the Workflow lookup
    await el(page, `//*[@id="workflowTitleId"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Search for the Datadog Test workflow
    await el(page, `//*[@id="workflowTitleId"]`).fill(`Datadog Test`, { timeout: DEFAULT_TIMEOUT });
    // Wait for workflow options
    await wait(page, 3);
    // Pick the "Datadog Test" workflow
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Datadog Test")]`).click({ timeout: 30000 });
    // Type the synthetic marker into Problem Description
    await el(page, `//*[@id="problemDesc"]`).fill(`DD SYNTHETIC MOBILE ${RUNID}`, { timeout: DEFAULT_TIMEOUT });
    // Click "Create Work Order"
    await el(page, `//button[normalize-space(.)="Create Work Order"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Brief wait for the toast
    await wait(page, 2);
    await optional("Success toast (optional: transient)", async () => {
      await assertPageContains(page, `Work order successfully created!`, DEFAULT_TIMEOUT);
    });
    // Wait for the create mutation
    await wait(page, 5);
    // PROOF: the follow-up modal closed
    await assertPageLacks(page, `Create Follow-up Work`, DEFAULT_TIMEOUT);
}
