// Generated from Mobile/dd_tests_mobile/MOB.511_AssetVerify_Verify_All_Completed.json by to_playwright.py — do not edit by hand yet.
// MOB.511_AssetVerify_Verify_All_Completed

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob511(page: Page): Promise<void> {
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
    await el(page, `//label[.//span[normalize-space(.)="All"]]`).click({ timeout: 30000 });
    // Wait for the All list to re-render
    await wait(page, 2);
    // FIXTURE GUARD: job is at rest ("0 out of 2 Assets Verified")
    await assertPageContains(page, `0 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
    // PREMISE (server): 0 of 2 verified, so the job is `READY`
    await assertFromJavascript(page, `const K = "__dd511_job", F = K + ':inflight', T = K + ':at';
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
      body: JSON.stringify({ query: "query DD511Job($id: ID!) { mobileJob(id: $id) { id status assets { id verified } } }", variables: {"id": "Z0EVwQcdJZhMURcBFkp0E0"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Verify Tank 0000
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`).click({ timeout: 30000 });
    // Wait for the mutation and the status it recomputes
    await wait(page, 4);
    // The counter reads "1 out of 2 Assets Verified"
    await assertPageContains(page, `1 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
    // SERVER: one of two verified — the job is `IN_PROGRESS`, not yet complete
    await assertFromJavascript(page, `const K = "__dd511_job", F = K + ':inflight', T = K + ':at';
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
      body: JSON.stringify({ query: "query DD511Job($id: ID!) { mobileJob(id: $id) { id status assets { id verified } } }", variables: {"id": "Z0EVwQcdJZhMURcBFkp0E0"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Verify A/C Motor 0002
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "A/C Motor 0002")]//input[@type="checkbox"]`).click({ timeout: 30000 });
    // Wait for the mutation and the status it recomputes
    await wait(page, 4);
    // The counter reads "2 out of 2 Assets Verified"
    await assertPageContains(page, `2 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
    // ⭐ SERVER: every asset verified, so the JOB is `COMPLETED` — asked over /graphql, not read from the cache
    await assertFromJavascript(page, `const K = "__dd511_job", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.mobileJob.status === 'COMPLETED' && data.mobileJob.assets.filter(a => a.verified).length === 2); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query DD511Job($id: ID!) { mobileJob(id: $id) { id status assets { id verified } } }", variables: {"id": "Z0EVwQcdJZhMURcBFkp0E0"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd511_job', '__dd511_job:inflight', '__dd511_job:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd511_job', '__dd511_job:inflight', '__dd511_job:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd511_job', '__dd511_job:inflight', '__dd511_job:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Unverify Tank 0000
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`).click({ timeout: 30000 });
    // Wait for the mutation and the status it recomputes
    await wait(page, 4);
    // Unverify A/C Motor 0002
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "A/C Motor 0002")]//input[@type="checkbox"]`).click({ timeout: 30000 });
    // Wait for the mutation and the status it recomputes
    await wait(page, 4);
    // RESTORED: job is back at rest ("0 out of 2 Assets Verified")
    await assertPageContains(page, `0 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
    // ⭐ RESTORED (server): 0 verified again, so the job recomputed back to `READY` — the step the forward-only version could not take
    await assertFromJavascript(page, `const K = "__dd511_job", F = K + ':inflight', T = K + ':at';
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
      body: JSON.stringify({ query: "query DD511Job($id: ID!) { mobileJob(id: $id) { id status assets { id verified } } }", variables: {"id": "Z0EVwQcdJZhMURcBFkp0E0"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd511_job', '__dd511_job:inflight', '__dd511_job:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  }
}
