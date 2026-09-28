// Read-only probe: MOB.722 found DD SYNTHETIC MOBILE 01240233's expanded row blank (2026-09-28). MOB.722's own path:
// search "DD SYNTHETIC MOBILE" (every test asset listed), expand the first 8-digit row, open Readings. Then the same
// on 13783628 by its exact name. Records the Readings panel's visibility, the tab strip, console errors. Writes nothing.
import { test } from '@playwright/test';
import { appUrl, freshSession } from '../support/session';

test('blank asset panel — MOB.722 path', async ({ browser }) => {
  const page = await freshSession(browser);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + String(e.message).slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_NAME_NOT_RESOLVED/.test(m.text())) errors.push(m.text().slice(0, 300)); });
  for (const term of ['DD SYNTHETIC MOBILE', 'DD SYNTHETIC MOBILE 13783628']) {
    errors.length = 0;
    await page.goto(appUrl('asset-lookup'), { waitUntil: 'load' });
    const search = page.locator('input[name="asset-search"]');
    await search.waitFor({ timeout: 60_000 });
    await search.fill(term);
    await search.press('Enter');
    const row = page.locator('.mantine-Accordion-item')
      .filter({ has: page.locator('.mantine-Accordion-control', { hasText: /DD SYNTHETIC MOBILE \d{8}/ }) }).first();
    await row.waitFor({ timeout: 60_000 });
    const name = (await row.locator('.mantine-Accordion-control').innerText()).match(/DD SYNTHETIC MOBILE \d{8}/)![0];
    await row.locator('.mantine-Accordion-control').click();
    await page.waitForTimeout(3_000);
    const before = await row.getByRole('tab').allInnerTexts();
    await row.getByRole('tab', { name: 'Readings', exact: true }).click();
    await page.waitForTimeout(5_000);
    const info = await row.evaluate((r) => {
      const form = r.querySelector('form[id^="asset-lookup-readings-"]') as HTMLElement | null;
      const chain: string[] = [];
      for (let n: HTMLElement | null = form; n && n !== r; n = n.parentElement) {
        const cs = getComputedStyle(n); const rect = n.getBoundingClientRect();
        if (cs.display === 'none' || cs.visibility !== 'visible' || cs.opacity === '0' || rect.height === 0)
          chain.push(`${n.tagName}.${(n.className || '').toString().slice(0, 60)} display=${cs.display} vis=${cs.visibility} op=${cs.opacity} h=${rect.height}`);
      }
      return { form: !!form, hiddenBy: chain.slice(0, 4), tabsNow: [...r.querySelectorAll('[role="tab"]')].map((t) => (t.textContent || '').trim()),
        panelText: ((r.querySelector('.mantine-Accordion-content') as HTMLElement)?.innerText || '').slice(0, 200).replace(/\n/g, ' / ') };
    });
    console.log(`${term} → ${name}: tabs before ${JSON.stringify(before)} · ${JSON.stringify(info)}`);
    console.log(`  errors: ${errors.length ? errors.join(' | ') : 'none'}`);
    await page.screenshot({ path: `results/probe-blank-${name.slice(-8)}-readings.png` });
  }
  await page.context().close();
});
