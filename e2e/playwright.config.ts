import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Credentials and the base URL come from the repo-root .env (git-ignored), or from CI variables.
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

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  // probe/ holds throwaway diagnostics (how long /work takes to load, what a login sees). They are
  // run by name when something needs measuring, never as part of a pass.
  testIgnore: '**/probe/**',
  // The suites share fixture records on dev, so they must never run side by side (trap 1).
  workers: 1,
  fullyParallel: false,
  // A suite is one browser session; a child failing does not stop the ones after it on Datadog,
  // so retries stay off here and reds are read per child.
  retries: 0,
  // Datadog's default step timeout is 60s; assertions inherit it.
  expect: { timeout: 60_000 },
  timeout: 20 * 60_000,
  reporter: [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'results/junit.xml' }]],
  outputDir: 'results/artifacts',
  use: {
    baseURL: BASE_URL,
    viewport: DEVICES.tablet,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    actionTimeout: 60_000,
    navigationTimeout: 60_000,
  },
});
