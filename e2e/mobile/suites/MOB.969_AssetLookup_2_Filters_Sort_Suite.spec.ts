// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.969_AssetLookup_2_Filters_Sort_Suite.json. This file is the source now: edit it directly.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { mob800 } from '../tests/MOB.800_Search_StructuredQuery';
import { mob805 } from '../tests/MOB.805_Search_Filter_Edit';
import { mob806 } from '../tests/MOB.806_Search_MultiValue';
import { mob807 } from '../tests/MOB.807_Search_MultiValue_Enum_Record';
import { mob820 } from '../tests/MOB.820_Search_Filter_Then_Search';

test.describe.serial('MOB.969_AssetLookup_2_Filters_Sort_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.800_Search_StructuredQuery', async () => {
    await mob800(page);
  });

  test('MOB.805_Search_Filter_Edit', async () => {
    await mob805(page);
  });

  test('MOB.806_Search_MultiValue', async () => {
    await mob806(page);
  });

  test('MOB.807_Search_MultiValue_Enum_Record', async () => {
    await mob807(page);
  });

  test('MOB.820_Search_Filter_Then_Search', async () => {
    await mob820(page);
  });

});
