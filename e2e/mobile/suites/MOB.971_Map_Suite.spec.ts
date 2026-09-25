// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.971_Map_Suite.json. This file is the source now: edit it directly.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { mob120 } from '../tests/MOB.120_Nav_Map';
import { mob121 } from '../tests/MOB.121_Map_Controls';
import { mob123 } from '../tests/MOB.123_Map_Switch_Map';
import { mob122 } from '../tests/MOB.122_Map_Create_Work';
import { mob929 } from '../tests/MOB.929_Map_Card_Add_Asset_To_Work';
import { mob930 } from '../tests/MOB.930_Map_Card_Change_Asset_Cancel';
import { mob932 } from '../tests/MOB.932_Map_Point_Create_Work_And_Asset';

test.describe.serial('MOB.971_Map_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.120_Nav_Map', async () => {
    await mob120(page);
  });

  test('MOB.121_Map_Controls', async () => {
    await mob121(page);
  });

  test('MOB.123_Map_Switch_Map', async () => {
    await mob123(page);
  });

  test('MOB.122_Map_Create_Work', async () => {
    await mob122(page);
  });

  test('MOB.929_Map_Card_Add_Asset_To_Work', async ({ browser }) => {
    await mob929(browser);
  });

  // A work stage's card opens only when a work layer is shown, and every one is off for the test account; turning one
  // on saves the account's map settings on the server — the owner's call (checklist #84).
  test.fixme('MOB.930_Map_Card_Change_Asset_Cancel', async ({ browser }) => {
    await mob930(browser);
  });

  test('MOB.932_Map_Point_Create_Work_And_Asset', async ({ browser }) => {
    await mob932(browser);
  });

});
