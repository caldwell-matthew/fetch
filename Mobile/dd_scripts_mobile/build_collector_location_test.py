"""Build MOB.629_Collector_Location_Capture - the create form's `Location` row, captured and cleared.

WHAT THE SOURCE SAYS (`AssetCollector/Form/index.tsx:262-299`, PR #4173, served in build 92)
  `NewAssetForm` gets `showGeolocate` from the collector page (`AssetCollector/index.tsx:294`) and renders,
  between Description and Notes:

      <Text>Location</Text>   [CloseButton aria-label="Clear location" — only once a location is held]
                              [GeoLocateButton — faLocation, which renders `location-crosshairs` (trap 14)]
      locationAddress | locationCoords | `No location captured.`

  The button calls `navigator.geolocation.getCurrentPosition`, reverse-geocodes through Mapbox, and opens
  `AssetLocationModal` titled `Asset Location` - the same `AssetLocationForm` the asset card's geolocate uses,
  prefilled from the geocode, with `Include Address` on and `Include GIS` on while GIS is allowed (before a
  type is picked it always is). Its submit dispatches `SET_LOCATION` into the form's REDUCER:

      locationAddress = [address, city, state?.name, postalCode].filter(Boolean).join(', ')
      locationCoords  = `${lat.toFixed(6)}, ${lng.toFixed(6)}`       (includeGis && allowGis)

⭐ READ-ONLY. The location lives in the reducer until the asset is created (`createAsset` applies it), and
this test never submits the asset form - it discards it with the modal's X. The applied half (the new
asset's address/GIS, and `assetTypeHasGeometry` dropping GIS for a type with none) needs a created asset,
so it belongs with MOB.600, which bugs §34 holds.

THE STUBS ARE MOB.358's (`build_asset_geolocate_test.py`), copied rather than imported - importing a build
script runs its `write()` calls. Same canned position (41.8781, -87.6298) and the same Mapbox features, so
the prefill is known exactly: `1600 Main Street`, `Chicago`, state `IL` (from `short_code: 'US-IL'`), `60601`.
⚠️ They do not survive a navigation, so they go in AFTER the last `go()` - here, once the form is open.

🛑 NEVER ESCAPE. The `Get New Asset` modal keeps `closeOnEscape`, so Escape discards the whole form
(bugs §13) - and with two modals open it is not obvious which one it would close. The location modal is
left by its own Submit; the form by its X.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

COLLECTOR_URL = BASE + "/asset-collector"
AFFIX_PLUS = ('//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]'
              '//button')
FORM_SUBMIT = '//button[@form="asset-collector"]'
FORM_MODAL = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
              '[contains(., "Get New Asset")]')
CLOSE_X = '//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]'
LOC_SUBMIT = '//button[@form="mobile-geolocate"]'

PLACEHOLDER = "No location captured."
ADDRESS = "1600 Main Street, Chicago, IL, 60601"
COORDS = "41.878100, -87.629800"

# ---- MOB.358's stubs, verbatim --------------------------------------------------------------------
GEOCODE_FEATURES = (
    "{features:["
    "{place_type:['address'],text:'Main Street',address:'1600',properties:{}},"
    "{place_type:['place'],text:'Chicago',properties:{}},"
    "{place_type:['region'],text:'Illinois',properties:{short_code:'US-IL'}},"
    "{place_type:['country'],text:'United States',properties:{short_code:'us'}},"
    "{place_type:['postcode'],text:'60601',properties:{}}"
    "]}"
)
INSTALL_STUBS = (
    "if (!window.__ddOrigFetch) window.__ddOrigFetch = window.fetch;\n"
    "if (!window.__ddOrigGeo) window.__ddOrigGeo = navigator.geolocation.getCurrentPosition;\n"
    "navigator.geolocation.getCurrentPosition = function (ok) {\n"
    "  ok({ coords: { latitude: 41.8781, longitude: -87.6298, accuracy: 5 } });\n"
    "};\n"
    "// Mapbox ONLY — Apollo uses fetch, so everything else must pass through untouched.\n"
    "window.fetch = function (input) {\n"
    "  var u = typeof input === 'string' ? input : ((input && input.url) || '');\n"
    "  if (u.indexOf('api.mapbox.com/geocoding') !== -1) {\n"
    f"    var body = JSON.stringify({GEOCODE_FEATURES});\n"
    "    return Promise.resolve(new Response(body,"
    " { status: 200, headers: { 'Content-Type': 'application/json' } }));\n"
    "  }\n"
    "  return window.__ddOrigFetch.apply(window, arguments);\n"
    "};\n"
    "return typeof window.fetch === 'function';\n"
)
REMOVE_STUBS = (
    "if (window.__ddOrigFetch) { window.fetch = window.__ddOrigFetch;"
    " delete window.__ddOrigFetch; }\n"
    "if (window.__ddOrigGeo) { navigator.geolocation.getCurrentPosition = window.__ddOrigGeo;"
    " delete window.__ddOrigGeo; }\n"
    "return !window.__ddOrigFetch && !window.__ddOrigGeo;\n"
)

# ---- the Location row, read from the form itself -------------------------------------------------
# The row is a Group whose first Text reads exactly `Location`; what follows it (up to Notes) is the
# placeholder or the captured lines. Reading from the `Location` label onward inside #asset-collector keeps
# "Location" elsewhere on the page (the modal title `Asset Location`) out of it.
ROW_JS = (
    "const f = document.getElementById('asset-collector');\n"
    "if (!f) return false;\n"
    "const label = [...f.querySelectorAll('p')].find(p => (p.textContent || '').trim() === 'Location');\n"
    "const grp = label && label.closest('[class*=\"mantine-Group-root\"]');\n"
    "if (!grp) return false;\n"
    "const after = [];\n"
    "for (let n = grp.nextElementSibling; n && n.tagName === 'P'; n = n.nextElementSibling)\n"
    "  after.push((n.textContent || '').trim());\n"
    "const clear = !!grp.querySelector('button[aria-label=\"Clear location\"]');\n"
    "const geo = grp.querySelector('svg[data-icon=\"location-crosshairs\"]');\n"
)
# `GeoLocateButton` is `<ActionIcon component="span">` — a SPAN, so `closest('button')` finds nothing.
# Click the ActionIcon ROOT, which carries the onClick (MOB.911's lesson, restated in MOB.358).
CLICK_GEO = (ROW_JS + "const b = geo && geo.closest('[class*=\"mantine-ActionIcon-root\"]');\n"
             "if (!b) return false;\nb.click();\nreturn true;")
CLICK_CLEAR = (ROW_JS + "const c = grp.querySelector('button[aria-label=\"Clear location\"]');\n"
               "if (!c) return false;\nc.click();\nreturn true;")
LOC_MODAL = ("const m = [...document.querySelectorAll('.mantine-Modal-content')]\n"
             "  .find(x => x.querySelector('#mobile-geolocate'));\n")


def at_placeholder(label, always=False):
    return jsassert(
        f"{label}: the Location row reads exactly `{PLACEHOLDER}`, with a geolocate button and NO "
        "`Clear location`",
        ROW_JS + f"return after.length === 1 && after[0] === '{PLACEHOLDER}' && !!geo && !clear;",
        always=always, timeout=30)


steps = [
    go(COLLECTOR_URL, "the asset collector"),
    step("wait", "Wait for the collector to load its lookup cache", {"value": 15}),
    step("assertElementPresent", "The collector page rendered",
         {"element": xpath_el(COLLECTOR_URL, '//*[@id="page-title"]//h4')}, timeout=30),
    step("click", "Open the new-asset form (affixed + button)",
         {"element": xpath_el(COLLECTOR_URL, AFFIX_PLUS)}, timeout=30),
    step("assertElementPresent", "The new-asset form opened",
         {"element": xpath_el(COLLECTOR_URL, FORM_SUBMIT)}, timeout=30),
    at_placeholder("BASELINE"),

    # ---- capture ----------------------------------------------------------------------------------
    jsassert("Install the geolocation + Mapbox stubs (after the last `go()` — they do not survive a "
             "navigation)", INSTALL_STUBS, timeout=15),
    jsassert("Click the Location row's geolocate button", CLICK_GEO, timeout=30),
    jsassert("The `Asset Location` modal opened with the location form",
             LOC_MODAL + "return !!m && (m.textContent || '').includes('Asset Location');", timeout=30),
    jsassert("The form is prefilled from the (stubbed) geocode — address `1600 Main Street`, city `Chicago`",
             "const f = document.getElementById('mobile-geolocate');\n"
             "if (!f) return false;\n"
             "const v = [...f.querySelectorAll('input')].map(i => i.value);\n"
             "return v.includes('1600 Main Street') && v.includes('Chicago');", timeout=30),
    jsassert("Both `Include GIS` and `Include Address` start ON (no type picked yet, so GIS is allowed), "
             "so Submit is armed",
             "const f = document.getElementById('mobile-geolocate');\n"
             "const boxes = f ? [...f.querySelectorAll('input[type=checkbox]')] : [];\n"
             "const b = document.querySelector('button[form=\"mobile-geolocate\"]');\n"
             "return boxes.length === 2 && boxes.every(x => x.checked) && !!b && b.type === 'submit';",
             timeout=20),
    step("click", "Submit the location (it goes into the form's reducer — nothing is written)",
         {"element": xpath_el(COLLECTOR_URL, LOC_SUBMIT)}, timeout=30),
    jsassert("The `Asset Location` modal closed, and the new-asset form is still open",
             LOC_MODAL + "return !m && !!document.getElementById('asset-collector');", timeout=20),
    jsassert(f"⭐ CAPTURED: the Location row reads `{ADDRESS}` over `{COORDS}` — the placeholder is gone "
             "and `Clear location` appeared",
             ROW_JS + f"return after.length === 2 && after[0] === '{ADDRESS}' && after[1] === '{COORDS}' "
             "&& clear;", timeout=30),

    # ---- clear -------------------------------------------------------------------------------------
    jsassert("Click `Clear location`", CLICK_CLEAR, timeout=20),
    at_placeholder("⭐ CLEARED"),

    # ---- restore, `always`: stubs out, form discarded unsent ----------------------------------------
    jsassert("Remove the stubs", REMOVE_STUBS, always=True, timeout=15),
    step("click", "Close the form with its X — DISCARDED, never submitted",
         {"element": xpath_el(COLLECTOR_URL, f'{FORM_MODAL}{CLOSE_X}')}, always=True, timeout=30),
    jsassert("RESTORED: the form is gone, so nothing was created",
             "return !document.getElementById('asset-collector');", always=True, timeout=20),
]

write(test(
    "MOB.629_Collector_Location_Capture",
    "`MOB.629` **The collector's `Location` row** — captured, shown, cleared.\n"
    f"- The create form reads `{PLACEHOLDER}` until a position is taken. With `MOB.358`'s geolocation and\n"
    "  Mapbox stubs, the geolocate button opens `Asset Location` prefilled from the geocode; its Submit\n"
    f"  puts `{ADDRESS}` over `{COORDS}` on the row, and `Clear location` puts the placeholder back.\n"
    "- ⭐ **Read-only**: the location lives in the form's reducer until the asset is created, and the form\n"
    "  is discarded with its X. The applied half — the new asset's address and GIS — needs a created\n"
    "  asset, so it belongs with `MOB.600` (bugs §34).\n"
    "- 🛑 Never Escape: it would discard the form (bugs §13).",
    steps,
    ["Mobile", "env:dev", "Asset Collector", "read-only"],
))

print("wrote MOB.629 (collector location capture)")
