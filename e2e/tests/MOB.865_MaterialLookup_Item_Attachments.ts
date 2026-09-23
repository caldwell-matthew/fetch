// Generated from Mobile/dd_tests_mobile/MOB.865_MaterialLookup_Item_Attachments.json by to_playwright.py — do not edit by hand yet.
// MOB.865_MaterialLookup_Item_Attachments

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, el, optional, wait } from '../support/dd';

export async function mob865(page: Page): Promise<void> {
  const soft = new Soft();
  try {
    // Navigate to material lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/material-lookup`);
    // Wait for the page to mount
    await wait(page, 6);
    // Test the "Material Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]`, `Material Lookup`, 30000);
    // READY: the material list has loaded — an `N matches` line shows and no loading overlay covers the page
    await assertFromJavascript(page, `const overlay = document.querySelectorAll('.mantine-LoadingOverlay-overlay').length > 0;
const counted = [...document.querySelectorAll('p, div, span')]
  .some(e => e.children.length === 0 && /^\\d[\\d,]* matches$/.test((e.textContent || '').trim()));
return counted && !overlay;`, 60000);
    // Open the storeroom dropdown
    await el(page, `//*[@id="storeroomLocationId"]`).click({ timeout: 30000 });
    // Wait for storeroom options
    await wait(page, 2);
    // Pick Central Storeroom
    await el(page, `//*[@role="option"][contains(normalize-space(.), "Central Storeroom")]`).click({ timeout: 30000 });
    // Wait for the material list to load
    await wait(page, 8);
    // Focus the material search
    await el(page, `//input[@placeholder="Search for material items by name"]`).click({ timeout: 30000 });
    // Search for Adamantium
    await el(page, `//input[@placeholder="Search for material items by name"]`).fill(`Adamantium`, { timeout: DEFAULT_TIMEOUT });
    // Wait for the search debounce
    await wait(page, 4);
    await soft.run("FIXTURE GUARD: \"000-000-000 Adamantium\" is listed", async () => {
      await assertElementPresent(page, `//tr[contains(normalize-space(.), "000-000-000 Adamantium")]`, 30000);
    });
    // AVATAR: click the row's image button IF it exists, and record which branch this is
    await assertFromJavascript(page, `const row = [...document.querySelectorAll('tr')]
  .find(r => (r.textContent || '').includes('000-000-000 Adamantium'));
if (!row) return false;
const b = [...row.querySelectorAll('button')]
  .find(x => /^View .+ image$/.test(x.getAttribute('aria-label') || ''));
sessionStorage.setItem('__dd865_avatar', b ? 'button' : 'none');
if (b) b.click();
return true;`, 30000);
    // Let the image modal open, if there was a button
    await wait(page, 2);
    // ⭐ AVATAR: EXACTLY ONE of — no image button on the row, or an open modal showing `img.file-image`
    await assertFromJavascript(page, `const branch = sessionStorage.getItem('__dd865_avatar');
const m = document.querySelector('.mantine-Modal-content');
const img = m ? m.querySelector('img.file-image') : null;
const opened = !!m && !!img;
if (branch === 'none') return !opened;
if (branch === 'button') return opened;
return false;`, 30000);
    // Open the item modal for 000-000-000 Adamantium (the row's action icon)
    await el(page, `//tr[contains(normalize-space(.), "000-000-000 Adamantium")]//button[.//*[@data-icon="arrow-up-right-from-square" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-up-right-from-square ")]]`).click({ timeout: 30000 });
    // Wait for the item modal
    await wait(page, 3);
    // The modal opened on the Quantity Adjustment view
    await assertPageContains(page, `Current Quantity`, 30000);
    // ⭐ SEGMENTS: exactly Quantity Adjustment · Stock Item · Photos · Docs — values 1..4, in order
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const vals = [...root.querySelectorAll('input[type="radio"]')].map(i => i.value);
const labels = [...root.querySelectorAll('label')].map(l => (l.textContent || '').trim());
const wantV = ['1', '2', '3', '4'];
const wantL = ['Quantity Adjustment', 'Stock Item', 'Photos', 'Docs'];
return JSON.stringify(vals) === JSON.stringify(wantV)
    && JSON.stringify(labels) === JSON.stringify(wantL);`, 30000);
    // Switch to the "Photos" segment by VALUE (3) — never by text (it can render icon-only)
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const el = root.querySelector('input[type="radio"][value="3"]');
if (!el) return false;
el.click();
return true;`, 30000);
    // Let the Photos panel mount (its attachment query fires now)
    await wait(page, 4);
    // The "Photos" segment is the CHECKED one
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const on = root.querySelector('input[type="radio"]:checked');
return !!on && on.value === '3';`, 30000);
    // ⭐ PHOTOS: `Add Photo` is offered and `Add File` is NOT
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return t.includes('Add Photo') && !t.includes('Add File');`, 30000);
    await optional("\ud83d\udcca REPORT: does the fixture item have photos? (a carousel is present) \u2014 informational", async () => {
      await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
return !!m.querySelector('[class*="mantine-Carousel"]');`, 10000);
    });
    // ⭐ PHOTOS SPLIT: `Storeroom Item` first, then `Material Item (read only)` — and the read-only half offers NO `Add Photo`/`Add File` and shows a carousel or `No photos`
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);
const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');
const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');
const tail = []; let n = ro && ro.nextElementSibling;
while (n) { tail.push(n); n = n.nextElementSibling; }
const tb = tail.flatMap(e => (e.tagName === 'BUTTON' ? [e] : []).concat([...e.querySelectorAll('button')]))
  .map(b => (b.textContent || '').trim());
const tt = tail.map(e => e.textContent || '').join(' ');
const hasCarousel = tail.some(e => e.matches('[class*="mantine-Carousel"]') || !!e.querySelector('[class*="mantine-Carousel"]'));
const hasTable = tail.some(e => e.tagName === 'TABLE' || !!e.querySelector('table'));
const ordered = !!store && !!ro && !!(store.compareDocumentPosition(ro) & 4);
return ordered && !tb.includes('Add Photo') && !tb.includes('Add File')
  && (hasCarousel || tt.includes('No photos'));`, 30000);
    // Switch to the "Docs" segment by VALUE (4) — never by text (it can render icon-only)
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const el = root.querySelector('input[type="radio"][value="4"]');
if (!el) return false;
el.click();
return true;`, 30000);
    // Let the Docs panel mount (its attachment query fires now)
    await wait(page, 4);
    // The "Docs" segment is the CHECKED one
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const on = root.querySelector('input[type="radio"]:checked');
return !!on && on.value === '4';`, 30000);
    // ⭐ DOCS: `Add File` is offered, `Add Photo` is NOT, and there is NO carousel — the biconditional closes
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return t.includes('Add File') && !t.includes('Add Photo') && !m.querySelector('[class*="mantine-Carousel"]');`, 30000);
    await optional("\ud83d\udcca REPORT: does the fixture item have documents? (a file table is present) \u2014 informational", async () => {
      await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
return !!m.querySelector('table');`, 10000);
    });
    // ⭐ DOCS SPLIT: `Storeroom Item` first, then `Material Item (read only)` — and the read-only half offers NO `Add File`/`Add Photo` and shows a table or `No documents`
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);
const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');
const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');
const tail = []; let n = ro && ro.nextElementSibling;
while (n) { tail.push(n); n = n.nextElementSibling; }
const tb = tail.flatMap(e => (e.tagName === 'BUTTON' ? [e] : []).concat([...e.querySelectorAll('button')]))
  .map(b => (b.textContent || '').trim());
const tt = tail.map(e => e.textContent || '').join(' ');
const hasCarousel = tail.some(e => e.matches('[class*="mantine-Carousel"]') || !!e.querySelector('[class*="mantine-Carousel"]'));
const hasTable = tail.some(e => e.tagName === 'TABLE' || !!e.querySelector('table'));
const ordered = !!store && !!ro && !!(store.compareDocumentPosition(ro) & 4);
return ordered && !tb.includes('Add File') && !tb.includes('Add Photo')
  && (hasTable || tt.includes('No documents'));`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Close the image modal (a no-op when it never opened)
    await page.keyboard.press(`Escape`);
    // Let it close
    await wait(page, 2);
    // No modal is open before the adjust view is opened
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Modal-content');`, 30000);
    // CLEANUP: remove this test's scratch key `__dd865_avatar`
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd865_avatar');
return !sessionStorage.getItem('__dd865_avatar');`, 30000);
    // Close the item modal with its own X
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`).click({ timeout: 30000 });
    // Let the modal close
    await wait(page, 2);
    // RESTORED: no modal is left open for the next subtest
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Modal-content');`, 30000);
  }
  soft.check();
}
