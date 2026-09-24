// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.420_Menu_Transaction_Log.json. This file is the source now: edit it directly.
// MOB.420_Menu_Transaction_Log

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, click } from '../../support/dd';
import { globals } from '../../support/env';

export async function mob420(page: Page): Promise<void> {
  const MOBDEV = globals.MOBDEV;
  const run = new Sequence();
  await run.step("Navigate to mobile home", {}, async () => {
    await page.goto(`${MOBDEV}`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Open the hamburger menu", {}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Click Transaction Log", {}, async () => {
    await click(page, `//button[normalize-space(.)="Transaction Log"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test page title \"Transaction Log\"", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Transaction Log")]`, `Transaction Log`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
