// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.981_WorkOrders_3_Detail_Charges_Offline_Suite.json. This file is the source now: edit it directly.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { mob357 } from '../tests/MOB.357_Work_Form_Metrics';
import { mob356 } from '../tests/MOB.356_Work_Charge_Form_Validity';
import { mob351 } from '../tests/MOB.351_Work_Charge_Estimates';
import { mob398 } from '../tests/MOB.398_Work_Assign_Stage_Modal';
import { mob911 } from '../tests/MOB.911_Offline_Geolocate';
import { mob912 } from '../tests/MOB.912_Offline_Connection_Screens';

test.describe.serial('MOB.981_WorkOrders_3_Detail_Charges_Offline_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.357_Work_Form_Metrics', async () => {
    await mob357(page);
  });

  test('MOB.356_Work_Charge_Form_Validity', async () => {
    await mob356(page);
  });

  test('MOB.351_Work_Charge_Estimates', async () => {
    await mob351(page);
  });

  test('MOB.398_Work_Assign_Stage_Modal', async () => {
    await mob398(page);
  });

  test('MOB.911_Offline_Geolocate', async () => {
    await mob911(page);
  });

  test('MOB.912_Offline_Connection_Screens', async () => {
    await mob912(page);
  });

});
