// MOB.936_Collector_HEIC_Photo — written for Playwright (not converted from Datadog).
//
// iPhones take photos as HEIC. The Docs tab refuses one (`MOB.933` — it is `image/*`), but a saved asset's Photos
// `Add Photo` takes `image/*` (`ui/PhotoCarousel/AddPhotoOptions.tsx:55`), so a HEIC gets in there. In a browser the
// file goes up by tus as it is — the app makes no thumbnail (`DetailPage/utils/uploadPhoto.ts:86-111`) — and the slide
// shows the server's `/api/attachment/<id>` image. Chrome cannot decode HEIC itself, so whether the slide shows a
// picture depends on what the server serves for it — measured 2026-09-24: it serves the HEIC as it is, and the slide's
// image has `naturalWidth` 0 (a broken image). Not asserted: that is a bug candidate the owner has not filed. The suite
// logs the width.
//
// The file is a real 96×96 HEIC (`e2e/fixtures/uploads/gradient.heic`, made with macOS `sips`). The upload is this
// run's own, on the `DD SYNTHETIC MOBILE` asset the attachment tests use, and deleted at the end (owner, 2026-09-23).
import path from 'path';
import fs from 'fs';
import { expect, Locator, Page } from '@playwright/test';
import { runId } from '../../support/env';
import { appUrl, serverRead } from '../support/session';

/** A slide's gear, scrolled to the middle first: the collector's floating `+` button sits over the bottom of the
 *  screen, and a gear left there takes no click. */
async function gearOf(slide: Locator): Promise<Locator> {
  const gear = slide.locator('[aria-label="Settings"]');
  await gear.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  return gear;
}

const ASSETS = 'query($p: TableQuery) { assets(params: $p) { edges { id name attachments { id fileName fileType } } } }';
const HEIC = fs.readFileSync(path.join(__dirname, '..', '..', 'fixtures', 'uploads', 'gradient.heic'));
type Att = { id: string; fileName: string; fileType: string | null };

async function attachmentsOf(page: Page, name: string): Promise<Att[]> {
  const edges = (await serverRead(page, ASSETS,
    { p: { limit: 50, query: { connector: 'AND', conditions: [{ column: 'name', operator: 'CONTAINS', value: name }] } } }))
    .assets.edges.filter((a: { name: string }) => a.name === name);
  expect(edges.length, `exactly one asset is named "${name}"`).toBe(1);
  return edges[0].attachments;
}

/** Returns what the slide's image did: its natural width once loaded (0 = the browser could not show it). */
export async function mob936(page: Page): Promise<{ naturalWidth: number }> {
  const photoName = `DD936-${runId('numeric', 8)}.heic`;

  await page.goto(appUrl('asset-collector'), { waitUntil: 'load' });
  const row = page.locator('.mantine-Accordion-item')
    .filter({ has: page.locator('.mantine-Accordion-control', { hasText: /DD SYNTHETIC MOBILE \d{8}/ }) }).first();
  await expect(row, "PREMISE: a DD SYNTHETIC MOBILE asset is in the collected list (MOB.600's residue)").toBeVisible({ timeout: 60_000 });
  const name = ((await row.locator('.mantine-Accordion-control').innerText()).match(/DD SYNTHETIC MOBILE \d{8}/) ?? [])[0]!;
  const before = (await attachmentsOf(page, name)).map((a) => a.id).sort();

  let naturalWidth = -1;
  try {
    await row.locator('.mantine-Accordion-chevron').first().click();
    await row.getByRole('tab', { name: 'Photos', exact: true }).click();
    await row.getByRole('button', { name: 'Add Photo' }).click();
    await expect(page.getByText('Select Photo Source'), 'the photo picker opened').toBeVisible({ timeout: 30_000 });
    await page.locator('input[type="file"]:not([capture])').first()
      .setInputFiles({ name: photoName, mimeType: 'image/heic', buffer: HEIC });
    await expect(page.getByText('Select Photo Source'), 'the picker took the HEIC and closed').toHaveCount(0, { timeout: 30_000 });

    let ours: Att | undefined;
    await expect.poll(async () => {
      ours = (await attachmentsOf(page, name)).find((a) => !before.includes(a.id) && a.fileName === photoName);
      return ours?.fileType ?? null;
    }, { message: 'the server holds the HEIC, as an image', timeout: 90_000 }).toBe('image/heic');

    const img = row.locator(`[class*="mantine-Carousel-slide"] img[src*="/api/attachment/${ours!.id}"]`);
    await expect(img, 'the HEIC has a slide').toHaveCount(1, { timeout: 60_000 });
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete), { timeout: 30_000 }).toBe(true);
    naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
    await page.screenshot({ path: 'results/MOB.936-slide.png' });

    const slide = row.locator('[class*="mantine-Carousel-slide"]')
      .filter({ has: page.locator(`img[src*="/api/attachment/${ours!.id}"]`) }); // `has` is relative to the slide
    await (await gearOf(slide)).click();
    await page.locator('.mantine-Menu-item', { hasText: 'Delete Photo' }).first().click();
    await page.locator('.mantine-Modal-content').filter({ hasText: 'Are you sure you want to delete' })
      .getByRole('button', { name: 'Yes' }).click();
    await expect.poll(async () => (await attachmentsOf(page, name)).some((a) => a.id === ours!.id),
      { message: 'our HEIC is deleted from the server', timeout: 60_000 }).toBe(false);
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.936-failure.png' }).catch(() => undefined);
    const left = (await attachmentsOf(page, name)).filter((a) => !before.includes(a.id));
    throw new Error(`${(err as Error).message}\n  left on the asset: ${left.map((a) => `${a.fileName} (${a.id})`).join(', ') || 'nothing'}`);
  }
  const after = (await attachmentsOf(page, name)).map((a) => a.id).sort();
  expect(after, "the asset's attachments are exactly as before").toEqual(before);
  return { naturalWidth };
}
