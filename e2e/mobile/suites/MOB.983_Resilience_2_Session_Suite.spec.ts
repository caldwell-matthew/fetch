// MOB.983_Resilience_2_Session_Suite — written for Playwright (not converted from Datadog).
//
// The session ending: the expiry prompt (the browser's clock, jumped to 4 minutes before `expiresAt`), and the
// server saying the session is gone (answered in the browser). Each test gets a fresh browser; neither changes
// data. MOB.925 re-authenticates for real, which extends the test account's session — harmless, and the next
// login makes a new one anyway.
import { test } from '@playwright/test';
import { freshSession } from '../support/session';
import { mob925 } from '../tests/MOB.925_Session_Expiry_Prompt';
import { mob926 } from '../tests/MOB.926_Session_Expired_By_Server';

test.describe.serial('MOB.983_Resilience_2_Session_Suite', () => {
  // Bugs §49 pin: the extension works on the server but the prompt says "The operation was aborted.". That
  // symptom — and only that — is EXPECTED; when §49 is fixed nothing is thrown and the test is green.
  test('MOB.925_Session_Expiry_Prompt', async ({ browser }) => {
    const page = await freshSession(browser, { clock: true });
    try {
      const { abortedShown } = await mob925(page);
      if (abortedShown) {
        test.fail(true, 'bugs §49: a successful extension is reported as "The operation was aborted."');
        throw new Error('bugs §49: "The operation was aborted." shown for a session the server extended');
      }
    } finally {
      await page.context().close();
    }
  });

  test('MOB.926_Session_Expired_By_Server', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      await mob926(page);
    } finally {
      await page.context().close();
    }
  });
});
