// Generated from legacy/Mobile/dd_tests_mobile/MOB.302_Work_Photo_Copy_To_Asset.json by to_playwright.py — do not edit by hand yet.
// MOB.302_Work_Photo_Copy_To_Asset

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, typeText, wait } from '../support/dd';

export async function mob302(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to Asset Lookup (premise)", {}, async () => {
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
  await run.step("Search for Bypass Valve 0001", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Bypass Valve 0001`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Wait for the search results (network-only)", {}, async () => {
    await wait(page, 8);
  });
  await run.step("Expand Bypass Valve 0001's row by its chevron (never the avatar \u2014 bugs \u00a735)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Bypass Valve 0001")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`, 30000);
  });
  await run.step("Let the detail panel mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Open its \"Photos\" tab", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Bypass Valve 0001")]])[1]//*[@role="tab"][normalize-space(.)="Photos"]`, 30000);
  });
  await run.step("Let the Photos panel render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PREMISE: Bypass Valve 0001 holds NO photos \u2014 the Photos panel rendered (`Add Photo`) and has no slides. A leftover copy stops the test here; it never deletes what this run did not make", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')];
const it = items.find(i => {
  const c = i.querySelector('[class*="mantine-Accordion-control"]');
  return c && (c.textContent || '').includes('Bypass Valve 0001');
});
if (!it) return false;
const tabEl = it.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...it.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!p) return false;
const slides = [...p.querySelectorAll('[class*="mantine-Carousel-slide"]')];
const labels = [...p.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return slides.length === 0 && labels.includes('Add Photo');`, 30000);
  });
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Wait for the workstage pages and the lookup prefetch", {}, async () => {
    await wait(page, 20);
  });
  await run.step("The work list rendered its search box", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 1/3: the initial fetch finished", {}, async () => {
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 2/3: paging through workstages finished", {}, async () => {
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 3/3: the per-stage detail downloads finished", {}, async () => {
    await assertPageLacks(page, `workstages downloaded`, 360000);
  });
  await run.step("LOADEDALL: start the idle clock", {}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd_worklist_idle_since');
return true;`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL: no loading bar on screen for 10s straight (all six phases, and the gaps between them)", {}, async () => {
    await assertFromJavascript(page, `const K = '__dd_worklist_idle_since';
if (document.querySelector('.mantine-Progress-root')) {
  sessionStorage.removeItem(K);
  return false;
}
const since = Number(sessionStorage.getItem(K)) || 0;
if (!since) { sessionStorage.setItem(K, String(Date.now())); return false; }
return Date.now() - since >= 10000;`, 360000);
  });
  await run.step("Navigate to the copy-to-asset work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/RcdI0xcpc8NBV8VoRNNBYM`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the \"Attachments\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Attachments")]`, 30000);
  });
  await run.step("Let the Photos segment render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("CAPTURE: the work order's ONE photo \u2014 its attachment id and file name (the SOURCE)", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const idOf = img => ((img && img.getAttribute('src') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const slides = [...p.querySelectorAll('[class*="mantine-Carousel-slide"]')];
if (slides.length !== 1) return false;
const img = slides[0].querySelector('img');
const id = idOf(img), name = img && img.getAttribute('alt');
if (!id || !name) return false;
sessionStorage.setItem('__dd302_srcId', id);
sessionStorage.setItem('__dd302_srcName', name);
return true;`, 30000);
  });
  await run.step("Open the photo's gear menu", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const s = p.querySelector('[class*="mantine-Carousel-slide"]');
const g = s && s.querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("MENU (work-order photo): offers `Copy to asset` (and the stage's own `Delete Photo`)", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('[class*="mantine-Menu-dropdown"] [class*="mantine-Menu-item"]')]
  .map(i => (i.textContent || '').trim());
return items.includes('Copy to asset') && items.includes('Delete Photo');`, 30000);
  });
  await run.step("Click `Copy to asset` (NEVER `Delete Photo` here)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Copy to asset"])[1]`, 30000);
  });
  await run.step("Let the copy form open", {}, async () => {
    await wait(page, 2);
  });
  await run.step("COPY FORM: names the source file, and offers exactly one asset \u2014 Bypass Valve 0001, selected", {}, async () => {
    await assertFromJavascript(page, `const srcId = sessionStorage.getItem('__dd302_srcId');
const srcName = sessionStorage.getItem('__dd302_srcName');
const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select an asset'));
if (!m || !srcName) return false;
const radios = [...m.querySelectorAll('input[type="radio"]')];
const lab = r => { const l = m.querySelector('label[for="' + r.id + '"]'); return l ? l.textContent.trim() : ''; };
return (m.textContent || '').includes('Copy attachment ' + srcName)
  && radios.length === 1 && radios[0].checked && lab(radios[0]) === 'Bypass Valve 0001';`, 30000);
  });
  await run.step("Submit the copy", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Select an asset")]]//button[normalize-space(.)="Submit"]`, 30000);
  });
  await run.step("Wait for COPY_ATTACHMENT", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The `copied to asset.` toast (optional: transient)", {allow: 'ignore'}, async () => {
    await assertPageContains(page, `copied to asset.`, DEFAULT_TIMEOUT);
  });
  await run.step("Let the server answer", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 THE COPY FORM CLOSED \u2014 it closes only in the mutation's `update()`, so the server answered", {}, async () => {
    await assertFromJavascript(page, `return ![...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .some(x => (x.textContent || '').includes('Select an asset'));`, 30000);
  });
  await run.step("Navigate to Asset Lookup (proof)", {}, async () => {
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
  await run.step("Search for Bypass Valve 0001", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Bypass Valve 0001`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Wait for the search results (network-only)", {}, async () => {
    await wait(page, 8);
  });
  await run.step("Expand Bypass Valve 0001's row by its chevron (never the avatar \u2014 bugs \u00a735)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Bypass Valve 0001")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`, 30000);
  });
  await run.step("Let the detail panel mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Open its \"Photos\" tab", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Bypass Valve 0001")]])[1]//*[@role="tab"][normalize-space(.)="Photos"]`, 30000);
  });
  await run.step("Let the Photos panel render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 Bypass Valve 0001 now holds EXACTLY ONE photo \u2014 the SOURCE's attachment id and file name: `Copy to asset` LINKS the same attachment, it does not duplicate it", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')];
const it = items.find(i => {
  const c = i.querySelector('[class*="mantine-Accordion-control"]');
  return c && (c.textContent || '').includes('Bypass Valve 0001');
});
if (!it) return false;
const tabEl = it.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...it.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!p) return false;
const slides = [...p.querySelectorAll('[class*="mantine-Carousel-slide"]')];
const labels = [...p.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const idOf = img => ((img && img.getAttribute('src') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const srcId = sessionStorage.getItem('__dd302_srcId');
const srcName = sessionStorage.getItem('__dd302_srcName');
if (slides.length !== 1 || !srcId || !srcName) return false;
const img = slides[0].querySelector('img');
return idOf(img) === srcId && img.getAttribute('alt') === srcName;`, 30000);
  });
  await run.step("\ud83d\uded1 GUARD + open the gear: only if the asset's one photo IS the source this run read on the work order (>= 2 references, so the delete can only unlink)", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')];
const it = items.find(i => {
  const c = i.querySelector('[class*="mantine-Accordion-control"]');
  return c && (c.textContent || '').includes('Bypass Valve 0001');
});
if (!it) return false;
const tabEl = it.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...it.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!p) return false;
const slides = [...p.querySelectorAll('[class*="mantine-Carousel-slide"]')];
const labels = [...p.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const idOf = img => ((img && img.getAttribute('src') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const srcId = sessionStorage.getItem('__dd302_srcId');
const srcName = sessionStorage.getItem('__dd302_srcName');
if (slides.length !== 1 || !srcId || !srcName) return false;
const img = slides[0].querySelector('img');
if (idOf(img) !== srcId || img.getAttribute('alt') !== srcName) return false;
const g = slides[0].querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Click `Delete Photo` \u2014 on the ASSET (unlinks its association row only)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Delete Photo"])[1]`, 30000);
  });
  await run.step("Let the confirmation open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Confirm: \"Yes\"", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Are you sure you want to delete this image?")]]//button[normalize-space(.)="Yes"]`, 30000);
  });
  await run.step("Wait for REMOVE_ATTACHMENT", {}, async () => {
    await wait(page, 5);
  });
  await run.step("Navigate to Asset Lookup (after the delete)", {}, async () => {
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
  await run.step("Search for Bypass Valve 0001", {}, async () => {
    await typeText(page, `//input[@name="asset-search"]`, `Bypass Valve 0001`, DEFAULT_TIMEOUT);
  });
  await run.step("Submit the search (Enter)", {}, async () => {
    await press(page, `Enter`);
  });
  await run.step("Wait for the search results (network-only)", {}, async () => {
    await wait(page, 8);
  });
  await run.step("Expand Bypass Valve 0001's row by its chevron (never the avatar \u2014 bugs \u00a735)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Bypass Valve 0001")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`, 30000);
  });
  await run.step("Let the detail panel mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Open its \"Photos\" tab", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Bypass Valve 0001")]])[1]//*[@role="tab"][normalize-space(.)="Photos"]`, 30000);
  });
  await run.step("Let the Photos panel render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 UNLINKED: Bypass Valve 0001 holds NO photos again \u2014 0 \u2192 1 \u2192 0", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('[class*="mantine-Accordion-item"]')];
const it = items.find(i => {
  const c = i.querySelector('[class*="mantine-Accordion-control"]');
  return c && (c.textContent || '').includes('Bypass Valve 0001');
});
if (!it) return false;
const tabEl = it.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...it.querySelectorAll('[role="tabpanel"]')].find(x => x.style.display !== 'none');
if (!p) return false;
const slides = [...p.querySelectorAll('[class*="mantine-Carousel-slide"]')];
const labels = [...p.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return slides.length === 0 && labels.includes('Add Photo');`, 30000);
  });
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Wait for the workstage pages and the lookup prefetch", {}, async () => {
    await wait(page, 20);
  });
  await run.step("The work list rendered its search box", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 1/3: the initial fetch finished", {}, async () => {
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 2/3: paging through workstages finished", {}, async () => {
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 3/3: the per-stage detail downloads finished", {}, async () => {
    await assertPageLacks(page, `workstages downloaded`, 360000);
  });
  await run.step("LOADEDALL: start the idle clock", {}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd_worklist_idle_since');
return true;`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL: no loading bar on screen for 10s straight (all six phases, and the gaps between them)", {}, async () => {
    await assertFromJavascript(page, `const K = '__dd_worklist_idle_since';
if (document.querySelector('.mantine-Progress-root')) {
  sessionStorage.removeItem(K);
  return false;
}
const since = Number(sessionStorage.getItem(K)) || 0;
if (!since) { sessionStorage.setItem(K, String(Date.now())); return false; }
return Date.now() - since >= 10000;`, 360000);
  });
  await run.step("Navigate to the copy-to-asset work order", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/RcdI0xcpc8NBV8VoRNNBYM`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("Open the \"Attachments\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Attachments")]`, 30000);
  });
  await run.step("Let the Photos segment render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 THE SOURCE IS UNTOUCHED: the work order still has its one photo, same id", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const idOf = img => ((img && img.getAttribute('src') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const srcId = sessionStorage.getItem('__dd302_srcId');
const srcName = sessionStorage.getItem('__dd302_srcName');
const slides = [...p.querySelectorAll('[class*="mantine-Carousel-slide"]')];
return slides.length === 1 && !!srcId && idOf(slides[0].querySelector('img')) === srcId;`, 30000);
  });
  await run.step("\u2026and its FILE survived: the image loaded (a deleted S3 object 404s to naturalWidth 0) (soft: lazy loading could leave it unloaded)", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const idOf = img => ((img && img.getAttribute('src') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const srcId = sessionStorage.getItem('__dd302_srcId');
const srcName = sessionStorage.getItem('__dd302_srcName');
const img = p.querySelector('[class*="mantine-Carousel-slide"] img');
return !!img && idOf(img) === srcId && img.complete && img.naturalWidth > 0;`, 30000);
  });
  await run.step("Remove this test's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd302_srcId', '__dd302_srcName'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  run.finish();
}
