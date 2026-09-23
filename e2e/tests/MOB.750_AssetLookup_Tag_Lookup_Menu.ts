// Generated from Mobile/dd_tests_mobile/MOB.750_AssetLookup_Tag_Lookup_Menu.json by to_playwright.py — do not edit by hand yet.
// MOB.750_AssetLookup_Tag_Lookup_Menu

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementContent, assertElementPresent, assertFromJavascript, el, optional, wait } from '../support/dd';

export async function mob750(page: Page): Promise<void> {
  const soft = new Soft();
  try {
    // Navigate to asset lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Let the page render
    await wait(page, 3);
    // Test the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
    // The `Tag Lookup` button renders
    await assertElementPresent(page, `//button[normalize-space(.)="Tag Lookup"]`, 30000);
    // PRECONDITION: this is a browser, not the native shell — `Alphanumeric` takes its file-dialog branch
    await assertFromJavascript(page, `return !window.ReactNativeWebView;`, 30000);
    // STUB: record file-input clicks instead of opening a file chooser
    await assertFromJavascript(page, `const proto = window.HTMLInputElement.prototype;
if (!proto.click.__dd) {
  window.__ddHadOwnClick = Object.prototype.hasOwnProperty.call(proto, 'click');
  window.__ddOrigClick = proto.click;
  window.__ddFileClicks = [];
  const rec = function () {
    if (this.type === 'file') {
      window.__ddFileClicks.push({ capture: this.capture || this.getAttribute('capture'),
        accept: this.accept, multiple: this.multiple,
        attached: window.document.body.contains(this) });
      return;
    }
    return window.__ddOrigClick.call(this);
  };
  rec.__dd = true;
  proto.click = rec;
}
return proto.click.__dd === true
  && Array.isArray(window.__ddFileClicks) && window.__ddFileClicks.length === 0;`, 30000);
    // Open the `Tag Lookup` menu
    await el(page, `//button[normalize-space(.)="Tag Lookup"]`).click({ timeout: 30000 });
    // Let the menu open
    await wait(page, 1);
    // ⭐ MENU: exactly `Scan Barcode` then `Alphanumeric`
    await assertFromJavascript(page, `const menu = document.querySelector('[role="menu"]');
const items = menu ? [...menu.querySelectorAll('[role="menuitem"]')]
  .map(i => (i.textContent || '').trim()) : [];
return JSON.stringify(items) === "[\\"Scan Barcode\\",\\"Alphanumeric\\"]";`, 30000);
    // Click `Alphanumeric`
    await el(page, `//*[@role="menuitem"][normalize-space(.)="Alphanumeric"]`).click({ timeout: 30000 });
    // Let the click handler run
    await wait(page, 1);
    await soft.run("\u2b50 ALPHANUMERIC (browser): exactly ONE file dialog was requested", async () => {
      await assertFromJavascript(page, `const c = window.__ddFileClicks || [];
return c.length === 1 && c[0].attached === true;`, 30000);
    });
    await soft.run("\u2b50 \u2026asking for the REAR camera (`capture=environment`)", async () => {
      await assertFromJavascript(page, `const c = window.__ddFileClicks || [];
return c.length === 1 && c[0].capture === 'environment';`, 30000);
    });
    await soft.run("\u2026for images only, one file", async () => {
      await assertFromJavascript(page, `const c = window.__ddFileClicks || [];
return c.length === 1 && c[0].accept === 'image/*' && c[0].multiple === false;`, 30000);
    });
    await soft.run("\u2026and the menu STAYED OPEN (`closeMenuOnClick={false}`)", async () => {
      await assertFromJavascript(page, `const menu = document.querySelector('[role="menu"]');
const items = menu ? [...menu.querySelectorAll('[role="menuitem"]')]
  .map(i => (i.textContent || '').trim()) : [];
return items.includes('Alphanumeric');`, 30000);
    });
    // Close the menu
    await page.keyboard.press(`Escape`);
    // Let the menu close
    await wait(page, 1);
    // The menu closed
    await assertFromJavascript(page, `return !document.querySelector('[role="menu"]');`, 30000);
    await optional("Reopen the `Tag Lookup` menu", async () => {
      await el(page, `//button[normalize-space(.)="Tag Lookup"]`).click({ timeout: 30000 });
    });
    await optional("Let the menu open", async () => {
      await wait(page, 1);
    });
    await optional("Click `Scan Barcode`", async () => {
      await el(page, `//*[@role="menuitem"][normalize-space(.)="Scan Barcode"]`).click({ timeout: 30000 });
    });
    await optional("Give it time to show anything at all", async () => {
      await wait(page, 3);
    });
    await optional("SENTINEL (bugs \u00a737): `Scan Barcode` in a browser does NOTHING \u2014 the menu closed, no dialog, no toast, no file dialog, still on Asset Lookup. Red here means it was fixed: rewrite this step", async () => {
      await assertFromJavascript(page, `const dialog = document.querySelector('[role="dialog"]');
const toast = document.querySelector('.Toastify__toast');
return !document.querySelector('[role="menu"]') && !dialog && !toast
  && window.location.pathname.endsWith('/asset-lookup')
  && (window.__ddFileClicks || []).length === 1;`, 30000);
    });
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // RESTORE: put `HTMLInputElement.prototype.click` back
    await assertFromJavascript(page, `const proto = window.HTMLInputElement.prototype;
if (proto.click.__dd) {
  if (window.__ddHadOwnClick) proto.click = window.__ddOrigClick;
  else delete proto.click;
}
return true;`, 30000);
    // RESTORED: inputs click with the ORIGINAL `click` again — no recorder left for a later child
    await assertFromJavascript(page, `const proto = window.HTMLInputElement.prototype;
const ok = !proto.click.__dd
  && (window.__ddOrigClick ? proto.click === window.__ddOrigClick : true);
delete window.__ddOrigClick; delete window.__ddFileClicks; delete window.__ddHadOwnClick;
return ok;`, 30000);
  }
  soft.check();
}
