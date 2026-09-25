// MOB.982_Resilience_1_Error_States_Suite — written for Playwright (not converted from Datadog).
//
// What the user sees when the server fails. Each failure is made in the BROWSER (e2e/support/network.ts), so dev
// never receives the failed request, and every test asserts the failure really happened — none can pass because
// nothing was intercepted. Each test gets a fresh browser: two need an empty cache, and a failed startup must not
// poison the next test's session.
//
// Classed as data-changing (tools/suites.json) although it is built to write nothing: two tests submit saves,
// and if an interception ever missed, that save would reach dev. Running it alone keeps such a slip visible.
import { test } from '@playwright/test';
import { freshSession } from '../support/session';
import { mob920 } from '../tests/MOB.920_Startup_Session_Load_Fails';
import { mob921 } from '../tests/MOB.921_Record_Form_Load_Fails';
import { mob922 } from '../tests/MOB.922_Tag_Lookup_Outcomes';
import { mob931 } from '../tests/MOB.931_Map_Card_Asset_Not_Found';
import { mob923 } from '../tests/MOB.923_Note_Save_Rejected';
import { mob924 } from '../tests/MOB.924_Form_Attach_Rejected';

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

  test('MOB.931_Map_Card_Asset_Not_Found', async ({ browser }) => {
    const page = await freshSession(browser, { touch: true });
    try {
      await mob931(page);
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

  // Bugs §11 pin, last in the suite: "Form added" is shown for a form the server refused. That symptom — and only
  // that — is EXPECTED; when §11 is fixed nothing is thrown and the test is simply green.
  test('MOB.924_Form_Attach_Rejected', async ({ browser }) => {
    const page = await freshSession(browser);
    try {
      const { formAddedShown } = await mob924(page);
      if (formAddedShown) {
        test.fail(true, 'bugs §11: "Form added" is shown before the save is sent');
        throw new Error('bugs §11: "Form added" was shown for a form the server refused');
      }
    } finally {
      await page.context().close();
    }
  });
});
