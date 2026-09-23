// Generated from Mobile/dd_tests_mobile/MOB.301_Work_Create_Photo.json by to_playwright.py — do not edit by hand yet.
// MOB.301_Work_Create_Photo

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageContains, assertPageLacks, click, uploadStandIn, wait } from '../support/dd';

export async function mob301(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to /work \u2014 the work order list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Let the work list begin rendering", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]`, `Work Orders`, 30000);
  });
  await run.step("Wait for the workstage pages and the lookup prefetch", {}, async () => {
    await wait(page, 20);
  });
  await run.step("The work list rendered its search box", {}, async () => {
    await assertElementPresent(page, `//input[@placeholder="Find Workstage(s)"]`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 1/3: the initial fetch finished", {}, async () => {
    await assertPageLacks(page, `Retrieving assigned work`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 2/3: paging through workstages finished", {}, async () => {
    await assertPageLacks(page, `workstages found`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL 3/3: the per-stage detail downloads finished", {}, async () => {
    await assertPageLacks(page, `workstages downloaded`, 360000);
  });
  await run.step("Open the create-work-order form (affixed + button)", {}, async () => {
    await click(page, `//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button`, 30000);
  });
  await run.step("Let the form mount", {}, async () => {
    await wait(page, 3);
  });
  await run.step("The create form rendered", {}, async () => {
    await assertElementPresent(page, `//form[@id="workorder-insert-form"]`, 30000);
  });
  await run.step("BASELINE: no carousel yet, and `Add Work Order Photo` is offered (the role has `work.update`)", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('workorder-insert-form');
if (!f) return false;
const slides = f.querySelectorAll('[class*="mantine-Carousel-slide"]');
const carousels = f.querySelectorAll('[class*="mantine-Carousel-root"]');
const labels = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return carousels.length === 0 && slides.length === 0
  && labels.includes('Add Work Order Photo');`, 30000);
  });
  await run.step("Open the photo picker (`Add Work Order Photo`)", {}, async () => {
    await click(page, `//button[normalize-space(.)="Add Work Order Photo"]`, 30000);
  });
  await run.step("The picker opened \u2014 \"Select Photo Source\"", {}, async () => {
    await assertPageContains(page, `Select Photo Source`, 30000);
  });
  await run.step("Reveal the hidden gallery file input (useFileDialog appends it to <body>)", {}, async () => {
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
  });
  await run.step("Upload a photo \u2014 MOB.600's bucketKey, copied (trap 12)", {}, async () => {
    await uploadStandIn(page, `//input[@data-dd-upload="1"]`, ["Screenshot 2024-12-11 at 3.23.46\u202fPM.png"], DEFAULT_TIMEOUT);
  });
  await run.step("The picker closed itself once the file arrived (`onDialogChange` \u2014 MOB.621)", {}, async () => {
    await assertPageLacks(page, `Select Photo Source`, 30000);
  });
  await run.step("Let the form take the photo and the carousel mount", {}, async () => {
    await wait(page, 4);
  });
  await run.step("\u2b50 ONE photo in the form's carousel \u2014 `addImages` took it", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('workorder-insert-form');
if (!f) return false;
const slides = f.querySelectorAll('[class*="mantine-Carousel-slide"]');
const carousels = f.querySelectorAll('[class*="mantine-Carousel-root"]');
const labels = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return carousels.length >= 1 && slides.length === 1;`, 30000);
  });
  await run.step("\u2b50 \u2026held LOCALLY: the slide's image is a `blob:` URL (`URL.createObjectURL`), not a server link \u2014 nothing is uploaded before submit", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('workorder-insert-form');
if (!f) return false;
const imgs = [...f.querySelectorAll('[class*="mantine-Carousel-slide"] img')];
return imgs.length >= 1 && imgs.every(i => (i.getAttribute('src') || '').indexOf('blob:') === 0);`, 30000);
  });
  await run.step("\u2026and the button still reads `Add Work Order Photo` \u2014 this call site passes a fixed label; it does not flip like the collector's", {}, async () => {
    await assertFromJavascript(page, `const f = document.getElementById('workorder-insert-form');
if (!f) return false;
const slides = f.querySelectorAll('[class*="mantine-Carousel-slide"]');
const carousels = f.querySelectorAll('[class*="mantine-Carousel-root"]');
const labels = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());
return labels.includes('Add Work Order Photo')
  && !labels.includes('Add More Photos');`, 30000);
  });
  await run.step("Close the form with its X \u2014 DISCARDING the photo, never submitting", {always: true}, async () => {
    await click(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")][.//form[@id="workorder-insert-form"]]//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]`, 30000);
  });
  await run.step("Let the form close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("RESTORED: the form is unmounted, so the photo was discarded unsent", {always: true}, async () => {
    await assertFromJavascript(page, `return !document.getElementById('workorder-insert-form');`, 30000);
  });
  run.finish();
}
