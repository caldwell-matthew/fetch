// Generated from Mobile/dd_tests_mobile/MOB.331_Work_GenInfo_Value_Modal.json by to_playwright.py — do not edit by hand yet.
// MOB.331_Work_GenInfo_Value_Modal

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob331(page: Page): Promise<void> {
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
    // Open the "General Info" tab
    await el(page, `//*[@role="tab"][normalize-space(.)="General Info"]`).click({ timeout: 30000 });
    // "General Info" is the active tab
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="General Info"][@data-active]`, 30000);
    // PREMISE: the form shows Stage Notes (`#desc`) = `DATADOG FIXTURE` and an empty Problem Description (`#problemDesc`) — the two multiline fields
    await assertFromJavascript(page, `const d = document.getElementById('desc'), p = document.getElementById('problemDesc');
return !!document.getElementById('mobile-genInfo') && !!d && d.value === 'DATADOG FIXTURE' && !!p && !p.value;`, 45000);
    // ⭐ The value arrow renders beside Stage Notes (it holds a value) and NOT beside Problem Description (empty) — `MultiLineLabel` returns nothing for an empty value
    await assertFromJavascript(page, `const field = id => {
  const i = document.getElementById(id);
  return i && i.closest('.form-group');
};
const arrow = w => w && w.querySelector('svg[data-icon="square-arrow-up-right"]');
return !!arrow(field('desc')) && !!field('problemDesc') && !arrow(field('problemDesc'));`, 30000);
    // Click Stage Notes' arrow — dispatched on the ICON, which carries the onClick (its ActionIcon's `aria-label` is `Settings` and does nothing)
    await assertFromJavascript(page, `const field = id => {
  const i = document.getElementById(id);
  return i && i.closest('.form-group');
};
const arrow = w => w && w.querySelector('svg[data-icon="square-arrow-up-right"]');
const a = arrow(field('desc'));
if (!a) return false;
a.dispatchEvent(new MouseEvent('click', { bubbles: true }));
return true;`, 20000);
    // ⭐ A modal opened showing the field's VALUE — exactly `DATADOG FIXTURE` (not its label `Stage Notes`)
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => ((x.querySelector('.mantine-Modal-body') || {}).textContent || '').trim() === 'DATADOG FIXTURE');
return !!m;`, 20000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Close it with its own close button
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => ((x.querySelector('.mantine-Modal-body') || {}).textContent || '').trim() === 'DATADOG FIXTURE');
const c = m && m.querySelector('.mantine-Modal-close');
if (!c) return false;
c.click();
return true;`, 20000);
    // The value modal is gone
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => ((x.querySelector('.mantine-Modal-body') || {}).textContent || '').trim() === 'DATADOG FIXTURE');
return !m;`, 20000);
    // RESTORED: the form is untouched — Stage Notes still `DATADOG FIXTURE`, nothing typed
    await assertFromJavascript(page, `const d = document.getElementById('desc');
return !!d && d.value === 'DATADOG FIXTURE';`, 20000);
  }
}
