// MOB.441_Logout_Take_Me_Back — written for Playwright (not converted from Datadog).
//
// The menu's `Log Out` asks first (`Layout/TopHeader/LogoutModal.tsx`, opened from `TopHeader/index.tsx:138-152`):
// `Are you sure you want to log out?` and `Any unsaved data will be lost.`, then `Take Me Back` (closes it) or
// `Log Out` (clears the local store and the queues, sends `LOG_OUT`, goes to `/login`). This takes the way back and
// proves the session is untouched. MOB.440 does the real logout, outside every suite (it kills the session).
// Reads only. A route stops any `LOG_OUT` before it leaves the browser, so even a wrong click could not end the
// shared session; the test ends by proving none was attempted.
import { expect, Page, Route } from '@playwright/test';
import { appUrl, serverRead } from '../support/session';

export async function mob441(page: Page): Promise<void> {
  const me = (await serverRead(page, '{ session { me { id } } }')).session.me.id;
  let logouts = 0;
  const guard = async (route: Route) => {
    let query = '';
    try { query = route.request().postDataJSON()?.query ?? ''; } catch { /* not JSON */ }
    if (!/\bLOG_OUT\b|\blogOut\s*[({]/.test(query)) return route.fallback();
    logouts++;
    return route.abort('failed');
  };
  await page.route('**/graphql', guard);
  try {
    await page.goto(appUrl(), { waitUntil: 'load' });
    await page.locator('button[aria-label="Toggle navigation"]').click();
    await page.locator('.mantine-Menu-item', { hasText: 'Log Out' }).click();
    const modal = page.locator('.mantine-Modal-content').filter({ hasText: 'Are you sure you want to log out?' });
    await expect(modal, 'Log Out asks first').toBeVisible({ timeout: 15_000 });
    // Playwright calls a fading-in element visible; wait for the fade to end, so what follows (and the screenshot) sees it.
    await expect(modal, 'fully shown').toHaveCSS('opacity', '1', { timeout: 5_000 });
    await expect(modal, '...and warns').toContainText('Any unsaved data will be lost.');
    await expect(modal.getByRole('button', { name: 'Log Out' }), 'with a Log Out button').toBeVisible();
    await page.screenshot({ path: 'results/MOB.441-confirm.png' });

    await modal.getByRole('button', { name: 'Take Me Back' }).click();
    await expect(modal, 'Take Me Back closes it').toHaveCount(0, { timeout: 15_000 });
    await expect(page, 'still in the app, not sent to /login').toHaveURL(/\/apm-mobile\//);
    await expect(page.locator('button[aria-label="Toggle navigation"]'), 'the app is still drawn').toBeVisible();
    expect((await serverRead(page, '{ session { me { id } } }')).session.me.id, 'the session is still the same user').toBe(me);
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.441-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.unroute('**/graphql', guard);
  }
  expect(logouts, 'no LOG_OUT was sent').toBe(0);
}
