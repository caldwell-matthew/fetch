// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.865_MaterialLookup_Item_Attachments.json. This file is the source now: edit it directly.
// MOB.865_MaterialLookup_Item_Attachments

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, click, press, typeText, wait } from '../../support/dd';

export async function mob865(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to material lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/material-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the page to mount", {}, async () => {
    await wait(page, 6);
  });
  await run.step("Test the \"Material Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]`, `Material Lookup`, 30000);
  });
  await run.step("READY: the material list has loaded \u2014 an `N matches` line shows and no loading overlay covers the page", {}, async () => {
    await assertFromJavascript(page, `const overlay = document.querySelectorAll('.mantine-LoadingOverlay-overlay').length > 0;
const counted = [...document.querySelectorAll('p, div, span')]
  .some(e => e.children.length === 0 && /^\\d[\\d,]* matches$/.test((e.textContent || '').trim()));
return counted && !overlay;`, 60000);
  });
  await run.step("Open the storeroom dropdown", {}, async () => {
    await click(page, `//*[@id="storeroomLocationId"]`, 30000);
  });
  await run.step("Wait for storeroom options", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Pick Central Storeroom", {}, async () => {
    await click(page, `//*[@role="option"][contains(normalize-space(.), "Central Storeroom")]`, 30000);
  });
  await run.step("Wait for the material list to load", {}, async () => {
    await wait(page, 8);
  });
  await run.step("Focus the material search", {}, async () => {
    await click(page, `//input[@placeholder="Search for material items by name"]`, 30000);
  });
  await run.step("Search for Adamantium", {}, async () => {
    await typeText(page, `//input[@placeholder="Search for material items by name"]`, `Adamantium`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the search debounce", {}, async () => {
    await wait(page, 4);
  });
  await run.step("FIXTURE GUARD: \"000-000-000 Adamantium\" is listed", {allow: 'soft'}, async () => {
    await assertElementPresent(page, `//tr[contains(normalize-space(.), "000-000-000 Adamantium")]`, 30000);
  });
  await run.step("AVATAR: click the row's image button IF it exists, and record which branch this is", {}, async () => {
    await assertFromJavascript(page, `const row = [...document.querySelectorAll('tr')]
  .find(r => (r.textContent || '').includes('000-000-000 Adamantium'));
if (!row) return false;
const b = [...row.querySelectorAll('button')]
  .find(x => /^View .+ image$/.test(x.getAttribute('aria-label') || ''));
sessionStorage.setItem('__dd865_avatar', b ? 'button' : 'none');
if (b) b.click();
return true;`, 30000);
  });
  await run.step("Let the image modal open, if there was a button", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 AVATAR: EXACTLY ONE of \u2014 no image button on the row, or an open modal showing `img.file-image`", {}, async () => {
    await assertFromJavascript(page, `const branch = sessionStorage.getItem('__dd865_avatar');
const m = document.querySelector('.mantine-Modal-content');
const img = m ? m.querySelector('img.file-image') : null;
const opened = !!m && !!img;
if (branch === 'none') return !opened;
if (branch === 'button') return opened;
return false;`, 30000);
  });
  await run.step("Close the image modal (a no-op when it never opened)", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let it close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("No modal is open before the adjust view is opened", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Modal-content');`, 30000);
  });
  await run.step("Open the item modal for 000-000-000 Adamantium (the row's action icon)", {}, async () => {
    await click(page, `//tr[contains(normalize-space(.), "000-000-000 Adamantium")]//button[.//*[@data-icon="arrow-up-right-from-square" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-up-right-from-square ")]]`, 30000);
  });
  await run.step("Wait for the item modal", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The modal opened on the Quantity Adjustment view", {}, async () => {
    await assertPageContains(page, `Current Quantity`, 30000);
  });
  await run.step("\u2b50 SEGMENTS: exactly Quantity Adjustment \u00b7 Stock Item \u00b7 Photos \u00b7 Docs \u2014 values 1..4, in order", {}, async () => {
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
  });
  await run.step("Switch to the \"Photos\" segment by VALUE (3) \u2014 never by text (it can render icon-only)", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const el = root.querySelector('input[type="radio"][value="3"]');
if (!el) return false;
el.click();
return true;`, 30000);
  });
  await run.step("Let the Photos panel mount (its attachment query fires now)", {}, async () => {
    await wait(page, 4);
  });
  await run.step("The \"Photos\" segment is the CHECKED one", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const on = root.querySelector('input[type="radio"]:checked');
return !!on && on.value === '3';`, 30000);
  });
  await run.step("\u2b50 PHOTOS: `Add Photo` is offered and `Add File` is NOT", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return t.includes('Add Photo') && !t.includes('Add File');`, 30000);
  });
  await run.step("\ud83d\udcca REPORT: does the fixture item have photos? (a carousel is present) \u2014 informational", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
return !!m.querySelector('[class*="mantine-Carousel"]');`, 10000);
  });
  await run.step("\u2b50 PHOTOS SPLIT: `Storeroom Item` first, then `Material Item (read only)` \u2014 and the read-only half offers NO `Add Photo`/`Add File` and shows a carousel or `No photos`", {}, async () => {
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
  });
  await run.step("Switch to the \"Docs\" segment by VALUE (4) \u2014 never by text (it can render icon-only)", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const el = root.querySelector('input[type="radio"][value="4"]');
if (!el) return false;
el.click();
return true;`, 30000);
  });
  await run.step("Let the Docs panel mount (its attachment query fires now)", {}, async () => {
    await wait(page, 4);
  });
  await run.step("The \"Docs\" segment is the CHECKED one", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const on = root.querySelector('input[type="radio"]:checked');
return !!on && on.value === '4';`, 30000);
  });
  await run.step("\u2b50 DOCS: `Add File` is offered, `Add Photo` is NOT, and there is NO carousel \u2014 the biconditional closes", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return t.includes('Add File') && !t.includes('Add Photo') && !m.querySelector('[class*="mantine-Carousel"]');`, 30000);
  });
  await run.step("\ud83d\udcca REPORT: does the fixture item have documents? (a file table is present) \u2014 informational", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
return !!m.querySelector('table');`, 10000);
  });
  await run.step("\u2b50 DOCS SPLIT: `Storeroom Item` first, then `Material Item (read only)` \u2014 and the read-only half offers NO `Add File`/`Add Photo` and shows a table or `No documents`", {}, async () => {
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
  });
  await run.step("CLEANUP: remove this test's scratch key `__dd865_avatar`", {always: true}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd865_avatar');
return !sessionStorage.getItem('__dd865_avatar');`, 30000);
  });
  await run.step("Close the item modal with its own X", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`, 30000);
  });
  await run.step("Let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: no modal is left open for the next subtest", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Modal-content');`, 30000);
  });
  run.finish();
}
