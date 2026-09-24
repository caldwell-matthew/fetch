// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.520_AssetVerify_Asset_Tabs.json. This file is the source now: edit it directly.
// MOB.520_AssetVerify_Asset_Tabs

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, wait } from '../../support/dd';

export async function mob520(page: Page): Promise<void> {
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
  await run.step("Switch to the \"All\" filter", {}, async () => {
    await click(page, `//label[.//span[normalize-space(.)="All"]]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the All list to re-render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Expand the first asset row", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the asset detail panel to mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Test a tab strip is rendered", {}, async () => {
    await assertElementPresent(page, `((//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"])[1]`, DEFAULT_TIMEOUT);
  });
  await run.step("Switch to the \"General Info\" tab", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="General Info"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the panel to mount", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test the \"General Info\" tab is active", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="General Info"][@data-active]`, DEFAULT_TIMEOUT);
  });
  await run.step("Switch to the \"Attributes\" tab", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Attributes"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the panel to mount", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test the \"Attributes\" tab is active", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Attributes"][@data-active]`, DEFAULT_TIMEOUT);
  });
  await run.step("Switch to the \"Photos\" tab", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Photos"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the panel to mount", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test the \"Photos\" tab is active", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Photos"][@data-active]`, DEFAULT_TIMEOUT);
  });
  await run.step("Switch to the \"Docs\" tab", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Docs"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the panel to mount", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test the \"Docs\" tab is active", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Docs"][@data-active]`, DEFAULT_TIMEOUT);
  });
  await run.step("Switch to the \"Work History\" tab", {}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Work History"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the panel to mount", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test the \"Work History\" tab is active", {}, async () => {
    await assertElementPresent(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[@role="tab"][normalize-space(.)="Work History"][@data-active]`, DEFAULT_TIMEOUT);
  });
  await run.step("The asset row reports itself EXPANDED before collapsing", {}, async () => {
    await assertFromJavascript(page, `const c = document.querySelector('.mantine-Accordion-item .mantine-Accordion-control');
if (!c) return false;
return c.getAttribute('aria-expanded') === 'true';`, 30000);
  });
  await run.step("Collapse the asset row again", {always: true}, async () => {
    await click(page, `(//*[contains(@class,"mantine-Accordion-item")])[1]//*[contains(@class,"mantine-Accordion-control")]`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the panel close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("COLLAPSED: the row reports itself closed \u2014 the caret toggles both ways", {always: true}, async () => {
    await assertFromJavascript(page, `const c = document.querySelector('.mantine-Accordion-item .mantine-Accordion-control');
if (!c) return false;
return c.getAttribute('aria-expanded') === 'false';`, 30000);
  });
  run.finish();
}
