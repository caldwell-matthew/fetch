/**
 * Datadog step semantics in Playwright.
 *
 * The converted tests came from Datadog browser tests, and these helpers keep the rules those tests
 * were written against — otherwise a green run would prove something different from what it used to:
 *
 *  - every step POLLS until its timeout (Datadog's default is 60s), rather than asserting once;
 *  - a locator matching MORE THAN ONE VISIBLE element is a failure, not "take the first" (trap 3);
 *    `one()` applies that to actions and assertions alike;
 *  - a JavaScript assertion is a function BODY that returns a value; truthy passes.
 */
import { expect, Locator, Page } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const DEFAULT_TIMEOUT = 60_000;

/** Datadog steps address elements by xpath. */
export function el(page: Page, xpath: string): Locator {
  return page.locator(`xpath=${xpath}`);
}

/**
 * The ONE element a step means.
 *
 * Two matches is a broken locator and must fail (trap 3) — but only among elements a person could
 * actually see. Mantine leaves closed menus and modals in the DOM, so `//button[.="Add Asset Photo"]`
 * can match a visible button plus two hidden menu items that no longer exist on screen (2026-09-23,
 * MOB.626). Playwright's strict mode counts those; Datadog's does not. So: one match, use it; several,
 * keep the visible ones and use that if exactly one remains; otherwise fail, naming what matched.
 */
export async function one(page: Page, xpath: string, timeout = DEFAULT_TIMEOUT): Promise<Locator> {
  const all = el(page, xpath);
  await poll(`Locate ${xpath}`, timeout, async () => {
    if ((await all.count()) === 0) throw new Error(`No element found using locator: ${xpath}`);
  });
  const total = await all.count();
  if (total === 1) return all;
  const visible: number[] = [];
  for (let i = 0; i < total; i++) {
    if (await all.nth(i).isVisible()) visible.push(i);
  }
  if (visible.length === 1) return all.nth(visible[0]);
  throw new Error(
    `Multiple elements found using locator: ${xpath} (${total} matched, ${visible.length} of them visible)`,
  );
}

/**
 * How long a click retries properly before it is forced: most of the step's own timeout, never less
 * than 15s. Forcing early is worse than waiting — it dispatches the event at the element's centre
 * whether or not the app is ready, so a button that is still disabled swallows the click and the
 * flow silently goes nowhere (seen 2026-09-23: forcing at 3s broke the login's environment step).
 */
const STRICT_SHARE = 0.75;
const STRICT_FLOOR = 15_000;

/**
 * `click` — Datadog's click, which is less strict than Playwright's.
 *
 * Playwright refuses to click an element another element covers, and retries until the timeout;
 * Datadog dispatches the event anyway. A modal that a previous step failed to dismiss therefore
 * turns into a 30s timeout here where Datadog sailed through. So: try strictly for a few seconds (a
 * moving element usually settles), then force the click and say so in the log, the way
 * `local_run.py` does — the gap stays visible instead of silently changing what the test proves.
 */
export async function click(page: Page, xpath: string, timeout = DEFAULT_TIMEOUT): Promise<void> {
  const locator = await one(page, xpath, timeout);
  const strict = Math.max(STRICT_FLOOR, Math.round(timeout * STRICT_SHARE));
  try {
    await locator.click({ timeout: Math.min(strict, timeout) });
  } catch (err) {
    if (timeout <= strict) throw err;
    const why = String((err as Error)?.message ?? err).split('\n')[0];
    // NOT `click({ force: true })`. That skips the actionability checks but still fires a real mouse
    // event at those coordinates, so a modal sitting on top receives it — and Playwright calls that a
    // success, leaving the test to carry on as if the click had landed (seen 2026-09-23 on MOB.389:
    // the Condition modal ate the click on the Failure tab). Datadog dispatches at the element
    // itself, which is what this does.
    console.log(`  (dispatched click at the element after ${Math.round(strict / 1000)}s: ${why})`);
    await locator.dispatchEvent('click', {}, { timeout: timeout - strict });
  }
}

/**
 * `typeText` — Datadog types character by character and APPENDS to what is there (trap 17), which is
 * why the tests click the field and select its contents first. `fill()` would replace the value in
 * one event: fine for a plain input, wrong for a field whose filter reacts to each keystroke.
 */
export async function typeText(page: Page, xpath: string, value: string, timeout = DEFAULT_TIMEOUT): Promise<void> {
  const locator = await one(page, xpath, timeout);
  await poll(`Type into ${xpath}`, timeout, async () => {
    await locator.focus({ timeout: Math.min(5_000, timeout) });
    // No per-key delay: the login form re-renders shortly after the email step, and a slow typist's
    // characters are wiped mid-word (seen 2026-09-23 — the password field ended up empty).
    await locator.pressSequentially(value);
    const got = await locator.inputValue().catch(() => null);
    if (got !== null && !got.includes(value)) {
      throw new Error(`the field holds ${JSON.stringify(got)} after typing ${JSON.stringify(value)}`);
    }
  });
}

/**
 * `pressKey`. Datadog runs its browsers on Linux, where select-all is Control+A. On macOS that is
 * Meta+A, and Control+A moves the caret instead — so a "select the old term, then retype" step
 * silently leaves the old text in place. Playwright's `ControlOrMeta` is the same key on Linux/CI and
 * the right one locally.
 */
export async function press(page: Page, combo: string): Promise<void> {
  await page.keyboard.press(combo.replace(/^Control\+/, 'ControlOrMeta+'));
}

/** Poll `check` until it stops throwing, or the timeout runs out — Datadog's step behaviour. */
export async function poll(what: string, timeout: number, check: () => Promise<void>): Promise<void> {
  const deadline = Date.now() + timeout;
  let last: unknown;
  for (;;) {
    try {
      await check();
      return;
    } catch (err) {
      last = err;
      if (Date.now() >= deadline) {
        throw new Error(`${what} failed after ${Math.round(timeout / 1000)}s: ${(last as Error)?.message ?? last}`);
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

/** `wait` — a fixed pause. Kept as-is from the Datadog test; see OPEN WORK on tightening these. */
export async function wait(page: Page, seconds: number): Promise<void> {
  await page.waitForTimeout(seconds * 1000);
}

/** `assertFromJavascript` — the step's code is a function body; a truthy return passes. */
export async function assertFromJavascript(page: Page, code: string, timeout = DEFAULT_TIMEOUT): Promise<void> {
  await poll('Custom assertion', timeout, async () => {
    const ok = await page.evaluate((src) => {
      try {
        return !!new Function(src)();
      } catch {
        return false;
      }
    }, code);
    if (!ok) throw new Error('Custom assertion returned a falsy value.');
  });
}

/** `assertPageContains` — text anywhere in the rendered page. */
export async function assertPageContains(page: Page, text: string, timeout = DEFAULT_TIMEOUT): Promise<void> {
  await poll(`Page contains ${JSON.stringify(text)}`, timeout, async () => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (!body.includes(text)) throw new Error('Page does not contain the given text.');
  });
}

/** `assertPageLacks` — the text must be absent. */
export async function assertPageLacks(page: Page, text: string, timeout = DEFAULT_TIMEOUT): Promise<void> {
  await poll(`Page lacks ${JSON.stringify(text)}`, timeout, async () => {
    const body = await page.evaluate(() => document.body?.innerText ?? '');
    if (body.includes(text)) throw new Error('Page contains the given text.');
  });
}

/** `assertElementPresent` — one matching element, visible. */
export async function assertElementPresent(page: Page, xpath: string, timeout = DEFAULT_TIMEOUT): Promise<void> {
  await expect(await one(page, xpath, timeout)).toBeVisible({ timeout });
}

/** `assertElementContent` (check: contains). */
export async function assertElementContent(
  page: Page,
  xpath: string,
  value: string,
  timeout = DEFAULT_TIMEOUT,
): Promise<void> {
  await expect(await one(page, xpath, timeout)).toContainText(value, { timeout });
}

/**
 * `uploadFiles` with a stand-in file of the same name.
 *
 * Datadog keeps a test's uploaded bytes in its own storage and never hands them back (trap 12), so a
 * run outside Datadog cannot use the original file. `legacy/Mobile/local_fixtures/<name>` is used when it
 * exists, otherwise a generated file of the right type — the same substitution `local_run.py` makes.
 * It really uploads to dev, as the Datadog run did.
 */
export async function uploadStandIn(
  page: Page,
  xpath: string,
  names: string[],
  timeout = DEFAULT_TIMEOUT,
): Promise<void> {
  const paths = names.map((name) => standInFile(name));
  await poll(`Upload ${names.join(', ')}`, timeout, async () => {
    await (await one(page, xpath, timeout)).setInputFiles(paths, { timeout });
  });
}

const FIXTURES = path.join(__dirname, '..', '..', 'legacy', 'Mobile', 'local_fixtures');
const GENERATED = path.join(os.tmpdir(), 'mentorapm-e2e-uploads');

/** A real file on disk for `name`: the repo's fixture if there is one, else a valid generated file. */
function standInFile(name: string): string {
  const provided = path.join(FIXTURES, name);
  if (fs.existsSync(provided)) return provided;
  fs.mkdirSync(GENERATED, { recursive: true });
  const out = path.join(GENERATED, name);
  if (!fs.existsSync(out)) fs.writeFileSync(out, standInBytes(name));
  return out;
}

function standInBytes(name: string): Buffer {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
    // A valid 1x1 PNG. The app checks the bytes, not the extension, so a JPEG-named PNG is fine.
    return Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
  }
  if (ext === '.pdf') {
    return Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
        '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
    );
  }
  return Buffer.from(`DD SYNTHETIC stand-in for ${name}\n`);
}

/**
 * A step marked `allowFailure` without `isCritical` — Datadog's "optional": it may fail without
 * failing the test. Anything else must be allowed to throw.
 */
export async function optional(what: string, body: () => Promise<void>): Promise<void> {
  try {
    await body();
  } catch (err) {
    console.log(`  (optional step failed, continuing) ${what}: ${(err as Error)?.message ?? err}`);
  }
}

/**
 * A test's steps, run with Datadog's rules about what happens after one fails.
 *
 * Datadog does not run a test's steps as one block:
 *   - a step failing STOPS the ones after it, except those marked `alwaysExecute`;
 *   - `alwaysExecute` means "run even after a failure" — IN PLACE, not at the end. Hoisting those
 *     steps into a trailing cleanup block reorders the test: MOB.626 closes its capture menus with
 *     `alwaysExecute` steps in the middle, and with them moved to the end the menus stayed open and
 *     a later locator matched three elements (2026-09-23);
 *   - `allowFailure` + not critical ("optional") may fail without failing the test;
 *   - `allowFailure` + critical ("soft") fails the test but lets the following steps run;
 *   - the failure the test reports is the FIRST one, not whatever broke last.
 */
export class Sequence {
  private failure: unknown;
  private soft: string[] = [];

  /**
   * One step. The two Datadog flags are independent, and treating `alwaysExecute` as a kind of its
   * own made an optional fallback step fail a test that was fine (2026-09-23, MOB.348):
   *   always — run even after an earlier failure (otherwise the step is skipped);
   *   allow  — 'ignore' for `allowFailure` without `isCritical`, 'soft' for `allowFailure` with it.
   */
  async step(
    what: string,
    opts: { always?: boolean; allow?: 'ignore' | 'soft' },
    body: () => Promise<void>,
  ): Promise<void> {
    if (this.failure && !opts.always) return;
    try {
      await body();
    } catch (err) {
      const why = `${what}: ${(err as Error)?.message ?? err}`;
      if (opts.allow === 'ignore') {
        console.log(`  (optional step failed, continuing) ${why}`);
      } else if (opts.allow === 'soft') {
        this.soft.push(why);
      } else if (this.failure) {
        console.log(`  (a step that always runs also failed) ${why}`);
      } else {
        this.failure = err;
      }
    }
  }

  /** Throw what the test should report: the first hard failure, else any soft ones. */
  finish(): void {
    if (this.failure) throw this.failure;
    if (this.soft.length) throw new Error(`soft step(s) failed:\n  - ${this.soft.join('\n  - ')}`);
  }
}
