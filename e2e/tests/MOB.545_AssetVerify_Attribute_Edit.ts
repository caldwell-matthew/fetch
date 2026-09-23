// Generated from Mobile/dd_tests_mobile/MOB.545_AssetVerify_Attribute_Edit.json by to_playwright.py — do not edit by hand yet.
// MOB.545_AssetVerify_Attribute_Edit

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob545(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Let the page begin rendering
    await wait(page, 3);
    // Test the "Mobile Jobs" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
    // Wait for the lookup prefetch and batched detail downloads
    await wait(page, 25);
    // Test the job list rendered
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
    // Test the lookup prefetch finished (feeds schemaQuery)
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
    // Test the batched job-detail downloads finished
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    // FIXTURE GUARD: "DATADOG MOBILE JOB" is in this crew's list
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open "DATADOG MOBILE JOB" by clicking its row (not a deep link)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`).click({ timeout: 30000 });
    // Wait for the job detail to render
    await wait(page, 5);
    // ASSET LIST GUARD: the job's asset rows have rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
    // Open Tank 0000's full-page detail
    await el(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`).click({ timeout: 30000 });
    // Wait for the asset detail route
    await wait(page, 6);
    // The full-page asset detail rendered
    await assertPageContains(page, `Asset Type:`, DEFAULT_TIMEOUT);
    // Open the Attributes tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Attributes")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the Attributes panel
    await wait(page, 3);
    // FIELD GUARD: the "Year Of Manufacture" attribute input is on this asset
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Year Of Manufacture")]]//input`, DEFAULT_TIMEOUT);
    // Focus the Year Of Manufacture field
    await el(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Year Of Manufacture")]]//input`).click({ timeout: DEFAULT_TIMEOUT });
    // Select the existing text (typeText APPENDS without this)
    await page.keyboard.press(`Control+a`);
    // Type the Year Of Manufacture value
    await el(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Year Of Manufacture")]]//input`).fill(`DD SYNTHETIC EDIT ${RUNID}`, { timeout: DEFAULT_TIMEOUT });
    // Submit the attributes form
    await el(page, `//button[@form="mobile-attrib"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Brief wait for the toast to appear
    await wait(page, 2);
    await optional("Attributes updated toast (optional: transient)", async () => {
      await assertPageContains(page, `Attributes updated successfully!`, DEFAULT_TIMEOUT);
    });
    // Wait for the attribute mutation
    await wait(page, 5);
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Let the page begin rendering
    await wait(page, 3);
    // Test the "Mobile Jobs" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
    // Wait for the lookup prefetch and batched detail downloads
    await wait(page, 25);
    // Test the job list rendered
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
    // Test the lookup prefetch finished (feeds schemaQuery)
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
    // Test the batched job-detail downloads finished
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    // FIXTURE GUARD: "DATADOG MOBILE JOB" is in this crew's list
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open "DATADOG MOBILE JOB" by clicking its row (not a deep link)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`).click({ timeout: 30000 });
    // Wait for the job detail to render
    await wait(page, 5);
    // ASSET LIST GUARD: the job's asset rows have rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
    // Open Tank 0000's full-page detail
    await el(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`).click({ timeout: 30000 });
    // Wait for the asset detail route
    await wait(page, 6);
    // The full-page asset detail rendered
    await assertPageContains(page, `Asset Type:`, DEFAULT_TIMEOUT);
    // Open the Attributes tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Attributes")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the Attributes panel
    await wait(page, 3);
    // FIELD GUARD: the "Year Of Manufacture" attribute input is on this asset
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Year Of Manufacture")]]//input`, DEFAULT_TIMEOUT);
    // PROOF: after a reload "Year Of Manufacture" is no longer the baseline
    await assertFromJavascript(page, `const g = [...document.querySelectorAll('div.form-group')].find(d => {
  const l = d.querySelector('label');
  return l && l.textContent.trim().indexOf('Year Of Manufacture') === 0;
});
if (!g) return false;
const el = g.querySelector('input');
if (!el) return false;
return el.value.trim() !== 'DECEMBER 2002';`, DEFAULT_TIMEOUT);
    // Focus the Year Of Manufacture field
    await el(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Year Of Manufacture")]]//input`).click({ timeout: DEFAULT_TIMEOUT });
    // Select the existing text (typeText APPENDS without this)
    await page.keyboard.press(`Control+a`);
    // Type the Year Of Manufacture value
    await el(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Year Of Manufacture")]]//input`).fill(`DECEMBER 2002`, { timeout: DEFAULT_TIMEOUT });
    // Submit the restore
    await el(page, `//button[@form="mobile-attrib"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the restore mutation
    await wait(page, 6);
    // Navigate to the mobile job list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`);
    // Let the page begin rendering
    await wait(page, 3);
    // Test the "Mobile Jobs" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
    // Wait for the lookup prefetch and batched detail downloads
    await wait(page, 25);
    // Test the job list rendered
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
    // Test the lookup prefetch finished (feeds schemaQuery)
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
    // Test the batched job-detail downloads finished
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
    // FIXTURE GUARD: "DATADOG MOBILE JOB" is in this crew's list
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
    // Open "DATADOG MOBILE JOB" by clicking its row (not a deep link)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`).click({ timeout: 30000 });
    // Wait for the job detail to render
    await wait(page, 5);
    // ASSET LIST GUARD: the job's asset rows have rendered
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
    // Open Tank 0000's full-page detail
    await el(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`).click({ timeout: 30000 });
    // Wait for the asset detail route
    await wait(page, 6);
    // The full-page asset detail rendered
    await assertPageContains(page, `Asset Type:`, DEFAULT_TIMEOUT);
    // Open the Attributes tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Attributes")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the Attributes panel
    await wait(page, 3);
    // FIELD GUARD: the "Year Of Manufacture" attribute input is on this asset
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Year Of Manufacture")]]//input`, DEFAULT_TIMEOUT);
    // RESTORED: "Year Of Manufacture" is exactly "DECEMBER 2002" again
    await assertFromJavascript(page, `const g = [...document.querySelectorAll('div.form-group')].find(d => {
  const l = d.querySelector('label');
  return l && l.textContent.trim().indexOf('Year Of Manufacture') === 0;
});
if (!g) return false;
const el = g.querySelector('input');
if (!el) return false;
return el.value.trim() === 'DECEMBER 2002';`, DEFAULT_TIMEOUT);
}
