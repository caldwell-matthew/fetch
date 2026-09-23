/**
 * Datadog step semantics in Playwright.
 *
 * The converted tests came from Datadog browser tests, and these helpers keep the rules those tests
 * were written against — otherwise a green run would prove something different from what it used to:
 *
 *  - every step POLLS until its timeout (Datadog's default is 60s), rather than asserting once;
 *  - a locator matching MORE THAN ONE element is a failure, not "take the first" (trap 3). Playwright's
 *    strict mode does this for actions; `el()` keeps it for assertions too;
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
  await expect(el(page, xpath)).toBeVisible({ timeout });
}

/** `assertElementContent` (check: contains). */
export async function assertElementContent(
  page: Page,
  xpath: string,
  value: string,
  timeout = DEFAULT_TIMEOUT,
): Promise<void> {
  await expect(el(page, xpath)).toContainText(value, { timeout });
}

/**
 * `uploadFiles` with a stand-in file of the same name.
 *
 * Datadog keeps a test's uploaded bytes in its own storage and never hands them back (trap 12), so a
 * run outside Datadog cannot use the original file. `Mobile/local_fixtures/<name>` is used when it
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
    await el(page, xpath).setInputFiles(paths, { timeout });
  });
}

const FIXTURES = path.join(__dirname, '..', '..', 'Mobile', 'local_fixtures');
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
 * A step marked `allowFailure` AND `isCritical` — Datadog's "soft": the test fails, but the steps
 * after it still run. Collect these and throw at the end of the test.
 */
export class Soft {
  private failures: string[] = [];

  async run(what: string, body: () => Promise<void>): Promise<void> {
    try {
      await body();
    } catch (err) {
      this.failures.push(`${what}: ${(err as Error)?.message ?? err}`);
    }
  }

  check(): void {
    if (this.failures.length) throw new Error(`soft step(s) failed:\n  - ${this.failures.join('\n  - ')}`);
  }
}
