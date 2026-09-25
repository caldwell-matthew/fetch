// MOB.931_Map_Card_Asset_Not_Found — written for Playwright (not converted from Datadog).
//
// An asset's map card loads the asset with `GET_MOBILE_ASSET` (`Map/Card/AssetCard.tsx:16-19`). When the server has no
// such asset — deleted since the map's tiles were drawn — the card says "Asset not found." (`:33`) instead of the
// details. No asset on dev can be deleted for this, so the answer is changed in the BROWSER: the real read goes to the
// server, and the test replaces its `asset` with `null` — only on the map, so Asset Lookup on the way there is
// untouched. The route must be hit, so the test cannot pass on a card that never asked. Reads only.
import { expect, Page } from '@playwright/test';
import { openAssetCard } from '../support/map';

const ASSET = 'Tank 0040'; // an asset whose card opens by itself (MOB.929's top)

export async function mob931(page: Page): Promise<void> {
  let emptied = 0;
  await page.route('**/graphql', async (route) => {
    let body: { operationName?: string } | null = null;
    try { body = route.request().postDataJSON(); } catch { /* not JSON */ }
    if (body?.operationName !== 'GET_MOBILE_ASSET' || !page.url().includes('/map')) return route.fallback();
    const real = await route.fetch();
    const json = await real.json();
    if (json?.data) json.data.asset = null;
    emptied++;
    return route.fulfill({ response: real, json });
  });

  const gear = await openAssetCard(page, ASSET);
  await expect(page.getByRole('heading', { name: 'Asset not found.' }), 'the card says the asset is gone')
    .toBeVisible({ timeout: 30_000 });
  expect(emptied, "the card's asset read was answered with no asset").toBeGreaterThan(0);
  await expect(gear, 'the card is still there, not the error screen').toBeVisible();
  await expect(page.getByText('Something went wrong.'), 'no crash').toHaveCount(0);
}
