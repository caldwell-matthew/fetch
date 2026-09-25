// MOB.933_Collector_Several_File_Types — written for Playwright (not converted from Datadog).
//
// A saved asset's Docs tab takes any file, several at once (`DetailPage/Attachments.tsx:127`: `FileButton multiple
// accept="*/*"`), but drops images with a toast — `N image file(s) were ignored.` (`:35-45`, `isImageFile` is
// `/^image\//`, so a HEIC photo, `image/heic`, is dropped too). What is kept is split for display by type
// (`:145-156`): `image/*` and `video/*` go to the Photos carousel, everything else to the file table.
//
// So one pick of four files — a PDF, a text file, an MP4 and a HEIC — proves: the HEIC is refused with the toast, the
// other three reach the server, the PDF and text file are table rows, and the video is not (it is in the carousel).
//
// Owner, 2026-09-23 (trap 2): delete only what THIS run uploaded, on the records the attachment tests already use —
// the `DD SYNTHETIC MOBILE` asset `MOB.628` uses (MOB.600's residue), never Pump 0102. The table's two rows are
// deleted with `Delete File(s)` while they are the only ones ticked; the video with its slide's `Delete Video`, the
// slide found by its file name. The server's attachment set must end exactly where it began.
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
type Att = { id: string; fileName: string; fileType: string | null };

async function attachmentsOf(page: Page, name: string): Promise<Att[]> {
  const edges = (await serverRead(page, ASSETS,
    { p: { limit: 50, query: { connector: 'AND', conditions: [{ column: 'name', operator: 'CONTAINS', value: name }] } } }))
    .assets.edges.filter((a: { name: string }) => a.name === name);
  expect(edges.length, `exactly one asset is named "${name}"`).toBe(1);
  return edges[0].attachments;
}

export async function mob933(page: Page): Promise<void> {
  const run = runId('numeric', 8);
  const files = [
    { name: `DD933-${run}.pdf`, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%DD SYNTHETIC 933\n%%EOF\n') },
    { name: `DD933-${run}.txt`, mimeType: 'text/plain', buffer: Buffer.from('DD SYNTHETIC MOBILE 933 - safe to delete\n') },
    { name: `DD933-${run}.mp4`, mimeType: 'video/mp4', buffer: Buffer.from('00000018667479706d703432', 'hex') },
    { name: `DD933-${run}.heic`, mimeType: 'image/heic', buffer: Buffer.from('000000186674797068656963', 'hex') },
  ];
  const [pdf, txt, mp4, heic] = files.map((f) => f.name);

  await page.goto(appUrl('asset-collector'), { waitUntil: 'load' });
  const row = page.locator('.mantine-Accordion-item')
    .filter({ has: page.locator('.mantine-Accordion-control', { hasText: /DD SYNTHETIC MOBILE \d{8}/ }) }).first();
  await expect(row, "PREMISE: a DD SYNTHETIC MOBILE asset is in the collected list (MOB.600's residue)").toBeVisible({ timeout: 60_000 });
  const name = ((await row.locator('.mantine-Accordion-control').innerText()).match(/DD SYNTHETIC MOBILE \d{8}/) ?? [])[0]!;
  const before = (await attachmentsOf(page, name)).map((a) => a.id).sort();

  let ours: Att[] = [];
  try {
    await row.locator('.mantine-Accordion-chevron').first().click();
    await row.getByRole('tab', { name: 'Docs', exact: true }).click();
    const addFile = row.getByRole('button', { name: 'Add File' });
    await expect(addFile, '`Add File` renders').toBeVisible({ timeout: 30_000 });

    const chooser = page.waitForEvent('filechooser', { timeout: 15_000 });
    await addFile.click();
    const picker = await chooser;
    expect(picker.isMultiple(), 'the picker takes several files').toBe(true);
    await picker.setFiles(files);

    await expect(page.locator('.Toastify__toast').filter({ hasText: '1 image file(s) were ignored.' }),
      'the HEIC — an image — is refused, and the user told').toBeVisible({ timeout: 30_000 });

    await expect.poll(async () => {
      ours = (await attachmentsOf(page, name)).filter((a) => !before.includes(a.id));
      return ours.map((a) => a.fileName).sort().join(' · ');
    }, { message: 'the server holds exactly the PDF, the text file and the video — not the HEIC', timeout: 90_000 })
      .toBe([pdf, txt, mp4].sort().join(' · '));

    // The table: the PDF and the text file, not the video.
    const table = row.locator('table');
    const tableRow = (file: string) => table.locator('tbody tr').filter({ hasText: file });
    await expect(tableRow(pdf), 'the PDF is a file row').toHaveCount(1, { timeout: 30_000 });
    await expect(tableRow(txt), 'the text file is a file row').toHaveCount(1);
    await expect(tableRow(mp4), 'the video is not — it is shown with the photos').toHaveCount(0);
    await expect(tableRow(heic), 'nor the refused HEIC').toHaveCount(0);

    // Delete the two rows: tick exactly ours, and only then Delete File(s) (it deletes every ticked row).
    for (const f of [pdf, txt]) await tableRow(f).getByRole('checkbox').check();
    await expect(table.getByRole('checkbox', { checked: true }), 'only our two rows are ticked').toHaveCount(2);
    await table.locator('thead [aria-label="Menu"]').click();
    await page.getByRole('menuitem', { name: 'Delete File(s)' }).click();
    const gone = (ids: string[]) => expect.poll(async () => {
      const now = (await attachmentsOf(page, name)).map((a) => a.id);
      return ids.filter((id) => now.includes(id)).length;
    }, { message: 'the server no longer holds them', timeout: 60_000 }).toBe(0);
    const docIds = ours.filter((a) => a.fileName !== mp4).map((a) => a.id);
    await gone(docIds);

    // The video: its slide in the carousel, found by its attachment id.
    const video = ours.find((a) => a.fileName === mp4)!;
    await row.getByRole('tab', { name: 'Photos', exact: true }).click();
    // A video's slide is a `Play <file name>` button over its preview (`ui/PhotoCarousel/Video.tsx:38-51`) — no
    // `<img>` carries its attachment id — so it is found by its name, which is this run's alone.
    const slide: Locator = row.locator('[class*="mantine-Carousel-slide"]')
      .filter({ has: page.getByRole('button', { name: `Play ${mp4}`, exact: true }) });
    await expect(slide, 'the video has a slide in the carousel').toHaveCount(1, { timeout: 30_000 });
    await (await gearOf(slide)).click();
    await page.locator('.mantine-Menu-item', { hasText: 'Delete Video' }).first().click(); // a video's menu says so
    await page.locator('.mantine-Modal-content').filter({ hasText: 'Are you sure you want to delete' })
      .getByRole('button', { name: 'Yes' }).click();
    await gone([video.id]);
  } catch (err) {
    // Playwright's failure screenshot is of its own `page` fixture, not the suite's page — keep this one's.
    await page.screenshot({ path: 'results/MOB.933-failure.png' }).catch(() => undefined);
    const left = (await attachmentsOf(page, name)).filter((a) => !before.includes(a.id));
    throw new Error(`${(err as Error).message}\n  left on the asset: ${left.map((a) => `${a.fileName} (${a.id})`).join(', ') || 'nothing'}`);
  }
  const after = (await attachmentsOf(page, name)).map((a) => a.id).sort();
  expect(after, "the asset's attachments are exactly as before").toEqual(before);
}
