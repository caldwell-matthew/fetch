// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.971_Map_Suite.json. This file is the source now: edit it directly.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { freshSession } from '../support/session';
import { mob120 } from '../tests/MOB.120_Nav_Map';
import { mob119 } from '../tests/MOB.119_Map_No_Map_Configured';
import { mob121 } from '../tests/MOB.121_Map_Controls';
import { mob124 } from '../tests/MOB.124_Map_Tilt_And_Home';
import { mob125 } from '../tests/MOB.125_Map_Address_Search';
import { mob126 } from '../tests/MOB.126_Map_Layers_After_Style_Switch';
import { mob127 } from '../tests/MOB.127_AssetVerify_Map_Pins';
import { mob123 } from '../tests/MOB.123_Map_Switch_Map';
import { mob122 } from '../tests/MOB.122_Map_Create_Work';
import { mob929 } from '../tests/MOB.929_Map_Card_Add_Asset_To_Work';
import { mob930 } from '../tests/MOB.930_Map_Card_Change_Asset_Cancel';
import { mob128 } from '../tests/MOB.128_Map_Replace_Assets_Use_Map';
import { mob129 } from '../tests/MOB.129_Map_Replace_From_View_In_Map';
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

  // Its own browser: an empty stored map id (the no-map branch), then the key removed.
  test('MOB.119_Map_No_Map_Configured', async ({ browser }) => {
    await mob119(browser);
  });

  test('MOB.121_Map_Controls', async () => {
    await mob121(page);
  });

  // Read-only, in its own browser.
  test('MOB.124_Map_Tilt_And_Home', async ({ browser }) => {
    const own = await freshSession(browser);
    try {
      const { labelWhileTilted } = await mob124(own);
      // Bugs §55 pin: the tilt button reads `3D` while the map is tilted. That symptom — and only that — is EXPECTED;
      // when §55 is fixed it reads `2D`, nothing is thrown, and the test is simply green.
      if (labelWhileTilted !== '2D') {
        test.fail(true, `bugs §55: the tilt button reads ${JSON.stringify(labelWhileTilted)} while tilted`);
        throw new Error(`bugs §55: the tilt button reads ${JSON.stringify(labelWhileTilted)} while the map is tilted`);
      }
    } finally {
      await own.context().close();
    }
  });

  // Read-only, in its own browser.
  test('MOB.125_Map_Address_Search', async ({ browser }) => {
    const own = await freshSession(browser);
    try {
      await mob125(own);
    } finally {
      await own.context().close();
    }
  });

  // Read-only, in its own browser.
  test('MOB.126_Map_Layers_After_Style_Switch', async ({ browser }) => {
    const own = await freshSession(browser);
    try {
      const r = await mob126(own);
      console.log(`MOB.126: ${r.groups} layer group(s), ${r.layers} layer(s), the same after the style switch`);
    } finally {
      await own.context().close();
    }
  });

  // Read-only, in its own browser.
  test('MOB.127_AssetVerify_Map_Pins', async ({ browser }) => {
    const own = await freshSession(browser);
    try {
      const { fills } = await mob127(own);
      console.log(`MOB.127: pin fills ${JSON.stringify(fills)}`);
    } finally {
      await own.context().close();
    }
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

  // Switches the account's `My Work: Ready` map layer on and back off (owner, 2026-09-24) — see the test's top.
  test('MOB.930_Map_Card_Change_Asset_Cancel', async ({ browser }) => {
    await mob930(browser);
  });

  // CONFIRMS "Replace existing assets." on a work order the tests made (owner, 2026-09-29, trap 2), and switches
  // `My Work: Ready` on and back off as MOB.930 does — see the test's top.
  let replaced: string | undefined; // the stage MOB.128 replaced on — MOB.129 replaces on it again
  test('MOB.128_Map_Replace_Assets_Use_Map', async ({ browser }) => {
    replaced = await mob128(browser);
  });

  // The same replace from the card "View in Map" opens by itself. Bugs §56 pin: the replace saves, but the overlay
  // never closes. That symptom — and only that — is EXPECTED; when §56 is fixed the overlay closes and the test is green.
  test('MOB.129_Map_Replace_From_View_In_Map', async ({ browser }) => {
    const { ended } = await mob129(browser, replaced);
    if (!ended) {
      test.fail(true, 'bugs §56: after a Use Map replace from the "View in Map" card, the overlay never closes');
      throw new Error('bugs §56: the replace saved, but the pick overlay never closed (Confirm spins, Cancel disabled)');
    }
  });

  test('MOB.932_Map_Point_Create_Work_And_Asset', async ({ browser }) => {
    await mob932(browser);
  });

});
