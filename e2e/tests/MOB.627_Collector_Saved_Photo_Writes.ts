// Generated from Mobile/dd_tests_mobile/MOB.627_Collector_Saved_Photo_Writes.json by to_playwright.py — do not edit by hand yet.
// MOB.627_Collector_Saved_Photo_Writes

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, optional, uploadStandIn, wait } from '../support/dd';
import { runId } from '../support/env';

export async function mob627(page: Page): Promise<void> {
  const RUNID = runId('numeric', 8);
  const soft = new Soft();
  try {
    // Navigate to the asset collector
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`);
    // Wait for the collector to load its lookup cache
    await wait(page, 15);
    // The collector page rendered
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, 30000);
    await soft.run("FIXTURE GUARD: a \"DD SYNTHETIC MOBILE\" asset is in the collected list (MOB.600 residue)", async () => {
      await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]`, 60000);
    });
    // Stash the row's asset name (`DD SYNTHETIC MOBILE <8 digits>`) — every server read resolves the asset by it
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const c = it.querySelector('.mantine-Accordion-control');
const m = (c.textContent || '').match(/DD SYNTHETIC MOBILE \\d{8}/);
if (!m) return false;
sessionStorage.setItem('__dd627_name', m[0]);
return true;`, 30000);
    // PREMISE (server): exactly ONE asset carries that name — stash its attachment ids (BEFORE)
    await assertFromJavascript(page, `const K = "__dd627_srv_premise", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const name = sessionStorage.getItem('__dd627_name');
  const hits = ((data.assets || {}).edges || []).filter(x => x.name === name);
  if (!name || hits.length !== 1) return false;
  sessionStorage.setItem('__dd627_before', JSON.stringify((hits[0].attachments || []).map(x => x.id)));
  return true;
})()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: TableQuery) { assets(params: $p) { edges { id name avatar { id } attachments { id fileName fileType tags { id name } } } } }", variables: {"p": {"limit": 50, "query": {"connector": "AND", "conditions": [{"column": "name", "operator": "CONTAINS", "value": "DD SYNTHETIC MOBILE"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Expand that row by its chevron
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`).click({ timeout: 30000 });
    // Let the detail panel mount
    await wait(page, 3);
    // Switch to the "Photos" tab
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"][normalize-space(.)="Photos"]`).click({ timeout: 30000 });
    // Let the Photos panel mount
    await wait(page, 3);
    // The "Photos" tab is active
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"][normalize-space(.)="Photos"][@data-active]`, 30000);
    // Open the picker ("Add Photo")
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//button[normalize-space(.)="Add Photo"]`).click({ timeout: 30000 });
    // The picker opened
    await assertPageContains(page, `Select Photo Source`, 30000);
    // Reveal the hidden gallery input (clearing any stale tag)
    await assertFromJavascript(page, `document.querySelectorAll('[data-dd-upload]')
  .forEach(n => n.removeAttribute('data-dd-upload'));
const inputs = [...document.querySelectorAll('input[type="file"]')];
const el = inputs.find(i => !i.capture);
if (!el) return false;
el.setAttribute('data-dd-upload', '1');
Object.assign(el.style, {
  display: 'block', opacity: '1', position: 'fixed',
  top: '0', left: '0', width: '240px', height: '40px', zIndex: '99999'
});
return true;
`, DEFAULT_TIMEOUT);
    // Upload ONE photo onto the marker asset
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
    // The picker closed itself once the file arrived
    await assertPageLacks(page, `Select Photo Source`, 30000);
    // UPLOAD LANDED: the last slide's <img src> is a server `/api/attachment/<id>` URL — stash that attachment id
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const idOf = img => ((img && img.getAttribute('src') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const id = idOf(last.querySelector('img'));
if (!id) return false;
sessionStorage.setItem('__dd627_att', id);
return true;`, 90000);
    // ⭐ SERVER: that id is the ONE new attachment on the asset (not in BEFORE, BEFORE intact), an image, untagged
    await assertFromJavascript(page, `const K = "__dd627_srv_upload", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const name = sessionStorage.getItem('__dd627_name');
  const hits = ((data.assets || {}).edges || []).filter(x => x.name === name);
  if (!name || hits.length !== 1) return false;
  const a = hits[0], atts = a.attachments || [], ids = atts.map(x => x.id);
  const att = sessionStorage.getItem('__dd627_att');
  let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd627_before') || 'null'); } catch (e) { before = null; }
  if (!att || !Array.isArray(before) || before.includes(att)) return false;
  const mine = atts.find(x => x.id === att);
  return !!(mine && /^image\\//.test(mine.fileType || '') && (mine.tags || []).length === 0 && ids.length === before.length + 1 && before.every(b => ids.includes(b)));
})()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: TableQuery) { assets(params: $p) { edges { id name avatar { id } attachments { id fileName fileType tags { id name } } } } }", variables: {"p": {"limit": 50, "query": {"connector": "AND", "conditions": [{"column": "name", "operator": "CONTAINS", "value": "DD SYNTHETIC MOBILE"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
    // Open the tag editor from OUR slide's `Edit Tags (0)` badge
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const idOf = img => ((img && img.getAttribute('src') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const att = sessionStorage.getItem('__dd627_att');
let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd627_before') || 'null'); } catch (e) { before = null; }
if (!att || !Array.isArray(before) || before.includes(att)) return false;
if (idOf(last.querySelector('img')) !== att) return false;
const b = [...last.querySelectorAll('*')]
  .filter(n => n.children.length === 0 && /^Edit Tags \\(0\\)$/.test((n.textContent || '').trim()));
if (b.length !== 1) return false;
b[0].click();
return true;`, 30000);
    // The tag editor opened once GET_TAGS_TABLE resolved (`Search tags...`)
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Edit Attachment Tags")]]//input[@placeholder="Search tags..."]`, 30000);
    // Focus `Search tags...` (opens the combobox)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Edit Attachment Tags")]]//input[@placeholder="Search tags..."]`).click({ timeout: 30000 });
    // Type "Test Tag"
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Edit Attachment Tags")]]//input[@placeholder="Search tags..."]`).fill(`Test Tag`, { timeout: DEFAULT_TIMEOUT });
    // Pick the existing tag "Test Tag"
    await el(page, `//*[@role="option"][normalize-space(.)="Test Tag"]`).click({ timeout: 30000 });
    // The "Test Tag" pill rendered (client echo only — trap 6)
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Edit Attachment Tags")]]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Pill-root ")][normalize-space(.)="Test Tag"]`, 30000);
    // ⭐ SERVER (ADD_TAG_TO_ATTACHMENT): our photo carries "Test Tag"
    await assertFromJavascript(page, `const K = "__dd627_srv_tagadd", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const name = sessionStorage.getItem('__dd627_name');
  const hits = ((data.assets || {}).edges || []).filter(x => x.name === name);
  if (!name || hits.length !== 1) return false;
  const a = hits[0], atts = a.attachments || [], ids = atts.map(x => x.id);
  const att = sessionStorage.getItem('__dd627_att');
  let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd627_before') || 'null'); } catch (e) { before = null; }
  if (!att || !Array.isArray(before) || before.includes(att)) return false;
  const mine = atts.find(x => x.id === att);
  return !!(mine && (mine.tags || []).some(t => t.name === 'Test Tag'));
})()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: TableQuery) { assets(params: $p) { edges { id name avatar { id } attachments { id fileName fileType tags { id name } } } } }", variables: {"p": {"limit": 50, "query": {"connector": "AND", "conditions": [{"column": "name", "operator": "CONTAINS", "value": "DD SYNTHETIC MOBILE"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Remove the "Test Tag" pill (its remove button)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Edit Attachment Tags")]]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Pill-root ")][normalize-space(.)="Test Tag"]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Pill-remove ")]`).click({ timeout: 30000 });
    // ⭐ SERVER (REMOVE_TAG_FROM_ATTACHMENT): our photo no longer carries "Test Tag"
    await assertFromJavascript(page, `const K = "__dd627_srv_tagremove", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const name = sessionStorage.getItem('__dd627_name');
  const hits = ((data.assets || {}).edges || []).filter(x => x.name === name);
  if (!name || hits.length !== 1) return false;
  const a = hits[0], atts = a.attachments || [], ids = atts.map(x => x.id);
  const att = sessionStorage.getItem('__dd627_att');
  let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd627_before') || 'null'); } catch (e) { before = null; }
  if (!att || !Array.isArray(before) || before.includes(att)) return false;
  const mine = atts.find(x => x.id === att);
  return !!(mine && !(mine.tags || []).some(t => t.name === 'Test Tag'));
})()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: TableQuery) { assets(params: $p) { edges { id name avatar { id } attachments { id fileName fileType tags { id name } } } } }", variables: {"p": {"limit": 50, "query": {"connector": "AND", "conditions": [{"column": "name", "operator": "CONTAINS", "value": "DD SYNTHETIC MOBILE"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // …and the editor agrees: no "Test Tag" pill, the search box still there
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => (x.textContent || '').includes('Edit Attachment Tags'));
if (!m || !m.querySelector('input[placeholder="Search tags..."]')) return false;
return ![...m.querySelectorAll('.mantine-Pill-root')]
  .some(p => (p.textContent || '').trim() === 'Test Tag');`, 30000);
    // Focus `Search tags...` again (focus resets the search)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Edit Attachment Tags")]]//input[@placeholder="Search tags..."]`).click({ timeout: 30000 });
    // Type a NEW tag name `DD SYNTHETIC MOBILE <RUNID>`
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Edit Attachment Tags")]]//input[@placeholder="Search tags..."]`).fill(`DD SYNTHETIC MOBILE ${RUNID}`, { timeout: DEFAULT_TIMEOUT });
    // 🛑 Stash the typed name (marker + 8 digits) and click the ONE `+ Create Tag` option offering exactly it — a PERMANENT org tag (mobile cannot delete one)
    await assertFromJavascript(page, `const i = document.querySelector('input[placeholder="Search tags..."]');
const v = i ? i.value : '';
if (!/^DD SYNTHETIC MOBILE \\d{8}$/.test(v)) return false;
const o = [...document.querySelectorAll('[role="option"]')]
  .filter(x => (x.textContent || '').trim() === \`+ Create Tag '\${v}'\`);
if (o.length !== 1) return false;
sessionStorage.setItem('__dd627_newtag', v);
o[0].click();
return true;`, 30000);
    // ⭐ SERVER (CREATE_TAG): the org holds exactly ONE tag with the typed name
    await assertFromJavascript(page, `const K = "__dd627_srv_tagcreate", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const n = sessionStorage.getItem('__dd627_newtag');
  return !!n && ((data.tags || {}).edges || []).filter(t => t.name === n).length === 1;
})()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: TableQuery) { tags(params: $p) { edges { id name } } }", variables: {"p": {"limit": 50, "query": {"connector": "AND", "conditions": [{"column": "name", "operator": "CONTAINS", "value": "DD SYNTHETIC MOBILE"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 45000);
    // Give a create→assign chain time to reach the server
    await wait(page, 5);
    await optional("SENTINEL (optional): the CREATED tag reached our photo \u2014 red = `handleTagCreate` never sent ADD_TAG_TO_ATTACHMENT (stale `tagOptions`)", async () => {
      await assertFromJavascript(page, `const K = "__dd627_srv_createassign", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const name = sessionStorage.getItem('__dd627_name');
  const hits = ((data.assets || {}).edges || []).filter(x => x.name === name);
  if (!name || hits.length !== 1) return false;
  const a = hits[0], atts = a.attachments || [], ids = atts.map(x => x.id);
  const att = sessionStorage.getItem('__dd627_att');
  let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd627_before') || 'null'); } catch (e) { before = null; }
  if (!att || !Array.isArray(before) || before.includes(att)) return false;
  const mine = atts.find(x => x.id === att);
  return !!(mine && (mine.tags || []).some(t => t.name === sessionStorage.getItem('__dd627_newtag')));
})()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: TableQuery) { assets(params: $p) { edges { id name avatar { id } attachments { id fileName fileType tags { id name } } } } }", variables: {"p": {"limit": 50, "query": {"connector": "AND", "conditions": [{"column": "name", "operator": "CONTAINS", "value": "DD SYNTHETIC MOBILE"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 20000);
    });
    // Close the tag editor (`Done`)
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Edit Attachment Tags")]]//button[normalize-space(.)="Done"]`).click({ timeout: 30000 });
    // The tag editor closed; our slide is still there
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const idOf = img => ((img && img.getAttribute('src') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const att = sessionStorage.getItem('__dd627_att');
let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd627_before') || 'null'); } catch (e) { before = null; }
if (!att || !Array.isArray(before) || before.includes(att)) return false;
return !document.querySelector('input[placeholder="Search tags..."]')
  && idOf(last.querySelector('img')) === att;`, 30000);
    // 🛑 GUARD + open the gear: only if the last slide IS our photo (the one new id)
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const idOf = img => ((img && img.getAttribute('src') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const att = sessionStorage.getItem('__dd627_att');
let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd627_before') || 'null'); } catch (e) { before = null; }
if (!att || !Array.isArray(before) || before.includes(att)) return false;
const img = last.querySelector('img');
if (idOf(img) !== att) return false;
const g = last.querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
    // Let the menu dropdown render
    await wait(page, 2);
    // Click "Set as Avatar" (no restore — our own upload on a marker asset)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Set as Avatar"])[1]`).click({ timeout: 30000 });
    // ⭐ SERVER (SET_ATTACHMENT_AS_AVATAR): the asset's avatar IS our photo
    await assertFromJavascript(page, `const K = "__dd627_srv_avatar", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const name = sessionStorage.getItem('__dd627_name');
  const hits = ((data.assets || {}).edges || []).filter(x => x.name === name);
  if (!name || hits.length !== 1) return false;
  const a = hits[0], atts = a.attachments || [], ids = atts.map(x => x.id);
  const att = sessionStorage.getItem('__dd627_att');
  let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd627_before') || 'null'); } catch (e) { before = null; }
  if (!att || !Array.isArray(before) || before.includes(att)) return false;
  const mine = atts.find(x => x.id === att);
  return !!(mine && a.avatar && a.avatar.id === att);
})()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: TableQuery) { assets(params: $p) { edges { id name avatar { id } attachments { id fileName fileType tags { id name } } } } }", variables: {"p": {"limit": 50, "query": {"connector": "AND", "conditions": [{"column": "name", "operator": "CONTAINS", "value": "DD SYNTHETIC MOBILE"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
    // 🛑 GUARD + open the gear: only if the last slide IS our photo — the delete can hit nothing that existed before this run
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const idOf = img => ((img && img.getAttribute('src') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const att = sessionStorage.getItem('__dd627_att');
let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd627_before') || 'null'); } catch (e) { before = null; }
if (!att || !Array.isArray(before) || before.includes(att)) return false;
const img = last.querySelector('img');
if (idOf(img) !== att) return false;
const g = last.querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
    // Let the menu dropdown render
    await wait(page, 2);
    // Click "Delete Photo"
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Delete Photo"])[1]`).click({ timeout: 30000 });
    // Confirm: "Yes"
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//*[contains(normalize-space(.), "Are you sure you want to delete this image?")]]//button[normalize-space(.)="Yes"]`).click({ timeout: 30000 });
    // ⭐ SERVER (REMOVE_ATTACHMENT): our photo is gone and the attachment set is EXACTLY BEFORE
    await assertFromJavascript(page, `const K = "__dd627_srv_deleted", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const name = sessionStorage.getItem('__dd627_name');
  const hits = ((data.assets || {}).edges || []).filter(x => x.name === name);
  if (!name || hits.length !== 1) return false;
  const a = hits[0], atts = a.attachments || [], ids = atts.map(x => x.id);
  const att = sessionStorage.getItem('__dd627_att');
  let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd627_before') || 'null'); } catch (e) { before = null; }
  if (!att || !Array.isArray(before) || before.includes(att)) return false;
  const mine = atts.find(x => x.id === att);
  return !!(!mine && ids.length === before.length && before.every(b => ids.includes(b)));
})()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: TableQuery) { assets(params: $p) { edges { id name avatar { id } attachments { id fileName fileType tags { id name } } } } }", variables: {"p": {"limit": 50, "query": {"connector": "AND", "conditions": [{"column": "name", "operator": "CONTAINS", "value": "DD SYNTHETIC MOBILE"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 60000);
    await soft.run("\u2b50 SERVER: deleting the avatar photo CLEARED the avatar \u2014 no dangling avatar id", async () => {
      await assertFromJavascript(page, `const K = "__dd627_srv_avatarcleared", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const name = sessionStorage.getItem('__dd627_name');
  const hits = ((data.assets || {}).edges || []).filter(x => x.name === name);
  if (!name || hits.length !== 1) return false;
  const a = hits[0], atts = a.attachments || [], ids = atts.map(x => x.id);
  const att = sessionStorage.getItem('__dd627_att');
  let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd627_before') || 'null'); } catch (e) { before = null; }
  if (!att || !Array.isArray(before) || before.includes(att)) return false;
  const mine = atts.find(x => x.id === att);
  return !!(!mine && !a.avatar);
})()); } catch (e) { ok = false; }
  if (ok) return true;
  sessionStorage.removeItem(K);
}
if (!sessionStorage.getItem(F) && Date.now() - Number(sessionStorage.getItem(T) || 0) > 2000) {
  sessionStorage.setItem(F, '1');
  sessionStorage.setItem(T, String(Date.now()));
  window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },
      body: JSON.stringify({ query: "query($p: TableQuery) { assets(params: $p) { edges { id name avatar { id } attachments { id fileName fileType tags { id name } } } } }", variables: {"p": {"limit": 50, "query": {"connector": "AND", "conditions": [{"column": "name", "operator": "CONTAINS", "value": "DD SYNTHETIC MOBILE"}]}}} }) })
    .then(r => r.json())
    .then(j => { sessionStorage.setItem(K, JSON.stringify(j)); sessionStorage.removeItem(F); })
    .catch(e => { sessionStorage.setItem(K, JSON.stringify({ errors: [String(e)] })); sessionStorage.removeItem(F); });
}
return false;`, 30000);
    });
    await soft.run("\u2026and the carousel agrees: as many slides as BEFORE, none of them ours (soft: UI echo)", async () => {
      await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const idOf = img => ((img && img.getAttribute('src') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const att = sessionStorage.getItem('__dd627_att');
let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd627_before') || 'null'); } catch (e) { before = null; }
if (!att || !Array.isArray(before) || before.includes(att)) return false;
const slides = [...it.querySelectorAll('[class*="mantine-Carousel-slide"]')];
return slides.length === before.length
  && !slides.some(s => idOf(s.querySelector('img')) === att);`, 30000);
    });
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd627_srv_premise', '__dd627_srv_premise:inflight', '__dd627_srv_premise:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd627_srv_upload', '__dd627_srv_upload:inflight', '__dd627_srv_upload:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd627_srv_tagadd', '__dd627_srv_tagadd:inflight', '__dd627_srv_tagadd:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd627_srv_tagremove', '__dd627_srv_tagremove:inflight', '__dd627_srv_tagremove:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd627_srv_tagcreate', '__dd627_srv_tagcreate:inflight', '__dd627_srv_tagcreate:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd627_srv_createassign', '__dd627_srv_createassign:inflight', '__dd627_srv_createassign:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd627_srv_avatar', '__dd627_srv_avatar:inflight', '__dd627_srv_avatar:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd627_srv_deleted', '__dd627_srv_deleted:inflight', '__dd627_srv_deleted:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // Remove the server read's sessionStorage keys
    await assertFromJavascript(page, `['__dd627_srv_avatarcleared', '__dd627_srv_avatarcleared:inflight', '__dd627_srv_avatarcleared:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
    // CLEANUP: close a tag editor left open by a failed step (no-op otherwise)
    await assertFromJavascript(page, `const m = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(x => (x.textContent || '').includes('Edit Attachment Tags'));
const d = m && [...m.querySelectorAll('button')].find(b => (b.textContent || '').trim() === 'Done');
if (d) d.click();
return true;`, 15000);
    // CLEANUP: remove this test's sessionStorage keys
    await assertFromJavascript(page, `['__dd627_name', '__dd627_before', '__dd627_att', '__dd627_newtag'].forEach(k => sessionStorage.removeItem(k));
return ['__dd627_name', '__dd627_before', '__dd627_att', '__dd627_newtag'].every(k => !sessionStorage.getItem(k));`, 15000);
    // Collapse the row again
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`).click({ timeout: 30000 });
    // Let the panel close
    await wait(page, 2);
    // RESTORED: the row reports itself collapsed
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const c = it.querySelector('.mantine-Accordion-control');
return !!c && c.getAttribute('aria-expanded') === 'false';`, 30000);
  }
  soft.check();
}
