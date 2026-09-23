// Generated from Mobile/dd_tests_mobile/MOB.955_WorkOrders_4_Detail_Assets_Records_Read_Suite.json by to_playwright.py — do not edit by hand yet.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../playwright.config';
import { login } from '../support/login';
import { mob347 } from '../tests/MOB.347_Work_Asset_Status';
import { mob389 } from '../tests/MOB.389_Work_Lookup_Case_Insensitive';
import { mob387 } from '../tests/MOB.387_Work_Condition_Edit_Prefill';
import { mob741 } from '../tests/MOB.741_Work_Attachments_Docs';
import { mob731 } from '../tests/MOB.731_AssetLookup_Proximity_Radius';
import { mob358 } from '../tests/MOB.358_Work_Asset_Geolocate';

test.describe.serial('MOB.955_WorkOrders_4_Detail_Assets_Records_Read_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.347_Work_Asset_Status', async () => {
    await mob347(page);
  });

  test('MOB.389_Work_Lookup_Case_Insensitive', async () => {
    await mob389(page);
  });

  test('MOB.387_Work_Condition_Edit_Prefill', async () => {
    await mob387(page);
  });

  test('MOB.741_Work_Attachments_Docs', async () => {
    await mob741(page);
  });

  test('MOB.731_AssetLookup_Proximity_Radius', async () => {
    await mob731(page);
  });

  test('MOB.358_Work_Asset_Geolocate', async () => {
    await mob358(page);
  });

});
