// MOB.943_AssetLookup_Tag_Keeps_Filters — written for Playwright (not converted from Datadog).
//
// Asset Lookup's list query carries the saved filters on the first load, paging and the search box
// (`AssetLookup/index.tsx:95-97,137-139,171-173`), but the Tag Lookup's two refetches pass `props.query` alone: a
// captured tag (`:194-198`) and the tag header's X (`:226-229`) — bugs §51. With a filter set, the tag search runs over
// every asset and the X shows the whole list, while the chip and `Filters (1)` stay on screen.
//
// A `Name contains ZZZZ-NO-SUCH-ASSET` filter (it matches nothing) is set through the Filters drawer (MOB.820's path);
// a tag is captured with the AI answered in the browser (MOB.922's way — nothing leaves the browser but the list
// reads); then the tag is cleared with its X. What each list request SENT is recorded. Asserted: the filter applied
// (0 rows), the capture and the X each re-queried, the pill still counts the filter. RETURNED for the suite's §51 pin:
// whether the capture and the X dropped the filter. Reads only.
import { expect, Page } from '@playwright/test';
import { appUrl } from '../support/session';

const NOMATCH = 'ZZZZ-NO-SUCH-ASSET';
const TAG = '0'; // a CONTAINS match for many tags, so the dropped filter shows as rows
const PHOTO = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
type Cond = { column: string; operator: string; value: unknown };

export async function mob943(page: Page): Promise<{ captureDropsFilter: boolean; clearDropsFilter: boolean }> {
  const sent: Cond[][] = [];
  page.on('request', (r) => {
    if (!r.url().endsWith('/graphql') || r.method() !== 'POST') return;
    try {
      const b = r.postDataJSON();
      if (b?.operationName === 'MOBILE_ASSET_LOOKUP') sent.push(b.variables?.params?.query?.conditions ?? []);
    } catch { /* not JSON */ }
  });
  let asked = 0;
  await page.route('**/api/upload/ai', (route) => { asked++; return route.fulfill({ json: { isTag: true, isReadable: true, data: TAG } }); });
  const hasFilter = (c: Cond[]) => c.some((x) => x.column === 'name' && x.value === NOMATCH);
  const rows = page.locator('.mantine-Accordion-item');
  const pill = page.getByText('Filters (1)');

  try {
    await page.goto(appUrl('asset-lookup'), { waitUntil: 'load' });
    await expect(rows.first(), 'the first list arrived').toBeVisible({ timeout: 60_000 });

    // the filter, through the drawer (its selects sometimes swallow the first click — retry until the option shows)
    await expect(async () => {
      await page.locator('button.asset-lookup-filter-button').click();
      await expect(page.getByRole('button', { name: 'Add Filter' })).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
    await expect(async () => {
      await page.locator('#fieldId').click();
      await page.getByRole('option', { name: 'Name', exact: true }).click({ timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
    await expect(async () => {
      await page.locator('#operator').click();
      await page.getByRole('option', { name: 'contains', exact: true }).click({ timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
    await page.locator('#value').fill(NOMATCH);
    await page.getByRole('button', { name: 'Add Filter' }).click();
    await page.keyboard.press('Escape');
    await expect(pill, 'the filter is active').toBeVisible({ timeout: 15_000 });
    await expect(rows, 'and applied: nothing matches it').toHaveCount(0, { timeout: 30_000 });
    expect(sent.some(hasFilter), 'the list was asked with the filter').toBe(true);

    // capture a tag
    const beforeCapture = sent.length;
    const chooser = page.waitForEvent('filechooser', { timeout: 15_000 });
    await page.getByRole('button', { name: 'Tag Lookup' }).click();
    await page.getByRole('menuitem', { name: 'Alphanumeric' }).click();
    await (await chooser).setFiles({ name: 'tag.png', mimeType: 'image/png', buffer: PHOTO });
    const header = page.locator('p, h1, h2, h3, h4', { hasText: new RegExp(`for tag number\\s*${TAG}`) }).first();
    await expect(header, 'the tag search ran').toBeVisible({ timeout: 30_000 });
    expect(asked, 'the photo went to the AI route, answered by the test').toBe(1);
    await expect.poll(() => sent.length, { message: 'the capture re-queried the list', timeout: 15_000 }).toBeGreaterThan(beforeCapture);
    const capture = sent[sent.length - 1];
    expect(capture.some((c) => c.column === 'tagNumber'), 'the re-query searched the tag').toBe(true);
    await expect(pill, 'the pill still counts the filter').toBeVisible();

    // clear it with the tag header's X (`TagLookup/index.tsx:103-120`) — not the filter chip's
    const beforeClear = sent.length;
    await header.locator('button').click();
    await expect(header, 'the X cleared the tag search').toHaveCount(0, { timeout: 15_000 });
    await expect.poll(() => sent.length, { message: 'the X re-queried the list', timeout: 15_000 }).toBeGreaterThan(beforeClear);
    const clear = sent[sent.length - 1];
    await expect(pill, 'the pill still counts the filter').toBeVisible();
    await page.screenshot({ path: 'results/MOB.943-after-clear.png' });
    return { captureDropsFilter: !hasFilter(capture), clearDropsFilter: !hasFilter(clear) };
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.943-failure.png' }).catch(() => undefined);
    throw err;
  }
}
