// Generated from legacy/Mobile/dd_tests_mobile/MOB.621_Collector_Photo_Add.json by to_playwright.py — do not edit by hand yet.
// MOB.621_Collector_Photo_Add

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, uploadStandIn, wait } from '../support/dd';

export async function mob621(page: Page): Promise<void> {
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
  await run.step("BASELINE: the button reads \"Add Asset Photo\" (no attachments)", {}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add Asset Photo"]`, 30000);
  });
  await run.step("BASELINE: no carousel yet \u2014 `{photos.length > 0 && \u2026}` has no empty state", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('.mantine-Carousel-root, [class*="mantine-Carousel"]').length === 0;`, 30000);
  });
  await run.step("Open the photo picker (\"Add Asset Photo\")", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add Asset Photo"]`, 30000);
  });
  await run.step("The picker opened \u2014 \"Select Photo Source\"", {}, async () => {
    await assertPageContains(page, `Select Photo Source`, 30000);
  });
  await run.step("Reveal the hidden gallery file input (useFileDialog appends it to <body>)", {}, async () => {
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
  });
  await run.step("\u2b50 Upload a photo \u2014 REUSING MOB.600's bucketKey from a different test", {}, async () => {
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
  });
  await run.step("\u2b50 THE PICKER CLOSED ITSELF once the file arrived \u2014 `onDialogChange` calls `close()`; nothing clicks an X. Paired with the carousel assertions below, which are the positive control that the page is alive", {}, async () => {
    await assertPageLacks(page, `Select Photo Source`, 30000);
  });
  await run.step("Let the reducer take the photo and the carousel mount", {}, async () => {
    await wait(page, 4);
  });
  await run.step("\u2b50 THE CAROUSEL NOW EXISTS \u2014 the `photos.length > 0` branch", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('.mantine-Carousel-root, [class*="mantine-Carousel"]').length >= 1;`, 30000);
  });
  await run.step("\u2b50 The button flipped to \"Add More Photos\" \u2014 attachments.length is now non-zero", {}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add More Photos"]`, 30000);
  });
  await run.step("\u2026and the old zero-photo label is GONE (a swap, not an addition)", {}, async () => {
    await assertFromJavascript(page, `const t = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return t.includes('Add More Photos') && !t.includes('Add Asset Photo');`, 30000);
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
