// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.620_Collector_Photo_Picker.json. This file is the source now: edit it directly.
// MOB.620_Collector_Photo_Picker

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';

export async function mob620(page: Page): Promise<void> {
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
  await run.step("The add-photo button reads \"Add Asset Photo\" \u2014 the no-attachments branch", {}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add Asset Photo"]`, 30000);
  });
  await run.step("\u2b50 NO EMPTY STATE: with zero photos the carousel renders nothing at all", {}, async () => {
    await assertFromJavascript(page, `const form = document.getElementById('asset-collector');
if (!form) return false;
// the form itself IS present — so 'no carousel' is a real branch, not a
// component that failed to render (trap 5)
return form.querySelectorAll('.mantine-Carousel-root, [class*="mantine-Carousel"]').length === 0;`, 30000);
  });
  await run.step("Open the picker (\"Add Asset Photo\")", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add Asset Photo"]`, 30000);
  });
  await run.step("The picker opened \u2014 \"Select Photo Source\"", {}, async () => {
    await assertPageContains(page, `Select Photo Source`, 30000);
  });
  await run.step("\ud83d\uded1 All THREE capture options render (asserted, never clicked)", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => (x.textContent || '').includes('Select Photo Source'));
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return t.includes('Take Photo')
  && t.includes('Take Video')
  && t.includes('Photo Gallery');`, 30000);
  });
  await run.step("The auto-tag selector rendered (its own tags query resolved)", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Select Photo Source")]//input[@placeholder="Auto-apply tags?"]`, 30000);
  });
  await run.step("Close the picker with its own X (Escape does NOT close it)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Select Photo Source")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`, 30000);
  });
  await run.step("Let the picker close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("The picker is gone", {always: true}, async () => {
    await assertPageLacks(page, `Select Photo Source`, 30000);
  });
  await run.step("Close the new-asset form with its X \u2014 WITHOUT submitting", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`, 30000);
  });
  await run.step("Let the form close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: the form closed and nothing was collected", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.getElementById('asset-collector');`, 30000);
  });
  run.finish();
}
