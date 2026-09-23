// Generated from Mobile/dd_tests_mobile/MOB.963_AssetVerify_3_Verify_Status_Queue_Suite.json by to_playwright.py — do not edit by hand yet.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../playwright.config';
import { login } from '../support/login';
import { mob510 } from '../tests/MOB.510_AssetVerify_Verify_Unverify';
import { mob590 } from '../tests/MOB.590_AssetVerify_Unverified_Tab';
import { mob913 } from '../tests/MOB.913_Offline_Transaction_Queue';
import { mob536 } from '../tests/MOB.536_AssetVerify_Job_Status_Menu';
import { mob511 } from '../tests/MOB.511_AssetVerify_Verify_All_Completed';
import { mob512 } from '../tests/MOB.512_AssetVerify_Job_List_Status';

test.describe.serial('MOB.963_AssetVerify_3_Verify_Status_Queue_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.510_AssetVerify_Verify_Unverify', async () => {
    await mob510(page);
  });

  test('MOB.590_AssetVerify_Unverified_Tab', async () => {
    await mob590(page);
  });

  test('MOB.913_Offline_Transaction_Queue', async () => {
    await mob913(page);
  });

  test('MOB.536_AssetVerify_Job_Status_Menu', async () => {
    await mob536(page);
  });

  test('MOB.511_AssetVerify_Verify_All_Completed', async () => {
    await mob511(page);
  });

  test('MOB.512_AssetVerify_Job_List_Status', async () => {
    await mob512(page);
  });

});
