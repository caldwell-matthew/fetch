// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.953_WorkOrders_1_List_Suite.json. This file is the source now: edit it directly.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { mob150 } from '../tests/MOB.150_Nav_Work_Orders';
import { mob300 } from '../tests/MOB.300_Work_Create';
import { mob303 } from '../tests/MOB.303_Work_Create_Crew_Choice';
import { mob301 } from '../tests/MOB.301_Work_Create_Photo';
import { mob340 } from '../tests/MOB.340_Work_Search_Sort';
import { mob341 } from '../tests/MOB.341_Work_Map_Toggle';
import { mob343 } from '../tests/MOB.343_Work_List_Search_Filter';
import { mob339 } from '../tests/MOB.339_Work_List_Search_Fields';
import { mob344 } from '../tests/MOB.344_Work_List_Row_Navigate';
import { mob342 } from '../tests/MOB.342_Work_Status_Ring';
import { mob345 } from '../tests/MOB.345_Work_Sort_Persist';

test.describe.serial('MOB.953_WorkOrders_1_List_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.150_Nav_Work_Orders', async () => {
    await mob150(page);
  });

  // Bugs §59 and §60 pins: the create form's Address (filled by its locate button) is never saved, and a work order
  // created before the list's downloads end never joins the list. Those symptoms — and only those — are EXPECTED; when
  // both are fixed the test is green.
  test('MOB.300_Work_Create', async () => {
    const { addressSaved, listed } = await mob300(page);
    const open = [
      ...(addressSaved ? [] : ["bugs §59: the located address was in the form, and the new stage holds none"]),
      ...(listed ? [] : ["bugs §60: the list's legend total did not move after the create"]),
    ];
    if (open.length) {
      test.fail(true, open.join(' · '));
      throw new Error(open.join(' · '));
    }
  });

  // Two more work orders (residue), with the crew CLEARED and set to another crew — outside the crew's list.
  test('MOB.303_Work_Create_Crew_Choice', async () => {
    await mob303(page);
  });

  test('MOB.301_Work_Create_Photo', async () => {
    await mob301(page);
  });

  test('MOB.340_Work_Search_Sort', async () => {
    await mob340(page);
  });

  test('MOB.341_Work_Map_Toggle', async () => {
    await mob341(page);
  });

  test('MOB.343_Work_List_Search_Filter', async () => {
    await mob343(page);
  });

  test('MOB.339_Work_List_Search_Fields', async () => {
    await mob339(page);
  });

  test('MOB.344_Work_List_Row_Navigate', async () => {
    await mob344(page);
  });

  test('MOB.342_Work_Status_Ring', async () => {
    await mob342(page);
  });

  test('MOB.345_Work_Sort_Persist', async () => {
    await mob345(page);
  });

});
