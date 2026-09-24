// Generated from legacy/Mobile/dd_tests_mobile/MOB.330_Work_Detail_Tabs.json by to_playwright.py — do not edit by hand yet.
// MOB.330_Work_Detail_Tabs

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertPageContains, click, wait } from '../support/dd';

export async function mob330(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, DEFAULT_TIMEOUT);
  });
  await run.step("Test a tab strip is rendered", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the first tab starts active", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tab"])[1][@data-active]`, DEFAULT_TIMEOUT);
  });
  await run.step("Switch to the second tab", {}, async () => {
    await click(page, `(//*[@role="tab"])[2]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the panel to mount", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test the second tab is now active", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tab"])[2][@data-active]`, DEFAULT_TIMEOUT);
  });
  await run.step("Switch back to the first tab", {}, async () => {
    await click(page, `(//*[@role="tab"])[1]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the panel to mount", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test the first tab is active again", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tab"])[1][@data-active]`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
