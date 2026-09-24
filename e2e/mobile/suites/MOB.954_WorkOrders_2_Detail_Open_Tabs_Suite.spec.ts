// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.954_WorkOrders_2_Detail_Open_Tabs_Suite.json. This file is the source now: edit it directly.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { mob310 } from '../tests/MOB.310_Work_Read';
import { mob330 } from '../tests/MOB.330_Work_Detail_Tabs';
import { mob331 } from '../tests/MOB.331_Work_GenInfo_Value_Modal';
import { mob393 } from '../tests/MOB.393_Work_Add_Form';
import { mob394 } from '../tests/MOB.394_Work_Permits';
import { mob399 } from '../tests/MOB.399_Work_Warranties';
import { mob348 } from '../tests/MOB.348_Work_MapLink';
import { mob349 } from '../tests/MOB.349_Work_Record_Cycling';

test.describe.serial('MOB.954_WorkOrders_2_Detail_Open_Tabs_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.310_Work_Read', async () => {
    await mob310(page);
  });

  test('MOB.330_Work_Detail_Tabs', async () => {
    await mob330(page);
  });

  test('MOB.331_Work_GenInfo_Value_Modal', async () => {
    await mob331(page);
  });

  test('MOB.393_Work_Add_Form', async () => {
    await mob393(page);
  });

  test('MOB.394_Work_Permits', async () => {
    await mob394(page);
  });

  test('MOB.399_Work_Warranties', async () => {
    await mob399(page);
  });

  test('MOB.348_Work_MapLink', async () => {
    await mob348(page);
  });

  test('MOB.349_Work_Record_Cycling', async () => {
    await mob349(page);
  });

});
