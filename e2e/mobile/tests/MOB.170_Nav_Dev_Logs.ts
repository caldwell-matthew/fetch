// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.170_Nav_Dev_Logs.json. This file is the source now: edit it directly.
// MOB.170_Nav_Dev_Logs

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent } from '../../support/dd';

export async function mob170(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /logz", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/logz`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test page title \"Dev Logs\"", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Dev Logs")]`, `Dev Logs`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
