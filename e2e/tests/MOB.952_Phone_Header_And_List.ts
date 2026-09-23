// Generated from Mobile/dd_tests_mobile/MOB.952_Phone_Header_And_List.json by to_playwright.py — do not edit by hand yet.
// MOB.952_Phone_Header_And_List

import { Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, Soft, assertFromJavascript, assertPageContains, optional, wait } from '../support/dd';

export async function mob952(page: Page): Promise<void> {
  const soft = new Soft();
    // Navigate to the work list
    await page.goto(`https://dev.mentorapm.com/apm-mobile/work`);
    // Let the work list render
    await wait(page, 10);
    // The "Work Orders" page mounted
    await assertPageContains(page, `Work Orders`, 30000);
    // DEVICE: PHONE width (`availWidth` < 450 — under the crew shortcut's breakpoint too)
    await assertFromJavascript(page, `const w = window.screen.availWidth;
return w > 0 && w < 450;`, 15000);
    // ⭐ The affixed `+` (create work order) is ON SCREEN at phone width
    await assertFromJavascript(page, `const inView = el => { if (!el) return false; const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= window.innerWidth + 1
    && r.top >= 0 && r.bottom <= window.innerHeight + 1; };
const b = document.querySelector('[class*="mantine-Affix-root"] button');
return inView(b);`, 30000);
    await soft.run("\u2b50 The work list's search control is ON SCREEN at phone width", async () => {
      await assertFromJavascript(page, `const inView = el => { if (!el) return false; const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= window.innerWidth + 1
    && r.top >= 0 && r.bottom <= window.innerHeight + 1; };
return inView(document.querySelector('input[placeholder="Find Workstage(s)"]'));`, 30000);
    });
    await optional("BY DESIGN: the header crew shortcut `.mobile-crew` exists but is hidden under 450px \u2014 the burger's `Switch Crews` is the phone path (optional)", async () => {
      await assertFromJavascript(page, `const c = document.querySelector('.mobile-crew');
return !!c && getComputedStyle(c).display === 'none';`, 15000);
    });
    // The header itself rendered at phone width (the burger is on screen)
    await assertFromJavascript(page, `const inView = el => { if (!el) return false; const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= window.innerWidth + 1
    && r.top >= 0 && r.bottom <= window.innerHeight + 1; };
return inView(document.querySelector('button[aria-label="Toggle navigation"]'));`, 15000);
  soft.check();
}
