// Generated from Mobile/dd_tests_mobile/MOB.910_Offline_UI.json by to_playwright.py — do not edit by hand yet.
// MOB.910_Offline_UI

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertFromJavascript, assertPageContains, click, press, wait } from '../support/dd';

export async function mob910(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the home screen", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let home render", {}, async () => {
    await wait(page, 4);
  });
  await run.step("GATE: the home screen rendered", {}, async () => {
    await assertPageContains(page, `Welcome,`, 60000);
  });
  await run.step("BASELINE: the ONLINE wifi icon is showing", {}, async () => {
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi"]') && !document.querySelector('[data-icon="wifi-slash"]');`, 30000);
  });
  await run.step("BASELINE: the Asset Lookup TILE is present on Home", {}, async () => {
    await assertFromJavascript(page, `const tiles = () => [...document.querySelectorAll('img[alt^="icon for "]')].map(i => i.getAttribute('alt') || '');
return tiles().some(a => /Asset Lookup/i.test(a));`, 30000);
  });
  await run.step("Open the menu", {}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, 30000);
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 2);
  });
  await run.step("BASELINE: the Asset Lookup MENU ITEM is present", {}, async () => {
    await assertFromJavascript(page, `const items = () => [...document.querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
return items().some(t => /^Asset Lookup$/.test(t));`, 30000);
  });
  await run.step("Close the menu", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the menu close", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Dispatch a window 'offline' event", {}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
  });
  await run.step("Let React re-render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("POSITIVE: the offline icon (wifi-slash) is now showing", {always: true}, async () => {
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi-slash"]');`, 30000);
  });
  await run.step("POSITIVE: the online icon is gone \u2014 the swap really happened", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.querySelector('[data-icon="wifi"]');`, 30000);
  });
  await run.step("NEGATIVE: the Asset Lookup TILE is hidden (Home gates it on `online`)", {always: true}, async () => {
    await assertFromJavascript(page, `const tiles = () => [...document.querySelectorAll('img[alt^="icon for "]')].map(i => i.getAttribute('alt') || '');
return !tiles().some(a => /Asset Lookup/i.test(a));`, 30000);
  });
  await run.step("NEGATIVE: the other tiles are STILL there \u2014 only the online-gated one went", {always: true}, async () => {
    await assertFromJavascript(page, `const tiles = () => [...document.querySelectorAll('img[alt^="icon for "]')].map(i => i.getAttribute('alt') || '');
return tiles().length >= 3;`, 30000);
  });
  await run.step("Open the menu again", {always: true}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, 30000);
  });
  await run.step("Let the menu open", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("NEGATIVE: the Asset Lookup MENU ITEM is hidden while offline", {always: true}, async () => {
    await assertFromJavascript(page, `const items = () => [...document.querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
if (!items().length) return false;
return !items().some(t => /^Asset Lookup$/.test(t));`, 30000);
  });
  await run.step("The rest of the menu is intact \u2014 this is gating, not a broken render", {always: true}, async () => {
    await assertFromJavascript(page, `const items = () => [...document.querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
return items().some(t => /Work Orders|Transaction Log/.test(t));`, 30000);
  });
  await run.step("Close the menu", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the menu close", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("LIMIT: navigator.onLine is STILL true \u2014 this proves UI reaction, NOT the queue", {always: true}, async () => {
    await assertFromJavascript(page, `return navigator.onLine === true;`, 15000);
  });
  await run.step("Dispatch a window 'online' event", {always: true}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
  });
  await run.step("Let React re-render", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("RESTORED: the online wifi icon is back and wifi-slash is gone", {always: true}, async () => {
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi"]') && !document.querySelector('[data-icon="wifi-slash"]');`, 30000);
  });
  await run.step("RESTORED: the Asset Lookup tile is back on Home", {always: true}, async () => {
    await assertFromJavascript(page, `const tiles = () => [...document.querySelectorAll('img[alt^="icon for "]')].map(i => i.getAttribute('alt') || '');
return tiles().some(a => /Asset Lookup/i.test(a));`, 30000);
  });
  run.finish();
}
