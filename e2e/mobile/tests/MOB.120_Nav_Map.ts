// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.120_Nav_Map.json. This file is the source now: edit it directly.
// MOB.120_Nav_Map

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent } from '../../support/dd';

export async function mob120(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /map", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/map`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test page title \"The Map\"", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "The Map")]`, `The Map`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
