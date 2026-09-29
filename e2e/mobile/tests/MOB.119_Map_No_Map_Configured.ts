// MOB.119_Map_No_Map_Configured — written for Playwright (not converted from Datadog).
//
// With no map id the map route renders only "Your organization has not configured their map settings." (`Map/index.tsx:
// 403-407`). The id is the session-stored `mobile-map-id`, defaulting to the user's `defaultMap` (`:61-64`); every org on
// dev has a map, so the branch is reached in the browser: an EMPTY stored id — what an org without a default map
// yields — in a throwaway browser. Then the key is removed and the map renders again, so the message came from the
// empty id and not from a broken map. Local only: nothing is written to the server.
import { Browser, expect } from '@playwright/test';
import { appUrl, freshSession } from '../support/session';

export async function mob119(browser: Browser): Promise<void> {
  const page = await freshSession(browser);
  try {
    await page.goto(appUrl(''), { waitUntil: 'load' });
    await page.evaluate(() => sessionStorage.setItem('mobile-map-id', JSON.stringify('')));
    await page.goto(appUrl('map'), { waitUntil: 'load' });
    await expect(page.getByText('Your organization has not configured their map settings.'), 'the no-map message').toBeVisible({ timeout: 60_000 });
    await expect(page.locator('canvas.mapboxgl-canvas'), 'and no map').toHaveCount(0);
    await page.screenshot({ path: 'results/MOB.119-no-map.png' });

    await page.evaluate(() => sessionStorage.removeItem('mobile-map-id'));
    await page.goto(appUrl('map'), { waitUntil: 'load' });
    await expect(page.locator('canvas.mapboxgl-canvas'), 'with the key gone, the map renders').toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Your organization has not configured their map settings.')).toHaveCount(0);
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.119-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.context().close();
  }
}
