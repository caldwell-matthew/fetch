// Generated from legacy/Mobile/dd_tests_mobile/MOB.866_MaterialLookup_Item_Attachment_Delete.json by to_playwright.py — do not edit by hand yet.
// MOB.866_MaterialLookup_Item_Attachment_Delete

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, typeText, uploadStandIn, wait } from '../support/dd';

export async function mob866(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to material lookup", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/material-lookup`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the page to mount", {}, async () => {
    await wait(page, 6);
  });
  await run.step("Clear this test's sessionStorage keys from any earlier run in this session", {}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd866_empty');
sessionStorage.removeItem('__dd866_mat');
sessionStorage.removeItem('__dd866_photo');
sessionStorage.removeItem('__dd866_doc');
return true;`, 15000);
  });
  await run.step("Test the \"Material Lookup\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]`, `Material Lookup`, 30000);
  });
  await run.step("\ud83d\uded1 PREMISE (server): the storeroom item holds NO attachment \u2014 so any found later is this run's; stashes the premise flag and the MaterialItem edges count", {allow: 'soft'}, async () => {
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
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd866_server', '__dd866_server:inflight', '__dd866_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
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
  await run.step("FIXTURE GUARD: \"000-000-000 Adamantium\" is listed", {}, async () => {
    await assertElementPresent(page, `//tr[contains(normalize-space(.), "000-000-000 Adamantium")]`, 30000);
  });
  await run.step("Open the item modal for 000-000-000 Adamantium (the row's action icon)", {}, async () => {
    await click(page, `//tr[contains(normalize-space(.), "000-000-000 Adamantium")]//button[.//*[@data-icon="arrow-up-right-from-square" or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-up-right-from-square ")]]`, 30000);
  });
  await run.step("The modal opened on the Quantity Adjustment view", {}, async () => {
    await assertPageContains(page, `Current Quantity`, 30000);
  });
  await run.step("Switch to the \"Photos\" segment by VALUE (3) \u2014 never by text (it can render icon-only)", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
const el = root.querySelector('input[type="radio"][value="3"]');
if (!el) return false;
el.click();
return true;`, 30000);
  });
  await run.step("Let the Photos panel mount (its attachment queries fire now)", {}, async () => {
    await wait(page, 4);
  });
  await run.step("The \"Photos\" segment is the CHECKED one", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const on = m.querySelector('[class*="mantine-SegmentedControl-root"] input[type="radio"]:checked');
return !!on && on.value === '3';`, 30000);
  });
  await run.step("PHOTOS at rest: the Storeroom Item section has NO slide and offers `Add Photo`", {}, async () => {
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
  });
  await run.step("Open the picker (`Add Photo` in the item modal)", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-SegmentedControl-root ")]]//button[normalize-space(.)="Add Photo"]`, 30000);
  });
  await run.step("The picker opened", {}, async () => {
    await assertPageContains(page, `Select Photo Source`, 30000);
  });
  await run.step("\ud83d\uded1 Reveal the gallery input \u2014 ONLY if the premise held (the storeroom item was empty)", {}, async () => {
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
  });
  await run.step("Upload a photo to the storeroom item", {}, async () => {
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
  });
  await run.step("The picker closed itself once the file arrived", {}, async () => {
    await assertPageLacks(page, `Select Photo Source`, 30000);
  });
  await run.step("\u2b50 PHOTO LANDED (UI, after the refetch): exactly ONE slide in the Storeroom Item section, named as uploaded, with a server image URL", {}, async () => {
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
  });
  await run.step("\u2b50 SERVER: the storeroom item holds exactly ONE attachment \u2014 the uploaded image \u2014 and the material item is unchanged; its id is stashed for the delete guard", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd866_server', '__dd866_server:inflight', '__dd866_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\ud83d\uded1 GUARD + open the gear: only on the ONE slide, and only if it is the attachment the server just stashed (premise held)", {always: true}, async () => {
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
  });
  await run.step("Let the menu dropdown render", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 MENU SET on a storeroom item photo: exactly View in Fullscreen \u00b7 Set as Avatar \u00b7 Rotate Image \u00b7 Delete Photo \u2014 in that order", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Menu-dropdown');
if (dds.length !== 1) return false;
const got = [...dds[0].querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
return JSON.stringify(got) === JSON.stringify(["View in Fullscreen", "Set as Avatar", "Rotate Image", "Delete Photo"]);`, 30000);
  });
  await run.step("Click \"Delete Photo\" (the menu the guard opened)", {always: true}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Delete Photo"])[1]`, 30000);
  });
  await run.step("Let the confirmation open", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("\ud83d\uded1 GUARD + confirm `Yes`: re-checked immediately before the click \u2014 ONE slide, carrying the stashed id, and the delete confirmation open", {always: true}, async () => {
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
  });
  await run.step("\u2b50 SERVER: the photo is GONE \u2014 the storeroom item holds no attachment, the material item unchanged", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd866_server', '__dd866_server:inflight', '__dd866_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\u2b50 PHOTOS back at rest (UI): no slide in the Storeroom Item section, `Add Photo` still offered", {}, async () => {
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
  });
  await run.step("Switch to the \"Docs\" segment by VALUE (4) \u2014 never by text (it can render icon-only)", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
const el = root.querySelector('input[type="radio"][value="4"]');
if (!el) return false;
el.click();
return true;`, 30000);
  });
  await run.step("Let the Docs panel mount (its attachment queries fire now)", {}, async () => {
    await wait(page, 4);
  });
  await run.step("The \"Docs\" segment is the CHECKED one", {}, async () => {
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
if (!m) return false;
const on = m.querySelector('[class*="mantine-SegmentedControl-root"] input[type="radio"]:checked');
return !!on && on.value === '4';`, 30000);
  });
  await run.step("DOCS at rest: the Storeroom Item section has NO file row and offers `Add File`", {}, async () => {
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
  });
  await run.step("\ud83d\uded1 Reveal the Storeroom Item section's hidden file input (accept=\"*/*\") \u2014 ONLY if the premise held", {}, async () => {
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
  });
  await run.step("\ud83d\udcc4 Upload a PDF (`DD SYNTHETIC MOBILE 866.pdf`) \u2014 the owner-recorded PDF (trap 12)", {}, async () => {
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["DD SYNTHETIC MOBILE 866.pdf"], DEFAULT_TIMEOUT);
  });
  await run.step("\u2b50 DOCUMENT LANDED (UI, after the refetch): exactly ONE file row in the Storeroom Item section, named as uploaded, linking to a server attachment", {}, async () => {
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
  });
  await run.step("\u2b50 SERVER: the storeroom item holds exactly ONE attachment \u2014 the uploaded PDF \u2014 and the material item is unchanged; its id is stashed for the delete guard", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd866_server', '__dd866_server:inflight', '__dd866_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\ud83d\uded1 GUARD + tick the row: only the ONE row, and only if it links to the attachment the server just stashed (premise held)", {always: true}, async () => {
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
  });
  await run.step("\ud83d\uded1 GUARD + open the table's gear: the row is ticked and it is still the stashed attachment", {always: true}, async () => {
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
  });
  await run.step("Let the menu dropdown render", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("\ud83d\uded1 GUARD + `Delete File(s)`: re-checked immediately before the click \u2014 ONE ticked row carrying the stashed id, and a menu holding only `Delete File(s)`", {always: true}, async () => {
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
  });
  await run.step("\u2b50 SERVER: the PDF is GONE \u2014 the storeroom item holds no attachment, the material item unchanged", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd866_server', '__dd866_server:inflight', '__dd866_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\u2b50 DOCS back at rest (UI): no file row in the Storeroom Item section, `Add File` still offered", {}, async () => {
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
  });
  await run.step("RESTED (server): the storeroom item holds no attachment and the material item is at its recorded count", {always: true}, async () => {
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd866_server', '__dd866_server:inflight', '__dd866_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("CLEANUP: remove this test's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd866_empty');
sessionStorage.removeItem('__dd866_mat');
sessionStorage.removeItem('__dd866_photo');
sessionStorage.removeItem('__dd866_doc');
return !sessionStorage.getItem("__dd866_empty") && !sessionStorage.getItem("__dd866_mat") && !sessionStorage.getItem("__dd866_photo") && !sessionStorage.getItem("__dd866_doc");`, 15000);
  });
  await run.step("Close any modal left over a failure (picker, confirmation), then the item modal with its own X", {always: true}, async () => {
    await assertFromJavascript(page, `const all = [...document.querySelectorAll('.mantine-Modal-content')];
const m = all.find(x => !!x.querySelector('[class*="mantine-SegmentedControl-root"]'));
all.filter(x => x !== m).forEach(x => { const c = x.querySelector('.mantine-Modal-close'); if (c) c.click(); });
const x = m && m.querySelector('.mantine-Modal-close');
if (x) x.click();
return true;`, 15000);
  });
  await run.step("Let the modals close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: no modal is left open for the next subtest", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Modal-content');`, 30000);
  });
  run.finish();
}
