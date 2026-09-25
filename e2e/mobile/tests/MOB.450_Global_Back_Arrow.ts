// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.450_Global_Back_Arrow.json. This file is the source now: edit it directly.
// MOB.450_Global_Back_Arrow

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, click, wait } from '../../support/dd';

export async function mob450(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Start on \"Work Orders\"", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, DEFAULT_TIMEOUT);
  });
  await run.step("Navigate to /asset-lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Now on \"Asset Lookup\"", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, DEFAULT_TIMEOUT);
  });
  await run.step("Click the back arrow", {}, async () => {
    await click(page, `//*[@id="page-title"]//*[@data-icon="chevrons-left" or contains(concat(" ", normalize-space(@class), " "), " fa-chevrons-left ") or @data-icon="chevron-double-left" or contains(concat(" ", normalize-space(@class), " "), " fa-chevron-double-left ") or @data-icon="angles-left" or contains(concat(" ", normalize-space(@class), " "), " fa-angles-left ")]`, DEFAULT_TIMEOUT);
  });
  await run.step("PROOF: back arrow returned to \"Work Orders\"", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
