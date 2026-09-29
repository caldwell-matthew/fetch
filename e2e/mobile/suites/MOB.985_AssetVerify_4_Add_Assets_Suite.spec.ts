// MOB.985_AssetVerify_4_Add_Assets_Suite — written for Playwright (not converted from Datadog).
//
// Adds assets to the Asset Verify fixture job and does NOT undo it: the owner's "run, then reset" (2026-09-29).
// `playwright_pass.py` runs this suite's `after` — `reset_av_fixture.py --apply` — before the fixture checks that
// follow it. Run alone, reset by hand: `.venv/bin/python e2e/mobile/tools/reset_av_fixture.py --apply`.
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { mob513 } from '../tests/MOB.513_AssetVerify_Add_New_Asset';
import { mob514 } from '../tests/MOB.514_AssetVerify_Add_Existing_Asset';

test.describe.serial('MOB.985_AssetVerify_4_Add_Assets_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  // Bugs §57 pin: after a NEW asset is created from the job, the job's page is blank until a resync. That symptom — and
  // only that — is EXPECTED; the create and the link are proven either way, and when §57 is fixed the test is green.
  test('MOB.513_AssetVerify_Add_New_Asset', async () => {
    const { blank } = await mob513(page);
    if (blank) {
      test.fail(true, "bugs §57: the job's page is blank after a new asset is added");
      throw new Error("bugs §57: the job's page rendered nothing after the add (a resync brought it back)");
    }
  });

  test('MOB.514_AssetVerify_Add_Existing_Asset', async () => {
    await mob514(page);
  });
});
