/**
 * Wait for the app's own prefetch to finish, instead of sleeping for it (checklist #89).
 *
 * The work list and the Asset Verification job list draw every stage of their prefetch as a `LoadingProgress` bar
 * (`ui/LoadingProgress.tsx`, a Mantine `Progress`): "Retrieving assigned work", "N workstages found", the lookup and
 * meta-data labels, "N / M workstages downloaded" (`WorkOrders/index.tsx:286-313`); "Fetching mobile job list",
 * "Fetching data for lookups", "Fetching mobile job details" (`AssetVerification/index.tsx:148-170`). When none is on
 * the page, the prefetch is done — or had nothing to do (`PREFETCHED_WORK_DATA` already recorded).
 *
 * Stages hand over in the same render, but the first can start a moment after the list mounts, so "no bar" must hold
 * for `quietMs` in a row, not just once.
 */
import { Page } from '@playwright/test';

/** A `LoadingProgress` bar: the only `animated` Progress in the browser app — a job card's `VerificationProgress` is a
 *  Progress too, but still, and stays on the page. */
export const LOADING_BAR = '.mantine-Progress-section[data-animated]';

/** The work list's last stage downloads EVERY assigned stage's details — about 3 minutes for the test crew's 452 in a
 *  fresh browser (measured 2026-09-24). No converted test waited for it (they slept 30s), so the work list's waits
 *  ignore it; the job list's waits, named for its "batched detail downloads", do not. */
export const WORKSTAGE_DOWNLOADS = /workstages downloaded/;

export async function waitForPrefetch(
  page: Page, { timeout = 180_000, quietMs = 2_000, ignore }: { timeout?: number; quietMs?: number; ignore?: RegExp } = {},
): Promise<void> {
  const deadline = Date.now() + timeout;
  let quietSince = 0;
  for (;;) {
    const labels: string[] = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((s) =>
      s.closest('.mantine-Progress-root')?.previousElementSibling?.textContent ?? ''), LOADING_BAR).catch(() => []);
    const bars = labels.filter((l) => !ignore?.test(l)).length;
    const now = Date.now();
    if (bars === 0) {
      if (!quietSince) quietSince = now;
      if (now - quietSince >= quietMs) return;
    } else {
      quietSince = 0;
    }
    if (now >= deadline) throw new Error(`the prefetch's progress bars were still showing after ${Math.round(timeout / 1000)}s`);
    await page.waitForTimeout(250);
  }
}
