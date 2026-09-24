// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.730_AssetLookup_Proximity.json. This file is the source now: edit it directly.
// MOB.730_AssetLookup_Proximity

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, click, press, wait } from '../../support/dd';

export async function mob730(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to asset lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the page mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Asset Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
  });
  await run.step("BASELINE: no radius is stored in sessionStorage['asset_lookup_proximity_radius']", {}, async () => {
    await assertFromJavascript(page, `const v = sessionStorage.getItem('asset_lookup_proximity_radius');
return v === null || v === 'null' || v === '';`, 30000);
  });
  await run.step("The \"Near Me\" button renders \u2014 the no-radius label", {}, async () => {
    await assertElementPresent(page, `//button[contains(normalize-space(.), "Near Me")]`, 60000);
  });
  await run.step("SETTLE GATE: the search input is interactive \u2014 the page finished its first render", {}, async () => {
    await assertElementPresent(page, `//input[@name="asset-search"]`, 60000);
  });
  await run.step("Let the first asset query settle before touching the menu", {}, async () => {
    await wait(page, 4);
  });
  await run.step("Open the \"Near Me\" menu", {}, async () => {
    await click(page, `(//button[contains(normalize-space(.), "Near Me")])[1]`, 30000);
  });
  await run.step("The menu is headed \"Search radius\"", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-label ")][normalize-space(.)="Search radius"]`, 30000);
  });
  await run.step("All five radii are offered, and they are exactly ONE locale's set \u2014 5/10/25/50/100 mi or 10/25/50/100/200 km, never a mix", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
const got = items.filter(t => /^\\d+ (mi|km)$/.test(t));
const IMPERIAL = ["5 mi", "10 mi", "25 mi", "50 mi", "100 mi"];
const METRIC = ["10 km", "25 km", "50 km", "100 km", "200 km"];
const same = (a, b) => a.length === b.length && b.every(x => a.includes(x));
return got.length === 5 && (same(got, IMPERIAL) || same(got, METRIC));`, 30000);
  });
  await run.step("\"Update my location\" and \"Clear\" are ABSENT while no radius is set", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
return !items.includes('Update my location') && !items.includes('Clear');`, 30000);
  });
  await run.step("Close the menu WITHOUT choosing a radius (a click would call getCurrentPosition \u2014 Appendix C)", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the menu close", {always: true}, async () => {
    await wait(page, 1);
  });
  await run.step("GUARD: nothing was chosen \u2014 the menu is closed (MEANINGFUL ONLY because the same /^\\d+ (mi|km)$/ matched five items above \u2014 do not decouple them)", {always: true}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
return items.filter(t => /^\\d+ (mi|km)$/.test(t)).length === 0;`, 30000);
  });
  await run.step("CLEAN: sessionStorage['asset_lookup_proximity_radius'] is still empty", {always: true}, async () => {
    await assertFromJavascript(page, `const v = sessionStorage.getItem('asset_lookup_proximity_radius');
return v === null || v === 'null' || v === '';`, 30000);
  });
  await run.step("RESTORED: the button still reads \"Near Me\"", {always: true}, async () => {
    await assertElementPresent(page, `//button[contains(normalize-space(.), "Near Me")]`, 30000);
  });
  run.finish();
}
