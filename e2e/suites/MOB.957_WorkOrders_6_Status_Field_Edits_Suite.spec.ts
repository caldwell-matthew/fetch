// Generated from Mobile/dd_tests_mobile/MOB.957_WorkOrders_6_Status_Field_Edits_Suite.json by to_playwright.py — do not edit by hand yet.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../playwright.config';
import { login } from '../support/login';
import { mob320 } from '../tests/MOB.320_Work_Status_Update';
import { mob395 } from '../tests/MOB.395_Work_GenInfo_Edit';
import { mob388 } from '../tests/MOB.388_Work_Attribute_Edit';
import { mob386 } from '../tests/MOB.386_Work_Condition_Edit_Save';
import { mob385 } from '../tests/MOB.385_Work_Failure_Edit_Save';

test.describe.serial('MOB.957_WorkOrders_6_Status_Field_Edits_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.320_Work_Status_Update', async () => {
    await mob320(page);
  });

  test('MOB.395_Work_GenInfo_Edit', async () => {
    await mob395(page);
  });

  test('MOB.388_Work_Attribute_Edit', async () => {
    await mob388(page);
  });

  test('MOB.386_Work_Condition_Edit_Save', async () => {
    await mob386(page);
  });

  test('MOB.385_Work_Failure_Edit_Save', async () => {
    await mob385(page);
  });

});
