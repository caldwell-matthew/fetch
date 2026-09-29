// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.121_Map_Controls.json. This file is the source now: edit it directly.
// MOB.121_Map_Controls

import { expect, Page } from '@playwright/test';
import { mapView } from '../support/map';
import { DEFAULT_TIMEOUT, Sequence, assertElementContent, assertElementPresent, click, press, wait } from '../../support/dd';
import { appUrl } from '../support/session';

export async function mob121(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the mobile map", {}, async () => {
    await page.goto(`${appUrl()}map`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Test the \"Map\" page rendered", {}, async () => {
    await assertElementContent(page, `//*[@id="page-title"]//h4[contains(normalize-space(.), "Map")]`, `Map`, 30000);
  });
  await run.step("PROOF: the Mapbox WebGL canvas rendered", {}, async () => {
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 60000);
  });
  await run.step("The style control offers \"Satellite\"", {}, async () => {
    await assertElementPresent(page, `//button[@data-tooltip-content="Satellite"]`, 30000);
  });
  await run.step("Switch the basemap to Satellite", {}, async () => {
    await click(page, `//button[@data-tooltip-content="Satellite"]`, 30000);
  });
  await run.step("PROOF: the style changed \u2014 the control now offers \"Street\"", {}, async () => {
    await assertElementPresent(page, `//button[@data-tooltip-content="Street"]`, 30000);
  });
  await run.step("Switch back to Street", {always: true}, async () => {
    await click(page, `//button[@data-tooltip-content="Street"]`, 30000);
  });
  await run.step("Let the style load", {always: true}, async () => {
    await wait(page, 6);
  });
  await run.step("RESTORED: the control offers \"Satellite\" again", {always: true}, async () => {
    await assertElementPresent(page, `//button[@data-tooltip-content="Satellite"]`, 30000);
  });
  await run.step("The layers control is headed `Layers` (`Map/Layers/layersList.tsx:116`)", {}, async () => {
    await assertElementContent(page, `//div[contains(concat(" ", normalize-space(@class), " "), " layers-title ")]//h4`, `Layers`, 30000);
  });
  await run.step("Open the Layers panel", {}, async () => {
    await click(page, `//div[contains(concat(" ", normalize-space(@class), " "), " layers-title ")]`, 30000);
  });
  await run.step("PROOF: the Layers modal opened", {}, async () => {
    await assertElementPresent(page, `//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]`, 30000);
  });
  await run.step("Close the layers modal", {always: true}, async () => {
    await press(page, `Escape`);
  });
  await run.step("Wait for it to close", {always: true}, async () => {
    await wait(page, 2);
  });
  await run.step("The zoom controls render", {}, async () => {
    await assertElementPresent(page, `//button[contains(@class,"mapboxgl-ctrl-zoom-in")]`, 30000);
  });
  // Mapbox publishes no zoom to the DOM; the page's Mapbox instance does (`support/map.ts`, trap 55).
  let start = 0;
  await run.step("Read the zoom level", {}, async () => {
    start = (await mapView(page)).zoom;
  });
  await run.step("Zoom in", {}, async () => {
    await click(page, `//button[contains(@class,"mapboxgl-ctrl-zoom-in")]`, 30000);
  });
  await run.step("\u2b50 The map zoomed IN one level", {}, async () => {
    await expect.poll(async () => (await mapView(page)).zoom, { message: 'zoom after +', timeout: 10_000 }).toBeCloseTo(start + 1, 1);
  });
  await run.step("Zoom out", {}, async () => {
    await click(page, `//button[contains(@class,"mapboxgl-ctrl-zoom-out")]`, 30000);
  });
  await run.step("\u2b50 The map zoomed back OUT to where it began", {}, async () => {
    await expect.poll(async () => (await mapView(page)).zoom, { message: 'zoom after -', timeout: 10_000 }).toBeCloseTo(start, 1);
  });
  await run.step("The map survived zooming", {}, async () => {
    await assertElementPresent(page, `//canvas[contains(@class,"mapboxgl-canvas")]`, 30000);
  });
  run.finish();
}
