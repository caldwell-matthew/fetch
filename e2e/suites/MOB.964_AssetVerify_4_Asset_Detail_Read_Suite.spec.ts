// Generated from Mobile/dd_tests_mobile/MOB.964_AssetVerify_4_Asset_Detail_Read_Suite.json by to_playwright.py — do not edit by hand yet.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../playwright.config';
import { login } from '../support/login';
import { mob570 } from '../tests/MOB.570_AssetVerify_Asset_Cycling';
import { mob575 } from '../tests/MOB.575_AssetVerify_Failure_Condition_Forms';
import { mob546 } from '../tests/MOB.546_AssetVerify_Asset_Attachments';

test.describe.serial('MOB.964_AssetVerify_4_Asset_Detail_Read_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.570_AssetVerify_Asset_Cycling', async () => {
    await mob570(page);
  });

  test('MOB.575_AssetVerify_Failure_Condition_Forms', async () => {
    await mob575(page);
  });

  test('MOB.546_AssetVerify_Asset_Attachments', async () => {
    await mob546(page);
  });

});
