// Generated from Mobile/dd_tests_mobile/MOB.349_Work_Record_Cycling.json by to_playwright.py — do not edit by hand yet.
// MOB.349_Work_Record_Cycling

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, optional, wait } from '../support/dd';

export async function mob349(page: Page): Promise<void> {
  try {
    // Navigate to the work order list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // ROW GATE: at least one work order rendered
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 120000);
    // FIXTURE GUARD: the list holds at least TWO work orders (one cannot cycle)
    await assertFromJavascript(page, `const rows = [...document.querySelectorAll('.mantine-Paper-root')].filter(e => /Description:/.test(e.textContent||''));
return rows.length >= 2;`, 60000);
    // Tap the first work order row
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`).click({ timeout: 60000 });
    // Let the detail view render
    await wait(page, 4);
    // The work order detail rendered (tab strip)
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
    // We are on a /work/<id> route, not still on the list
    await assertFromJavascript(page, `return /\\/work\\/[^/]+$/.test(location.pathname);`, 30000);
    // Remember which work order we started on
    await assertFromJavascript(page, `sessionStorage.setItem('dd_cycle_from', location.pathname);
return !!sessionStorage.getItem('dd_cycle_from');`, 30000);
    // The BACK cycle arrow renders
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Group-root ")][.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]//button[.//*[@data-icon="circle-arrow-left" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-left ")]]`, 30000);
    // The FORWARD cycle arrow renders
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Group-root ")][.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]//button[.//*[@data-icon="circle-arrow-right" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-right ")]]`, 30000);
    // Cycle FORWARD to the next work order
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Group-root ")][.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]//button[.//*[@data-icon="circle-arrow-right" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-right ")]])[1]`).click({ timeout: 30000 });
    // Let the next work order render
    await wait(page, 4);
    // CYCLED: the route now points at a DIFFERENT work order
    await assertFromJavascript(page, `const from = sessionStorage.getItem('dd_cycle_from');
if (!from) return false;
return /\\/work\\/[^/]+$/.test(location.pathname) && location.pathname !== from;`, 60000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Cycle BACK again
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Group-root ")][.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]//button[.//*[@data-icon="circle-arrow-left" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-left ")]])[1]`).click({ timeout: 30000 });
    // Let the original work order render
    await wait(page, 4);
    // RESTORED: the route points at the work order we started on
    await assertFromJavascript(page, `const from = sessionStorage.getItem('dd_cycle_from');
if (!from) return false;
return location.pathname === from;`, 60000);
    await optional("Tidy up the stash", async () => {
      await assertFromJavascript(page, `sessionStorage.removeItem('dd_cycle_from');
return true;`, 15000);
    });
  }
}
