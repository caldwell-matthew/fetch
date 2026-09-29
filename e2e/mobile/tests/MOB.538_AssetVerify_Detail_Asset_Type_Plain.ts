// MOB.538_AssetVerify_Detail_Asset_Type_Plain — written for Playwright (not converted from Datadog).
//
// A characterization test (owner, 2026-09-29) of how a job asset's full-page detail shows its type — nothing is
// changed. The HEADER shows `Asset Type:` as PLAIN TEXT, the type's name and nothing to edit it with, while `Tag ID:`
// and `Desc:` beside it each carry an edit button (`AssetCaptureIconFormBttn`, `AssetVerification/AssetDetails.tsx:
// 168-185`). The GENERAL INFO tab, though, lists `Asset Type*` as an ENABLED lookup holding the type: the AV detail
// passes the job template's field through (`AssetGeneralInfo.tsx`), where Asset Lookup forces the type read-only
// (`AssetLookupDetails/index.tsx:45-50` — why `CopyAttributesConfirmation` is unreachable). Measured 2026-09-29, build
// 127. Whether that lookup SAVES a new type is not tested — it would change a fixture's type. If either half changes,
// this goes red on purpose: it is a behaviour to look at, not a regression to absorb. Reads only.
import { expect, Page } from '@playwright/test';
import { appUrl, serverRead } from '../support/session';
import { AV_JOB } from '../support/fixtures';

const ASSET = 'Tank 0000';

export async function mob538(page: Page): Promise<void> {
  const job = (await serverRead(page, 'query($id: ID!) { mobileJob(id: $id) { name assets { assetId { name typeId { name } } } } }', { id: AV_JOB })).mobileJob;
  const asset = job.assets.find((a: { assetId: { name: string } }) => a.assetId.name.includes(ASSET))?.assetId;
  expect(asset?.typeId?.name, `PREMISE: ${ASSET} is on the job, with a type`).toBeTruthy();

  try {
    await page.goto(appUrl('asset-verify'), { waitUntil: 'load' });
    await expect(page.locator('input[placeholder="Find Mobile Job(s)"]'), 'the job list rendered').toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Fetching data for lookups'), 'the lookup prefetch finished').toHaveCount(0, { timeout: 120_000 });
    await expect(page.getByText('Fetching mobile job details'), 'the job details finished').toHaveCount(0, { timeout: 120_000 });
    await page.locator('.mantine-Paper-root').filter({ hasText: job.name }).first().click();
    await expect(page.locator('.mantine-Accordion-item').first(), 'the job opened').toBeVisible({ timeout: 60_000 });
    await page.locator('span').filter({ hasText: ASSET }).last().click();

    const type = page.locator('p').filter({ has: page.locator('strong', { hasText: /^\s*Asset Type:\s*$/ }) });
    await expect(type, 'the full-page detail shows `Asset Type:`').toBeVisible({ timeout: 30_000 });
    await expect(type, "with the type's name").toHaveText(`Asset Type: ${asset.typeId.name}`);
    // The Tag ID and Desc rows are each a Group: their text and an edit button. The type is a bare line.
    for (const label of ['Tag ID:', 'Desc:']) {
      const row = page.locator('.mantine-Group-root').filter({ has: page.locator('strong', { hasText: label }) }).last();
      await expect(row.getByRole('button'), `\`${label}\` has its edit button`).toHaveCount(1);
    }
    expect(await type.locator('xpath=parent::*[contains(@class,"mantine-Group-root")]').count(), '`Asset Type:` is not in a row with a control').toBe(0);
    expect(await type.locator('button, [role="button"], input').count(), 'and has no control of its own').toBe(0);
    await page.screenshot({ path: 'results/MOB.538-header.png' });
    // The General Info tab is another matter: its `Asset Type*` is an ENABLED lookup holding the type — the AV detail
    // passes the job template's field through (`AssetGeneralInfo.tsx`), where Asset Lookup forces it read-only.
    const field = page.locator('input#typeId');
    await expect(field, 'General Info lists `Asset Type` as a lookup').toHaveCount(1, { timeout: 30_000 });
    await expect(field, 'holding the type').toHaveValue(asset.typeId.name);
    await expect(field, 'and enabled — not plain text there').toBeEnabled();
    expect(await field.getAttribute('readonly'), 'nor read-only').toBeNull();
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.538-failure.png' }).catch(() => undefined);
    throw err;
  }
}
