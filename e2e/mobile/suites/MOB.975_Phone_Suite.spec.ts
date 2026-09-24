// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.975_Phone_Suite.json. This file is the source now: edit it directly.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { mob951 } from '../tests/MOB.951_Phone_Form_Branch';
import { mob952 } from '../tests/MOB.952_Phone_Header_And_List';

test.describe.serial('MOB.975_Phone_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.mobile_small });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.951_Phone_Form_Branch', async () => {
    await mob951(page);
  });

  test('MOB.952_Phone_Header_And_List', async () => {
    await mob952(page);
  });

});
