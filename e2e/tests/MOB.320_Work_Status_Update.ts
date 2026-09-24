// Generated from legacy/Mobile/dd_tests_mobile/MOB.320_Work_Status_Update.json by to_playwright.py — do not edit by hand yet.
// MOB.320_Work_Status_Update

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertFromJavascript, assertPageContains, click, wait } from '../support/dd';

export async function mob320(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the status menu (-> Pending)", {}, async () => {
    await click(page, `//span[contains(normalize-space(.), "Status:")]`, 30000);
  });
  await run.step("Mark as Pending (optional: may already be set)", {allow: 'ignore'}, async () => {
    await click(page, `//button[normalize-space(.)="Mark as Pending"]`, 30000);
  });
  await run.step("Wait for the status mutation (-> Pending)", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the status badge now reads exactly \"Pending\"", {}, async () => {
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Pending';`, 30000);
  });
  await run.step("Open the status menu (-> In Progress)", {}, async () => {
    await click(page, `//span[contains(normalize-space(.), "Status:")]`, 30000);
  });
  await run.step("Mark as In Progress", {}, async () => {
    await click(page, `//button[normalize-space(.)="Mark as In Progress"]`, 30000);
  });
  await run.step("Wait for the status mutation (-> In Progress)", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the status badge now reads exactly \"In Progress\"", {}, async () => {
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'In Progress';`, 30000);
  });
  await run.step("Open the status menu (-> On Hold)", {}, async () => {
    await click(page, `//span[contains(normalize-space(.), "Status:")]`, 30000);
  });
  await run.step("Mark as On Hold", {}, async () => {
    await click(page, `//button[normalize-space(.)="Mark as On Hold"]`, 30000);
  });
  await run.step("Wait for the status mutation (-> On Hold)", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the status badge now reads exactly \"On Hold\"", {}, async () => {
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'On Hold';`, 30000);
  });
  await run.step("Open the status menu (-> Requested)", {}, async () => {
    await click(page, `//span[contains(normalize-space(.), "Status:")]`, 30000);
  });
  await run.step("Mark as Requested", {}, async () => {
    await click(page, `//button[normalize-space(.)="Mark as Requested"]`, 30000);
  });
  await run.step("Wait for the status mutation (-> Requested)", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the status badge now reads exactly \"Requested\"", {}, async () => {
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Requested';`, 30000);
  });
  await run.step("Open the status menu (-> Not Completed)", {}, async () => {
    await click(page, `//span[contains(normalize-space(.), "Status:")]`, 30000);
  });
  await run.step("Mark as Not Completed", {}, async () => {
    await click(page, `//button[normalize-space(.)="Mark as Not Completed"]`, 30000);
  });
  await run.step("Wait for the status mutation (-> Not Completed)", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the status badge now reads exactly \"Not Completed\"", {}, async () => {
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Not Completed';`, 30000);
  });
  await run.step("Navigate to the fixture work order (reload: the server's status)", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("After a reload the badge reads \"Not Completed\" (the persisted cache \u2014 not a server proof, trap 6)", {}, async () => {
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Not Completed';`, 30000);
  });
  await run.step("\u2b50 SERVER: `workStage.status` is `NotCompleted` \u2014 asked over /graphql, not read from the cache", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd320_status", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.workStage.status === 'NotCompleted'); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { status } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd320_status', '__dd320_status:inflight', '__dd320_status:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Open the status menu (-> Complete)", {}, async () => {
    await click(page, `//span[contains(normalize-space(.), "Status:")]`, 30000);
  });
  await run.step("Mark as Complete", {}, async () => {
    await click(page, `//button[normalize-space(.)="Mark as Complete"]`, 30000);
  });
  await run.step("Wait for the status mutation (-> Complete)", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the status badge now reads exactly \"Complete\"", {}, async () => {
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Complete';`, 30000);
  });
  await run.step("Open the status menu (-> Canceled)", {}, async () => {
    await click(page, `//span[contains(normalize-space(.), "Status:")]`, 30000);
  });
  await run.step("Mark as Canceled", {}, async () => {
    await click(page, `//button[normalize-space(.)="Mark as Canceled"]`, 30000);
  });
  await run.step("Wait for the status mutation (-> Canceled)", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the status badge now reads exactly \"Canceled\"", {}, async () => {
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Canceled';`, 30000);
  });
  await run.step("Open the status menu (-> Ready)", {always: true}, async () => {
    await click(page, `//span[contains(normalize-space(.), "Status:")]`, 30000);
  });
  await run.step("Mark as Ready", {always: true}, async () => {
    await click(page, `//button[normalize-space(.)="Mark as Ready"]`, 30000);
  });
  await run.step("Wait for the status mutation (-> Ready)", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the status badge now reads exactly \"Ready\"", {always: true}, async () => {
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Ready';`, 30000);
  });
  await run.step("Navigate to the fixture work order (reload: the server's status)", {always: true}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {always: true}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("After a reload the badge reads \"Ready\" (the persisted cache \u2014 not a server proof, trap 6)", {always: true}, async () => {
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Ready';`, 30000);
  });
  await run.step("\u2b50 SERVER: `workStage.status` is `Ready` \u2014 asked over /graphql, not read from the cache", {always: true}, async () => {
    await assertFromJavascript(page, `const K = "__dd320_status", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!(data.workStage.status === 'Ready'); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!) { workStage(id: $id) { status } }", variables: {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd320_status', '__dd320_status:inflight', '__dd320_status:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  run.finish();
}
