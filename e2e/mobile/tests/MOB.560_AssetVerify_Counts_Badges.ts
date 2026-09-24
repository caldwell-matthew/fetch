// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.560_AssetVerify_Counts_Badges.json. This file is the source now: edit it directly.
// MOB.560_AssetVerify_Counts_Badges

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';

export async function mob560(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the page to mount", {}, async () => {
    await wait(page, 10);
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await wait(page, 25);
  });
  await run.step("Test the job list rendered", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("The status ring's legend renders a Ready count", {}, async () => {
    await assertElementPresent(page, `//li[contains(normalize-space(.), "Ready:")]`, DEFAULT_TIMEOUT);
  });
  await run.step("The status ring's legend renders a Completed count", {}, async () => {
    await assertElementPresent(page, `//li[contains(normalize-space(.), "Completed:")]`, DEFAULT_TIMEOUT);
  });
  await run.step("PROOF: every card's % label matches its own X-out-of-Y counts", {}, async () => {
    await assertFromJavascript(page, `
const t = document.body.innerText || '';
const re = /(\\d+)\\s+out of\\s+(\\d+)\\s+Assets Verified\\s*(\\d+)%/g;
let m, n = 0;
while ((m = re.exec(t)) !== null) {
  n++;
  const verified = +m[1], total = +m[2], pct = +m[3];
  const expected = total === 0 ? 0 : Math.round(verified / total * 100);
  if (pct !== expected) return false;
}
return n > 0;
`, DEFAULT_TIMEOUT);
  });
  await run.step("Select the Ready status badge", {}, async () => {
    await click(page, `//li[contains(normalize-space(.), "Ready:")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the list to re-filter", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\"DATADOG MOBILE JOB\" rests READY, so it survives the Ready badge", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("The % labels still match after filtering", {}, async () => {
    await assertFromJavascript(page, `
const t = document.body.innerText || '';
const re = /(\\d+)\\s+out of\\s+(\\d+)\\s+Assets Verified\\s*(\\d+)%/g;
let m, n = 0;
while ((m = re.exec(t)) !== null) {
  n++;
  const verified = +m[1], total = +m[2], pct = +m[3];
  const expected = total === 0 ? 0 : Math.round(verified / total * 100);
  if (pct !== expected) return false;
}
return n > 0;
`, DEFAULT_TIMEOUT);
  });
  await run.step("Deselect the Ready badge (it toggles)", {}, async () => {
    await click(page, `//li[contains(normalize-space(.), "Ready:")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the list to restore", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Select the Completed status badge", {}, async () => {
    await click(page, `//li[contains(normalize-space(.), "Completed:")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the list to re-filter", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF: the Completed badge filters \u2014 \"DATADOG MOBILE JOB\" is hidden", {}, async () => {
    await assertPageLacks(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Deselect the Completed badge", {always: true}, async () => {
    await click(page, `//li[contains(normalize-space(.), "Completed:")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the list to restore", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("RESTORED: \"DATADOG MOBILE JOB\" is listed again", {always: true}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
