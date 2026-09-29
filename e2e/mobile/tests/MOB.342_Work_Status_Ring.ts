// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.342_Work_Status_Ring.json. This file is the source now: edit it directly.
// MOB.342_Work_Status_Ring

import { expect, Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageLacks, click, wait } from '../../support/dd';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';
import { appUrl, SECOND_FIXTURE_WO, serverRead } from '../support/session';

// The EXCLUSION leg (2026-09-29): with every stage `Ready`, selecting Ready could not show anything left out. The second
// fixture (`20260929-19-001`, `tools/setup_second_fixture.py`) is `In Progress`, so Ready must leave it out and In Progress
// must show it — and leave the main fixture (`20260805-18-001`, Ready) out.
const READY_GREEN = 'rgb(155, 203, 82)';

export async function mob342(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`${appUrl()}work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
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
  await run.step("WORK ROW GUARD: at least one work order rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 60000);
  });
  await run.step("The status ring rendered", {}, async () => {
    await assertElementPresent(page, `//*[contains(@class,"mantine-RingProgress-root")]`, 30000);
  });
  await run.step("The legend renders at least one `Status (n)` entry", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('li')]
  .map(e => (e.textContent || '').trim())
  .filter(t => /^[A-Za-z ]+\\(\\d+\\)$/.test(t));
return items.length > 0;`, 30000);
  });
  await run.step("A \"Ready (n)\" legend entry is present", {}, async () => {
    await assertElementPresent(page, `//li[contains(normalize-space(.), "Ready (")]`, 30000);
  });
  await run.step("BASELINE: rows are rendered", {}, async () => {
    await assertFromJavascript(page, `const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
return ROWS().length > 0;`, 30000);
  });
  await run.step("Select the Ready status in the legend", {}, async () => {
    await click(page, `//li[contains(normalize-space(.), "Ready (")]`, 30000);
  });
  await run.step("Let the list re-filter", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF: the Ready entry now renders as SELECTED (Highlight emits a <mark>)", {}, async () => {
    await assertFromJavascript(page, `return [...document.querySelectorAll('li mark')]
  .some(m => (m.textContent || '').includes('Ready'));`, 30000);
  });
  await run.step("PROOF: rows survive the Ready filter, and all are still Ready-green", {}, async () => {
    await assertFromJavascript(page, `const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
const rows = ROWS();
// Non-vacuous: a filter that emptied the list would pass an all-match test.
if (!rows.length) return false;
return rows.every(r => getComputedStyle(r).borderLeftColor === 'rgb(155, 203, 82)');`, 30000);
  });
  await run.step("Deselect Ready (the legend toggles)", {always: true}, async () => {
    await click(page, `//li[contains(normalize-space(.), "Ready (")]`, 30000);
  });
  await run.step("Let the list restore", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("RESTORED: nothing in the legend is marked selected", {always: true}, async () => {
    await assertFromJavascript(page, `return [...document.querySelectorAll('li mark')].length === 0;`, 30000);
  });
  await run.step("RESTORED: the unfiltered list is back", {always: true}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "Description:")])[1]`, 60000);
  });
  const second = (await serverRead(page, 'query($id: ID!) { workStage(id: $id) { _workSequence status } }', { id: SECOND_FIXTURE_WO })).workStage;
  const legend = (label: string) => page.locator('li').filter({ hasText: new RegExp(`^\\s*${label} \\(\\d+\\)\\s*$`) });
  const rows = page.locator('.mantine-Paper-root').filter({ hasText: 'Description:' });
  const colours = () => rows.evaluateAll((els) => els.map((e) => getComputedStyle(e).borderLeftColor));
  await run.step("EXCLUSION PREMISE (server): the second fixture is In Progress", {}, async () => {
    expect(second?.status, 'the second fixture (tools/setup_second_fixture.py)').toMatch(/^In ?Progress$/);
  });
  await run.step("EXCLUSION: the legend lists a second status, `In Progress (n)`", {}, async () => {
    await expect(legend('In Progress'), 'an In Progress legend entry').toHaveCount(1, { timeout: 30_000 });
  });
  await run.step("EXCLUSION: under Ready, the In Progress stage is LEFT OUT — every row is Ready-green", {always: true}, async () => {
    await legend('Ready').click();
    await expect(page.locator('li mark').filter({ hasText: 'Ready' }), 'Ready selected').toHaveCount(1, { timeout: 15_000 });
    await expect.poll(async () => { const c = await colours(); return c.length > 0 && c.every((x) => x === READY_GREEN); },
      { message: 'only Ready-green rows', timeout: 15_000 }).toBe(true);
    await expect(rows.filter({ hasText: second._workSequence }), `${second._workSequence} is not listed`).toHaveCount(0);
    await legend('Ready').click();
    await expect(page.locator('li mark'), 'Ready deselected').toHaveCount(0, { timeout: 15_000 });
  });
  await run.step("EXCLUSION: under In Progress, only In Progress rows — the second fixture, not the Ready main fixture", {always: true}, async () => {
    await legend('In Progress').click();
    await expect(page.locator('li mark').filter({ hasText: 'In Progress' }), 'In Progress selected').toHaveCount(1, { timeout: 15_000 });
    await expect(rows.filter({ hasText: second._workSequence }).first(), `${second._workSequence} is listed`).toBeVisible({ timeout: 15_000 });
    await expect.poll(async () => { const c = await colours(); return c.length > 0 && c.every((x) => x !== READY_GREEN); },
      { message: 'no Ready-green row', timeout: 15_000 }).toBe(true);
    await expect(rows.filter({ hasText: '20260805-18-001' }), 'the Ready main fixture is left out').toHaveCount(0);
  });
  await run.step("RESTORED: In Progress deselected, nothing marked", {always: true}, async () => {
    if (await page.locator('li mark').count()) await legend('In Progress').click();
    await expect(page.locator('li mark'), 'nothing selected').toHaveCount(0, { timeout: 15_000 });
  });
  run.finish();
}
