// Generated from legacy/Mobile/dd_tests_mobile/MOB.626_Collector_Capture_Options.json by to_playwright.py — do not edit by hand yet.
// MOB.626_Collector_Capture_Options

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, uploadStandIn, wait } from '../support/dd';

export async function mob626(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the asset collector", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the collector to load its lookup cache", {}, async () => {
    await wait(page, 15);
  });
  await run.step("The collector page rendered", {}, async () => {
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, 30000);
  });
  await run.step("Open the new-asset form (affixed + button)", {}, async () => {
    await click(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`, 30000);
  });
  await run.step("The new-asset form opened", {}, async () => {
    await assertElementPresent(page, `//button[@form="asset-collector"]`, 30000);
  });
  await run.step("BASELINE: the form holds NO photo yet, and both capture icons are present", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
return !!f && f.querySelectorAll('[class*="mantine-Carousel-slide"]').length === 0
  && !!f.querySelector('svg[data-icon="barcode-read"]')
  && !!f.querySelector('svg[data-icon="wand-magic-sparkles"]');`, 30000);
  });
  await run.step("Open the tag capture menu (its `barcode-read` icon beside the field)", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
const svg = f && f.querySelector('svg[data-icon="barcode-read"]');
const b = svg && svg.closest('button');
if (!b) return false;
b.click();
return true;`, 30000);
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("\u2b50 TAG menu, browser branch: `Hello, what would you like to do?` and EXACTLY `Add Asset Photo` (no native `Take Photo`/`Select From Gallery`, no `Use photo\u2026` without a photo)", {}, async () => {
    await assertFromJavascript(page, `const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
return !!items && items.length === 1 && items[0] === 'Add Asset Photo';`, 20000);
  });
  await run.step("Close the menu by clicking the form's title (NOT Escape \u2014 bugs \u00a713)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-title ")]`, 30000);
  });
  await run.step("Let it close", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("The capture menu is closed, and the form is still open", {always: true}, async () => {
    await assertFromJavascript(page, `const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
return !dd && !!document.getElementById('asset-collector');`, 15000);
  });
  await run.step("Open the description capture menu (its `wand-magic-sparkles` icon beside the field)", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
const svg = f && f.querySelector('svg[data-icon="wand-magic-sparkles"]');
const b = svg && svg.closest('button');
if (!b) return false;
b.click();
return true;`, 30000);
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("\u2b50 DESCRIPTION menu, browser branch: `Hello, what would you like to do?` and EXACTLY `Add Asset Photo`", {}, async () => {
    await assertFromJavascript(page, `const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
return !!items && items.length === 1 && items[0] === 'Add Asset Photo';`, 20000);
  });
  await run.step("Close the menu by clicking the form's title (NOT Escape \u2014 bugs \u00a713)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-title ")]`, 30000);
  });
  await run.step("Let it close", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("The capture menu is closed, and the form is still open", {always: true}, async () => {
    await assertFromJavascript(page, `const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
return !dd && !!document.getElementById('asset-collector');`, 15000);
  });
  await run.step("Open the form's photo picker (\"Add Asset Photo\" button)", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add Asset Photo"]`, 30000);
  });
  await run.step("The picker opened", {}, async () => {
    await assertPageContains(page, `Select Photo Source`, 30000);
  });
  await run.step("Reveal the hidden gallery input (clearing any stale tag)", {}, async () => {
    await assertFromJavascript(page, `document.querySelectorAll('[data-dd-upload]')
  .forEach(n => n.removeAttribute('data-dd-upload'));
const inputs = [...document.querySelectorAll('input[type="file"]')];
const el = inputs.find(i => !i.capture);
if (!el) return false;
el.setAttribute('data-dd-upload', '1');
Object.assign(el.style, {
  display: 'block', opacity: '1', position: 'fixed',
  top: '0', left: '0', width: '240px', height: '40px', zIndex: '99999'
});
return true;
`, DEFAULT_TIMEOUT);
  });
  await run.step("Upload one photo (MOB.600's bucketKey, copied \u2014 trap 12)", {}, async () => {
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
  });
  await run.step("The picker closed itself once the file arrived", {}, async () => {
    await assertPageLacks(page, `Select Photo Source`, 30000);
  });
  await run.step("Let the reducer take the photo", {}, async () => {
    await wait(page, 4);
  });
  await run.step("The form now holds ONE photo", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
return !!f && f.querySelectorAll('[class*="mantine-Carousel-slide"]').length === 1;`, 30000);
  });
  await run.step("Open the description capture menu (its `wand-magic-sparkles` icon beside the field)", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
const svg = f && f.querySelector('svg[data-icon="wand-magic-sparkles"]');
const b = svg && svg.closest('button');
if (!b) return false;
b.click();
return true;`, 30000);
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("\u2b50 DESCRIPTION menu with a photo: `Add Asset Photo` + `Use photo selected above` (`photoList.length > 0`)", {}, async () => {
    await assertFromJavascript(page, `const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
return !!items && items.length === 2 && items[0] === 'Add Asset Photo'
  && items[1] === 'Use photo selected above';`, 20000);
  });
  await run.step("\u2026and `Use photo selected above` is ENABLED for the selected photo (soft)", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Menu-item')]
  .find(i => (i.textContent || '').trim() === 'Use photo selected above');
return !!it && !it.hasAttribute('data-disabled') && !it.disabled;`, 15000);
  });
  await run.step("Close the menu by clicking the form's title (NOT Escape \u2014 bugs \u00a713)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-title ")]`, 30000);
  });
  await run.step("Let it close", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("The capture menu is closed, and the form is still open", {always: true}, async () => {
    await assertFromJavascript(page, `const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
return !dd && !!document.getElementById('asset-collector');`, 15000);
  });
  await run.step("Go OFFLINE \u2014 dispatch a window `offline` event", {}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
  });
  await run.step("Let the form re-render offline", {}, async () => {
    await wait(page, 2);
  });
  await run.step("OFFLINE: the header shows the offline icon (`wifi-slash`)", {}, async () => {
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi-slash"]');`, 20000);
  });
  await run.step("Click the description wand (its offline branch only opens a message)", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
const svg = f && f.querySelector('svg[data-icon="wand-magic-sparkles"]');
const b = svg && svg.closest('button, [role="button"], .mantine-ActionIcon-root');
if (!b) return false;
b.click();
return true;`, 30000);
  });
  await run.step("Let the popover open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("\u2b50 OFFLINE: the wand's popover reads `This feature requires an internet connection.`", {}, async () => {
    await assertPageContains(page, `This feature requires an internet connection.`, 20000);
  });
  await run.step("Close the popover by clicking the form's title (NOT Escape \u2014 bugs \u00a713)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-title ")]`, 30000);
  });
  await run.step("Let it close", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Open the tag capture menu (its `barcode-read` icon beside the field)", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
const svg = f && f.querySelector('svg[data-icon="barcode-read"]');
const b = svg && svg.closest('button');
if (!b) return false;
b.click();
return true;`, 30000);
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("\ud83d\uded1 GUARD + record + click `Add Asset Photo` \u2014 ONLY while the offline icon shows (online it opens a file dialog)", {}, async () => {
    await assertFromJavascript(page, `if (!document.querySelector('[data-icon="wifi-slash"]')) return false;
window.__dd626Seen = 0;
new MutationObserver(() => { if ((document.body.textContent || '').includes('This feature requires an internet connection.')) window.__dd626Seen++; })
  .observe(document.body, { childList: true, subtree: true, characterData: true });
const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
const it = dd && [...dd.querySelectorAll('.mantine-Menu-item')]
  .find(i => (i.textContent || '').trim() === 'Add Asset Photo');
if (!it) return false;
it.click();
return true;`, 30000);
  });
  await run.step("Let the popover open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("\u2b50 OFFLINE: `Add Asset Photo` rendered OFFLINE_FEATURE_MESSAGE (recorded by the observer), not a file dialog", {}, async () => {
    await assertFromJavascript(page, `return (window.__dd626Seen || 0) > 0;`, 20000);
  });
  await run.step("\ud83d\udcca (optional) the message is still on screen once the menu has closed \u2014 red while bugs \u00a743 is open (it flashes and unmounts with the menu)", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Menu-dropdown')
  && (document.body.textContent || '').includes('This feature requires an internet connection.');`, 5000);
  });
  await run.step("Back ONLINE \u2014 dispatch a window `online` event (always)", {always: true}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
  });
  await run.step("Let the form re-render online", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Close the menu by clicking the form's title (NOT Escape \u2014 bugs \u00a713)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-title ")]`, 30000);
  });
  await run.step("Let it close", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("The capture menu is closed, and the form is still open", {always: true}, async () => {
    await assertFromJavascript(page, `const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
return !dd && !!document.getElementById('asset-collector');`, 15000);
  });
  await run.step("Close the form with its X \u2014 DISCARDING the photo, never submitting", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`, 30000);
  });
  await run.step("Let the form close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: the form is gone, so the photo was discarded unsent", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.getElementById('asset-collector');`, 30000);
  });
  run.finish();
}
