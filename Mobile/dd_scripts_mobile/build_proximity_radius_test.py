"""Build MOB.731_AssetLookup_Proximity_Radius - the LOCATION half of "Near Me".

WHAT THIS CLOSES
  `MOB.730` covers the menu and stops, because the checklist said a Synthetics runner could not
  satisfy `getCurrentPosition`. `MOB.974_DIAG_Geolocation` measured that claim on 2026-08-21 and
  it is FALSE: `navigator.geolocation`'s METHODS are writable (the object is a readonly accessor,
  the functions on it are not), the stub survives across steps, and - decisively, probe G3 - the
  APP CONSUMES IT. This is the real test built on that measurement.

  Third inherited "not automatable" row to fall this week, after offline and the map. Each had
  been recorded once and never re-tested.

🛑 WHY THIS IS A SEPARATE TEST, NOT AN EXTENSION OF MOB.730
  `MOB.730` is read-only and asserts the NO-radius state. This one deliberately SETS a radius,
  which writes `sessionStorage['asset_lookup_proximity_radius']`. Merging them would make the
  no-radius baseline depend on its own cleanup having worked. Kept apart, and wired LAST in
  `MOB.995` so residue cannot reach `MOB.700`/`MOB.720` even if the restore fails.

⚠️ THREE CONSTRAINTS, ALL MEASURED BY MOB.974 - none is a precaution
  1. THE STUB DOES NOT SURVIVE A NAVIGATION (probe G7, red twice). This test therefore does
     exactly ONE `go()`, at the top, and installs the stub after it. Do not add a navigation
     without re-installing.
  2. NEVER GATE A `Menu.Item` CLICK ON A BARE `wait`. Run 1 of MOB.974 failed to find
     `100 miles` behind a `wait 2`; run 2 found it with the IDENTICAL locator. The cause was
     never established - so every menu click here is preceded by a POLLING
     `assertElementPresent` on the same locator, which is a gate rather than a timer (trap 21).
  3. THE RADIUS PERSISTS AND AUTO-LOCATES ON MOUNT. A stored radius makes `AssetLookup`
     re-request geolocation on every later mount and silently FILTERS AND RE-SORTS the list
     (`index.tsx:67` flips `sortId` to `distanceFromMe`). That would corrupt `MOB.700` and
     `MOB.720` while leaving them green. Restore is belt AND braces: click `Clear`, then remove
     the key directly, then assert it is gone - all `alwaysExecute`.

WHAT IT PROVES, AND WHY EACH ASSERTION IS NON-VACUOUS
  label flip     `Near Me` -> `Within 25 mi`, and `Near Me` GONE - a swap, not a duplicate
  branch        `Update my location` / `Clear` appear; MOB.730 proves they are ABSENT without
                a radius, so the pair together prove the `{!!value && ...}` conditional
  the QUERY     the radius actually reaches the server call. Asserted through the app's own
                two outcomes: either rows carry `N mi away` (`formatDistance`), or the empty
                state reads `No Assets Within 25 mi` (`index.tsx:212`). Either one proves the
                filter was applied WITH THE RIGHT RADIUS - and the OR makes it independent of
                whether any fixture asset happens to sit near the stubbed coordinates, which is
                a geography dependency no test should carry.
  toast         `Update my location` only toasts on a RESOLVED position, so it re-proves the
                stub end to end rather than re-reading state already on screen.

🛑 NOT COVERED, and the reason is a real finding rather than a decision:
  THE AUTO-LOCATE-ON-MOUNT LEG. Proving it needs a navigation, after which the stub is gone
  (G7) and `ProximityMenu`'s mount effect fires BEFORE any step could re-install it - the
  effect races the runner. Reaching it needs a stub installed at page-load time, which the
  step model does not offer. Recorded so nobody re-derives it.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      radius_item_xp, RADIUS_IN_BOTH)

LOOKUP_URL = BASE + "/asset-lookup"
RADIUS_KEY = "asset_lookup_proximity_radius"
# ⭐ 25 is the ONLY radius offered in BOTH locales' option sets (imperial 5/10/25/50/100,
# metric 10/25/50/100/200). A test that CLICKS a radius has to use it or it is locale-locked.
# See the distance-units block in dd_tools.py for the full account.
RADIUS = RADIUS_IN_BOTH

NEAR_ME_BTN = '//button[contains(normalize-space(.), "Near Me")]'
# Unit-agnostic: "Within 25" is unambiguous on this screen, and matching the unit would
# re-pin the thing that broke this test in the first place.
WITHIN_BTN = f'//button[contains(normalize-space(.), "Within {RADIUS}")]'
MENU_ITEMS_JS = ("const items = [...document.querySelectorAll('.mantine-Menu-item')]"
                 ".map(e => (e.textContent || '').trim());\n")


def item(label):
    """A Mantine Menu.Item by exact label. Proven shape - MOB.348 and MOB.974 run 2."""
    return (f'//*[contains(concat(" ", normalize-space(@class), " "),'
            f' " mantine-Menu-item ")][normalize-space(.)="{label}"]')


def open_menu(btn_xpath, label, gate_label, always=False, gate_xp=None):
    """Open the menu, then WAIT FOR A NAMED ITEM rather than for a duration.

    Constraint 2. The polling assert IS the gate; a `wait` is a timer and rots (trap 21).
    `gate_label` is passed explicitly - deriving it from anything else (the `always` flag, the
    button) couples the gate to something that is free to change, which is how a gate quietly
    starts waiting for the wrong thing.

    `gate_xp` overrides the locator while keeping `gate_label` as the human name - needed for
    the radius item, whose rendered unit is locale-derived and must not be pinned.
    """
    return [
        step("click", label, {"element": xpath_el(LOOKUP_URL, f"({btn_xpath})[1]")},
             always=always, timeout=30),
        step("assertElementPresent",
             f'GATE: poll until "{gate_label}" exists — not a fixed wait',
             {"element": xpath_el(LOOKUP_URL, gate_xp or item(gate_label))},
             always=always, timeout=30),
    ]


STUB = """
try {
  var pos = { coords: { latitude: 41.8781, longitude: -87.6298, accuracy: 5,
                        altitude: null, altitudeAccuracy: null, heading: null, speed: null },
              timestamp: Date.now() };
  var g = navigator.geolocation;
  var ok = function (cb) { setTimeout(function () { cb(pos); }, 0); };
  g.getCurrentPosition = function (s) { ok(s); };
  g.watchPosition = function (s) { ok(s); return 1; };
  g.clearWatch = function () {};
  g.getCurrentPosition.__dd = true;
  return true;
} catch (e) { return false; }
"""

steps = [
    # Constraint 1: the ONLY navigation in this test. The stub goes in after it and must stay.
    go(LOOKUP_URL, "asset lookup"),
    step("wait", "Let the page mount", {"value": 4}),
    step("assertElementContent", 'GATE: the "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup",
          "element": xpath_el(LOOKUP_URL,
                              '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                              ' "Asset Lookup")]')}, timeout=60),

    # ---- BASELINE. Not optional: a radius left by an earlier subtest would mean the page
    # already auto-located on mount, and every reading below would be of the wrong state.
    jsassert(f"BASELINE: no radius is stored in sessionStorage['{RADIUS_KEY}']",
             f"const v = sessionStorage.getItem('{RADIUS_KEY}');\n"
             "return v === null || v === 'null' || v === '';", timeout=30),
    step("assertElementPresent", 'BASELINE: the button reads "Near Me" — no radius active',
         {"element": xpath_el(LOOKUP_URL, NEAR_ME_BTN)}, timeout=60),

    # ---- install the stub ---------------------------------------------------------------
    jsassert("STUB: install a fixed position over getCurrentPosition / watchPosition",
             STUB, timeout=15),
    jsassert("GUARD: the stub is really installed — a tagged function, not just any callable",
             "var f = navigator.geolocation && navigator.geolocation.getCurrentPosition;\n"
             "return !!f && f.__dd === true;", timeout=15),

    # ---- choose a radius -----------------------------------------------------------------
    *open_menu(NEAR_ME_BTN, 'Open the "Near Me" menu', f"{RADIUS} mi/km",
               gate_xp=radius_item_xp(RADIUS)),
    step("click",
         f'Choose "{RADIUS} mi" (or "{RADIUS} km") — calls locate() → the stubbed '
         f'getCurrentPosition',
         {"element": xpath_el(LOOKUP_URL, radius_item_xp(RADIUS))}, timeout=30),
    step("wait", "Let locate() resolve, then the list refetch with the radius filter",
         {"value": 6}),

    # ---- the label is state, not decoration ----------------------------------------------
    jsassert(f'⭐ the button now reads "Within {RADIUS} mi/km" — the app consumed the position',
             "return [...document.querySelectorAll('button')]"
             f".some(b => /Within\\s+{RADIUS}\\s*(mi|km)\\b/"
             ".test((b.textContent || '').trim()));",
             always=True, timeout=30),
    jsassert('"Near Me" is GONE — the label swapped rather than a second button appearing',
             "return ![...document.querySelectorAll('button')]"
             ".some(b => /^Near Me$/.test((b.textContent || '').trim()));",
             always=True, timeout=15),
    jsassert(f"the radius persisted to sessionStorage — {RADIUS}",
             f"return String(sessionStorage.getItem('{RADIUS_KEY}') || '')"
             f".indexOf('{RADIUS}') >= 0;", always=True, timeout=15),

    # ---- ⭐ THE QUERY. Proof the radius reached the server call, not just the button.
    # Two possible outcomes and BOTH prove it, so this does not depend on fixture geography:
    #   rows  -> `formatDistance` renders "N mi away" / "N km away" (index.tsx:281)
    #   empty -> the empty state reads "No Assets Within 25 mi" (index.tsx:212)
    # The empty branch names the RADIUS, so it proves the value propagated, not merely that
    # some filter ran. Unit-agnostic on both legs - `formatDistance` takes its suffix from the
    # same locale-derived `distanceUnit` as the menu.
    jsassert(f'⭐⭐ the radius reached the QUERY — rows show "mi/km away", or the empty state '
             f'reads "No Assets Within {RADIUS} mi/km"',
             "const t = document.body.innerText || '';\n"
             f"return /No Assets Within\\s+{RADIUS}\\s*(mi|km)\\b/.test(t)"
             " || /\\d+(\\.\\d+)?\\s*(mi|km) away/.test(t);", always=True, timeout=30),

    # ---- the `{!!value && ...}` branch ----------------------------------------------------
    # MOB.730 proves these are ABSENT with no radius. The pair is what proves the conditional.
    *open_menu(WITHIN_BTN, "Re-open the menu to read its conditional items",
               "Update my location", always=True),
    jsassert('"Update my location" and "Clear" have APPEARED — MOB.730 proves they are absent '
             'without a radius, so the pair proves the `{!!value}` branch',
             MENU_ITEMS_JS +
             "return items.includes('Update my location') && items.includes('Clear');",
             always=True, timeout=30),

    # `Update my location` toasts only on a RESOLVED position, so this re-proves the stub end
    # to end rather than re-reading state already on screen.
    step("click", 'Click "Update my location" — toasts only if a position RESOLVES',
         {"element": xpath_el(LOOKUP_URL, item("Update my location"))},
         always=True, timeout=30),
    step("wait", "Let locate() resolve and the toast render", {"value": 4}, always=True),
    jsassert('⭐ a "Location updated" toast appeared — the stub resolved a second time',
             "return /Location updated/.test(document.body.innerText || '');",
             always=True, timeout=30),

    # ---- RESTORE, belt AND braces. Constraint 3. -----------------------------------------
    # Clear through the UI first, so the CLEAR PATH ITSELF is covered rather than merely
    # cleaned up after.
    *open_menu(WITHIN_BTN, "Re-open the menu to Clear", "Clear", always=True),
    step("click", 'RESTORE: click "Clear" — also covers the clear path',
         {"element": xpath_el(LOOKUP_URL, item("Clear"))}, always=True, timeout=30),
    step("wait", "Let the list refetch unfiltered", {"value": 4}, always=True),

    jsassert('RESTORED: the button reads "Near Me" again — the radius is off',
             "return [...document.querySelectorAll('button')]"
             ".some(b => /^Near Me$/.test((b.textContent || '').trim()));",
             always=True, timeout=30),
    # Braces: the UI click may not have landed if anything above failed. Remove the key
    # directly so this test can never be what poisons a later subtest.
    jsassert(f"RESTORE (braces): remove sessionStorage['{RADIUS_KEY}'] directly",
             f"try {{ sessionStorage.removeItem('{RADIUS_KEY}'); }} catch (e) {{}}\nreturn true;",
             always=True, timeout=15),
    jsassert(f"RESTORED: sessionStorage['{RADIUS_KEY}'] is empty — no later subtest will "
             f"auto-locate on mount",
             f"const v = sessionStorage.getItem('{RADIUS_KEY}');\n"
             "return v === null || v === 'null' || v === '';", always=True, timeout=30),
]

write(test(
    "MOB.731_AssetLookup_Proximity_Radius",
    "`MOB.731` **The LOCATION half of \"Near Me\"** — the half `MOB.730` could not reach.\n"
    "- **Why it exists now**: the checklist said a runner cannot satisfy `getCurrentPosition`.\n"
    "  `MOB.974` measured that and it is **false** — the methods on `navigator.geolocation` are\n"
    "  writable, and probe **G3 proved the app consumes a stubbed position**. Third inherited\n"
    "  *\"not automatable\"* row to fall this week, after offline and the map.\n"
    "- **Proves**: the label flips `Near Me` → `Within 25 mi` (and `Near Me` is **gone**);\n"
    "  `Update my location`/`Clear` appear — `MOB.730` proves they are absent without a radius,\n"
    "  so the pair proves the `{!!value}` branch; **the radius reaches the QUERY**; and a\n"
    "  `Location updated` toast, which only fires on a resolved position.\n"
    "- ⭐ **The query assertion is deliberately an OR**: rows showing `mi away`, *or* the empty\n"
    "  state reading `No Assets Within 25 mi`. Both prove the filter ran **with the right\n"
    "  radius**, and the OR keeps the test independent of whether a fixture asset happens to\n"
    "  sit near the stubbed coordinates — geography is not a dependency a test should carry.\n"
    "- 🛑 **EVERY DISTANCE UNIT HERE IS MATCHED AS `(mi|km)`, DELIBERATELY.** The radius items,\n"
    "  the button label, the empty state and `formatDistance` all take their suffix from the\n"
    "  **browser locale** (`utils/distance`), not from the app. This test pinned `25 miles`\n"
    "  and had been unable to find its own radius since the 2026-09-02 localization commit —\n"
    "  fixed 09-08 by the codebase-sync audit, never by a run.\n"
    "- ⭐ **`25` is the radius on purpose**: it is the only one offered in BOTH option sets\n"
    "  (imperial `5/10/25/50/100`, metric `10/25/50/100/200`), so the click cannot become\n"
    "  locale-dependent. Do not change it to another value.\n"
    "- ⚠️ **Three measured constraints**: the stub **does not survive a navigation** (so there\n"
    "  is exactly one `go()`); every menu click is gated on a **polling assert, never a bare\n"
    "  `wait`**; and the radius **persists and auto-locates on mount**, so restore is belt\n"
    "  **and** braces — `Clear`, then remove the key, then assert it is gone.\n"
    "- 🛑 **Not covered**: auto-locate-on-mount. It needs a navigation, after which the stub is\n"
    "  gone and the mount effect races the runner. A real limit, not an omission.",
    steps,
    tags=["Mobile", "env:dev", "Asset Lookup", "Geolocation"],
))
print("wrote MOB.731 (asset lookup proximity radius — the location half)")
