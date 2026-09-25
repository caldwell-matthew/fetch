// MOB.922_Tag_Lookup_Outcomes — written for Playwright (not converted from Datadog).
//
// Asset Lookup's `Tag Lookup` → `Alphanumeric` takes a photo (in a browser, a file picker) and posts it to
// `/api/upload/ai` (`AssetLookup/TagLookup/index.tsx:14-21`), which answers `{ isTag, isReadable, data }`. Three
// outcomes reach the user (`:26-38`, `:100-110`):
//   not a tag        → toast "No tag found in that image."
//   not legible      → toast "Tag was not legible, try again with a clearer image."
//   read             → toast "Captured tag …", the list searched by `tagNumber`, and — with no match —
//                      "No results found for tag number …" with an X that clears it.
//
// The AI's answers are made in the BROWSER: the photo never leaves it, so no AI call is made or billed, and the
// test says which answer each outcome gets. The route must be hit once per photo — no test here can pass because
// the request went elsewhere. The tag searched for matches no asset (`DDSYN922…`), so this reads only.
import { expect, Page } from '@playwright/test';
import { appUrl } from '../support/session';

const TAG = 'DDSYN922ZQX';
// 1×1 transparent PNG: the app sends the file as it is; only the answer to it matters.
const PHOTO = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

export async function mob922(page: Page): Promise<void> {
  const answers = [
    { isTag: false, isReadable: false, data: null },
    { isTag: true, isReadable: false, data: 'unreadable' },
    { isTag: true, isReadable: true, data: TAG },
  ];
  let asked = 0;
  await page.route('**/api/upload/ai', (route) => {
    const answer = answers[Math.min(asked++, answers.length - 1)];
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(answer) });
  });

  await page.goto(appUrl('asset-lookup'), { waitUntil: 'load' });
  await expect(page.locator('input[name="asset-search"]'), 'Asset Lookup rendered').toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.mantine-Accordion-item').first(), 'its first list arrived').toBeVisible({ timeout: 60_000 });

  const photo = async () => {
    const chooser = page.waitForEvent('filechooser', { timeout: 15_000 });
    await page.getByRole('button', { name: 'Tag Lookup' }).click();
    await page.getByRole('menuitem', { name: 'Alphanumeric' }).click();
    await (await chooser).setFiles({ name: 'tag.png', mimeType: 'image/png', buffer: PHOTO });
  };
  const toast = (text: string) => page.locator('.Toastify__toast').filter({ hasText: text });

  await photo();
  await expect(toast('No tag found in that image.'), 'not a tag: said so').toBeVisible({ timeout: 30_000 });
  await photo();
  await expect(toast('Tag was not legible, try again with a clearer image.'), 'not legible: said so').toBeVisible({ timeout: 30_000 });
  await photo();
  await expect(toast(`Captured tag ${TAG}`), 'read: the tag is reported').toBeVisible({ timeout: 30_000 });
  expect(asked, 'every photo went to the AI route, and was answered by the test').toBe(3);

  const none = page.getByRole('heading', { name: `No results found for tag number ${TAG}` });
  await expect(none, 'no asset has the tag: said so').toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.mantine-Accordion-item'), 'and the list is empty').toHaveCount(0);
  await none.getByRole('button').click();
  await expect(none, 'the X clears the tag search').toHaveCount(0, { timeout: 15_000 });
  await expect(page.locator('.mantine-Accordion-item').first(), 'and the full list is back').toBeVisible({ timeout: 60_000 });
}
