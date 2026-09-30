import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Credentials and the base URL: CI variables, else e2e/.env, else the repo-root .env (all git-ignored). dotenv never
// overrides a value already set, so the first to hold a name wins. Inside MentorTwo the repo-root .env is the app
// server's own, so the test login belongs in e2e/.env there.
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const BASE_URL = process.env.MOBDEV ?? 'https://dev.mentorapm.com/apm-mobile/';

/**
 * Datadog's devices, kept identical so a converted test sees the same layout it was written for
 * (trap 1: one device per test — two devices are two sessions racing on the same fixtures).
 */
export const DEVICES = {
  tablet: { width: 768, height: 1020 },
  mobile_small: { width: 320, height: 550 },
};

/**
 * Datadog RUM stays out of every test browser. The app's page loads Datadog's RUM script and records EVERY session
 * with a full replay (`server/src/views/mobile.ejs:22-44`: sessionSampleRate and sessionReplaySampleRate 100), so a
 * test browser would be reported — and billed — as a real user, and mixed into real-user data, locally and in CI.
 * The names never resolve: the script does not load, and the page's own `window.DD_RUM &&` guard skips the rest.
 * `mobile/probe/rum_blocked_probe.spec.ts` proves it.
 */
export const RUM_HOSTS = ['datadoghq-browser-agent.com', 'browser-intake-datadoghq.com'];
const NO_RUM = `--host-resolver-rules=${RUM_HOSTS.flatMap((h) => [`MAP ${h} ~NOTFOUND`, `MAP *.${h} ~NOTFOUND`]).join(', ')}`;

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  // probe/ holds throwaway diagnostics (how long /work takes to load, what a login sees). They are
  // never part of a pass; run one with `E2E_PROBE=1 npx playwright test probe/<name>`.
  testIgnore: process.env.E2E_PROBE ? [] : '**/probe/**',
  // The suites share fixture records on dev, so they must never run side by side (trap 1).
  workers: 1,
  fullyParallel: false,
  // A suite is one browser session; a child failing does not stop the ones after it on Datadog,
  // so retries stay off here and reds are read per child.
  retries: 0,
  // Datadog's default step timeout is 60s; assertions inherit it.
  expect: { timeout: 60_000 },
  timeout: 20 * 60_000,
  reporter: [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'results/junit.xml' }],
    ['json', { outputFile: 'results/results.json' }]], // mobile/tools/coverage_report.py reads it
  outputDir: 'results/artifacts',
  use: {
    baseURL: BASE_URL,
    viewport: DEVICES.tablet,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    actionTimeout: 60_000,
    navigationTimeout: 60_000,
    launchOptions: { args: [NO_RUM] },
  },
});
