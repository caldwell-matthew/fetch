// MOB.982_Resilience_1_Error_States_Suite — written for Playwright (not converted from Datadog).
//
// What the user sees when the server fails. Each failure is made in the BROWSER (e2e/support/network.ts), so dev
// never receives the failed request, and every test asserts the failure really happened — none can pass because
// nothing was intercepted. Each test gets a fresh browser: two need an empty cache, and a failed startup must not
// poison the next test's session.
//
// Classed as data-changing (tools/suites.json) although it is built to write nothing: several tests submit saves,
// and if an interception ever missed, that save would reach dev. Running it alone keeps such a slip visible.
import { test } from '@playwright/test';
import { freshSession } from '../support/session';
import { mob920 } from '../tests/MOB.920_Startup_Session_Load_Fails';
import { mob921 } from '../tests/MOB.921_Record_Form_Load_Fails';
import { mob922 } from '../tests/MOB.922_Tag_Lookup_Outcomes';
import { mob931 } from '../tests/MOB.931_Map_Card_Asset_Not_Found';
import { mob923 } from '../tests/MOB.923_Note_Save_Rejected';
import { mob924 } from '../tests/MOB.924_Form_Attach_Rejected';
import { mob937 } from '../tests/MOB.937_Work_Create_Refused';
import { mob938 } from '../tests/MOB.938_Work_Reassign_Refused';
import { mob939 } from '../tests/MOB.939_Map_Add_To_Work_Refused';
import { mob940 } from '../tests/MOB.940_AssetVerify_Verify_Refused';
import { mob941 } from '../tests/MOB.941_Mobile_Only_Browser';
import { mob943 } from '../tests/MOB.943_AssetLookup_Tag_Keeps_Filters';
import { mob945 } from '../tests/MOB.945_Collector_Location_No_Geometry';
import { mob946 } from '../tests/MOB.946_AssetVerify_No_Standard_No_Profile';
import { mob544 } from '../tests/MOB.544_AssetVerify_No_Attributes';
import { mob947 } from '../tests/MOB.947_Work_Failure_Component';
import { mob948 } from '../tests/MOB.948_Work_Scheduled_View_Empty';
import { mob949 } from '../tests/MOB.949_Collector_Describe_Video';

test.describe.serial('MOB.982_Resilience_1_Error_States_Suite', () => {
  test('MOB.920_Startup_Session_Load_Fails', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      await mob920(page);
    } finally {
      await page.context().close();
    }
  });

  test('MOB.921_Record_Form_Load_Fails', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      await mob921(page);
    } finally {
      await page.context().close();
    }
  });

  test('MOB.922_Tag_Lookup_Outcomes', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      await mob922(page);
    } finally {
      await page.context().close();
    }
  });

  // Bugs §51 pin: the Tag Lookup's capture and its X drop the active filters. Those symptoms — and only those — are
  // EXPECTED; when §51 is fixed nothing is thrown and the test is green.
  test('MOB.943_AssetLookup_Tag_Keeps_Filters', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      const { captureDropsFilter, clearDropsFilter } = await mob943(page);
      const symptoms = [
        captureDropsFilter && 'bugs §51: a captured tag searched without the active filter',
        clearDropsFilter && "bugs §51: the tag's X re-listed without the active filter",
      ].filter(Boolean);
      if (symptoms.length) {
        test.fail(true, symptoms.join('; '));
        throw new Error(symptoms.join('; '));
      }
    } finally {
      await page.context().close();
    }
  });

  test('MOB.931_Map_Card_Asset_Not_Found', async ({ browser }) => {
    const page = await freshSession(browser, { touch: true });
    try {
      await mob931(page);
    } finally {
      await page.context().close();
    }
  });

  // #91: four saves that now wait for the server, each refused in the browser.
  test('MOB.937_Work_Create_Refused', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      await mob937(page);
    } finally {
      await page.context().close();
    }
  });

  test('MOB.938_Work_Reassign_Refused', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      await mob938(page);
    } finally {
      await page.context().close();
    }
  });

  test('MOB.939_Map_Add_To_Work_Refused', async ({ browser }) => {
    const page = await freshSession(browser, { touch: true });
    try {
      await mob939(page);
    } finally {
      await page.context().close();
    }
  });

  // Bugs §52 and §53 pin: a refused verify leaves the box ticked (§52), and the app sends the job's status for it (§53 —
  // refused in the browser too, so dev is never changed). Those symptoms — and only those — are EXPECTED; every other
  // assertion must hold. When both are fixed nothing is thrown and the test is green.
  test('MOB.940_AssetVerify_Verify_Refused', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      const { boxStillTicked, statusWrites } = await mob940(page);
      const symptoms = [
        boxStillTicked && 'bugs §52: the refused asset\'s box stays ticked',
        statusWrites > 0 && `bugs §53: the app sent the job's status (${statusWrites}×) for a verify the server refused`,
      ].filter(Boolean);
      if (symptoms.length) {
        test.fail(true, symptoms.join('; '));
        throw new Error(symptoms.join('; '));
      }
    } finally {
      await page.context().close();
    }
  });

  test('MOB.945_Collector_Location_No_Geometry', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      const { toggles } = await mob945(page);
      console.log(`MOB.945: the location form's toggles (GIS, Address) read ${JSON.stringify(toggles)} for a no-geometry type`);
    } finally {
      await page.context().close();
    }
  });

  test('MOB.946_AssetVerify_No_Standard_No_Profile', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      await mob946(page);
    } finally {
      await page.context().close();
    }
  });

  // Its own browser: Tank 0000's attributes emptied in the answers.
  test('MOB.544_AssetVerify_No_Attributes', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      await mob544(page);
    } finally {
      await page.context().close();
    }
  });

  test('MOB.947_Work_Failure_Component', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      await mob947(page);
    } finally {
      await page.context().close();
    }
  });

  test('MOB.948_Work_Scheduled_View_Empty', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      await mob948(page);
    } finally {
      await page.context().close();
    }
  });

  test('MOB.949_Collector_Describe_Video', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      await mob949(page);
    } finally {
      await page.context().close();
    }
  });

  test('MOB.941_Mobile_Only_Browser', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      await mob941(page);
    } finally {
      await page.context().close();
    }
  });

  // Bugs §48 pin: "Item added" is shown for a note the server refused. That symptom — and only that — is EXPECTED;
  // every other assertion in the test must hold. When §48 is fixed nothing is thrown and the test is green.
  test('MOB.923_Note_Save_Rejected', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      const { itemAddedShown } = await mob923(page);
      if (itemAddedShown) {
        test.fail(true, 'bugs §48: "Item added" is shown before the server answers');
        throw new Error('bugs §48: "Item added" was shown for a note the server refused');
      }
    } finally {
      await page.context().close();
    }
  });

  test('MOB.924_Form_Attach_Rejected', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      await mob924(page);
    } finally {
      await page.context().close();
    }
  });
});
