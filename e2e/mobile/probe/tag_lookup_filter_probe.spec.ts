// Read-only probe: does Asset Lookup's Tag Lookup keep the active filters — on capture, and on its X?
// A Name filter that matches nothing is set through the Filters drawer (MOB.820's path), a tag is "captured" with the AI
// answered in the browser (MOB.922's way), then cleared with the X. Every list request's filter conditions are
// recorded, and each state is screenshotted. Nothing is written.
import { expect, test } from '@playwright/test';
import { appUrl, freshSession } from '../support/session';

const NOMATCH = 'ZZZZ-NO-SUCH-ASSET';
const TAG = '0'; // a CONTAINS search many tags match
const PHOTO = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

test('tag lookup vs active filters', async ({ browser }) => {
  const page = await freshSession(browser);
  const sent: { at: string; conditions: unknown }[] = [];
  let phase = 'start';
  page.on('request', (r) => {
    if (!r.url().endsWith('/graphql') || r.method() !== 'POST') return;
    try {
      const b = r.postDataJSON();
      if (b?.operationName === 'MOBILE_ASSET_LOOKUP') sent.push({ at: phase, conditions: b.variables?.params?.query?.conditions });
    } catch { /* not JSON */ }
  });
  await page.route('**/api/upload/ai', (route) => route.fulfill({ json: { isTag: true, isReadable: true, data: TAG } }));

  await page.goto(appUrl('asset-lookup'), { waitUntil: 'load' });
  await expect(page.locator('.mantine-Accordion-item').first()).toBeVisible({ timeout: 60_000 });

  phase = 'filter';
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
  await page.waitForTimeout(2_000);
  await page.keyboard.press('Escape');
  await expect(page.getByText('Filters (1)')).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(6_000);
  console.log('FILTERED rows:', await page.locator('.mantine-Accordion-item').count());
  await page.screenshot({ path: 'results/probe-tag-1-filtered.png' });

  phase = 'capture';
  const chooser = page.waitForEvent('filechooser', { timeout: 15_000 });
  await page.getByRole('button', { name: 'Tag Lookup' }).click();
  await page.getByRole('menuitem', { name: 'Alphanumeric' }).click();
  await (await chooser).setFiles({ name: 'tag.png', mimeType: 'image/png', buffer: PHOTO });
  await page.waitForTimeout(8_000);
  console.log('AFTER CAPTURE rows:', await page.locator('.mantine-Accordion-item').count(),
    '· pill:', await page.getByText(/Filters \(\d\)/).allInnerTexts());
  await page.screenshot({ path: 'results/probe-tag-2-captured.png' });

  phase = 'clear';
  // the tag header's red X (`TagLookup/index.tsx:113-120`) — NOT the filter chip's
  await page.locator('p', { hasText: /results? for tag number/ }).locator('button').click();
  await page.waitForTimeout(8_000);
  console.log('AFTER X rows:', await page.locator('.mantine-Accordion-item').count(),
    '· pill:', await page.getByText(/Filters \(\d\)/).allInnerTexts());
  await page.screenshot({ path: 'results/probe-tag-3-cleared.png' });

  for (const s of sent) console.log('SENT', s.at, JSON.stringify(s.conditions));
  await page.context().close();
});
