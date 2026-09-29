// MOB.126_Map_Layers_After_Style_Switch — written for Playwright (not converted from Datadog).
//
// The `Layers` panel lists the map's layers in groups (`Map/Layers/layersList.tsx`): each group a `Select All`
// checkbox and its name (`groupItem.tsx:16-38`, `.layer-group-item`), each layer a checkbox labelled `name : desc`
// (`layerItem.tsx:17-90`), and a layer with filters shows them in a tooltip (`.custom-tooltip`). Switching the base
// style wipes every custom layer off the map; the app re-adds them once the new style has loaded, and the source says
// doing it too early "left the layers list with stale data" (`MapGL/index.tsx:324-332`). So: read the list, switch to
// Satellite, read it again — the same groups and layers — then switch back. Nothing is toggled or saved. Reads only.
import { expect, Page } from '@playwright/test';
import { appUrl } from '../support/session';

type Listing = { groups: string[]; layers: string[] };

async function readLayers(page: Page): Promise<Listing> {
  await page.locator('.layers-title').click();
  const panel = page.locator('.mantine-Modal-content').filter({ has: page.locator('.layer-group-item') });
  await expect(panel, 'the Layers panel opened with its groups').toBeVisible({ timeout: 30_000 });
  const groups = (await panel.locator('.layer-group-item').allInnerTexts()).map((t) => t.trim());
  const layers = (await panel.locator('.mantine-Checkbox-label').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
  await page.keyboard.press('Escape');
  await expect(panel, 'closed').toHaveCount(0, { timeout: 15_000 });
  return { groups, layers };
}

export async function mob126(page: Page): Promise<{ groups: number; layers: number }> {
  let switched = false;
  try {
    await page.goto(appUrl('map'), { waitUntil: 'load' });
    await expect(page.locator('canvas.mapboxgl-canvas'), 'the map rendered').toBeVisible({ timeout: 60_000 });
    await expect(page.locator('button[data-tooltip-content="Satellite"]'), 'the Street style, at rest').toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(3_000); // the GIS layers load after the canvas
    const before = await readLayers(page);
    expect(before.groups.length, 'PREMISE: the map lists layer groups').toBeGreaterThan(0);

    await page.locator('button[data-tooltip-content="Satellite"]').click();
    switched = true;
    await expect(page.locator('button[data-tooltip-content="Street"]'), 'switched to Satellite').toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(6_000); // the new style loads, then the layers are re-added (`map.once('style.load')`)
    const after = await readLayers(page);
    expect(after.groups, 'the same layer groups after the style switch').toEqual(before.groups);
    expect(after.layers, 'and the same layers').toEqual(before.layers);
    return { groups: before.groups.length, layers: before.layers.length };
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.126-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    if (switched) {
      await page.locator('button[data-tooltip-content="Street"]').click().catch(() => undefined);
      await expect(page.locator('button[data-tooltip-content="Satellite"]'), 'back to Street').toBeVisible({ timeout: 30_000 }).catch(() => undefined);
    }
  }
}
