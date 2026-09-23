// Generated from Mobile/dd_tests_mobile/MOB.180_Home_Screen.json by to_playwright.py — do not edit by hand yet.
// MOB.180_Home_Screen

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, el, wait } from '../support/dd';

export async function mob180(page: Page): Promise<void> {
    // Navigate to the mobile home page
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`);
    // Let the app shell and GET_SESSION settle
    await wait(page, 5);
    // The welcome banner rendered
    await assertPageContains(page, `Welcome,`, DEFAULT_TIMEOUT);
    // PROOF: the banner greets the SESSION USER, not the 'Friend' fallback
    await assertFromJavascript(page, `const hs = [...document.querySelectorAll('h1,h2,h3')]
  .map(e => (e.textContent || '').trim());
const w = hs.find(t => t.startsWith('Welcome,'));
if (!w) return false;
// Home.tsx falls back to 'Friend' when session.me.name is missing, so the
// fallback rendering is exactly the failure this is here to catch.
return w !== 'Welcome, Friend!' && /^Welcome, \\S.*!$/.test(w);`, 30000);
    // PROOF: the org line names an org, not the 'No Associated Organization' fallback
    await assertFromJavascript(page, `const hs = [...document.querySelectorAll('h3')]
  .map(e => (e.textContent || '').trim());
const o = hs.find(t => t.startsWith('-') && t.endsWith('-'));
if (!o) return false;
return o !== '- No Associated Organization -';`, 30000);
    // Tile "Asset Collector / Lens" is present
    await assertElementPresent(page, `//img[@alt="icon for Asset Collector / Lens url"]`, 30000);
    // Tile "Mobile Jobs" is present
    await assertElementPresent(page, `//img[@alt="icon for Mobile Jobs url"]`, 30000);
    // Tile "Asset Lookup" is present
    await assertElementPresent(page, `//img[@alt="icon for Asset Lookup url"]`, 30000);
    // Tile "Material Lookup" is present
    await assertElementPresent(page, `//img[@alt="icon for Material Lookup url"]`, 30000);
    // Tile "Work Orders" is present
    await assertElementPresent(page, `//img[@alt="icon for Work Orders url"]`, 30000);
    // Tile "The Map" is present
    await assertElementPresent(page, `//img[@alt="icon for The Map url"]`, 30000);
    // All 6 tiles rendered — no permission is silently hiding one
    await assertFromJavascript(page, `const n = document.querySelectorAll('img[alt^="icon for "]').length;
return n === 6;`, 30000);
    // Click the "Work Orders" tile
    await el(page, `//img[@alt="icon for Work Orders url"]`).click({ timeout: 30000 });
    // Let the work route mount
    await wait(page, 3);
    // PROOF: the tile navigated to Work Orders
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Navigate to back to the home page
    await page.goto(`https://dev.mentorapm.com/apm-mobile/`);
    // Let home re-render
    await wait(page, 3);
    // RESTORED: back on Home with its tiles
    await assertElementPresent(page, `//img[@alt="icon for Work Orders url"]`, 30000);
}
