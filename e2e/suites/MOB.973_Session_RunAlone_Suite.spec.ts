// Generated from legacy/Mobile/dd_tests_mobile/MOB.973_Session_RunAlone_Suite.json by to_playwright.py — do not edit by hand yet.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../playwright.config';
import { login } from '../support/login';
import { mob210 } from '../tests/MOB.210_Perms_Menu_Gating';
import { mob220 } from '../tests/MOB.220_Crew_Scoping';

test.describe.serial('MOB.973_Session_RunAlone_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.210_Perms_Menu_Gating', async () => {
    await mob210(page);
  });

  test('MOB.220_Crew_Scoping', async () => {
    await mob220(page);
  });

});
