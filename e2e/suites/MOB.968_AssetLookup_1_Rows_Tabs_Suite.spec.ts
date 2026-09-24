// Generated from legacy/Mobile/dd_tests_mobile/MOB.968_AssetLookup_1_Rows_Tabs_Suite.json by to_playwright.py — do not edit by hand yet.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../playwright.config';
import { login } from '../support/login';
import { mob100 } from '../tests/MOB.100_Nav_Asset_Lookup';
import { mob700 } from '../tests/MOB.700_AssetLookup_Search';
import { mob750 } from '../tests/MOB.750_AssetLookup_Tag_Lookup_Menu';
import { mob720 } from '../tests/MOB.720_AssetLookup_Event_Readings';
import { mob721 } from '../tests/MOB.721_AssetLookup_Readings_Empty';
import { mob914 } from '../tests/MOB.914_Offline_Feature_Messages';
import { mob740 } from '../tests/MOB.740_AssetLookup_Work_History';
import { mob735 } from '../tests/MOB.735_AssetLookup_View_In_Map';
import { mob730 } from '../tests/MOB.730_AssetLookup_Proximity';

test.describe.serial('MOB.968_AssetLookup_1_Rows_Tabs_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.100_Nav_Asset_Lookup', async () => {
    await mob100(page);
  });

  test('MOB.700_AssetLookup_Search', async () => {
    await mob700(page);
  });

  test('MOB.750_AssetLookup_Tag_Lookup_Menu', async () => {
    await mob750(page);
  });

  test('MOB.720_AssetLookup_Event_Readings', async () => {
    await mob720(page);
  });

  test('MOB.721_AssetLookup_Readings_Empty', async () => {
    await mob721(page);
  });

  test('MOB.914_Offline_Feature_Messages', async () => {
    await mob914(page);
  });

  test('MOB.740_AssetLookup_Work_History', async () => {
    await mob740(page);
  });

  test('MOB.735_AssetLookup_View_In_Map', async () => {
    await mob735(page);
  });

  test('MOB.730_AssetLookup_Proximity', async () => {
    await mob730(page);
  });

});
