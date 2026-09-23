// Generated from Mobile/dd_tests_mobile/MOB.914_Offline_Feature_Messages.json by to_playwright.py — do not edit by hand yet.
// MOB.914_Offline_Feature_Messages

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertFromJavascript, el, optional, wait } from '../support/dd';

export async function mob914(page: Page): Promise<void> {
  try {
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
    // Open its "Readings" tab (ONLINE — its query must answer first)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Building 0000")]])[1]//*[@role="tab"][normalize-space(.)="Readings"]`).click({ timeout: 30000 });
    // Let the Readings panel render
    await wait(page, 3);
    // ONLINE HALF: the Readings tab reads `No readings recorded for this asset.` (MOB.721's empty state)
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
return (tabEl.textContent || '').trim() === 'Readings'
  && t.includes('No readings recorded for this asset.');`, 30000);
    // Go OFFLINE — dispatch a window `offline` event (`useNetwork`)
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
    // Let the detail re-render offline
    await wait(page, 2);
    // OFFLINE: the header shows the offline icon (`wifi-slash`)
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi-slash"]');`, 20000);
    // ⭐ READINGS OFFLINE: the SAME tab is now `This feature requires an internet connection.` — not `No readings recorded for this asset.` (`EventReadings.tsx:240`)
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
return (tabEl.textContent || '').trim() === 'Readings'
  && t.includes('This feature requires an internet connection.') && !t.includes('No readings recorded for this asset.');`, 30000);
    // Open its "Work History" tab (the queue is closed: its query is held)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Building 0000")]])[1]//*[@role="tab"][normalize-space(.)="Work History"]`).click({ timeout: 30000 });
    // Let the Work History panel mount
    await wait(page, 2);
    // Dispatch `offline` AGAIN — the freshly mounted Work History instance started online (`useNetwork` on mount)
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
    // Let the Work History panel re-render
    await wait(page, 2);
    // ⭐ WORK HISTORY OFFLINE: the tab is `This feature requires an internet connection.` (`WorkHistory.tsx:132`)
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
return (tabEl.textContent || '').trim() === 'Work History'
  && t.includes('This feature requires an internet connection.');`, 30000);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: 30000 });
    // Select any persisted query first (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Search for Tank 0000
    await el(page, `//input[@name="asset-search"]`).fill(`Tank 0000`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter)
    await page.keyboard.press(`Enter`);
    // Wait for the search results (network-only)
    await wait(page, 8);
    // Expand Tank 0000's row by its chevron (never the avatar — bugs §35)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`).click({ timeout: 30000 });
    // Let the detail panel mount
    await wait(page, 3);
    // Open its "Readings" tab (ONLINE — its latest readings must load first)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[@role="tab"][normalize-space(.)="Readings"]`).click({ timeout: 30000 });
    // Let the Readings panel render
    await wait(page, 3);
    // FIXTURE GUARD: Tank 0000's Readings panel lists readings (`N of M recorded recently`) and offers `Add reading types`
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')];
const it = items.find(i => { const c = i.querySelector('[class*="mantine-Accordion-control"]');
  return c && (c.textContent || '').includes('Tank 0000'); });
if (!it) return false;
const tabEl = it.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...it.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!p || !tabEl) return false;
const t = (p.textContent || '');
return /\\d+ of \\d+ recorded recently/.test(t) && !!p.querySelector('[aria-label="Add reading types"]');`, 30000);
    // Go OFFLINE — dispatch a window `offline` event (`useNetwork`)
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
    // Let the detail re-render offline
    await wait(page, 2);
    // OFFLINE: the header shows the offline icon (`wifi-slash`)
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi-slash"]');`, 20000);
    // OFFLINE, the SAME panel still lists its readings and the button — the tab is not replaced by the message
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')];
const it = items.find(i => { const c = i.querySelector('[class*="mantine-Accordion-control"]');
  return c && (c.textContent || '').includes('Tank 0000'); });
if (!it) return false;
const tabEl = it.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...it.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!p || !tabEl) return false;
const t = (p.textContent || '');
return /\\d+ of \\d+ recorded recently/.test(t) && !!p.querySelector('[aria-label="Add reading types"]');`, 30000);
    // 🛑 GUARD + click `Add reading types` — ONLY while offline (online it opens the AddReadingTypes modal)
    await assertFromJavascript(page, `if (!!!document.querySelector('[data-icon="wifi-slash"]')) return false;
const items = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')];
const it = items.find(i => { const c = i.querySelector('[class*="mantine-Accordion-control"]');
  return c && (c.textContent || '').includes('Tank 0000'); });
if (!it) return false;
const tabEl = it.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...it.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!p || !tabEl) return false;
const t = (p.textContent || '');
const b = p.querySelector('[aria-label="Add reading types"]');
if (!b) return false;
b.click();
return true;`, 30000);
    // Let the popover open
    await wait(page, 1);
    // ⭐ ADD READING TYPES OFFLINE: its popover reads `This feature requires an internet connection.` (`EventReadings.tsx:300`) — no AddReadingTypes modal
    await assertFromJavascript(page, `const d = [...document.querySelectorAll('.mantine-Popover-dropdown')]
  .find(x => (x.textContent || '').includes('This feature requires an internet connection.'));
return !!d && !document.querySelector('.mantine-Modal-content');`, 20000);
    // Open its "Photos" tab
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[@role="tab"][normalize-space(.)="Photos"]`).click({ timeout: 30000 });
    // Let the photos render
    await wait(page, 4);
    // FIXTURE GUARD: Tank 0000's Photos panel shows at least one photo with a gear
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')];
const it = items.find(i => { const c = i.querySelector('[class*="mantine-Accordion-control"]');
  return c && (c.textContent || '').includes('Tank 0000'); });
if (!it) return false;
const tabEl = it.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...it.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!p || !tabEl) return false;
const t = (p.textContent || '');
return !!p.querySelector('[class*="mantine-Carousel-slide"] [aria-label="Settings"]');`, 30000);
    // Go OFFLINE — dispatch a window `offline` event (`useNetwork`)
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
    // Let the detail re-render offline
    await wait(page, 2);
    // OFFLINE: the header shows the offline icon (`wifi-slash`)
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi-slash"]');`, 20000);
    // Open the first photo's gear menu
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')];
const it = items.find(i => { const c = i.querySelector('[class*="mantine-Accordion-control"]');
  return c && (c.textContent || '').includes('Tank 0000'); });
if (!it) return false;
const tabEl = it.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...it.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!p || !tabEl) return false;
const t = (p.textContent || '');
const g = p.querySelector('[class*="mantine-Carousel-slide"] [aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
    // Let the menu open
    await wait(page, 1);
    // 🛑 GUARD + record + click `Get Description` — ONLY while offline AND styled disabled (online it posts to the AI route)
    await assertFromJavascript(page, `if (!!!document.querySelector('[data-icon="wifi-slash"]')) return false;
window.__dd914Seen = 0;
new MutationObserver(() => { if ((document.body.textContent || '').includes('This feature requires an internet connection.')) window.__dd914Seen++; })
  .observe(document.body, { childList: true, subtree: true, characterData: true });
const it = [...document.querySelectorAll('.mantine-Menu-dropdown .mantine-Menu-item')]
  .find(i => (i.textContent || '').trim() === 'Get Description');
if (!it || !(it.getAttribute('style') || '').includes('opacity')) return false;
it.click();
return true;`, 30000);
    // Let the popover open
    await wait(page, 1);
    // ⭐ GET DESCRIPTION OFFLINE: `This feature requires an internet connection.` was rendered (recorded by the observer — `PhotoMenu.tsx` connection hint)
    await assertFromJavascript(page, `return (window.__dd914Seen || 0) > 0;`, 20000);
    await optional("\ud83d\udcca (optional) the message is still on screen once the menu has closed \u2014 red while bugs \u00a743 is open (it flashes and unmounts with the menu)", async () => {
      await assertFromJavascript(page, `return !document.querySelector('.mantine-Menu-dropdown')
  && (document.body.textContent || '').includes('This feature requires an internet connection.');`, 5000);
    });
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Back ONLINE before the next asset — dispatch `online`
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
    // Let it re-render online
    await wait(page, 2);
    // Back ONLINE before the photo menu — dispatch `online`
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
    // Close the popover (Escape)
    await page.keyboard.press(`Escape`);
    // Let it re-render online
    await wait(page, 2);
    // RESTORE: dispatch `online`
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
    // Close the menu/popover (Escape — no modal is open here)
    await page.keyboard.press(`Escape`);
    // Reload Asset Lookup so no later subtest inherits an offline `useNetwork`
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Let it mount
    await wait(page, 4);
    // RESTORED: the online icon is back (`wifi`), not `wifi-slash`
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi"]') && !document.querySelector('[data-icon="wifi-slash"]');`, 30000);
  }
}
