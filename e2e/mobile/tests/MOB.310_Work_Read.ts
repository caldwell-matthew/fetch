// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.310_Work_Read.json. This file is the source now: edit it directly.
// MOB.310_Work_Read

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertPageContains } from '../../support/dd';

export async function mob310(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, DEFAULT_TIMEOUT);
  });
  await run.step("Test status control is present", {}, async () => {
    await assertElementPresent(page, `//span[contains(normalize-space(.), "Status:")]`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
