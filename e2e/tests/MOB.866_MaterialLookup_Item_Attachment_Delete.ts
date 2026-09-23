// Generated from Mobile/dd_tests_mobile/MOB.866_MaterialLookup_Item_Attachment_Delete.json by to_playwright.py — do not edit by hand yet.
// MOB.866_MaterialLookup_Item_Attachment_Delete

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, uploadStandIn, wait } from '../support/dd';

export async function mob866(page: Page): Promise<void> {
  const soft = new Soft();
  try {
    // Navigate to material lookup
    await page.goto(`https://dev.mentorapm.com/apm-mobile/material-lookup`);
    // Wait for the page to mount
    await wait(page, 6);
    // Clear this test's sessionStorage keys from any earlier run in this session
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd866_empty');
sessionStorage.removeItem('__dd866_mat');
sessionStorage.removeItem('__dd866_photo');
sessionStorage.removeItem('__dd866_doc');
return true;`, 15000);
    // Test the "Material Lookup" page rendered
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]`, `Material Lookup`, 30000);
    await soft.run("\ud83d\uded1 PREMISE (server): the storeroom item holds NO attachment \u2014 so any found later is this run's; stashes the premise flag and the MaterialItem edges count", async () => {
      await assertFromJavascript(page, `const K = "__dd866_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const ok = data.s.edges.length === 0;
  if (ok) { sessionStorage.setItem('__dd866_empty', '1'); sessionStorage.setItem('__dd866_mat', String(data.m.edges.length)); }
  return ok; })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query MOB866_ATTACHMENTS($s: ChildTableQuery!, $m: ChildTableQuery!) { s: attachments(modelType: StoreroomItem, params: $s) { edges { id fileName fileType } } m: attachments(modelType: MaterialItem, params: $m) { edges { id } } }", variables: {"s": {"parentId": "4lZMQZsNNdJ95hoYhd4gYt", "limit": 100}, "m": {"parentId": "pJodNZlMY8Aw08g9hZE8NE", "limit": 100}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    });
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
    // FIXTURE GUARD: "000-000-000 Adamantium" is listed
    await assertElementPresent(page, `//tr[contains(normalize-space(.), "000-000-000 Adamantium")]`, 30000);
    // Open the item modal for 000-000-000 Adamantium (the row's action icon)
    await el(page, `//tr[contains(normalize-space(.), "000-000-000 Adamantium")]//button[.//*[@data-icon="arrow-up-right-from-square" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-up-right-from-square ")]]`).click({ timeout: 30000 });
    // The modal opened on the Quantity Adjustment view
    await assertPageContains(page, `Current Quantity`, 30000);
    // Switch to the "Photos" segment by VALUE (3) — never by text (it can render icon-only)
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
const el = root.querySelector('input[type="radio"][value="3"]');
if (!el) return false;
el.click();
return true;`, 30000);
    // Let the Photos panel mount (its attachment queries fire now)
    await wait(page, 4);
    // The "Photos" segment is the CHECKED one
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const on = m.querySelector('[class*="mantine-SegmentedControl-root"] input[type="radio"]:checked');
return !!on && on.value === '3';`, 30000);
    // PHOTOS at rest: the Storeroom Item section has NO slide and offers `Add Photo`
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);
const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');
const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');
if (!store || !ro || store.parentElement !== ro.parentElement) return false;
const sec = [];
let cur = store.nextElementSibling;
while (cur && cur !== ro) { sec.push(cur); cur = cur.nextElementSibling; }
if (cur !== ro) return false;
const within = sel => sec.flatMap(e => (e.matches(sel) ? [e] : []).concat([...e.querySelectorAll(sel)]));
const btns = within('button').map(b => (b.textContent || '').trim());
return within('.mantine-Carousel-slide').length === 0
  && btns.includes('Add Photo') && !btns.includes('Add File');`, 30000);
    // Open the picker (`Add Photo` in the item modal)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-SegmentedControl-root ")]]//button[normalize-space(.)="Add Photo"]`).click({ timeout: 30000 });
    // The picker opened
    await assertPageContains(page, `Select Photo Source`, 30000);
    // 🛑 Reveal the gallery input — ONLY if the premise held (the storeroom item was empty)
    await assertFromJavascript(page, `if (sessionStorage.getItem('__dd866_empty') !== '1') return false;   // premise failed: never upload
document.querySelectorAll('[data-dd-upload]').forEach(n => n.removeAttribute('data-dd-upload'));
const pics = [...document.querySelectorAll('input[type="file"][accept="image/*"]')]
  .filter(i => !i.capture && !i.getAttribute('capture'));
if (pics.length !== 1) return false;
const el = pics[0];
if (!el) return false;
el.setAttribute('data-dd-upload', '1');
Object.assign(el.style, {
  display: 'block', opacity: '1', position: 'fixed',
  top: '0', left: '0', width: '240px', height: '40px', zIndex: '99999'
});
return true;
`, DEFAULT_TIMEOUT);
    // Upload a photo to the storeroom item
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
    // The picker closed itself once the file arrived
    await assertPageLacks(page, `Select Photo Source`, 30000);
    // ⭐ PHOTO LANDED (UI, after the refetch): exactly ONE slide in the Storeroom Item section, named as uploaded, with a server image URL
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);
const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');
const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');
if (!store || !ro || store.parentElement !== ro.parentElement) return false;
const sec = [];
let cur = store.nextElementSibling;
while (cur && cur !== ro) { sec.push(cur); cur = cur.nextElementSibling; }
if (cur !== ro) return false;
const within = sel => sec.flatMap(e => (e.matches(sel) ? [e] : []).concat([...e.querySelectorAll(sel)]));
const btns = within('button').map(b => (b.textContent || '').trim());
const slides = within('.mantine-Carousel-slide');
if (slides.length !== 1) return false;
const img = slides[0].querySelector('img');
if (!img) return false;
return img.getAttribute('alt') === "Screenshot 2024-12-11 at 3.23.46\\u202fPM.png"
  && (img.getAttribute('src') || '').includes('/api/attachment/');`, 90000);
    await soft.run("\u2b50 MENU SET on a storeroom item photo: exactly View in Fullscreen \u00b7 Set as Avatar \u00b7 Rotate Image \u00b7 Delete Photo \u2014 in that order", async () => {
      await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Menu-dropdown');
if (dds.length !== 1) return false;
const got = [...dds[0].querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
return JSON.stringify(got) === JSON.stringify(["View in Fullscreen", "Set as Avatar", "Rotate Image", "Delete Photo"]);`, 30000);
    });
    // ⭐ PHOTOS back at rest (UI): no slide in the Storeroom Item section, `Add Photo` still offered
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);
const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');
const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');
if (!store || !ro || store.parentElement !== ro.parentElement) return false;
const sec = [];
let cur = store.nextElementSibling;
while (cur && cur !== ro) { sec.push(cur); cur = cur.nextElementSibling; }
if (cur !== ro) return false;
const within = sel => sec.flatMap(e => (e.matches(sel) ? [e] : []).concat([...e.querySelectorAll(sel)]));
const btns = within('button').map(b => (b.textContent || '').trim());
return within('.mantine-Carousel-slide').length === 0
  && btns.includes('Add Photo') && !btns.includes('Add File');`, 30000);
    // Switch to the "Docs" segment by VALUE (4) — never by text (it can render icon-only)
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
const el = root.querySelector('input[type="radio"][value="4"]');
if (!el) return false;
el.click();
return true;`, 30000);
    // Let the Docs panel mount (its attachment queries fire now)
    await wait(page, 4);
    // The "Docs" segment is the CHECKED one
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const on = m.querySelector('[class*="mantine-SegmentedControl-root"] input[type="radio"]:checked');
return !!on && on.value === '4';`, 30000);
    // DOCS at rest: the Storeroom Item section has NO file row and offers `Add File`
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);
const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');
const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');
if (!store || !ro || store.parentElement !== ro.parentElement) return false;
const sec = [];
let cur = store.nextElementSibling;
while (cur && cur !== ro) { sec.push(cur); cur = cur.nextElementSibling; }
if (cur !== ro) return false;
const within = sel => sec.flatMap(e => (e.matches(sel) ? [e] : []).concat([...e.querySelectorAll(sel)]));
const btns = within('button').map(b => (b.textContent || '').trim());
return within('tbody tr').length === 0
  && btns.includes('Add File') && !btns.includes('Add Photo');`, 30000);
    // 🛑 Reveal the Storeroom Item section's hidden file input (accept="*/*") — ONLY if the premise held
    await assertFromJavascript(page, `if (sessionStorage.getItem('__dd866_empty') !== '1') return false;   // premise failed: never upload
document.querySelectorAll('[data-dd-upload]').forEach(n => n.removeAttribute('data-dd-upload'));
const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);
const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');
const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');
if (!store || !ro || store.parentElement !== ro.parentElement) return false;
const sec = [];
let cur = store.nextElementSibling;
while (cur && cur !== ro) { sec.push(cur); cur = cur.nextElementSibling; }
if (cur !== ro) return false;
const within = sel => sec.flatMap(e => (e.matches(sel) ? [e] : []).concat([...e.querySelectorAll(sel)]));
const btns = within('button').map(b => (b.textContent || '').trim());
const ins = within('input[type="file"][accept="*/*"]');
if (ins.length !== 1) return false;
const el = ins[0];
if (!el) return false;
el.setAttribute('data-dd-upload', '1');
Object.assign(el.style, {
  display: 'block', opacity: '1', position: 'fixed',
  top: '0', left: '0', width: '240px', height: '40px', zIndex: '99999'
});
return true;
`, DEFAULT_TIMEOUT);
    // 📄 Upload a PDF (`DD SYNTHETIC MOBILE 866.pdf`) — the owner-recorded PDF (trap 12)
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["DD SYNTHETIC MOBILE 866.pdf"], DEFAULT_TIMEOUT);
    // ⭐ DOCUMENT LANDED (UI, after the refetch): exactly ONE file row in the Storeroom Item section, named as uploaded, linking to a server attachment
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);
const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');
const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');
if (!store || !ro || store.parentElement !== ro.parentElement) return false;
const sec = [];
let cur = store.nextElementSibling;
while (cur && cur !== ro) { sec.push(cur); cur = cur.nextElementSibling; }
if (cur !== ro) return false;
const within = sel => sec.flatMap(e => (e.matches(sel) ? [e] : []).concat([...e.querySelectorAll(sel)]));
const btns = within('button').map(b => (b.textContent || '').trim());
const rows = within('tbody tr');
if (rows.length !== 1) return false;
const a = rows[0].querySelector('a[href]');
return !!a && (a.textContent || '').trim() === "DD SYNTHETIC MOBILE 866.pdf"
  && (a.getAttribute('href') || '').startsWith('/api/attachment/');`, 90000);
    // ⭐ DOCS back at rest (UI): no file row in the Storeroom Item section, `Add File` still offered
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);
const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');
const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');
if (!store || !ro || store.parentElement !== ro.parentElement) return false;
const sec = [];
let cur = store.nextElementSibling;
while (cur && cur !== ro) { sec.push(cur); cur = cur.nextElementSibling; }
if (cur !== ro) return false;
const within = sel => sec.flatMap(e => (e.matches(sel) ? [e] : []).concat([...e.querySelectorAll(sel)]));
const btns = within('button').map(b => (b.textContent || '').trim());
return within('tbody tr').length === 0
  && btns.includes('Add File') && !btns.includes('Add Photo');`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd866_server', '__dd866_server:inflight', '__dd866_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // ⭐ SERVER: the storeroom item holds exactly ONE attachment — the uploaded image — and the material item is unchanged; its id is stashed for the delete guard
    await assertFromJavascript(page, `const K = "__dd866_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const mat = sessionStorage.getItem('__dd866_mat');
  if (sessionStorage.getItem('__dd866_empty') !== '1' || mat === null) return false;
  const e = data.s.edges;
  if (e.length !== 1 || e[0].fileName !== "Screenshot 2024-12-11 at 3.23.46\\u202fPM.png" || !(/^image\\//).test(e[0].fileType || '')) return false;
  if (data.m.edges.length !== Number(mat)) return false;
  sessionStorage.setItem('__dd866_photo', e[0].id);
  return true; })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query MOB866_ATTACHMENTS($s: ChildTableQuery!, $m: ChildTableQuery!) { s: attachments(modelType: StoreroomItem, params: $s) { edges { id fileName fileType } } m: attachments(modelType: MaterialItem, params: $m) { edges { id } } }", variables: {"s": {"parentId": "4lZMQZsNNdJ95hoYhd4gYt", "limit": 100}, "m": {"parentId": "pJodNZlMY8Aw08g9hZE8NE", "limit": 100}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd866_server', '__dd866_server:inflight', '__dd866_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // 🛑 GUARD + open the gear: only on the ONE slide, and only if it is the attachment the server just stashed (premise held)
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);
const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');
const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');
if (!store || !ro || store.parentElement !== ro.parentElement) return false;
const sec = [];
let cur = store.nextElementSibling;
while (cur && cur !== ro) { sec.push(cur); cur = cur.nextElementSibling; }
if (cur !== ro) return false;
const within = sel => sec.flatMap(e => (e.matches(sel) ? [e] : []).concat([...e.querySelectorAll(sel)]));
const btns = within('button').map(b => (b.textContent || '').trim());
const id = sessionStorage.getItem('__dd866_photo');
if (sessionStorage.getItem('__dd866_empty') !== '1' || !id) return false;
const slides = within('.mantine-Carousel-slide');
if (slides.length !== 1) return false;
const img = slides[0].querySelector('img');
if (!img || img.getAttribute('alt') !== "Screenshot 2024-12-11 at 3.23.46\\u202fPM.png") return false;
if (!(img.getAttribute('src') || '').includes('/api/attachment/' + id + '?')) return false;
if (document.querySelector('.mantine-Menu-dropdown')) return false;
const g = slides[0].querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
    // Let the menu dropdown render
    await wait(page, 2);
    // Click "Delete Photo" (the menu the guard opened)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Delete Photo"])[1]`).click({ timeout: 30000 });
    // Let the confirmation open
    await wait(page, 2);
    // 🛑 GUARD + confirm `Yes`: re-checked immediately before the click — ONE slide, carrying the stashed id, and the delete confirmation open
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);
const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');
const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');
if (!store || !ro || store.parentElement !== ro.parentElement) return false;
const sec = [];
let cur = store.nextElementSibling;
while (cur && cur !== ro) { sec.push(cur); cur = cur.nextElementSibling; }
if (cur !== ro) return false;
const within = sel => sec.flatMap(e => (e.matches(sel) ? [e] : []).concat([...e.querySelectorAll(sel)]));
const btns = within('button').map(b => (b.textContent || '').trim());
const id = sessionStorage.getItem('__dd866_photo');
if (sessionStorage.getItem('__dd866_empty') !== '1' || !id) return false;
const slides = within('.mantine-Carousel-slide');
if (slides.length !== 1) return false;
const img = slides[0].querySelector('img');
if (!img || img.getAttribute('alt') !== "Screenshot 2024-12-11 at 3.23.46\\u202fPM.png") return false;
if (!(img.getAttribute('src') || '').includes('/api/attachment/' + id + '?')) return false;
const c = [...document.querySelectorAll('.mantine-Modal-content')]
  .filter(x => x !== m && (x.textContent || '').includes("Are you sure you want to delete this image?"));
if (c.length !== 1) return false;
const yes = [...c[0].querySelectorAll('button')].filter(b => (b.textContent || '').trim() === 'Yes');
if (yes.length !== 1) return false;
yes[0].click();
return true;`, 30000);
    // ⭐ SERVER: the photo is GONE — the storeroom item holds no attachment, the material item unchanged
    await assertFromJavascript(page, `const K = "__dd866_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const id = sessionStorage.getItem('__dd866_photo'); const mat = sessionStorage.getItem('__dd866_mat');
  return !!id && mat !== null && data.s.edges.length === 0 && data.m.edges.length === Number(mat); })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query MOB866_ATTACHMENTS($s: ChildTableQuery!, $m: ChildTableQuery!) { s: attachments(modelType: StoreroomItem, params: $s) { edges { id fileName fileType } } m: attachments(modelType: MaterialItem, params: $m) { edges { id } } }", variables: {"s": {"parentId": "4lZMQZsNNdJ95hoYhd4gYt", "limit": 100}, "m": {"parentId": "pJodNZlMY8Aw08g9hZE8NE", "limit": 100}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd866_server', '__dd866_server:inflight', '__dd866_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // ⭐ SERVER: the storeroom item holds exactly ONE attachment — the uploaded PDF — and the material item is unchanged; its id is stashed for the delete guard
    await assertFromJavascript(page, `const K = "__dd866_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const mat = sessionStorage.getItem('__dd866_mat');
  if (sessionStorage.getItem('__dd866_empty') !== '1' || mat === null) return false;
  const e = data.s.edges;
  if (e.length !== 1 || e[0].fileName !== "DD SYNTHETIC MOBILE 866.pdf" || !(/^application\\/pdf$/).test(e[0].fileType || '')) return false;
  if (data.m.edges.length !== Number(mat)) return false;
  sessionStorage.setItem('__dd866_doc', e[0].id);
  return true; })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query MOB866_ATTACHMENTS($s: ChildTableQuery!, $m: ChildTableQuery!) { s: attachments(modelType: StoreroomItem, params: $s) { edges { id fileName fileType } } m: attachments(modelType: MaterialItem, params: $m) { edges { id } } }", variables: {"s": {"parentId": "4lZMQZsNNdJ95hoYhd4gYt", "limit": 100}, "m": {"parentId": "pJodNZlMY8Aw08g9hZE8NE", "limit": 100}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd866_server', '__dd866_server:inflight', '__dd866_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // 🛑 GUARD + tick the row: only the ONE row, and only if it links to the attachment the server just stashed (premise held)
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);
const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');
const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');
if (!store || !ro || store.parentElement !== ro.parentElement) return false;
const sec = [];
let cur = store.nextElementSibling;
while (cur && cur !== ro) { sec.push(cur); cur = cur.nextElementSibling; }
if (cur !== ro) return false;
const within = sel => sec.flatMap(e => (e.matches(sel) ? [e] : []).concat([...e.querySelectorAll(sel)]));
const btns = within('button').map(b => (b.textContent || '').trim());
const id = sessionStorage.getItem('__dd866_doc');
if (sessionStorage.getItem('__dd866_empty') !== '1' || !id) return false;
const rows = within('tbody tr');
if (rows.length !== 1) return false;
const a = rows[0].querySelector('a[href]');
if (!a || a.getAttribute('href') !== '/api/attachment/' + id) return false;
if ((a.textContent || '').trim() !== "DD SYNTHETIC MOBILE 866.pdf") return false;
const box = rows[0].querySelector('input[type="checkbox"]');
if (!box) return false;
if (!box.checked) box.click();
return true;`, 30000);
    // 🛑 GUARD + open the table's gear: the row is ticked and it is still the stashed attachment
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);
const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');
const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');
if (!store || !ro || store.parentElement !== ro.parentElement) return false;
const sec = [];
let cur = store.nextElementSibling;
while (cur && cur !== ro) { sec.push(cur); cur = cur.nextElementSibling; }
if (cur !== ro) return false;
const within = sel => sec.flatMap(e => (e.matches(sel) ? [e] : []).concat([...e.querySelectorAll(sel)]));
const btns = within('button').map(b => (b.textContent || '').trim());
const id = sessionStorage.getItem('__dd866_doc');
if (sessionStorage.getItem('__dd866_empty') !== '1' || !id) return false;
const rows = within('tbody tr');
if (rows.length !== 1) return false;
const a = rows[0].querySelector('a[href]');
if (!a || a.getAttribute('href') !== '/api/attachment/' + id) return false;
if ((a.textContent || '').trim() !== "DD SYNTHETIC MOBILE 866.pdf") return false;
const box = rows[0].querySelector('input[type="checkbox"]');
if (!box) return false;
if (!box.checked) return false;
const gears = within('button[aria-label="Menu"]');
if (gears.length !== 1 || gears[0].disabled) return false;
if (document.querySelector('.mantine-Menu-dropdown')) return false;
gears[0].click();
return true;`, 30000);
    // Let the menu dropdown render
    await wait(page, 2);
    // 🛑 GUARD + `Delete File(s)`: re-checked immediately before the click — ONE ticked row carrying the stashed id, and a menu holding only `Delete File(s)`
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);
const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');
const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');
if (!store || !ro || store.parentElement !== ro.parentElement) return false;
const sec = [];
let cur = store.nextElementSibling;
while (cur && cur !== ro) { sec.push(cur); cur = cur.nextElementSibling; }
if (cur !== ro) return false;
const within = sel => sec.flatMap(e => (e.matches(sel) ? [e] : []).concat([...e.querySelectorAll(sel)]));
const btns = within('button').map(b => (b.textContent || '').trim());
const id = sessionStorage.getItem('__dd866_doc');
if (sessionStorage.getItem('__dd866_empty') !== '1' || !id) return false;
const rows = within('tbody tr');
if (rows.length !== 1) return false;
const a = rows[0].querySelector('a[href]');
if (!a || a.getAttribute('href') !== '/api/attachment/' + id) return false;
if ((a.textContent || '').trim() !== "DD SYNTHETIC MOBILE 866.pdf") return false;
const box = rows[0].querySelector('input[type="checkbox"]');
if (!box) return false;
if (!box.checked) return false;
const dds = document.querySelectorAll('.mantine-Menu-dropdown');
if (dds.length !== 1) return false;
const items = [...dds[0].querySelectorAll('.mantine-Menu-item')];
if (items.length !== 1 || (items[0].textContent || '').trim() !== 'Delete File(s)') return false;
items[0].click();
return true;`, 30000);
    // ⭐ SERVER: the PDF is GONE — the storeroom item holds no attachment, the material item unchanged
    await assertFromJavascript(page, `const K = "__dd866_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const id = sessionStorage.getItem('__dd866_doc'); const mat = sessionStorage.getItem('__dd866_mat');
  return !!id && mat !== null && data.s.edges.length === 0 && data.m.edges.length === Number(mat); })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query MOB866_ATTACHMENTS($s: ChildTableQuery!, $m: ChildTableQuery!) { s: attachments(modelType: StoreroomItem, params: $s) { edges { id fileName fileType } } m: attachments(modelType: MaterialItem, params: $m) { edges { id } } }", variables: {"s": {"parentId": "4lZMQZsNNdJ95hoYhd4gYt", "limit": 100}, "m": {"parentId": "pJodNZlMY8Aw08g9hZE8NE", "limit": 100}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd866_server', '__dd866_server:inflight', '__dd866_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // RESTED (server): the storeroom item holds no attachment and the material item is at its recorded count
    await assertFromJavascript(page, `const K = "__dd866_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const mat = sessionStorage.getItem('__dd866_mat');
  return mat !== null && data.s.edges.length === 0 && data.m.edges.length === Number(mat); })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query MOB866_ATTACHMENTS($s: ChildTableQuery!, $m: ChildTableQuery!) { s: attachments(modelType: StoreroomItem, params: $s) { edges { id fileName fileType } } m: attachments(modelType: MaterialItem, params: $m) { edges { id } } }", variables: {"s": {"parentId": "4lZMQZsNNdJ95hoYhd4gYt", "limit": 100}, "m": {"parentId": "pJodNZlMY8Aw08g9hZE8NE", "limit": 100}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 30000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd866_server', '__dd866_server:inflight', '__dd866_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // CLEANUP: remove this test's sessionStorage keys
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd866_empty');
sessionStorage.removeItem('__dd866_mat');
sessionStorage.removeItem('__dd866_photo');
sessionStorage.removeItem('__dd866_doc');
return !sessionStorage.getItem("__dd866_empty") && !sessionStorage.getItem("__dd866_mat") && !sessionStorage.getItem("__dd866_photo") && !sessionStorage.getItem("__dd866_doc");`, 15000);
    // Close any modal left over a failure (picker, confirmation), then the item modal with its own X
    await assertFromJavascript(page, `const all = [...document.querySelectorAll('.mantine-Modal-content')];
const m = all.find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
all.filter(x => x !== m).forEach(x => { const c = x.querySelector('.mantine-Modal-close'); if (c) c.click(); });
const x = m && m.querySelector('.mantine-Modal-close');
if (x) x.click();
return true;`, 15000);
    // Let the modals close
    await wait(page, 2);
    // RESTORED: no modal is left open for the next subtest
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Modal-content');`, 30000);
  }
  soft.check();
}
