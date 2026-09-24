"""Build MOB.735_AssetLookup_View_In_Map - the row-level "View in Map" button.

WHY THIS EXISTS
  `AssetLookup/index.tsx:333-343` renders a SECOND button on an expanded result row, beside
  `Add Work`:

      onClick={() => navigate('/map', { state: {
          recordType: 'Asset', recordId: asset.id, lat: asset.latitude, lng: asset.longitude
      }})}

  ⭐ IT IS THE ONLY NAVIGATION IN MOBILE THAT CARRIES ROUTER STATE rather than encoding
  everything in the URL. Nothing else in the app is shaped like it, so no existing test
  covers the mechanism by side effect. `Map/index.tsx:142-184` is the consumer: on mount it
  reads `location.state`, and for `recordType === 'Asset'` with `lat`/`lng`/`recordId` it
  queries the rendered features and opens an informational card.

  Its sibling `Add Work` is a deliberate non-goal (Appendix A) because it creates a permanent
  work order. That decision was about residue and never applied to this button, which
  navigates and writes nothing.

WHAT IS ASSERTED, AND THE ONE THING THAT DELIBERATELY IS NOT
  The card that Map/index.tsx opens depends on `queryRenderedFeatures` finding the asset on
  the CANVAS - a WebGL hit test against whatever tiles happen to be loaded at that moment.
  That is the same barrier as `ChangeAssetPopup` (T2.6, Appendix C), and asserting the card
  would make this test depend on tile loading and geography. So:

    ASSERTED  the button renders on the expanded row
    ASSERTED  clicking it lands on /map, and the map actually initialises (WebGL canvas)
    ASSERTED  ⭐ THE STATE ARRIVED - `history.state.usr` carries recordType/recordId/lat/lng
    NOT       that the informational card opened (canvas hit test - Appendix C)

  The `history.state.usr` assertion is the point of the test. React Router v6's `navigate(to,
  {state})` stores the payload at `window.history.state.usr`, so reading it proves the state
  was carried across the navigation - the exact mechanism nothing else here exercises - and it
  does so WITHOUT touching the canvas. Landing on /map alone would pass with the state
  silently dropped, which is the regression actually worth catching (trap 5).

⚠️ FIXTURE DEPENDENCY, STATED UP FRONT
  The button is gated `{showButtons && asset.latitude && asset.longitude && ...}`, so it does
  not render for an asset without coordinates. Whether `Pump 0102` carries them is NOT known
  from source - `MOB.585` records the same open question about the AV fixture's assets. The
  guard below is therefore named as a FIXTURE GUARD: if it fails, the answer is "this asset has
  no coordinates, pick another", not "the locator is wrong". Do not convert it to an
  exclusive-or - a test that passes when the button is absent proves nothing about it.

⚠️ IT ENDS ON /map, NOT ON /asset-lookup. Every Asset Lookup subtest starts with its own
  `goToUrl`, so that is safe - but it is why this is wired BEFORE `MOB.730`/`MOB.731` rather
  than after: those two own the proximity radius restore, and nothing should run between the
  radius being cleared and the end of the suite.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

LOOKUP_URL = BASE + "/asset-lookup"
MAP_URL = BASE + "/map"
ASSET = "Pump 0102"

ITEM = '(//*[contains(@class,"mantine-Accordion-item")])[1]'
# Scoped to the expanded row. The button's text is its only handle - it is a plain Mantine
# Button with no id, name or aria-label (`index.tsx:334-342`).
VIEW_BTN = f'{ITEM}//button[normalize-space(.)="View in Map"]'

steps = [
    go(LOOKUP_URL, "asset lookup"),
    step("wait", "Wait for the page to mount", {"value": 3}),
    step("assertElementContent", 'Test the "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup",
          "element": xpath_el(LOOKUP_URL,
                              '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                              ' "Asset Lookup")]')}, timeout=30),

    # ---- reach the asset (the MOB.720 prefix, proven) --------------------------------------
    step("click", "Focus the search input",
         {"element": xpath_el(LOOKUP_URL, '//input[@name="asset-search"]')}, timeout=30),
    step("pressKey", "Select any persisted query first (typeText APPENDS — trap 17)",
         {"value": "a", "modifiers": ["Control"]}),
    step("typeText", f"Search for {ASSET}",
         {"value": ASSET, "element": xpath_el(LOOKUP_URL, '//input[@name="asset-search"]')}),
    step("pressKey", "Submit the search (Enter — there is no search button)",
         {"value": "Enter"}),
    step("wait", "Wait for the search results", {"value": 5}),
    step("assertElementPresent", f"RESULT GUARD: a result row for {ASSET} rendered",
         {"element": xpath_el(LOOKUP_URL, f'{ITEM}[contains(., "{ASSET}")]')}, timeout=60),

    step("click", "Expand the first result",
         {"element": xpath_el(LOOKUP_URL,
                              f'{ITEM}//*[contains(@class,"mantine-Accordion-control")]')},
         timeout=30),
    step("wait", "Wait for the detail panel to mount", {"value": 3}),

    # ---- the button ------------------------------------------------------------------------
    # FIXTURE GUARD - see the header. Gated on asset.latitude && asset.longitude, so a failure
    # here is a statement about the asset's data, not about the locator.
    step("assertElementPresent",
         f'FIXTURE GUARD: "View in Map" renders — i.e. {ASSET} has lat AND lng',
         {"element": xpath_el(LOOKUP_URL, VIEW_BTN)}, timeout=60),
    # Its sibling proves we are reading the row's real button group rather than a stray match:
    # `Add Work` is rendered unconditionally under `showButtons`, so it must be there too.
    step("assertElementPresent",
         'Its sibling "Add Work" is there too (proves this is the row\'s button group)',
         {"element": xpath_el(LOOKUP_URL,
                              f'{ITEM}//button[normalize-space(.)="Add Work"]')},
         timeout=30),

    # Record where we are, so the navigation assertion below is a CHANGE rather than a
    # coincidence: /asset-lookup and /map are different paths, and asserting the destination
    # without knowing the origin would pass if the click did nothing and we were already there.
    jsassert("BASELINE: we are on /asset-lookup, not /map",
             "return location.pathname.endsWith('/asset-lookup');", timeout=30),

    # ---- click through ----------------------------------------------------------------------
    step("click", 'Click "View in Map"',
         {"element": xpath_el(LOOKUP_URL, VIEW_BTN)}, timeout=30),
    step("wait", "Let the router navigate and the map begin initialising", {"value": 8}),

    jsassert("NAVIGATED: location.pathname is now /map",
             "return location.pathname.endsWith('/map');", timeout=30),
    step("assertElementContent", 'The "Map" page rendered',
         {"check": "contains", "value": "Map",
          "element": xpath_el(MAP_URL,
                              '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                              ' "Map")]')}, timeout=60),
    # Same proof MOB.121 uses: the map really initialised, rather than the route merely
    # changing under a blank page (trap 5).
    step("assertElementPresent", "PROOF: the Mapbox WebGL canvas rendered",
         {"element": xpath_el(MAP_URL, '//canvas[contains(@class,"mapboxgl-canvas")]')},
         timeout=60),

    # ⭐ THE POINT OF THE TEST. React Router v6 stores `navigate(to, {state})` at
    # history.state.usr, so this proves the payload survived the navigation. Landing on /map
    # would pass with the state dropped; this would not.
    jsassert("⭐ THE ROUTER STATE ARRIVED: recordType 'Asset' with an id and coordinates",
             "const s = (history.state && history.state.usr) || null;\n"
             "if (!s) return false;\n"
             "return s.recordType === 'Asset'\n"
             "  && typeof s.recordId === 'string' && s.recordId.length > 0\n"
             "  && s.lat != null && s.lng != null\n"
             "  && !isNaN(Number(s.lat)) && !isNaN(Number(s.lng));", timeout=30),
    # The coordinates are the asset's, not placeholders. `AssetLookup` passes
    # `lat: asset.latitude, lng: asset.longitude`, and a 0/0 pair would mean the gate above
    # let a coordinate-less asset through.
    jsassert("…and they are real coordinates, not a 0/0 placeholder",
             "const s = history.state.usr;\n"
             "const lat = Number(s.lat), lng = Number(s.lng);\n"
             "return Math.abs(lat) <= 90 && Math.abs(lng) <= 180"
             " && !(lat === 0 && lng === 0);", timeout=30),
]

write(test(
    "MOB.735_AssetLookup_View_In_Map",
    "`MOB.735` **The row-level `View in Map` button on an Asset Lookup result.**\n"
    "- ⭐ **The only navigation in mobile that carries ROUTER STATE** rather than encoding\n"
    "  everything in the URL (`index.tsx:340`) — so no other test covers the mechanism by\n"
    "  side effect. The decisive assertion is `history.state.usr`, which proves the payload\n"
    "  survived the navigation; **landing on `/map` alone would pass with the state dropped**,\n"
    "  and that is the regression worth catching (trap 5).\n"
    "- **NOT asserted, deliberately:** that the map's informational card opened. That needs\n"
    "  `queryRenderedFeatures` to hit the asset on the **canvas** — the `ChangeAssetPopup`\n"
    "  barrier (Appendix C) — and would make this test depend on tile loading and geography.\n"
    "- ⚠️ **Fixture-dependent**: the button is gated on `asset.latitude && asset.longitude`.\n"
    "  The guard is named a FIXTURE GUARD so a failure reads as *\"this asset has no\n"
    "  coordinates\"*, not as a broken locator. **Do not convert it to an exclusive-or** — a\n"
    "  test that passes when the button is absent proves nothing about the button.\n"
    "- 🛑 **READ-ONLY.** It navigates and writes nothing. Its sibling `Add Work` stays a\n"
    "  deliberate non-goal (Appendix A) because that one creates a permanent work order.\n"
    "- ⚠️ **Ends on `/map`.** Harmless — every Asset Lookup subtest starts with its own\n"
    "  `goToUrl` — but it is wired BEFORE `MOB.730`/`MOB.731`, which own the proximity restore.",
    steps,
    tags=["Mobile", "env:dev", "Asset Lookup", "Map", "read-only"],
))
print("wrote MOB.735 (asset lookup view in map)")
