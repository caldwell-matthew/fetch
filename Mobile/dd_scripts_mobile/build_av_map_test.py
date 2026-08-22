"""Build MOB.585_AssetVerify_Map_Toggle - the job asset list's map view (T2.2, found
uncovered 2026-08-18).

`Job.tsx:212` renders the same `ToggleMapViewButton` the work list uses, and :230 swaps the
asset accordion for `JobAssetMap`. Neither had a test.

TWO DIFFERENCES FROM MOB.341, BOTH DELIBERATE
  1. NO `loadedAll` GUARD. The work list wraps its toggle in
     `loadedAll ? setMapView(!mapView) : undefined`; this one is a plain
     `onClick={() => setMapView(!mapView)}`, so it is live as soon as the page renders.
     The readiness problem here is different and worse - the detail route is `cache-only`
     and renders NOTHING on a cold cache - which is what `av_job_gate` exists for.
  2. A DIFFERENT sessionStorage KEY. `show-mobile-asset-ver-map`, not
     `show-mobile-work-map`. Same persistence hazard: Datadog reuses one browser session
     for a whole suite, so leaving this set to 'true' would put every later Asset
     Verification subtest on a map instead of an asset list. The restore leg is
     `alwaysExecute`.

WHAT IS NOT COVERED HERE, AND WHY
  `JobAssetMap` colours each marker `verified ? 'green' : 'blue'` and only plots assets that
  have BOTH latitude and longitude. Neither is asserted:
    - marker colour is painted into the WebGL canvas, not the DOM (Appendix C);
    - tapping a marker to reach its `MarkerInfo` popup is a canvas hit-test, the same
      barrier that keeps `ChangeAssetPopup` at `[-]` in T2.6.
  So this test proves the TOGGLE and the canvas, and stops there. Whether the fixture's
  assets carry coordinates at all is unknown - which is exactly why no assertion here
  depends on a marker existing.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, HERE, step, xpath_el, test, write, jsassert,  # noqa: E402
                      av_job_gate)

JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
JOB_URL = f"{BASE}/asset-verify/{JOB_ID}"
MAP_KEY = "show-mobile-asset-ver-map"

# Icon names MEASURED (trap 14): faGlobe -> "globe", faList -> "list".
def toggle(icon, alt):
    return (f'//button[.//*[@data-icon="{icon}" or contains(concat(" ", normalize-space(@class), " "), " fa-{icon} ")'
            f' or @data-icon="{alt}" or contains(concat(" ", normalize-space(@class), " "), " fa-{alt} ")]]')


TO_MAP = toggle("globe", "earth-americas")
TO_LIST = toggle("list", "list-ul")
ASSET_ROW = '(//*[contains(@class,"mantine-Accordion-item")])[1]'


def stored(expr, label, always=False):
    return jsassert(label, f"return {expr};", always=always, timeout=30)


write(test(
    "MOB.585_AssetVerify_Map_Toggle",
    "`MOB.585` The mobile job asset list's map-view toggle (T2.2).\n"
    "- **SELF-RESTORING, and it has to be.** `mapView` is `useSessionStorage`\n"
    f"  (`{MAP_KEY}`) and Datadog reuses ONE browser session across a suite, so a run that\n"
    "  ended in map view would leave every later Asset Verification subtest looking at a\n"
    "  map. The restore leg is `alwaysExecute` (trap 16c).\n"
    "- **Unlike the work list, there is no `loadedAll` guard** — `Job.tsx` uses a plain\n"
    "  `onClick={() => setMapView(!mapView)}`, so the toggle is live immediately. The\n"
    "  readiness problem here is the `cache-only` detail route, which is what\n"
    "  `av_job_gate` handles: it clicks the job row rather than deep-linking.\n"
    "- **The proof is sessionStorage** (trap 16) plus the Mapbox canvas; the icon is only a\n"
    "  rendering of the state.\n"
    "- Gated on `permissions.map.read`, so this runs as `Admin`.\n"
    "- ⚠️ **Markers are not asserted.** Colour (`verified ? green : blue`) is painted into\n"
    "  WebGL, and tapping a marker is a canvas hit-test — the same barrier that keeps\n"
    "  `ChangeAssetPopup` at `[-]` (Appendix C). It is also unknown whether the fixture's\n"
    "  assets carry lat/long at all, so nothing here depends on a marker existing.",
    av_job_gate(JOB_ID) + [
        stored(f"sessionStorage.getItem('{MAP_KEY}') === null"
               f" || sessionStorage.getItem('{MAP_KEY}') === 'false'",
               "BASELINE: the asset list is NOT in map view"),
        step("assertElementPresent", "The map toggle is present (permissions.map.read)",
             {"element": xpath_el(JOB_URL, TO_MAP)}, timeout=30),

        step("click", "Switch the asset list to map view",
             {"element": xpath_el(JOB_URL, TO_MAP)}, timeout=30),
        step("wait", "Let Mapbox initialise", {"value": 6}),
        stored(f"sessionStorage.getItem('{MAP_KEY}') === 'true'",
               f"PROOF: sessionStorage['{MAP_KEY}'] is now 'true'"),
        step("assertElementPresent", "PROOF: the Mapbox WebGL canvas rendered",
             {"element": xpath_el(JOB_URL,
                                  '//canvas[contains(@class,"mapboxgl-canvas")]')},
             timeout=60),
        jsassert("PROOF: the asset accordion is gone — the map replaced it",
                 "return document.querySelectorAll('.mantine-Accordion-item').length === 0;",
                 timeout=30),

        step("click", "Switch back to the asset list (restore)",
             {"element": xpath_el(JOB_URL, TO_LIST)}, timeout=30, always=True),
        step("wait", "Let the accordion re-render", {"value": 4}, always=True),
        stored(f"sessionStorage.getItem('{MAP_KEY}') === 'false'",
               f"RESTORED: sessionStorage['{MAP_KEY}'] is back to 'false'", always=True),
        step("assertElementPresent", "RESTORED: the asset rows are listed again",
             {"element": xpath_el(JOB_URL, ASSET_ROW)}, timeout=60, always=True),
    ],
    ["Mobile", "env:dev", "Asset Verification", "Map", "read-only"],
))

# ---------------------------------------------------------------- wire into MOB.993
suite_path = os.path.join(HERE, "MOB.993_AssetVerify_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
CHILD = "MOB.585_AssetVerify_Map_Toggle"
if CHILD not in [s.get("name") for s in steps]:
    steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                  "isCritical": True, "name": CHILD, "noScreenshot": False,
                  "type": "playSubTest",
                  "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"added {CHILD} to MOB.993_AssetVerify_Suite")

print("wrote MOB.585 (asset verification map toggle)")
