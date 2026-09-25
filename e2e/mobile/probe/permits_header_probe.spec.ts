// Read-only probe: which permit-free work order shows a Permits tab, and where the page starts under the header.
import { test } from '@playwright/test';
import { appUrl, freshSession, FORMS_WO } from '../support/session';

test('permits tab + header gap', async ({ browser }) => {
  const page = await freshSession(browser);
  for (const id of [FORMS_WO, 'RcdI0xcpc8NBV8VoRNNBYM']) {
    await page.goto(appUrl(`work/${id}`), { waitUntil: 'load' });
    await page.getByText('Status:').first().waitFor({ timeout: 60_000 });
    const tabs = await page.getByRole('tab').allInnerTexts();
    console.log(id, 'tabs:', tabs.join(' | '));
    if (tabs.some((t) => t.trim() === 'Permits')) {
      await page.getByRole('tab', { name: 'Permits', exact: true }).click();
      await page.waitForTimeout(1500);
      console.log('  panel:', (await page.getByRole('tabpanel').innerText()).slice(0, 120).replace(/\n/g, ' / '));
    }
  }
  for (const path of ['work', '']) {
    await page.goto(appUrl(path), { waitUntil: 'load' });
    await page.locator('button[aria-label="Toggle navigation"]').waitFor({ timeout: 60_000 });
    await page.waitForTimeout(2000);
    console.log(`/${path}`, JSON.stringify(await page.evaluate(() => {
      const h = document.querySelector('.mantine-AppShell-header')!.getBoundingClientRect();
      const main = document.querySelector('.mantine-AppShell-main') as HTMLElement;
      const first = main.firstElementChild!.getBoundingClientRect();
      return { headerBottom: h.bottom, mainTop: main.getBoundingClientRect().top, mainPadTop: getComputedStyle(main).paddingTop,
        firstChildTop: first.top, firstChildId: main.firstElementChild!.id, vw: innerWidth };
    })));
  }
  await page.context().close();
});
