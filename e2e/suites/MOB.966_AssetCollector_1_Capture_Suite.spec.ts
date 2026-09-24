// Generated from legacy/Mobile/dd_tests_mobile/MOB.966_AssetCollector_1_Capture_Suite.json by to_playwright.py — do not edit by hand yet.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../playwright.config';
import { login } from '../support/login';
import { mob160 } from '../tests/MOB.160_Nav_Asset_Collector';
import { mob620 } from '../tests/MOB.620_Collector_Photo_Picker';
import { mob621 } from '../tests/MOB.621_Collector_Photo_Add';
import { mob622 } from '../tests/MOB.622_Collector_Photo_Carousel';
import { mob626 } from '../tests/MOB.626_Collector_Capture_Options';
import { mob629 } from '../tests/MOB.629_Collector_Location_Capture';
import { mob610 } from '../tests/MOB.610_Collector_Search';
import { mob624 } from '../tests/MOB.624_Collector_Row_Avatar_Modal';
import { mob625 } from '../tests/MOB.625_Collector_List_Sort';

test.describe.serial('MOB.966_AssetCollector_1_Capture_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.160_Nav_Asset_Collector', async () => {
    await mob160(page);
  });

  test('MOB.620_Collector_Photo_Picker', async () => {
    await mob620(page);
  });

  test('MOB.621_Collector_Photo_Add', async () => {
    await mob621(page);
  });

  test('MOB.622_Collector_Photo_Carousel', async () => {
    await mob622(page);
  });

  test('MOB.626_Collector_Capture_Options', async () => {
    await mob626(page);
  });

  test('MOB.629_Collector_Location_Capture', async () => {
    await mob629(page);
  });

  test('MOB.610_Collector_Search', async () => {
    await mob610(page);
  });

  test('MOB.624_Collector_Row_Avatar_Modal', async () => {
    await mob624(page);
  });

  test('MOB.625_Collector_List_Sort', async () => {
    await mob625(page);
  });

});
