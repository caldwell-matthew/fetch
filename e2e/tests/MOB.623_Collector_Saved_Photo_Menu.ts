// Generated from Mobile/dd_tests_mobile/MOB.623_Collector_Saved_Photo_Menu.json by to_playwright.py — do not edit by hand yet.
// MOB.623_Collector_Saved_Photo_Menu

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, uploadStandIn, wait } from '../support/dd';

export async function mob623(page: Page): Promise<void> {
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
    // Expand that row by its chevron (the avatar and geolocate controls stop propagation, so the chevron is the safe target)
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-chevron ")]`).click({ timeout: 30000 });
    // Let the detail panel mount
    await wait(page, 3);
    // The row's tab strip rendered
    await assertElementPresent(page, `((//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"])[1]`, 30000);
    // The strip has SIX tabs (`AssetLookupDetails`' template)
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
return it.querySelectorAll('[role="tab"]').length === 6;`, 30000);
    // Switch to the "Photos" tab
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"][normalize-space(.)="Photos"]`).click({ timeout: 30000 });
    // Let the Photos panel mount
    await wait(page, 3);
    // The "Photos" tab is active
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"][normalize-space(.)="Photos"][@data-active]`, 30000);
    // PHOTOS panel: the `Add Photo` button renders (asset.update)
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//button[normalize-space(.)="Add Photo"]`, 30000);
    // PHOTOS panel: NO `Add File` here - that is the Docs panel's control
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const t = [...it.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return !t.includes('Add File');`, 30000);
    // Open the picker ("Add Photo") on the saved asset
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
    // Upload a photo onto the EXISTING asset
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
    // The picker closed ITSELF once the file arrived (`onDialogChange`)
    await assertPageLacks(page, `Select Photo Source`, 30000);
    // ⭐ UPLOAD LANDED: the last slide's <img src> is a server URL, not the `blob:` preview
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const img = last.querySelector('img');
const src = img ? (img.getAttribute('src') || '') : '';
return src.length > 0 && !src.startsWith('blob:') && !src.startsWith('data:');`, 90000);
    // ⭐ PHOTOS panel: a carousel with a slide and an <img>, `Add Photo`, and NO `Add File`
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const t = [...it.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]').length;
const img = it.querySelector('[class*="mantine-Carousel-slide"] img');
return slides >= 1 && !!img && t.includes('Add Photo') && !t.includes('Add File');`, 30000);
    // The gear (`aria-label="Settings"`) renders on the saved photo
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
return !!last.querySelector('[aria-label="Settings"]');`, 30000);
    // Open the gear
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const g = last.querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
    // Let the menu dropdown render
    await wait(page, 2);
    // ⭐ MENU SET: exactly View in Fullscreen · Get Description · Set as Avatar · Rotate Image · Delete Photo — in that order
    await assertFromJavascript(page, `const dds = document.querySelectorAll('.mantine-Menu-dropdown');
if (dds.length !== 1) return false;
const got = [...dds[0].querySelectorAll('.mantine-Menu-item')]
  .map(e => (e.textContent || '').trim());
const want = ['View in Fullscreen', 'Get Description', 'Set as Avatar', 'Rotate Image', 'Delete Photo'];
return JSON.stringify(got) === JSON.stringify(want);`, 30000);
    // Close the menu (nothing in it is clicked yet)
    await page.keyboard.press(`Escape`);
    // Let the menu close
    await wait(page, 1);
    // ROTATE 1/4: record the last slide's current src
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const img = last.querySelector('img');
if (!img || !img.getAttribute('src')) return false;
sessionStorage.setItem('__dd623_src', img.getAttribute('src'));
return true;`, 30000);
    // ROTATE 1/4: open the gear on that slide
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const g = last.querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
    // Let the menu dropdown render
    await wait(page, 2);
    // ROTATE 1/4: click "Rotate Image"
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Rotate Image"])[1]`).click({ timeout: 30000 });
    // ⭐ ROTATE 1/4: the src changed and carries a fresh `t=` cache-buster
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
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
    // ROTATE 2/4: record the last slide's current src
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const img = last.querySelector('img');
if (!img || !img.getAttribute('src')) return false;
sessionStorage.setItem('__dd623_src', img.getAttribute('src'));
return true;`, 30000);
    // ROTATE 2/4: open the gear on that slide
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const g = last.querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
    // Let the menu dropdown render
    await wait(page, 2);
    // ROTATE 2/4: click "Rotate Image"
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Rotate Image"])[1]`).click({ timeout: 30000 });
    // ⭐ ROTATE 2/4: the src changed and carries a fresh `t=` cache-buster
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
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
    // ROTATE 3/4: record the last slide's current src
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const img = last.querySelector('img');
if (!img || !img.getAttribute('src')) return false;
sessionStorage.setItem('__dd623_src', img.getAttribute('src'));
return true;`, 30000);
    // ROTATE 3/4: open the gear on that slide
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const g = last.querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
    // Let the menu dropdown render
    await wait(page, 2);
    // ROTATE 3/4: click "Rotate Image"
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Rotate Image"])[1]`).click({ timeout: 30000 });
    // ⭐ ROTATE 3/4: the src changed and carries a fresh `t=` cache-buster
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
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
    // ROTATE 4/4: record the last slide's current src
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const img = last.querySelector('img');
if (!img || !img.getAttribute('src')) return false;
sessionStorage.setItem('__dd623_src', img.getAttribute('src'));
return true;`, 30000);
    // ROTATE 4/4: open the gear on that slide
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]');
const last = slides[slides.length - 1];
if (!last) return false;
const g = last.querySelector('[aria-label="Settings"]');
if (!g) return false;
g.click();
return true;`, 30000);
    // Let the menu dropdown render
    await wait(page, 2);
    // ROTATE 4/4: click "Rotate Image"
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Rotate Image"])[1]`).click({ timeout: 30000 });
    // ⭐ ROTATE 4/4: the src changed and carries a fresh `t=` cache-buster
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
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
    // Switch to the "Docs" tab
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"][normalize-space(.)="Docs"]`).click({ timeout: 30000 });
    // Let the Docs panel mount
    await wait(page, 3);
    // The "Docs" tab is active
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"][normalize-space(.)="Docs"][@data-active]`, 30000);
    // ⭐ DOCS panel: `Add File`, NO `Add Photo`, and NO carousel — the biconditional closes
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const t = [...it.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const slides = it.querySelectorAll('[class*="mantine-Carousel-slide"]').length;
return slides === 0 && t.includes('Add File') && !t.includes('Add Photo');`, 30000);
    // Switch to the "Attributes" tab
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"][normalize-space(.)="Attributes"]`).click({ timeout: 30000 });
    // Let the Attributes panel mount
    await wait(page, 2);
    // The "Attributes" tab is active
    await assertElementPresent(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[@role="tab"][normalize-space(.)="Attributes"][@data-active]`, 30000);
    // ATTRIBUTES panel: EXACTLY ONE of `No Attributes Found` or a table of labelled rows
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
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
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // CLEANUP: remove this test's scratch key `__dd623_src`
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd623_src');
return !sessionStorage.getItem('__dd623_src');`, 30000);
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
