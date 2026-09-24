// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.962_AssetVerify_2_Job_Assets_Read_Suite.json. This file is the source now: edit it directly.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { mob500 } from '../tests/MOB.500_AssetVerify_Job_Read';
import { mob520 } from '../tests/MOB.520_AssetVerify_Asset_Tabs';
import { mob585 } from '../tests/MOB.585_AssetVerify_Map_Toggle';
import { mob531 } from '../tests/MOB.531_AssetVerify_Asset_Search';
import { mob547 } from '../tests/MOB.547_AssetVerify_Photo_Tag_Search';
import { mob551 } from '../tests/MOB.551_AssetVerify_Reading_History';
import { mob928 } from '../tests/MOB.928_AssetVerify_Add_Existing_Excludes_Job_Assets';

test.describe.serial('MOB.962_AssetVerify_2_Job_Assets_Read_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.500_AssetVerify_Job_Read', async () => {
    await mob500(page);
  });

  test('MOB.520_AssetVerify_Asset_Tabs', async () => {
    await mob520(page);
  });

  test('MOB.585_AssetVerify_Map_Toggle', async () => {
    await mob585(page);
  });

  test('MOB.531_AssetVerify_Asset_Search', async () => {
    await mob531(page);
  });

  test('MOB.547_AssetVerify_Photo_Tag_Search', async () => {
    await mob547(page);
  });

  test('MOB.551_AssetVerify_Reading_History', async () => {
    await mob551(page);
  });

  test('MOB.928_AssetVerify_Add_Existing_Excludes_Job_Assets', async () => {
    await mob928(page);
  });

});
