// Generated from Mobile/dd_tests_mobile/MOB.600_Collector_Create_Asset.json by to_playwright.py — do not edit by hand yet.
// MOB.600_Collector_Create_Asset
//
// ⛔ THIS TEST CANNOT RUN OUTSIDE DATADOG. Steps below were recorded without an xpath, so only
//    Datadog's own multiLocator can find their element. Its suite marks it `fixme`, so it is
//    reported as skipped and never as a pass:
//      - Open the photo picker ("Add Asset Photo"): step has no xpath locator

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, uploadStandIn, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob600(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
  const soft = new Soft();
    // Navigate to the asset collector
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`);
    // Wait for the collector to load its lookup cache
    await wait(page, 15);
    // Test the collector page rendered
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, DEFAULT_TIMEOUT);
    // Open the new-asset form (affixed + button)
    await el(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the form to mount
    await wait(page, 3);
    // Test the new-asset form opened
    await assertElementPresent(page, `//button[@form="asset-collector"]`, DEFAULT_TIMEOUT);
    // Enter the asset name
    await el(page, `//*[@id="name"]`).fill(`DD SYNTHETIC MOBILE ${RUNID}`, { timeout: DEFAULT_TIMEOUT });
    // Enter the asset description
    await el(page, `//*[@id="desc"]`).fill(`Created by Datadog Synthetics - safe to delete`, { timeout: DEFAULT_TIMEOUT });
    // Focus the asset type lookup
    await el(page, `//*[@id="typeId"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for asset type options
    await wait(page, 2);
    // Pick Actuator Tools
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Actuator Tools")]`).click({ timeout: DEFAULT_TIMEOUT });
    // ⛔ NOT PORTABLE — Open the photo picker ("Add Asset Photo"): step has no xpath locator
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
    // Upload file
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
    // ⭐ The photo-source modal closed ITSELF once the file arrived — `onDialogChange` calls `close()` (2026-09). Nothing clicks an X: closing early unmounted the component and destroyed the very <input> the upload needs
    await assertPageLacks(page, `Select Photo Source`, 30000);
    // Wait for the modal to close
    await wait(page, 2);
    // Submit the new asset
    await el(page, `//button[@form="asset-collector"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the collect mutation
    await wait(page, 5);
    // Test the form closed (durable success signal)
    await assertPageLacks(page, `Create Asset`, DEFAULT_TIMEOUT);
    // Test the form closed (affixed + button is back)
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`, DEFAULT_TIMEOUT);
    // Wait for the collected list to refresh
    await wait(page, 3);
    // PROOF OF CREATION: this run's asset is in the collected list
    await assertPageContains(page, `DD SYNTHETIC MOBILE ${RUNID}`, DEFAULT_TIMEOUT);
    await optional("Test the 'Asset collected' toast (optional: transient)", async () => {
      await assertPageContains(page, `Asset collected`, DEFAULT_TIMEOUT);
    });
    // SERVER PROOF: navigate to Asset Lookup (its search is a network-only query)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for the page to mount
    await wait(page, 5);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: 30000 });
    // Select any persisted query first (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Search for this run's asset by its exact name
    await el(page, `//input[@name="asset-search"]`).fill(`DD SYNTHETIC MOBILE ${RUNID}`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter — there is no search button)
    await page.keyboard.press(`Enter`);
    // Wait for the search results
    await wait(page, 5);
    await soft.run("\u2b50 SERVER PROOF: the asset comes back from the SERVER \u2014 a result row carries this run's name (bugs \u00a734: the collected list's row is client-prepended and proves nothing)", async () => {
      await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")])[1][contains(., "DD SYNTHETIC MOBILE ${RUNID}")]`, 30000);
    });
  soft.check();
}
