// Generated from Mobile/dd_tests_mobile/MOB.537_AssetVerify_Header_Tag.json by to_playwright.py — do not edit by hand yet.
// MOB.537_AssetVerify_Header_Tag

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, wait } from '../support/dd';

export async function mob537(page: Page): Promise<void> {
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
    // Open A/C Motor 0002's full-page detail
    await el(page, `(//span[contains(normalize-space(.), "A/C Motor 0002")])[last()]`).click({ timeout: 30000 });
    // Let the asset detail begin rendering
    await wait(page, 2);
    // The full-page asset detail rendered
    await assertPageContains(page, `Asset Type:`, 30000);
    // ⭐ `Tag ID: None` — A/C Motor 0002 has no tag (the `?? 'None'` branch)
    await assertFromJavascript(page, `const s = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Tag ID:');
const line = s && s.parentElement;
const tag = line ? (line.textContent || '').replace('Tag ID:', '').trim() : null;
return tag === 'None';`, 30000);
    // The header's `Desc:` line renders under `Tag ID:` (`AssetDetails.tsx:182` — `desc ?? 'None'`, never blank)
    await assertFromJavascript(page, `const d = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Desc:');
const line = d && d.parentElement;
return !!line && (line.textContent || '').replace('Desc:', '').trim().length > 0;`, 30000);
    // Back to the job in-app (`history.back()`)
    await assertFromJavascript(page, `history.back();
return true;`, 15000);
    // Let the job render
    await wait(page, 3);
    // Open Tank 0000's full-page detail
    await el(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`).click({ timeout: 30000 });
    // Let the asset detail begin rendering
    await wait(page, 2);
    // The full-page asset detail rendered
    await assertPageContains(page, `Asset Type:`, 30000);
    // ⭐ `Tag ID: 0000` — Tank 0000's stored tag (PREMISE for the edit)
    await assertFromJavascript(page, `const s = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Tag ID:');
const line = s && s.parentElement;
const tag = line ? (line.textContent || '').replace('Tag ID:', '').trim() : null;
return tag === '0000';`, 30000);
    // Open the Tag ID edit button (`AssetCaptureIconFormBttn`)
    await assertFromJavascript(page, `const s = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Tag ID:');
const line = s && s.parentElement;
const tag = line ? (line.textContent || '').replace('Tag ID:', '').trim() : null;
const grp = line && line.closest('[class*="mantine-Group-root"]');
const b = grp && grp.querySelector('button');
if (!b) return false;
b.click();
return true;`, 30000);
    // Let the edit form mount
    await wait(page, 2);
    // Focus the Tag field
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@id="tagNumber"]`).click({ timeout: 30000 });
    // Select the current tag (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Type DD-TAG-EDIT
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@id="tagNumber"]`).fill(`DD-TAG-EDIT`, { timeout: DEFAULT_TIMEOUT });
    // Submit
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[normalize-space(.)="Submit"]`).click({ timeout: 30000 });
    // Wait for UPDATE_ASSET
    await wait(page, 3);
    // The edit form closed (the MODAL's `#tagNumber` is gone) — `update()` ran: a server answer
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Modal-content input#tagNumber');`, 20000);
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
    // ⭐ SERVER (after a reload): `Tag ID: DD-TAG-EDIT`
    await assertFromJavascript(page, `const s = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Tag ID:');
const line = s && s.parentElement;
const tag = line ? (line.textContent || '').replace('Tag ID:', '').trim() : null;
return tag === 'DD-TAG-EDIT';`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Open the Tag ID edit button (`AssetCaptureIconFormBttn`)
    await assertFromJavascript(page, `const s = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Tag ID:');
const line = s && s.parentElement;
const tag = line ? (line.textContent || '').replace('Tag ID:', '').trim() : null;
const grp = line && line.closest('[class*="mantine-Group-root"]');
const b = grp && grp.querySelector('button');
if (!b) return false;
b.click();
return true;`, 30000);
    // Let the edit form mount
    await wait(page, 2);
    // Focus the Tag field
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@id="tagNumber"]`).click({ timeout: 30000 });
    // Select the current tag (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Type 0000
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@id="tagNumber"]`).fill(`0000`, { timeout: DEFAULT_TIMEOUT });
    // Submit
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[normalize-space(.)="Submit"]`).click({ timeout: 30000 });
    // Wait for UPDATE_ASSET
    await wait(page, 3);
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
    // ⭐ RESTORED (after a reload): `Tag ID: 0000`
    await assertFromJavascript(page, `const s = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Tag ID:');
const line = s && s.parentElement;
const tag = line ? (line.textContent || '').replace('Tag ID:', '').trim() : null;
return tag === '0000';`, 30000);
  }
}
