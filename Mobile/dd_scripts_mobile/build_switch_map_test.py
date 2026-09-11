"""Build MOB.123 - the map's `Switch Map` picker (checklist 🟢 #12).

WHAT SHIPPED WITHOUT A TEST
  `ViewSelectButton.tsx` (shared by web and mobile, mounted by `MapGL/ControlButtons.tsx:76`)
  is a map-control button that opens a `Select a map` modal. `MOB.121` covers every other map
  control it could honestly prove; nothing opened this one.

THE BRANCH THIS TEST STANDS ON - settled for 0 Datadog runs
  The button is `disabled={loading || edges.length < 2}`: a one-map org gets a dead button and
  a multi-map org gets a picker. Which side dev is on was read through the API
  (`reset_av_fixture.Session`): the org has 3 maps, so it is ENABLED. The disabled side cannot
  be reached without deleting someone's maps and is not asserted - the test goes red if the org
  ever drops to one map, which is the correct reading of "the premise changed".

⭐ WHY A SWITCH IS SAFE, AND WHY IT IS THE PROOF
  `onSelect` is `setMapId` from `useSessionStorage('mobile-map-id')` (`Map/index.tsx:61`) - a
  client-side value, no mutation. So the test can actually switch and switch back, which is a
  far stronger claim than "a modal opened":

    1. OPEN      the modal shows the stored map, by id (the Select's hidden input), and lists
                 >= 2 maps with exactly one checked - the stored one.
    2. DISMISS   closing without picking leaves `mobile-map-id` untouched.
    3. SWITCH    picking another map writes ITS id and closes the picker. It closes because
                 `<MapGl key={mapId}>` (`index.tsx:420`) remounts the whole control stack -
                 the modal's `open` state goes with it. Pinned, because a picker that stayed
                 open on a stale map would be the regression.
    4. READBACK  reopening shows the NEW map checked - the component reads the value it wrote.
    5. RESTORE   pick the original back (`always`) so later suite children see the default map.

🛑 NO MAP NAME OR ID IS HARDCODED - trap 29. Every option carries its map id as a `value`
attribute (`OptionsDropdown.mjs` passes `value: data.value` through `ComboboxOption`'s rest
props), and the ids that matter are read from sessionStorage at run time and carried between
steps on `window` (the page never navigates, so it survives the remount).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

MAP_URL = BASE + "/map"
PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Map")]'
CANVAS = '//canvas[contains(@class,"mapboxgl-canvas")]'
# The shared `MapControlButton` sets aria-label; the mobile Home/2D/Satellite copies do not.
SWITCH_BTN = '//button[@aria-label="Switch Map"]'
PICKER = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
          '[.//*[contains(normalize-space(.), "Select a map")]]')
PICKER_INPUT = PICKER + '//input[not(@type="hidden")]'
OTHER_OPTION = '(//*[@role="listbox"]//*[@role="option"][not(@aria-selected="true")])[1]'

STORED = ("let stored = null;\n"
          "try { stored = JSON.parse(sessionStorage.getItem('mobile-map-id') || 'null'); }\n"
          "catch (e) { return false; }\n")
PICKER_JS = ("const m = [...document.querySelectorAll('[class*=\"mantine-Modal-content\"]')]\n"
             "  .find(x => (x.textContent || '').includes('Select a map'));\n")
OPTIONS_JS = "const opts = [...document.querySelectorAll('[role=\"listbox\"] [role=\"option\"]')];\n"


def open_picker(label, always=False):
    return [
        jsassert(f"{label}: the `Switch Map` control is ENABLED — the org has ≥ 2 maps",
                 "const b = document.querySelector('button[aria-label=\"Switch Map\"]');\n"
                 "return !!b && !b.disabled;", always=always, timeout=60),
        step("click", f"{label}: click `Switch Map`",
             {"element": xpath_el(MAP_URL, SWITCH_BTN)}, always=always, timeout=30),
        step("wait", "Let the picker open", {"value": 2}, always=always),
    ]


def open_dropdown(always=False):
    return [
        step("click", "Open the map dropdown", {"element": xpath_el(MAP_URL, PICKER_INPUT)},
             always=always, timeout=30),
        step("wait", "Let the options render", {"value": 2}, always=always),
    ]


def picker_shows(var, label):
    """The modal is open and its Select holds `window[var]` - by id, via the hidden input."""
    return jsassert(
        label,
        PICKER_JS +
        "if (!m) return false;\n"
        "const hidden = m.querySelector('input[type=\"hidden\"]');\n"
        "const shown = m.querySelector('input:not([type=\"hidden\"])');\n"
        f"return !!window.{var} && !!hidden && hidden.value === window.{var}\n"
        "  && !!shown && shown.value.trim().length > 0;", timeout=30)


def options_check(var, label):
    return jsassert(
        label,
        PICKER_JS + OPTIONS_JS +
        "if (!m || opts.length < 2) return false;\n"
        "const checked = opts.filter(o => o.getAttribute('aria-selected') === 'true');\n"
        "if (checked.length !== 1) return false;\n"
        "const shown = m.querySelector('input:not([type=\"hidden\"])');\n"
        f"return checked[0].getAttribute('value') === window.{var}\n"
        "  && !!shown && shown.value === (checked[0].textContent || '').trim();", timeout=30)


def map_back(label, always=False):
    return [
        step("wait", "Let the map remount on the new map id", {"value": 5}, always=always),
        step("assertElementPresent", f"{label}: the Mapbox canvas rendered again",
             {"element": xpath_el(MAP_URL, CANVAS)}, always=always, timeout=60),
    ]


steps = [
    go(MAP_URL, "the mobile map"),
    step("wait", "Let the map begin initialising", {"value": 5}),
    step("assertElementContent", 'Test the "Map" page rendered',
         {"check": "contains", "value": "Map", "element": xpath_el(MAP_URL, PAGE_TITLE)},
         timeout=30),
    step("assertElementPresent", "The Mapbox WebGL canvas rendered",
         {"element": xpath_el(MAP_URL, CANVAS)}, timeout=60),
    jsassert("CAPTURE: `mobile-map-id` holds the map on screen (written on mount from the "
             "user's default map)",
             STORED +
             "if (typeof stored !== 'string' || !stored) return false;\n"
             "window.__ddMapBefore = stored;\n"
             "return true;", timeout=30),

    # ---- 1. OPEN ------------------------------------------------------------------------------
] + open_picker("OPEN") + [
    picker_shows("__ddMapBefore",
                 "⭐ OPEN: the `Select a map` modal holds the STORED map, by id, and names it"),
] + open_dropdown() + [
    options_check("__ddMapBefore",
                  "⭐ OPTIONS: at least 2 maps listed, exactly one checked, and it is the "
                  "stored map — the name in the input is that option's"),

    # ---- 2. DISMISS: no pick, no write --------------------------------------------------------
    # The close button, not Escape: with the dropdown open, whether Escape closes the dropdown
    # or the modal depends on where focus sits - an ambiguity this step does not need.
    jsassert("Close the picker with its close button",
             PICKER_JS +
             "if (!m) return false;\n"
             "const x = m.querySelector('button[class*=\"mantine-Modal-close\"]');\n"
             "if (!x) return false;\n"
             "x.click();\n"
             "return true;", timeout=30),
    step("wait", "Let the picker close", {"value": 2}),
    jsassert("DISMISS: the picker is gone and `mobile-map-id` is UNCHANGED — closing is not "
             "a switch",
             STORED + PICKER_JS +
             "return !m && stored === window.__ddMapBefore;", timeout=30),

    # ---- 3. SWITCH -----------------------------------------------------------------------------
] + open_picker("SWITCH") + open_dropdown() + [
    jsassert("CAPTURE: the first map that is NOT the current one — the option the next "
             "click will pick",
             OPTIONS_JS +
             "const o = opts.find(x => x.getAttribute('aria-selected') !== 'true');\n"
             "const v = o && o.getAttribute('value');\n"
             "if (!v || v === window.__ddMapBefore) return false;\n"
             "window.__ddMapPicked = v;\n"
             "return true;", timeout=30),
    step("click", "Pick that map", {"element": xpath_el(MAP_URL, OTHER_OPTION)}, timeout=30),
] + map_back("SWITCHED") + [
    jsassert("⭐ SWITCHED: `mobile-map-id` now holds the PICKED map, not the original — and the "
             "picker closed, because `<MapGl key={mapId}>` remounts the control stack",
             STORED + PICKER_JS +
             "return !m && !!window.__ddMapPicked && stored === window.__ddMapPicked\n"
             "  && stored !== window.__ddMapBefore;", timeout=30),

    # ---- 4. READBACK --------------------------------------------------------------------------
] + open_picker("READBACK") + [
    picker_shows("__ddMapPicked",
                 "⭐ READBACK: the reopened picker holds the NEW map — the component reads "
                 "back the value it wrote"),
] + open_dropdown() + [
    options_check("__ddMapPicked", "READBACK: the NEW map is the one checked option"),

    # ---- 5. RESTORE (always) ------------------------------------------------------------------
    jsassert("RESTORE: pick the original map back",
             OPTIONS_JS +
             "const o = opts.find(x => x.getAttribute('value') === window.__ddMapBefore);\n"
             "if (!o) return false;\n"
             "o.click();\n"
             "return true;", always=True, timeout=30),
] + map_back("RESTORED", always=True) + [
    jsassert("RESTORED: no picker is open and `mobile-map-id` is the ORIGINAL map again",
             STORED + PICKER_JS +
             "return !m && !!window.__ddMapBefore && stored === window.__ddMapBefore;",
             always=True, timeout=30),
]

write(test(
    "MOB.123_Map_Switch_Map",
    "`MOB.123` **The map's `Switch Map` picker** — checklist 🟢 #12.\n"
    "- **Switches and switches back.** `onSelect` only writes `mobile-map-id` to\n"
    "  sessionStorage — no mutation — so the test proves a real switch, not just that a modal\n"
    "  opened: OPEN (holds the stored map, ≥ 2 options, one checked) → DISMISS (no write) →\n"
    "  SWITCH (the picked id is stored) → READBACK (reopened, the new map is checked) →\n"
    "  RESTORE (`always`).\n"
    "- **The pick closes the picker** because `<MapGl key={mapId}>` remounts the whole control\n"
    "  stack. Pinned: a picker left open on a stale map would be the regression.\n"
    "- **Premise:** the button is disabled below 2 maps. Dev has 3 (read over the API, 0 runs),\n"
    "  so this is the enabled side; the disabled side needs someone's maps deleted and is not\n"
    "  asserted.\n"
    "- 🛑 **No map name or id is hardcoded** (trap 29): options are matched by their `value`\n"
    "  attribute against ids read from sessionStorage at run time, carried between steps on\n"
    "  `window` (the page never navigates).",
    steps,
    ["Mobile", "env:dev", "Map", "read-only"],
))

# Suite membership lives in build_suites.py's MOB.990 list (trap 19), not here: wiring a child
# before it exists in Datadog stamps PENDING-WIRE-UP and the suite push 400s.
print("wrote MOB.123 (map Switch Map picker)")
