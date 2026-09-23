// Generated from Mobile/dd_tests_mobile/MOB.624_Collector_Row_Avatar_Modal.json by to_playwright.py — do not edit by hand yet.
// MOB.624_Collector_Row_Avatar_Modal

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, click, wait } from '../support/dd';

export async function mob624(page: Page): Promise<void> {
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
  await run.step("FIXTURE GUARD: its badge (image/video attachment count) is not 0 \u2014 MOB.623 residue", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const b = it.querySelector('.mantine-Indicator-indicator');
return !!b && (b.textContent || '').trim() !== '0';`, 30000);
  });
  await run.step("BASELINE: the row is collapsed and no modal is open", {}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const c = it.querySelector('.mantine-Accordion-control');
return c.getAttribute('aria-expanded') === 'false' && !document.querySelector('.mantine-Modal-content');`, 30000);
  });
  await run.step("Click the row's avatar", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-item ")][.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Accordion-control ")][contains(., "DD SYNTHETIC MOBILE")]])[1]//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Indicator-root ")]`, 30000);
  });
  await run.step("Let the fullscreen modal mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 The modal opened, names the asset, and offers `Done` \u2014 and the avatar's click did NOT expand the accordion (stopPropagation)", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const named = (m.textContent || '').includes('DD SYNTHETIC MOBILE');
const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const c = i.querySelector('.mantine-Accordion-control');
  return c && (c.textContent || '').includes('DD SYNTHETIC MOBILE');
});
const collapsed = !!it && it.querySelector('.mantine-Accordion-control').getAttribute('aria-expanded') === 'false';
return named && t.includes('Done') && collapsed;`, 30000);
  });
  await run.step("SEGMENTS: exactly two, values 1 (Photos) and 2 (Docs)", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const vals = [...root.querySelectorAll('input[type="radio"]')].map(i => i.value);
return JSON.stringify(vals) === JSON.stringify(['1', '2']);`, 30000);
  });
  await run.step("Switch to the \"Photos\" segment by VALUE (1) \u2014 never by label (it can render icon-only)", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const el = root.querySelector('input[type="radio"][value="1"]');
if (!el) return false;
el.click();
return true;`, 30000);
  });
  await run.step("Let the Photos panel mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 PHOTOS: a carousel with a slide, `Add Photo`, and NO `Add File`", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
const slides = m.querySelectorAll('[class*="mantine-Carousel-slide"]').length;
return slides >= 1 && t.includes('Add Photo') && !t.includes('Add File');`, 30000);
  });
  await run.step("Switch to the \"Docs\" segment by VALUE (2) \u2014 never by label (it can render icon-only)", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const root = m.querySelector('[class*="mantine-SegmentedControl-root"]');
if (!root) return false;
const el = root.querySelector('input[type="radio"][value="2"]');
if (!el) return false;
el.click();
return true;`, 30000);
  });
  await run.step("Let the Docs panel mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 DOCS: `Add File`, NO `Add Photo`, and NO carousel \u2014 the biconditional closes", {}, async () => {
    await assertFromJavascript(page, `const m = document.querySelector('.mantine-Modal-content');
if (!m) return false;
const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return !m.querySelector('[class*="mantine-Carousel"]') && t.includes('Add File') && !t.includes('Add Photo');`, 30000);
  });
  await run.step("Close the modal with its own `Done`", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]//button[normalize-space(.)="Done"]`, 30000);
  });
  await run.step("Let the modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("The modal is gone", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.querySelector('.mantine-Modal-content');`, 30000);
  });
  await run.step("SENTINEL (bugs \u00a735): the row is EXPANDED \u2014 clicks inside the modal toggled the accordion behind it", {always: true, allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const cc = i.querySelector('.mantine-Accordion-control');
  return cc && (cc.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const c = it.querySelector('.mantine-Accordion-control');
if (!c) return false;
return c.getAttribute('aria-expanded') === 'true';`, DEFAULT_TIMEOUT);
  });
  await run.step("RESTORE: collapse the row (\u00a735 left it open)", {always: true}, async () => {
    await assertFromJavascript(page, `const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const cc = i.querySelector('.mantine-Accordion-control');
  return cc && (cc.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const c = it.querySelector('.mantine-Accordion-control');
if (!c) return false;
if (c.getAttribute('aria-expanded') === 'true') c.click();
return true;`, 30000);
  });
  await run.step("Let the accordion collapse", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: no modal is open and the row is collapsed again", {always: true}, async () => {
    await assertFromJavascript(page, `if (document.querySelector('.mantine-Modal-content')) return false;
const items = [...document.querySelectorAll('.mantine-Accordion-item')];
const it = items.find(i => {
  const cc = i.querySelector('.mantine-Accordion-control');
  return cc && (cc.textContent || '').includes('DD SYNTHETIC MOBILE');
});
if (!it) return false;
const c = it.querySelector('.mantine-Accordion-control');
if (!c) return false;
return c.getAttribute('aria-expanded') === 'false';`, 30000);
  });
  run.finish();
}
