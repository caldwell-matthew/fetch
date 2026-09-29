// MOB.544_AssetVerify_No_Attributes — written for Playwright (not converted from Datadog).
//
// A job asset's Attributes tab lists its attributes (`AssetVerification/AssetAttributes.tsx`, the shared
// `DetailPage/Attributes.tsx`), and an asset with none reads `No asset attributes found.` (`DetailPage/Attributes.tsx:84`).
// Both of `DATADOG MOBILE JOB`'s assets have attributes (MOB.545 edits one), so, as MOB.946 does for the standard and
// the profile, every answer is passed through with Tank 0000's `attributes` emptied: the real answers, one field
// changed, in this test's own browser. Reads only.
import { expect, Page } from '@playwright/test';
import { appUrl } from '../support/session';
import { waitForPrefetch } from '../support/prefetch';

const ASSET = 'Tank 0000';

export async function mob544(page: Page): Promise<void> {
  // The page reads its asset from the cache, which more than one query fills (MOB.946), so every answer is rewritten.
  let emptied = 0;
  const empty = (v: unknown): void => {
    if (Array.isArray(v)) { v.forEach(empty); return; }
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    if (o.__typename === 'Asset' && typeof o.name === 'string' && o.name.includes(ASSET) && Array.isArray(o.attributes)) {
      o.attributes = [];
      emptied++;
    }
    Object.values(o).forEach(empty);
  };
  await page.route('**/graphql', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    try {
      const real = await route.fetch();
      let json: unknown;
      try { json = await real.json(); } catch { return await route.fulfill({ response: real }); }
      empty(json);
      await route.fulfill({ response: real, json });
    } catch { /* the page closed mid-request — nothing left to answer */ }
  });

  try {
    await page.goto(appUrl('asset-verify'), { waitUntil: 'load' });
    await expect(page.locator('input[placeholder="Find Mobile Job(s)"]')).toBeVisible({ timeout: 60_000 });
    await waitForPrefetch(page);
    await page.locator('.mantine-Paper-root').filter({ hasText: 'DATADOG MOBILE JOB' }).first().click();
    await expect(page.locator('.mantine-Accordion-item').first(), "the job's assets rendered").toBeVisible({ timeout: 60_000 });
    await page.locator('span', { hasText: ASSET }).last().click();
    await expect(page.getByText('Asset Type:').first(), 'the full-page asset detail rendered').toBeVisible({ timeout: 30_000 });
    expect(emptied, `the answers carried ${ASSET}, and its attributes were emptied`).toBeGreaterThan(0);

    await page.getByRole('tab', { name: /Attributes/ }).first().click();
    await expect(page.getByText('No asset attributes found.', { exact: true }), 'the empty Attributes tab').toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Something went wrong.'), 'no crash').toHaveCount(0);
    await page.screenshot({ path: 'results/MOB.544-no-attributes.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.544-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  }
}
