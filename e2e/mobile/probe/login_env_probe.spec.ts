// Read-only probe: why does the `development` environment button sometimes never appear after the password step?
// N fresh logins, each in a new browser. For each: every `/login…` response's path and status, what `/login/user-env`
// returned (environment NAMES and field names only — never a token), and — when the active `development` button does
// not come within 60s — the buttons that ARE on screen and a screenshot. No password or token is printed.
import { test } from '@playwright/test';
import { globals } from '../../support/env';
import { DEVICES } from '../../playwright.config';

const N = Number(process.env.E2E_LOGINS ?? 12);
const ACTIVE_DEV = '//button[contains(concat(" ", normalize-space(@class), " "), " enviroment-button ")][contains(concat(" ", normalize-space(@class), " "), " enviroment-btn--active ")][.//p[normalize-space(.)="development"]]';

test.setTimeout(N * 150_000);

test('login environment step', async ({ browser }) => {
  let failures = 0;
  for (let i = 1; i <= N; i++) {
    const context = await browser.newContext({ viewport: DEVICES.tablet });
    const page = await context.newPage();
    const seen: string[] = [];
    let envSummary = '';
    page.on('response', async (r) => {
      const u = new URL(r.url());
      if (!u.pathname.startsWith('/login')) return;
      seen.push(`${r.request().method()} ${u.pathname} ${r.status()}`);
      if (u.pathname.replace(/\/$/, '') === '/login/user-env') {
        try {
          const body = await r.json();
          const list = Array.isArray(body) ? body : [];
          envSummary = `${list.length} env(s): ` + list.map((e: Record<string, unknown>) =>
            `${e.environment ?? '?'}[${Object.keys(e).filter((k) => !/token|secret|key/i.test(k)).join(',')}]`).join(' ');
        } catch { envSummary = 'not JSON'; }
      }
    });
    const t0 = Date.now();
    let outcome = 'ok';
    try {
      await page.goto(globals.MOBDEV, { waitUntil: 'load' });
      const email = page.locator('input[name="email"]');
      await email.waitFor({ timeout: 60_000 });
      await email.fill(globals.DATA_DOG_EMAIL);
      await page.locator('button[type="submit"]').click();
      const pw = page.locator('input[name="password"]');
      await pw.waitFor({ timeout: 60_000 });
      await pw.fill(globals.DATA_DOG_PASSWORD);
      await page.locator('button[type="submit"]').click();
      await page.locator(`xpath=${ACTIVE_DEV}`).first().waitFor({ timeout: 60_000 });
    } catch (err) {
      failures++;
      outcome = `FAILED at: ${String((err as Error).message).split('\n')[0].replace(/xpath=.*$/, 'the active development button').slice(0, 120)}`;
      const buttons = await page.locator('button.enviroment-button').evaluateAll((bs) =>
        bs.map((b) => `${(b.textContent || '').trim().slice(0, 30)}{${b.className}}`)).catch(() => []);
      outcome += ` · env buttons on screen: ${buttons.length ? buttons.join(' | ') : 'none'} · url ${new URL(page.url()).pathname}`;
      await page.screenshot({ path: `results/probe-login-${i}.png` }).catch(() => undefined);
    }
    outcome = outcome.split(globals.DATA_DOG_PASSWORD).join('***'); // an error message must never carry it
    console.log(`#${i} ${((Date.now() - t0) / 1000).toFixed(1)}s ${outcome}\n    ${seen.join(' → ')}\n    user-env: ${envSummary || '(no response)'}`);
    await context.close();
  }
  console.log(`LOGINS: ${N} · failed: ${failures}`);
});
