/**
 * A fresh, logged-in mobile page — for tests that need a clean browser (no cached schemas, no persisted
 * queue), unlike the converted suites, whose children share one session.
 */
import { Browser, Page } from '@playwright/test';
import { DEVICES } from '../../playwright.config';
import { globals } from '../../support/env';
import { login } from './login';

export const FIXTURE_WO = 'EYRpYJ9QYdQ1JFF10JtB0Q'; // the main work-order fixture (`20260805-18-001`)
export const FORMS_WO = 'xohY0klBZktB9VBRxc8k4J'; // work order `20260910-16`, where form attaches are allowed

export function appUrl(path = ''): string {
  return globals.MOBDEV.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}

export async function freshSession(
  browser: Browser,
  opts: { device?: keyof typeof DEVICES; clock?: boolean; touch?: boolean } = {},
): Promise<Page> {
  // `touch`: the map selects features on touchend only (`Map/MapGL/index.tsx:99`) — a mouse click never opens a card.
  const context = await browser.newContext({ viewport: DEVICES[opts.device ?? 'tablet'], hasTouch: !!opts.touch });
  const page = await context.newPage();
  // The clock must be installed before the app's first script runs; time still flows normally until a test
  // fast-forwards it.
  if (opts.clock) await page.clock.install();
  await login(page);
  return page;
}

/** Ask `/graphql` directly, with the page's own session — the server's answer, not the UI's. */
export async function serverRead<T = any>(page: Page, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await page.evaluate(
    async ({ query, variables }) => {
      const r = await fetch('/graphql', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      return r.json();
    },
    { query, variables },
  );
  if (res.errors?.length) throw new Error(`server read failed: ${JSON.stringify(res.errors).slice(0, 300)}`);
  return res.data as T;
}

/**
 * The same server read, sent by Playwright rather than by the page — it still works while the page is offline
 * (`context.setOffline` emulates the page's network only), with the page's own session cookies.
 */
export async function serverReadDirect<T = any>(page: Page, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const origin = new URL(globals.MOBDEV).origin;
  const res = await page.request.post(`${origin}/graphql`, { data: { query, variables } });
  const body = await res.json();
  if (body.errors?.length) throw new Error(`server read failed: ${JSON.stringify(body.errors).slice(0, 300)}`);
  return body.data as T;
}

/**
 * Does the app's PERSISTED cache (IndexedDB `mentor_apm` / `apollo-cache-persist`) contain `needle` yet? The cache is
 * written a moment after it changes, so a reload right after a write can come back without it — wait for this
 * before reloading to check that something survives (trap 41).
 */
export async function persistedCacheHas(page: Page, needle: string): Promise<boolean> {
  return page.evaluate((needle) => new Promise<boolean>((resolve) => {
    const open = indexedDB.open('mentor_apm');
    open.onerror = () => resolve(false);
    open.onsuccess = () => {
      const db = open.result;
      const store = db.objectStoreNames[0];
      if (!store) return resolve(false);
      const req = db.transaction(store).objectStore(store).get('apollo-cache-persist');
      req.onerror = () => resolve(false);
      req.onsuccess = () => {
        const v = req.result;
        resolve(String(typeof v === 'string' ? v : JSON.stringify(v ?? '')).includes(needle));
      };
    };
  }), needle);
}
