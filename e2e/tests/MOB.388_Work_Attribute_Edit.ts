// Generated from legacy/Mobile/dd_tests_mobile/MOB.388_Work_Attribute_Edit.json by to_playwright.py — do not edit by hand yet.
// MOB.388_Work_Attribute_Edit

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob388(page: Page): Promise<void> {
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
  await run.step("Open the Attributes tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Attributes")]`, 30000);
  });
  await run.step("Wait for the Attributes panel", {}, async () => {
    await wait(page, 3);
  });
  await run.step("FIELD GUARD: the \"Heater Hz\" attribute input is on this work order", {}, async () => {
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Heater Hz")]]//input`, 30000);
  });
  await run.step("Focus the Heater Hz field", {}, async () => {
    await click(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Heater Hz")]]//input`, DEFAULT_TIMEOUT);
  });
  await run.step("Select the existing text (typeText APPENDS without this)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type the Heater Hz value", {}, async () => {
    await typeText(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Heater Hz")]]//input`, `DD SYNTHETIC EDIT ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the attributes form", {}, async () => {
    await click(page, `//button[@form="mobile-attrib"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Brief wait for the toast to appear", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Attributes updated toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Attributes updated successfully!`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the attribute mutation", {}, async () => {
    await wait(page, 5);
  });
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
  await run.step("Open the Attributes tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Attributes")]`, 30000);
  });
  await run.step("Wait for the Attributes panel", {}, async () => {
    await wait(page, 3);
  });
  await run.step("FIELD GUARD: the \"Heater Hz\" attribute input is on this work order", {}, async () => {
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Heater Hz")]]//input`, 30000);
  });
  await run.step("PROOF: after a reload \"Heater Hz\" is no longer the baseline", {}, async () => {
    await assertFromJavascript(page, `const g = [...document.querySelectorAll('div.form-group')].find(d => {
  const l = d.querySelector('label');
  return l && l.textContent.trim().indexOf('Heater Hz') === 0;
});
if (!g) return false;
const el = g.querySelector('input');
if (!el) return false;
return el.value.trim() !== '7';`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the Heater Hz field", {}, async () => {
    await click(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Heater Hz")]]//input`, DEFAULT_TIMEOUT);
  });
  await run.step("Select the existing text (typeText APPENDS without this)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type the Heater Hz value", {}, async () => {
    await typeText(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Heater Hz")]]//input`, `7`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the restore", {}, async () => {
    await click(page, `//button[@form="mobile-attrib"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the restore mutation", {}, async () => {
    await wait(page, 6);
  });
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
  await run.step("Open the Attributes tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Attributes")]`, 30000);
  });
  await run.step("Wait for the Attributes panel", {}, async () => {
    await wait(page, 3);
  });
  await run.step("FIELD GUARD: the \"Heater Hz\" attribute input is on this work order", {}, async () => {
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Heater Hz")]]//input`, 30000);
  });
  await run.step("RESTORED: \"Heater Hz\" is exactly \"7\" again", {}, async () => {
    await assertFromJavascript(page, `const g = [...document.querySelectorAll('div.form-group')].find(d => {
  const l = d.querySelector('label');
  return l && l.textContent.trim().indexOf('Heater Hz') === 0;
});
if (!g) return false;
const el = g.querySelector('input');
if (!el) return false;
return el.value.trim() === '7';`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
