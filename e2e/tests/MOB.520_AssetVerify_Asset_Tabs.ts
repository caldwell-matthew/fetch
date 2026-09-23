// Generated from Mobile/dd_tests_mobile/MOB.520_AssetVerify_Asset_Tabs.json by to_playwright.py — do not edit by hand yet.
// MOB.520_AssetVerify_Asset_Tabs

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob520(page: Page): Promise<void> {
  try {
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
    // Switch to the "All" filter
    await el(page, `//label[.//span[normalize-space(.)="All"]]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the All list to re-render
    await wait(page, 2);
    // Expand the first asset row
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the asset detail panel to mount
    await wait(page, 3);
    // Test a tab strip is rendered
    await assertElementPresent(page, `((//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"])[1]`, DEFAULT_TIMEOUT);
    // Switch to the "General Info" tab
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="General Info"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the panel to mount
    await wait(page, 2);
    // Test the "General Info" tab is active
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="General Info"][@data-active]`, DEFAULT_TIMEOUT);
    // Switch to the "Attributes" tab
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Attributes"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the panel to mount
    await wait(page, 2);
    // Test the "Attributes" tab is active
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Attributes"][@data-active]`, DEFAULT_TIMEOUT);
    // Switch to the "Photos" tab
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Photos"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the panel to mount
    await wait(page, 2);
    // Test the "Photos" tab is active
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Photos"][@data-active]`, DEFAULT_TIMEOUT);
    // Switch to the "Docs" tab
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Docs"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the panel to mount
    await wait(page, 2);
    // Test the "Docs" tab is active
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Docs"][@data-active]`, DEFAULT_TIMEOUT);
    // Switch to the "Work History" tab
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Work History"]`).click({ timeout: DEFAULT_TIMEOUT });
    // Wait for the panel to mount
    await wait(page, 2);
    // Test the "Work History" tab is active
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Work History"][@data-active]`, DEFAULT_TIMEOUT);
    // The asset row reports itself EXPANDED before collapsing
    await assertFromJavascript(page, `const c = document.querySelector('.mantine-Accordion-item .mantine-Accordion-control');
if (!c) return false;
return c.getAttribute('aria-expanded') === 'true';`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Collapse the asset row again
    await el(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`).click({ timeout: DEFAULT_TIMEOUT });
    // Let the panel close
    await wait(page, 2);
    // COLLAPSED: the row reports itself closed — the caret toggles both ways
    await assertFromJavascript(page, `const c = document.querySelector('.mantine-Accordion-item .mantine-Accordion-control');
if (!c) return false;
return c.getAttribute('aria-expanded') === 'false';`, 30000);
  }
}
