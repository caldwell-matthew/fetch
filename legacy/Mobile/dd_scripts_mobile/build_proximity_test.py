"""Build MOB.730_AssetLookup_Proximity - the "Near Me" radius menu on Asset Lookup.

WHY THIS EXISTS
  `ProximityMenu.tsx` landed 2026-08-21 (`21e388b5b7`, "assets near me feature"). It was found
  by DIFFING `client/mobile` against the last walk, three days after that walk - which is the
  whole point of the *Codebase sync* table. Nothing goes red when a feature ships untested.

🛑 DO NOT CLICK A RADIUS. Every radius item calls `locate()` ->
`navigator.geolocation.getCurrentPosition`, which a Synthetics runner cannot satisfy. Clicking
one buys a 10s timeout and a `toast.error`, and proves nothing - the location half is
Appendix C. The MENU is reachable; the LOCATION is not. This test covers the reachable half
and stops there.

WHAT IS ACTUALLY PROVEN, AND WHY THE NEGATIVE IS THE GOOD PART
  `ProximityMenu` renders `Update my location` and `Clear` only behind `{!!value && ...}`, so
  with no radius set they must be ABSENT while the five radii are PRESENT. That pairing is the
  test: five positives make it non-vacuous, and the two absences prove the conditional branch
  rather than merely that a menu opened (trap 5).

  The button's own label is state, not decoration: `Near Me` with no value, `Within {n} mi`
  with one. Asserting `Near Me` is therefore also the baseline guard.

⚠️ IT PERSISTS, AND IT AUTO-LOCATES ON MOUNT.
  `AssetLookup/index.tsx:56` keeps the chosen radius in
  `sessionStorage['asset_lookup_proximity_radius']`, and `ProximityMenu`'s mount effect calls
  `locate(initialRadius)` when one is stored. So a stored radius makes the page request
  geolocation on load, for every later test in the same suite session. This test asserts the
  key is EMPTY at start and still empty at the end - it must never be the thing that sets it.
  Third persistence hazard in this suite, after the two map toggles and the view toggle.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      radius_set_js)

LOOKUP_URL = BASE + "/asset-lookup"
RADIUS_KEY = "asset_lookup_proximity_radius"
# 🛑 The radius options are LOCALE-DERIVED - see the distance-units block in dd_tools.py.
# This file used to hard-code `[5,10,25,50,100]` rendered as "N miles"; the 09-02 localization
# commit made them "N mi" and broke both checks below, one loudly and one silently.

NEAR_ME_BTN = '//button[contains(normalize-space(.), "Near Me")]'
MENU_ITEMS_JS = ("const items = [...document.querySelectorAll('.mantine-Menu-item')]"
                 ".map(e => (e.textContent || '').trim());\n")

steps = [
    go(LOOKUP_URL, "asset lookup"),
    step("wait", "Let the page mount", {"value": 3}),
    step("assertElementContent", 'The "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup",
          "element": xpath_el(LOOKUP_URL,
                              '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                              ' "Asset Lookup")]')}, timeout=30),

    # BASELINE. If a previous test in this session had set a radius, the button would read
    # "Within N mi" and the page would already have asked for geolocation on mount.
    jsassert(f"BASELINE: no radius is stored in sessionStorage['{RADIUS_KEY}']",
             f"const v = sessionStorage.getItem('{RADIUS_KEY}');\n"
             "return v === null || v === 'null' || v === '';", timeout=30),
    step("assertElementPresent", 'The "Near Me" button renders — the no-radius label',
         {"element": xpath_el(LOOKUP_URL, NEAR_ME_BTN)}, timeout=60),

    # ---- SETTLE BEFORE CLICKING. Measured, not defensive padding. ------------------------
    # 2026-09-08: this test failed at "Search radius" on a FRESH session while MOB.731 and
    # MOB.974 opened the same menu on the same page in the same run conditions. The only
    # difference was TIMING - both of those install a geolocation stub between the button
    # assert and the click, which buys ~5s of settle. This test clicked straight after the
    # assert, and the click landed while Asset Lookup was still resolving its first query, so
    # the menu opened and was immediately discarded by the re-render.
    # 🛑 A polling assert AFTER the click cannot fix that: the menu never reopens, so the poll
    # just waits 30s and fails. The gate has to come BEFORE the click.
    # ⚠️ In its suite MOB.730 runs last, after six other Asset Lookup children have warmed the
    # page - which is exactly why this only shows up in a fresh session, and why a scratch
    # verify is not the same as a suite pass.
    step("assertElementPresent",
         "SETTLE GATE: the search input is interactive — the page finished its first render",
         {"element": xpath_el(LOOKUP_URL, '//input[@name="asset-search"]')}, timeout=60),
    step("wait", "Let the first asset query settle before touching the menu", {"value": 4}),

    # ---- the menu -----------------------------------------------------------------------
    step("click", 'Open the "Near Me" menu',
         {"element": xpath_el(LOOKUP_URL, f"({NEAR_ME_BTN})[1]")}, timeout=30),
    # Poll for the menu's own heading ELEMENT rather than `wait 2` + a page-text search:
    # the wait is a timer and rots (trap 21), and `assertPageContains` cannot tell the
    # dropdown apart from the same words anywhere else on the page.
    step("assertElementPresent", 'The menu is headed "Search radius"',
         {"element": xpath_el(
             LOOKUP_URL,
             '//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-label ")]'
             '[normalize-space(.)="Search radius"]')}, timeout=30),

    # FIVE POSITIVES. Asserted as a SET and as a count, so an extra or missing radius fails
    # rather than passing on a partial match.
    # ⭐ Unit-agnostic, and STRONGER than the version it replaces: the set must match one
    # locale's options EXACTLY, so a mixed render ("25 mi" beside "50 km") now fails too.
    jsassert("All five radii are offered, and they are exactly ONE locale's set — "
             "5/10/25/50/100 mi or 10/25/50/100/200 km, never a mix",
             MENU_ITEMS_JS + radius_set_js(),
             timeout=30),

    # THE NEGATIVE, and the reason this test is worth having: both of these sit behind
    # `{!!value && ...}`, so with no radius set they must not exist. Paired with the five
    # positives above, so it cannot pass on a menu that failed to open (trap 5).
    jsassert('"Update my location" and "Clear" are ABSENT while no radius is set',
             MENU_ITEMS_JS +
             "return !items.includes('Update my location') && !items.includes('Clear');",
             timeout=30),

    # 🛑 Close WITHOUT choosing. A radius click calls getCurrentPosition, which this runner
    # cannot satisfy - 10s of timeout and a toast.error, proving nothing (Appendix C).
    step("pressKey", "Close the menu WITHOUT choosing a radius (a click would call "
         "getCurrentPosition — Appendix C)", {"value": "Escape"}, always=True),
    step("wait", "Let the menu close", {"value": 1}, always=True),
    # ⚠️ THIS IS THE STEP THAT WENT VACUOUS. It is an ABSENCE, so it is only meaningful
    # because the SAME REGEX matched five items eight steps above - that positive is its
    # control. When the app renamed the items, both checks read the same broken regex: one
    # failed loudly and this one started passing on every page, forever.
    # 🛑 If you ever change the regex here, change it there too, or delete both.
    jsassert("GUARD: nothing was chosen — the menu is closed (MEANINGFUL ONLY because the "
             "same /^\\d+ (mi|km)$/ matched five items above — do not decouple them)",
             MENU_ITEMS_JS +
             "return items.filter(t => /^\\d+ (mi|km)$/.test(t)).length === 0;",
             always=True, timeout=30),

    # The test must not be the thing that leaves a radius behind for later subtests.
    jsassert(f"CLEAN: sessionStorage['{RADIUS_KEY}'] is still empty",
             f"const v = sessionStorage.getItem('{RADIUS_KEY}');\n"
             "return v === null || v === 'null' || v === '';", always=True, timeout=30),
    step("assertElementPresent", 'RESTORED: the button still reads "Near Me"',
         {"element": xpath_el(LOOKUP_URL, NEAR_ME_BTN)}, always=True, timeout=30),
]

write(test(
    "MOB.730_AssetLookup_Proximity",
    "`MOB.730` The **\"Near Me\" radius menu** on Asset Lookup — a feature that landed\n"
    "2026-08-21 and was found by diffing `client/mobile`, not by a walk.\n"
    "- 🛑 **No radius is ever clicked.** Each one calls `getCurrentPosition`, which a\n"
    "  Synthetics runner cannot satisfy — 10s of timeout and a `toast.error`, proving nothing.\n"
    "  **The menu is reachable; the location is Appendix C.**\n"
    "- **The negative is the point**: `Update my location` and `Clear` sit behind\n"
    "  `{!!value && ...}`, so they must be ABSENT with no radius set — asserted alongside the\n"
    "  five radii being PRESENT, so it cannot pass on a menu that never opened (trap 5).\n"
    "- The button's label is state, not decoration — `Near Me` vs `Within {n} mi` — so\n"
    "  asserting it doubles as the baseline guard.\n"
    "- 🛑 **UNIT-AGNOSTIC BY REQUIREMENT, not by taste.** The radius options are\n"
    "  `${radius} ${distanceUnit}` and BOTH halves come from the **browser locale**\n"
    "  (`utils/distance`): `5/10/25/50/100 mi` imperial, `10/25/50/100/200 km` metric.\n"
    "  This test pinned `N miles` until 2026-09-08 and had been broken since the 09-02\n"
    "  localization commit. ⚠️ **The failure was two-sided**: the positive check went red,\n"
    "  and its paired absence check started passing **vacuously** — a green step that could\n"
    "  never fail again. The set assertion now also rejects a MIX of units.\n"
    "- ⚠️ **Persists and auto-locates**: a stored\n"
    "  `sessionStorage['asset_lookup_proximity_radius']` makes the page request geolocation on\n"
    "  MOUNT, for every later subtest in the shared session. This test asserts the key is\n"
    "  empty before and after, and must never be what sets it.",
    steps,
    tags=["Mobile", "env:dev", "Asset Lookup", "read-only"],
))
print("wrote MOB.730 (asset lookup proximity menu)")
