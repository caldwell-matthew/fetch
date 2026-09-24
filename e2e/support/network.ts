/**
 * Make the server "fail" without touching the server.
 *
 * Datadog could not do this: its browser always talked to the real backend. Playwright can answer a request itself,
 * inside the browser, so a test can show what the user sees when a save is rejected or a form cannot load — and
 * dev never receives the request at all.
 *
 * The apps send ONE GraphQL operation per request (a plain `HttpLink`, no batching) with its `operationName` in the
 * body, so a route can pick out exactly one operation and let everything else through untouched.
 */
import { Page, Route } from '@playwright/test';

type Match = {
  /** The GraphQL operation, as the app names it (`GET_SCHEMA`, `CREATE_WORKSTAGE_FORM`, …). */
  operation: string;
  /** Only when these variables match, e.g. `{ schema: 'WorkStageCondition' }`. Other calls pass through. */
  variables?: Record<string, unknown>;
};

type Failure =
  /** A GraphQL error — the server answered, and said no. The app's error link toasts `message`. */
  | { kind: 'graphql'; message: string; code?: string }
  /** No answer at all — the request never arrives. The app's retry and offline logic take over. */
  | { kind: 'network' };

export type Interception = {
  /** How many requests were answered with the failure. A test should assert this, so it cannot pass vacuously. */
  readonly hits: number;
  /** Stop failing; later requests reach the server again. */
  stop(): Promise<void>;
};

function matches(route: Route, m: Match): boolean {
  const req = route.request();
  if (req.method() !== 'POST') return false;
  let body: { operationName?: string; variables?: Record<string, unknown> } | null = null;
  try {
    body = req.postDataJSON();
  } catch {
    return false;
  }
  if (!body || body.operationName !== m.operation) return false;
  if (!m.variables) return true;
  return Object.entries(m.variables).every(([k, v]) => JSON.stringify(body!.variables?.[k]) === JSON.stringify(v));
}

/**
 * Answer every request for `match` with `failure` until `stop()`. Install it BEFORE the action that sends the
 * request. Nothing else is affected.
 */
export async function failOperation(page: Page, match: Match, failure: Failure): Promise<Interception> {
  let hits = 0;
  const handler = async (route: Route) => {
    if (!matches(route, match)) return route.fallback();
    hits++;
    if (failure.kind === 'network') return route.abort('failed');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: null,
        errors: [{ message: failure.message, extensions: failure.code ? { code: failure.code } : {} }],
      }),
    });
  };
  await page.route('**/graphql', handler);
  return {
    get hits() {
      return hits;
    },
    async stop() {
      await page.unroute('**/graphql', handler);
    },
  };
}

/** Record which operations the page sends while `body` runs — for proving a request did, or did not, go out. */
export async function watchOperations<T>(page: Page, body: () => Promise<T>): Promise<{ result: T; sent: string[] }> {
  const sent: string[] = [];
  const onRequest = (req: import('@playwright/test').Request) => {
    if (!req.url().endsWith('/graphql') || req.method() !== 'POST') return;
    try {
      const op = req.postDataJSON()?.operationName;
      if (op) sent.push(op);
    } catch {
      /* not JSON */
    }
  };
  page.on('request', onRequest);
  try {
    return { result: await body(), sent };
  } finally {
    page.off('request', onRequest);
  }
}
