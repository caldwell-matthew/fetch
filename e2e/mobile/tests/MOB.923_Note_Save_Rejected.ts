// MOB.923_Note_Save_Rejected — written for Playwright (not converted from Datadog).
//
// What does a user see when the server REJECTS a save? The note form (`ui/NewItemForm.tsx`) hands the save to
// `addToCollection`, which sends the mutation without waiting for it; the form's `.then` then shows "Item added"
// (`NewItemForm.tsx:89`). So "Item added" may appear for a note the server refused. The app's error link shows
// the server's message as a toast that stays until dismissed.
//
// The browser answers the note mutation (`ADD_JOB_NOTE_TO_WORKSTAGE`) with an error, so dev never receives it —
// and a server read before and after proves no note was saved. Asserted: the error reaches the user, and the
// refused note does not stay on screen. "Item added" appearing too is bugs §48: the suite expects that symptom
// and no other, so the test goes green by itself when §48 is fixed.
import { expect, Page } from '@playwright/test';
import { failOperation } from '../../support/network';
import { runId } from '../../support/env';
import { appUrl, FIXTURE_WO, serverRead } from '../support/session';

const NOTES = 'query($id: ID!) { workStage(id: $id) { jobNotes { id } } }';
const REJECTION = 'DD SYNTHETIC 923: the test refused this note';

export async function mob923(page: Page): Promise<{ itemAddedShown: boolean }> {
  const marker = `DD SYNTHETIC MOBILE 923 ${runId('numeric', 8)}`;
  const before = (await serverRead(page, NOTES, { id: FIXTURE_WO })).workStage.jobNotes.length;

  await page.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
  await expect(page.getByText('Status:').first()).toBeVisible({ timeout: 60_000 });
  await page.locator('xpath=//*[@role="tab"][contains(normalize-space(.), "Notes")]').click();
  await page.locator('xpath=//button[normalize-space(.)="Add"]').click();
  const editor = page.locator('xpath=//div[@contenteditable="true"]');
  await editor.click();
  await editor.pressSequentially(marker);

  const failing = await failOperation(page, { operation: 'ADD_JOB_NOTE_TO_WORKSTAGE' },
    { kind: 'graphql', message: REJECTION });
  let itemAddedShown = false;
  try {
    await page.locator('xpath=//button[@form="work-collection-form"]').click();
    await expect(page.getByText(REJECTION), 'the server\'s refusal reaches the user').toBeVisible({ timeout: 30_000 });
    expect(failing.hits, 'the note mutation really was refused (not a vacuous pass)').toBeGreaterThan(0);
    itemAddedShown = (await page.getByText('Item added').count()) > 0;
  } finally {
    await failing.stop();
  }

  // The optimistic card must not survive the refusal.
  await expect(page.getByText(marker), 'the refused note is not left on screen').toHaveCount(0, { timeout: 15_000 });
  const after = (await serverRead(page, NOTES, { id: FIXTURE_WO })).workStage.jobNotes.length;
  expect(after, 'and the server holds no new note').toBe(before);
  return { itemAddedShown };
}
