// Generated from Mobile/dd_tests_mobile/MOB.961_AssetVerify_1_Jobs_List_Suite.json by to_playwright.py — do not edit by hand yet.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../playwright.config';
import { login } from '../support/login';
import { mob140 } from '../tests/MOB.140_Nav_Mobile_Jobs';
import { mob530 } from '../tests/MOB.530_AssetVerify_Search_Filter_Sort';
import { mob560 } from '../tests/MOB.560_AssetVerify_Counts_Badges';
import { mob580 } from '../tests/MOB.580_AssetVerify_Sort_Ordering';
import { mob810 } from '../tests/MOB.810_Search_Sort_Apply';
import { mob535 } from '../tests/MOB.535_AssetVerify_Sort_Ordering';

test.describe.serial('MOB.961_AssetVerify_1_Jobs_List_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.140_Nav_Mobile_Jobs', async () => {
    await mob140(page);
  });

  test('MOB.530_AssetVerify_Search_Filter_Sort', async () => {
    await mob530(page);
  });

  test('MOB.560_AssetVerify_Counts_Badges', async () => {
    await mob560(page);
  });

  test('MOB.580_AssetVerify_Sort_Ordering', async () => {
    await mob580(page);
  });

  test('MOB.810_Search_Sort_Apply', async () => {
    await mob810(page);
  });

  test('MOB.535_AssetVerify_Sort_Ordering', async () => {
    await mob535(page);
  });

});
