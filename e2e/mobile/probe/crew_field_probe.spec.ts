// Read-only: the create form's `Assign to Crew` field — its markup, so a test can clear it or pick another crew.
// Opens the form, dumps, closes it; nothing is submitted.
import { expect, test } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { login } from '../support/login';
import { appUrl } from '../support/session';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';

test('crew field probe', async ({ browser }) => {
  test.setTimeout(300_000);
  const context = await browser.newContext({ viewport: DEVICES.tablet });
  const page = await context.newPage();
  await login(page);
  await page.goto(appUrl('work'), { waitUntil: 'load' });
  await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
  await page.locator('.mantine-Affix-root button').click();
  const crew = page.locator('#workorder-insert-form #crewId');
  await expect(crew).toBeVisible({ timeout: 30_000 });
  const html = await crew.evaluate((el) => {
    let n: Element = el; for (let i = 0; i < 4 && n.parentElement; i++) n = n.parentElement;
    return n.outerHTML.replace(/\s+/g, ' ').slice(0, 2500);
  });
  console.log(`PROBE value=${await crew.inputValue()} tag=${await crew.evaluate((e) => e.tagName + ' ' + (e.getAttribute('class') ?? ''))}\n${html}`);
  await crew.click();
  await crew.pressSequentially('Test Notif');
  await page.waitForTimeout(3_000);
  console.log(`PROBE options: ${JSON.stringify(await page.getByRole('option').allInnerTexts())}`);
  await page.keyboard.press('Escape');
  await context.close();
});
