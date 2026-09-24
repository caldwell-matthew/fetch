// MOB.926_Session_Expired_By_Server — written for Playwright (not converted from Datadog).
//
// When the server says the session is gone — a GraphQL error `Invalid or expired session` (or code
// `UNAUTHENTICATED`) — the app's error link (`graphql/links/ErrorLink.ts`) sends the user back to the mobile
// login. Datadog could not make the server say that without really expiring the session. Here the browser answers
// the session query with that error, so the real session is untouched.
import { expect, Page } from '@playwright/test';
import { failOperation } from '../../support/network';
import { appUrl } from '../support/session';

export async function mob926(page: Page): Promise<void> {
  const expired = await failOperation(page, { operation: 'GET_SESSION' },
    { kind: 'graphql', message: 'Invalid or expired session', code: 'UNAUTHENTICATED' });
  try {
    await page.goto(appUrl(), { waitUntil: 'load' });
    await expect(page, 'the user is sent to the login').toHaveURL(/\/login/, { timeout: 30_000 });
    await expect(page.locator('xpath=//input[@name="email"]'), 'and the login form is there').toBeVisible({ timeout: 30_000 });
    expect(expired.hits, 'the server really "said" the session had expired').toBeGreaterThan(0);
  } finally {
    await expired.stop();
  }
}
