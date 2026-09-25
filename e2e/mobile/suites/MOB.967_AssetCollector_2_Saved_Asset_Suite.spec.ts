// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.967_AssetCollector_2_Saved_Asset_Suite.json. This file is the source now: edit it directly.
//
// The children share ONE browser session, in order, exactly as the Datadog suite ran them
// (they also share the fixture records, so nothing here may run in parallel — trap 1).
import { test, Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { mob600 } from '../tests/MOB.600_Collector_Create_Asset';
import { mob623 } from '../tests/MOB.623_Collector_Saved_Photo_Menu';
import { mob627 } from '../tests/MOB.627_Collector_Saved_Photo_Writes';
import { mob628 } from '../tests/MOB.628_Collector_Document_Add_Delete';
import { mob933 } from '../tests/MOB.933_Collector_Several_File_Types';
import { mob934 } from '../tests/MOB.934_Collector_Upload_Interrupted';
import { mob935 } from '../tests/MOB.935_Collector_Get_Description_Online';
import { mob936 } from '../tests/MOB.936_Collector_HEIC_Photo';

test.describe.serial('MOB.967_AssetCollector_2_Saved_Asset_Suite', () => {
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    await page?.context().close();
  });

  // Bugs §34 pin: MOB.600 is red on its SERVER PROOF step alone (a soft step) while the collect never reaches
  // the server. That one failure is EXPECTED, so the suite goes on to the children after it; any other failure
  // is a real red. When §34 is fixed nothing is thrown and the test is simply green.
  test('MOB.600_Collector_Create_Asset', async () => {
    try {
      await mob600(page);
    } catch (err) {
      const msg = String((err as Error)?.message ?? err);
      const soft = msg.startsWith('soft step(s) failed:');
      const onlyServerProof = soft && msg.split('\n').slice(1).every((l) => l.includes('SERVER PROOF'));
      if (onlyServerProof) test.fail(true, 'bugs §34: a collected asset never reaches the server');
      throw err;
    }
  });

  test('MOB.623_Collector_Saved_Photo_Menu', async () => {
    await mob623(page);
  });

  test('MOB.627_Collector_Saved_Photo_Writes', async () => {
    await mob627(page);
  });

  test('MOB.628_Collector_Document_Add_Delete', async () => {
    await mob628(page);
  });

  test('MOB.933_Collector_Several_File_Types', async () => {
    await mob933(page);
  });

  test('MOB.934_Collector_Upload_Interrupted', async () => {
    await mob934(page);
  });

  test('MOB.935_Collector_Get_Description_Online', async () => {
    await mob935(page);
  });

  test('MOB.936_Collector_HEIC_Photo', async () => {
    const { naturalWidth } = await mob936(page);
    console.log(`MOB.936: the HEIC slide's naturalWidth = ${naturalWidth}`);
  });

});
