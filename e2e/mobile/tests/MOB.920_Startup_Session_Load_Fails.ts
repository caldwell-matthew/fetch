// MOB.920_Startup_Session_Load_Fails — written for Playwright (not converted from Datadog).
//
// `Layout/Auth.tsx:129` loads the session when the app starts; if that request fails it shows a startup-error
// banner, `role="alert"`, "Session could not be loaded." with a "Reload page" link (`:181`). Datadog could not
// make the request fail. Here the browser answers `GET_SESSION` with an error, so dev never sees it.
//
// The banner has six other messages, but each fires when BROWSER STORAGE fails (log cleanup, the mutation queue,
// the cache reset, the build-number check) — breaking IndexedDB breaks the whole app, so those are not faked.
import { expect, Page } from '@playwright/test';
import { failOperation } from '../../support/network';
import { appUrl } from '../support/session';

export async function mob920(page: Page): Promise<void> {
  const failing = await failOperation(page, { operation: 'GET_SESSION' },
    { kind: 'graphql', message: 'DD SYNTHETIC 920: session load refused by the test' });
  try {
    await page.goto(appUrl(), { waitUntil: 'load' });
    const banner = page.getByRole('alert').filter({ hasText: 'Session could not be loaded.' });
    await expect(banner, 'the startup-error banner names the failure').toBeVisible({ timeout: 30_000 });
    await expect(banner.getByRole('link', { name: 'Reload page' }), 'and offers a way out').toBeVisible();
    expect(failing.hits, 'the session request really was failed (not a vacuous pass)').toBeGreaterThan(0);
  } finally {
    await failing.stop();
  }

  // The way out works: with the server answering again, "Reload page" brings the app back.
  await page.getByRole('link', { name: 'Reload page' }).click();
  await expect(page.locator('xpath=//button[@aria-label="Toggle navigation"]'), 'the app shell after the reload')
    .toBeVisible({ timeout: 120_000 });
  await expect(page.getByText('Session could not be loaded.'), 'and the banner is gone').toHaveCount(0);
}
