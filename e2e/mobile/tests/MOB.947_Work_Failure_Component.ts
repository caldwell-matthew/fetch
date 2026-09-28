// MOB.947_Work_Failure_Component — written for Playwright (not converted from Datadog).
//
// A work order's Failure tab groups failures by asset, then by component, and heads each component's group with
// `Component: <name>` (`WorkOrders/components/Failures/index.tsx:21-37,64-69`) — only when the failure HAS a component
// (`componentTypeId`). The fixture's one failure (`MISSED`) has none, so the answers are passed through with a
// component set on each failure — `DD947 Component`, a name no real record has. The real answers otherwise; nothing is
// written. The card with no component (the fixture as it is) is MOB.387's.
import { expect, Page } from '@playwright/test';
import { appUrl, FIXTURE_WO } from '../support/session';

const COMPONENT = 'DD947 Component';

export async function mob947(page: Page): Promise<void> {
  let given = 0;
  const give = (v: unknown): void => {
    if (Array.isArray(v)) { v.forEach(give); return; }
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    if (o.__typename === 'WorkStageFailure' && 'componentTypeId' in o) {
      o.componentTypeId = { __typename: 'ComponentType', id: 'DD947COMPONENT', name: COMPONENT };
      given++;
    }
    Object.values(o).forEach(give);
  };
  await page.route('**/graphql', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    try {
      const real = await route.fetch();
      let json: unknown;
      try { json = await real.json(); } catch { return await route.fulfill({ response: real }); }
      give(json);
      await route.fulfill({ response: real, json });
    } catch { /* the page closed mid-request — nothing left to answer */ }
  });

  try {
    await page.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
    await expect(page.getByText('Status:').first()).toBeVisible({ timeout: 60_000 });
    await page.getByRole('tab', { name: /Failure/ }).first().click();
    const panel = page.getByRole('tabpanel');
    await expect(panel.getByText('Pump 0102').first(), "the fixture failure's asset card").toBeVisible({ timeout: 30_000 });
    expect(given, 'the answers carried the failure, and it was given a component').toBeGreaterThan(0);
    const heading = panel.locator('p', { hasText: /^Component:/ });
    await expect(heading, 'the group is headed with its component').toHaveCount(1, { timeout: 15_000 });
    await expect(heading).toHaveText(`Component: ${COMPONENT}`);
    await page.screenshot({ path: 'results/MOB.947-failure-tab.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.947-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  }
}
