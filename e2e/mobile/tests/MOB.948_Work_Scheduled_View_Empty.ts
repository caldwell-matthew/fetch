// MOB.948_Work_Scheduled_View_Empty — written for Playwright (not converted from Datadog).
//
// A crew whose role downloads work by schedule (`mobileDownloadMode: SCHEDULED`) sees the work list as the scheduled
// view (`WorkOrders/index.tsx:47-52`, its toggle on by default): groups `Past Due`, `Today`, `Tomorrow`, `Future`
// (`ScheduledWork/ScheduledWork.tsx:30-35`). `Past Due` and `Future` are dropped when empty; an empty `Today` keeps its
// header over a `No work found` row (`:129-151,188`). The test crew is `ASSIGNED` and must stay so (checklist 🟡,
// `MOB.346`), so the session is answered in the browser with the role in `SCHEDULED` mode, and the work list with no
// stages — the real answers otherwise. Reads only.
import { expect, Page } from '@playwright/test';
import { appUrl } from '../support/session';

export async function mob948(page: Page): Promise<void> {
  let sessions = 0, lists = 0;
  await page.route('**/graphql', async (route) => {
    let body: { operationName?: string; query?: string } | null = null;
    try { body = route.request().postDataJSON(); } catch { /* not JSON */ }
    const op = body?.operationName ?? '';
    const isList = /\bworkStages\s*\(/.test(body?.query ?? '') && /crew/.test(body?.query ?? '');
    if (op !== 'GET_SESSION' && !isList) return route.fallback();
    try {
      const real = await route.fetch();
      const json = await real.json();
      if (op === 'GET_SESSION' && json?.data?.session?.me?.role) { json.data.session.me.role.mobileDownloadMode = 'SCHEDULED'; sessions++; }
      if (isList && json?.data?.workStages) {
        json.data.workStages.edges = [];
        if (json.data.workStages.pageInfo) json.data.workStages.pageInfo.totalCount = 0;
        lists++;
      }
      await route.fulfill({ response: real, json });
    } catch { /* the page closed mid-request */ }
  });

  try {
    await page.goto(appUrl('work'), { waitUntil: 'load' });
    await expect(page.locator('#page-title h4', { hasText: 'Work Orders' })).toBeVisible({ timeout: 60_000 });
    expect(sessions, 'the session was answered with a SCHEDULED role').toBeGreaterThan(0);
    await expect.poll(() => lists, { message: 'the work list was answered empty', timeout: 30_000 }).toBeGreaterThan(0);
    await expect(page.getByText('Today', { exact: true }).first(), 'the scheduled view: its Today group').toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('No work found', { exact: true }).first(), 'an empty Today says so').toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Past Due', { exact: true }), 'an empty Past Due is dropped').toHaveCount(0);
    await expect(page.getByText('Future', { exact: true }), 'an empty Future is dropped').toHaveCount(0);
    await page.screenshot({ path: 'results/MOB.948-scheduled.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.948-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  }
}
