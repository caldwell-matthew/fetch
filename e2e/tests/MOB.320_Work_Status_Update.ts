// Generated from Mobile/dd_tests_mobile/MOB.320_Work_Status_Update.json by to_playwright.py — do not edit by hand yet.
// MOB.320_Work_Status_Update

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertFromJavascript, assertPageContains, el, optional, wait } from '../support/dd';

export async function mob320(page: Page): Promise<void> {
  try {
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, DEFAULT_TIMEOUT);
    // Open the status menu (-> Pending)
    await el(page, `//span[contains(normalize-space(.), "Status:")]`).click({ timeout: 30000 });
    await optional("Mark as Pending (optional: may already be set)", async () => {
      await el(page, `//button[normalize-space(.)="Mark as Pending"]`).click({ timeout: 30000 });
    });
    // Wait for the status mutation (-> Pending)
    await wait(page, 3);
    // Test the status badge now reads exactly "Pending"
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Pending';`, 30000);
    // Open the status menu (-> In Progress)
    await el(page, `//span[contains(normalize-space(.), "Status:")]`).click({ timeout: 30000 });
    // Mark as In Progress
    await el(page, `//button[normalize-space(.)="Mark as In Progress"]`).click({ timeout: 30000 });
    // Wait for the status mutation (-> In Progress)
    await wait(page, 3);
    // Test the status badge now reads exactly "In Progress"
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'In Progress';`, 30000);
    // Open the status menu (-> On Hold)
    await el(page, `//span[contains(normalize-space(.), "Status:")]`).click({ timeout: 30000 });
    // Mark as On Hold
    await el(page, `//button[normalize-space(.)="Mark as On Hold"]`).click({ timeout: 30000 });
    // Wait for the status mutation (-> On Hold)
    await wait(page, 3);
    // Test the status badge now reads exactly "On Hold"
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'On Hold';`, 30000);
    // Open the status menu (-> Requested)
    await el(page, `//span[contains(normalize-space(.), "Status:")]`).click({ timeout: 30000 });
    // Mark as Requested
    await el(page, `//button[normalize-space(.)="Mark as Requested"]`).click({ timeout: 30000 });
    // Wait for the status mutation (-> Requested)
    await wait(page, 3);
    // Test the status badge now reads exactly "Requested"
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Requested';`, 30000);
    // Open the status menu (-> Not Completed)
    await el(page, `//span[contains(normalize-space(.), "Status:")]`).click({ timeout: 30000 });
    // Mark as Not Completed
    await el(page, `//button[normalize-space(.)="Mark as Not Completed"]`).click({ timeout: 30000 });
    // Wait for the status mutation (-> Not Completed)
    await wait(page, 3);
    // Test the status badge now reads exactly "Not Completed"
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Not Completed';`, 30000);
    // Navigate to the fixture work order (reload: the server's status)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // After a reload the badge reads "Not Completed" (the persisted cache — not a server proof, trap 6)
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Not Completed';`, 30000);
    // ⭐ SERVER: `workStage.status` is `NotCompleted` — asked over /graphql, not read from the cache
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
    // Open the status menu (-> Complete)
    await el(page, `//span[contains(normalize-space(.), "Status:")]`).click({ timeout: 30000 });
    // Mark as Complete
    await el(page, `//button[normalize-space(.)="Mark as Complete"]`).click({ timeout: 30000 });
    // Wait for the status mutation (-> Complete)
    await wait(page, 3);
    // Test the status badge now reads exactly "Complete"
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Complete';`, 30000);
    // Open the status menu (-> Canceled)
    await el(page, `//span[contains(normalize-space(.), "Status:")]`).click({ timeout: 30000 });
    // Mark as Canceled
    await el(page, `//button[normalize-space(.)="Mark as Canceled"]`).click({ timeout: 30000 });
    // Wait for the status mutation (-> Canceled)
    await wait(page, 3);
    // Test the status badge now reads exactly "Canceled"
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Canceled';`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd320_status', '__dd320_status:inflight', '__dd320_status:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Open the status menu (-> Ready)
    await el(page, `//span[contains(normalize-space(.), "Status:")]`).click({ timeout: 30000 });
    // Mark as Ready
    await el(page, `//button[normalize-space(.)="Mark as Ready"]`).click({ timeout: 30000 });
    // Wait for the status mutation (-> Ready)
    await wait(page, 3);
    // Test the status badge now reads exactly "Ready"
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Ready';`, 30000);
    // Navigate to the fixture work order (reload: the server's status)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // After a reload the badge reads "Ready" (the persisted cache — not a server proof, trap 6)
    await assertFromJavascript(page, `const span = [...document.querySelectorAll('span')]
  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);
const badge = span && span.querySelector('[class*="mantine-Badge"]');
const now = badge ? (badge.textContent || '').trim() : null;
return now === 'Ready';`, 30000);
    // ⭐ SERVER: `workStage.status` is `Ready` — asked over /graphql, not read from the cache
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
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd320_status', '__dd320_status:inflight', '__dd320_status:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  }
}
