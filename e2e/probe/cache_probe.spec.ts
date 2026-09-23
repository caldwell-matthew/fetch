import { test, Page } from '@playwright/test';
import { globals } from '../support/env';
import { login } from '../support/login';

// Does the persisted Apollo cache still hold the equipment lookup after the full page load that
// MOB.350 does (from /work to a work order)? Read-only: nothing is submitted.
const readPersisted = (page: Page) => page.evaluate(() => new Promise<{ len: number; equip: boolean; lookups: number }>((resolve) => {
  const open = indexedDB.open('mentor_apm');
  open.onsuccess = () => {
    try {
      const db = open.result;
      const store = db.objectStoreNames[0];
      const req = db.transaction(store).objectStore(store).get('apollo-cache-persist');
      req.onsuccess = () => {
        const v = typeof req.result === 'string' ? req.result : JSON.stringify(req.result ?? '');
        resolve({ len: v.length, equip: v.includes('mobileEquipment'), lookups: (v.match(/lookupsForType/g) || []).length });
      };
      req.onerror = () => resolve({ len: -1, equip: false, lookups: 0 });
    } catch { resolve({ len: -2, equip: false, lookups: 0 }); }
  };
  open.onerror = () => resolve({ len: -3, equip: false, lookups: 0 });
}));

test('persisted cache across the reload MOB.350 makes', async ({ browser }) => {
  test.setTimeout(15 * 60_000);
  const page = await (await browser.newContext({ viewport: { width: 768, height: 1020 } })).newPage();
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || /persist|cache|indexeddb/i.test(m.text())) errors.push(m.text().slice(0, 160)); });
  await login(page);
  const base = globals.MOBDEV.replace(/\/$/, '');
  await page.goto(`${base}/work`);
  const t0 = Date.now();
  for (;;) {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    const busy = ['Retrieving assigned work', 'workstages found', 'workstages downloaded'].some((p) => body.includes(p));
    if (!busy && Date.now() - t0 > 20_000) break;
    if (Date.now() - t0 > 400_000) { console.log('  /work never finished'); break; }
    await page.waitForTimeout(2000);
  }
  console.log(`  /work finished loading at ${Math.round((Date.now() - t0) / 1000)}s`);
  for (const wait of [0, 5, 15]) {
    await page.waitForTimeout(wait * 1000);
    console.log(`  BEFORE reload +${wait}s:`, JSON.stringify(await readPersisted(page)));
  }
  await page.goto(`${base}/work/EYRpYJ9QYdQ1JFF10JtB0Q`);
  await page.waitForTimeout(8000);
  console.log('  AFTER reload onto the work order:', JSON.stringify(await readPersisted(page)));
  console.log('  console errors / persist messages:', errors.slice(-6));
  await page.context().close();
});
