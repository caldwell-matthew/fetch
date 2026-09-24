import { test } from '@playwright/test';
import { freshSession, appUrl } from '../support/session';

// How does the Asset schema appear in the persisted cache? Read-only.
test('schema key', async ({ browser }) => {
  const page = await freshSession(browser);
  await page.goto(appUrl('asset-lookup'), { waitUntil: 'load' });
  await page.waitForTimeout(8000);
  const hits = await page.evaluate(() => new Promise<string[]>((resolve) => {
    const open = indexedDB.open('mentor_apm');
    open.onsuccess = () => {
      const db = open.result; const store = db.objectStoreNames[0];
      const req = db.transaction(store).objectStore(store).get('apollo-cache-persist');
      req.onsuccess = () => {
        const v = req.result; const t = typeof v === 'string' ? v : JSON.stringify(v);
        const out: string[] = [`type=${typeof v} len=${t.length}`];
        let i = -1; while ((i = t.indexOf('_info(', i + 1)) >= 0 && out.length < 8) out.push(t.slice(i, i + 40));
        resolve(out);
      };
    };
  }));
  console.log(hits.join('\n'));
  await page.context().close();
});
