// MOB.934_Collector_Upload_Interrupted — written for Playwright (not converted from Datadog).
//
// In a browser a file's bytes go by tus to `/tus` BEFORE its `CREATE_PENDING_ATTACHMENTS` mutation is sent
// (`graphql/links/UploadLink.ts:52-82`): `POST /tus` creates the upload, `PATCH /tus/<id>` carries the bytes. tus
// retries a failed request after 0, 1, 3, 5 and 10 s (`:111`), resuming where the server says it stopped; when it
// gives up, the link toasts "Upload failed. The file was not saved." (`:79`) and never sends the mutation. A 401 is
// not retried, and there is no token-refresh-then-retry: the user sees the same toast.
//
// Three uploads of one small text file through the Docs tab's `Add File`, each failure made in the BROWSER:
//   1. the first PATCH is cut off → tus resumes, the file reaches the server (then deleted — this run's own, trap 2);
//   2. every PATCH is cut off → the toast, no mutation, the server unchanged;
//   3. the POST is answered 401 → the toast, no retry, no mutation, the server unchanged.
// Parts 2 and 3 never create an attachment. Part 2's `POST /tus` does reach dev, so a started, never-finished tus
// upload is left in the upload store (no attachment row points at it).
//
// On the asset `MOB.628` and `MOB.933` use (MOB.600's residue); its attachment set must end exactly where it began.
import { expect, Page, Request, Route } from '@playwright/test';
import { runId } from '../../support/env';
import { appUrl, serverRead } from '../support/session';

const ASSETS = 'query($p: TableQuery) { assets(params: $p) { edges { id name attachments { id fileName } } } }';
const FAILED = 'Upload failed. The file was not saved.';
type Att = { id: string; fileName: string };

async function attachmentsOf(page: Page, name: string): Promise<Att[]> {
  const edges = (await serverRead(page, ASSETS,
    { p: { limit: 50, query: { connector: 'AND', conditions: [{ column: 'name', operator: 'CONTAINS', value: name }] } } }))
    .assets.edges.filter((a: { name: string }) => a.name === name);
  expect(edges.length, `exactly one asset is named "${name}"`).toBe(1);
  return edges[0].attachments;
}

const isTus = (req: Request, method: string) => req.method() === method && /\/tus(\/|$)/.test(new URL(req.url()).pathname);
const isCreate = (req: Request) => {
  try { return /\bcreatePendingAttachments\b/.test(req.postDataJSON()?.query ?? ''); } catch { return false; }
};

export async function mob934(page: Page): Promise<void> {
  const run = runId('numeric', 8);
  const file = (part: number) => ({
    name: `DD934-${run}-${part}.txt`, mimeType: 'text/plain', buffer: Buffer.from(`DD SYNTHETIC MOBILE 934 part ${part} - safe to delete\n`),
  });

  await page.goto(appUrl('asset-collector'), { waitUntil: 'load' });
  const row = page.locator('.mantine-Accordion-item')
    .filter({ has: page.locator('.mantine-Accordion-control', { hasText: /DD SYNTHETIC MOBILE \d{8}/ }) }).first();
  await expect(row, "PREMISE: a DD SYNTHETIC MOBILE asset is in the collected list (MOB.600's residue)").toBeVisible({ timeout: 60_000 });
  const name = ((await row.locator('.mantine-Accordion-control').innerText()).match(/DD SYNTHETIC MOBILE \d{8}/) ?? [])[0]!;
  const before = (await attachmentsOf(page, name)).map((a) => a.id).sort();

  await row.locator('.mantine-Accordion-chevron').first().click();
  await row.getByRole('tab', { name: 'Docs', exact: true }).click();
  const addFile = row.getByRole('button', { name: 'Add File' });
  await expect(addFile, '`Add File` renders').toBeVisible({ timeout: 30_000 });
  const upload = async (f: ReturnType<typeof file>) => {
    const chooser = page.waitForEvent('filechooser', { timeout: 15_000 });
    await addFile.click();
    await (await chooser).setFiles(f);
  };
  const failedToast = page.locator('.Toastify__toast').filter({ hasText: FAILED });
  let creates = 0;
  const countCreates = (route: Route) => { if (isCreate(route.request())) creates++; return route.fallback(); };
  await page.route('**/graphql', countCreates);

  try {
    // 1. The first PATCH cut off → resumed.
    let patches = 0, cut = 0;
    const cutFirst = (route: Route) => {
      if (!isTus(route.request(), 'PATCH')) return route.fallback();
      if (patches++ === 0) { cut++; return route.abort('connectionreset'); }
      return route.fallback();
    };
    await page.route('**/tus**', cutFirst);
    const one = file(1);
    await upload(one);
    let resumed: Att | undefined;
    await expect.poll(async () => {
      resumed = (await attachmentsOf(page, name)).find((a) => a.fileName === one.name && !before.includes(a.id));
      return !!resumed;
    }, { message: 'after the cut, tus resumed and the file reached the server', timeout: 60_000 }).toBe(true);
    await page.unroute('**/tus**', cutFirst);
    expect(cut, 'the first PATCH was cut off').toBe(1);
    expect(patches, 'and tus sent it again').toBeGreaterThanOrEqual(2);
    await expect(failedToast, 'no failure was reported').toHaveCount(0);

    // …and removed: its row ticked alone, then Delete File(s).
    const tableRow = row.locator('table tbody tr').filter({ hasText: one.name });
    await expect(tableRow, 'its row is in the file table').toHaveCount(1, { timeout: 30_000 });
    await tableRow.getByRole('checkbox').check();
    await expect(row.locator('table').getByRole('checkbox', { checked: true }), 'only our row is ticked').toHaveCount(1);
    await row.locator('table thead [aria-label="Menu"]').click();
    await page.getByRole('menuitem', { name: 'Delete File(s)' }).click();
    await expect.poll(async () => (await attachmentsOf(page, name)).some((a) => a.id === resumed!.id),
      { message: 'our file is deleted from the server', timeout: 60_000 }).toBe(false);

    // 2. Every PATCH cut off → tus gives up (~19 s of retries).
    creates = 0;
    const cutAll = (route: Route) => isTus(route.request(), 'PATCH') ? route.abort('connectionreset') : route.fallback();
    await page.route('**/tus**', cutAll);
    await upload(file(2));
    await expect(failedToast, `when every attempt fails the user is told: "${FAILED}"`).toBeVisible({ timeout: 60_000 });
    await page.unroute('**/tus**', cutAll);
    expect(creates, 'the attachment was never created (no CREATE_PENDING_ATTACHMENTS)').toBe(0);
    const shown = await failedToast.count(); // an error toast stays until closed: part 3's must be a new one

    // 3. The POST answered 401 → no retry.
    creates = 0;
    let posts = 0;
    const refuse = (route: Route) => {
      if (!isTus(route.request(), 'POST')) return route.fallback();
      posts++;
      return route.fulfill({ status: 401, headers: { 'Tus-Resumable': '1.0.0' }, body: 'Invalid Session' });
    };
    await page.route('**/tus**', refuse);
    await upload(file(3));
    await expect(failedToast, `a 401 is reported the same way: "${FAILED}"`).toHaveCount(shown + 1, { timeout: 30_000 });
    await page.waitForTimeout(3_000); // longer than tus's first retry delays: any retry would have gone out
    await page.unroute('**/tus**', refuse);
    expect(posts, 'a 401 is not retried').toBe(1);
    expect(creates, 'and the attachment was never created').toBe(0);
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.934-failure.png' }).catch(() => undefined);
    const left = (await attachmentsOf(page, name)).filter((a) => !before.includes(a.id));
    throw new Error(`${(err as Error).message}\n  left on the asset: ${left.map((a) => `${a.fileName} (${a.id})`).join(', ') || 'nothing'}`);
  } finally {
    await page.unroute('**/graphql', countCreates);
  }
  const after = (await attachmentsOf(page, name)).map((a) => a.id).sort();
  expect(after, "the asset's attachments are exactly as before").toEqual(before);
}
