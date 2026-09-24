// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.510_AssetVerify_Verify_Unverify.json. This file is the source now: edit it directly.
// MOB.510_AssetVerify_Verify_Unverify

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';

export async function mob510(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await wait(page, 25);
  });
  await run.step("Test the job list rendered", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the lookup prefetch finished (feeds schemaQuery)", {}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open \"DATADOG MOBILE JOB\" by clicking its row (not a deep link)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`, 30000);
  });
  await run.step("Wait for the job detail to render", {}, async () => {
    await wait(page, 5);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Switch to the \"All\" filter", {}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="All"]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the All list to re-render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("FIXTURE GUARD: job is at rest (\"0 out of 2 Assets Verified\")", {}, async () => {
    await assertPageContains(page, `0 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
  });
  await run.step("PREMISE (server): 0 of 2 verified, so the job is `READY`", {}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd510_job', '__dd510_job:inflight', '__dd510_job:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Verify the first asset", {}, async () => {
    await click(page, `(//input[@type="checkbox"])[1]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the verify mutation", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the counter incremented (\"1 out of 2 Assets Verified\")", {}, async () => {
    await assertPageContains(page, `1 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
  });
  await run.step("\u2b50 SERVER: one of two verified moved the JOB to `IN_PROGRESS` \u2014 asked over /graphql, not read from the cache", {}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd510_job', '__dd510_job:inflight', '__dd510_job:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Switch to the \"Verified\" filter", {}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="Verified"]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the Verified list to re-render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test the verified asset now appears on the Verified tab", {}, async () => {
    await assertPageLacks(page, `No assets found.`, DEFAULT_TIMEOUT);
  });
  await run.step("Unverify that asset from the Verified tab", {}, async () => {
    await click(page, `//input[@type="checkbox"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the unverify mutation", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the Verified tab is empty again", {}, async () => {
    await assertPageContains(page, `No assets found.`, DEFAULT_TIMEOUT);
  });
  await run.step("Switch to the \"All\" filter", {}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="All"]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the All list to re-render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: job is back at rest (\"0 out of 2 Assets Verified\")", {}, async () => {
    await assertPageContains(page, `0 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
  });
  await run.step("\u2b50 RESTORED (server): back to 0 verified, so the job recomputed to `READY` \u2014 the status walks BACKWARD, which is what the forward-only version could not do", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd510_job', '__dd510_job:inflight', '__dd510_job:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  run.finish();
}
