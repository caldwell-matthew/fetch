import { test, Page } from '@playwright/test';
import { globals } from '../../support/env';
import { login } from '../support/login';
import { click, typeText, assertPageLacks } from '../../support/dd';

// MOB.350's path up to the equipment picker, then: what does the picker offer, and is the cached
// `mobileEquipment` lookup COMPLETE for the query that reads it? Read-only — the form is closed
// without submitting.
const QUERY_FIELDS = ['id', 'name', 'filterType', 'desc', 'meta'];

const inspectCache = (page: Page) => page.evaluate((fields) => new Promise<object>((resolve) => {
  const open = indexedDB.open('mentor_apm');
  open.onsuccess = () => {
    const db = open.result;
    const store = db.objectStoreNames[0];
    const req = db.transaction(store).objectStore(store).get('apollo-cache-persist');
    req.onsuccess = () => {
      const raw = req.result;
      const c = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const root = c.ROOT_QUERY || {};
      const keys = Object.keys(root).filter((k) => k.startsWith('lookupsForType'));
      const key = keys.find((k) => k.includes('mobileEquipment'));
      if (!key) return resolve({ lookupKeys: keys.length, mobileEquipment: 'ABSENT from ROOT_QUERY' });
      const list = root[key] || [];
      const deref = (v: any) => (v && v.__ref ? c[v.__ref] : v);
      let complete = 0; const problems: string[] = []; let ac: any = null;
      for (const item of list) {
        const e = deref(item);
        const missing = fields.filter((f) => !(f in (e || {})));
        const meta = deref(e?.meta);
        if (meta?.__typename === 'Equipment') {
          if (!('cost' in meta)) missing.push('meta.cost');
          const uom = deref(meta.unitOfMeasure);
          if (meta.unitOfMeasure && (!uom || !('name' in uom))) missing.push('meta.unitOfMeasure.name');
        }
        if (missing.length) { if (problems.length < 5) problems.push(`${e?.name ?? item.__ref}: missing ${missing.join(', ')}`); }
        else complete++;
        if (e?.name === 'AC Adapter') ac = { entity: item.__ref ?? '(embedded)', e, meta };
      }
      resolve({ key, items: list.length, complete, incomplete: list.length - complete, problems, acAdapter: ac });
    };
  };
}), QUERY_FIELDS);

test('what the equipment picker sees', async ({ browser }) => {
  test.setTimeout(15 * 60_000);
  const page = await (await browser.newContext({ viewport: { width: 768, height: 1020 } })).newPage();
  await login(page);
  const base = globals.MOBDEV.replace(/\/$/, '');
  await page.goto(`${base}/work`);
  await page.waitForTimeout(20_000);
  await assertPageLacks(page, 'Retrieving assigned work', 60_000);
  await assertPageLacks(page, 'workstages found', 60_000);
  await assertPageLacks(page, 'workstages downloaded', 360_000);
  console.log('  /work fully loaded');
  console.log('  CACHE on /work:', JSON.stringify(await inspectCache(page)).slice(0, 900));

  await page.goto(`${base}/work/EYRpYJ9QYdQ1JFF10JtB0Q`, { waitUntil: 'load' });
  await page.waitForTimeout(5000);
  await click(page, `//*[@role="tab"][contains(normalize-space(.), "Equipment")]`);
  await page.waitForTimeout(2000);
  await click(page, `//button[normalize-space(.)="Add"]`);
  await page.waitForTimeout(2000);
  await click(page, `//*[@id="equipmentId"]`);
  await typeText(page, `//*[@id="equipmentId"]`, 'AC Adapter');
  await page.waitForTimeout(3000);
  const options = await page.locator('[role="option"]').allInnerTexts();
  const empty = await page.getByText('No results found').count();
  console.log(`  PICKER after typing "AC Adapter": ${options.length} option(s) ${JSON.stringify(options.slice(0, 5))}, "No results found" shown: ${empty > 0}`);
  console.log('  CACHE on the work order:', JSON.stringify(await inspectCache(page)).slice(0, 900));
  await page.keyboard.press('Escape');
  await page.context().close();
});
