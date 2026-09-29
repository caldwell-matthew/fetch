// MOB.172_DevLogs_Empty_And_Error — written for Playwright (not converted from Datadog).
//
// The Dev Logs screen (`DevLogs/index.tsx`) lists the DEV entries of the app's local log store (localforage
// `mentor_mobile_logs`, in this browser only). MOB.171 reads it as it finds it and never clicks `Clear Logs`; this test
// runs in its OWN browser, so clearing wipes nothing anyone else reads:
//   1  `Clear Logs` → the empty state `No logs found.` (`:112`)
//   2  an ERROR entry, made the app's own way: `Email me the JSON` posts to `/api/attachment/email` and, when that fails,
//      logs `Email Route error` / `Error sending logs to your email` through `logger.error` (`:37-51`). The POST is
//      aborted in the browser — nothing is sent — and after `Refresh` the entry shows `ERROR` in red and its `Error:`
//      block (`:127-131`). The block is RETURNED: it reads `Unknown error` / `{}` — `logger.error` overwrites the error it
//      caught (`utils/Logger.ts:199-214`, bugs §58), and the suite pins that.
// Local only: nothing reaches the server.
import { Browser, expect, Page } from '@playwright/test';
import { appUrl, freshSession } from '../support/session';

export async function mob172(browser: Browser): Promise<{ errorBlock: string }> {
  const page = await freshSession(browser);
  try {
    return await run(page);
  } finally {
    await page.context().close();
  }
}

async function run(page: Page): Promise<{ errorBlock: string }> {
  let posted = 0;
  await page.route('**/api/attachment/email', (route) => { posted++; return route.abort('failed'); });
  try {
    await page.goto(appUrl('logz'), { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Developer Logs' }), 'the Dev Logs screen').toBeVisible({ timeout: 60_000 });

    // 1 · empty
    await page.getByRole('button', { name: 'Clear Logs' }).click();
    await expect(page.getByText('No logs found.', { exact: true }), 'the empty state').toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Refresh' }).click();
    await expect(page.getByText('No logs found.', { exact: true }), 'still empty after Refresh — the store was cleared').toBeVisible({ timeout: 15_000 });

    // 2 · an error entry, from the failed email
    await page.getByRole('button', { name: 'Email me the JSON' }).click();
    await expect.poll(() => posted, { message: 'the email POST was made (and aborted here)', timeout: 15_000 }).toBe(1);
    const entry = page.locator('.mantine-Paper-root').filter({ hasText: 'Email Route error' });
    await expect(async () => {
      await page.getByRole('button', { name: 'Refresh' }).click();
      await expect(entry).toHaveCount(1, { timeout: 2_000 });
    }, 'after Refresh the error entry is listed').toPass({ timeout: 30_000 });
    await expect(page.getByText('No logs found.', { exact: true }), 'the empty state is gone').toHaveCount(0);
    await expect(entry.getByText('ERROR', { exact: true }), 'its status, ERROR').toBeVisible();
    await expect(entry.getByText('Error sending logs to your email'), 'its message').toBeVisible();
    await expect(entry.getByText('Error:', { exact: true }), 'and its `Error:` block').toBeVisible();
    const errorBlock = (await entry.locator('pre, code').first().innerText()).trim();
    expect(errorBlock.length, 'the block shows the logged error').toBeGreaterThan(0);
    await page.screenshot({ path: 'results/MOB.172-error.png' });
    return { errorBlock };
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.172-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  }
}
