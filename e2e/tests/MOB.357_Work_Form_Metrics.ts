// Generated from Mobile/dd_tests_mobile/MOB.357_Work_Form_Metrics.json by to_playwright.py — do not edit by hand yet.
// MOB.357_Work_Form_Metrics

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, wait } from '../support/dd';

export async function mob357(page: Page): Promise<void> {
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
    // GATE: the detail data arrived (tab strip)
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
    // HEADER: the WORK-level readout is either well-formed or correctly absent
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
    // Open the Forms tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Form")]`).click({ timeout: 30000 });
    // Wait for the forms list
    await wait(page, 3);
    // FIXTURE GUARD: the work order has at least one form card
    await assertElementPresent(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]`, 60000);
    // EVERY form card carries a well-formed 'X of Y' completion readout
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
    // CROSS-CHECK: the header's form COUNT equals the number of form cards
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
    // ⭐ CROSS-CHECK 2: the header appears exactly when some card declares a required field
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
    // READ-ONLY GUARD: still on the work detail, not the form route
    await assertFromJavascript(page, `return /\\/work\\/[^/]+$/.test(location.pathname);`, 30000);
}
