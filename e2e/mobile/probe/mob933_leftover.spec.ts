import { expect, Locator, test } from '@playwright/test';
import { appUrl, freshSession, serverRead } from '../support/session';

/** A slide's gear, scrolled to the middle first: the collector's floating `+` button sits over the bottom of the
 *  screen, and a gear left there takes no click. */
async function gearOf(slide: Locator): Promise<Locator> {
  const gear = slide.locator('[aria-label="Settings"]');
  await gear.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  return gear;
}

// Delete what a failed MOB.933–MOB.936 left on a DD SYNTHETIC MOBILE asset — only files named `DD93[3-6]-<8 digits>…`,
// each through the app's own control (the owner's named flow: those runs' own uploads, 2026-09-23):
//   a photo — its slide's `Delete Photo`; a video — its slide's `Delete Video`; a file — its row ticked alone, `Delete File(s)`.
const ASSETS = 'query($p: TableQuery) { assets(params: $p) { edges { id name attachments { id fileName fileType } } } }';
const P = { p: { limit: 50, query: { connector: 'AND', conditions: [{ column: 'name', operator: 'CONTAINS', value: 'DD SYNTHETIC MOBILE' }] } } };
const OURS = /^DD93[3-6]-\d{8}(-\d)?\.\w+$/;

test('mob933-935 leftovers', async ({ browser }) => {
  test.setTimeout(6 * 60_000);
  const page = await freshSession(browser);
  try {
    const hits = (await serverRead(page, ASSETS, P)).assets.edges.flatMap((a: any) =>
      a.attachments.filter((x: any) => OURS.test(x.fileName ?? '')).map((x: any) => ({ asset: a.name, ...x })));
    console.log(`leftovers: ${hits.map((h: any) => `${h.asset} · ${h.fileName}`).join(', ') || 'none'}`);
    for (const h of hits) {
      await page.goto(appUrl('asset-collector'), { waitUntil: 'load' });
      const row = page.locator('.mantine-Accordion-item')
        .filter({ has: page.locator('.mantine-Accordion-control', { hasText: h.asset }) }).first();
      await expect(row).toBeVisible({ timeout: 60_000 });
      await row.locator('.mantine-Accordion-chevron').first().click();
      const type: string = h.fileType ?? '';
      if (type.startsWith('image') || type.startsWith('video')) {
        await row.getByRole('tab', { name: 'Photos', exact: true }).click();
        const video = type.startsWith('video');
        const slide = row.locator('[class*="mantine-Carousel-slide"]').filter({
          has: video ? page.getByRole('button', { name: `Play ${h.fileName}`, exact: true })
            : page.locator(`img[src*="/api/attachment/${h.id}"]`),
        });
        await expect(slide).toHaveCount(1, { timeout: 30_000 });
        await (await gearOf(slide)).click();
        await page.locator('.mantine-Menu-item', { hasText: video ? 'Delete Video' : 'Delete Photo' }).first().click();
        await page.locator('.mantine-Modal-content').filter({ hasText: 'Are you sure you want to delete' })
          .getByRole('button', { name: 'Yes' }).click();
      } else {
        await row.getByRole('tab', { name: 'Docs', exact: true }).click();
        const tr = row.locator('table tbody tr').filter({ hasText: h.fileName });
        await expect(tr).toHaveCount(1, { timeout: 30_000 });
        await tr.getByRole('checkbox').check();
        await expect(row.locator('table').getByRole('checkbox', { checked: true })).toHaveCount(1);
        await row.locator('table thead [aria-label="Menu"]').click();
        await page.getByRole('menuitem', { name: 'Delete File(s)' }).click();
      }
      await expect.poll(async () => (await serverRead(page, ASSETS, P)).assets.edges
        .some((a: any) => a.attachments.some((x: any) => x.id === h.id)), { timeout: 60_000 }).toBe(false);
      console.log(`removed ${h.fileName}`);
    }
  } catch (err) {
    await page.screenshot({ path: 'results/mob933-leftover-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.context().close();
  }
});
