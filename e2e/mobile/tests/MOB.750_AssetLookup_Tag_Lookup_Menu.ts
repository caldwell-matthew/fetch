// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.750_AssetLookup_Tag_Lookup_Menu.json. This file is the source now: edit it directly.
// MOB.750_AssetLookup_Tag_Lookup_Menu

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, press, wait } from '../../support/dd';

export async function mob750(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to asset lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the \"Asset Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
  });
  await run.step("The `Tag Lookup` button renders", {}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Tag Lookup"]`, 30000);
  });
  await run.step("PRECONDITION: this is a browser, not the native shell \u2014 `Alphanumeric` takes its file-dialog branch", {}, async () => {
    await assertFromJavascript(page, `return !window.ReactNativeWebView;`, 30000);
  });
  await run.step("STUB: record file-input clicks instead of opening a file chooser", {}, async () => {
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
  });
  await run.step("Open the `Tag Lookup` menu", {}, async () => {
    await click(page, `//button[normalize-space(.)="Tag Lookup"]`, 30000);
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("\u2b50 MENU: exactly `Scan Barcode` then `Alphanumeric`", {}, async () => {
    await assertFromJavascript(page, `const menu = document.querySelector('[role="menu"]');
const items = menu ? [...menu.querySelectorAll('[role="menuitem"]')]
  .map(i => (i.textContent || '').trim()) : [];
return JSON.stringify(items) === "[\\"Scan Barcode\\",\\"Alphanumeric\\"]";`, 30000);
  });
  await run.step("Click `Alphanumeric`", {}, async () => {
    await click(page, `//*[@role="menuitem"][normalize-space(.)="Alphanumeric"]`, 30000);
  });
  await run.step("Let the click handler run", {}, async () => {
    await wait(page, 1);
  });
  await run.step("\u2b50 ALPHANUMERIC (browser): exactly ONE file dialog was requested", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const c = window.__ddFileClicks || [];
return c.length === 1 && c[0].attached === true;`, 30000);
  });
  await run.step("\u2b50 \u2026asking for the REAR camera (`capture=environment`)", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const c = window.__ddFileClicks || [];
return c.length === 1 && c[0].capture === 'environment';`, 30000);
  });
  await run.step("\u2026for images only, one file", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const c = window.__ddFileClicks || [];
return c.length === 1 && c[0].accept === 'image/*' && c[0].multiple === false;`, 30000);
  });
  await run.step("\u2026and the menu STAYED OPEN (`closeMenuOnClick={false}`)", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const menu = document.querySelector('[role="menu"]');
const items = menu ? [...menu.querySelectorAll('[role="menuitem"]')]
  .map(i => (i.textContent || '').trim()) : [];
return items.includes('Alphanumeric');`, 30000);
  });
  await run.step("Close the menu", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the menu close", {}, async () => {
    await wait(page, 1);
  });
  await run.step("The menu closed", {}, async () => {
    await assertFromJavascript(page, `return !document.querySelector('[role="menu"]');`, 30000);
  });
  await run.step("Reopen the `Tag Lookup` menu", {allow: 'ignore'}, async () => {
    await click(page, `//button[normalize-space(.)="Tag Lookup"]`, 30000);
  });
  await run.step("Let the menu open", {allow: 'ignore'}, async () => {
    await wait(page, 1);
  });
  await run.step("Click `Scan Barcode`", {allow: 'ignore'}, async () => {
    await click(page, `//*[@role="menuitem"][normalize-space(.)="Scan Barcode"]`, 30000);
  });
  await run.step("Give it time to show anything at all", {allow: 'ignore'}, async () => {
    await wait(page, 3);
  });
  await run.step("SENTINEL (bugs \u00a737): `Scan Barcode` in a browser does NOTHING \u2014 the menu closed, no dialog, no toast, no file dialog, still on Asset Lookup. Red here means it was fixed: rewrite this step", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const dialog = document.querySelector('[role="dialog"]');
const toast = document.querySelector('.Toastify__toast');
return !document.querySelector('[role="menu"]') && !dialog && !toast
  && window.location.pathname.endsWith('/asset-lookup')
  && (window.__ddFileClicks || []).length === 1;`, 30000);
  });
  await run.step("RESTORE: put `HTMLInputElement.prototype.click` back", {always: true}, async () => {
    await assertFromJavascript(page, `const proto = window.HTMLInputElement.prototype;
if (proto.click.__dd) {
  if (window.__ddHadOwnClick) proto.click = window.__ddOrigClick;
  else delete proto.click;
}
return true;`, 30000);
  });
  await run.step("RESTORED: inputs click with the ORIGINAL `click` again \u2014 no recorder left for a later child", {always: true}, async () => {
    await assertFromJavascript(page, `const proto = window.HTMLInputElement.prototype;
const ok = !proto.click.__dd
  && (window.__ddOrigClick ? proto.click === window.__ddOrigClick : true);
delete window.__ddOrigClick; delete window.__ddFileClicks; delete window.__ddHadOwnClick;
return ok;`, 30000);
  });
  run.finish();
}
