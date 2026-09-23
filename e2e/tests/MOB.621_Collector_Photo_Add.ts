// Generated from Mobile/dd_tests_mobile/MOB.621_Collector_Photo_Add.json by to_playwright.py — do not edit by hand yet.
// MOB.621_Collector_Photo_Add

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, uploadStandIn, wait } from '../support/dd';

export async function mob621(page: Page): Promise<void> {
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
    // BASELINE: the button reads "Add Asset Photo" (no attachments)
    await assertElementPresent(page, `//button[normalize-space(.)="Add Asset Photo"]`, 30000);
    // BASELINE: no carousel yet — `{photos.length > 0 && …}` has no empty state
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('.mantine-Carousel-root, [class*="mantine-Carousel"]').length === 0;`, 30000);
    // Open the photo picker ("Add Asset Photo")
    await el(page, `//button[normalize-space(.)="Add Asset Photo"]`).click({ timeout: 30000 });
    // The picker opened — "Select Photo Source"
    await assertPageContains(page, `Select Photo Source`, 30000);
    // Reveal the hidden gallery file input (useFileDialog appends it to <body>)
    await assertFromJavascript(page, `const inputs = [...document.querySelectorAll('input[type="file"]')];
const el = inputs.find(i => !i.capture);
if (!el) return false;
el.setAttribute('data-dd-upload', '1');
Object.assign(el.style, {
  display: 'block', opacity: '1', position: 'fixed',
  top: '0', left: '0', width: '240px', height: '40px', zIndex: '99999'
});
return true;
`, DEFAULT_TIMEOUT);
    // ⭐ Upload a photo — REUSING MOB.600's bucketKey from a different test
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
    // ⭐ THE PICKER CLOSED ITSELF once the file arrived — `onDialogChange` calls `close()`; nothing clicks an X. Paired with the carousel assertions below, which are the positive control that the page is alive
    await assertPageLacks(page, `Select Photo Source`, 30000);
    // Let the reducer take the photo and the carousel mount
    await wait(page, 4);
    // ⭐ THE CAROUSEL NOW EXISTS — the `photos.length > 0` branch
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('.mantine-Carousel-root, [class*="mantine-Carousel"]').length >= 1;`, 30000);
    // ⭐ The button flipped to "Add More Photos" — attachments.length is now non-zero
    await assertElementPresent(page, `//button[normalize-space(.)="Add More Photos"]`, 30000);
    // …and the old zero-photo label is GONE (a swap, not an addition)
    await assertFromJavascript(page, `const t = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return t.includes('Add More Photos') && !t.includes('Add Asset Photo');`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Close the form with its X — DISCARDING the photo, never submitting
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`).click({ timeout: 30000 });
    // Let the form close
    await wait(page, 2);
    // RESTORED: the form is gone, so the photo was discarded unsent
    await assertFromJavascript(page, `return !document.getElementById('asset-collector');`, 30000);
  }
}
