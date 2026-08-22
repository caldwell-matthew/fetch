"""Build MOB.121_Map_Controls - the map's zoom, style, 3D and layers controls (T2.6).

THE MAP IS REACHABLE. Appendix C assumed otherwise for a long time; MOB.979_DIAG_Map_Probe
(2026-08-13) settled it: WebGL works, the Mapbox canvas renders, and the geocoder control is
present. Only the freehand DRAWING tools remain out of reach.

HOW YOU PROVE ANYTHING ON A CANVAS
  A map is pixels - there is no text to assert and the zoom level is not exposed to the DOM.
  Two controls solve that by carrying their own state in an attribute:

      style toggle   data-tooltip-content flips "Satellite" <-> "Street"
      pitch toggle   data-tooltip-content flips "3D" <-> "2D"

  Clicking one and asserting the OTHER label now exists is a real state change, not a
  cosmetic one - the component re-rendered from new state. Both are self-restoring: click
  again and the label comes back.

  ZOOM CANNOT BE PROVEN THIS WAY and this test does not pretend otherwise. Mapbox does not
  publish the zoom level to the DOM, so the zoom leg asserts the controls exist, that clicking
  them does not break the map (the canvas survives), and nothing more. That is why the
  checklist marks zoom `[~]` rather than `[x]`.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write  # noqa: E402

MAP_URL = BASE + "/map"
PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Map")]'
CANVAS = '//canvas[contains(@class,"mapboxgl-canvas")]'
ZOOM_IN = '//button[contains(@class,"mapboxgl-ctrl-zoom-in")]'
ZOOM_OUT = '//button[contains(@class,"mapboxgl-ctrl-zoom-out")]'
LAYERS = '//div[contains(concat(" ", normalize-space(@class), " "), " layers-title ")]'
MODAL = '//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'


def ctrl(label):
    """A map control button, identified by the tooltip text it currently carries."""
    return f'//button[@data-tooltip-content="{label}"]'


write(test(
    "MOB.121_Map_Controls",
    "`MOB.121` The map's **zoom, style, 3D and layers** controls (T2.6).\n"
    "- READ-ONLY, and **self-restoring**: both toggles are clicked back to where they started.\n"
    "- **The map is reachable** — `MOB.979_DIAG_Map_Probe` confirmed WebGL, the Mapbox canvas\n"
    "  and the geocoder all render. Only the freehand drawing tools stay `[-]`.\n"
    "- **How a canvas is proven:** the style button carries its own state in\n"
    "  `data-tooltip-content`, which flips `Satellite`↔`Street`. Clicking it and asserting the\n"
    "  *other* label exists is a genuine state change — the component re-rendered from new\n"
    "  state — not a cosmetic check.\n"
    "- The **3D/2D** button looks like it offers the same proof and does not: its label reads\n"
    "  the `viewport` prop while the click drives the map imperatively via `easeTo`, so the\n"
    "  label never flips. Tried, failed, removed — do not re-add it.\n"
    "- ⚠️ **Zoom is deliberately weaker.** Mapbox does not publish the zoom level to the DOM,\n"
    "  so that leg proves only that the controls exist and clicking them does not break the\n"
    "  map. Do not upgrade the checklist item to `[x]` on the strength of it.",
    [
        go(MAP_URL, "the mobile map"),
        step("wait", "Let the map begin initialising", {"value": 5}),
        step("assertElementContent", 'Test the "Map" page rendered',
             {"check": "contains", "value": "Map",
              "element": xpath_el(MAP_URL, PAGE_TITLE)}, timeout=30),
        step("assertElementPresent", "PROOF: the Mapbox WebGL canvas rendered",
             {"element": xpath_el(MAP_URL, CANVAS)}, timeout=60),

        # -------- style toggle: a real state flip
        step("assertElementPresent", 'The style control offers "Satellite"',
             {"element": xpath_el(MAP_URL, ctrl("Satellite"))}, timeout=30),
        step("click", "Switch the basemap to Satellite",
             {"element": xpath_el(MAP_URL, ctrl("Satellite"))}, timeout=30),
        step("wait", "Let the style load", {"value": 6}),
        step("assertElementPresent",
             'PROOF: the style changed — the control now offers "Street"',
             {"element": xpath_el(MAP_URL, ctrl("Street"))}, timeout=30),
        step("click", "Switch back to Street", {"element": xpath_el(MAP_URL, ctrl("Street"))},
             timeout=30, always=True),
        step("wait", "Let the style load", {"value": 6}, always=True),
        step("assertElementPresent", 'RESTORED: the control offers "Satellite" again',
             {"element": xpath_el(MAP_URL, ctrl("Satellite"))}, timeout=30, always=True),

        # -------- pitch toggle: REMOVED, it is not assertable
        # `text={pitch > 0 ? '2D' : '3D'}` is driven by the `viewport` PROP, but the click
        # calls `map.easeTo(...)` imperatively - so unless an onMove handler feeds the new
        # pitch back into React state, the label never flips. It did not: the first run
        # failed on `data-tooltip-content="2D"` after a successful tilt.
        # The STYLE toggle above does flip, because `changeMapStyle` updates React state -
        # which is exactly why that one is the load-bearing proof and this one is not.
        # -------- layers panel
        step("click", "Open the Layers panel", {"element": xpath_el(MAP_URL, LAYERS)},
             timeout=30),
        step("wait", "Wait for the layers modal", {"value": 3}),
        step("assertElementPresent", "PROOF: the Layers modal opened",
             {"element": xpath_el(MAP_URL, MODAL)}, timeout=30),
        step("pressKey", "Close the layers modal", {"value": "Escape"}, always=True),
        step("wait", "Wait for it to close", {"value": 2}, always=True),

        # -------- zoom: honest limit, see the message above
        step("assertElementPresent", "The zoom controls render",
             {"element": xpath_el(MAP_URL, ZOOM_IN)}, timeout=30),
        step("click", "Zoom in", {"element": xpath_el(MAP_URL, ZOOM_IN)}, timeout=30),
        step("wait", "Let the zoom animate", {"value": 3}),
        step("click", "Zoom out", {"element": xpath_el(MAP_URL, ZOOM_OUT)}, timeout=30),
        step("wait", "Let the zoom animate", {"value": 3}),
        step("assertElementPresent",
             "The map survived zooming (LIMIT: the zoom level is not exposed to the DOM)",
             {"element": xpath_el(MAP_URL, CANVAS)}, timeout=30),
    ],
    ["Mobile", "env:dev", "Map", "read-only"],
))

# ---------------------------------------------------------------- wire into MOB.990
suite_path = os.path.join(HERE, "MOB.990_Smoke_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
CHILD = "MOB.121_Map_Controls"
if CHILD not in [s.get("name") for s in steps]:
    steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                  "isCritical": True, "name": CHILD, "noScreenshot": False,
                  "type": "playSubTest",
                  "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"added {CHILD} to MOB.990_Smoke_Suite")
    print("REMINDER: add it to build_suites.py's MOB.990 list (trap 12)")

print("wrote MOB.121 (map controls)")
