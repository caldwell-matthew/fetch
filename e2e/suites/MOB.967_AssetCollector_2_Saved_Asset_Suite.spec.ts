// Generated from legacy/Mobile/dd_tests_mobile/MOB.967_AssetCollector_2_Saved_Asset_Suite.json by to_playwright.py — do not edit by hand yet.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../playwright.config';
import { login } from '../support/login';
import { mob600 } from '../tests/MOB.600_Collector_Create_Asset';
import { mob623 } from '../tests/MOB.623_Collector_Saved_Photo_Menu';
import { mob627 } from '../tests/MOB.627_Collector_Saved_Photo_Writes';
import { mob628 } from '../tests/MOB.628_Collector_Document_Add_Delete';

test.describe.serial('MOB.967_AssetCollector_2_Saved_Asset_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  // cannot run outside Datadog — see the header of tests/MOB.600_Collector_Create_Asset.ts
  test.fixme('MOB.600_Collector_Create_Asset', async () => {
    await mob600(page);
  });

  test('MOB.623_Collector_Saved_Photo_Menu', async () => {
    await mob623(page);
  });

  test('MOB.627_Collector_Saved_Photo_Writes', async () => {
    await mob627(page);
  });

  test('MOB.628_Collector_Document_Add_Delete', async () => {
    await mob628(page);
  });

});
