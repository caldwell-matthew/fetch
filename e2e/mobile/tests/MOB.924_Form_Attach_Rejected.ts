// MOB.924_Form_Attach_Rejected — written for Playwright (not converted from Datadog). Pins bugs §11.
//
// `Forms/AdHocForm.tsx:49` shows "Form added" BEFORE it sends the mutation, so a user is told the form was added
// even when the server refuses it (bugs §11). The browser answers `CREATE_WORKSTAGE_FORM` with an error, so dev
// never receives it; a server read before and after proves no form was attached.
//
// On work order `20260910-16`, where MOB.364 attaches forms — never the main fixture. If the refusal did not
// happen, a real form would be attached: the server read fails loudly rather than leave it unnoticed.
import { expect, Page } from '@playwright/test';
import { failOperation } from '../../support/network';
import { appUrl, FORMS_WO, serverRead } from '../support/session';

const FORMS = 'query($id: ID!) { workStage(id: $id) { forms { id } } }';
const REJECTION = 'DD SYNTHETIC 924: the test refused this form';

/** Returns whether "Form added" was shown for the refused save — true while bugs §11 is open. */
export async function mob924(page: Page): Promise<{ formAddedShown: boolean }> {
  const before = (await serverRead(page, FORMS, { id: FORMS_WO })).workStage.forms.length;

  await page.goto(appUrl(`work/${FORMS_WO}`), { waitUntil: 'load' });
  await expect(page.getByText('Status:').first()).toBeVisible({ timeout: 60_000 });
  await page.locator('xpath=//*[@role="tab"][contains(normalize-space(.), "Form")]').click();
  await page.locator('xpath=//button[normalize-space(.)="Add"]').click();
  await page.locator('xpath=//*[@id="formId"]').click();
  const option = page.getByRole('option').first();
  await expect(option, 'the picker offers a form').toBeVisible({ timeout: 30_000 });
  await option.click();

  const failing = await failOperation(page, { operation: 'CREATE_WORKSTAGE_FORM' },
    { kind: 'graphql', message: REJECTION });
  let formAddedShown = false;
  try {
    await page.locator('xpath=//button[@form="adhoc-form"]').click();
    await expect(page.getByText(REJECTION), 'the server\'s refusal reaches the user').toBeVisible({ timeout: 30_000 });
    expect(failing.hits, 'the form mutation really was refused (not a vacuous pass)').toBeGreaterThan(0);
    formAddedShown = (await page.getByText('Form added').count()) > 0;
  } finally {
    await failing.stop();
  }

  const after = (await serverRead(page, FORMS, { id: FORMS_WO })).workStage.forms.length;
  expect(after, 'the server attached no form (if this fails, a real form was added — remove it)').toBe(before);
  return { formAddedShown };
}
