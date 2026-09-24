// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.357_Work_Form_Metrics.json. This file is the source now: edit it directly.
// MOB.357_Work_Form_Metrics

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, wait } from '../../support/dd';

export async function mob357(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 warm the work lookup cache", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Let the lookup prefetch run", {}, async () => {
    await wait(page, 30);
  });
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("GATE: the detail data arrived (tab strip)", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
  });
  await run.step("HEADER: the WORK-level readout is either well-formed or correctly absent", {}, async () => {
    await assertFromJavascript(page, `const leaves = (root) => [...root.querySelectorAll('*')].filter(e => !e.children.length).map(e => (e.textContent || '').trim());
const tabs = document.querySelector('.mantine-Tabs-root');
const root = tabs && tabs.parentElement;
if (!root) return false;
let head = [];
for (const el of root.children) {
  if (el === tabs) break;
  head = head.concat(leaves(el), el.children.length ? [] : [(el.textContent || '').trim()]);
}
const m = head.map(t => t.match(/^Required Fields Completed:\\s*(\\d+)\\s+of\\s+(\\d+)$/)).find(Boolean);
const c = head.map(t => t.match(/^Forms?:\\s*(\\d+)$/)).find(Boolean);
if (!m && !c) return true;            // required === 0 branch
if (!m || !c) return false;           // half-rendered — a real defect
return Number(m[1]) <= Number(m[2]);`, 30000);
  });
  await run.step("Open the Forms tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Form")]`, 30000);
  });
  await run.step("Wait for the forms list", {}, async () => {
    await wait(page, 3);
  });
  await run.step("FIXTURE GUARD: the work order has at least one form card", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]`, 60000);
  });
  await run.step("EVERY form card carries a well-formed 'X of Y' completion readout", {}, async () => {
    await assertFromJavascript(page, `const leaves = (root) => [...root.querySelectorAll('*')].filter(e => !e.children.length).map(e => (e.textContent || '').trim());
const p = [...document.querySelectorAll('[role=tabpanel]')].find(e => !(e.getAttribute('style') || '').includes('display: none'));
if (!p) return false;
const cards = [...p.querySelectorAll('.mantine-Paper-root')].filter(c => c.querySelector('.mantine-Title-root'));
if (!cards.length) return false;
const re = /^Required Fields Completed:\\s*(\\d+)\\s+of\\s+(\\d+)$/;
return cards.every(c => {
  const m = leaves(c).map(t => t.match(re)).find(Boolean);
  if (!m) return false;
  const done = Number(m[1]), req = Number(m[2]);
  return Number.isInteger(done) && Number.isInteger(req) && done <= req;
});`, 30000);
  });
  await run.step("CROSS-CHECK: the header's form COUNT equals the number of form cards", {}, async () => {
    await assertFromJavascript(page, `const leaves = (root) => [...root.querySelectorAll('*')].filter(e => !e.children.length).map(e => (e.textContent || '').trim());
const tabs = document.querySelector('.mantine-Tabs-root');
const root = tabs && tabs.parentElement;
if (!root) return false;
let head = [];
for (const el of root.children) {
  if (el === tabs) break;
  head = head.concat(leaves(el), el.children.length ? [] : [(el.textContent || '').trim()]);
}
const c = head.map(t => t.match(/^Forms?:\\s*(\\d+)$/)).find(Boolean);
if (!c) return true;                  // header absent — required === 0
const p = [...document.querySelectorAll('[role=tabpanel]')].find(e => !(e.getAttribute('style') || '').includes('display: none'));
if (!p) return false;
const cards = [...p.querySelectorAll('.mantine-Paper-root')].filter(c => c.querySelector('.mantine-Title-root'));
return Number(c[1]) === cards.length;`, 30000);
  });
  await run.step("\u2b50 CROSS-CHECK 2: the header appears exactly when some card declares a required field", {}, async () => {
    await assertFromJavascript(page, `const leaves = (root) => [...root.querySelectorAll('*')].filter(e => !e.children.length).map(e => (e.textContent || '').trim());
const tabs = document.querySelector('.mantine-Tabs-root');
const root = tabs && tabs.parentElement;
if (!root) return false;
let head = [];
for (const el of root.children) {
  if (el === tabs) break;
  head = head.concat(leaves(el), el.children.length ? [] : [(el.textContent || '').trim()]);
}
const headerPresent = !!head.map(t => t.match(/^Forms?:\\s*(\\d+)$/)).find(Boolean);
const p = [...document.querySelectorAll('[role=tabpanel]')].find(e => !(e.getAttribute('style') || '').includes('display: none'));
if (!p) return false;
const cards = [...p.querySelectorAll('.mantine-Paper-root')].filter(c => c.querySelector('.mantine-Title-root'));
const re = /^Required Fields Completed:\\s*(\\d+)\\s+of\\s+(\\d+)$/;
const anyRequired = cards.some(c => {
  const m = leaves(c).map(t => t.match(re)).find(Boolean);
  return !!m && Number(m[2]) > 0;
});
return headerPresent === anyRequired;`, 30000);
  });
  await run.step("READ-ONLY GUARD: still on the work detail, not the form route", {}, async () => {
    await assertFromJavascript(page, `return /\\/work\\/[^/]+$/.test(location.pathname);`, 30000);
  });
  run.finish();
}
