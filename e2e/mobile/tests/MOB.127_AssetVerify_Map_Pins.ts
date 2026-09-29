// MOB.127_AssetVerify_Map_Pins — written for Playwright (not converted from Datadog).
//
// An Asset Verification job's map view (the globe toggle, MOB.585) draws one pin per job asset that has coordinates,
// the app's own marker (`Map/MapGL/PinSvg.tsx`, an SVG clipped by `#3227c3e926`), filled `green` when the asset is
// verified and `blue` when not (`AssetVerification/JobAssetMap.tsx:27-35`). They are page elements, not canvas, so
// their colour can be read. At rest `DATADOG MOBILE JOB` has nothing verified; the job's answers are passed through
// with `⚡ Tank 0000` marked verified (the real answers, one flag changed — nothing is written), so both colours show.
import { expect, Page } from '@playwright/test';
import { appUrl, serverRead } from '../support/session';
import { waitForPrefetch } from '../support/prefetch';
import { AV_JOB } from '../support/fixtures';

const JOB = AV_JOB;
const VERIFIED = '⚡ Tank 0000';

export async function mob127(page: Page): Promise<{ fills: string[] }> {
  const job = (await serverRead(page, 'query($id: ID!) { mobileJob(id: $id) { assets { verified asset: assetId { name latitude longitude } } } }', { id: JOB })).mobileJob;
  const located = job.assets.filter((a: { asset: { latitude: number | null; longitude: number | null } }) => a.asset.latitude && a.asset.longitude);
  expect(located.length, "PREMISE: the fixture job's assets have coordinates").toBeGreaterThan(0);
  expect(job.assets.some((a: { verified: boolean }) => a.verified), 'PREMISE: nothing verified at rest').toBe(false);
  const expected = located.map((a: { asset: { name: string } }) => (a.asset.name === VERIFIED ? 'green' : 'blue')).sort();

  let flipped = 0;
  const flip = (v: unknown): void => {
    if (Array.isArray(v)) { v.forEach(flip); return; }
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    const asset = o.asset as { name?: string } | undefined;
    if (o.__typename === 'MobileJobAsset' && asset?.name === VERIFIED && 'verified' in o) { o.verified = true; flipped++; }
    Object.values(o).forEach(flip);
  };
  await page.route('**/graphql', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    try {
      const real = await route.fetch();
      let json: unknown;
      try { json = await real.json(); } catch { return await route.fulfill({ response: real }); }
      flip(json);
      await route.fulfill({ response: real, json });
    } catch { /* the page closed mid-request */ }
  });

  try {
    await page.goto(appUrl('asset-verify'), { waitUntil: 'load' });
    await expect(page.locator('input[placeholder="Find Mobile Job(s)"]')).toBeVisible({ timeout: 60_000 });
    await waitForPrefetch(page);
    await page.locator('.mantine-Paper-root').filter({ hasText: 'DATADOG MOBILE JOB' }).first().click();
    await expect(page.locator('.mantine-Accordion-item').first(), "the job's assets rendered").toBeVisible({ timeout: 60_000 });
    expect(flipped, `the answers marked ${VERIFIED} verified`).toBeGreaterThan(0);
    await page.locator('button').filter({ has: page.locator('svg[data-icon="globe"], svg[data-icon="earth-americas"]') }).first().click();
    await expect(page.locator('canvas.mapboxgl-canvas'), 'the job map rendered').toBeVisible({ timeout: 60_000 });

    const pins = page.locator('.mapboxgl-marker svg:has(clipPath#\\33 227c3e926)');
    await expect(pins, 'one app pin per located job asset').toHaveCount(located.length, { timeout: 30_000 });
    const fills = (await pins.evaluateAll((svgs) => svgs.map((s) => s.querySelector('g[clip-path] path[fill]')?.getAttribute('fill') ?? ''))).sort();
    expect(fills, 'green for the verified asset, blue for the rest').toEqual(expected);
    await page.screenshot({ path: 'results/MOB.127-pins.png' });
    return { fills };
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.127-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    // the map toggle is a session setting (`show-mobile-asset-ver-map`); this browser is thrown away anyway
  }
}
