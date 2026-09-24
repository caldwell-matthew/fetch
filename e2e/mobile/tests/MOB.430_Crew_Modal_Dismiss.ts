// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.430_Crew_Modal_Dismiss.json. This file is the source now: edit it directly.
// MOB.430_Crew_Modal_Dismiss

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertPageContains, assertPageLacks, click } from '../../support/dd';
import { globals } from '../../support/env';

export async function mob430(page: Page): Promise<void> {
  const MOBDEV = globals.MOBDEV;
  const run = new Sequence();
  await run.step("Navigate to mobile home", {}, async () => {
    await page.goto(`${MOBDEV}`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Open the hamburger menu", {}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Click Switch Crews", {}, async () => {
    await click(page, `//button[.//div[normalize-space(.)="Switch Crews"]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test crew switcher opened", {}, async () => {
    await assertPageContains(page, `Switch Crew`, DEFAULT_TIMEOUT);
  });
  await run.step("Test current-crew label is shown", {}, async () => {
    await assertPageContains(page, `Currently logged in as`, DEFAULT_TIMEOUT);
  });
  await run.step("The modal's description is `OFFLINE_FEATURE_MESSAGE` (always shown)", {}, async () => {
    await assertPageContains(page, `This feature requires an internet connection.`, 15000);
  });
  await run.step("Dismiss with Cancel", {}, async () => {
    await click(page, `//button[normalize-space(.)="Cancel"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test crew switcher closed", {}, async () => {
    await assertPageLacks(page, `Currently logged in as`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
