// MOB.941_Mobile_Only_Browser — written for Playwright (not converted from Datadog).
//
// A user an admin marks `mobileOnly` may use the native app, not the mobile client in a browser. The client reads the
// flag from its session (`me.mobileOnly`, read from the user on every session query — an admin's change applies
// without a new login), and in a browser (`!nativeShell`) it renders nothing, sends `LOG_OUT`, and goes to
// `/login?src=mobile&mobileOnly=true` (`Layout/Auth.tsx:30-37,168-177,201`). The login page shows the notice
// `This user is only allowed to log into the MentorAPM using the MentorAPM Mobile Application.` with `Continue`,
// which drops the parameters and shows the login form (`login/components/LoginForm.tsx:28-30,96-113`).
//
// No test user is mobile-only (the server-side refusal at login needs one — 🟡 in the checklist), so the browser
// answers the session with `mobileOnly: true` — the real answer, one field changed. `LOG_OUT` is answered in the
// browser too: sent, it would end the test account's session (the session model, testing_checklist.md). The test ends
// by asking the server that the session is still alive. Reads only.
import { expect, Page } from '@playwright/test';
import { appUrl, serverReadDirect } from '../support/session';

const NOTICE = 'This user is only allowed to log into the MentorAPM using the MentorAPM Mobile Application.';

export async function mob941(page: Page): Promise<void> {
  let sessionsFlagged = 0, logouts = 0, shellSeen = false;
  // Did the app shell ever render? Its menu button, watched from the first script on (the page is replaced on redirect).
  await page.exposeBinding('__ddShellSeen', () => { shellSeen = true; });
  await page.addInitScript(() => {
    const seen = () => document.querySelector('button[aria-label="Toggle navigation"]')
      && (window as unknown as { __ddShellSeen: () => void }).__ddShellSeen();
    new MutationObserver(seen).observe(document, { childList: true, subtree: true });
  });
  await page.route('**/graphql', async (route) => {
    let body: { operationName?: string; query?: string } | null = null;
    try { body = route.request().postDataJSON(); } catch { /* not JSON */ }
    if (/\blogout\b/.test(body?.query ?? '') && /^\s*mutation\b/.test(body?.query ?? '')) {
      logouts++;
      return route.fulfill({ json: { data: { logout: true } } });
    }
    if (body?.operationName !== 'GET_SESSION') return route.fallback();
    const real = await route.fetch();
    const json = await real.json();
    if (json?.data?.session?.me) { json.data.session.me.mobileOnly = true; sessionsFlagged++; }
    return route.fulfill({ response: real, json });
  });

  try {
    await page.goto(appUrl(''), { waitUntil: 'load' });
    await expect(page, 'sent to the mobile login with the mobile-only flag')
      .toHaveURL(/\/login\?src=mobile&mobileOnly=true$/, { timeout: 60_000 });
    expect(sessionsFlagged, 'the session really was answered as mobile-only').toBeGreaterThan(0);
    expect(logouts, 'the app logged out (answered in the browser — never reached dev)').toBeGreaterThan(0);
    expect(shellSeen, 'the app never rendered for a mobile-only user').toBe(false);

    const notice = page.getByRole('alert').filter({ hasText: NOTICE });
    await expect(notice, 'the login page explains why').toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: 'results/MOB.941-notice.png' });
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(notice, 'Continue dismisses it').toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator('[name="email"]'), 'and shows the login form').toBeVisible({ timeout: 15_000 });
    await expect(page, 'without the mobile-only flag or the mobile hint').toHaveURL(/\/login$/);
    await page.screenshot({ path: 'results/MOB.941-after-continue.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.941-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.unroute('**/graphql');
  }
  const live = (await serverReadDirect(page, '{ session { authenticated } }')).session;
  expect(live?.authenticated, "the test account's session is still alive (no real logout was sent)").toBe(true);
}
