// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.545_AssetVerify_Attribute_Edit.json. This file is the source now: edit it directly.
// MOB.545_AssetVerify_Attribute_Edit

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../../support/dd';
import { runId } from '../../support/env';
import { waitForPrefetch } from '../support/prefetch';

export async function mob545(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
  const run = new Sequence();
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await waitForPrefetch(page);
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
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Open Tank 0000's full-page detail", {}, async () => {
    await click(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`, 30000);
  });
  await run.step("The full-page asset detail rendered", {}, async () => {
    await assertPageContains(page, `Asset Type:`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the Attributes tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Attributes")]`, DEFAULT_TIMEOUT);
  });
  await run.step("FIELD GUARD: the \"Year Of Manufacture\" attribute input is on this asset", {}, async () => {
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Year Of Manufacture")]]//input`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the Year Of Manufacture field", {}, async () => {
    await click(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Year Of Manufacture")]]//input`, DEFAULT_TIMEOUT);
  });
  await run.step("Select the existing text (typeText APPENDS without this)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type the Year Of Manufacture value", {}, async () => {
    await typeText(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Year Of Manufacture")]]//input`, `DD SYNTHETIC EDIT ${RUNID}`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the attributes form", {}, async () => {
    await click(page, `//button[@form="mobile-attrib"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Brief wait for the toast to appear", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Attributes updated toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `Attributes updated successfully!`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the attribute mutation", {}, async () => {
    await wait(page, 5);
  });
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await waitForPrefetch(page);
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
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Open Tank 0000's full-page detail", {}, async () => {
    await click(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`, 30000);
  });
  await run.step("The full-page asset detail rendered", {}, async () => {
    await assertPageContains(page, `Asset Type:`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the Attributes tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Attributes")]`, DEFAULT_TIMEOUT);
  });
  await run.step("FIELD GUARD: the \"Year Of Manufacture\" attribute input is on this asset", {}, async () => {
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Year Of Manufacture")]]//input`, DEFAULT_TIMEOUT);
  });
  await run.step("PROOF: after a reload \"Year Of Manufacture\" is no longer the baseline", {}, async () => {
    await assertFromJavascript(page, `const g = [...document.querySelectorAll('div.form-group')].find(d => {
  const l = d.querySelector('label');
  return l && l.textContent.trim().indexOf('Year Of Manufacture') === 0;
});
if (!g) return false;
const el = g.querySelector('input');
if (!el) return false;
return el.value.trim() !== 'DECEMBER 2002';`, DEFAULT_TIMEOUT);
  });
  await run.step("Focus the Year Of Manufacture field", {}, async () => {
    await click(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Year Of Manufacture")]]//input`, DEFAULT_TIMEOUT);
  });
  await run.step("Select the existing text (typeText APPENDS without this)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Type the Year Of Manufacture value", {}, async () => {
    await typeText(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Year Of Manufacture")]]//input`, `DECEMBER 2002`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the restore", {}, async () => {
    await click(page, `//button[@form="mobile-attrib"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the restore mutation", {}, async () => {
    await wait(page, 6);
  });
  await run.step("Navigate to the mobile job list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-verify`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the \"Mobile Jobs\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]`, `Mobile Jobs`, 30000);
  });
  await run.step("Wait for the lookup prefetch and batched detail downloads", {}, async () => {
    await waitForPrefetch(page);
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
  await run.step("ASSET LIST GUARD: the job's asset rows have rendered", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]`, 60000);
  });
  await run.step("Open Tank 0000's full-page detail", {}, async () => {
    await click(page, `(//span[contains(normalize-space(.), "Tank 0000")])[last()]`, 30000);
  });
  await run.step("The full-page asset detail rendered", {}, async () => {
    await assertPageContains(page, `Asset Type:`, DEFAULT_TIMEOUT);
  });
  await run.step("Open the Attributes tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Attributes")]`, DEFAULT_TIMEOUT);
  });
  await run.step("FIELD GUARD: the \"Year Of Manufacture\" attribute input is on this asset", {}, async () => {
    await assertElementPresent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")][./label[contains(normalize-space(.), "Year Of Manufacture")]]//input`, DEFAULT_TIMEOUT);
  });
  await run.step("RESTORED: \"Year Of Manufacture\" is exactly \"DECEMBER 2002\" again", {}, async () => {
    await assertFromJavascript(page, `const g = [...document.querySelectorAll('div.form-group')].find(d => {
  const l = d.querySelector('label');
  return l && l.textContent.trim().indexOf('Year Of Manufacture') === 0;
});
if (!g) return false;
const el = g.querySelector('input');
if (!el) return false;
return el.value.trim() === 'DECEMBER 2002';`, DEFAULT_TIMEOUT);
  });
  run.finish();
}
