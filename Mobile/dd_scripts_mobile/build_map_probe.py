"""TEMPORARY probe - is the Mobile Map reachable by a Datadog browser test at all?

THE QUESTION
  T2.6 has two open items and one uncovered work-order create entry point (the map's
  `Add Work`). `MobileGeocoderPopup` renders a DOM button, so the POPUP is assertable - but
  only if the map itself initialises. react-map-gl needs a WebGL context, and a headless
  Chrome may not provide one. Appendix C already assumes map DRAWING is unreachable; this
  settles whether anything on the map is.

  MOB.120 proves the ROUTE renders (page title). It does not prove the map does.

EVERY PROBE IS `optional`
  So one run reports all of them instead of stopping at the first negative - the same pattern
  used for the earlier attribute diagnostic. Read the result with `dd_tools.py report`: a
  probe that ERRs is a "no".

  probe                       a PASS means
  ---------------------------------------------------------------------------
  .apm-map container          the React tree mounted (does not need WebGL)
  canvas.mapboxgl-canvas      *** WEBGL WORKS *** - the map actually initialised
  .mapboxgl-ctrl-geocoder     the geocoder search control rendered (DOM, not canvas)
  "Add Work" text             a popup is already open (not expected without interaction)

  If the canvas probe fails but the container passes, the map mounts and never paints:
  T2.6 becomes an honest Appendix C entry rather than an open item.

DELETE THIS FILE once the question is settled. It is a probe, not coverage.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write, jsassert  # noqa: E402

MAP_URL = BASE + "/map"

login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]

# WebGL support, asked directly rather than inferred from whether a canvas appeared.
WEBGL = """
const c = document.createElement('canvas');
const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
return !!gl;
"""

write(test(
    "MOB.979_DIAG_Map_Probe",
    "**TEMPORARY DIAGNOSTIC — not coverage. Delete once T2.6 is settled.**\n"
    "- Answers, in ONE run, whether the Mobile Map is reachable by a Datadog browser test.\n"
    "- Every probe is `optional`, so the test passes and `report` shows which probes failed.\n"
    "- The decisive one is the **WebGL canvas**: if it never appears, the map mounts but never\n"
    "  paints, and T2.6's two items plus the map `Add Work` entry point become an honest\n"
    "  Appendix C entry instead of sitting open.\n"
    "- `MOB.120` already proves the *route* renders; this is about the map itself.",
    login_steps + [
        go(MAP_URL, "the mobile map"),
        step("wait", "Let the map attempt to initialise", {"value": 15}),

        jsassert("PROBE: the browser reports WebGL support at all", WEBGL, optional=True),
        step("assertElementPresent", "PROBE: the .apm-map container mounted",
             {"element": xpath_el(MAP_URL,
                                  '//div[contains(concat(" ", normalize-space(@class), " "),'
                                  ' " apm-map ")]')}, optional=True),
        step("assertElementPresent", "PROBE (decisive): the Mapbox WebGL canvas rendered",
             {"element": xpath_el(MAP_URL, '//canvas[contains(@class,"mapboxgl-canvas")]')},
             optional=True),
        step("assertElementPresent", "PROBE: the geocoder search control rendered",
             {"element": xpath_el(MAP_URL,
                                  '//input[contains(@class,"mapboxgl-ctrl-geocoder--input")]')},
             optional=True),
        step("assertElementPresent", "PROBE: any Mapbox control rendered",
             {"element": xpath_el(MAP_URL, '//*[contains(@class,"mapboxgl-ctrl")]')},
             optional=True),
        # Dumps whatever the map area actually contains, via an impossible assertion - the
        # only way this pipeline can read text back off a page.
        step("assertElementContent", "DUMP: what the map area actually contains",
             {"check": "contains", "value": "___DUMP___",
              "element": xpath_el(MAP_URL, '//div[contains(@class,"apm-map")]')},
             optional=True),
    ],
    ["Mobile", "env:dev", "diagnostic", "read-only"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))

print("wrote MOB.979_DIAG_Map_Probe (TEMPORARY - delete after use)")
