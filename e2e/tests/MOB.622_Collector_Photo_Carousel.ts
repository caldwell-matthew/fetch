// Generated from Mobile/dd_tests_mobile/MOB.622_Collector_Photo_Carousel.json by to_playwright.py — do not edit by hand yet.
// MOB.622_Collector_Photo_Carousel

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, uploadStandIn, wait } from '../support/dd';

export async function mob622(page: Page): Promise<void> {
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
  await run.step("Open the new-asset form (affixed + button)", {}, async () => {
    await click(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`, 30000);
  });
  await run.step("The new-asset form opened", {}, async () => {
    await assertElementPresent(page, `//button[@form="asset-collector"]`, 30000);
  });
  await run.step("Open the photo picker for photo 1 (\"Add Asset Photo\")", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add Asset Photo"]`, 30000);
  });
  await run.step("The picker opened for photo 1", {}, async () => {
    await assertPageContains(page, `Select Photo Source`, 30000);
  });
  await run.step("Reveal the hidden gallery input for photo 1 (clearing any stale tag)", {}, async () => {
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
  await run.step("Upload photo 1", {}, async () => {
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
  });
  await run.step("\u2b50 The picker closed ITSELF after photo 1 \u2014 `onDialogChange` calls `close()`", {}, async () => {
    await assertPageLacks(page, `Select Photo Source`, 30000);
  });
  await run.step("Let the reducer take photo 1", {}, async () => {
    await wait(page, 4);
  });
  await run.step("At ONE photo: the carousel exists", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('[class*="mantine-Carousel"]').length >= 1;`, 30000);
  });
  await run.step("\u2b50 At ONE photo: NO indicators \u2014 `withIndicators={photos.length > 1}` is false", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('[class*="mantine-Carousel-indicator"]').length === 0;`, 30000);
  });
  await run.step("\u2b50 At ONE photo: NO controls \u2014 `withControls={photos.length > 1}` is false", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('[class*="mantine-Carousel-control"]').length === 0;`, 30000);
  });
  await run.step("`PhotoMenu` rendered for a LOCAL, unsaved photo (its gear is present)", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('[aria-label="Settings"]').length >= 1;`, 30000);
  });
  await run.step("Open the photo picker for photo 2 (\"Add More Photos\")", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add More Photos"]`, 30000);
  });
  await run.step("The picker opened for photo 2", {}, async () => {
    await assertPageContains(page, `Select Photo Source`, 30000);
  });
  await run.step("Reveal the hidden gallery input for photo 2 (clearing any stale tag)", {}, async () => {
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
  await run.step("Upload photo 2", {}, async () => {
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
  });
  await run.step("\u2b50 The picker closed ITSELF after photo 2 \u2014 `onDialogChange` calls `close()`", {}, async () => {
    await assertPageLacks(page, `Select Photo Source`, 30000);
  });
  await run.step("Let the reducer take photo 2", {}, async () => {
    await wait(page, 4);
  });
  await run.step("The button still reads \"Add More Photos\" (a second photo landed)", {}, async () => {
    await assertElementPresent(page, `//button[normalize-space(.)="Add More Photos"]`, 30000);
  });
  await run.step("PROOF: there are now TWO slides, so the reducer APPENDED rather than replaced", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('[class*="mantine-Carousel-slide"]').length === 2;`, 30000);
  });
  await run.step("\u2b50 At TWO photos: indicators APPEAR \u2014 the `photos.length > 1` branch", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('[class*="mantine-Carousel-indicator"]').length >= 1;`, 30000);
  });
  await run.step("\u2b50 At TWO photos: controls APPEAR \u2014 the same branch, second prop", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('[class*="mantine-Carousel-control"]').length >= 1;`, 30000);
  });
  await run.step("Every slide's tags badge reads its DERIVED zero form `Edit Tags (0)` \u2014 counted per slide, not merely present somewhere", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
const slides = f.querySelectorAll('[class*="mantine-Carousel-slide"]').length;
if (slides < 1) return false;
const hits = (f.textContent || '').match(/Edit Tags \\(0\\)/g) || [];
return hits.length === slides;`, 30000);
  });
  await run.step("\u2b50 BEFORE fullscreen: no `aria-label=\"Close\"` control exists (excluding the form's own modal X)", {}, async () => {
    await assertFromJavascript(page, `return [...document.querySelectorAll('[aria-label="Close"]')]
  .filter(n => !n.classList.contains('mantine-Modal-close')).length === 0;`, 30000);
  });
  await run.step("Open the photo menu on the ACTIVE (last) slide", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
const g = [...f.querySelectorAll('[aria-label="Settings"]')];
if (!g.length) return false;
g[g.length - 1].click();
return true;`, 30000);
  });
  await run.step("Let the menu dropdown render", {}, async () => {
    await wait(page, 2);
  });
  await run.step("\"View in Fullscreen\" is offered", {}, async () => {
    await assertPageContains(page, `View in Fullscreen`, 30000);
  });
  await run.step("Open fullscreen", {}, async () => {
    await click(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="View in Fullscreen"])[1]`, 30000);
  });
  await run.step("Let the fullscreen modal mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("\u2b50 The FULLSCREEN modal opened \u2014 a carousel outside the form", {}, async () => {
    await assertFromJavascript(page, `const fs = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(m => m.querySelector('[class*="mantine-Carousel"]')
          && !m.querySelector('#asset-collector'));
return !!fs;`, 30000);
  });
  await run.step("\u2b50 Fullscreen indicators are UNCONDITIONAL \u2014 a different rule from the inline carousel above", {}, async () => {
    await assertFromJavascript(page, `const fs = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(m => m.querySelector('[class*="mantine-Carousel"]')
          && !m.querySelector('#asset-collector'));
if (!fs) return false;
return fs.querySelectorAll('[class*="mantine-Carousel-indicator"]').length >= 1;`, 30000);
  });
  await run.step("\u2b50 INSIDE fullscreen: the `aria-label=\"Close\"` control now EXISTS", {}, async () => {
    await assertFromJavascript(page, `return [...document.querySelectorAll('[aria-label="Close"]')]
  .filter(n => !n.classList.contains('mantine-Modal-close')).length >= 1;`, 30000);
  });
  await run.step("Leave fullscreen by its own Close control", {always: true}, async () => {
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('[aria-label="Close"]')]
  .filter(n => !n.classList.contains('mantine-Modal-close'));
if (!b.length) return false;
b[0].click();
return true;`, 30000);
  });
  await run.step("Let fullscreen close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: fullscreen is gone and the form is still open", {always: true}, async () => {
    await assertFromJavascript(page, `const fs = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(m => m.querySelector('[class*="mantine-Carousel"]')
          && !m.querySelector('#asset-collector'));
return !fs && !!document.getElementById('asset-collector');`, 30000);
  });
  await run.step("Open the tag editor from the `Edit Tags (n)` badge (matches any count \u2014 the badge is the target, not its number)", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
const b = [...f.querySelectorAll('*')]
  .filter(n => n.children.length === 0
            && /Edit Tags \\(\\d+\\)/.test(n.textContent || ''));
if (!b.length) return false;
b[b.length - 1].click();
return true;`, 30000);
  });
  await run.step("Let the tag modal mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The tag editor opened \u2014 its heading rendered once the tags query resolved", {}, async () => {
    await assertPageContains(page, `Edit Attachment Tags`, 30000);
  });
  await run.step("\u2b50 The FULL TagSelector rendered \u2014 `Search tags...`, not `Auto-apply tags?`", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Search tags..."]`, 30000);
  });
  await run.step("\u2026and its `All Tags` section rendered", {}, async () => {
    await assertPageContains(page, `All Tags`, 30000);
  });
  await run.step("\u2026and its `MentorLens Tags` section (`LensTags`) rendered", {}, async () => {
    await assertPageContains(page, `MentorLens Tags`, 30000);
  });
  await run.step("Install a recorder for modal bodies \u2014 the description modal closes itself after 3s", {}, async () => {
    await assertFromJavascript(page, `if (!window.__dd622Obs) {
  window.__dd622Old = new Set(document.querySelectorAll('.mantine-Modal-body'));
  window.__dd622Desc = [];
  window.__dd622Obs = new MutationObserver(() => {
    document.querySelectorAll('.mantine-Modal-body').forEach(b => {
      if (window.__dd622Old.has(b)) return;
      const t = (b.textContent || '').trim();
      if (t && window.__dd622Desc.indexOf(t) === -1) window.__dd622Desc.push(t);
    });
  });
  window.__dd622Obs.observe(document.body, { childList: true, subtree: true, characterData: true });
}
return true;`, 15000);
  });
  await run.step("`Lens: Thermography` is a lens card, UNCHECKED, with a description `?`", {}, async () => {
    await assertFromJavascript(page, `const card = [...document.querySelectorAll('[role="checkbox"]')].find(c => {
  const t = c.querySelector('p');
  return t && (t.textContent || '').trim() === 'Lens: Thermography';
});
return !!card && card.getAttribute('aria-checked') === 'false'
  && !!card.querySelector('button[aria-label="Show MentorLens tag description"]');`, 30000);
  });
  await run.step("Click `Lens: Thermography`'s `?` \u2014 from JS, on the icon itself (its card's own click would ASSIGN the tag)", {}, async () => {
    await assertFromJavascript(page, `const card = [...document.querySelectorAll('[role="checkbox"]')].find(c => {
  const t = c.querySelector('p');
  return t && (t.textContent || '').trim() === 'Lens: Thermography';
});
const q = card && card.querySelector('button[aria-label="Show MentorLens tag description"]');
if (!q) return false;
q.click();
return true;`, 20000);
  });
  await run.step("\u2b50 The description modal showed `Lens: Thermography`'s desc \u2014 exactly `Used in MentorLens for thermographic analysis` (and only it)", {}, async () => {
    await assertFromJavascript(page, `return JSON.stringify(window.__dd622Desc) === JSON.stringify(['Used in MentorLens for thermographic analysis']);`, 15000);
  });
  await run.step("Let the modal outlive its 3s auto-close", {}, async () => {
    await wait(page, 4);
  });
  await run.step("\u2b50 The description modal CLOSED ITSELF \u2014 only the modals that were open before it remain", {}, async () => {
    await assertFromJavascript(page, `return [...document.querySelectorAll('.mantine-Modal-body')]
  .every(b => window.__dd622Old.has(b));`, 15000);
  });
  await run.step("`Lens: Thermography` is STILL unchecked \u2014 the `?` assigned nothing", {}, async () => {
    await assertFromJavascript(page, `const card = [...document.querySelectorAll('[role="checkbox"]')].find(c => {
  const t = c.querySelector('p');
  return t && (t.textContent || '').trim() === 'Lens: Thermography';
});
return !!card && card.getAttribute('aria-checked') === 'false';`, 15000);
  });
  await run.step("`Lens: Condition Assessment` is a lens card, UNCHECKED, with a description `?`", {}, async () => {
    await assertFromJavascript(page, `const card = [...document.querySelectorAll('[role="checkbox"]')].find(c => {
  const t = c.querySelector('p');
  return t && (t.textContent || '').trim() === 'Lens: Condition Assessment';
});
return !!card && card.getAttribute('aria-checked') === 'false'
  && !!card.querySelector('button[aria-label="Show MentorLens tag description"]');`, 30000);
  });
  await run.step("Click `Lens: Condition Assessment`'s `?` \u2014 from JS, on the icon itself (its card's own click would ASSIGN the tag)", {}, async () => {
    await assertFromJavascript(page, `const card = [...document.querySelectorAll('[role="checkbox"]')].find(c => {
  const t = c.querySelector('p');
  return t && (t.textContent || '').trim() === 'Lens: Condition Assessment';
});
const q = card && card.querySelector('button[aria-label="Show MentorLens tag description"]');
if (!q) return false;
q.click();
return true;`, 20000);
  });
  await run.step("\u2b50 The description modal showed `Lens: Condition Assessment`'s desc \u2014 exactly `Used in MentorLens for condition assessment`, recorded after the first", {}, async () => {
    await assertFromJavascript(page, `return JSON.stringify(window.__dd622Desc) === JSON.stringify(['Used in MentorLens for thermographic analysis', 'Used in MentorLens for condition assessment']);`, 15000);
  });
  await run.step("Let the modal outlive its 3s auto-close", {}, async () => {
    await wait(page, 4);
  });
  await run.step("\u2b50 The description modal CLOSED ITSELF \u2014 only the modals that were open before it remain", {}, async () => {
    await assertFromJavascript(page, `return [...document.querySelectorAll('.mantine-Modal-body')]
  .every(b => window.__dd622Old.has(b));`, 15000);
  });
  await run.step("`Lens: Condition Assessment` is STILL unchecked \u2014 the `?` assigned nothing", {}, async () => {
    await assertFromJavascript(page, `const card = [...document.querySelectorAll('[role="checkbox"]')].find(c => {
  const t = c.querySelector('p');
  return t && (t.textContent || '').trim() === 'Lens: Condition Assessment';
});
return !!card && card.getAttribute('aria-checked') === 'false';`, 15000);
  });
  await run.step("Remove the recorder", {always: true}, async () => {
    await assertFromJavascript(page, `if (window.__dd622Obs) window.__dd622Obs.disconnect();
delete window.__dd622Obs; delete window.__dd622Desc; delete window.__dd622Old;
return true;`, 15000);
  });
  await run.step("Close the tag editor with its own `Done` button (assigning a tag would WRITE)", {always: true}, async () => {
    await click(page, `//button[normalize-space(.)="Done"]`, 30000);
  });
  await run.step("Let the tag modal close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("The tag editor is gone", {always: true}, async () => {
    await assertPageLacks(page, `Edit Attachment Tags`, 30000);
  });
  await run.step("Close the form with its X \u2014 DISCARDING both photos, never submitting", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`, 30000);
  });
  await run.step("Let the form close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: the form is gone, so both photos were discarded unsent", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.getElementById('asset-collector');`, 30000);
  });
  run.finish();
}
