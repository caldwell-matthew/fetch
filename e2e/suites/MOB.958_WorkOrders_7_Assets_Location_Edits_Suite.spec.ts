// Generated from Mobile/dd_tests_mobile/MOB.958_WorkOrders_7_Assets_Location_Edits_Suite.json by to_playwright.py — do not edit by hand yet.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../playwright.config';
import { login } from '../support/login';
import { mob352 } from '../tests/MOB.352_Work_Location_Save';
import { mob353 } from '../tests/MOB.353_Work_Asset_Status_Write';
import { mob354 } from '../tests/MOB.354_Work_Asset_Add_Remove';
import { mob359 } from '../tests/MOB.359_Work_Asset_Geolocate_Submit';

test.describe.serial('MOB.958_WorkOrders_7_Assets_Location_Edits_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.352_Work_Location_Save', async () => {
    await mob352(page);
  });

  test('MOB.353_Work_Asset_Status_Write', async () => {
    await mob353(page);
  });

  test('MOB.354_Work_Asset_Add_Remove', async () => {
    await mob354(page);
  });

  test('MOB.359_Work_Asset_Geolocate_Submit', async () => {
    await mob359(page);
  });

});
