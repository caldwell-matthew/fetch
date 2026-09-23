// Generated from Mobile/dd_tests_mobile/MOB.388_Work_Attribute_Edit.json by to_playwright.py — do not edit by hand yet.
// MOB.388_Work_Attribute_Edit

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob388(page: Page): Promise<void> {
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
    // Open the Attributes tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Attributes")]`).click({ timeout: 30000 });
    // Wait for the Attributes panel
    await wait(page, 3);
    // FIELD GUARD: the "Heater Hz" attribute input is on this work order
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Heater Hz")]]//input`, 30000);
    // Focus the Heater Hz field
    await el(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Heater Hz")]]//input`).click({ timeout: DEFAULT_TIMEOUT });
    // Select the existing text (typeText APPENDS without this)
    await page.keyboard.press(`Control+a`);
    // Type the Heater Hz value
    await el(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Heater Hz")]]//input`).fill(`DD SYNTHETIC EDIT ${RUNID}`, { timeout: DEFAULT_TIMEOUT });
    // Submit the attributes form
    await el(page, `//button[@form="mobile-attrib"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Brief wait for the toast to appear
    await wait(page, 2);
    await optional("Attributes updated toast (optional: transient)", async () => {
      await assertPageContains(page, `Attributes updated successfully!`, DEFAULT_TIMEOUT);
    });
    // Wait for the attribute mutation
    await wait(page, 5);
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
    // Open the Attributes tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Attributes")]`).click({ timeout: 30000 });
    // Wait for the Attributes panel
    await wait(page, 3);
    // FIELD GUARD: the "Heater Hz" attribute input is on this work order
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Heater Hz")]]//input`, 30000);
    // PROOF: after a reload "Heater Hz" is no longer the baseline
    await assertFromJavascript(page, `const g = [...document.querySelectorAll('div.form-group')].find(d => {
  const l = d.querySelector('label');
  return l && l.textContent.trim().indexOf('Heater Hz') === 0;
});
if (!g) return false;
const el = g.querySelector('input');
if (!el) return false;
return el.value.trim() !== '7';`, DEFAULT_TIMEOUT);
    // Focus the Heater Hz field
    await el(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Heater Hz")]]//input`).click({ timeout: DEFAULT_TIMEOUT });
    // Select the existing text (typeText APPENDS without this)
    await page.keyboard.press(`Control+a`);
    // Type the Heater Hz value
    await el(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Heater Hz")]]//input`).fill(`7`, { timeout: DEFAULT_TIMEOUT });
    // Submit the restore
    await el(page, `//button[@form="mobile-attrib"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the restore mutation
    await wait(page, 6);
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
    // Open the Attributes tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Attributes")]`).click({ timeout: 30000 });
    // Wait for the Attributes panel
    await wait(page, 3);
    // FIELD GUARD: the "Heater Hz" attribute input is on this work order
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Heater Hz")]]//input`, 30000);
    // RESTORED: "Heater Hz" is exactly "7" again
    await assertFromJavascript(page, `const g = [...document.querySelectorAll('div.form-group')].find(d => {
  const l = d.querySelector('label');
  return l && l.textContent.trim().indexOf('Heater Hz') === 0;
});
if (!g) return false;
const el = g.querySelector('input');
if (!el) return false;
return el.value.trim() === '7';`, DEFAULT_TIMEOUT);
}
