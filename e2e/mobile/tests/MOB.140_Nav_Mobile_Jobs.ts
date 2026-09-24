// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.140_Nav_Mobile_Jobs.json. This file is the source now: edit it directly.
// MOB.140_Nav_Mobile_Jobs

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent } from '../../support/dd';

export async function mob140(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /asset-verify", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test page title \"Mobile Jobs\"", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, DEFAULT_TIMEOUT);
  });
  await run.step("Test mobile job search input is present", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, 30000);
  });
  run.finish();
}
