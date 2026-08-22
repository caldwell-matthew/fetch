"""Build MOB.341_Work_Map_Toggle and MOB.342_Work_Status_Ring - the two work LIST controls
that had never been enumerated (T2.1, found 2026-08-18).

T2.1 was marked "complete" because the work order DETAIL page is thoroughly covered. The
LIST page was not: `WorkOrders/index.tsx` renders a map-view toggle at :223 and a status
ring with a clickable legend at :186, and neither had a test.

MOB.341 - MAP VIEW TOGGLE
  Two things make this worth a test rather than a smoke check:

  1. The click is a NO-OP until the list has fully loaded -
     `onClick={() => loadedAll ? setMapView(!mapView) : undefined}`. A test that clicked
     early would look like it worked. `work_list_gate()` is what stops that.
  2. The state PERSISTS. `useSessionStorage({ key: 'show-mobile-work-map' })` means the
     choice survives navigation *and* survives into every later subtest in the same suite
     run, because Datadog reuses one browser session across a suite. So the restore leg is
     not politeness - without it this test would leave /work in map view and every
     work-order test after it would find no list. The restore is `alwaysExecute` for
     exactly that reason (trap 16c).

  Because the state is persisted, sessionStorage is the source of truth to assert against
  rather than the icon (trap 16).

MOB.342 - STATUS RING AND LEGEND
  Same shape as MOB.560, which does this for the mobile job list - the checklist explicitly
  says to copy it. The positive/negative pair is the whole point: a legend that only
  highlighted itself would satisfy a positive-only test.

  THE NEGATIVE IS A COMPUTED STYLE, NOT TEXT. MOB.560 could assert that a named fixture job
  vanished. Here it cannot: `listFieldsToDisplay` is `_assets` and `address` only, so a work
  row NEVER renders its own status as text - the status is carried solely by the row's
  `borderLeft` colour. That is why the checklist had "status badge colour" pencilled in as
  "likely an honest [-]". It is not: colour is unreachable from an XPath but perfectly
  reachable from `getComputedStyle`, so the proof here is that after filtering to `Ready`
  EVERY rendered row's left border is the Ready colour (#9BCB52 -> rgb(155, 203, 82)).
  That both proves the filter and closes the colour item.

  The legend renders `Status (n)` and ONLY for statuses with n > 0 (`v.quantity > 0`), so
  no test can assume a given status is present. `Ready` is the one that can be assumed:
  MOB.320 walks the fixture work order through every status and leaves it Ready.

  Selection is also visible in the DOM: `LegendItem` wraps its label in a Mantine
  `Highlight` when selected, which emits a <mark>. Clicking again clears it
  (`c === status ? '' : status`), which is what makes this test self-restoring.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, HERE, WORK_URL, step, xpath_el, test, write,  # noqa: E402
                      jsassert, work_list_gate)

MAP_KEY = "show-mobile-work-map"
READY_RGB = "rgb(155, 203, 82)"      # STATUS_COLORS.Ready = #9BCB52

# Icon-only button. Names MEASURED, not guessed (trap 14):
#   node -e "console.log(require('@fortawesome/pro-regular-svg-icons').faGlobe.iconName)"
#     faGlobe -> globe   (shown while in LIST view - click it to get the map)
#     faList  -> list    (shown while in MAP view  - click it to get the list back)
# Both variants are matched in each direction so a FontAwesome upgrade that re-canonicalises
# one of them degrades to a locator miss rather than a silent wrong-element click.
def toggle(icon, alt):
    return (f'//button[.//*[@data-icon="{icon}" or contains(concat(" ", normalize-space(@class), " "), " fa-{icon} ")'
            f' or @data-icon="{alt}" or contains(concat(" ", normalize-space(@class), " "), " fa-{alt} ")]]')


TO_MAP = toggle("globe", "earth-americas")
TO_LIST = toggle("list", "list-ul")

# The legend item for a status. Rendered as `<List.Item>` -> <li>, text `Ready (n)`, so the
# count is deliberately NOT part of the match - it changes with the crew's work list.
def legend(status):
    return f'//li[contains(normalize-space(.), "{status} (")]'


def sessionstorage_is(value, label, always=False):
    return jsassert(
        label,
        f"return sessionStorage.getItem('{MAP_KEY}') === {value};",
        always=always, timeout=30)


# ---------------------------------------------------------------- MOB.341
write(test(
    "MOB.341_Work_Map_Toggle",
    "`MOB.341` The work list's map-view toggle (T2.1).\n"
    "- **SELF-RESTORING, and it has to be.** `mapView` is `useSessionStorage`\n"
    f"  (`{MAP_KEY}`), and Datadog reuses ONE browser session across a whole suite — so a\n"
    "  run that ended in map view would leave every later work-order subtest looking at a\n"
    "  map instead of a list. The restore leg is `alwaysExecute` (trap 16c).\n"
    "- ⚠️ **The toggle is a silent no-op until the list finishes loading** —\n"
    "  `onClick={() => loadedAll ? setMapView(!mapView) : undefined}`. Clicking early\n"
    "  reports a successful click and changes nothing, so this test uses the shared\n"
    "  `work_list_gate()`, whose three `assertPageLacks` checks are how `loadedAll` is\n"
    "  inferred (there is no positive flag in the DOM).\n"
    "- **The proof is sessionStorage, not the icon** (trap 16): the state is persisted, so\n"
    "  the stored value is the source of truth and the icon is only a rendering of it.\n"
    "- Gated on `permissions.map.read`, so this runs as `Admin`.\n"
    "- Icon names were **measured** (trap 14): `faGlobe` → `globe`, `faList` → `list`.\n"
    "- ⚠️ **Asserts nothing about work ROWS, deliberately.** The `Admin` crew's work list is\n"
    "  empty (measured — `MOB.978_DIAG_WorkList_Probe`), so a row-count check would be\n"
    "  vacuously true (trap 5). The list-vs-map discriminator is the Virtuoso scroller and\n"
    "  the Mapbox canvas, both of which hold regardless of how much data there is.",
    work_list_gate(require_row=False) + [
        sessionstorage_is("null || sessionStorage.getItem('" + MAP_KEY + "') === 'false'",
                          "BASELINE: the list is NOT in map view"),
        jsassert("BASELINE: the list container is showing and no map canvas exists yet",
                 "const list = document.querySelector('[data-virtuoso-scroller],"
                 " [data-testid*=\"virtuoso\"]');\n"
                 "return !!list && !document.querySelector('canvas.mapboxgl-canvas');",
                 timeout=30),
        step("assertElementPresent", "The map toggle is present (permissions.map.read)",
             {"element": xpath_el(WORK_URL, TO_MAP)}, timeout=30),

        step("click", "Switch the work list to map view",
             {"element": xpath_el(WORK_URL, TO_MAP)}, timeout=30),
        step("wait", "Let Mapbox initialise", {"value": 6}),
        sessionstorage_is("'true'",
                          f"PROOF: sessionStorage['{MAP_KEY}'] is now 'true'"),
        step("assertElementPresent", "PROOF: the Mapbox WebGL canvas rendered on /work",
             {"element": xpath_el(WORK_URL,
                                  '//canvas[contains(@class,"mapboxgl-canvas")]')},
             timeout=60),
        jsassert("PROOF: the LIST container is gone — the map replaced it, it did not stack",
                 # The Virtuoso scroller renders only in the list branch; `WorkMapView` is the
                 # other branch of the same ternary. This works on an EMPTY list, where a
                 # row-count check would be vacuously true (trap 5).
                 "return !document.querySelector('[data-virtuoso-scroller],"
                 " [data-testid*=\"virtuoso\"]');",
                 timeout=30),

        # --- restore. alwaysExecute: a failure above must not strand the session in map view.
        step("click", "Switch back to the list view (restore)",
             {"element": xpath_el(WORK_URL, TO_LIST)}, timeout=30, always=True),
        step("wait", "Let the list re-render", {"value": 4}, always=True),
        sessionstorage_is("'false'",
                          f"RESTORED: sessionStorage['{MAP_KEY}'] is back to 'false'",
                          always=True),
        jsassert("RESTORED: the list container is back and the map canvas is gone",
                 "const list = document.querySelector('[data-virtuoso-scroller],"
                 " [data-testid*=\"virtuoso\"]');\n"
                 "const canvas = document.querySelector('canvas.mapboxgl-canvas');\n"
                 "return !!list && !canvas;",
                 always=True, timeout=60),
    ],
    ["Mobile", "env:dev", "Work Order", "Map", "read-only"],
))

# ---------------------------------------------------------------- MOB.342 — NOT BUILT
# The status-ring test was written, run, and then WITHDRAWN on 2026-08-18. It cannot pass:
# the `Admin` crew's work list is EMPTY, so `WorkStatusSummary` renders a RingProgress with
# `sections=[]` and a legend with no entries at all (`v.quantity > 0` filters every one out).
# There is nothing to filter and nothing to assert.
#
# Measured, not assumed - MOB.978_DIAG_WorkList_Probe settled it in one run:
#     P8  RingProgress rendered ................ PASS  (the component mounts)
#     P9  legend has a "Status (n)" entry ...... FAIL  (so every quantity is 0)
#     P10 body contains "Ready (" .............. FAIL
#     P1  any element with class *Paper* ....... FAIL  (zero rows, not a locator fault)
#     P11 Virtuoso scroller mounted ............ PASS  (the list container is there)
#     P12 search box present ................... PASS  (the control that had been "passing")
#
# Blocked on FIXTURE DATA, not on effort - the same category as the permit/warranty TODOs.
# Assign one work order to the `Admin` crew and this test becomes writable as drafted: the
# borderLeft-colour proof in the checklist (T2.1) is still the right design, because a work
# row never renders its own status as text.

# ---------------------------------------------------------------- wire into MOB.986
# MOB.986_WorkOrders_Extra is the right home: these are READ-ONLY, and MOB.991 is the
# mutating suite. Putting them in 991 would tie two harmless checks to a suite that has to
# be run on a cleanup cadence.
suite_path = os.path.join(HERE, "MOB.986_WorkOrders_Extra_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
existing = [s.get("name") for s in steps]
for child in ["MOB.341_Work_Map_Toggle"]:
    if child not in existing:
        steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                      "isCritical": True, "name": child, "noScreenshot": False,
                      "type": "playSubTest",
                      "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
        print(f"added {child} to MOB.986_WorkOrders_Extra_Suite")
with open(suite_path, "w") as f:
    f.write(json.dumps(doc, indent=4))

print("wrote MOB.341 (work map toggle); MOB.342 withdrawn - empty crew work list")
