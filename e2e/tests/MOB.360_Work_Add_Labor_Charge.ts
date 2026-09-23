// Generated from Mobile/dd_tests_mobile/MOB.360_Work_Add_Labor_Charge.json by to_playwright.py — do not edit by hand yet.
// MOB.360_Work_Add_Labor_Charge

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';

export async function mob360(page: Page): Promise<void> {
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
    // Open the Labor tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Labor")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Let the Labor cards render
    await wait(page, 2);
    // BEFORE: count the labor charge cards already here (the server-proof baseline)
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const needles = ['Account Executive', 'Charged for'];
const has = el => { const t = (el.textContent || '').replace(/\\s+/g, ' ');
  return needles.every(n => t.includes(n)); };
const cards = [...p.querySelectorAll('[class*="mantine-Paper-root"]')]
  .filter(c => has(c) && ![...c.querySelectorAll('[class*="mantine-Paper-root"]')].some(has));
sessionStorage.setItem('__dd35x_before', String(cards.length));
return true;`, 30000);
    // Open the add-charge form
    await el(page, `//button[normalize-space(.)="Add"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Focus the user lookup
    await el(page, `//*[@id="userId"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Type into the user lookup to load options
    await el(page, `//*[@id="userId"]`).fill(`Dev Eloper`, { timeout: DEFAULT_TIMEOUT });
    // Wait for user options
    await wait(page, 2);
    // Pick the Dev Eloper user option
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Dev Eloper")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Focus the craft lookup
    await el(page, `//*[@id="craftId"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for craft options
    await wait(page, 2);
    // Pick the Account Executive craft option
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Account Executive")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Focus the labor type lookup
    await el(page, `//*[@id="laborTypeId"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for labor type options
    await wait(page, 2);
    // Pick the Regular labor type option
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Regular")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Enter actual hours (schema field qty)
    await el(page, `//*[@id="qty"]`).fill(`1`, { timeout: DEFAULT_TIMEOUT });
    // Submit the charge
    await el(page, `//button[@form="work-collection-form"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the add mutation
    await wait(page, 3);
    // Test the charge modal closed (the form accepted the input — NOT a server answer, bugs §40)
    await assertPageLacks(page, `Submit`, DEFAULT_TIMEOUT);
    await optional("Test the item-added toast (optional: transient)", async () => {
      await assertPageContains(page, `Item added`, DEFAULT_TIMEOUT);
    });
    // Let the server answer before reloading
    await wait(page, 3);
    // Navigate to the fixture work order (reload: the server's answer)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Reopen the tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Labor")]`).click({ timeout: 30000 });
    // Let the cards render
    await wait(page, 2);
    // ⭐ SERVER PROOF: after a RELOAD there is exactly ONE more labor charge card than before
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const needles = ['Account Executive', 'Charged for'];
const has = el => { const t = (el.textContent || '').replace(/\\s+/g, ' ');
  return needles.every(n => t.includes(n)); };
const cards = [...p.querySelectorAll('[class*="mantine-Paper-root"]')]
  .filter(c => has(c) && ![...c.querySelectorAll('[class*="mantine-Paper-root"]')].some(has));
const before = sessionStorage.getItem('__dd35x_before');
return before !== null && cards.length === Number(before) + 1;`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove this test's sessionStorage key
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd35x_before');
return true;`, 15000);
  }
}
