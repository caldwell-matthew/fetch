// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.956_WorkOrders_5_Records_Suite.json. This file is the source now: edit it directly.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { mob350 } from '../tests/MOB.350_Work_Add_Equipment_Charge';
import { mob360 } from '../tests/MOB.360_Work_Add_Labor_Charge';
import { mob370 } from '../tests/MOB.370_Work_Add_Material_Charge';
import { mob380 } from '../tests/MOB.380_Work_Add_Other_Charge';
import { mob390 } from '../tests/MOB.390_Work_Add_Condition';
import { mob391 } from '../tests/MOB.391_Work_Add_Failure';
import { mob392 } from '../tests/MOB.392_Work_Add_Note';
import { mob361 } from '../tests/MOB.361_Work_Note_Edit_Delete';

test.describe.serial('MOB.956_WorkOrders_5_Records_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.350_Work_Add_Equipment_Charge', async () => {
    await mob350(page);
  });

  test('MOB.360_Work_Add_Labor_Charge', async () => {
    await mob360(page);
  });

  test('MOB.370_Work_Add_Material_Charge', async () => {
    await mob370(page);
  });

  test('MOB.380_Work_Add_Other_Charge', async () => {
    await mob380(page);
  });

  test('MOB.390_Work_Add_Condition', async () => {
    await mob390(page);
  });

  test('MOB.391_Work_Add_Failure', async () => {
    await mob391(page);
  });

  test('MOB.392_Work_Add_Note', async () => {
    await mob392(page);
  });

  test('MOB.361_Work_Note_Edit_Delete', async () => {
    await mob361(page);
  });

});
