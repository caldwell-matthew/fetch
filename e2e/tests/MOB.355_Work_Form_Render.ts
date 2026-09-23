// Generated from Mobile/dd_tests_mobile/MOB.355_Work_Form_Render.json by to_playwright.py — do not edit by hand yet.
// MOB.355_Work_Form_Render

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, el, optional, wait } from '../support/dd';

export async function mob355(page: Page): Promise<void> {
    // Navigate to /work — warm the work lookup cache
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Let the lookup prefetch run
    await wait(page, 30);
    // Navigate to the fixture work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
    // Let the detail view begin rendering
    await wait(page, 3);
    // GATE: the detail data arrived (tab strip)
    await assertElementPresent(page, `(//*[@role="tab"])[1]`, 60000);
    // Open the Forms tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Form")]`).click({ timeout: 30000 });
    // Wait for the forms list
    await wait(page, 3);
    // FIXTURE GUARD: the work order has at least one form card
    await assertElementPresent(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]`, 60000);
    // Open the first form card
    await el(page, `(//*[@role="tabpanel"][not(contains(@style, "display: none"))]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]`).click({ timeout: 60000 });
    // Let the form page render
    await wait(page, 4);
    // ROUTE: we are on /work/<id>/form/<id>
    await assertFromJavascript(page, `return /\\/work\\/[^/]+\\/form\\/[^/]+$/.test(location.pathname);`, 60000);
    // The desktop form container mounted
    await assertElementPresent(page, `//*[@id="apm-dv-tabpanel"]`, 60000);
    // The form definition produced at least one field widget
    await assertFromJavascript(page, `const c = document.getElementById('apm-dv-tabpanel');
if (!c) return false;
return c.querySelectorAll('.ws-form-widget').length >= 1;`, 30000);
    // Those widgets contain real inputs — the form is interactive, not a read-only dump
    await assertFromJavascript(page, `const c = document.getElementById('apm-dv-tabpanel');
if (!c) return false;
const inputs = [...c.querySelectorAll('input, textarea, select')].filter(e => e.closest('.ws-form-widget'));
return inputs.length >= 1;`, 30000);
    // The form's completion Progress bar rendered — the whole component is up
    await assertFromJavascript(page, `return document.querySelectorAll('.mantine-Progress-root, [class*="mantine-Progress"]').length >= 1;`, 30000);
    await optional("At least one widget carries its field header \u2014 not an empty grid", async () => {
      await assertFromJavascript(page, `const c = document.getElementById('apm-dv-tabpanel');
if (!c) return false;
return c.querySelectorAll('.ws-form-widget-header').length >= 1;`, 30000);
    });
}
