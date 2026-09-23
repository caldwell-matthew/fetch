// Generated from Mobile/dd_tests_mobile/MOB.628_Collector_Document_Add_Delete.json by to_playwright.py — do not edit by hand yet.
// MOB.628_Collector_Document_Add_Delete

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, click, uploadStandIn, wait } from '../support/dd';

export async function mob628(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the asset collector", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the collector to load its lookup cache", {}, async () => {
    await wait(page, 15);
  });
  await run.step("The collector page rendered", {}, async () => {
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, 30000);
  });
  await run.step("FIXTURE GUARD: a \"DD SYNTHETIC MOBILE\" asset is in the collected list (MOB.600 residue)", {allow: 'soft'}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]`, 60000);
  });
  await run.step("Stash the row's asset name (`DD SYNTHETIC MOBILE <8 digits>`) \u2014 every server read resolves the asset by it", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const c = it.querySelector('.mantine-Accordion-control');
const m = (c.textContent || '').match(/DD SYNTHETIC MOBILE \\d{8}/);
if (!m) return false;
sessionStorage.setItem('__dd628_name', m[0]);
return true;`, 30000);
  });
  await run.step("PREMISE (server): exactly ONE asset carries that name \u2014 stash its attachment ids (BEFORE)", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd628_srv_premise", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const name = sessionStorage.getItem('__dd628_name');
  const hits = ((data.assets || {}).edges || []).filter(x => x.name === name);
  if (!name || hits.length !== 1) return false;
  sessionStorage.setItem('__dd628_before', JSON.stringify((hits[0].attachments || []).map(x => x.id)));
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd628_srv_premise', '__dd628_srv_premise:inflight', '__dd628_srv_premise:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("Expand that row by its chevron", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`, 30000);
  });
  await run.step("Let the detail panel mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("Switch to the \"Docs\" tab", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"][normalize-space(.)="Docs"]`, 30000);
  });
  await run.step("Let the Docs panel mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Docs\" tab is active", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"][normalize-space(.)="Docs"][@data-active]`, 30000);
  });
  await run.step("`Add File` renders (asset.create)", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//button[normalize-space(.)="Add File"]`, 30000);
  });
  await run.step("Reveal the row's hidden \"Add File\" input (accept=\"*/*\", exactly one on the page)", {}, async () => {
    await assertFromJavascript(page, `document.querySelectorAll('[data-dd-upload]')
  .forEach(n => n.removeAttribute('data-dd-upload'));
const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const hits = [...it.querySelectorAll('input[type="file"][accept="*/*"]')];
const all = document.querySelectorAll('input[type="file"][accept="*/*"]').length;
if (hits.length !== 1 || all !== 1) return false;   // 0 = not rendered, >1 = ambiguous
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
  await run.step("\ud83d\udcc4 Upload ONE PDF through `Add File` (the owner-recorded PDF \u2014 trap 12)", {}, async () => {
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["TestPDF.pdf"], DEFAULT_TIMEOUT);
  });
  await run.step("The input holds exactly ONE file, a non-image `.pdf` \u2014 stash its name", {}, async () => {
    await assertFromJavascript(page, `const el = document.querySelector('input[data-dd-upload="1"]');
if (!el || !el.files || el.files.length !== 1) return false;
const f = el.files[0];
if (/^image\\//.test(f.type) || !/\\.pdf$/i.test(f.name)) return false;
sessionStorage.setItem('__dd628_file', f.name);
return true;`, 30000);
  });
  await run.step("The file table shows exactly ONE row with that name whose attachment id was not there before \u2014 stash the id", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const idOf = a => ((a && a.getAttribute('href') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const rows = [...it.querySelectorAll('table tbody tr')].map(tr => {
  const a = tr.querySelector('a[href]');
  return { tr, cb: tr.querySelector('input[type="checkbox"]'), id: idOf(a),
           name: a ? (a.textContent || '').trim() : null };
});
const file = sessionStorage.getItem('__dd628_file');
let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd628_before') || 'null'); } catch (e) { before = null; }
if (!file || !Array.isArray(before)) return false;
const fresh = rows.filter(r => r.name === file && r.id && !before.includes(r.id));
if (fresh.length !== 1) return false;
sessionStorage.setItem('__dd628_att', fresh[0].id);
return true;`, 60000);
  });
  await run.step("\u2b50 SERVER (CREATE_PENDING_ATTACHMENTS): that id is the ONE new attachment \u2014 the PDF's name, not an image, BEFORE intact", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd628_srv_upload", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const name = sessionStorage.getItem('__dd628_name');
  const hits = ((data.assets || {}).edges || []).filter(x => x.name === name);
  if (!name || hits.length !== 1) return false;
  const a = hits[0], atts = a.attachments || [], ids = atts.map(x => x.id);
  const att = sessionStorage.getItem('__dd628_att'), file = sessionStorage.getItem('__dd628_file');
  let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd628_before') || 'null'); } catch (e) { before = null; }
  if (!att || !file || !Array.isArray(before) || before.includes(att)) return false;
  const mine = atts.find(x => x.id === att);
  return !!(mine && mine.fileName === file && !/^image\\//.test(mine.fileType || '') && ids.length === before.length + 1 && before.every(b => ids.includes(b)));
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
return false;`, 90000);
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd628_srv_upload', '__dd628_srv_upload:inflight', '__dd628_srv_upload:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\ud83d\uded1 GUARD + check the box: only OUR row (the new id, the PDF's name), and nothing else checked", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const idOf = a => ((a && a.getAttribute('href') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const rows = [...it.querySelectorAll('table tbody tr')].map(tr => {
  const a = tr.querySelector('a[href]');
  return { tr, cb: tr.querySelector('input[type="checkbox"]'), id: idOf(a),
           name: a ? (a.textContent || '').trim() : null };
});
const att = sessionStorage.getItem('__dd628_att');
const file = sessionStorage.getItem('__dd628_file');
let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd628_before') || 'null'); } catch (e) { before = null; }
if (!att || !file || !Array.isArray(before) || before.includes(att)) return false;
const mineRows = rows.filter(r => r.id === att && r.name === file);
if (mineRows.length !== 1 || !mineRows[0].cb) return false;
const cb = mineRows[0].cb;
if (rows.some(r => r !== mineRows[0] && r.cb && r.cb.checked)) return false;
if (!cb.checked) cb.click();
return cb.checked && rows.filter(r => r.cb && r.cb.checked).length === 1;`, 30000);
  });
  await run.step("The table's gear is enabled (a row is selected)", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//table//button[@aria-label="Menu"][not(@disabled)]`, 30000);
  });
  await run.step("Open the table's gear", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//table//button[@aria-label="Menu"]`, 30000);
  });
  await run.step("Let the menu dropdown render", {}, async () => {
    await wait(page, 1);
  });
  await run.step("\ud83d\uded1 GUARD + click `Delete File(s)`: the ONLY checked row is ours \u2014 `deleteFiles` deletes every selected row", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const idOf = a => ((a && a.getAttribute('href') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const rows = [...it.querySelectorAll('table tbody tr')].map(tr => {
  const a = tr.querySelector('a[href]');
  return { tr, cb: tr.querySelector('input[type="checkbox"]'), id: idOf(a),
           name: a ? (a.textContent || '').trim() : null };
});
const att = sessionStorage.getItem('__dd628_att');
const file = sessionStorage.getItem('__dd628_file');
let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd628_before') || 'null'); } catch (e) { before = null; }
if (!att || !file || !Array.isArray(before) || before.includes(att)) return false;
const checked = rows.filter(r => r.cb && r.cb.checked);
if (checked.length !== 1 || checked[0].id !== att || checked[0].name !== file) return false;
const dds = document.querySelectorAll('.mantine-Menu-dropdown');
if (dds.length !== 1) return false;
const del = [...dds[0].querySelectorAll('.mantine-Menu-item')]
  .filter(i => (i.textContent || '').trim() === 'Delete File(s)');
if (del.length !== 1) return false;
del[0].click();
return true;`, 30000);
  });
  await run.step("\u2b50 SERVER (REMOVE_ATTACHMENT): the PDF is gone and the attachment set is EXACTLY BEFORE", {}, async () => {
    await assertFromJavascript(page, `const K = "__dd628_srv_deleted", F = K + ':inflight', T = K + ':at';
const raw = sessionStorage.getItem(K);
if (raw) {
  let ok = false;
  try { const data = (JSON.parse(raw) || {}).data; ok = !!data && !!((() => {
  const name = sessionStorage.getItem('__dd628_name');
  const hits = ((data.assets || {}).edges || []).filter(x => x.name === name);
  if (!name || hits.length !== 1) return false;
  const a = hits[0], atts = a.attachments || [], ids = atts.map(x => x.id);
  const att = sessionStorage.getItem('__dd628_att'), file = sessionStorage.getItem('__dd628_file');
  let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd628_before') || 'null'); } catch (e) { before = null; }
  if (!att || !file || !Array.isArray(before) || before.includes(att)) return false;
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
  });
  await run.step("Remove the server read's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd628_srv_deleted', '__dd628_srv_deleted:inflight', '__dd628_srv_deleted:at'].forEach(k => sessionStorage.removeItem(k));
return true;`, 15000);
  });
  await run.step("\u2026and the table agrees: no row carries our id, the `Add File` button is still there (soft: UI echo)", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const idOf = a => ((a && a.getAttribute('href') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;
const rows = [...it.querySelectorAll('table tbody tr')].map(tr => {
  const a = tr.querySelector('a[href]');
  return { tr, cb: tr.querySelector('input[type="checkbox"]'), id: idOf(a),
           name: a ? (a.textContent || '').trim() : null };
});
const att = sessionStorage.getItem('__dd628_att');
const file = sessionStorage.getItem('__dd628_file');
let before = null; try { before = JSON.parse(sessionStorage.getItem('__dd628_before') || 'null'); } catch (e) { before = null; }
if (!att || !file || !Array.isArray(before) || before.includes(att)) return false;
const addFile = [...it.querySelectorAll('button')].some(b => (b.textContent || '').trim() === 'Add File');
return addFile && !rows.some(r => r.id === att);`, 30000);
  });
  await run.step("CLEANUP: remove this test's sessionStorage keys", {always: true}, async () => {
    await assertFromJavascript(page, `['__dd628_name', '__dd628_before', '__dd628_file', '__dd628_att'].forEach(k => sessionStorage.removeItem(k));
return ['__dd628_name', '__dd628_before', '__dd628_file', '__dd628_att'].every(k => !sessionStorage.getItem(k));`, 15000);
  });
  await run.step("Collapse the row again", {always: true}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`, 30000);
  });
  await run.step("Let the panel close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: the row reports itself collapsed", {always: true}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const c = it.querySelector('.mantine-Accordion-control');
return !!c && c.getAttribute('aria-expanded') === 'false';`, 30000);
  });
  run.finish();
}
