// Generated from Mobile/dd_tests_mobile/MOB.626_Collector_Capture_Options.json by to_playwright.py — do not edit by hand yet.
// MOB.626_Collector_Capture_Options

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, uploadStandIn, wait } from '../support/dd';

export async function mob626(page: Page): Promise<void> {
  const soft = new Soft();
  try {
    // Navigate to the asset collector
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`);
    // Wait for the collector to load its lookup cache
    await wait(page, 15);
    // The collector page rendered
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, 30000);
    // Open the new-asset form (affixed + button)
    await el(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`).click({ timeout: 30000 });
    // The new-asset form opened
    await assertElementPresent(page, `//button[@form="asset-collector"]`, 30000);
    // BASELINE: the form holds NO photo yet, and both capture icons are present
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
return !!f && f.querySelectorAll('[class*="mantine-Carousel-slide"]').length === 0
  && !!f.querySelector('svg[data-icon="barcode-read"]')
  && !!f.querySelector('svg[data-icon="wand-magic-sparkles"]');`, 30000);
    // Open the tag capture menu (its `barcode-read` icon beside the field)
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
const svg = f && f.querySelector('svg[data-icon="barcode-read"]');
const b = svg && svg.closest('button');
if (!b) return false;
b.click();
return true;`, 30000);
    // Let the menu open
    await wait(page, 1);
    // ⭐ TAG menu, browser branch: `Hello, what would you like to do?` and EXACTLY `Add Asset Photo` (no native `Take Photo`/`Select From Gallery`, no `Use photo…` without a photo)
    await assertFromJavascript(page, `const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
return !!items && items.length === 1 && items[0] === 'Add Asset Photo';`, 20000);
    // Open the description capture menu (its `wand-magic-sparkles` icon beside the field)
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
const svg = f && f.querySelector('svg[data-icon="wand-magic-sparkles"]');
const b = svg && svg.closest('button');
if (!b) return false;
b.click();
return true;`, 30000);
    // Let the menu open
    await wait(page, 1);
    // ⭐ DESCRIPTION menu, browser branch: `Hello, what would you like to do?` and EXACTLY `Add Asset Photo`
    await assertFromJavascript(page, `const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
return !!items && items.length === 1 && items[0] === 'Add Asset Photo';`, 20000);
    // Open the form's photo picker ("Add Asset Photo" button)
    await el(page, `//button[normalize-space(.)="Add Asset Photo"]`).click({ timeout: 30000 });
    // The picker opened
    await assertPageContains(page, `Select Photo Source`, 30000);
    // Reveal the hidden gallery input (clearing any stale tag)
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
    // Upload one photo (MOB.600's bucketKey, copied — trap 12)
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
    // The picker closed itself once the file arrived
    await assertPageLacks(page, `Select Photo Source`, 30000);
    // Let the reducer take the photo
    await wait(page, 4);
    // The form now holds ONE photo
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
return !!f && f.querySelectorAll('[class*="mantine-Carousel-slide"]').length === 1;`, 30000);
    // Open the description capture menu (its `wand-magic-sparkles` icon beside the field)
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
const svg = f && f.querySelector('svg[data-icon="wand-magic-sparkles"]');
const b = svg && svg.closest('button');
if (!b) return false;
b.click();
return true;`, 30000);
    // Let the menu open
    await wait(page, 1);
    // ⭐ DESCRIPTION menu with a photo: `Add Asset Photo` + `Use photo selected above` (`photoList.length > 0`)
    await assertFromJavascript(page, `const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
return !!items && items.length === 2 && items[0] === 'Add Asset Photo'
  && items[1] === 'Use photo selected above';`, 20000);
    await soft.run("\u2026and `Use photo selected above` is ENABLED for the selected photo (soft)", async () => {
      await assertFromJavascript(page, `const it = [...document.querySelectorAll('.mantine-Menu-item')]
  .find(i => (i.textContent || '').trim() === 'Use photo selected above');
return !!it && !it.hasAttribute('data-disabled') && !it.disabled;`, 15000);
    });
    // Go OFFLINE — dispatch a window `offline` event
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
    // Let the form re-render offline
    await wait(page, 2);
    // OFFLINE: the header shows the offline icon (`wifi-slash`)
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi-slash"]');`, 20000);
    // Click the description wand (its offline branch only opens a message)
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
const svg = f && f.querySelector('svg[data-icon="wand-magic-sparkles"]');
const b = svg && svg.closest('button, [role="button"], .mantine-ActionIcon-root');
if (!b) return false;
b.click();
return true;`, 30000);
    // Let the popover open
    await wait(page, 1);
    // ⭐ OFFLINE: the wand's popover reads `This feature requires an internet connection.`
    await assertPageContains(page, `This feature requires an internet connection.`, 20000);
    // Close the popover by clicking the form's title (NOT Escape — bugs §13)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-title ")]`).click({ timeout: 30000 });
    // Let it close
    await wait(page, 1);
    // Open the tag capture menu (its `barcode-read` icon beside the field)
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
const svg = f && f.querySelector('svg[data-icon="barcode-read"]');
const b = svg && svg.closest('button');
if (!b) return false;
b.click();
return true;`, 30000);
    // Let the menu open
    await wait(page, 1);
    // 🛑 GUARD + record + click `Add Asset Photo` — ONLY while the offline icon shows (online it opens a file dialog)
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
    // Let the popover open
    await wait(page, 1);
    // ⭐ OFFLINE: `Add Asset Photo` rendered OFFLINE_FEATURE_MESSAGE (recorded by the observer), not a file dialog
    await assertFromJavascript(page, `return (window.__dd626Seen || 0) > 0;`, 20000);
    await optional("\ud83d\udcca (optional) the message is still on screen once the menu has closed \u2014 red while bugs \u00a743 is open (it flashes and unmounts with the menu)", async () => {
      await assertFromJavascript(page, `return !document.querySelector('.mantine-Menu-dropdown')
  && (document.body.textContent || '').includes('This feature requires an internet connection.');`, 5000);
    });
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Close the menu by clicking the form's title (NOT Escape — bugs §13)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-title ")]`).click({ timeout: 30000 });
    // Let it close
    await wait(page, 1);
    // The capture menu is closed, and the form is still open
    await assertFromJavascript(page, `const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
return !dd && !!document.getElementById('asset-collector');`, 15000);
    // Close the menu by clicking the form's title (NOT Escape — bugs §13)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-title ")]`).click({ timeout: 30000 });
    // Let it close
    await wait(page, 1);
    // The capture menu is closed, and the form is still open
    await assertFromJavascript(page, `const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
return !dd && !!document.getElementById('asset-collector');`, 15000);
    // Close the menu by clicking the form's title (NOT Escape — bugs §13)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-title ")]`).click({ timeout: 30000 });
    // Let it close
    await wait(page, 1);
    // The capture menu is closed, and the form is still open
    await assertFromJavascript(page, `const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
return !dd && !!document.getElementById('asset-collector');`, 15000);
    // Back ONLINE — dispatch a window `online` event (always)
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
    // Let the form re-render online
    await wait(page, 2);
    // Close the menu by clicking the form's title (NOT Escape — bugs §13)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-title ")]`).click({ timeout: 30000 });
    // Let it close
    await wait(page, 1);
    // The capture menu is closed, and the form is still open
    await assertFromJavascript(page, `const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]
  .find(d => (d.textContent || '').includes('Hello, what would you like to do?'));
const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]
  .map(i => (i.textContent || '').trim()) : null;
return !dd && !!document.getElementById('asset-collector');`, 15000);
    // Close the form with its X — DISCARDING the photo, never submitting
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`).click({ timeout: 30000 });
    // Let the form close
    await wait(page, 2);
    // RESTORED: the form is gone, so the photo was discarded unsent
    await assertFromJavascript(page, `return !document.getElementById('asset-collector');`, 30000);
  }
  soft.check();
}
