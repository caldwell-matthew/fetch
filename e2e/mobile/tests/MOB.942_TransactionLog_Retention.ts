// MOB.942_TransactionLog_Retention — written for Playwright (not converted from Datadog).
//
// The Transaction Log reads the app's own record of every GraphQL operation, kept in the browser (IndexedDB
// `mentor_apm_transactions`, one store per user — `graphql/links/LoggingLink.ts:9-13`). At startup the app deletes
// entries more than 30 days old (`cleanUpLogs`, `:15-31`, called from `Layout/Auth.tsx:68`). Until build 123 it deleted
// none: the day count was reversed (`differenceInDays(timestamp, now)`, never above 30 for a past entry), and its
// `async` iterate callback returned a promise, which ends a localforage iteration after the first entry.
//
// The test writes four entries straight into the user's store — 31, 45 and 400 days old, and one 29 days old — then
// reloads: the three old ones are gone from the store, the 29-day one is kept, and the Transaction Log lists it and
// not them. Everything happens in this test's own browser; nothing is sent to dev.
import { expect, Page } from '@playwright/test';
import { appUrl } from '../support/session';

const DB = 'mentor_apm_transactions';
const DAY = 86_400_000;
const ENTRIES = [
  { key: 'DD942-old-31', op: 'DD942_OLD_31', days: 31 },
  { key: 'DD942-old-45', op: 'DD942_OLD_45', days: 45 },
  { key: 'DD942-old-400', op: 'DD942_OLD_400', days: 400 },
  { key: 'DD942-young-29', op: 'DD942_YOUNG_29', days: 29 },
];

/** The keys of ours still in the user's store. */
async function oursInStore(page: Page): Promise<string[]> {
  return page.evaluate(async (db) => {
    const store = String((window as unknown as { __mentorapm: { userId: string } }).__mentorapm.userId);
    const conn = await new Promise<IDBDatabase>((ok, ko) => { const r = indexedDB.open(db); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
    try {
      const keys = await new Promise<IDBValidKey[]>((ok, ko) => {
        const r = conn.transaction(store, 'readonly').objectStore(store).getAllKeys();
        r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error);
      });
      return keys.map(String).filter((k) => k.startsWith('DD942-')).sort();
    } finally { conn.close(); }
  }, DB);
}

export async function mob942(page: Page): Promise<void> {
  try {
    await page.goto(appUrl(''), { waitUntil: 'load' });
    await expect(page.locator('button[aria-label="Toggle navigation"]')).toBeVisible({ timeout: 60_000 });

    // Seed the store the app created for this user. Values are what `LoggingLink` writes, `timestamp` a real Date
    // (IndexedDB keeps it one — `cleanUpLogs` requires `isDate`).
    await page.evaluate(async ({ db, entries, day }) => {
      const w = window as unknown as { __mentorapm: { userId: string } };
      const store = String(w.__mentorapm.userId);
      const conn = await new Promise<IDBDatabase>((ok, ko) => { const r = indexedDB.open(db); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
      try {
        if (!conn.objectStoreNames.contains(store)) throw new Error(`no store "${store}" in ${db}`);
        const tx = conn.transaction(store, 'readwrite');
        for (const e of entries) {
          const at = new Date(Date.now() - e.days * day);
          tx.objectStore(store).put({ transactionId: null, op: e.op, userId: store, url: '/apm-mobile/work', variables: {},
            error: null, timestamp: at, completed: at }, e.key);
        }
        await new Promise<void>((ok, ko) => { tx.oncomplete = () => ok(); tx.onerror = () => ko(tx.error); });
      } finally { conn.close(); }
    }, { db: DB, entries: ENTRIES, day: DAY });
    expect(await oursInStore(page), 'PREMISE: all four entries are in the store').toEqual(ENTRIES.map((e) => e.key).sort());

    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('button[aria-label="Toggle navigation"]')).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => oursInStore(page), { message: 'startup deleted exactly the entries over 30 days old', timeout: 30_000 })
      .toEqual(['DD942-young-29']);

    await page.goto(appUrl('transactions'), { waitUntil: 'load' });
    await expect(page.locator('#page-title h4', { hasText: 'Transaction Log' })).toBeVisible({ timeout: 30_000 });
    await page.getByPlaceholder('Search for things').fill('DD942');
    await expect(page.getByText('DD942_YOUNG_29'), 'the log lists the 29-day-old entry').toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/DD942_OLD_/), 'and none of the old ones').toHaveCount(0);
    await expect(page.locator('tbody tr'), 'exactly one row matches "DD942"').toHaveCount(1);
    await page.screenshot({ path: 'results/MOB.942-log.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.942-failure.png' }).catch(() => undefined);
    throw err;
  }
}
