// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.912_Offline_Connection_Screens.json. This file is the source now: edit it directly.
// MOB.912_Offline_Connection_Screens

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertFromJavascript, assertPageContains, click, wait } from '../../support/dd';

export async function mob912(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the home screen", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("GATE: the home screen rendered", {}, async () => {
    await assertPageContains(page, `Welcome,`, 60000);
  });
  await run.step("BASELINE: online, and the Asset Lookup tile is on Home", {}, async () => {
    await assertFromJavascript(page, `const tiles = () => [...document.querySelectorAll('img[alt^="icon for "]')].map(i => i.getAttribute('alt') || '');
return navigator.onLine === true && tiles().some(a => /Asset Lookup/i.test(a));`, 30000);
  });
  await run.step("Open Asset Lookup from its Home tile (online)", {}, async () => {
    await click(page, `//img[starts-with(@alt, "icon for ") and contains(@alt, "Asset Lookup")]`, 30000);
  });
  await run.step("Let Asset Lookup render", {}, async () => {
    await wait(page, 4);
  });
  await run.step("ONLINE HALF: Asset Lookup renders its search \u2014 no ConnectionRequired", {}, async () => {
    await assertFromJavascript(page, `return /\\/asset-lookup/.test(location.pathname) && !!document.querySelector('input[name="asset-search"]')
  && !(document.body.textContent || '').includes('This feature requires an internet connection.');`, 30000);
  });
  await run.step("Back to Home in-app (`history.back()` \u2014 no reload)", {}, async () => {
    await assertFromJavascript(page, `history.back();
return true;`, 15000);
  });
  await run.step("Let Home render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Home again, still the same page session (tile present)", {}, async () => {
    await assertFromJavascript(page, `const tiles = () => [...document.querySelectorAll('img[alt^="icon for "]')].map(i => i.getAttribute('alt') || '');
return !/\\/asset-lookup/.test(location.pathname) && tiles().some(a => /Asset Lookup/i.test(a));`, 30000);
  });
  await run.step("OVERRIDE: define an own `onLine` getter (false) on navigator \u2014 no `offline` event, so `useNetwork()` stays online", {}, async () => {
    await assertFromJavascript(page, `Object.defineProperty(navigator, 'onLine', { configurable: true, get: function () { return false; } });
return navigator.onLine === false;`, 15000);
  });
  await run.step("Open Asset Lookup from its Home tile (property offline)", {}, async () => {
    await click(page, `//img[starts-with(@alt, "icon for ") and contains(@alt, "Asset Lookup")]`, 30000);
  });
  await run.step("Let Asset Lookup render", {}, async () => {
    await wait(page, 4);
  });
  await run.step("\u2b50 OFFLINE HALF: ConnectionRequired \u2014 OFFLINE_FEATURE_MESSAGE, and no search input", {}, async () => {
    await assertFromJavascript(page, `return /\\/asset-lookup/.test(location.pathname)
  && (document.body.textContent || '').includes('This feature requires an internet connection.')
  && !document.querySelector('input[name="asset-search"]');`, 30000);
  });
  await run.step("RESTORE: remove the getter", {always: true}, async () => {
    await assertFromJavascript(page, `try { delete navigator.onLine; } catch (e) {}
return true;`, 15000);
  });
  await run.step("Navigate to the home screen (a reload discards any override)", {always: true}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let it render", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("GATE: the page rendered", {always: true}, async () => {
    await assertPageContains(page, `Welcome,`, 60000);
  });
  await run.step("RESTORED: navigator.onLine is true again", {always: true}, async () => {
    await assertFromJavascript(page, `return navigator.onLine === true;`, 15000);
  });
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the Material tab (online)", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Material")]`, 30000);
  });
  await run.step("Let the Material panel render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("ONLINE HALF: the Material panel shows its CHARGES / ESTIMATES control \u2014 no offline message", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const t = (p.textContent || '');
const segs = [...p.querySelectorAll('label, button')].map(e => (e.textContent || '').trim());
return segs.includes('CHARGES') && segs.includes('ESTIMATES') && !t.includes('Internet Connection is required to make a material charge');`, 30000);
  });
  await run.step("Switch to the Notes tab (unmounts the Material panel \u2014 `keepMounted={false}`)", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Notes")]`, 30000);
  });
  await run.step("Let the Notes panel render", {}, async () => {
    await wait(page, 1);
  });
  await run.step("OVERRIDE: define an own `onLine` getter (false) on navigator \u2014 no `offline` event, so `useNetwork()` stays online", {}, async () => {
    await assertFromJavascript(page, `Object.defineProperty(navigator, 'onLine', { configurable: true, get: function () { return false; } });
return navigator.onLine === false;`, 15000);
  });
  await run.step("Back to the Material tab (remounts it, re-reading the property)", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Material")]`, 30000);
  });
  await run.step("Let the Material panel render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 OFFLINE HALF: the panel reads `Internet Connection is required to make a material charge` \u2014 and the CHARGES control is gone", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const t = (p.textContent || '');
const segs = [...p.querySelectorAll('label, button')].map(e => (e.textContent || '').trim());
return t.includes('Internet Connection is required to make a material charge') && !segs.includes('CHARGES');`, 30000);
  });
  await run.step("RESTORE: remove the getter", {always: true}, async () => {
    await assertFromJavascript(page, `try { delete navigator.onLine; } catch (e) {}
return true;`, 15000);
  });
  await run.step("Navigate to the fixture work order (a reload discards any override)", {always: true}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let it render", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("GATE: the page rendered", {always: true}, async () => {
    await assertPageContains(page, `Status:`, 60000);
  });
  await run.step("RESTORED: navigator.onLine is true again", {always: true}, async () => {
    await assertFromJavascript(page, `return navigator.onLine === true;`, 15000);
  });
  run.finish();
}
