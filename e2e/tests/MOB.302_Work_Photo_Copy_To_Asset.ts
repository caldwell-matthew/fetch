// Generated from Mobile/dd_tests_mobile/MOB.302_Work_Photo_Copy_To_Asset.json by to_playwright.py — do not edit by hand yet.
// MOB.302_Work_Photo_Copy_To_Asset

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, wait } from '../support/dd';

export async function mob302(page: Page): Promise<void> {
  const soft = new Soft();
  try {
    // Navigate to Asset Lookup (premise)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for the page to mount
    await wait(page, 5);
    // Test the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: 30000 });
    // Select any persisted query first (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Search for Bypass Valve 0001
    await el(page, `//input[@name="asset-search"]`).fill(`Bypass Valve 0001`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter)
    await page.keyboard.press(`Enter`);
    // Wait for the search results (network-only)
    await wait(page, 8);
    // Expand Bypass Valve 0001's row by its chevron (never the avatar — bugs §35)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Bypass Valve 0001")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`).click({ timeout: 30000 });
    // Let the detail panel mount
    await wait(page, 3);
    // Open its "Photos" tab
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Bypass Valve 0001")]])[1]//*[@role="tab"][normalize-space(.)="Photos"]`).click({ timeout: 30000 });
    // Let the Photos panel render
    await wait(page, 3);
    // PREMISE: Bypass Valve 0001 holds NO photos — the Photos panel rendered (`Add Photo`) and has no slides. A leftover copy stops the test here; it never deletes what this run did not make
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
    // Navigate to /work — the work order list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Wait for the workstage pages and the lookup prefetch
    await wait(page, 20);
    // The work list rendered its search box
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
    // LOADEDALL 1/3: the initial fetch finished
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
    // LOADEDALL 2/3: paging through workstages finished
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
    // LOADEDALL 3/3: the per-stage detail downloads finished
    await assertPageLacks(page, `workstages downloaded`, 180000);
    // Navigate to the copy-to-asset work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/RcdI0xcpc8NBV8VoRNNBYM`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the "Attachments" tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Attachments")]`).click({ timeout: 30000 });
    // Let the Photos segment render
    await wait(page, 3);
    // CAPTURE: the work order's ONE photo — its attachment id and file name (the SOURCE)
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
    // Open the photo's gear menu
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
    // Let the menu open
    await wait(page, 1);
    // MENU (work-order photo): offers `Copy to asset` (and the stage's own `Delete Photo`)
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('[class*="mantine-Menu-dropdown"] [class*="mantine-Menu-item"]')]
  .map(i => (i.textContent || '').trim());
return items.includes('Copy to asset') && items.includes('Delete Photo');`, 30000);
    // Click `Copy to asset` (NEVER `Delete Photo` here)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Copy to asset"])[1]`).click({ timeout: 30000 });
    // Let the copy form open
    await wait(page, 2);
    // COPY FORM: names the source file, and offers exactly one asset — Bypass Valve 0001, selected
    await assertFromJavascript(page, `const srcId = sessionStorage.getItem('__dd302_srcId');
const srcName = sessionStorage.getItem('__dd302_srcName');
const m = [...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .find(x => (x.textContent || '').includes('Select an asset'));
if (!m || !srcName) return false;
const radios = [...m.querySelectorAll('input[type="radio"]')];
const lab = r => { const l = m.querySelector('label[for="' + r.id + '"]'); return l ? l.textContent.trim() : ''; };
return (m.textContent || '').includes('Copy attachment ' + srcName)
  && radios.length === 1 && radios[0].checked && lab(radios[0]) === 'Bypass Valve 0001';`, 30000);
    // Submit the copy
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Select an asset")]]//button[normalize-space(.)="Submit"]`).click({ timeout: 30000 });
    // Wait for COPY_ATTACHMENT
    await wait(page, 3);
    await optional("The `copied to asset.` toast (optional: transient)", async () => {
      await assertPageContains(page, `copied to asset.`, DEFAULT_TIMEOUT);
    });
    // Let the server answer
    await wait(page, 3);
    // ⭐ THE COPY FORM CLOSED — it closes only in the mutation's `update()`, so the server answered
    await assertFromJavascript(page, `return ![...document.querySelectorAll('[class*="mantine-Modal-content"]')]
  .some(x => (x.textContent || '').includes('Select an asset'));`, 30000);
    // Navigate to Asset Lookup (proof)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for the page to mount
    await wait(page, 5);
    // Test the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: 30000 });
    // Select any persisted query first (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Search for Bypass Valve 0001
    await el(page, `//input[@name="asset-search"]`).fill(`Bypass Valve 0001`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter)
    await page.keyboard.press(`Enter`);
    // Wait for the search results (network-only)
    await wait(page, 8);
    // Expand Bypass Valve 0001's row by its chevron (never the avatar — bugs §35)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Bypass Valve 0001")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`).click({ timeout: 30000 });
    // Let the detail panel mount
    await wait(page, 3);
    // Open its "Photos" tab
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Bypass Valve 0001")]])[1]//*[@role="tab"][normalize-space(.)="Photos"]`).click({ timeout: 30000 });
    // Let the Photos panel render
    await wait(page, 3);
    // ⭐ Bypass Valve 0001 now holds EXACTLY ONE photo — the SOURCE's attachment id and file name: `Copy to asset` LINKS the same attachment, it does not duplicate it
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
    // 🛑 GUARD + open the gear: only if the asset's one photo IS the source this run read on the work order (>= 2 references, so the delete can only unlink)
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
    // Let the menu open
    await wait(page, 1);
    // Click `Delete Photo` — on the ASSET (unlinks its association row only)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Delete Photo"])[1]`).click({ timeout: 30000 });
    // Let the confirmation open
    await wait(page, 1);
    // Confirm: "Yes"
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Are you sure you want to delete this image?")]]//button[normalize-space(.)="Yes"]`).click({ timeout: 30000 });
    // Wait for REMOVE_ATTACHMENT
    await wait(page, 5);
    // Navigate to Asset Lookup (after the delete)
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-lookup`);
    // Wait for the page to mount
    await wait(page, 5);
    // Test the "Asset Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]`, `Asset Lookup`, 30000);
    // Focus the search input
    await el(page, `//input[@name="asset-search"]`).click({ timeout: 30000 });
    // Select any persisted query first (typeText APPENDS — trap 17)
    await page.keyboard.press(`Control+a`);
    // Search for Bypass Valve 0001
    await el(page, `//input[@name="asset-search"]`).fill(`Bypass Valve 0001`, { timeout: DEFAULT_TIMEOUT });
    // Submit the search (Enter)
    await page.keyboard.press(`Enter`);
    // Wait for the search results (network-only)
    await wait(page, 8);
    // Expand Bypass Valve 0001's row by its chevron (never the avatar — bugs §35)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Bypass Valve 0001")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`).click({ timeout: 30000 });
    // Let the detail panel mount
    await wait(page, 3);
    // Open its "Photos" tab
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "Bypass Valve 0001")]])[1]//*[@role="tab"][normalize-space(.)="Photos"]`).click({ timeout: 30000 });
    // Let the Photos panel render
    await wait(page, 3);
    // ⭐ UNLINKED: Bypass Valve 0001 holds NO photos again — 0 → 1 → 0
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
    // Navigate to /work — the work order list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Wait for the workstage pages and the lookup prefetch
    await wait(page, 20);
    // The work list rendered its search box
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
    // LOADEDALL 1/3: the initial fetch finished
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
    // LOADEDALL 2/3: paging through workstages finished
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
    // LOADEDALL 3/3: the per-stage detail downloads finished
    await assertPageLacks(page, `workstages downloaded`, 180000);
    // Navigate to the copy-to-asset work order
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/RcdI0xcpc8NBV8VoRNNBYM`);
    // Let the detail view begin rendering
    await wait(page, 2);
    // Test work order detail rendered
    await assertPageContains(page, `Status:`, 30000);
    // Open the "Attachments" tab
    await el(page, `//*[@role="tab"][contains(normalize-space(.), "Attachments")]`).click({ timeout: 30000 });
    // Let the Photos segment render
    await wait(page, 3);
    // ⭐ THE SOURCE IS UNTOUCHED: the work order still has its one photo, same id
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
    await soft.run("\u2026and its FILE survived: the image loaded (a deleted S3 object 404s to naturalWidth 0) (soft: lazy loading could leave it unloaded)", async () => {
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
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove this test's sessionStorage keys
    await assertFromJavascript(page, `['__dd302_srcId', '__dd302_srcName'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  }
  soft.check();
}
