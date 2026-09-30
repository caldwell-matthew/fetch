// MOB.136_Work_Form_Signature_Save — written for Playwright (not converted from Datadog).
//
// MOB.135's write half: SIGN the fixture's `🔎 Inspection` form, prove it saved, then CLEAR it and prove it null again
// (owner, 2026-09-29: self-restoring on that form). On the tablet the form's signature field is the mobile control
// (`WorkOrders/components/Forms/SignatureField.tsx`): `Add Signature` opens the pad (`react-signature-canvas`) in a
// modal. Each stroke's end queues `[id, <PNG data URL>]` and the pad's `Clear` queues `[id, null]`
// (`MentorInputs/SignatureField/index.tsx:228-249`); only the last queued update is sent, when the modal CLOSES
// (`closeAndSave`) — `UPDATE_WORKSTAGE_FORM_SIGNATURE` (field `updateWorkstageFormSignature`). The strokes are real
// pointer moves on the canvas. Once signed, the field shows `Signed by <signer> on <date>` (`SignatureField.tsx:54-60`,
// `data-testid="signature-meta"`) — checked against the signer the server holds, the test account.
//
// The restore is the app's own Clear. If the test fails after a save, `finally` sends the same mutation with `null` —
// exactly what Clear sends — so the fixture is never left signed.
import { expect, Page, Response } from '@playwright/test';
import { waitForPrefetch, WORKSTAGE_DOWNLOADS } from '../support/prefetch';
import { appUrl, FIXTURE_WO, serverRead } from '../support/session';

const FORMS = 'query($id: ID!) { workStage(id: $id) { forms { name widgets { __typename ... on WorkflowFormSignature { id label signature userId { name } } } } } }';
const CLEAR = 'mutation($id: ID!, $signature: String) { updateWorkstageFormSignature(id: $id, signature: $signature) { id signature } }';
type Sig = { id: string; label: string; signature: string | null; userId: { name: string } | null };

async function inspectionSignature(page: Page): Promise<Sig> {
  const forms = (await serverRead(page, FORMS, { id: FIXTURE_WO })).workStage.forms
    .filter((f: { name: string | null }) => (f.name ?? '').includes('Inspection'));
  expect(forms.length, 'PREMISE: the fixture holds ONE Inspection form').toBe(1);
  const sigs = forms[0].widgets.filter((w: { __typename: string }) => w.__typename === 'WorkflowFormSignature');
  expect(sigs.length, 'PREMISE: with ONE signature field').toBe(1);
  return sigs[0];
}

export async function mob136(page: Page): Promise<void> {
  const before = await inspectionSignature(page);
  expect(before.signature, 'PREMISE: the signature is empty at rest').toBeNull();
  let signed = false;
  const saved = (): Promise<Response> => page.waitForResponse((r) => r.url().endsWith('/graphql')
    && /\bupdateWorkstageFormSignature\b/.test(r.request().postData() ?? ''), { timeout: 30_000 });

  try {
    // Through the list first, for its prefetch (as MOB.135).
    await page.goto(appUrl('work'), { waitUntil: 'load' });
    await expect(page.locator('#page-title h4', { hasText: 'Work Orders' })).toBeVisible({ timeout: 60_000 });
    await waitForPrefetch(page, { ignore: WORKSTAGE_DOWNLOADS });
    await page.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
    await expect(page.getByRole('tab').first(), 'the work order opened').toBeVisible({ timeout: 60_000 });
    await page.getByRole('tab', { name: /Form/ }).click();
    await page.locator('[role="tabpanel"]:visible .mantine-Paper-root').filter({ has: page.locator('.mantine-Title-root', { hasText: 'Inspection' }) }).first().click();
    const cell = page.locator('#apm-dv-tabpanel .mobile-signature-cell');
    await expect(cell, 'the form drew its one signature cell').toHaveCount(1, { timeout: 60_000 });
    await expect(cell).toContainText(before.label);
    const button = cell.locator('button[title="Add Signature"]');
    await expect(button, 'unsigned: `Add Signature`').toHaveText('Add Signature');

    // SIGN: one stroke, then close the pad — the close sends it. Scroll the button in first: the form opens with it
    // at the viewport's bottom edge, where a tap lands on the page behind it (measured) and nothing opens.
    await button.scrollIntoViewIfNeeded();
    await button.click();
    const pad = page.locator('.mantine-Modal-content').filter({ has: page.locator('canvas') }).filter({ has: page.locator('[title="Clear"]') });
    const canvas = pad.locator('canvas');
    await expect(canvas, 'the pad opened').toBeVisible({ timeout: 30_000 });
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + box.height * 0.7);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(box.x + 40 + i * 25, box.y + box.height * (0.7 - 0.4 * Math.sin(i / 2)), { steps: 3 });
    await page.mouse.up();
    let response = saved();
    await pad.locator('.mantine-Modal-close').click();
    await expect(pad, 'the pad closed').toHaveCount(0, { timeout: 15_000 });
    const sent = (await response).request().postDataJSON()?.variables;
    signed = true;
    expect(sent?.id, 'the save is for this field').toBe(before.id);
    expect(String(sent?.signature ?? ''), 'it sent the drawing as a PNG').toMatch(/^data:image\/png;base64,/);

    // SERVER: the field holds a signature, by the test account.
    await expect.poll(async () => !!(await inspectionSignature(page)).signature, { message: 'the server holds the signature', timeout: 30_000 }).toBe(true);
    await expect(cell.locator('[data-testid="signature-image"]'), 'the cell shows it').toBeVisible({ timeout: 30_000 });
    await expect(cell.locator('button[title="Add Signature"]'), 'and offers `Update Signature`').toHaveText('Update Signature');
    // …and says who signed: the server's signer is the test account, and the cell names it.
    const account = (await serverRead(page, '{ session { me { name } } }')).session.me.name as string;
    expect((await inspectionSignature(page)).userId?.name, "the server's signer is the test account").toBe(account);
    const meta = cell.locator('[data-testid="signature-meta"]');
    const name = account.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // the account's name, taken literally
    await expect(meta, '`Signed by <signer> on <date>`').toContainText(new RegExp(`Signed by\\s*${name}\\s*on\\s*\\S`), { timeout: 30_000 });
    await cell.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'results/MOB.136-signed.png' });

    // CLEAR: reopen, Clear, close — the close sends null.
    await cell.locator('button[title="Add Signature"]').scrollIntoViewIfNeeded();
    await cell.locator('button[title="Add Signature"]').click();
    await expect(canvas, 'the pad reopened').toBeVisible({ timeout: 30_000 });
    await pad.locator('[title="Clear"]').click();
    response = saved();
    await pad.locator('.mantine-Modal-close').click();
    await expect(pad, 'the pad closed').toHaveCount(0, { timeout: 15_000 });
    expect((await response).request().postDataJSON()?.variables?.signature ?? null, 'Clear sent null').toBeNull();
    await expect.poll(async () => (await inspectionSignature(page)).signature, { message: 'the server holds no signature again', timeout: 30_000 }).toBeNull();
    signed = false;
    await expect(cell.locator('[data-testid="signature-image"]'), 'the cell shows none').toHaveCount(0, { timeout: 30_000 });
    await expect(cell.locator('button[title="Add Signature"]'), 'and offers `Add Signature` again').toHaveText('Add Signature');
  } catch (err) {
    await page.screenshot({ path: 'results/MOB.136-failure.png' }).catch(() => undefined);
    throw err;
  } finally {
    // Never leave the fixture signed: the same mutation Clear sends.
    if (signed || (await inspectionSignature(page).catch(() => before)).signature) {
      await serverRead(page, CLEAR, { id: before.id, signature: null }).catch(() => undefined);
    }
  }
}
