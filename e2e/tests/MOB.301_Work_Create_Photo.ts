// Generated from Mobile/dd_tests_mobile/MOB.301_Work_Create_Photo.json by to_playwright.py — do not edit by hand yet.
// MOB.301_Work_Create_Photo

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, el, uploadStandIn, wait } from '../support/dd';

export async function mob301(page: Page): Promise<void> {
  try {
    // Navigate to /work — the work order list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list begin rendering
    await wait(page, 3);
    // The "Work Orders" page mounted
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
    // Wait for the workstage pages and the lookup prefetch
    await wait(page, 20);
    // The work list rendered its search box
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
    // LOADEDALL 1/3: the initial fetch finished
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
    // LOADEDALL 2/3: paging through workstages finished
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
    // LOADEDALL 3/3: the per-stage detail downloads finished
    await assertPageLacks(page, `workstages downloaded`, 180000);
    // Open the create-work-order form (affixed + button)
    await el(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`).click({ timeout: 30000 });
    // Let the form mount
    await wait(page, 3);
    // The create form rendered
    await assertElementPresent(page, `//form[@id="workorder-insert-form"]`, 30000);
    // BASELINE: no carousel yet, and `Add Work Order Photo` is offered (the role has `work.update`)
    await assertFromJavascript(page, `const f = document.getElementById('workorder-insert-form');
if (!f) return false;
const slides = f.querySelectorAll('[class*="mantine-Carousel-slide"]');
const carousels = f.querySelectorAll('[class*="mantine-Carousel-root"]');
const labels = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return carousels.length === 0 && slides.length === 0
  && labels.includes('Add Work Order Photo');`, 30000);
    // Open the photo picker (`Add Work Order Photo`)
    await el(page, `//button[normalize-space(.)="Add Work Order Photo"]`).click({ timeout: 30000 });
    // The picker opened — "Select Photo Source"
    await assertPageContains(page, `Select Photo Source`, 30000);
    // Reveal the hidden gallery file input (useFileDialog appends it to <body>)
    await assertFromJavascript(page, `const inputs = [...document.querySelectorAll('input[type="file"]')];
const el = inputs.find(i => !i.capture);
if (!el) return false;
el.setAttribute('data-dd-upload', '1');
Object.assign(el.style, {
  display: 'block', opacity: '1', position: 'fixed',
  top: '0', left: '0', width: '240px', height: '40px', zIndex: '99999'
});
return true;
`, DEFAULT_TIMEOUT);
    // Upload a photo — MOB.600's bucketKey, copied (trap 12)
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
    // The picker closed itself once the file arrived (`onDialogChange` — MOB.621)
    await assertPageLacks(page, `Select Photo Source`, 30000);
    // Let the form take the photo and the carousel mount
    await wait(page, 4);
    // ⭐ ONE photo in the form's carousel — `addImages` took it
    await assertFromJavascript(page, `const f = document.getElementById('workorder-insert-form');
if (!f) return false;
const slides = f.querySelectorAll('[class*="mantine-Carousel-slide"]');
const carousels = f.querySelectorAll('[class*="mantine-Carousel-root"]');
const labels = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return carousels.length >= 1 && slides.length === 1;`, 30000);
    // ⭐ …held LOCALLY: the slide's image is a `blob:` URL (`URL.createObjectURL`), not a server link — nothing is uploaded before submit
    await assertFromJavascript(page, `const f = document.getElementById('workorder-insert-form');
if (!f) return false;
const imgs = [...f.querySelectorAll('[class*="mantine-Carousel-slide"] img')];
return imgs.length >= 1 && imgs.every(i => (i.getAttribute('src') || '').indexOf('blob:') === 0);`, 30000);
    // …and the button still reads `Add Work Order Photo` — this call site passes a fixed label; it does not flip like the collector's
    await assertFromJavascript(page, `const f = document.getElementById('workorder-insert-form');
if (!f) return false;
const slides = f.querySelectorAll('[class*="mantine-Carousel-slide"]');
const carousels = f.querySelectorAll('[class*="mantine-Carousel-root"]');
const labels = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return labels.includes('Add Work Order Photo')
  && !labels.includes('Add More Photos');`, 30000);
  } finally {
    // steps Datadog marks alwaysExecute: cleanup that runs even after a failure
    // Close the form with its X — DISCARDING the photo, never submitting
    await el(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//form[@id="workorder-insert-form"]]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`).click({ timeout: 30000 });
    // Let the form close
    await wait(page, 2);
    // RESTORED: the form is unmounted, so the photo was discarded unsent
    await assertFromJavascript(page, `return !document.getElementById('workorder-insert-form');`, 30000);
  }
}
