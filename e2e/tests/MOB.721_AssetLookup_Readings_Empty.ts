// Generated from Mobile/dd_tests_mobile/MOB.721_AssetLookup_Readings_Empty.json by to_playwright.py — do not edit by hand yet.
// MOB.721_AssetLookup_Readings_Empty

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertFromJavascript, el, wait } from '../support/dd';

export async function mob721(page: Page): Promise<void> {
    // Navigate to Asset Lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for the page to mount
    await wait(page, 5);
    // Test the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: 30000 });
    // Select any persisted query first (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Search for Building 0000
    await el(page, `//input[@name="asset-search"]`).fill(`Building 0000`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter)
    await page.keyboard.press(`Enter`);
    // Wait for the search results (network-only)
    await wait(page, 8);
    // Expand Building 0000's row by its chevron (never the avatar — bugs §35)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Building 0000")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`).click({ timeout: 30000 });
    // Let the detail panel mount
    await wait(page, 3);
    // Open its "Readings" tab
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Building 0000")]])[1]//*[@role="tab"][normalize-space(.)="Readings"]`).click({ timeout: 30000 });
    // Let the Readings panel render
    await wait(page, 3);
    // The ACTIVE tab of the Building 0000 row is `Readings` (the panel below is its own)
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')];
const it = items.find(i => { const c = i.querySelector('[class*="mantine-Accordion-control"]');
  return c && (c.textContent || '').includes('Building 0000'); });
if (!it) return false;
const tabEl = it.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...it.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!p || !tabEl) return false;
const t = (p.textContent || '');
return (tabEl.textContent || '').trim() === 'Readings';`, 30000);
    // ⭐ EMPTY STATE: the panel reads `No readings recorded for this asset.` — the asset has no readings
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')];
const it = items.find(i => { const c = i.querySelector('[class*="mantine-Accordion-control"]');
  return c && (c.textContent || '').includes('Building 0000'); });
if (!it) return false;
const tabEl = it.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...it.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!p || !tabEl) return false;
const t = (p.textContent || '');
return t.includes('No readings recorded for this asset.');`, 30000);
}
