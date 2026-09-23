// Generated from Mobile/dd_tests_mobile/MOB.622_Collector_Photo_Carousel.json by to_playwright.py — do not edit by hand yet.
// MOB.622_Collector_Photo_Carousel

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, uploadStandIn, wait } from '../support/dd';

export async function mob622(page: Page): Promise<void> {
  try {
    // Navigate to the asset collector
    await page.goto(`https://dev.mentorapm.com/apm-mobile/asset-collector`);
    // Wait for the collector to load its lookup cache
    await wait(page, 15);
    // The collector page rendered
    await assertElementPresent(page, `//*[@id="page-title"]//h4`, 30000);
    // Open the new-asset form (affixed + button)
    await el(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`).click({ timeout: 30000 });
    // The new-asset form opened
    await assertElementPresent(page, `//button[@form="asset-collector"]`, 30000);
    // Open the photo picker for photo 1 ("Add Asset Photo")
    await el(page, `//button[normalize-space(.)="Add Asset Photo"]`).click({ timeout: 30000 });
    // The picker opened for photo 1
    await assertPageContains(page, `Select Photo Source`, 30000);
    // Reveal the hidden gallery input for photo 1 (clearing any stale tag)
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
    // Upload photo 1
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
    // ⭐ The picker closed ITSELF after photo 1 — `onDialogChange` calls `close()`
    await assertPageLacks(page, `Select Photo Source`, 30000);
    // Let the reducer take photo 1
    await wait(page, 4);
    // At ONE photo: the carousel exists
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('[class*="mantine-Carousel"]').length >= 1;`, 30000);
    // ⭐ At ONE photo: NO indicators — `withIndicators={photos.length > 1}` is false
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('[class*="mantine-Carousel-indicator"]').length === 0;`, 30000);
    // ⭐ At ONE photo: NO controls — `withControls={photos.length > 1}` is false
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('[class*="mantine-Carousel-control"]').length === 0;`, 30000);
    // `PhotoMenu` rendered for a LOCAL, unsaved photo (its gear is present)
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('[aria-label="Settings"]').length >= 1;`, 30000);
    // Open the photo picker for photo 2 ("Add More Photos")
    await el(page, `//button[normalize-space(.)="Add More Photos"]`).click({ timeout: 30000 });
    // The picker opened for photo 2
    await assertPageContains(page, `Select Photo Source`, 30000);
    // Reveal the hidden gallery input for photo 2 (clearing any stale tag)
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
    // Upload photo 2
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
    // ⭐ The picker closed ITSELF after photo 2 — `onDialogChange` calls `close()`
    await assertPageLacks(page, `Select Photo Source`, 30000);
    // Let the reducer take photo 2
    await wait(page, 4);
    // The button still reads "Add More Photos" (a second photo landed)
    await assertElementPresent(page, `//button[normalize-space(.)="Add More Photos"]`, 30000);
    // PROOF: there are now TWO slides, so the reducer APPENDED rather than replaced
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('[class*="mantine-Carousel-slide"]').length === 2;`, 30000);
    // ⭐ At TWO photos: indicators APPEAR — the `photos.length > 1` branch
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('[class*="mantine-Carousel-indicator"]').length >= 1;`, 30000);
    // ⭐ At TWO photos: controls APPEAR — the same branch, second prop
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
return f.querySelectorAll('[class*="mantine-Carousel-control"]').length >= 1;`, 30000);
    // Every slide's tags badge reads its DERIVED zero form `Edit Tags (0)` — counted per slide, not merely present somewhere
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
const slides = f.querySelectorAll('[class*="mantine-Carousel-slide"]').length;
if (slides < 1) return false;
const hits = (f.textContent || '').match(/Edit Tags \\(0\\)/g) || [];
return hits.length === slides;`, 30000);
    // ⭐ BEFORE fullscreen: no `aria-label="Close"` control exists (excluding the form's own modal X)
    await assertFromJavascript(page, `return [...document.querySelectorAll('[aria-label="Close"]')]
  .filter(n => !n.classList.contains('mantine-Modal-close')).length === 0;`, 30000);
    // Open the photo menu on the ACTIVE (last) slide
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
const g = [...f.querySelectorAll('[aria-label="Settings"]')];
if (!g.length) return false;
g[g.length - 1].click();
return true;`, 30000);
    // Let the menu dropdown render
    await wait(page, 2);
    // "View in Fullscreen" is offered
    await assertPageContains(page, `View in Fullscreen`, 30000);
    // Open fullscreen
    await el(page, `(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="View in Fullscreen"])[1]`).click({ timeout: 30000 });
    // Let the fullscreen modal mount
    await wait(page, 3);
    // ⭐ The FULLSCREEN modal opened — a carousel outside the form
    await assertFromJavascript(page, `const fs = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(m => m.querySelector('[class*="mantine-Carousel"]')
          && !m.querySelector('#asset-collector'));
return !!fs;`, 30000);
    // ⭐ Fullscreen indicators are UNCONDITIONAL — a different rule from the inline carousel above
    await assertFromJavascript(page, `const fs = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(m => m.querySelector('[class*="mantine-Carousel"]')
          && !m.querySelector('#asset-collector'));
if (!fs) return false;
return fs.querySelectorAll('[class*="mantine-Carousel-indicator"]').length >= 1;`, 30000);
    // ⭐ INSIDE fullscreen: the `aria-label="Close"` control now EXISTS
    await assertFromJavascript(page, `return [...document.querySelectorAll('[aria-label="Close"]')]
  .filter(n => !n.classList.contains('mantine-Modal-close')).length >= 1;`, 30000);
    // Open the tag editor from the `Edit Tags (n)` badge (matches any count — the badge is the target, not its number)
    await assertFromJavascript(page, `const f = document.getElementById('asset-collector');
if (!f) return false;
const b = [...f.querySelectorAll('*')]
  .filter(n => n.children.length === 0
            && /Edit Tags \\(\\d+\\)/.test(n.textContent || ''));
if (!b.length) return false;
b[b.length - 1].click();
return true;`, 30000);
    // Let the tag modal mount
    await wait(page, 3);
    // The tag editor opened — its heading rendered once the tags query resolved
    await assertPageContains(page, `Edit Attachment Tags`, 30000);
    // ⭐ The FULL TagSelector rendered — `Search tags...`, not `Auto-apply tags?`
    await assertElementPresent(page, `//input[@placeholder="Search tags..."]`, 30000);
    // …and its `All Tags` section rendered
    await assertPageContains(page, `All Tags`, 30000);
    // …and its `MentorLens Tags` section (`LensTags`) rendered
    await assertPageContains(page, `MentorLens Tags`, 30000);
    // Install a recorder for modal bodies — the description modal closes itself after 3s
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
    // `Lens: Thermography` is a lens card, UNCHECKED, with a description `?`
    await assertFromJavascript(page, `const card = [...document.querySelectorAll('[role="checkbox"]')].find(c => {
  const t = c.querySelector('p');
  return t && (t.textContent || '').trim() === 'Lens: Thermography';
});
return !!card && card.getAttribute('aria-checked') === 'false'
  && !!card.querySelector('button[aria-label="Show MentorLens tag description"]');`, 30000);
    // Click `Lens: Thermography`'s `?` — from JS, on the icon itself (its card's own click would ASSIGN the tag)
    await assertFromJavascript(page, `const card = [...document.querySelectorAll('[role="checkbox"]')].find(c => {
  const t = c.querySelector('p');
  return t && (t.textContent || '').trim() === 'Lens: Thermography';
});
const q = card && card.querySelector('button[aria-label="Show MentorLens tag description"]');
if (!q) return false;
q.click();
return true;`, 20000);
    // ⭐ The description modal showed `Lens: Thermography`'s desc — exactly `Used in MentorLens for thermographic analysis` (and only it)
    await assertFromJavascript(page, `return JSON.stringify(window.__dd622Desc) === JSON.stringify(['Used in MentorLens for thermographic analysis']);`, 15000);
    // Let the modal outlive its 3s auto-close
    await wait(page, 4);
    // ⭐ The description modal CLOSED ITSELF — only the modals that were open before it remain
    await assertFromJavascript(page, `return [...document.querySelectorAll('.mantine-Modal-body')]
  .every(b => window.__dd622Old.has(b));`, 15000);
    // `Lens: Thermography` is STILL unchecked — the `?` assigned nothing
    await assertFromJavascript(page, `const card = [...document.querySelectorAll('[role="checkbox"]')].find(c => {
  const t = c.querySelector('p');
  return t && (t.textContent || '').trim() === 'Lens: Thermography';
});
return !!card && card.getAttribute('aria-checked') === 'false';`, 15000);
    // `Lens: Condition Assessment` is a lens card, UNCHECKED, with a description `?`
    await assertFromJavascript(page, `const card = [...document.querySelectorAll('[role="checkbox"]')].find(c => {
  const t = c.querySelector('p');
  return t && (t.textContent || '').trim() === 'Lens: Condition Assessment';
});
return !!card && card.getAttribute('aria-checked') === 'false'
  && !!card.querySelector('button[aria-label="Show MentorLens tag description"]');`, 30000);
    // Click `Lens: Condition Assessment`'s `?` — from JS, on the icon itself (its card's own click would ASSIGN the tag)
    await assertFromJavascript(page, `const card = [...document.querySelectorAll('[role="checkbox"]')].find(c => {
  const t = c.querySelector('p');
  return t && (t.textContent || '').trim() === 'Lens: Condition Assessment';
});
const q = card && card.querySelector('button[aria-label="Show MentorLens tag description"]');
if (!q) return false;
q.click();
return true;`, 20000);
    // ⭐ The description modal showed `Lens: Condition Assessment`'s desc — exactly `Used in MentorLens for condition assessment`, recorded after the first
    await assertFromJavascript(page, `return JSON.stringify(window.__dd622Desc) === JSON.stringify(['Used in MentorLens for thermographic analysis', 'Used in MentorLens for condition assessment']);`, 15000);
    // Let the modal outlive its 3s auto-close
    await wait(page, 4);
    // ⭐ The description modal CLOSED ITSELF — only the modals that were open before it remain
    await assertFromJavascript(page, `return [...document.querySelectorAll('.mantine-Modal-body')]
  .every(b => window.__dd622Old.has(b));`, 15000);
    // `Lens: Condition Assessment` is STILL unchecked — the `?` assigned nothing
    await assertFromJavascript(page, `const card = [...document.querySelectorAll('[role="checkbox"]')].find(c => {
  const t = c.querySelector('p');
  return t && (t.textContent || '').trim() === 'Lens: Condition Assessment';
});
return !!card && card.getAttribute('aria-checked') === 'false';`, 15000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Leave fullscreen by its own Close control
    await assertFromJavascript(page, `const b = [...document.querySelectorAll('[aria-label="Close"]')]
  .filter(n => !n.classList.contains('mantine-Modal-close'));
if (!b.length) return false;
b[0].click();
return true;`, 30000);
    // Let fullscreen close
    await wait(page, 2);
    // RESTORED: fullscreen is gone and the form is still open
    await assertFromJavascript(page, `const fs = [...document.querySelectorAll('.mantine-Modal-content')]
  .find(m => m.querySelector('[class*="mantine-Carousel"]')
          && !m.querySelector('#asset-collector'));
return !fs && !!document.getElementById('asset-collector');`, 30000);
    // Remove the recorder
    await assertFromJavascript(page, `if (window.__dd622Obs) window.__dd622Obs.disconnect();
delete window.__dd622Obs; delete window.__dd622Desc; delete window.__dd622Old;
return true;`, 15000);
    // Close the tag editor with its own `Done` button (assigning a tag would WRITE)
    await el(page, `//button[normalize-space(.)="Done"]`).click({ timeout: 30000 });
    // Let the tag modal close
    await wait(page, 2);
    // The tag editor is gone
    await assertPageLacks(page, `Edit Attachment Tags`, 30000);
    // Close the form with its X — DISCARDING both photos, never submitting
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][contains(., "Get New Asset")]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`).click({ timeout: 30000 });
    // Let the form close
    await wait(page, 2);
    // RESTORED: the form is gone, so both photos were discarded unsent
    await assertFromJavascript(page, `return !document.getElementById('asset-collector');`, 30000);
  }
}
