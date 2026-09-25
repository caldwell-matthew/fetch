// Converted on 2026-09-23 from the Datadog test legacy/Mobile/dd_tests_mobile/MOB.952_Phone_Header_And_List.json. This file is the source now: edit it directly.
// MOB.952_Phone_Header_And_List

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Sequence, assertFromJavascript, assertPageContains, wait } from '../../support/dd';

export async function mob952(page: Page): Promise<void> {
  const run = new Sequence();
  await run.step("Navigate to the work list", {}, async () => {
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT });
  });
  await run.step("The \"Work Orders\" page mounted", {}, async () => {
    await assertPageContains(page, `Work Orders`, 30000);
  });
  await run.step("DEVICE: PHONE width (`availWidth` < 450 \u2014 under the crew shortcut's breakpoint too)", {}, async () => {
    await assertFromJavascript(page, `const w = window.screen.availWidth;
return w > 0 && w < 450;`, 15000);
  });
  await run.step("\u2b50 The affixed `+` (create work order) is ON SCREEN at phone width", {}, async () => {
    await assertFromJavascript(page, `const inView = el => { if (!el) return false; const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= window.innerWidth + 1
    && r.top >= 0 && r.bottom <= window.innerHeight + 1; };
const b = document.querySelector('[class*="mantine-Affix-root"] button');
return inView(b);`, 30000);
  });
  await run.step("\u2b50 The work list's search control is ON SCREEN at phone width", {allow: 'soft'}, async () => {
    await assertFromJavascript(page, `const inView = el => { if (!el) return false; const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= window.innerWidth + 1
    && r.top >= 0 && r.bottom <= window.innerHeight + 1; };
return inView(document.querySelector('input[placeholder="Find Workstage(s)"]'));`, 30000);
  });
  await run.step("BY DESIGN: the header crew shortcut `.mobile-crew` exists but is hidden under 450px \u2014 the burger's `Switch Crews` is the phone path (optional)", {allow: 'ignore'}, async () => {
    await assertFromJavascript(page, `const c = document.querySelector('.mobile-crew');
return !!c && getComputedStyle(c).display === 'none';`, 15000);
  });
  await run.step("The header itself rendered at phone width (the burger is on screen)", {}, async () => {
    await assertFromJavascript(page, `const inView = el => { if (!el) return false; const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= window.innerWidth + 1
    && r.top >= 0 && r.bottom <= window.innerHeight + 1; };
return inView(document.querySelector('button[aria-label="Toggle navigation"]'));`, 15000);
  });
  run.finish();
}
