// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.972_AppShell_Suite.json. This file is the source now: edit it directly.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { mob180 } from '../tests/MOB.180_Home_Screen';
import { mob900 } from '../tests/MOB.900_Online_Guard';
import { mob910 } from '../tests/MOB.910_Offline_UI';
import { mob170 } from '../tests/MOB.170_Nav_Dev_Logs';
import { mob171 } from '../tests/MOB.171_DevLogs_Contents';
import { mob130 } from '../tests/MOB.130_Nav_Transaction_Log';
import { mob131 } from '../tests/MOB.131_Transaction_Log_Contents';
import { mob132 } from '../tests/MOB.132_TransactionLog_Search';
import { mob400 } from '../tests/MOB.400_Menu_Open_Close';
import { mob410 } from '../tests/MOB.410_Menu_Resync';
import { mob420 } from '../tests/MOB.420_Menu_Transaction_Log';
import { mob430 } from '../tests/MOB.430_Crew_Modal_Dismiss';
import { mob450 } from '../tests/MOB.450_Global_Back_Arrow';
import { mob460 } from '../tests/MOB.460_Global_Module_Resync';
import { mob470 } from '../tests/MOB.470_Header_Status_Icons';

test.describe.serial('MOB.972_AppShell_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.180_Home_Screen', async () => {
    await mob180(page);
  });

  test('MOB.900_Online_Guard', async () => {
    await mob900(page);
  });

  test('MOB.910_Offline_UI', async () => {
    await mob910(page);
  });

  test('MOB.170_Nav_Dev_Logs', async () => {
    await mob170(page);
  });

  test('MOB.171_DevLogs_Contents', async () => {
    await mob171(page);
  });

  test('MOB.130_Nav_Transaction_Log', async () => {
    await mob130(page);
  });

  test('MOB.131_Transaction_Log_Contents', async () => {
    await mob131(page);
  });

  test('MOB.132_TransactionLog_Search', async () => {
    await mob132(page);
  });

  test('MOB.400_Menu_Open_Close', async () => {
    await mob400(page);
  });

  test('MOB.410_Menu_Resync', async () => {
    await mob410(page);
  });

  test('MOB.420_Menu_Transaction_Log', async () => {
    await mob420(page);
  });

  test('MOB.430_Crew_Modal_Dismiss', async () => {
    await mob430(page);
  });

  test('MOB.450_Global_Back_Arrow', async () => {
    await mob450(page);
  });

  test('MOB.460_Global_Module_Resync', async () => {
    await mob460(page);
  });

  test('MOB.470_Header_Status_Icons', async () => {
    await mob470(page);
  });

});
