// Generated from Mobile/dd_tests_mobile/MOB.510_AssetVerify_Verify_Unverify.json by to_playwright.py — do not edit by hand yet.
// MOB.510_AssetVerify_Verify_Unverify

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob510(page: Page): Promise<void> {
  try {
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Let the page begin rendering
    await wait(page, 3);
    // Test the "Mobile Jobs" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
    // Wait for the lookup prefetch and batched detail downloads
    await wait(page, 25);
    // Test the job list rendered
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
    // Test the lookup prefetch finished (feeds schemaQuery)
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
    // Test the batched job-detail downloads finished
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    // FIXTURE GUARD: "DATADOG MOBILE JOB" is in this crew's list
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open "DATADOG MOBILE JOB" by clicking its row (not a deep link)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`).click({ timeout: 30000 });
    // Wait for the job detail to render
    await wait(page, 5);
    // ASSET LIST GUARD: the job's asset rows have rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
    // Switch to the "All" filter
    await el(page, `//label[.//span[normalize-space(.)="All"]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the All list to re-render
    await wait(page, 2);
    // FIXTURE GUARD: job is at rest ("0 out of 2 Assets Verified")
    await assertPageContains(page, `0 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
    // PREMISE (server): 0 of 2 verified, so the job is `READY`
    await assertFromJavascript(page, `const K = "__dd510_job", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.mobileJob.status === 'READY' && data.mobileJob.assets.filter(a => a.verified).length === 0); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query DD510Job($id: ID!) { mobileJob(id: $id) { id status assets { id verified } } }", variables: {"id": "Z0EVwQcdJZhMURcBFkp0E0"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Verify the first asset
    await el(page, `(//input[@type="checkbox"])[1]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the verify mutation
    await wait(page, 3);
    // Test the counter incremented ("1 out of 2 Assets Verified")
    await assertPageContains(page, `1 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
    // ⭐ SERVER: one of two verified moved the JOB to `IN_PROGRESS` — asked over /graphql, not read from the cache
    await assertFromJavascript(page, `const K = "__dd510_job", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.mobileJob.status === 'IN_PROGRESS' && data.mobileJob.assets.filter(a => a.verified).length === 1); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query DD510Job($id: ID!) { mobileJob(id: $id) { id status assets { id verified } } }", variables: {"id": "Z0EVwQcdJZhMURcBFkp0E0"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Switch to the "Verified" filter
    await el(page, `//label[.//span[normalize-space(.)="Verified"]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the Verified list to re-render
    await wait(page, 2);
    // Test the verified asset now appears on the Verified tab
    await assertPageLacks(page, `No assets found.`, DEFAULT_TIMEOUT);
    // Unverify that asset from the Verified tab
    await el(page, `//input[@type="checkbox"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the unverify mutation
    await wait(page, 3);
    // Test the Verified tab is empty again
    await assertPageContains(page, `No assets found.`, DEFAULT_TIMEOUT);
    // Switch to the "All" filter
    await el(page, `//label[.//span[normalize-space(.)="All"]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the All list to re-render
    await wait(page, 2);
    // RESTORED: job is back at rest ("0 out of 2 Assets Verified")
    await assertPageContains(page, `0 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd510_job', '__dd510_job:inflight', '__dd510_job:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd510_job', '__dd510_job:inflight', '__dd510_job:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // ⭐ RESTORED (server): back to 0 verified, so the job recomputed to `READY` — the status walks BACKWARD, which is what the forward-only version could not do
    await assertFromJavascript(page, `const K = "__dd510_job", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.mobileJob.status === 'READY' && data.mobileJob.assets.filter(a => a.verified).length === 0); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query DD510Job($id: ID!) { mobileJob(id: $id) { id status assets { id verified } } }", variables: {"id": "Z0EVwQcdJZhMURcBFkp0E0"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd510_job', '__dd510_job:inflight', '__dd510_job:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  }
}
