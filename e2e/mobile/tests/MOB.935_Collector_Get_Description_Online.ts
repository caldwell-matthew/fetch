// MOB.935_Collector_Get_Description_Online — written for Playwright (not converted from Datadog).
//
// A saved photo's menu offers `Get Description` (`AssetLookup/AssetLookupDetails/index.tsx:146-158`). It opens the
// Description editor for the asset (`EditForm.tsx`), whose MentorLens icon at once posts the photo's attachment id to
// `/api/upload/ai` with `prompt=NAME_PLATE` (`AssetCollector/Form/CaptureDescriptionIcon.tsx:12-24,46-60`) and
// APPENDS the answer to the description, enabling `Submit`. Datadog could only click it offline (MOB.914) — an
// online click is a billed AI call. Here the AI's answer is made in the BROWSER, so no AI call is made.
//
// The description is NOT saved: the editor is closed unsent, and a server read proves the asset's description
// unchanged. The photo it runs on is this run's own upload, deleted at the end (owner, 2026-09-23 — this run's
// uploads only, trap 2), on the `DD SYNTHETIC MOBILE` asset `MOB.627` uses.
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

const ASSETS = 'query($p: TableQuery) { assets(params: $p) { edges { id name desc attachments { id fileName fileType } } } }';
// A 1×1 PNG: an image the server accepts; the AI's answer is the test's, whatever the picture.
const PHOTO = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

type Asset = { id: string; name: string; desc: string | null; attachments: { id: string; fileName: string; fileType: string | null }[] };

async function assetNamed(page: Page, name: string): Promise<Asset> {
  const edges = (await serverRead(page, ASSETS,
    { p: { limit: 50, query: { connector: 'AND', conditions: [{ column: 'name', operator: 'CONTAINS', value: name }] } } }))
    .assets.edges.filter((a: Asset) => a.name === name);
  expect(edges.length, `exactly one asset is named "${name}"`).toBe(1);
  return edges[0];
}

export async function mob935(page: Page): Promise<void> {
  const run = runId('numeric', 8);
  const answer = `DD SYNTHETIC 935 nameplate ${run}`;
  const photoName = `DD935-${run}.png`;

  await page.goto(appUrl('asset-collector'), { waitUntil: 'load' });
  const row = page.locator('.mantine-Accordion-item')
    .filter({ has: page.locator('.mantine-Accordion-control', { hasText: /DD SYNTHETIC MOBILE \d{8}/ }) }).first();
  await expect(row, "PREMISE: a DD SYNTHETIC MOBILE asset is in the collected list (MOB.600's residue)").toBeVisible({ timeout: 60_000 });
  const name = ((await row.locator('.mantine-Accordion-control').innerText()).match(/DD SYNTHETIC MOBILE \d{8}/) ?? [])[0]!;
  const start = await assetNamed(page, name);
  const before = start.attachments.map((a) => a.id).sort();

  const asked: string[] = [];
  await page.route('**/api/upload/ai', (route) => {
    asked.push(route.request().postDataBuffer()?.toString('latin1') ?? '');
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ description: answer }) });
  });

  let photoId: string | undefined;
  try {
    // This run's photo: Photos → Add Photo → the gallery input.
    await row.locator('.mantine-Accordion-chevron').first().click();
    await row.getByRole('tab', { name: 'Photos', exact: true }).click();
    await row.getByRole('button', { name: 'Add Photo' }).click();
    await expect(page.getByText('Select Photo Source'), 'the photo picker opened').toBeVisible({ timeout: 30_000 });
    await page.locator('input[type="file"]:not([capture])').first()
      .setInputFiles({ name: photoName, mimeType: 'image/png', buffer: PHOTO });
    await expect(page.getByText('Select Photo Source'), 'the picker closed itself once the file arrived').toHaveCount(0, { timeout: 30_000 });
    await expect.poll(async () => {
      photoId = (await assetNamed(page, name)).attachments.find((a) => !before.includes(a.id) && a.fileName === photoName)?.id;
      return !!photoId;
    }, { message: 'our photo is on the server', timeout: 90_000 }).toBe(true);

    // Its menu → Get Description.
    const slide = row.locator('[class*="mantine-Carousel-slide"]').filter({ has: page.locator(`img[src*="/api/attachment/${photoId}"]`) });
    await expect(slide, 'our photo has a slide').toHaveCount(1, { timeout: 60_000 });
    await (await gearOf(slide)).click();
    await page.getByRole('menuitem', { name: 'Get Description' }).click();

    // The editor's button reads `Submit` (the `Update Asset` child in `EditForm.tsx:70` is not what renders).
    const editor = page.locator('.mantine-Modal-content').filter({ hasText: 'Description' })
      .filter({ has: page.getByRole('button', { name: 'Submit' }) });
    await expect(editor, 'the Description editor opened').toBeVisible({ timeout: 30_000 });
    await expect(editor.locator('textarea').first(), "the AI's description is appended to the field")
      .toHaveValue(new RegExp(answer), { timeout: 30_000 });
    await expect(editor.getByRole('button', { name: 'Submit' }), 'and `Submit` is enabled').toBeEnabled();
    expect(asked.length, 'the AI was asked once').toBe(1);
    expect(asked[0], 'about OUR photo, for a nameplate').toContain(photoId!);
    expect(asked[0]).toContain('NAME_PLATE');

    // Closed unsent.
    await page.keyboard.press('Escape');
    await expect(editor, 'the editor closed').toHaveCount(0, { timeout: 15_000 });
    expect((await assetNamed(page, name)).desc, "the asset's description is unchanged on the server").toBe(start.desc);

    // Our photo, deleted.
    await (await gearOf(slide)).click();
    await page.locator('.mantine-Menu-item', { hasText: 'Delete Photo' }).first().click();
    await page.locator('.mantine-Modal-content').filter({ hasText: 'Are you sure you want to delete' })
      .getByRole('button', { name: 'Yes' }).click();
    await expect.poll(async () => (await assetNamed(page, name)).attachments.some((a) => a.id === photoId),
      { message: 'our photo is deleted from the server', timeout: 60_000 }).toBe(false);
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.935-failure.png' }).catch(() => undefined);
    const left = (await assetNamed(page, name)).attachments.filter((a) => !before.includes(a.id));
    throw new Error(`${(err as Error).message}\n  left on the asset: ${left.map((a) => `${a.fileName} (${a.id})`).join(', ') || 'nothing'}`);
  } finally {
    await page.unroute('**/api/upload/ai');
  }
  const after = (await assetNamed(page, name)).attachments.map((a) => a.id).sort();
  expect(after, "the asset's attachments are exactly as before").toEqual(before);
}
