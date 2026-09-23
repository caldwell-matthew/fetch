// Generated from Mobile/dd_tests_mobile/MOB.392_Work_Add_Note.json by to_playwright.py — do not edit by hand yet.
// MOB.392_Work_Add_Note

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, typeText, wait } from '../support/dd';

export async function mob392(page: Page): Promise<void> {
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
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the Notes tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Notes")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the note cards render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("BEFORE: count the note cards already here (the server-proof baseline)", {}, async () => {
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
  });
  await run.step("Open the add form", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the rich text editor", {}, async () => {
    await click(page, `//div[@contenteditable="true"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Enter the note instructions", {}, async () => {
    await typeText(page, `//div[@contenteditable="true"]`, `This is a note - DD SYNTHETIC MOBILE`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the form", {}, async () => {
    await click(page, `//button[@form="work-collection-form"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the add mutation", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the form modal closed (durable success signal)", {}, async () => {
    await assertPageLacks(page, `Submit`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the 'Item added' toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Item added`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the server answer before reloading", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Navigate to the fixture work order (reload: the server's answer)", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Reopen the tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Notes")]`, 30000);
  });
  await run.step("Let the cards render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 SERVER PROOF: after a RELOAD there is exactly ONE more note card than before", {}, async () => {
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
  });
  await run.step("Remove this test's sessionStorage key", {always: true}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd392_before');
return true;`, 15000);
  });
  run.finish();
}
