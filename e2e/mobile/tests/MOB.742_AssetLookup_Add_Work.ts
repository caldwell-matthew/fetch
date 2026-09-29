// MOB.742_AssetLookup_Add_Work — written for Playwright (not converted from Datadog).
//
// An Asset Lookup row's `Add Work` (`AssetLookup/index.tsx:313-335`) opens MOB.300's create form with the row's asset
// AND its coordinates as defaults (`defaultAsset`, `x: asset.longitude`, `y: asset.latitude`) — the only entry point
// that passes a location (MOB.396's AV detail passes the asset alone). So the proof is a server read of the stage the
// create made: this run's description, the asset linked, and the asset's x/y.
//
// The asset is Pump 0066 (1500 Sugar Bowl Drive, ~3.5 km from the map tests' Tank 0040 and Pump 0098): the work order
// is Ready in the crew's list and drawn ON its asset, and a work stage's icon hides an asset's (trap 55). Owner,
// 2026-09-29: the work order is residue, `DD SYNTHETIC MOBILE …`, pruned by `cleanup_residue.py`.
import { expect, Page, Response } from '@playwright/test';
import { runId } from '../../support/env';
import { appUrl, serverRead } from '../support/session';

const ASSET = 'Pump 0066';
const ASSET_ID = 'h4MMAAMUNJNEYJtcdlIp8o';
const STAGE = 'query($id: ID!) { workStage(id: $id) { x y workId { problemDesc } assets { assetId { name } } } }';

export async function mob742(page: Page): Promise<void> {
  const desc = `DD SYNTHETIC MOBILE ${runId('numeric', 8)}`;
  const asset = (await serverRead(page, 'query($id: ID!) { asset(id: $id) { name latitude longitude } }', { id: ASSET_ID })).asset;
  expect(asset.name, `PREMISE: ${ASSET_ID} is ${ASSET}`).toBe(ASSET);
  expect(asset.latitude && asset.longitude, `PREMISE: ${ASSET} has coordinates`).toBeTruthy();

  try {
    await page.goto(appUrl('asset-lookup'), { waitUntil: 'load' });
    const search = page.locator('input[name="asset-search"]');
    await expect(search, 'Asset Lookup rendered').toBeVisible({ timeout: 60_000 });
    await search.fill(ASSET);
    await search.press('Enter');
    const row = page.locator('.mantine-Accordion-item').filter({ has: page.locator('.mantine-Accordion-control', { hasText: ASSET }) }).first();
    await expect(row, `a row for ${ASSET}`).toBeVisible({ timeout: 60_000 });
    await row.locator('.mantine-Accordion-control').click();
    await row.getByRole('button', { name: 'Add Work', exact: true }).click();

    const form = page.locator('#workorder-insert-form');
    await expect(form, 'the create form opened').toBeVisible({ timeout: 30_000 });
    // The form filters workflows by the asset (and by PM fields) once it has read them; with the filters on, "Datadog
    // Test" may not be offered — turn off whichever are on, as MOB.396 does.
    await page.waitForTimeout(3_000);
    for (const id of ['filterWorkflowByAsset', 'filterWorkflowByPMField']) {
      const box = form.locator(`#${id}`);
      if (await box.count() && await box.isChecked()) await form.locator(`label[for="${id}"]`).click();
    }
    await page.waitForTimeout(3_000); // the workflow list re-queries
    const workflow = form.locator('#workflowTitleId');
    await workflow.click();
    await workflow.pressSequentially('Datadog Test');
    await page.getByRole('option').filter({ hasText: 'Datadog Test' }).first().click();
    await form.locator('#problemDesc').fill(desc);

    const created: Promise<Response> = page.waitForResponse((r) => r.url().endsWith('/graphql')
      && /\bcreateWork\s*\(/.test(r.request().postData() ?? ''), { timeout: 60_000 });
    await page.getByRole('button', { name: 'Create Work Order', exact: true }).click();
    const stages: { id: string }[] = (await (await created).json()).data.createWork.stages;
    expect(stages.length, 'the create made a stage').toBeGreaterThan(0);

    // SERVER: the stage carries this run's description, the asset, and the asset's coordinates.
    await expect.poll(async () => {
      const st = (await serverRead(page, STAGE, { id: stages[0].id })).workStage;
      return { desc: st.workId.problemDesc, assets: st.assets.map((a: { assetId: { name: string } }) => a.assetId.name), x: st.x, y: st.y };
    }, { message: 'the stage the create made', timeout: 30_000 })
      .toEqual({ desc, assets: [ASSET], x: asset.longitude, y: asset.latitude });
    await expect(form, 'the form closed').toHaveCount(0, { timeout: 30_000 });
    await page.screenshot({ path: 'results/MOB.742-created.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.742-failure.png' }).catch(() => undefined);
    throw err;
  }
}
