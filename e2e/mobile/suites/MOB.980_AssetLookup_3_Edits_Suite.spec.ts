// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.980_AssetLookup_3_Edits_Suite.json. This file is the source now: edit it directly.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { mob710 } from '../tests/MOB.710_AssetLookup_Field_Edit';
import { mob712 } from '../tests/MOB.712_AssetLookup_System_Create';
import { mob722 } from '../tests/MOB.722_AssetLookup_Reading_Capture';

test.describe.serial('MOB.980_AssetLookup_3_Edits_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.710_AssetLookup_Field_Edit', async () => {
    await mob710(page);
  });

  test('MOB.712_AssetLookup_System_Create', async () => {
    await mob712(page);
  });

  test('MOB.722_AssetLookup_Reading_Capture', async () => {
    await mob722(page);
  });

});
