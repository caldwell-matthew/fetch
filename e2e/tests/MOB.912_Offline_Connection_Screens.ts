// Generated from Mobile/dd_tests_mobile/MOB.912_Offline_Connection_Screens.json by to_playwright.py — do not edit by hand yet.
// MOB.912_Offline_Connection_Screens

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertFromJavascript, assertPageContains, el, wait } from '../support/dd';

export async function mob912(page: Page): Promise<void> {
  try {
    // Navigate to the home screen
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`);
    // Let home render
    await wait(page, 4);
    // GATE: the home screen rendered
    await assertPageContains(page, `Welcome,`, 60000);
    // BASELINE: online, and the Asset Lookup tile is on Home
    await assertFromJavascript(page, `const tiles = () => [...document.querySelectorAll('img[alt^="icon for "]')].map(i => i.getAttribute('alt') || '');
return navigator.onLine === true && tiles().some(a => /Asset Lookup/i.test(a));`, 30000);
    // Open Asset Lookup from its Home tile (online)
    await el(page, `//img[starts-with(@alt, "icon for ") and contains(@alt, "Asset Lookup")]`).click({ timeout: 30000 });
    // Let Asset Lookup render
    await wait(page, 4);
    // ONLINE HALF: Asset Lookup renders its search — no ConnectionRequired
    await assertFromJavascript(page, `return /\\/asset-lookup/.test(location.pathname) && !!document.querySelector('input[name="asset-search"]')
  && !(document.body.textContent || '').includes('This feature requires an internet connection.');`, 30000);
    // Back to Home in-app (`history.back()` — no reload)
    await assertFromJavascript(page, `history.back();
return true;`, 15000);
    // Let Home render
    await wait(page, 3);
    // Home again, still the same page session (tile present)
    await assertFromJavascript(page, `const tiles = () => [...document.querySelectorAll('img[alt^="icon for "]')].map(i => i.getAttribute('alt') || '');
return !/\\/asset-lookup/.test(location.pathname) && tiles().some(a => /Asset Lookup/i.test(a));`, 30000);
    // OVERRIDE: define an own `onLine` getter (false) on navigator — no `offline` event, so `useNetwork()` stays online
    await assertFromJavascript(page, `Object.defineProperty(navigator, 'onLine', { configurable: true, get: function () { return false; } });
return navigator.onLine === false;`, 15000);
    // Open Asset Lookup from its Home tile (property offline)
    await el(page, `//img[starts-with(@alt, "icon for ") and contains(@alt, "Asset Lookup")]`).click({ timeout: 30000 });
    // Let Asset Lookup render
    await wait(page, 4);
    // ⭐ OFFLINE HALF: ConnectionRequired — OFFLINE_FEATURE_MESSAGE, and no search input
    await assertFromJavascript(page, `return /\\/asset-lookup/.test(location.pathname)
  && (document.body.textContent || '').includes('This feature requires an internet connection.')
  && !document.querySelector('input[name="asset-search"]');`, 30000);
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the Material tab (online)
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Material")]`).click({ timeout: 30000 });
    // Let the Material panel render
    await wait(page, 2);
    // ONLINE HALF: the Material panel shows its CHARGES / ESTIMATES control — no offline message
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const t = (p.textContent || '');
const segs = [...p.querySelectorAll('label, button')].map(e => (e.textContent || '').trim());
return segs.includes('CHARGES') && segs.includes('ESTIMATES') && !t.includes('Internet Connection is required to make a material charge');`, 30000);
    // Switch to the Notes tab (unmounts the Material panel — `keepMounted={false}`)
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Notes")]`).click({ timeout: 30000 });
    // Let the Notes panel render
    await wait(page, 1);
    // OVERRIDE: define an own `onLine` getter (false) on navigator — no `offline` event, so `useNetwork()` stays online
    await assertFromJavascript(page, `Object.defineProperty(navigator, 'onLine', { configurable: true, get: function () { return false; } });
return navigator.onLine === false;`, 15000);
    // Back to the Material tab (remounts it, re-reading the property)
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Material")]`).click({ timeout: 30000 });
    // Let the Material panel render
    await wait(page, 2);
    // ⭐ OFFLINE HALF: the panel reads `Internet Connection is required to make a material charge` — and the CHARGES control is gone
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const t = (p.textContent || '');
const segs = [...p.querySelectorAll('label, button')].map(e => (e.textContent || '').trim());
return t.includes('Internet Connection is required to make a material charge') && !segs.includes('CHARGES');`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // RESTORE: remove the getter
    await assertFromJavascript(page, `try { delete navigator.onLine; } catch (e) {}
return true;`, 15000);
    // Navigate to the home screen (a reload discards any override)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`);
    // Let it render
    await wait(page, 3);
    // GATE: the page rendered
    await assertPageContains(page, `Welcome,`, 60000);
    // RESTORED: navigator.onLine is true again
    await assertFromJavascript(page, `return navigator.onLine === true;`, 15000);
    // RESTORE: remove the getter
    await assertFromJavascript(page, `try { delete navigator.onLine; } catch (e) {}
return true;`, 15000);
    // Navigate to the fixture work order (a reload discards any override)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let it render
    await wait(page, 3);
    // GATE: the page rendered
    await assertPageContains(page, `Status:`, 60000);
    // RESTORED: navigator.onLine is true again
    await assertFromJavascript(page, `return navigator.onLine === true;`, 15000);
  }
}
