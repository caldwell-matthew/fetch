// Generated from Mobile/dd_tests_mobile/MOB.910_Offline_UI.json by to_playwright.py — do not edit by hand yet.
// MOB.910_Offline_UI

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertFromJavascript, assertPageContains, el, wait } from '../support/dd';

export async function mob910(page: Page): Promise<void> {
  try {
    // Navigate to the home screen
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`);
    // Let home render
    await wait(page, 4);
    // GATE: the home screen rendered
    await assertPageContains(page, `Welcome,`, 60000);
    // BASELINE: the ONLINE wifi icon is showing
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi"]') && !document.querySelector('[data-icon="wifi-slash"]');`, 30000);
    // BASELINE: the Asset Lookup TILE is present on Home
    await assertFromJavascript(page, `const tiles = () => [...document.querySelectorAll('img[alt^="icon for "]')].map(i => i.getAttribute('alt') || '');
return tiles().some(a => /Asset Lookup/i.test(a));`, 30000);
    // Open the menu
    await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: 30000 });
    // Let the menu open
    await wait(page, 2);
    // BASELINE: the Asset Lookup MENU ITEM is present
    await assertFromJavascript(page, `const items = () => [...document.querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
return items().some(t => /^Asset Lookup$/.test(t));`, 30000);
    // Close the menu
    await page.keyboard.press(`Escape`);
    // Let the menu close
    await wait(page, 1);
    // Dispatch a window 'offline' event
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
    // Let React re-render
    await wait(page, 3);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // POSITIVE: the offline icon (wifi-slash) is now showing
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi-slash"]');`, 30000);
    // POSITIVE: the online icon is gone — the swap really happened
    await assertFromJavascript(page, `return !document.querySelector('[data-icon="wifi"]');`, 30000);
    // NEGATIVE: the Asset Lookup TILE is hidden (Home gates it on `online`)
    await assertFromJavascript(page, `const tiles = () => [...document.querySelectorAll('img[alt^="icon for "]')].map(i => i.getAttribute('alt') || '');
return !tiles().some(a => /Asset Lookup/i.test(a));`, 30000);
    // NEGATIVE: the other tiles are STILL there — only the online-gated one went
    await assertFromJavascript(page, `const tiles = () => [...document.querySelectorAll('img[alt^="icon for "]')].map(i => i.getAttribute('alt') || '');
return tiles().length >= 3;`, 30000);
    // Open the menu again
    await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: 30000 });
    // Let the menu open
    await wait(page, 2);
    // NEGATIVE: the Asset Lookup MENU ITEM is hidden while offline
    await assertFromJavascript(page, `const items = () => [...document.querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
if (!items().length) return false;
return !items().some(t => /^Asset Lookup$/.test(t));`, 30000);
    // The rest of the menu is intact — this is gating, not a broken render
    await assertFromJavascript(page, `const items = () => [...document.querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
return items().some(t => /Work Orders|Transaction Log/.test(t));`, 30000);
    // Close the menu
    await page.keyboard.press(`Escape`);
    // Let the menu close
    await wait(page, 1);
    // LIMIT: navigator.onLine is STILL true — this proves UI reaction, NOT the queue
    await assertFromJavascript(page, `return navigator.onLine === true;`, 15000);
    // Dispatch a window 'online' event
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
    // Let React re-render
    await wait(page, 3);
    // RESTORED: the online wifi icon is back and wifi-slash is gone
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi"]') && !document.querySelector('[data-icon="wifi-slash"]');`, 30000);
    // RESTORED: the Asset Lookup tile is back on Home
    await assertFromJavascript(page, `const tiles = () => [...document.querySelectorAll('img[alt^="icon for "]')].map(i => i.getAttribute('alt') || '');
return tiles().some(a => /Asset Lookup/i.test(a));`, 30000);
  }
}
