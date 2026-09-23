// Generated from Mobile/dd_tests_mobile/MOB.398_Work_Assign_Stage_Modal.json by to_playwright.py — do not edit by hand yet.
// MOB.398_Work_Assign_Stage_Modal

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertPageContains, assertPageLacks, click, press, wait } from '../support/dd';

export async function mob398(page: Page): Promise<void> {
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
  await run.step("The \"Assign Work Stage\" button renders", {}, async () => {
    await assertElementPresent(page, `//button[contains(normalize-space(.), "Assign Work Stage")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Click \"Assign Work Stage\"", {}, async () => {
    await click(page, `//button[contains(normalize-space(.), "Assign Work Stage")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the modal and its auto-opened crew dropdown", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF: the crew form rendered", {}, async () => {
    await assertElementPresent(page, `//*[@id="crewform"]`, DEFAULT_TIMEOUT);
  });
  await run.step("The \"Keep local copy of work?\" option renders", {}, async () => {
    await assertPageContains(page, `Keep local copy of work`, DEFAULT_TIMEOUT);
  });
  await run.step("Cancel \u2014 close the modal without assigning", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Wait for the modal to close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: the modal closed and nothing was assigned", {always: true}, async () => {
    await assertPageLacks(page, `Keep local copy of work`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
