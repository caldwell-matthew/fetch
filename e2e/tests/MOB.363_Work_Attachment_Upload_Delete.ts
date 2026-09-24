// Generated from legacy/Mobile/dd_tests_mobile/MOB.363_Work_Attachment_Upload_Delete.json by to_playwright.py — do not edit by hand yet.
// MOB.363_Work_Attachment_Upload_Delete

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertFromJavascript, assertPageContains, assertPageLacks, click, uploadStandIn, wait } from '../support/dd';

export async function mob363(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 warm the work lookup cache", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Let the lookup prefetch run", {}, async () => {
    await wait(page, 30);
  });
  await run.step("Navigate to the attachment work order (20260910-16)", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work/xohY0klBZktB9VBRxc8k4J`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the detail view begin rendering", {}, async () => {
    await wait(page, 2);
  });
  await run.step("Test work order detail rendered", {}, async () => {
    await assertPageContains(page, `Status:`, 30000);
  });
  await run.step("PREMISE (server): the stage holds NO attachments (so the one after the upload is this run's), its template does not copy photos to the asset, and its one asset is \u26a1 Tank 0000", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd363_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const w = data.workStage;
  sessionStorage.removeItem('__dd363_id');   // a killed run's id must never reach the guard
  return w.id === 'xohY0klBZktB9VBRxc8k4J' && w.attachments.length === 0
    && w.mobileTemplate.copyAttachmentToAsset === false
    && w.assets.length === 1 && w.assets[0].assetId.id === '8khYtoBRVNNs5d9cEt8NdY'; })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!, $a: ID!) { workStage(id: $id) { id mobileTemplate { copyAttachmentToAsset } assets { assetId { id name } } attachments { id fileName fileType } } asset(id: $a) { id attachments { id } } }", variables: {"id": "xohY0klBZktB9VBRxc8k4J", "a": "8khYtoBRVNNs5d9cEt8NdY"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd363_server', '__dd363_server:inflight', '__dd363_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Open the \"Attachments\" tab", {}, async () => {
    await click(page, `//*[@role="tab"][contains(normalize-space(.), "Attachments")]`, 30000);
  });
  await run.step("Let the Photos segment render", {}, async () => {
    await wait(page, 3);
  });
  await run.step("PHOTOS panel at rest: `Add Photo`, no `Add File`, and no slides", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const slides = [...p.querySelectorAll('[class*="mantine-Carousel-slide"]')];
const labels = [...p.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return slides.length === 0 && labels.includes('Add Photo') && !labels.includes('Add File');`, 30000);
  });
  await run.step("Open the picker (\"Add Photo\")", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add Photo"]`, 30000);
  });
  await run.step("The picker opened", {}, async () => {
    await assertPageContains(page, `Select Photo Source`, 30000);
  });
  await run.step("Reveal the ONE gallery input (`accept=\"image/*\"`, no `capture`) \u2014 fails closed otherwise", {}, async () => {
    await assertFromJavascript(page, `document.querySelectorAll('[data-dd-upload]').forEach(n => n.removeAttribute('data-dd-upload'));
const hits = [...document.querySelectorAll('input[type="file"]')]
  .filter(i => i.getAttribute('accept') === 'image/*' && !i.capture && !i.getAttribute('capture'));
if (hits.length !== 1) return false;   // 0 = picker not open, >1 = ambiguous (trap 3)
const el = hits[0];
if (!el) return false;
el.setAttribute('data-dd-upload', '1');
Object.assign(el.style, {
  display: 'block', opacity: '1', position: 'fixed',
  top: '0', left: '0', width: '240px', height: '40px', zIndex: '99999'
});
return true;
`, DEFAULT_TIMEOUT);
  });
  await run.step("Upload ONE photo to the work order's Photos", {}, async () => {
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
  });
  await run.step("The picker closed itself once the file arrived (`onDialogChange`)", {}, async () => {
    await assertPageLacks(page, `Select Photo Source`, 30000);
  });
  await run.step("\u2b50 UPLOAD LANDED: exactly one slide, its <img src> the server's `/api/attachment/<id>` URL (not the `blob:` preview)", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const slides = [...p.querySelectorAll('[class*="mantine-Carousel-slide"]')];
const labels = [...p.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const idOf = img => ((img && img.getAttribute('src') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
if (slides.length !== 1) return false;
const img = slides[0].querySelector('img');
const src = img ? (img.getAttribute('src') || '') : '';
return !src.startsWith('blob:') && !!idOf(img);`, 90000);
  });
  await run.step("\u2b50 SERVER: the stage holds exactly ONE attachment, an image \u2014 this run's (keep its id); and \u26a1 Tank 0000 does NOT hold it (no copy to the asset)", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd363_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const at = data.workStage.attachments;
  if (at.length !== 1 || !/^image\\//.test(at[0].fileType || '')) return false;
  if (data.asset.attachments.some(x => x.id === at[0].id)) return false;   // copied to the asset
  sessionStorage.setItem('__dd363_id', at[0].id);
  return true; })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!, $a: ID!) { workStage(id: $id) { id mobileTemplate { copyAttachmentToAsset } assets { assetId { id name } } attachments { id fileName fileType } } asset(id: $a) { id attachments { id } } }", variables: {"id": "xohY0klBZktB9VBRxc8k4J", "a": "8khYtoBRVNNs5d9cEt8NdY"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd363_server', '__dd363_server:inflight', '__dd363_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\ud83d\uded1 GUARD + open the gear: only if the panel shows exactly one slide and its image IS the attachment the server just named", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const slides = [...p.querySelectorAll('[class*="mantine-Carousel-slide"]')];
const labels = [...p.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const idOf = img => ((img && img.getAttribute('src') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const id = sessionStorage.getItem('__dd363_id');
if (!id || slides.length !== 1 || idOf(slides[0].querySelector('img')) !== id) return false;
const g = slides[0].querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
  });
  await run.step("Let the menu open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("MENU (stage photo): exactly View in Fullscreen \u00b7 Copy to asset \u00b7 Delete Photo \u2014 in that order", {}, async () => {
    await assertFromJavascript(page, `const dds = [...document.querySelectorAll('.mantine-Menu-dropdown')];
if (dds.length !== 1) return false;
const got = [...dds[0].querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());
return JSON.stringify(got) === JSON.stringify(["View in Fullscreen", "Copy to asset", "Delete Photo"]);`, 30000);
  });
  await run.step("Click `Delete Photo` (NEVER `Copy to asset`)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Delete Photo"])[1]`, 30000);
  });
  await run.step("Let the confirmation open", {}, async () => {
    await wait(page, 1);
  });
  await run.step("Confirm: \"Yes\"", {}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Are you sure you want to delete this image?")]]//button[normalize-space(.)="Yes"]`, 30000);
  });
  await run.step("Wait for REMOVE_ATTACHMENT", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 SERVER: the stage's attachments are back to NONE (its rest set), and \u26a1 Tank 0000 never held the photo \u2014 asked over /graphql", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd363_server", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => { const at = data.workStage.attachments;
  const id = sessionStorage.getItem('__dd363_id');
  return !!id && at.length === 0 && !data.asset.attachments.some(x => x.id === id); })()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($id: ID!, $a: ID!) { workStage(id: $id) { id mobileTemplate { copyAttachmentToAsset } assets { assetId { id name } } attachments { id fileName fileType } } asset(id: $a) { id attachments { id } } }", variables: {"id": "xohY0klBZktB9VBRxc8k4J", "a": "8khYtoBRVNNs5d9cEt8NdY"} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd363_server', '__dd363_server:inflight', '__dd363_server:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("The Photos panel shows no slides again, and `Add Photo`", {}, async () => {
    await assertFromJavascript(page, `const tabEl = document.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...document.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const slides = [...p.querySelectorAll('[class*="mantine-Carousel-slide"]')];
const labels = [...p.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return slides.length === 0 && labels.includes('Add Photo');`, 30000);
  });
  await run.step("Remove this test's sessionStorage key", {always: true}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd363_id');
return true;`, 15000);
  });
  run.finish();
}
