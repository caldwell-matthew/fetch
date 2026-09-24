// Generated from legacy/Mobile/dd_tests_mobile/MOB.914_Offline_Feature_Messages.json by to_playwright.py — do not edit by hand yet.
// MOB.914_Offline_Feature_Messages

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertFromJavascript, click, press, typeText, wait } from '../support/dd';

export async function mob914(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to Asset Lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the page to mount", {}, async () => {
    await wait(page, 5);
  });
  await run.step("Test the \"Asset Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, 30000);
  });
  await run.step("Select any persisted query first (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for Building 0000", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Building 0000`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Wait for the search results (network-only)", {}, async () => {
    await wait(page, 8);
  });
  await run.step("Expand Building 0000's row by its chevron (never the avatar \u2014 bugs \u00a735)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Building 0000")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`, 30000);
  });
  await run.step("Let the detail panel mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Open its \"Readings\" tab (ONLINE \u2014 its query must answer first)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Building 0000")]])[1]//*[@role="tab"][normalize-space(.)="Readings"]`, 30000);
  });
  await run.step("Let the Readings panel render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("ONLINE HALF: the Readings tab reads `No readings recorded for this asset.` (MOB.721's empty state)", {}, async () => {
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
  });
  await run.step("Go OFFLINE \u2014 dispatch a window `offline` event (`useNetwork`)", {}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
  });
  await run.step("Let the detail re-render offline", {}, async () => {
    await wait(page, 2);
  });
  await run.step("OFFLINE: the header shows the offline icon (`wifi-slash`)", {}, async () => {
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi-slash"]');`, 20000);
  });
  await run.step("\u2b50 READINGS OFFLINE: the SAME tab is now `This feature requires an internet connection.` \u2014 not `No readings recorded for this asset.` (`EventReadings.tsx:240`)", {}, async () => {
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
  });
  await run.step("Open its \"Work History\" tab (the queue is closed: its query is held)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Building 0000")]])[1]//*[@role="tab"][normalize-space(.)="Work History"]`, 30000);
  });
  await run.step("Let the Work History panel mount", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Dispatch `offline` AGAIN \u2014 the freshly mounted Work History instance started online (`useNetwork` on mount)", {}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
  });
  await run.step("Let the Work History panel re-render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 WORK HISTORY OFFLINE: the tab is `This feature requires an internet connection.` (`WorkHistory.tsx:132`)", {}, async () => {
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
  });
  await run.step("Back ONLINE before the next asset \u2014 dispatch `online`", {always: true}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
  });
  await run.step("Let it re-render online", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Focus the search input", {}, async () => {
    await click(page, `//input[@name="asset-search"]`, 30000);
  });
  await run.step("Select any persisted query first (typeText APPENDS \u2014 trap 17)", {}, async () => {
    await press(page, `Control+a`);
  });
  await run.step("Search for Tank 0000", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Tank 0000`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Wait for the search results (network-only)", {}, async () => {
    await wait(page, 8);
  });
  await run.step("Expand Tank 0000's row by its chevron (never the avatar \u2014 bugs \u00a735)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`, 30000);
  });
  await run.step("Let the detail panel mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Open its \"Readings\" tab (ONLINE \u2014 its latest readings must load first)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[@role="tab"][normalize-space(.)="Readings"]`, 30000);
  });
  await run.step("Let the Readings panel render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("FIXTURE GUARD: Tank 0000's Readings panel lists readings (`N of M recorded recently`) and offers `Add reading types`", {}, async () => {
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
  });
  await run.step("Go OFFLINE \u2014 dispatch a window `offline` event (`useNetwork`)", {}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
  });
  await run.step("Let the detail re-render offline", {}, async () => {
    await wait(page, 2);
  });
  await run.step("OFFLINE: the header shows the offline icon (`wifi-slash`)", {}, async () => {
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi-slash"]');`, 20000);
  });
  await run.step("OFFLINE, the SAME panel still lists its readings and the button \u2014 the tab is not replaced by the message", {}, async () => {
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
  });
  await run.step("\ud83d\uded1 GUARD + click `Add reading types` \u2014 ONLY while offline (online it opens the AddReadingTypes modal)", {}, async () => {
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
  });
  await run.step("Let the popover open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("\u2b50 ADD READING TYPES OFFLINE: its popover reads `This feature requires an internet connection.` (`EventReadings.tsx:300`) \u2014 no AddReadingTypes modal", {}, async () => {
    await assertFromJavascript(page, `const d = [...document.querySelectorAll('.mantine-Popover-dropdown')]
  .find(x => (x.textContent || '').includes('This feature requires an internet connection.'));
return !!d && !document.querySelector('.mantine-Modal-content');`, 20000);
  });
  await run.step("Back ONLINE before the photo menu \u2014 dispatch `online`", {always: true}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
  });
  await run.step("Close the popover (Escape)", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let it re-render online", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("Open its \"Photos\" tab", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Tank 0000")]])[1]//*[@role="tab"][normalize-space(.)="Photos"]`, 30000);
  });
  await run.step("Let the photos render", {}, async () => {
    await wait(page, 4);
  });
  await run.step("FIXTURE GUARD: Tank 0000's Photos panel shows at least one photo with a gear", {}, async () => {
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
  });
  await run.step("Go OFFLINE \u2014 dispatch a window `offline` event (`useNetwork`)", {}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('offline'));
return true;`, 15000);
  });
  await run.step("Let the detail re-render offline", {}, async () => {
    await wait(page, 2);
  });
  await run.step("OFFLINE: the header shows the offline icon (`wifi-slash`)", {}, async () => {
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi-slash"]');`, 20000);
  });
  await run.step("Open the first photo's gear menu", {}, async () => {
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
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("\ud83d\uded1 GUARD + record + click `Get Description` \u2014 ONLY while offline AND styled disabled (online it posts to the AI route)", {}, async () => {
    await assertFromJavascript(page, `if (!!!document.querySelector('[data-icon="wifi-slash"]')) return false;
window.__dd914Seen = 0;
new MutationObserver(() => { if ((document.body.textContent || '').includes('This feature requires an internet connection.')) window.__dd914Seen++; })
  .observe(document.body, { childList: true, subtree: true, characterData: true });
const it = [...document.querySelectorAll('.mantine-Menu-dropdown .mantine-Menu-item')]
  .find(i => (i.textContent || '').trim() === 'Get Description');
if (!it || !(it.getAttribute('style') || '').includes('opacity')) return false;
it.click();
return true;`, 30000);
  });
  await run.step("Let the popover open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("\u2b50 GET DESCRIPTION OFFLINE: `This feature requires an internet connection.` was rendered (recorded by the observer \u2014 `PhotoMenu.tsx` connection hint)", {}, async () => {
    await assertFromJavascript(page, `return (window.__dd914Seen || 0) > 0;`, 20000);
  });
  await run.step("\ud83d\udcca (optional) the message is still on screen once the menu has closed \u2014 red while bugs \u00a743 is open (it flashes and unmounts with the menu)", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Menu-dropdown')
  && (document.body.textContent || '').includes('This feature requires an internet connection.');`, 5000);
  });
  await run.step("RESTORE: dispatch `online`", {always: true}, async () => {
    await assertFromJavascript(page, `window.dispatchEvent(new Event('online'));
return true;`, 15000);
  });
  await run.step("Close the menu/popover (Escape \u2014 no modal is open here)", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Reload Asset Lookup so no later subtest inherits an offline `useNetwork`", {always: true}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let it mount", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("RESTORED: the online icon is back (`wifi`), not `wifi-slash`", {always: true}, async () => {
    await assertFromJavascript(page, `return !!document.querySelector('[data-icon="wifi"]') && !document.querySelector('[data-icon="wifi-slash"]');`, 30000);
  });
  run.finish();
}
