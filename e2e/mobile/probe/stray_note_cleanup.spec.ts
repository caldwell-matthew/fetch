import { test, expect } from '@playwright/test';
import { freshSession, appUrl, FIXTURE_WO, serverReadDirect } from '../support/session';

// Remove MOB.927's note left on the fixture by a failed cleanup, with MOB.361's named flow (gear → Delete Item →
// Yes) on the ONE card carrying that exact marker — and record whether a FRESH browser shows the synced note.
const MARKER = 'DD SYNTHETIC MOBILE 927 16918606';
const NOTE_ID = 'JZF4sIZ9UI0lUcEMBZwRFt';
test('clean up the stray MOB.927 note', async ({ browser }) => {
  test.setTimeout(3 * 60_000);
  const page = await freshSession(browser);
  const q = 'query($id: ID!) { workStage(id: $id) { jobNotes { id desc } } }';
  const ids = (await serverReadDirect(page, q, { id: FIXTURE_WO })).workStage.jobNotes.map((n: any) => n.id);
  expect(ids, 'the stray note is on the server').toContain(NOTE_ID);
  await page.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
  await expect(page.getByText('Status:').first()).toBeVisible({ timeout: 60_000 });
  await page.locator('xpath=//*[@role="tab"][contains(normalize-space(.), "Notes")]').click();
  const card = page.locator('.mantine-Paper-root').filter({ hasText: MARKER });
  await expect(card, 'a FRESH browser shows the synced note').toHaveCount(1, { timeout: 30_000 });
  console.log('FRESH BROWSER SHOWS THE NOTE: yes');
  await card.locator('[aria-label="Menu"]').click();
  await page.locator('.mantine-Menu-item', { hasText: 'Delete Item' }).first().click();
  await page.locator('.mantine-Modal-content', { hasText: 'Are you sure you want to delete this record?' })
    .getByRole('button', { name: 'Yes' }).click();
  await expect.poll(async () => (await serverReadDirect(page, q, { id: FIXTURE_WO })).workStage.jobNotes.map((n: any) => n.id),
    { timeout: 30_000 }).not.toContain(NOTE_ID);
  console.log('DELETED on the server:', NOTE_ID);
  await page.context().close();
});
