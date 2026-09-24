// MOB.927_Offline_Note_Syncs — written for Playwright (not converted from Datadog).
//
// The mobile app is built to work offline: a change made without a connection is queued (`queueLink`, persisted
// so it survives a reload) and sent when the connection returns. Datadog could not take its browser offline, so the
// existing offline tests prove only the offline SCREENS and messages. This one proves the queue end to end:
//
//   online   open the note form (so its schema is cached), type a marked note
//   offline  save it — the note shows at once, and the SERVER does not have it
//   online   the queued save goes out — the server now has exactly this note, the device still shows it, and
//            it survives a reload once the app has written it to its persisted cache (trap 41)
//   cleanup  delete it with MOB.361's named flow: the gear's `Delete Item` on the ONE card carrying this run's
//            marker, only if the server did not hold that marker before (trap 2)
//
// Server reads go through Playwright's own client (`serverReadDirect`), which still works while the page is offline.
import { Browser, expect, Page } from '@playwright/test';
import { runId } from '../../support/env';
import { appUrl, FIXTURE_WO, freshSession, persistedCacheHas, serverReadDirect } from '../support/session';

const NOTES = 'query($id: ID!) { workStage(id: $id) { jobNotes { id desc name } } }';
type Note = { id: string; desc: string | null; name: string | null };

async function notes(page: Page): Promise<Note[]> {
  return (await serverReadDirect(page, NOTES, { id: FIXTURE_WO })).workStage.jobNotes;
}
const carries = (n: Note, marker: string) => `${n.desc ?? ''} ${n.name ?? ''}`.includes(marker);

async function openNotes(page: Page): Promise<void> {
  await page.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
  await expect(page.getByText('Status:').first()).toBeVisible({ timeout: 60_000 });
  await page.locator('xpath=//*[@role="tab"][contains(normalize-space(.), "Notes")]').click();
}

/** MOB.361's named delete, on this run's note only — in a FRESH browser, whose list is read from the server. */
async function deleteOurNote(browser: Browser, marker: string, before: Set<string>): Promise<void> {
  const page = await freshSession(browser);
  try {
    await deleteIn(page, marker, before);
  } finally {
    await page.context().close();
  }
}

async function deleteIn(page: Page, marker: string, before: Set<string>): Promise<void> {
  const ours = (await notes(page)).filter((n) => carries(n, marker) && !before.has(n.id));
  if (!ours.length) return;
  expect(ours.length, 'exactly one note carries this run\'s marker').toBe(1);
  await openNotes(page);
  const card = page.locator('.mantine-Paper-root').filter({ hasText: marker });
  await expect(card, 'one card carries this run\'s marker').toHaveCount(1, { timeout: 30_000 });
  await card.locator('[aria-label="Menu"]').click();
  await page.locator('.mantine-Menu-item', { hasText: 'Delete Item' }).first().click();
  await page.locator('.mantine-Modal-content', { hasText: 'Are you sure you want to delete this record?' })
    .getByRole('button', { name: 'Yes' }).click();
  await expect.poll(async () => (await notes(page)).map((n) => n.id).sort().join(','),
    { message: 'the server is back to the notes it held before the run', timeout: 30_000 })
    .toBe([...before].sort().join(','));
}

/** Proves the queue end to end, and that the synced note survives a reload on the device that made it. */
export async function mob927(page: Page, browser: Browser): Promise<void> {
  const marker = `DD SYNTHETIC MOBILE 927 ${runId('numeric', 8)}`;
  const beforeNotes = await notes(page);
  expect(beforeNotes.filter((n) => carries(n, marker)), 'PREMISE: no note carries this run\'s marker').toHaveLength(0);
  const before = new Set(beforeNotes.map((n) => n.id));

  try {
    // online: the form, and its schema, load
    await openNotes(page);
    await page.locator('xpath=//button[normalize-space(.)="Add"]').click();
    const editor = page.locator('xpath=//div[@contenteditable="true"]');
    await editor.click();
    await editor.pressSequentially(marker);

    // offline: save
    await page.context().setOffline(true);
    await expect.poll(() => page.evaluate(() => navigator.onLine), { message: 'the page knows it is offline' }).toBe(false);
    await page.locator('xpath=//button[@form="work-collection-form"]').click();
    await expect(page.getByText(marker).first(), 'the note shows at once, offline').toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(5_000);
    expect((await notes(page)).filter((n) => carries(n, marker)), 'the SERVER does not have it while offline')
      .toHaveLength(0);

    // online again: the queue sends it
    await page.context().setOffline(false);
    await expect.poll(async () => (await notes(page)).filter((n) => carries(n, marker)).length,
      { message: 'the queued note reaches the server once the connection is back', timeout: 90_000 }).toBe(1);
    await expect(page.getByText(marker).first(), 'the device still shows it after the sync').toBeVisible();

    // and it survives a reload, once the app has persisted it (trap 41: the write lags the change by a moment)
    await expect.poll(() => persistedCacheHas(page, marker),
      { message: 'the app writes the synced note to its persisted cache', timeout: 30_000 }).toBe(true);
    await openNotes(page);
    await expect(page.getByText(marker).first(), 'the note is still on this device after a reload').toBeVisible({ timeout: 30_000 });
  } finally {
    await page.context().setOffline(false);
    await deleteOurNote(browser, marker, before);
  }
}
