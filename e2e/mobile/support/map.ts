/**
 * Opening an asset's card on the map, the way a user does: Asset Lookup → search → expand → "View in Map".
 *
 * The map then opens the asset's card by itself (`Map/index.tsx:139-186`), but only for an icon it has DRAWN, and only
 * on a source event (trap 42) — so when it misses, a tap just below the purple marker's tip opens it. The page must
 * have touch (`freshSession(browser, { touch: true })`): the map selects on `touchend` alone.
 */
import { expect, Locator, Page } from '@playwright/test';
import { appUrl } from './session';

/** Returns the card's options gear (`aria-label="map-options"`), visible. */
export async function openAssetCard(page: Page, asset: string): Promise<Locator> {
  await page.goto(appUrl('asset-lookup'), { waitUntil: 'load' });
  const search = page.locator('input[name="asset-search"]');
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.fill(asset);
  await search.press('Enter');
  const result = page.locator('.mantine-Accordion-item').filter({ hasText: asset }).first();
  await expect(result, `a result row for ${asset}`).toBeVisible({ timeout: 60_000 });
  await result.locator('.mantine-Accordion-control').click();
  await result.getByRole('button', { name: 'View in Map' }).click();

  await expect(page, 'on the map').toHaveURL(/\/map/, { timeout: 30_000 });
  const gear = page.locator('[aria-label="map-options"]');
  try {
    await expect(gear).toBeVisible({ timeout: 20_000 });
  } catch {
    const pin = (await page.locator('.mapboxgl-marker').first().boundingBox())!;
    await page.touchscreen.tap(pin.x + pin.width / 2, pin.y + pin.height + 8);
  }
  await expect(gear, 'the asset card opened, with its options menu').toBeVisible({ timeout: 30_000 });
  return gear;
}
