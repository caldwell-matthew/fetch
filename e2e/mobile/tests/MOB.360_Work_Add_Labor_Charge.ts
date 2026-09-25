// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.360_Work_Add_Labor_Charge.json. This file is the source now: edit it directly.
// MOB.360_Work_Add_Labor_Charge

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, typeText, wait } from '../../support/dd';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';

export async function mob360(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Wait for the workstage pages and the lookup prefetch", {}, async () => {
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
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
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the Labor tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Labor")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the Labor cards render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("BEFORE: count the labor charge cards already here (the server-proof baseline)", {}, async () => {
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
  });
  await run.step("Open the add-charge form", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the user lookup", {}, async () => {
    await click(page, `//*[@id="userId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Type into the user lookup to load options", {}, async () => {
    await typeText(page, `//*[@id="userId"]`, `Dev Eloper`, DEFAULT_TIMEOUT);
  });
  await run.step("Pick the Dev Eloper user option", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Dev Eloper")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the craft lookup", {}, async () => {
    await click(page, `//*[@id="craftId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Pick the Account Executive craft option", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Account Executive")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the labor type lookup", {}, async () => {
    await click(page, `//*[@id="laborTypeId"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Pick the Regular labor type option", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Regular")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Enter actual hours (schema field qty)", {}, async () => {
    await typeText(page, `//*[@id="qty"]`, `1`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the charge", {}, async () => {
    await click(page, `//button[@form="work-collection-form"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the add mutation", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the charge modal closed (the form accepted the input \u2014 NOT a server answer, bugs \u00a740)", {}, async () => {
    await assertPageLacks(page, `Submit`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the item-added toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Item added`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the server answer before reloading", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Navigate to the fixture work order (reload: the server's answer)", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Reopen the tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Labor")]`, 30000);
  });
  await run.step("Let the cards render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 SERVER PROOF: after a RELOAD there is exactly ONE more labor charge card than before", {}, async () => {
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
  });
  await run.step("Remove this test's sessionStorage key", {always: true}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd35x_before');
return true;`, 15000);
  });
  run.finish();
}
