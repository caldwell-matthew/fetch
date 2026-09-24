import { test, expect, Page } from '@playwright/test';
import { freshSession, appUrl, FIXTURE_WO, serverReadDirect } from '../support/session';
import { runId } from '../../support/env';

// Is "the synced note is gone after a reload" the app, or a reload that beat the cache's debounced write?
// Same flow as MOB.927, but waits after the sync and reads the PERSISTED cache before reloading. The note is
// deleted afterwards with MOB.361's named flow, in a fresh browser.
const Q = 'query($id: ID!) { workStage(id: $id) { jobNotes { id desc } } }';
const persisted = (page: Page, needle: string) => page.evaluate((needle) => new Promise<boolean>((resolve) => {
  const open = indexedDB.open('mentor_apm');
  open.onsuccess = () => {
    const db = open.result; const st = db.objectStoreNames[0];
    const req = db.transaction(st).objectStore(st).get('apollo-cache-persist');
    req.onsuccess = () => resolve(String(typeof req.result === 'string' ? req.result : JSON.stringify(req.result)).includes(needle));
  };
}), needle);

test('offline note after reload', async ({ browser }) => {
  test.setTimeout(8 * 60_000);
  const marker = `DD SYNTHETIC MOBILE 927 ${runId('numeric', 8)}`;
  const page = await freshSession(browser);
  const before = new Set((await serverReadDirect(page, Q, { id: FIXTURE_WO })).workStage.jobNotes.map((n: any) => n.id));
  const openNotes = async () => {
    await page.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
    await expect(page.getByText('Status:').first()).toBeVisible({ timeout: 60_000 });
    await page.locator('xpath=//*[@role="tab"][contains(normalize-space(.), "Notes")]').click();
  };
  let noteId = '';
  try {
    await openNotes();
    await page.locator('xpath=//button[normalize-space(.)="Add"]').click();
    const editor = page.locator('xpath=//div[@contenteditable="true"]');
    await editor.click(); await editor.pressSequentially(marker);
    await page.context().setOffline(true);
    await page.locator('xpath=//button[@form="work-collection-form"]').click();
    await expect(page.getByText(marker).first()).toBeVisible({ timeout: 15_000 });
    await page.context().setOffline(false);
    await expect.poll(async () => {
      const n = (await serverReadDirect(page, Q, { id: FIXTURE_WO })).workStage.jobNotes.find((x: any) => (x.desc || '').includes(marker));
      noteId = n?.id ?? ''; return !!n;
    }, { timeout: 90_000 }).toBe(true);
    console.log('synced; real id', noteId);
    for (const s of [0, 5, 15]) {
      if (s) await page.waitForTimeout(s * 1000 - (s === 15 ? 5000 : 0));
      console.log(`  +${s}s after sync: on screen ${await page.getByText(marker).first().isVisible()} · persisted cache has real id ${await persisted(page, noteId)} · has marker ${await persisted(page, marker)}`);
    }
    await openNotes();
    const afterReload = await page.getByText(marker).first().waitFor({ timeout: 30_000 }).then(() => true, () => false);
    console.log('AFTER RELOAD (15s after sync): shown', afterReload);
    if (!afterReload) {
      await page.waitForTimeout(60_000);
      console.log('   …60s later, still on the same page: shown', await page.getByText(marker).first().isVisible());
      await openNotes();
      console.log('   …after a second reload: shown', await page.getByText(marker).first().waitFor({ timeout: 20_000 }).then(() => true, () => false));
    }
  } finally {
    await page.context().setOffline(false);
    await page.context().close();
    const clean = await freshSession(browser);
    const ours = (await serverReadDirect(clean, Q, { id: FIXTURE_WO })).workStage.jobNotes.filter((n: any) => (n.desc || '').includes(marker) && !before.has(n.id));
    if (ours.length === 1) {
      await clean.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
      await expect(clean.getByText('Status:').first()).toBeVisible({ timeout: 60_000 });
      await clean.locator('xpath=//*[@role="tab"][contains(normalize-space(.), "Notes")]').click();
      const card = clean.locator('.mantine-Paper-root').filter({ hasText: marker });
      await expect(card).toHaveCount(1, { timeout: 30_000 });
      await card.locator('[aria-label="Menu"]').click();
      await clean.locator('.mantine-Menu-item', { hasText: 'Delete Item' }).first().click();
      await clean.locator('.mantine-Modal-content', { hasText: 'Are you sure you want to delete this record?' }).getByRole('button', { name: 'Yes' }).click();
      await expect.poll(async () => (await serverReadDirect(clean, Q, { id: FIXTURE_WO })).workStage.jobNotes.some((n: any) => n.id === ours[0].id), { timeout: 30_000 }).toBe(false);
      console.log('cleaned up', ours[0].id);
    } else console.log('cleanup: found', ours.length, 'notes with the marker');
    await clean.context().close();
  }
});
