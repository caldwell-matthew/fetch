// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.623_Collector_Saved_Photo_Menu.json. This file is the source now: edit it directly.
// MOB.623_Collector_Saved_Photo_Menu

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, press, uploadStandIn, wait } from '../../support/dd';

export async function mob623(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the asset collector", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("The collector page rendered", {}, async () => {
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, 30000);
  });
  await run.step("FIXTURE GUARD: a \"DD SYNTHETIC MOBILE\" asset is in the collected list (MOB.600 residue)", {allow: 'soft'}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]`, 60000);
  });
  await run.step("Expand that row by its chevron (the avatar and geolocate controls stop propagation, so the chevron is the safe target)", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`, 30000);
  });
  await run.step("The row's tab strip rendered", {}, async () => {
    await assertElementPresent(page, `((//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//*[@role="tab"])[1]`, 30000);
  });
  await run.step("The strip has SIX tabs (`AssetLookupDetails`' template)", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
return it.querySelectorAll('[role="tab"]').length === 6;`, 30000);
  });
  await run.step("Switch to the \"Photos\" tab", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//*[@role="tab"][normalize-space(.)="Photos"]`, 30000);
  });
  await run.step("The \"Photos\" tab is active", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//*[@role="tab"][normalize-space(.)="Photos"][@data-active]`, 30000);
  });
  await run.step("PHOTOS panel: the `Add Photo` button renders (asset.update)", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//button[normalize-space(.)="Add Photo"]`, 30000);
  });
  await run.step("PHOTOS panel: NO `Add File` here - that is the Docs panel's control", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const t = [...it.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return !t.includes('Add File');`, 30000);
  });
  await run.step("Open the picker (\"Add Photo\") on the saved asset", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//button[normalize-space(.)="Add Photo"]`, 30000);
  });
  await run.step("The picker opened", {}, async () => {
    await assertPageContains(page, `Select Photo Source`, 30000);
  });
  await run.step("Reveal the hidden gallery input (clearing any stale tag)", {}, async () => {
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
  });
  await run.step("Upload a photo onto the EXISTING asset", {}, async () => {
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
  });
  await run.step("The picker closed ITSELF once the file arrived (`onDialogChange`)", {}, async () => {
    await assertPageLacks(page, `Select Photo Source`, 30000);
  });
  await run.step("\u2b50 UPLOAD LANDED: the last slide's <img src> is a server URL, not the `blob:` preview", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const img = last.querySelector('img');
const src = img ? (img.getAttribute('src') || '') : '';
return src.length > 0 && !src.startsWith('blob:') && !src.startsWith('data:');`, 90000);
  });
  await run.step("\u2b50 PHOTOS panel: a carousel with a slide and an <img>, `Add Photo`, and NO `Add File`", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const t = [...it.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]').length;
const img = it.querySelector('[class*="mantine-Carousel-slide"] img');
return slides >= 1 && !!img && t.includes('Add Photo') && !t.includes('Add File');`, 30000);
  });
  await run.step("The gear (`aria-label=\"Settings\"`) renders on the saved photo", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
return !!last.querySelector('[aria-label="Settings"]');`, 30000);
  });
  await run.step("Open the gear", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const g = last.querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
  });
  await run.step("Let the menu dropdown render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\u2b50 MENU SET: exactly View in Fullscreen \u00b7 Get Description \u00b7 Set as Avatar \u00b7 Rotate Image \u00b7 Delete Photo \u2014 in that order", {}, async () => {
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Menu-dropdown');
if (dds.length !== 1) return false;
const got = [...dds[0].querySelectorAll('.mantine-Menu-item')]
  .map(e => (e.textContent || '').trim());
const want = ['View in Fullscreen', 'Get Description', 'Set as Avatar', 'Rotate Image', 'Delete Photo'];
return JSON.stringify(got) === JSON.stringify(want);`, 30000);
  });
  await run.step("Close the menu (nothing in it is clicked yet)", {}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Let the menu close", {}, async () => {
    await wait(page, 1);
  });
  await run.step("ROTATE 1/4: record the last slide's current src", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const img = last.querySelector('img');
if (!img || !img.getAttribute('src')) return false;
sessionStorage.setItem('__dd623_src', img.getAttribute('src'));
return true;`, 30000);
  });
  await run.step("ROTATE 1/4: open the gear on that slide", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const g = last.querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
  });
  await run.step("ROTATE 1/4: click \"Rotate Image\"", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Rotate Image"])[1]`, 30000);
  });
  await run.step("\u2b50 ROTATE 1/4: the src changed and carries a fresh `t=` cache-buster", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const before = sessionStorage.getItem('__dd623_src');
const img = last.querySelector('img');
if (!before || !img) return false;
const now = img.getAttribute('src') || '';
return now !== before && /[?&]t=\\d+/.test(now);`, 60000);
  });
  await run.step("ROTATE 2/4: record the last slide's current src", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const img = last.querySelector('img');
if (!img || !img.getAttribute('src')) return false;
sessionStorage.setItem('__dd623_src', img.getAttribute('src'));
return true;`, 30000);
  });
  await run.step("ROTATE 2/4: open the gear on that slide", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const g = last.querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
  });
  await run.step("ROTATE 2/4: click \"Rotate Image\"", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Rotate Image"])[1]`, 30000);
  });
  await run.step("\u2b50 ROTATE 2/4: the src changed and carries a fresh `t=` cache-buster", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const before = sessionStorage.getItem('__dd623_src');
const img = last.querySelector('img');
if (!before || !img) return false;
const now = img.getAttribute('src') || '';
return now !== before && /[?&]t=\\d+/.test(now);`, 60000);
  });
  await run.step("ROTATE 3/4: record the last slide's current src", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const img = last.querySelector('img');
if (!img || !img.getAttribute('src')) return false;
sessionStorage.setItem('__dd623_src', img.getAttribute('src'));
return true;`, 30000);
  });
  await run.step("ROTATE 3/4: open the gear on that slide", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const g = last.querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
  });
  await run.step("ROTATE 3/4: click \"Rotate Image\"", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Rotate Image"])[1]`, 30000);
  });
  await run.step("\u2b50 ROTATE 3/4: the src changed and carries a fresh `t=` cache-buster", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const before = sessionStorage.getItem('__dd623_src');
const img = last.querySelector('img');
if (!before || !img) return false;
const now = img.getAttribute('src') || '';
return now !== before && /[?&]t=\\d+/.test(now);`, 60000);
  });
  await run.step("ROTATE 4/4: record the last slide's current src", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const img = last.querySelector('img');
if (!img || !img.getAttribute('src')) return false;
sessionStorage.setItem('__dd623_src', img.getAttribute('src'));
return true;`, 30000);
  });
  await run.step("ROTATE 4/4: open the gear on that slide", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const g = last.querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
  });
  await run.step("ROTATE 4/4: click \"Rotate Image\"", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Rotate Image"])[1]`, 30000);
  });
  await run.step("\u2b50 ROTATE 4/4: the src changed and carries a fresh `t=` cache-buster", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const before = sessionStorage.getItem('__dd623_src');
const img = last.querySelector('img');
if (!before || !img) return false;
const now = img.getAttribute('src') || '';
return now !== before && /[?&]t=\\d+/.test(now);`, 60000);
  });
  await run.step("Switch to the \"Docs\" tab", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//*[@role="tab"][normalize-space(.)="Docs"]`, 30000);
  });
  await run.step("The \"Docs\" tab is active", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//*[@role="tab"][normalize-space(.)="Docs"][@data-active]`, 30000);
  });
  await run.step("\u2b50 DOCS panel: `Add File`, NO `Add Photo`, and NO carousel \u2014 the biconditional closes", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const t = [...it.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]').length;
return slides === 0 && t.includes('Add File') && !t.includes('Add Photo');`, 30000);
  });
  await run.step("Switch to the \"Attributes\" tab", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//*[@role="tab"][normalize-space(.)="Attributes"]`, 30000);
  });
  await run.step("The \"Attributes\" tab is active", {}, async () => {
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//*[@role="tab"][normalize-space(.)="Attributes"][@data-active]`, 30000);
  });
  await run.step("ATTRIBUTES panel: EXACTLY ONE of `No Attributes Found` or a table of labelled rows", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const tabEl = it.querySelector('[role="tab"][aria-selected="true"], [role="tab"][data-active]');
const byId = tabEl && tabEl.getAttribute('aria-controls')
  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;
const p = byId || [...it.querySelectorAll('[role="tabpanel"]')]
  .find(x => x.style.display !== 'none');
if (!p) return false;
const empty = (p.textContent || '').includes('No Attributes Found');
const rows = p.querySelectorAll('table tr b').length;
return empty !== (rows > 0);`, 30000);
  });
  await run.step("CLEANUP: remove this test's scratch key `__dd623_src`", {always: true}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd623_src');
return !sessionStorage.getItem('__dd623_src');`, 30000);
  });
  await run.step("Collapse the row again", {always: true}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")][not(contains(., "DD SYNTHETIC MOBILE MAP"))]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`, 30000);
  });
  await run.step("Let the panel close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: the row reports itself collapsed", {always: true}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && /DD SYNTHETIC MOBILE \\d{8}/.test(c.textContent || '');
});
if (!it) return false;
const c = it.querySelector('.mantine-Accordion-control');
return !!c && c.getAttribute('aria-expanded') === 'false';`, 30000);
  });
  run.finish();
}
