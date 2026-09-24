// MOB.984_Resilience_3_Offline_Suite — written for Playwright (not converted from Datadog).
//
// Really offline: the page's network is cut (`context.setOffline`), which Datadog could not do. Writes a job note
// to the main fixture work order and deletes it again with MOB.361's named flow, so it runs alone (data-changing).
import { test } from '@playwright/test';
import { freshSession } from '../support/session';
import { mob927 } from '../tests/MOB.927_Offline_Note_Syncs';

test.describe.serial('MOB.984_Resilience_3_Offline_Suite', () => {
  test('MOB.927_Offline_Note_Syncs', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      await mob927(page, browser);
    } finally {
      await page.context().close();
    }
  });
});
