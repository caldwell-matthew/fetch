// MOB.129_Map_Replace_From_View_In_Map — written for Playwright (not converted from Datadog).
//
// MOB.128's replace through Use Map, on the card the map opens BY ITSELF after the work order's "View in Map" — the
// way a user most often reaches it. The replace saves (proven on the server), but ending pick mode reads the selected
// feature's `geometry`, which that card's spread copy of the Mapbox feature does not have (`Map/index.tsx:157-185`,
// `:291-306`): it throws `Cannot read properties of undefined (reading 'type')`, the pick's catch only logs it, and the
// overlay's Confirm spins for good with Cancel and Pick another disabled — until a reload. Bugs §56.
//
// Returns whether the overlay closed; the suite pins §56 on it. It replaces on the stage MOB.128 just replaced (linked
// to Tank 0040 alone), picking Pump 0098, so a run uses one test-made work order; run alone, it takes its own
// (MOB.128's rules). Owner, 2026-09-29 (trap 2): confirmed on test-made work orders only.
import { Browser } from '@playwright/test';
import { freshSession } from '../support/session';
import { PUMP_0098, replaceByMap } from './MOB.128_Map_Replace_Assets_Use_Map';

/** In its own browser, with touch. */
export async function mob129(browser: Browser, stageId?: string): Promise<{ ended: boolean }> {
  const page = await freshSession(browser, { touch: true });
  try {
    const { ended } = await replaceByMap(page, { pick: PUMP_0098, card: 'auto', test: 'MOB.129', stageId });
    return { ended };
  } finally {
    await page.context().close();
  }
}
