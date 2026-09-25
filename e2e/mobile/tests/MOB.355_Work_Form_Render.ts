// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.355_Work_Form_Render.json. This file is the source now: edit it directly.
// MOB.355_Work_Form_Render

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, wait } from '../../support/dd';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';

export async function mob355(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 warm the work lookup cache", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Let the lookup prefetch run", {}, async () => {
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
  });
  await run.step("Navigate to the fixture work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("GATE: the detail data arrived (tab strip)", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
  });
  await run.step("Open the Forms tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Form")]`, 30000);
  });
  await run.step("FIXTURE GUARD: the work order has at least one form card", {}, async () => {
    await assertElementPresent(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]`, 60000);
  });
  await run.step("Open the first form card", {}, async () => {
    await click(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]`, 60000);
  });
  await run.step("Let the form page render", {}, async () => {
    await wait(page, 4);
  });
  await run.step("ROUTE: we are on /work/<id>/form/<id>", {}, async () => {
    await assertFromJavascript(page, `return /\\/work\\/[^/]+\\/form\\/[^/]+$/.test(location.pathname);`, 60000);
  });
  await run.step("The desktop form container mounted", {}, async () => {
    await assertElementPresent(page, `//*[@id="apm-dv-tabpanel"]`, 60000);
  });
  await run.step("The form definition produced at least one field widget", {}, async () => {
    await assertFromJavascript(page, `const c = document.getElementById('apm-dv-tabpanel');
if (!c) return false;
return c.querySelectorAll('.ws-form-widget').length >= 1;`, 30000);
  });
  await run.step("Those widgets contain real inputs \u2014 the form is interactive, not a read-only dump", {}, async () => {
    await assertFromJavascript(page, `const c = document.getElementById('apm-dv-tabpanel');
if (!c) return false;
const inputs = [...c.querySelectorAll('input, textarea, select')].filter(e => e.closest('.ws-form-widget'));
return inputs.length >= 1;`, 30000);
  });
  await run.step("The form's completion Progress bar rendered \u2014 the whole component is up", {}, async () => {
    await assertFromJavascript(page, `return document.querySelectorAll('.mantine-Progress-root, [class*="mantine-Progress"]').length >= 1;`, 30000);
  });
  await run.step("At least one widget carries its field header \u2014 not an empty grid", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const c = document.getElementById('apm-dv-tabpanel');
if (!c) return false;
return c.querySelectorAll('.ws-form-widget-header').length >= 1;`, 30000);
  });
  run.finish();
}
