// Generated from Mobile/dd_tests_mobile/MOB.965_AssetVerify_5_Asset_Detail_Edits_Suite.json by to_playwright.py — do not edit by hand yet.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../playwright.config';
import { login } from '../support/login';
import { mob537 } from '../tests/MOB.537_AssetVerify_Header_Tag';
import { mob545 } from '../tests/MOB.545_AssetVerify_Attribute_Edit';
import { mob550 } from '../tests/MOB.550_AssetVerify_Event_Readings';

test.describe.serial('MOB.965_AssetVerify_5_Asset_Detail_Edits_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.537_AssetVerify_Header_Tag', async () => {
    await mob537(page);
  });

  test('MOB.545_AssetVerify_Attribute_Edit', async () => {
    await mob545(page);
  });

  test('MOB.550_AssetVerify_Event_Readings', async () => {
    await mob550(page);
  });

});
