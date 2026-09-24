// MOB.925_Session_Expiry_Prompt — written for Playwright (not converted from Datadog).
//
// `Layout/SessionReauthentication.tsx` starts a timer from the session's `expiresAt` and, 5 minutes before it
// (`REAUTHENTICATION_WINDOW_MS`), opens "Your session is about to expire" with a Password field and "Extend
// session". Sessions last about 15 hours on dev, so no test could wait for it; Datadog also had no clock control.
// Here the page's clock is installed before the app loads, and jumped to 4 minutes before expiry.
//
// Only the BROWSER's clock moves: the server's session is still valid, so "Extend session" is a real
// re-authentication, and the server read afterwards proves the session was extended. The UI then says
// "The operation was aborted." (bugs §49); the suite expects that symptom and no other.
import { expect, Page } from '@playwright/test';
import { globals } from '../../support/env';
import { serverRead } from '../support/session';

const SESSION = '{ session { expiresAt } }';

/** Returns whether the UI said "The operation was aborted." for an extension the server made — bugs §49. */
export async function mob925(page: Page): Promise<{ abortedShown: boolean }> {
  const before = new Date((await serverRead(page, SESSION)).session.expiresAt).getTime();
  const untilPrompt = before - Date.now() - 4 * 60_000;
  expect(untilPrompt, 'the session has more than 4 minutes left, so the prompt is not already due').toBeGreaterThan(0);

  const prompt = page.getByRole('dialog').filter({ hasText: 'Your session is about to expire' });
  await expect(prompt, 'no prompt while the session is young').toHaveCount(0);

  await page.clock.fastForward(untilPrompt);
  await expect(prompt, 'the prompt opens inside the 5-minute window').toBeVisible({ timeout: 30_000 });
  await expect(prompt.getByLabel('Password'), 'it asks for the password').toBeVisible();

  // Put the browser's clock back to real time before extending. Otherwise the NEW session (15h from the real now)
  // would look about to expire again to a browser 15h ahead, and the prompt would reopen for that reason alone.
  await page.clock.setSystemTime(new Date());

  await prompt.getByLabel('Password').fill(globals.DATA_DOG_PASSWORD);
  await prompt.getByRole('button', { name: 'Extend session' }).click();

  // Wait for the outcome: the prompt closes (success) or it shows an error.
  const aborted = prompt.getByText('The operation was aborted.');
  await expect(async () => {
    const closed = (await prompt.count()) === 0;
    const errored = (await aborted.count()) > 0;
    expect(closed || errored, 'the prompt either closes or shows an error').toBe(true);
  }).toPass({ timeout: 30_000 });

  const after = new Date((await serverRead(page, SESSION)).session.expiresAt).getTime();
  expect(after, 'the SERVER extended the session').toBeGreaterThan(before);

  const abortedShown = (await aborted.count()) > 0;
  if (!abortedShown) await expect(prompt, 'with no error, the prompt is gone').toHaveCount(0);
  return { abortedShown };
}
