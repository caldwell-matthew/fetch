// Read-only probe for bugs §45 on build 127: the crash's own recipe, twice each, every time in a FRESH browser (no Asset
// schema cached, nothing warmed): (a) open the fixture work order directly → Assets tab → expand the first asset row at
// once; (b) Asset Lookup → search → expand the first row the moment it appears. Records whether the ErrorBoundary
// ("Something went wrong.") replaced the page, and whether the row's details (its tab strip) rendered. Nothing is written.
import { test } from '@playwright/test';
import { appUrl, FIXTURE_WO, freshSession } from '../support/session';

test.setTimeout(600_000);

test('§45 recipe', async ({ browser }) => {
  for (let i = 1; i <= 2; i++) {
    for (const leg of ['work-order Assets tab', 'Asset Lookup']) {
      const page = await freshSession(browser);
      let crashed = false, details = false, note = '';
      try {
        if (leg === 'work-order Assets tab') {
          await page.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
          await page.getByText('Status:').first().waitFor({ timeout: 60_000 });
          await page.locator('xpath=//*[@role="tab"][normalize-space(.)="Assets"]').click();
          const row = page.getByRole('tabpanel').locator('.mantine-Accordion-item').first();
          await row.waitFor({ timeout: 30_000 });
          await row.locator('.mantine-Accordion-chevron').first().click();
          await page.waitForTimeout(4_000);
          details = await row.getByRole('tab', { name: 'General Info' }).isVisible().catch(() => false);
        } else {
          await page.goto(appUrl('asset-lookup'), { waitUntil: 'load' });
          const search = page.locator('input[name="asset-search"]');
          await search.waitFor({ timeout: 60_000 });
          await search.fill('Pump 0102');
          await search.press('Enter');
          const row = page.locator('.mantine-Accordion-item').filter({ hasText: 'Pump 0102' }).first();
          await row.waitFor({ timeout: 60_000 });
          await row.locator('.mantine-Accordion-control').click();
          await page.waitForTimeout(4_000);
          details = await row.getByRole('tab', { name: 'General Info' }).isVisible().catch(() => false);
        }
      } catch (err) {
        note = ` · step error: ${String((err as Error).message).split('\n')[0].slice(0, 120)}`;
      }
      crashed = (await page.getByText('Something went wrong.').count()) > 0;
      await page.screenshot({ path: `results/probe-45-${leg.startsWith('work') ? 'wo' : 'lookup'}-${i}.png` });
      console.log(`#${i} ${leg}: ${crashed ? 'CRASHED' : 'no crash'} · details rendered: ${details}${note}`);
      await page.context().close();
    }
  }
});
