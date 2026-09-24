// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.387_Work_Condition_Edit_Prefill.json. This file is the source now: edit it directly.
// MOB.387_Work_Condition_Edit_Prefill

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, click, press, wait } from '../../support/dd';

export async function mob387(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the Condition tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`, 30000);
  });
  await run.step("Let the condition cards render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("PREMISE: exactly one `Pump 0102 \u00b7 Mounting/Support` card, reading 1 / 2 / 3", {}, async () => {
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
  });
  await run.step("The card also lists `Stress Decision Score:` and `Notes:` (`ConditionDetails.tsx:42-43`)", {}, async () => {
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
  });
  await run.step("Open that card's gear", {}, async () => {
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
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Click `Edit Item`", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Edit Item"])[1]`, 30000);
  });
  await run.step("Let the edit form mount (it loads the WorkStageCondition schema)", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The condition form opened", {}, async () => {
    await assertElementPresent(page, `//form[@id="work-condition-form"]`, 30000);
  });
  await run.step("\u2b50 PREFILLED from the card: asset, group, element and the three scores", {}, async () => {
    await assertFromJavascript(page, `const want = {"assetId": "Pump 0102", "assetStandardDetailId": "Structural", "inspectionElementId": "Mounting/Support", "conditionFound": "1", "conditionScore": "2", "stressScore": "3"};
const got = {};
for (const k of Object.keys(want)) { const el = document.getElementById(k); got[k] = el ? (el.value || '').trim() : null; }
return Object.keys(want).every(k => got[k] === want[k]);`, 30000);
  });
  await run.step("Close the form with Escape \u2014 NEVER submitted", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("The edit form is gone", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.getElementById('work-condition-form');`, 20000);
  });
  await run.step("Navigate to the fixture work order (reload)", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Reopen the Condition tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Condition")]`, 30000);
  });
  await run.step("Let the condition cards render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("UNCHANGED after a reload: the card still reads 1 / 2 / 3", {}, async () => {
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
  });
  await run.step("Open the Failure tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Failure")]`, 30000);
  });
  await run.step("Let the failure cards render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The fixture's failure table has a `Discovery Code` row (`FailureDetails.tsx:30` \u2014 always rendered)", {}, async () => {
    await assertFromJavascript(page, `const norm = t => (t || '').replace(/\\s+/g, ' ').trim();
const tds = [...document.querySelectorAll('[role="tabpanel"]:not([style*="display: none"]) td')];
return tds.some(td => norm(td.textContent) === 'Discovery Code');`, 30000);
  });
  run.finish();
}
