// Generated from legacy/Mobile/dd_tests_mobile/MOB.512_AssetVerify_Job_List_Status.json by to_playwright.py — do not edit by hand yet.
// MOB.512_AssetVerify_Job_List_Status

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../support/dd';

export async function mob512(page: Page): Promise<void> {
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
    await click(page, `//label[.//span[normalize-space(.)="All"]]`, 30000);
  });
  await run.step("Wait for the All list to re-render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("FIXTURE GUARD: job is at rest (\"0 out of 2 Assets Verified\")", {}, async () => {
    await assertPageContains(page, `0 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
  });
  await run.step("PREMISE (server): 0 of 2 verified, so the job is `READY`", {}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd511_job', '__dd511_job:inflight', '__dd511_job:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Verify Tank 0000", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`, 30000);
  });
  await run.step("Wait for the mutation and the status it recomputes", {}, async () => {
    await wait(page, 4);
  });
  await run.step("Verify A/C Motor 0002", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "A/C Motor 0002")]//input[@type="checkbox"]`, 30000);
  });
  await run.step("Wait for the mutation and the status it recomputes", {}, async () => {
    await wait(page, 4);
  });
  await run.step("The detail counter reads \"2 out of 2 Assets Verified\"", {}, async () => {
    await assertPageContains(page, `2 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
  });
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
  await run.step("\u2b50 THE LIST: the card itself reads \"2 out of 2 Assets Verified\"", {}, async () => {
    await assertPageContains(page, `2 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
  });
  await run.step("\u2b50 THE LIST: and its percentage reads 100%", {}, async () => {
    await assertPageContains(page, `100%`, DEFAULT_TIMEOUT);
  });
  await run.step("Select the Completed status badge", {}, async () => {
    await click(page, `//li[contains(normalize-space(.), "Completed:")]`, 30000);
  });
  await run.step("Wait for the list to re-filter", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 PROOF: the completed job survives the Completed badge \u2014 \"DATADOG MOBILE JOB\"", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Deselect the Completed badge (it toggles)", {always: true}, async () => {
    await click(page, `//li[contains(normalize-space(.), "Completed:")]`, 30000);
  });
  await run.step("Wait for the list to restore", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("Select the Ready status badge", {}, async () => {
    await click(page, `//li[contains(normalize-space(.), "Ready:")]`, 30000);
  });
  await run.step("Wait for the list to re-filter", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 PROOF: it is no longer READY \u2014 the Ready badge hides \"DATADOG MOBILE JOB\"", {}, async () => {
    await assertPageLacks(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Deselect the Ready badge", {always: true}, async () => {
    await click(page, `//li[contains(normalize-space(.), "Ready:")]`, 30000);
  });
  await run.step("Wait for the list to restore", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("Navigate to the mobile job list", {always: true}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin rendering", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {always: true}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {always: true}, async () => {
    await wait(page, 25);
  });
  await run.step("Test the job list rendered", {always: true}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the lookup prefetch finished (feeds schemaQuery)", {always: true}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {always: true}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {always: true}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open \"DATADOG MOBILE JOB\" by clicking its row (not a deep link)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`, 30000);
  });
  await run.step("Wait for the job detail to render", {always: true}, async () => {
    await wait(page, 5);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {always: true}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Switch to the \"All\" filter", {always: true}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="All"]]`, 30000);
  });
  await run.step("Wait for the All list to re-render", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Unverify Tank 0000", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "Tank 0000")]//input[@type="checkbox"]`, 30000);
  });
  await run.step("Wait for the mutation and the status it recomputes", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("Unverify A/C Motor 0002", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][contains(., "A/C Motor 0002")]//input[@type="checkbox"]`, 30000);
  });
  await run.step("Wait for the mutation and the status it recomputes", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("RESTORED: job is back at rest (\"0 out of 2 Assets Verified\")", {always: true}, async () => {
    await assertPageContains(page, `0 out of 2 Assets Verified`, DEFAULT_TIMEOUT);
  });
  await run.step("\u2b50 RESTORED (server): 0 verified again, so the job recomputed back to `READY` \u2014 the step the forward-only version could not take", {always: true}, async () => {
    await assertFromJavascript(page, `const K = "__dd512_job", F = K + ':inflight', T = K + ':at';
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd512_job', '__dd512_job:inflight', '__dd512_job:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  run.finish();
}
