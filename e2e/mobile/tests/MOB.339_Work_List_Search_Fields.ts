// MOB.339_Work_List_Search_Fields — written for Playwright (not converted from Datadog).
//
// The work list's search matches a stage on any of five fields — its number `_workSequence`, `name`, `_assets`,
// `address` and `desc` (`WorkOrders/index.tsx:176-186`). MOB.343 proves the search filters (a term nothing matches
// empties the list); this proves each field FINDS a work order. The fixture `20260805-18-001` holds a different value
// in each, so each term below matches it through exactly one field — read from the server first, so a changed fixture
// fails the premise rather than passing on another field. Reads only.
import { expect, Page } from '@playwright/test';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';
import { appUrl, FIXTURE_WO, serverRead } from '../support/session';

type Field = '_workSequence' | 'name' | '_assets' | 'address' | 'desc';
const FIELDS: Field[] = ['_workSequence', 'name', '_assets', 'address', 'desc'];
// One term per field, each in that field of the fixture and in none of its other four.
const TERMS: Record<Field, string> = {
  _workSequence: '20260805-18',
  name: 'do not touch',
  _assets: 'pump 0102',
  address: 'north alexander',
  desc: 'datadog fixture',
};

export async function mob339(page: Page): Promise<void> {
  const stage = (await serverRead(page, `query($id: ID!) { workStage(id: $id) { ${FIELDS.join(' ')} } }`, { id: FIXTURE_WO })).workStage;
  for (const field of FIELDS) {
    const holds = FIELDS.filter((f) => (stage[f] ?? '').toLocaleLowerCase().includes(TERMS[field]));
    expect(holds, `PREMISE: "${TERMS[field]}" is in the fixture's ${field} and no other field`).toEqual([field]);
  }
  const seq: string = stage._workSequence;

  await page.goto(appUrl('work'), { waitUntil: 'load' });
  await expect(page.locator('#page-title h4', { hasText: 'Work Orders' })).toBeVisible({ timeout: 60_000 });
  await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
  const search = page.locator('input[placeholder="Find Workstage(s)"]');
  const fixtureRow = page.locator('.mantine-Paper-root').filter({ hasText: seq }).first();
  try {
    for (const field of FIELDS) {
      await search.fill(TERMS[field]);
      await expect(fixtureRow, `searching "${TERMS[field]}" (its ${field}) lists ${seq}`).toBeVisible({ timeout: 15_000 });
    }
    // A control: the same list, a term none of the five fields holds, and the fixture is gone.
    await search.fill('ZZQXJV0000');
    await expect(fixtureRow, 'a term nothing holds lists no fixture').toHaveCount(0, { timeout: 15_000 });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.339-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await search.fill('').catch(() => undefined);
  }
}
