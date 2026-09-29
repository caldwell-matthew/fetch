// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.357_Work_Form_Metrics.json. This file is the source now: edit it directly.
// MOB.357_Work_Form_Metrics

import { expect, Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, wait } from '../../support/dd';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';
import { appUrl, SECOND_FIXTURE_WO, serverRead } from '../support/session';
import { FIXTURE_WO } from '../support/fixtures';

// The NON-ZERO path (2026-09-29): every form on the main fixture has no required field, so each card read `0 of 0` and
// the work-level header was absent. The second fixture (`20260929-19-001`, `tools/setup_second_fixture.py`) holds
// `DATADOG FIXTURE REQUIRED FORM`, whose one field is required and unfilled: its card must read `0 of 1`, the header
// must appear with `0 of 1`, and its `Forms:` count must equal the cards. Reads only.
const REQUIRED_FORM = 'DATADOG FIXTURE REQUIRED FORM';

export async function mob357(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 warm the work lookup cache", {}, async () => {
    await page.goto(`${appUrl()}work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Let the lookup prefetch run", {}, async () => {
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
  });
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`${appUrl()}work/${FIXTURE_WO}`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
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
  await run.step("NON-ZERO PREMISE (server): the second fixture holds the required form, its field unfilled", {}, async () => {
    const forms = (await serverRead(page, 'query($id: ID!) { workStage(id: $id) { forms { name } } }', { id: SECOND_FIXTURE_WO })).workStage.forms;
    expect(forms.filter((f: { name: string }) => f.name === REQUIRED_FORM).length, `${REQUIRED_FORM} is attached once`).toBe(1);
  });
  await run.step("NON-ZERO: open the second fixture", {}, async () => {
    await page.goto(appUrl(`work/${SECOND_FIXTURE_WO}`), { waitUntil: 'load' });
    await expect(page.getByRole('tab').first(), 'the work order opened').toBeVisible({ timeout: 60_000 });
  });
  await run.step("\u2b50 NON-ZERO: the header reads `Required Fields Completed: 0 of 1`", {}, async () => {
    await expect(page.getByText(/^Required Fields Completed:\s*0\s+of\s+1$/).first(), 'the work-level readout').toBeVisible({ timeout: 30_000 });
  });
  await run.step("\u2b50 NON-ZERO: on the Forms tab the required form reads `0 of 1`, every other card `0 of 0`, and the header counts them", {}, async () => {
    await page.getByRole('tab', { name: /Form/ }).click();
    const cards = page.locator('[role="tabpanel"]:visible .mantine-Paper-root').filter({ has: page.locator('.mantine-Title-root') });
    await expect(cards.filter({ hasText: REQUIRED_FORM }), 'the required form has one card').toHaveCount(1, { timeout: 30_000 });
    await expect(cards.filter({ hasText: REQUIRED_FORM }).getByText(/^Required Fields Completed:\s*0\s+of\s+1$/), 'it reads 0 of 1').toBeVisible();
    const n = await cards.count();
    for (let i = 0; i < n; i++) {
      const card = cards.nth(i);
      if ((await card.innerText()).includes(REQUIRED_FORM)) continue;
      await expect(card.getByText(/^Required Fields Completed:\s*0\s+of\s+0$/), `card ${i + 1} reads 0 of 0`).toBeVisible();
    }
    await expect(page.getByText(new RegExp(`^Forms?:\\s*${n}$`)).first(), `the header counts ${n} forms`).toBeVisible();
  });
  run.finish();
}
