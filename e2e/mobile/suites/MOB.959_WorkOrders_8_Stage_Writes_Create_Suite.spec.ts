// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.959_WorkOrders_8_Stage_Writes_Create_Suite.json. This file is the source now: edit it directly.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { mob396 } from '../tests/MOB.396_Work_Create_From_Asset';
import { mob397 } from '../tests/MOB.397_Work_Assign_Followup';
import { mob302 } from '../tests/MOB.302_Work_Photo_Copy_To_Asset';
import { mob363 } from '../tests/MOB.363_Work_Attachment_Upload_Delete';
import { mob365 } from '../tests/MOB.365_Work_Reassign_Stage';
import { mob364 } from '../tests/MOB.364_Work_Attach_Form';

test.describe.serial('MOB.959_WorkOrders_8_Stage_Writes_Create_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.396_Work_Create_From_Asset', async () => {
    await mob396(page);
  });

  test('MOB.397_Work_Assign_Followup', async () => {
    await mob397(page);
  });

  test('MOB.302_Work_Photo_Copy_To_Asset', async () => {
    await mob302(page);
  });

  test('MOB.363_Work_Attachment_Upload_Delete', async () => {
    await mob363(page);
  });

  test('MOB.365_Work_Reassign_Stage', async () => {
    await mob365(page);
  });

  test('MOB.364_Work_Attach_Form', async () => {
    await mob364(page);
  });

});
