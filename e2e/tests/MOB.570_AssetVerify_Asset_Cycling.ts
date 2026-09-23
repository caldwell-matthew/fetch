// Generated from Mobile/dd_tests_mobile/MOB.570_AssetVerify_Asset_Cycling.json by to_playwright.py — do not edit by hand yet.
// MOB.570_AssetVerify_Asset_Cycling

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob570(page: Page): Promise<void> {
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
    // Let the asset detail begin rendering
    await wait(page, 2);
    // The full-page asset detail rendered
    await assertPageContains(page, `Asset Type:`, 30000);
    // The cycling arrows next to Tank 0000 are rendered
    await assertElementPresent(page, `//button[.//*[@data-icon="circle-arrow-right" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-right ")]][parent::*[contains(., "Tank 0000")]]`, 30000);
    // BASELINE: the cycler shows "Tank 0000"
    await assertFromJavascript(page, `const groups = [...document.querySelectorAll('button')]
  .filter(b => b.querySelector('[data-icon="circle-arrow-right"]'))
  .map(b => b.parentElement).filter(Boolean);
if (!groups.length) return false;
return groups.some(g => (g.textContent || '').indexOf('Tank 0000') !== -1);`, 30000);
    // Cycle FORWARD
    await el(page, `//button[.//*[@data-icon="circle-arrow-right" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-right ")]][parent::*[contains(., "Tank 0000")]]`).click({ timeout: 30000 });
    // Let the next asset render
    await wait(page, 3);
    // PROOF: forward moved to "A/C Motor 0002"
    await assertFromJavascript(page, `const groups = [...document.querySelectorAll('button')]
  .filter(b => b.querySelector('[data-icon="circle-arrow-right"]'))
  .map(b => b.parentElement).filter(Boolean);
if (!groups.length) return false;
return groups.some(g => (g.textContent || '').indexOf('A/C Motor 0002') !== -1);`, 30000);
    // Cycle FORWARD again — with 2 assets this must wrap
    await el(page, `//button[.//*[@data-icon="circle-arrow-right" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-right ")]][parent::*[contains(., "A/C Motor 0002")]]`).click({ timeout: 30000 });
    // Let the wrap render
    await wait(page, 3);
    // PROOF: cycling wrapped back to "Tank 0000"
    await assertFromJavascript(page, `const groups = [...document.querySelectorAll('button')]
  .filter(b => b.querySelector('[data-icon="circle-arrow-right"]'))
  .map(b => b.parentElement).filter(Boolean);
if (!groups.length) return false;
return groups.some(g => (g.textContent || '').indexOf('Tank 0000') !== -1);`, 30000);
    // Cycle BACK — the reverse arrow works too
    await el(page, `//button[.//*[@data-icon="circle-arrow-left" or contains(concat(" ", normalize-space(@class), " "), " fa-circle-arrow-left ")]][parent::*[contains(., "Tank 0000")]]`).click({ timeout: 30000 });
    // Let the previous asset render
    await wait(page, 3);
    // PROOF: the back arrow moved to "A/C Motor 0002"
    await assertFromJavascript(page, `const groups = [...document.querySelectorAll('button')]
  .filter(b => b.querySelector('[data-icon="circle-arrow-right"]'))
  .map(b => b.parentElement).filter(Boolean);
if (!groups.length) return false;
return groups.some(g => (g.textContent || '').indexOf('A/C Motor 0002') !== -1);`, 30000);
}
