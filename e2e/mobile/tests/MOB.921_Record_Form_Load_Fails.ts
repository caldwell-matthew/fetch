// MOB.921_Record_Form_Load_Fails — written for Playwright (not converted from Datadog).
//
// The Condition and Failure add forms build themselves from a schema query (`GET_SCHEMA`, `schema:
// 'WorkStageCondition'` / `'WorkStageFailure'`). If it fails and nothing is cached, each form shows `role="alert"`
// "Unable to load form. Close and reopen to retry." (`Conditions/Form.tsx:226`, `Failures/Form.tsx:179`).
//
// The schema is normally cached by the work list's prefetch, which is why no Datadog test ever saw this: the test
// opens the work order DIRECTLY in a fresh browser (nothing cached — the same path as bugs §42) and fails the
// schema in the browser. Nothing is submitted; each form is closed.
import { expect, Page } from '@playwright/test';
import { failOperation } from '../../support/network';
import { appUrl, FIXTURE_WO } from '../support/session';

const FORMS = [
  { tab: 'Condition', schema: 'WorkStageCondition' },
  { tab: 'Failure', schema: 'WorkStageFailure' },
];

export async function mob921(page: Page): Promise<void> {
  const failing = FORMS.map((f) => failOperation(page, { operation: 'GET_SCHEMA', variables: { schema: f.schema } },
    { kind: 'graphql', message: `DD SYNTHETIC 921: ${f.schema} schema refused by the test` }));
  const routes = await Promise.all(failing);
  try {
    await page.goto(appUrl(`work/${FIXTURE_WO}`), { waitUntil: 'load' });
    await expect(page.getByText('Status:').first(), 'the work order opened').toBeVisible({ timeout: 60_000 });

    for (const [i, f] of FORMS.entries()) {
      await page.locator(`xpath=//*[@role="tab"][contains(normalize-space(.), "${f.tab}")]`).click();
      await page.locator('xpath=//button[normalize-space(.)="Add"]').click();
      const alert = page.getByRole('alert').filter({ hasText: 'Unable to load form. Close and reopen to retry.' });
      await expect(alert, `the ${f.tab} form says it could not load`).toBeVisible({ timeout: 30_000 });
      expect(routes[i].hits, `the ${f.schema} schema request really was failed`).toBeGreaterThan(0);
      await page.keyboard.press('Escape');
      await expect(alert, `the ${f.tab} form closed`).toHaveCount(0, { timeout: 15_000 });
    }
  } finally {
    await Promise.all(routes.map((r) => r.stop()));
  }
}
