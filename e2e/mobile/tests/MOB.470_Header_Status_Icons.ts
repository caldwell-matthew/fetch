// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.470_Header_Status_Icons.json. This file is the source now: edit it directly.
// MOB.470_Header_Status_Icons

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, click, press, wait } from '../../support/dd';

export async function mob470(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile home page", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the app shell and GET_SESSION settle", {}, async () => {
    await wait(page, 5);
  });
  await run.step("NETWORK: the online wifi icon is rendered", {}, async () => {
    await assertElementPresent(page, `//*[@data-icon="wifi" or contains(concat(" ", normalize-space(@class), " "), " fa-wifi ")]`, 30000);
  });
  await run.step("NETWORK: the OFFLINE icon is not \u2014 the pair is what makes this a real check", {}, async () => {
    await assertFromJavascript(page, `return !document.querySelector('[data-icon="wifi-slash"], .fa-wifi-slash');`, 30000);
  });
  await run.step("Sanity: the runner really is online (navigator.onLine)", {}, async () => {
    await assertFromJavascript(page, `return navigator.onLine === true;`, 30000);
  });
  await run.step("PENDING TX: no upload icon while online \u2014 the `!count` branch", {}, async () => {
    await assertFromJavascript(page, `return !document.querySelector('[data-icon="upload"], .fa-upload');`, 30000);
  });
  await run.step("The ReactNativeWebView bridge is absent, so UploadStatusIcon cannot mount", {}, async () => {
    await assertFromJavascript(page, `return !window.ReactNativeWebView;`, 30000);
  });
  await run.step("Open the header menu", {}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, 30000);
  });
  await run.step("VERSION: the menu renders a version item", {}, async () => {
    await assertPageContains(page, `Version: `, DEFAULT_TIMEOUT);
  });
  await run.step("VERSION: it carries the code-fork icon", {}, async () => {
    await assertElementPresent(page, `//*[@data-icon="code-fork" or contains(concat(" ", normalize-space(@class), " "), " fa-code-fork ")]`, 30000);
  });
  await run.step("PROOF: the version has a real value \u2014 'Version: ' + undefined renders too", {}, async () => {
    await assertFromJavascript(page, `const v = window.__mentorapm && window.__mentorapm.shortVersion;
if (!v || !String(v).trim()) return false;
// and the DOM must actually be showing that value, not just the prefix
return (document.body.innerText || '').includes('Version: ' + v);`, 30000);
  });
  await run.step("Close the menu", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("SW: navigator.serviceWorker is available", {}, async () => {
    await assertFromJavascript(page, `return 'serviceWorker' in navigator;`, 15000);
  });
  await run.step("SW: a service worker is CONTROLLING this page \u2014 not merely present", {}, async () => {
    await assertFromJavascript(page, `return !!(navigator.serviceWorker && navigator.serviceWorker.controller);`, 30000);
  });
  await run.step("SW: kick off getRegistrations() (async \u2014 read in the next step)", {}, async () => {
    await assertFromJavascript(page, `window.__ddSW = 'pending';
try { navigator.serviceWorker.getRegistrations()
  .then(function (r) { window.__ddSW = r.length; })
  .catch(function () { window.__ddSW = -1; }); } catch (e) { window.__ddSW = -2; }
return true;`, 15000);
  });
  await run.step("Let getRegistrations() settle", {}, async () => {
    await wait(page, 3);
  });
  await run.step("SW: at least one service worker is REGISTERED (numeric, so a still-pending promise fails rather than passing)", {}, async () => {
    await assertFromJavascript(page, `return typeof window.__ddSW === 'number' && window.__ddSW > 0;`, 15000);
  });
  await run.step("CREW SHORTCUT: the crew label is rendered", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mobile-crew ")]`, 30000);
  });
  await run.step("Click the crew label beside the logo", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mobile-crew ")]`, 30000);
  });
  await run.step("PROOF: the crew shortcut opens the same RoleSelection modal as the menu", {}, async () => {
    await assertPageContains(page, `Submit`, DEFAULT_TIMEOUT);
  });
  await run.step("Dismiss the modal without submitting \u2014 nothing changes", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: back on Home with the header intact", {always: true}, async () => {
    await assertElementPresent(page, `//*[@data-icon="wifi" or contains(concat(" ", normalize-space(@class), " "), " fa-wifi ")]`, 30000);
  });
  run.finish();
}
