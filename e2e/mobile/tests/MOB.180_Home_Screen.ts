// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.180_Home_Screen.json. This file is the source now: edit it directly.
// MOB.180_Home_Screen

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, click, wait } from '../../support/dd';

export async function mob180(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile home page", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the app shell and GET_SESSION settle", {}, async () => {
    await wait(page, 5);
  });
  await run.step("The welcome banner rendered", {}, async () => {
    await assertPageContains(page, `Welcome,`, DEFAULT_TIMEOUT);
  });
  await run.step("PROOF: the banner greets the SESSION USER, not the 'Friend' fallback", {}, async () => {
    await assertFromJavascript(page, `const hs = [...document.querySelectorAll('h1,h2,h3')]
  .map(e => (e.textContent || '').trim());
const w = hs.find(t => t.startsWith('Welcome,'));
if (!w) return false;
// Home.tsx falls back to 'Friend' when session.me.name is missing, so the
// fallback rendering is exactly the failure this is here to catch.
return w !== 'Welcome, Friend!' && /^Welcome, \\S.*!$/.test(w);`, 30000);
  });
  await run.step("PROOF: the org line names an org, not the 'No Associated Organization' fallback", {}, async () => {
    await assertFromJavascript(page, `const hs = [...document.querySelectorAll('h3')]
  .map(e => (e.textContent || '').trim());
const o = hs.find(t => t.startsWith('-') && t.endsWith('-'));
if (!o) return false;
return o !== '- No Associated Organization -';`, 30000);
  });
  await run.step("Tile \"Asset Collector / Lens\" is present", {}, async () => {
    await assertElementPresent(page, `//img[@alt="icon for Asset Collector / Lens url"]`, 30000);
  });
  await run.step("Tile \"Mobile Jobs\" is present", {}, async () => {
    await assertElementPresent(page, `//img[@alt="icon for Mobile Jobs url"]`, 30000);
  });
  await run.step("Tile \"Asset Lookup\" is present", {}, async () => {
    await assertElementPresent(page, `//img[@alt="icon for Asset Lookup url"]`, 30000);
  });
  await run.step("Tile \"Material Lookup\" is present", {}, async () => {
    await assertElementPresent(page, `//img[@alt="icon for Material Lookup url"]`, 30000);
  });
  await run.step("Tile \"Work Orders\" is present", {}, async () => {
    await assertElementPresent(page, `//img[@alt="icon for Work Orders url"]`, 30000);
  });
  await run.step("Tile \"The Map\" is present", {}, async () => {
    await assertElementPresent(page, `//img[@alt="icon for The Map url"]`, 30000);
  });
  await run.step("All 6 tiles rendered \u2014 no permission is silently hiding one", {}, async () => {
    await assertFromJavascript(page, `const n = document.querySelectorAll('img[alt^="icon for "]').length;
return n === 6;`, 30000);
  });
  await run.step("Click the \"Work Orders\" tile", {}, async () => {
    await click(page, `//img[@alt="icon for Work Orders url"]`, 30000);
  });
  await run.step("Let the work route mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PROOF: the tile navigated to Work Orders", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Navigate to back to the home page", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let home re-render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("RESTORED: back on Home with its tiles", {}, async () => {
    await assertElementPresent(page, `//img[@alt="icon for Work Orders url"]`, 30000);
  });
  run.finish();
}
