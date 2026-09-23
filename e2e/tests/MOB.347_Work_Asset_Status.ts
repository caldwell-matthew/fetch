// Generated from Mobile/dd_tests_mobile/MOB.347_Work_Asset_Status.json by to_playwright.py — do not edit by hand yet.
// MOB.347_Work_Asset_Status

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, el, optional, wait } from '../support/dd';

export async function mob347(page: Page): Promise<void> {
  try {
    // Navigate to /work — warm the work lookup cache
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Let the lookup prefetch run
    await wait(page, 30);
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 3);
    // GATE 1/2: the /work/:id route mounted
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, 60000);
    // GATE 2/2: the detail data arrived (tab strip)
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
    // Open the "Assets" tab
    await el(page, `//*[@role="tab"][normalize-space(.)="Assets"]`).click({ timeout: 30000 });
    // Wait for the asset list
    await wait(page, 3);
    // The "Assets" tab is now active
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Assets"][@data-active="true"]`, 30000);
    // FIXTURE GUARD: an asset row shows "Progress:" — showAssetStatus is ON
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Text-root ")][starts-with(normalize-space(.), "Progress:")]`, 60000);
    // The progress badge shows one of the five real status labels
    await assertFromJavascript(page, `const ok = ['No Status','Active','Completed','Not Completed','Canceled'];
const els = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && /^(No Status|Active|Completed|Not Completed|Canceled)$/.test((e.textContent||'').trim()));
return els.length > 0;`, 30000);
    // Open the asset status menu
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Text-root ")][starts-with(normalize-space(.), "Progress:")])[1]`).click({ timeout: 30000 });
    // Let the menu open
    await wait(page, 2);
    // The menu offers "Mark as ..." options (NOT clicked — they write instantly)
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')].filter(e => /^Mark as /.test((e.textContent||'').trim()));
return items.length >= 1;`, 30000);
    // At most four options are offered — the current status is filtered out
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')].filter(e => /^Mark as /.test((e.textContent||'').trim()));
return items.length <= 4;`, 30000);
    // Open the asset status FORM via the comment icon
    await el(page, `(//*[@data-icon="comment" or contains(concat(" ", normalize-space(@class), " "), " fa-comment ")])[1]`).click({ timeout: 30000 });
    // Let the modal open
    await wait(page, 2);
    // The asset status form mounted
    await assertElementPresent(page, `//form[@id="asset-status-form"]`, 60000);
    // It has the Asset Status field
    await assertPageContains(page, `Asset Status`, 30000);
    // It has the Asset Sequence field
    await assertPageContains(page, `Asset Sequence`, 30000);
    // It has the Comment field
    await assertPageContains(page, `Comment`, 30000);
    // TRAP 8: Submit is type="button" (inert) while the form is untouched
    await assertFromJavascript(page, `const f = document.getElementById('asset-status-form');
if (!f) return false;
const b = [...document.querySelectorAll('button')].find(x => (x.getAttribute('form') === 'asset-status-form') || /^Submit$/.test((x.textContent||'').trim()));
if (!b) return false;
return b.getAttribute('type') === 'button';`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Close the menu without choosing anything
    await page.keyboard.press(`Escape`);
    // Let the menu close
    await wait(page, 1);
    // GUARD: no status was applied — the menu is closed and nothing was clicked
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')].filter(e => /^Mark as /.test((e.textContent||'').trim()));
return items.length === 0;`, 30000);
    await optional("Dismiss via the modal's close button", async () => {
      await el(page, `//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ") or @aria-label="Close"]`).click({ timeout: 15000 });
    });
    // Let the modal react
    await wait(page, 1);
    await optional("Fallback: dismiss by clicking the overlay", async () => {
      await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-overlay ")]`).click({ timeout: 15000 });
    });
    // Let the modal close
    await wait(page, 2);
    // The form was DISMISSED and the page is still alive (nothing was submitted — the form was never valid)
    await assertFromJavascript(page, `if (!document.querySelectorAll('[role=tab]').length) return false;
return !document.getElementById('asset-status-form');`, 30000);
  }
}
