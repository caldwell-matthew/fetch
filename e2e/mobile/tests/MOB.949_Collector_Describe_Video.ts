// MOB.949_Collector_Describe_Video — written for Playwright (not converted from Datadog).
//
// The collector's new-asset form has a magic wand beside Description (`AssetCollector/Form/index.tsx:245-259`): pick a
// photo and the AI (`/api/upload/ai`, prompt `NAME_PLATE`) writes the description. Given a VIDEO, it still sends the
// file, then says `Unable to capture descriptions from videos.` and leaves the description alone
// (`Form/CaptureDescriptionIcon.tsx:103-116`). The AI is answered in the browser (MOB.935's way) — with a description,
// so a video that was NOT refused would show it. The file is MOB.933's tiny MP4 stand-in; the form is discarded unsent.
// Nothing reaches dev.
import { expect, Page } from '@playwright/test';
import { appUrl } from '../support/session';

const ANSWER = 'DD949 a description the app must not use';
const VIDEO = { name: 'DD949.mp4', mimeType: 'video/mp4', buffer: Buffer.from('00000018667479706d703432', 'hex') };

export async function mob949(page: Page): Promise<void> {
  let asked = 0;
  await page.route('**/api/upload/ai', (route) => {
    asked++;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ description: ANSWER }) });
  });
  try {
    await page.goto(appUrl('asset-collector'), { waitUntil: 'load' });
    await page.locator('.mantine-Affix-root button').first().click({ timeout: 60_000 });
    const form = page.locator('#asset-collector');
    await expect(form, 'the new-asset form opened').toBeVisible({ timeout: 30_000 });
    const desc = form.locator('#desc');
    await expect(desc).toHaveValue('');

    // the wand beside Description → its capture menu → the browser's file dialog
    const wand = form.locator('svg[data-icon="wand-magic-sparkles"]').first().locator('xpath=ancestor::*[self::button or contains(@class,"mantine-ActionIcon-root")][1]');
    await wand.click();
    const item = page.locator('.mantine-Menu-dropdown .mantine-Menu-item').first();
    await expect(item, "the wand's capture menu opened").toBeVisible({ timeout: 15_000 });
    const chooser = page.waitForEvent('filechooser', { timeout: 15_000 });
    await item.click();
    await (await chooser).setFiles(VIDEO);

    await expect(page.getByText('Unable to capture descriptions from videos.'), 'the app refuses to describe a video')
      .toBeVisible({ timeout: 30_000 });
    expect(asked, 'the video went to the AI route (answered in the browser)').toBe(1);
    await expect(desc, 'and the description was left alone').toHaveValue('');
    await page.screenshot({ path: 'results/MOB.949-refused.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.949-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.unroute('**/api/upload/ai');
  }
}
