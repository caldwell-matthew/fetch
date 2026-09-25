// MOB.937_Work_Create_Refused — written for Playwright (not converted from Datadog).
//
// The new work order form now waits for the server (`WorkOrders/components/InsertForm/index.tsx:118-197`): a refused
// create shows `Unable to create work order.` and leaves the form open, where it used to fire and forget. The browser
// answers the create (`createWork`, matched on the field — trap 43) with a GraphQL error, so dev never receives it:
// not a network failure, which the retry link would send again (`graphql/index.tsx:61-86`). A server read afterwards
// proves no work order carries this run's marker. Reads only.
import { expect, Page } from '@playwright/test';
import { failOperation } from '../../support/network';
import { runId } from '../../support/env';
import { appUrl, serverRead } from '../support/session';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';

const REJECTION = 'DD SYNTHETIC 937: the test refused this work order';
const WORKS = 'query($p: TableQuery) { works(params: $p) { edges { id } } }';

export async function mob937(page: Page): Promise<void> {
  const marker = `DD SYNTHETIC MOBILE 937 ${runId('numeric', 8)}`;
  const worksWith = async () => (await serverRead(page, WORKS, { p: { limit: 10, query: { connector: 'AND',
    conditions: [{ column: 'problemDesc', operator: 'CONTAINS', value: marker }] } } })).works.edges.length;

  try {
    await page.goto(appUrl('work'), { waitUntil: 'load' });
    await expect(page.locator('input[placeholder="Find Workstage(s)"]')).toBeVisible({ timeout: 60_000 });
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
    await page.locator('.mantine-Affix-root button').first().click();
    const form = page.locator('#workorder-insert-form');
    await expect(form, 'the create form opened').toBeVisible({ timeout: 30_000 });
    await form.locator('#workflowTitleId').click();
    await form.locator('#workflowTitleId').pressSequentially('Datadog Test');
    await page.getByRole('option').filter({ hasText: 'Datadog Test' }).first().click();
    await form.locator('#problemDesc').fill(marker);

    const failing = await failOperation(page, { field: 'createWork' }, { kind: 'graphql', message: REJECTION });
    try {
      await page.getByRole('button', { name: 'Create Work Order', exact: true }).click();
      await expect(page.getByText('Unable to create work order.'), 'the app says the create failed')
        .toBeVisible({ timeout: 30_000 });
      expect(failing.hits, 'the create really was refused (not a vacuous pass)').toBeGreaterThan(0);
    } finally {
      await failing.stop();
    }
    await expect(page.getByText(REJECTION), "the server's refusal reaches the user too").toBeVisible();
    await expect(page.getByText('Work order successfully created!'), 'no success toast').toHaveCount(0);
    await expect(form, 'the form stays open, the typing kept').toBeVisible();
    await expect(form.locator('#problemDesc')).toHaveValue(marker);
    await expect(page.getByRole('button', { name: 'Create Work Order', exact: true }), 'and it can be sent again')
      .toBeEnabled();
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.937-failure.png' }).catch(() => undefined);
    throw err;
  }
  expect(await worksWith(), 'the server holds no work order with this run\'s marker').toBe(0);
}
