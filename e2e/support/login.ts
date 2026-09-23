// Generated from Mobile/dd_tests_mobile/MOB.000_Login_(Dev).json by to_playwright.py — do not edit by hand yet.
// The shared login. Every suite runs it once, then its children reuse the session.
import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, assertElementPresent, assertPageLacks, el, wait } from './dd';
import { globals } from './env';

export async function login(page: Page): Promise<void> {
  const DATA_DOG_EMAIL = globals.DATA_DOG_EMAIL;
  const DATA_DOG_PASSWORD = globals.DATA_DOG_PASSWORD;
  const MOBDEV = globals.MOBDEV;
  // Navigate to mobile app
  await page.goto(`${MOBDEV}`);
  // Wait for the SSO login form to hydrate
  await wait(page, 5);
  // Type email
  await el(page, `//input[@name="email"]`).fill(`${DATA_DOG_EMAIL}`, { timeout: DEFAULT_TIMEOUT });
  // Click "Next"
  await el(page, `//button[@type="submit"]`).click({ timeout: DEFAULT_TIMEOUT });
  // Type password
  await el(page, `//input[@name="password"]`).fill(`${DATA_DOG_PASSWORD}`, { timeout: DEFAULT_TIMEOUT });
  // Click "Submit"
  await el(page, `//button[@type="submit"]`).click({ timeout: DEFAULT_TIMEOUT });
  // Choose the "development" environment
  await el(page, `(//button[contains(concat(" ", normalize-space(@class), " "), " enviroment-button ")][contains(concat(" ", normalize-space(@class), " "), " enviroment-btn--active ")][.//p[normalize-space(.)="development"]])[1]`).click({ timeout: DEFAULT_TIMEOUT });
  // Wait for the app shell to mount after the env redirect
  await wait(page, 10);
  // CRASH GUARD (boot): the ErrorBoundary has NOT replaced the app — no "Something went wrong."
  await assertPageLacks(page, `Something went wrong.`, DEFAULT_TIMEOUT);
  // Test authenticated mobile shell rendered
  await assertElementPresent(page, `//button[@aria-label="Toggle navigation"]`, 120000);
  // Open the menu to read the session role
  await el(page, `//button[@aria-label="Toggle navigation"]`).click({ timeout: DEFAULT_TIMEOUT });
  // Guard: session role is exactly "Admin"
  await assertElementPresent(page, `//button[.//div[normalize-space(.)="Switch Crews"]]//div[normalize-space(.)="Admin"]`, DEFAULT_TIMEOUT);
  // Close the menu
  await page.keyboard.press(`Escape`);
}
