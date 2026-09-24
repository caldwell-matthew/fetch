// Generated from legacy/Mobile/dd_tests_mobile/MOB.341_Work_Map_Toggle.json by to_playwright.py — do not edit by hand yet.
// MOB.341_Work_Map_Toggle

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, assertFromJavascript, assertPageLacks, click, wait } from '../support/dd';

export async function mob341(page: Page): Promise<void> {
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
  await run.step("LOADEDALL: start the idle clock", {}, async () => {
    await assertFromJavascript(page, `sessionStorage.removeItem('__dd_worklist_idle_since');
return true;`, DEFAULT_TIMEOUT);
  });
  await run.step("LOADEDALL: no loading bar on screen for 10s straight (all six phases, and the gaps between them)", {}, async () => {
    await assertFromJavascript(page, `const K = '__dd_worklist_idle_since';
if (document.querySelector('.mantine-Progress-root')) {
  sessionStorage.removeItem(K);
  return false;
}
const since = Number(sessionStorage.getItem(K)) || 0;
if (!since) { sessionStorage.setItem(K, String(Date.now())); return false; }
return Date.now() - since >= 10000;`, 360000);
  });
  await run.step("BASELINE: the list is NOT in map view", {}, async () => {
    await assertFromJavascript(page, `return sessionStorage.getItem('show-mobile-work-map') === null || sessionStorage.getItem('show-mobile-work-map') === 'false';`, 30000);
  });
  await run.step("BASELINE: the list container is showing and no map canvas exists yet", {}, async () => {
    await assertFromJavascript(page, `const list = document.querySelector('[data-virtuoso-scroller], [data-testid*="virtuoso"]');
return !!list && !document.querySelector('canvas.mapboxgl-canvas');`, 30000);
  });
  await run.step("The map toggle is present (permissions.map.read)", {}, async () => {
    await assertElementPresent(page, `//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ") or @data-icon="earth-americas" or contains(concat(" ", normalize-space(@class), " "), " fa-earth-americas ")]]`, 30000);
  });
  await run.step("Switch the work list to map view", {}, async () => {
    await click(page, `//button[.//*[@data-icon="globe" or contains(concat(" ", normalize-space(@class), " "), " fa-globe ") or @data-icon="earth-americas" or contains(concat(" ", normalize-space(@class), " "), " fa-earth-americas ")]]`, 30000);
  });
  await run.step("Let Mapbox initialise", {}, async () => {
    await wait(page, 6);
  });
  await run.step("PROOF: sessionStorage['show-mobile-work-map'] is now 'true'", {}, async () => {
    await assertFromJavascript(page, `return sessionStorage.getItem('show-mobile-work-map') === 'true';`, 30000);
  });
  await run.step("PROOF: the Mapbox WebGL canvas rendered on /work", {}, async () => {
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
  });
  await run.step("PROOF: the LIST container is gone \u2014 the map replaced it, it did not stack", {}, async () => {
    await assertFromJavascript(page, `return !document.querySelector('[data-virtuoso-scroller], [data-testid*="virtuoso"]');`, 30000);
  });
  await run.step("Switch back to the list view (restore)", {always: true}, async () => {
    await click(page, `//button[.//*[@data-icon="list" or contains(concat(" ", normalize-space(@class), " "), " fa-list ") or @data-icon="list-ul" or contains(concat(" ", normalize-space(@class), " "), " fa-list-ul ")]]`, 30000);
  });
  await run.step("Let the list re-render", {always: true}, async () => {
    await wait(page, 4);
  });
  await run.step("RESTORED: sessionStorage['show-mobile-work-map'] is back to 'false'", {always: true}, async () => {
    await assertFromJavascript(page, `return sessionStorage.getItem('show-mobile-work-map') === 'false';`, 30000);
  });
  await run.step("RESTORED: the list container is back and the map canvas is gone", {always: true}, async () => {
    await assertFromJavascript(page, `const list = document.querySelector('[data-virtuoso-scroller], [data-testid*="virtuoso"]');
const canvas = document.querySelector('canvas.mapboxgl-canvas');
return !!list && !canvas;`, 60000);
  });
  run.finish();
}
