// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.394_Work_Permits.json. This file is the source now: edit it directly.
// MOB.394_Work_Permits

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';

export async function mob394(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
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
  await run.step("The lookup prefetch finished (not every stage's download — the test leaves the list)", {}, async () => {
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
  });
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the \"Permits\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][normalize-space(.)="Permits"]`, DEFAULT_TIMEOUT);
  });
  await run.step("The \"Permits\" tab is active", {}, async () => {
    await assertElementPresent(page, `//*[@role="tab"][normalize-space(.)="Permits"][@data-active]`, DEFAULT_TIMEOUT);
  });
  await run.step("PROOF: a permit card rendered with its status, expiration and approver", {}, async () => {
    await assertFromJavascript(page, `
const t = document.body.innerText || '';
return t.indexOf('Status:') !== -1
    && t.indexOf('Expiration Date:') !== -1
    && t.indexOf('Approved By:') !== -1;
`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
