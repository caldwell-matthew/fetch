// MOB.366_Work_PM_Route_Assets — written for Playwright (not converted from Datadog).
//
// A PM ROUTE stage — one a PM trigger created from a workflow that cycles workflow assets (`workStage.pmRoute`) — gets the
// Assets tab's asset status controls with NO template flag: `showAssetStatus={mobileTemplate?.showAssetStatus || pmRoute}`
// (`WorkOrders/WorkDetails.tsx:157`). With them on, the tab lists the assets in SEQUENCE order — numbered ones first,
// the rest after them by name (`Assets/index.tsx:70-78`) — where without them it lists by name only.
//
// The stage is `20260929-18-001`, made by `tools/setup_pm_route.py` (owner, 2026-09-29): a `DD SYNTHETIC MOBILE PM ROUTE`
// workflow that cycles its stage's asset list — Pump 0144 (sequence 1), Pump 0066 (2), Pump 0101 (none) — whose one-off
// runtime trigger fired once and was deactivated. Its workflow stage's template has `showAssetStatus` OFF, so the controls
// here come from `pmRoute` alone. Sequence order (0144, 0066, 0101) differs from name order (0066, 0101, 0144), so the
// order shows which one the tab used. Reads only: the switch is looked at, not changed.
import { expect, Page } from '@playwright/test';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';
import { appUrl, serverRead } from '../support/session';
import { PM_ROUTE_STAGE } from '../support/fixtures';

const STAGE = 'query($id: ID!) { workStage(id: $id) { _workSequence status pmRoute mobileTemplate { showAssetStatus } assets { sequence assetId { name } } } }';
type Link = { sequence: number | null; assetId: { name: string } };

export async function mob366(page: Page): Promise<void> {
  const stage = (await serverRead(page, STAGE, { id: PM_ROUTE_STAGE })).workStage;
  expect(stage?.pmRoute, 'PREMISE: the stage is a PM route (tools/setup_pm_route.py)').toBe(true);
  expect(stage.status, 'PREMISE: Ready, so it is in the crew\'s list').toBe('Ready');
  expect(stage.mobileTemplate?.showAssetStatus ?? false, 'PREMISE: its template does NOT turn the status controls on').toBe(false);
  const links: Link[] = stage.assets;
  expect(links.length, 'PREMISE: the routed assets — the workflow stage\'s list').toBe(3);
  const byName = links.map((l) => l.assetId.name).sort((a, b) => a.localeCompare(b));
  const bySequence = [...links].sort((a, b) => a.assetId.name.localeCompare(b.assetId.name))
    .sort((a, b) => (a.sequence ?? Infinity) - (b.sequence ?? Infinity)).map((l) => l.assetId.name);
  expect(bySequence, 'PREMISE: sequence order differs from name order').not.toEqual(byName);

  try {
    await page.goto(appUrl('work'), { waitUntil: 'load' });
    await expect(page.locator('#page-title h4', { hasText: 'Work Orders' })).toBeVisible({ timeout: 60_000 });
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
    await page.goto(appUrl(`work/${PM_ROUTE_STAGE}`), { waitUntil: 'load' });
    await expect(page.getByRole('tab').first(), 'the work order opened').toBeVisible({ timeout: 60_000 });
    await page.getByRole('tab', { name: 'Assets', exact: true }).click();
    const panel = page.getByRole('tabpanel');
    const rows = panel.locator('.mantine-Accordion-item');
    await expect(rows, 'the three routed assets').toHaveCount(3, { timeout: 30_000 });

    // The status controls — the All / Active switch — with no template flag.
    const segmented = panel.locator('.mantine-SegmentedControl-root');
    await expect(segmented, 'the All / Active switch is there').toBeVisible();
    await expect(segmented).toContainText('All');
    await expect(segmented).toContainText('Active');
    // And the list in SEQUENCE order, not by name.
    for (let i = 0; i < bySequence.length; i++) {
      await expect(rows.nth(i), `row ${i + 1} is ${bySequence[i]}`).toContainText(bySequence[i]);
    }
    await page.screenshot({ path: 'results/MOB.366-assets.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.366-failure.png' }).catch(() => undefined);
    throw err;
  }
}
