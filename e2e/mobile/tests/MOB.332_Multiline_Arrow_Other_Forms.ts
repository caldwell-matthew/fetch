// MOB.332_Multiline_Arrow_Other_Forms — written for Playwright (not converted from Datadog).
//
// A multiline or rich-text field with a value gets an arrow beside its label that opens the VALUE in a modal
// (`DetailPage/utils/MultiLineLabel.tsx` — nothing for an empty value; the click is on the icon). MOB.331 proves it on the
// work order's General Info. The same component serves three more forms, each checked here:
//   1  the create form's Problem Description (`WorkOrders/components/InsertForm/index.tsx:296`) — typed, never created;
//   2  an Asset Verify asset's General Info Description (`DetailPage/GeneralInfo.tsx:99`, the AV call site) — Tank 0000's;
//   3  the collection form a job note is added in (`WorkOrders/components/ui/Form.tsx:90`) — typed, never saved.
// Reads only: a route stops every mutation, counts it, and the test ends by proving none was sent.
import { expect, Locator, Page, Route } from '@playwright/test';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';
import { appUrl, FIXTURE_WO, serverRead } from '../support/session';
import { AV_JOB } from '../support/fixtures';

const ARROW = 'svg[data-icon="square-arrow-up-right"]';

/** Click the arrow in a field's `.form-group` (its label and input — the arrow sits by the label), and prove the modal it opens shows exactly `value`; close it. */
export async function openArrow(page: Page, wrapper: Locator, value: string, where: string): Promise<void> {
  const before = await page.locator('.mantine-Modal-content').count();
  await wrapper.locator(ARROW).first().click();
  const shown = page.locator('.mantine-Modal-content').nth(before);
  await expect(shown, `${where}: the value modal opened`).toBeVisible({ timeout: 15_000 });
  await expect(shown, `${where}: it shows the field's value`).toContainText(value);
  await expect(shown.locator('[contenteditable="true"], textarea, input'), `${where}: read-only`).toHaveCount(0);
  await shown.locator('.mantine-Modal-close').click();
  await expect(page.locator('.mantine-Modal-content'), `${where}: the value modal closed`).toHaveCount(before, { timeout: 15_000 });
}

export async function mob332(page: Page): Promise<void> {
  const stopped: string[] = [];
  const guard = async (route: Route) => {
    let query = '';
    try { query = route.request().postDataJSON()?.query ?? ''; } catch { /* not JSON */ }
    if (!/^\s*mutation\b/.test(query)) return route.fallback();
    stopped.push(query.slice(0, 60));
    return route.abort('failed');
  };
  await page.route('**/graphql', guard);
  const typed = 'DD SYNTHETIC MOBILE 332 — never saved';
  try {
    await page.goto(appUrl('work'), { waitUntil: 'load' });
    await expect(page.locator('#page-title h4', { hasText: 'Work Orders' })).toBeVisible({ timeout: 60_000 });
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });

    // 1 · the create form's Problem Description: no arrow while empty, one once it holds text
    await page.locator('.mantine-Affix-root button').click();
    const create = page.locator('#workorder-insert-form');
    await expect(create, 'the create form opened').toBeVisible({ timeout: 30_000 });
    const desc = create.locator('.form-group').filter({ has: page.locator('#problemDesc') }).first();
    await expect(desc.locator(ARROW), 'create form: no arrow while Problem Description is empty').toHaveCount(0);
    await create.locator('#problemDesc').fill(typed);
    await expect(desc.locator(ARROW), 'create form: the arrow once it holds text').toHaveCount(1, { timeout: 10_000 });
    await openArrow(page, desc, typed, 'create form');
    await page.locator('.mantine-Modal-content').filter({ has: page.locator('#workorder-insert-form') }).locator('.mantine-Modal-close').click();
    await expect(create, 'the create form closed — nothing created').toHaveCount(0, { timeout: 15_000 });

    // 3 · a job note's collection form (on the fixture work order)
    await page.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
    await expect(page.getByRole('tab').first(), 'the work order opened').toBeVisible({ timeout: 60_000 });
    await page.getByRole('tab', { name: /Notes/ }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    const noteForm = page.locator('#work-collection-form');
    await expect(noteForm, 'the note form opened').toBeVisible({ timeout: 30_000 });
    const editor = page.locator('.mantine-Modal-content [contenteditable="true"]').first();
    await editor.click();
    await editor.pressSequentially(typed);
    const noteField = noteForm.locator('.form-group').filter({ has: page.locator('[contenteditable="true"]') }).first();
    await expect(noteField.locator(ARROW), 'note form: the arrow once the note holds text').toHaveCount(1, { timeout: 10_000 });
    await openArrow(page, noteField, typed, 'note form');
    await page.locator('.mantine-Modal-content').filter({ has: page.locator('#work-collection-form') }).locator('.mantine-Modal-close').click();
    await expect(noteForm, 'the note form closed — nothing saved').toHaveCount(0, { timeout: 15_000 });

    // 2 · an Asset Verify asset's General Info Description
    const job = (await serverRead(page, `{ mobileJob(id: "${AV_JOB}") { name assets { assetId { name desc } } } }`)).mobileJob;
    const tank = job.assets.find((a: { assetId: { name: string } }) => a.assetId.name.includes('Tank 0000')).assetId;
    expect(tank.desc, 'PREMISE: Tank 0000 has a description').toBeTruthy();
    await page.goto(appUrl('asset-verify'), { waitUntil: 'load' });
    await expect(page.locator('input[placeholder="Find Mobile Job(s)"]')).toBeVisible({ timeout: 60_000 });
    await waitForPrefetch(page);
    await page.locator('.mantine-Paper-root').filter({ hasText: job.name }).first().click();
    await expect(page.locator('.mantine-Accordion-item').first(), "the job's assets").toBeVisible({ timeout: 60_000 });
    await page.locator('span', { hasText: 'Tank 0000' }).last().click();
    const avDesc = page.locator('.form-group').filter({ has: page.locator('#desc') }).first();
    await expect(avDesc.locator(ARROW), 'AV detail: the arrow beside Description').toHaveCount(1, { timeout: 30_000 });
    await openArrow(page, avDesc, tank.desc.slice(0, 40), 'AV detail');
    await page.screenshot({ path: 'results/MOB.332-av.png' });
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.332-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    await page.unroute('**/graphql', guard);
  }
  expect(stopped, 'no mutation was sent').toEqual([]);
}
