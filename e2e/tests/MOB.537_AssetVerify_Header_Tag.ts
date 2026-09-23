// Generated from Mobile/dd_tests_mobile/MOB.537_AssetVerify_Header_Tag.json by to_playwright.py — do not edit by hand yet.
// MOB.537_AssetVerify_Header_Tag

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../support/dd';

export async function mob537(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await wait(page, 25);
  });
  await run.step("Test the job list rendered", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the lookup prefetch finished (feeds schemaQuery)", {}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open \"DATADOG MOBILE JOB\" by clicking its row (not a deep link)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`, 30000);
  });
  await run.step("Wait for the job detail to render", {}, async () => {
    await wait(page, 5);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Open A/C Motor 0002's full-page detail", {}, async () => {
    await click(page, `(//span[contains(normalize-space(.), "A/C Motor 0002")])[last()]`, 30000);
  });
  await run.step("Let the asset detail begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The full-page asset detail rendered", {}, async () => {
    await assertPageContains(page, `Asset Type:`, 30000);
  });
  await run.step("\u2b50 `Tag ID: None` \u2014 A/C Motor 0002 has no tag (the `?? 'None'` branch)", {}, async () => {
    await assertFromJavascript(page, `const s = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Tag ID:');
const line = s && s.parentElement;
const tag = line ? (line.textContent || '').replace('Tag ID:', '').trim() : null;
return tag === 'None';`, 30000);
  });
  await run.step("The header's `Desc:` line renders under `Tag ID:` (`AssetDetails.tsx:182` \u2014 `desc ?? 'None'`, never blank)", {}, async () => {
    await assertFromJavascript(page, `const d = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Desc:');
const line = d && d.parentElement;
return !!line && (line.textContent || '').replace('Desc:', '').trim().length > 0;`, 30000);
  });
  await run.step("Back to the job in-app (`history.back()`)", {}, async () => {
    await assertFromJavascript(page, `history.back();
return true;`, 15000);
  });
  await run.step("Let the job render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Open Tank 0000's full-page detail", {}, async () => {
    await click(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`, 30000);
  });
  await run.step("Let the asset detail begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The full-page asset detail rendered", {}, async () => {
    await assertPageContains(page, `Asset Type:`, 30000);
  });
  await run.step("\u2b50 `Tag ID: 0000` \u2014 Tank 0000's stored tag (PREMISE for the edit)", {}, async () => {
    await assertFromJavascript(page, `const s = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Tag ID:');
const line = s && s.parentElement;
const tag = line ? (line.textContent || '').replace('Tag ID:', '').trim() : null;
return tag === '0000';`, 30000);
  });
  await run.step("Open the Tag ID edit button (`AssetCaptureIconFormBttn`)", {}, async () => {
    await assertFromJavascript(page, `const s = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Tag ID:');
const line = s && s.parentElement;
const tag = line ? (line.textContent || '').replace('Tag ID:', '').trim() : null;
const grp = line && line.closest('[class*="mantine-Group-root"]');
const b = grp && grp.querySelector('button');
if (!b) return false;
b.click();
return true;`, 30000);
  });
  await run.step("Let the edit form mount", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Focus the Tag field", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@id="tagNumber"]`, 30000);
  });
  await run.step("Select the current tag (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type DD-TAG-EDIT", {}, async () => {
    await typeText(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@id="tagNumber"]`, `DD-TAG-EDIT`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[normalize-space(.)="Submit"]`, 30000);
  });
  await run.step("Wait for UPDATE_ASSET", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The edit form closed (the MODAL's `#tagNumber` is gone) \u2014 `update()` ran: a server answer", {}, async () => {
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Modal-content input#tagNumber');`, 20000);
  });
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await wait(page, 25);
  });
  await run.step("Test the job list rendered", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the lookup prefetch finished (feeds schemaQuery)", {}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open \"DATADOG MOBILE JOB\" by clicking its row (not a deep link)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`, 30000);
  });
  await run.step("Wait for the job detail to render", {}, async () => {
    await wait(page, 5);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Open Tank 0000's full-page detail", {}, async () => {
    await click(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`, 30000);
  });
  await run.step("Let the asset detail begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("The full-page asset detail rendered", {}, async () => {
    await assertPageContains(page, `Asset Type:`, 30000);
  });
  await run.step("\u2b50 SERVER (after a reload): `Tag ID: DD-TAG-EDIT`", {}, async () => {
    await assertFromJavascript(page, `const s = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Tag ID:');
const line = s && s.parentElement;
const tag = line ? (line.textContent || '').replace('Tag ID:', '').trim() : null;
return tag === 'DD-TAG-EDIT';`, 30000);
  });
  await run.step("Open the Tag ID edit button (`AssetCaptureIconFormBttn`)", {always: true}, async () => {
    await assertFromJavascript(page, `const s = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Tag ID:');
const line = s && s.parentElement;
const tag = line ? (line.textContent || '').replace('Tag ID:', '').trim() : null;
const grp = line && line.closest('[class*="mantine-Group-root"]');
const b = grp && grp.querySelector('button');
if (!b) return false;
b.click();
return true;`, 30000);
  });
  await run.step("Let the edit form mount", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Focus the Tag field", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@id="tagNumber"]`, 30000);
  });
  await run.step("Select the current tag (typeText APPENDS \u2014 trap 17)", {always: true}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type 0000", {always: true}, async () => {
    await typeText(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//input[@id="tagNumber"]`, `0000`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[normalize-space(.)="Submit"]`, 30000);
  });
  await run.step("Wait for UPDATE_ASSET", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("Navigate to the mobile job list", {always: true}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page begin rendering", {always: true}, async () => {
    await wait(page, 3);
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {always: true}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {always: true}, async () => {
    await wait(page, 25);
  });
  await run.step("Test the job list rendered", {always: true}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Mobile Job(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the lookup prefetch finished (feeds schemaQuery)", {always: true}, async () => {
    await assertPageLacks(page, `Fetching data for lookups`, DEFAULT_TIMEOUT);
  });
  await run.step("Test the batched job-detail downloads finished", {always: true}, async () => {
    await assertPageLacks(page, `Fetching mobile job details`, DEFAULT_TIMEOUT);
  });
  await run.step("FIXTURE GUARD: \"DATADOG MOBILE JOB\" is in this crew's list", {always: true}, async () => {
    await assertPageContains(page, `DATADOG MOBILE JOB`, DEFAULT_TIMEOUT);
  });
  await run.step("Open \"DATADOG MOBILE JOB\" by clicking its row (not a deep link)", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][contains(., "DATADOG MOBILE JOB")]`, 30000);
  });
  await run.step("Wait for the job detail to render", {always: true}, async () => {
    await wait(page, 5);
  });
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {always: true}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Open Tank 0000's full-page detail", {always: true}, async () => {
    await click(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`, 30000);
  });
  await run.step("Let the asset detail begin rendering", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("The full-page asset detail rendered", {always: true}, async () => {
    await assertPageContains(page, `Asset Type:`, 30000);
  });
  await run.step("\u2b50 RESTORED (after a reload): `Tag ID: 0000`", {always: true}, async () => {
    await assertFromJavascript(page, `const s = [...document.querySelectorAll('strong')].find(x => (x.textContent || '').trim() === 'Tag ID:');
const line = s && s.parentElement;
const tag = line ? (line.textContent || '').replace('Tag ID:', '').trim() : null;
return tag === '0000';`, 30000);
  });
  run.finish();
}
