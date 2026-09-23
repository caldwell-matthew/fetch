// Generated from Mobile/dd_tests_mobile/MOB.560_AssetVerify_Counts_Badges.json by to_playwright.py — do not edit by hand yet.
// MOB.560_AssetVerify_Counts_Badges

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob560(page: Page): Promise<void> {
  try {
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Wait for the page to mount
    await wait(page, 10);
    // Test the "Mobile Jobs" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, DEFAULT_TIMEOUT);
    // Wait for the lookup prefetch and batched detail downloads
    await wait(page, 25);
    // Test the job list rendered
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
    // Test the batched job-detail downloads finished
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    // FIXTURE GUARD: "DATADOG MOBILE JOB" is in this crew's list
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // The status ring's legend renders a Ready count
    await assertElementPresent(page, `//li[contains(normalize-space(.), "Ready:")]`, DEFAULT_TIMEOUT);
    // The status ring's legend renders a Completed count
    await assertElementPresent(page, `//li[contains(normalize-space(.), "Completed:")]`, DEFAULT_TIMEOUT);
    // PROOF: every card's % label matches its own X-out-of-Y counts
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
    // Select the Ready status badge
    await el(page, `//li[contains(normalize-space(.), "Ready:")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the list to re-filter
    await wait(page, 3);
    // "DATADOG MOBILE JOB" rests READY, so it survives the Ready badge
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // The % labels still match after filtering
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
    // Deselect the Ready badge (it toggles)
    await el(page, `//li[contains(normalize-space(.), "Ready:")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the list to restore
    await wait(page, 3);
    // Select the Completed status badge
    await el(page, `//li[contains(normalize-space(.), "Completed:")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the list to re-filter
    await wait(page, 3);
    // PROOF: the Completed badge filters — "DATADOG MOBILE JOB" is hidden
    await assertPageLacks(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Deselect the Completed badge
    await el(page, `//li[contains(normalize-space(.), "Completed:")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the list to restore
    await wait(page, 3);
    // RESTORED: "DATADOG MOBILE JOB" is listed again
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  }
}
