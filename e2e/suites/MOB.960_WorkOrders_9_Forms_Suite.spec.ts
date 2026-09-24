// Generated from legacy/Mobile/dd_tests_mobile/MOB.960_WorkOrders_9_Forms_Suite.json by to_playwright.py — do not edit by hand yet.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../playwright.config';
import { login } from '../support/login';
import { mob355 } from '../tests/MOB.355_Work_Form_Render';
import { mob134 } from '../tests/MOB.134_Work_Form_Fill';
import { mob135 } from '../tests/MOB.135_Work_Form_Signature_Pad';

test.describe.serial('MOB.960_WorkOrders_9_Forms_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  test('MOB.355_Work_Form_Render', async () => {
    await mob355(page);
  });

  test('MOB.134_Work_Form_Fill', async () => {
    await mob134(page);
  });

  test('MOB.135_Work_Form_Signature_Pad', async () => {
    await mob135(page);
  });

});
