// Generated from Mobile/dd_tests_mobile/MOB.387_Work_Condition_Edit_Prefill.json by to_playwright.py — do not edit by hand yet.
// MOB.387_Work_Condition_Edit_Prefill

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, assertFromJavascript, assertPageContains, el, wait } from '../support/dd';

export async function mob387(page: Page): Promise<void> {
  try {
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the Condition tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`).click({ timeout: 30000 });
    // Let the condition cards render
    await wait(page, 2);
    // PREMISE: exactly one `Pump 0102 · Mounting/Support` card, reading 1 / 2 / 3
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...new Set([...document.querySelectorAll('li')]
  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)
  .map(li => li.closest('[class*="mantine-Paper-root"]')))].filter(Boolean);
const orig = cards.filter(c => {
  const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
  const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
  const b = c.querySelector('button');
  return a && norm(a.textContent) === 'Pump 0102' && b && norm(b.textContent) === 'Mounting/Support';
});
const lis = orig.length === 1 ? [...orig[0].querySelectorAll('li')].map(li => norm(li.textContent)) : [];
const same = ['Condition Found: 1', 'Condition Score: 2', 'Stress Score: 3'].every(v => lis.includes(v));
return orig.length === 1 && same;`, 30000);
    // The card also lists `Stress Decision Score:` and `Notes:` (`ConditionDetails.tsx:42-43`)
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...new Set([...document.querySelectorAll('li')]
  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)
  .map(li => li.closest('[class*="mantine-Paper-root"]')))].filter(Boolean);
const orig = cards.filter(c => {
  const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
  const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
  const b = c.querySelector('button');
  return a && norm(a.textContent) === 'Pump 0102' && b && norm(b.textContent) === 'Mounting/Support';
});
if (orig.length !== 1) return false;
const lis = [...orig[0].querySelectorAll('li')].map(li => norm(li.textContent));
return lis.some(t => t.indexOf('Stress Decision Score:') === 0) && lis.some(t => t.indexOf('Notes:') === 0);`, 30000);
    // Open that card's gear
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...new Set([...document.querySelectorAll('li')]
  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)
  .map(li => li.closest('[class*="mantine-Paper-root"]')))].filter(Boolean);
const orig = cards.filter(c => {
  const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
  const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
  const b = c.querySelector('button');
  return a && norm(a.textContent) === 'Pump 0102' && b && norm(b.textContent) === 'Mounting/Support';
});
if (orig.length !== 1) return false;
const g = orig[0].querySelector('[aria-label="Menu"]');
if (!g) return false;
g.click();
return true;`, 30000);
    // Let the menu open
    await wait(page, 1);
    // Click `Edit Item`
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Item"])[1]`).click({ timeout: 30000 });
    // Let the edit form mount (it loads the WorkStageCondition schema)
    await wait(page, 3);
    // The condition form opened
    await assertElementPresent(page, `//form[@id="work-condition-form"]`, 30000);
    // ⭐ PREFILLED from the card: asset, group, element and the three scores
    await assertFromJavascript(page, `const want = {"assetId": "Pump 0102", "assetStandardDetailId": "Structural", "inspectionElementId": "Mounting/Support", "conditionFound": "1", "conditionScore": "2", "stressScore": "3"};
const got = {};
for (const k of Object.keys(want)) { const el = document.getElementById(k); got[k] = el ? (el.value || '').trim() : null; }
return Object.keys(want).every(k => got[k] === want[k]);`, 30000);
    // Navigate to the fixture work order (reload)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Reopen the Condition tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`).click({ timeout: 30000 });
    // Let the condition cards render
    await wait(page, 2);
    // UNCHANGED after a reload: the card still reads 1 / 2 / 3
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const cards = [...new Set([...document.querySelectorAll('li')]
  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)
  .map(li => li.closest('[class*="mantine-Paper-root"]')))].filter(Boolean);
const orig = cards.filter(c => {
  const grp = c.parentElement && c.parentElement.closest('[class*="mantine-Paper-root"]');
  const a = grp && grp.querySelector('[class*="mantine-Text-root"]');
  const b = c.querySelector('button');
  return a && norm(a.textContent) === 'Pump 0102' && b && norm(b.textContent) === 'Mounting/Support';
});
const lis = orig.length === 1 ? [...orig[0].querySelectorAll('li')].map(li => norm(li.textContent)) : [];
const same = ['Condition Found: 1', 'Condition Score: 2', 'Stress Score: 3'].every(v => lis.includes(v));
return orig.length === 1 && same;`, 30000);
    // Open the Failure tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`).click({ timeout: 30000 });
    // Let the failure cards render
    await wait(page, 2);
    // The fixture's failure table has a `Discovery Code` row (`FailureDetails.tsx:30` — always rendered)
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const tds = [...document.querySelectorAll('[role="tabpanel"]:not([style*="display: none"]) td')];
return tds.some(td => norm(td.textContent) === 'Discovery Code');`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Close the form with Escape — NEVER submitted
    await page.keyboard.press(`Escape`);
    // Let the modal close
    await wait(page, 2);
    // The edit form is gone
    await assertFromJavascript(page, `return !document.getElementById('work-condition-form');`, 20000);
  }
}
