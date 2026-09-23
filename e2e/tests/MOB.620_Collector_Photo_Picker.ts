// Generated from Mobile/dd_tests_mobile/MOB.620_Collector_Photo_Picker.json by to_playwright.py — do not edit by hand yet.
// MOB.620_Collector_Photo_Picker

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob620(page: Page): Promise<void> {
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
    // The add-photo button reads "Add Asset Photo" — the no-attachments branch
    await assertElementPresent(page, `//button[normalize-space(.)="Add Asset Photo"]`, 30000);
    // ⭐ NO EMPTY STATE: with zero photos the carousel renders nothing at all
    await assertFromJavascript(page, `const form = document.getElementById('asset-collector');
if (!form) return false;
// the form itself IS present — so 'no carousel' is a real branch, not a
// component that failed to render (trap 5)
return form.querySelectorAll('.mantine-Carousel-root, [class*="mantine-Carousel"]').length === 0;`, 30000);
    // Open the picker ("Add Asset Photo")
    await el(page, `//button[normalize-space(.)="Add Asset Photo"]`).click({ timeout: 30000 });
    // The picker opened — "Select Photo Source"
    await assertPageContains(page, `Select Photo Source`, 30000);
    // 🛑 All THREE capture options render (asserted, never clicked)
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => (x.textContent || '').includes('Select Photo Source'));
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return t.includes('Take Photo')
  && t.includes('Take Video')
  && t.includes('Photo Gallery');`, 30000);
    // The auto-tag selector rendered (its own tags query resolved)
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Select Photo Source")]//input[@placeholder="Auto-apply tags?"]`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Close the picker with its own X (Escape does NOT close it)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Select Photo Source")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`).click({ timeout: 30000 });
    // Let the picker close
    await wait(page, 2);
    // The picker is gone
    await assertPageLacks(page, `Select Photo Source`, 30000);
    // Close the new-asset form with its X — WITHOUT submitting
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`).click({ timeout: 30000 });
    // Let the form close
    await wait(page, 2);
    // RESTORED: the form closed and nothing was collected
    await assertFromJavascript(page, `return !document.getElementById('asset-collector');`, 30000);
  }
}
