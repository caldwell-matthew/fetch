// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.970_MaterialLookup_Suite.json. This file is the source now: edit it directly.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { mob110 } from '../tests/MOB.110_Nav_Material_Lookup';
import { mob850 } from '../tests/MOB.850_MaterialLookup_Read';
import { mob860 } from '../tests/MOB.860_MaterialLookup_Cycle_Count';
import { mob870 } from '../tests/MOB.870_MaterialLookup_Stocking';
import { mob855 } from '../tests/MOB.855_MaterialLookup_Column_Sort';
import { mob865 } from '../tests/MOB.865_MaterialLookup_Item_Attachments';
import { mob866 } from '../tests/MOB.866_MaterialLookup_Item_Attachment_Delete';

test.describe.serial('MOB.970_MaterialLookup_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.110_Nav_Material_Lookup', async () => {
    await mob110(page);
  });

  test('MOB.850_MaterialLookup_Read', async () => {
    await mob850(page);
  });

  test('MOB.860_MaterialLookup_Cycle_Count', async () => {
    await mob860(page);
  });

  test('MOB.870_MaterialLookup_Stocking', async () => {
    await mob870(page);
  });

  test('MOB.855_MaterialLookup_Column_Sort', async () => {
    await mob855(page);
  });

  test('MOB.865_MaterialLookup_Item_Attachments', async () => {
    await mob865(page);
  });

  test('MOB.866_MaterialLookup_Item_Attachment_Delete', async () => {
    await mob866(page);
  });

});
