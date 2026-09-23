// Generated from Mobile/dd_tests_mobile/MOB.470_Header_Status_Icons.json by to_playwright.py — do not edit by hand yet.
// MOB.470_Header_Status_Icons

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, assertFromJavascript, assertPageContains, el, wait } from '../support/dd';

export async function mob470(page: Page): Promise<void> {
  try {
    // Navigate to the mobile home page
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`);
    // Let the app shell and GET_SESSION settle
    await wait(page, 5);
    // NETWORK: the online wifi icon is rendered
    await assertElementPresent(page, `//*[@data-icon="wifi" or contains(concat(" ", normalize-space(@class), " "), " fa-wifi ")]`, 30000);
    // NETWORK: the OFFLINE icon is not — the pair is what makes this a real check
    await assertFromJavascript(page, `return !document.querySelector('[data-icon="wifi-slash"], .fa-wifi-slash');`, 30000);
    // Sanity: the runner really is online (navigator.onLine)
    await assertFromJavascript(page, `return navigator.onLine === true;`, 30000);
    // PENDING TX: no upload icon while online — the `!count` branch
    await assertFromJavascript(page, `return !document.querySelector('[data-icon="upload"], .fa-upload');`, 30000);
    // The ReactNativeWebView bridge is absent, so UploadStatusIcon cannot mount
    await assertFromJavascript(page, `return !window.ReactNativeWebView;`, 30000);
    // Open the header menu
    await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: 30000 });
    // Wait for the menu
    await wait(page, 2);
    // VERSION: the menu renders a version item
    await assertPageContains(page, `Version: `, DEFAULT_TIMEOUT);
    // VERSION: it carries the code-fork icon
    await assertElementPresent(page, `//*[@data-icon="code-fork" or contains(concat(" ", normalize-space(@class), " "), " fa-code-fork ")]`, 30000);
    // PROOF: the version has a real value — 'Version: ' + undefined renders too
    await assertFromJavascript(page, `const v = window.__mentorapm && window.__mentorapm.shortVersion;
if (!v || !String(v).trim()) return false;
// and the DOM must actually be showing that value, not just the prefix
return (document.body.innerText || '').includes('Version: ' + v);`, 30000);
    // Close the menu
    await page.keyboard.press(`Escape`);
    // SW: navigator.serviceWorker is available
    await assertFromJavascript(page, `return 'serviceWorker' in navigator;`, 15000);
    // SW: a service worker is CONTROLLING this page — not merely present
    await assertFromJavascript(page, `return !!(navigator.serviceWorker && navigator.serviceWorker.controller);`, 30000);
    // SW: kick off getRegistrations() (async — read in the next step)
    await assertFromJavascript(page, `window.__ddSW = 'pending';
try { navigator.serviceWorker.getRegistrations()
  .then(function (r) { window.__ddSW = r.length; })
  .catch(function () { window.__ddSW = -1; }); } catch (e) { window.__ddSW = -2; }
return true;`, 15000);
    // Let getRegistrations() settle
    await wait(page, 3);
    // SW: at least one service worker is REGISTERED (numeric, so a still-pending promise fails rather than passing)
    await assertFromJavascript(page, `return typeof window.__ddSW === 'number' && window.__ddSW > 0;`, 15000);
    // CREW SHORTCUT: the crew label is rendered
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mobile-crew ")]`, 30000);
    // Click the crew label beside the logo
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mobile-crew ")]`).click({ timeout: 30000 });
    // Wait for the RoleSelection modal
    await wait(page, 3);
    // PROOF: the crew shortcut opens the same RoleSelection modal as the menu
    await assertPageContains(page, `Submit`, DEFAULT_TIMEOUT);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Dismiss the modal without submitting — nothing changes
    await page.keyboard.press(`Escape`);
    // Let the modal close
    await wait(page, 2);
    // RESTORED: back on Home with the header intact
    await assertElementPresent(page, `//*[@data-icon="wifi" or contains(concat(" ", normalize-space(@class), " "), " fa-wifi ")]`, 30000);
  }
}
