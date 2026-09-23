// Generated from Mobile/dd_tests_mobile/MOB.000_Login_(Dev).json by to_playwright.py — do not edit by hand yet.
// The shared login. Every suite runs it once, then its children reuse the session.
import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertElementPresent, assertPageLacks, click, press, typeText, wait } from './dd';
import { globals } from './env';

export async function login(page: Page): Promise<void> {
  const DATA_DOG_EMAIL = globals.DATA_DOG_EMAIL;
  const DATA_DOG_PASSWORD = globals.DATA_DOG_PASSWORD;
  const MOBDEV = globals.MOBDEV;
  const run = new Sequence();
  await run.step("Navigate to mobile app", {}, async () => {
    await page.goto(`${MOBDEV}`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("Wait for the SSO login form to hydrate", {}, async () => {
    await wait(page, 5);
  });
  await run.step("Type email", {}, async () => {
    await typeText(page, `//input[@name="email"]`, `${DATA_DOG_EMAIL}`, DEFAULT_TIMEOUT);
  });
  await run.step("Click \"Next\"", {}, async () => {
    await click(page, `//button[@type="submit"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Type password", {}, async () => {
    await typeText(page, `//input[@name="password"]`, `${DATA_DOG_PASSWORD}`, DEFAULT_TIMEOUT);
  });
  await run.step("Click \"Submit\"", {}, async () => {
    await click(page, `//button[@type="submit"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Choose the \"development\" environment", {}, async () => {
    await click(page, `(//button[contains(concat(" ", normalize-space(@class), " "), " enviroment-button ")][contains(concat(" ", normalize-space(@class), " "), " enviroment-btn--active ")][.//p[normalize-space(.)="development"]])[1]`, DEFAULT_TIMEOUT);
  });
  await run.step("Wait for the app shell to mount after the env redirect", {}, async () => {
    await wait(page, 10);
  });
  await run.step("CRASH GUARD (boot): the ErrorBoundary has NOT replaced the app \u2014 no \"Something went wrong.\"", {}, async () => {
    await assertPageLacks(page, `Something went wrong.`, DEFAULT_TIMEOUT);
  });
  await run.step("Test authenticated mobile shell rendered", {}, async () => {
    await assertElementPresent(page, `//button[@aria-label="Toggle navigation"]`, 120000);
  });
  await run.step("Open the menu to read the session role", {}, async () => {
    await click(page, `//button[@aria-label="Toggle navigation"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Guard: session role is exactly \"Admin\"", {}, async () => {
    await assertElementPresent(page, `//button[.//div[normalize-space(.)="Switch Crews"]]//div[normalize-space(.)="Admin"]`, DEFAULT_TIMEOUT);
  });
  await run.step("Close the menu", {}, async () => {
    await press(page, `Escape`);
  });
  run.finish();
}
