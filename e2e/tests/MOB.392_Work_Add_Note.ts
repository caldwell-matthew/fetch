// Generated from Mobile/dd_tests_mobile/MOB.392_Work_Add_Note.json by to_playwright.py — do not edit by hand yet.
// MOB.392_Work_Add_Note

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';

export async function mob392(page: Page): Promise<void> {
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
    // Open the Notes tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Notes")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Let the note cards render
    await wait(page, 2);
    // BEFORE: count the note cards already here (the server-proof baseline)
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const needles = ['This is a note - DD SYNTHETIC MOBILE'];
const has = el => { const t = (el.textContent || '').replace(/\\s+/g, ' ');
  return needles.every(n => t.includes(n)); };
const cards = [...p.querySelectorAll('[class*="mantine-Paper-root"]')]
  .filter(c => has(c) && ![...c.querySelectorAll('[class*="mantine-Paper-root"]')].some(has));
sessionStorage.setItem('__dd392_before', String(cards.length));
return true;`, 30000);
    // Open the add form
    await el(page, `//button[normalize-space(.)="Add"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Focus the rich text editor
    await el(page, `//div[@contenteditable="true"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Enter the note instructions
    await el(page, `//div[@contenteditable="true"]`).fill(`This is a note - DD SYNTHETIC MOBILE`, { timeout: DEFAULT_TIMEOUT });
    // Submit the form
    await el(page, `//button[@form="work-collection-form"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the add mutation
    await wait(page, 3);
    // Test the form modal closed (durable success signal)
    await assertPageLacks(page, `Submit`, DEFAULT_TIMEOUT);
    await optional("Test the 'Item added' toast (optional: transient)", async () => {
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
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Notes")]`).click({ timeout: 30000 });
    // Let the cards render
    await wait(page, 2);
    // ⭐ SERVER PROOF: after a RELOAD there is exactly ONE more note card than before
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const needles = ['This is a note - DD SYNTHETIC MOBILE'];
const has = el => { const t = (el.textContent || '').replace(/\\s+/g, ' ');
  return needles.every(n => t.includes(n)); };
const cards = [...p.querySelectorAll('[class*="mantine-Paper-root"]')]
  .filter(c => has(c) && ![...c.querySelectorAll('[class*="mantine-Paper-root"]')].some(has));
const before = sessionStorage.getItem('__dd392_before');
return before !== null && cards.length === Number(before) + 1;`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove this test's sessionStorage key
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd392_before');
return true;`, 15000);
  }
}
