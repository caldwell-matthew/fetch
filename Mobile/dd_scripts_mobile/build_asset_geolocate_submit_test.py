"""Build MOB.359_Work_Asset_Geolocate_Submit - the asset location form SUBMITS, address only, restored.

WHY THIS EXISTS
  `MOB.358` drives `AssetGeolocate` on the work order's Assets tab with a stubbed position and a stubbed
  Mapbox reverse-geocode, proves the response is mapped into the form, and never submits. The submit -
  `UPDATE_ASSET` with the address fields (`AssetCollector/AssetGeolocate.tsx:195-235`) - was never
  proved to write. The owner authorised it on 2026-09-15 as a SELF-RESTORING test.

THE ASSET: `Pump 0102` (`oB5BUN1Es1Jctw8FVYwYBh`) - there is no other choice on this route
  It is the fixture work order's only asset, and the other two entry points are the Collector row (the
  AV job's `⚡ Tank 0000` / `A/C Motor 0002`, both fixture-guarded by many tests) and the map card header
  (a canvas marker tap - out of reach). Its ATTACHMENTS are never touched (owner rule); this writes its
  address fields only.

WHAT THE SOURCE SAYS
  `submitGeolocation`: `if (includeAddress)` it sends `UPDATE_ASSET { city, state: state.id, postalCode,
  countryCode: countryCode.id, address, centroid: includeGis && geometryType ? {lng, lat} : undefined }`
  with an `optimisticResponse`, NOT awaited, and toasts `Asset location updated` before any answer - so
  neither the toast nor the repainted row is proof (trap 6); the proof is a `/graphql` read of the asset.
  `includeGis` defaults to `allowGis` (Pump 0102's type is a `Point`, so ON).

⭐ WHY THIS TEST TURNS `Include GIS` OFF - decided from what reads the coordinates
  Pump 0102's latitude/longitude (29.9782827, -90.1025785) are read by `MOB.735` (`View in Map` is gated on
  them and carries them in router state), by the Near Me proximity tests' distance rows (`MOB.731`), and
  they equal the fixture work order's own x/y. A `centroid` write goes through `updateAssetLocation`
  (server `asset/update/index.js:62-67`), which rebuilds the asset's GIS location row - restoring that
  byte-for-byte is not something a test can promise. So GIS is unticked (by field id, proven in the
  same step), and the server read proves latitude/longitude UNCHANGED in every leg. As a second guard the
  stubbed position IS Pump 0102's own coordinates, so even an accidental GIS write would carry the same
  point.
  Address-field writes are logged in the asset's change log (`update/utils/assetLog.ts` LOG_FIELDS) -
  two log rows per run (write + restore) are this test's only lasting trace.

THE VALUES
  rest    `230 North Alexander Street` · `New Orleans` · LA · `70119` · US   (read over the API 2026-09-15)
  written `359 DD MOB Test Street` · `Metairie` · LA · `70001` · US
  State and country stay LA/US on purpose: they are foreign keys, and a value the org's state table
  lacks would fail the whole update. So this proves address, city and postal code change; state and
  country are proved PRESERVED.
  Both are produced the way a user produces them: a (stubbed) reverse-geocode fills the form, the user
  submits. The restore leg swaps the stub's features for the rest address and submits again.

🐞 SAME CRASH PRECONDITION AS MOB.354
  `AssetGeolocate` renders nothing until the Asset schema is cached (`AssetGeolocate.tsx:254`), and nothing
  on /work or the work-order page caches it (measured: 60s, no geolocate control, fresh session). This test
  opens `Add Asset` -> `Add Existing Asset` (its `AssetLookup` queries the schema) and closes it WITHOUT
  searching (no `asset_lookup_query` write), then gates on the geolocate control. It never expands a row.

⚠️ STUBS - installed after the last `go()` (MOB.974 G7), removed `always`. `fetch` is wrapped for the
  Mapbox geocoding URL only; the `/graphql` reads and the backstop pass straight through.

RESTORE - three legs, all `alwaysExecute`
  1. the UI: stub the rest address, tap, untick GIS, submit, prove the rest fields over /graphql;
  2. a backstop: ONE step reads the asset and, only if an address field is not at rest, sends
     `updateAsset` with the fixed rest address fields (never latitude/longitude/centroid - the server
     nulls the GIS geometry on those keys);
  3. the final server read: every address field AND latitude/longitude at rest.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      server_assert, work_cache_warm)

FIXTURE = "EYRpYJ9QYdQ1JFF10JtB0Q"
WO_URL = f"{BASE}/work/{FIXTURE}"
ASSET_ID = "oB5BUN1Es1Jctw8FVYwYBh"
LAT, LNG = "29.9782827", "-90.1025785"
REST = {"number": "230", "street": "North Alexander Street", "city": "New Orleans", "postal": "70119"}
WRITE = {"number": "359", "street": "DD MOB Test Street", "city": "Metairie", "postal": "70001"}
STATE, COUNTRY = "LA", "US"


def addr(v):
    return f"{v['number']} {v['street']}"


def tok(cls):
    return f'contains(concat(" ", normalize-space(@class), " "), " {cls} ")'


TAB_STRIP = '(//*[@role="tab"])[1]'
ASSETS_TAB = '//*[@role="tab"][normalize-space(.)="Assets"]'
VISIBLE_PANEL = '//*[@role="tabpanel"][not(contains(@style, "display: none"))]'
GEO_ICON = ('*[@data-icon="location-crosshairs"'
            ' or contains(concat(" ", normalize-space(@class), " "), " fa-location-crosshairs ")]')
GEO_ROOT_IN_PANEL = f'({VISIBLE_PANEL}//*[{tok("mantine-ActionIcon-root")}][.//{GEO_ICON}])[1]'
ADD_ASSET = '//button[normalize-space(.)="Add Asset"]'
ADD_EXISTING = f'//label[{tok("mantine-SegmentedControl-label")}][normalize-space(.)="Add Existing Asset"]'
SEARCH = f'//*[{tok("mantine-Modal-content")}]//input[@name="asset-search"]'
PICKER_CLOSE = f'//*[{tok("mantine-SegmentedControl-root")}]/following-sibling::button[{tok("mantine-CloseButton-root")}]'
FORM = '//form[@id="mobile-geolocate"]'
SUBMIT = '//button[@form="mobile-geolocate"]'

ASSET_Q = ("query($id: ID!) { asset(id: $id) { id name address city postalCode latitude longitude "
           "state { id } countryCode { id } } }")
UPDATE_M = "mutation($id: ID!, $data: UpdateAssetInput!) { updateAsset(id: $id, data: $data) { id } }"


def fields_at(v):
    return (f"(a => !!a && a.address === {addr(v)!r} && a.city === {v['city']!r} && a.postalCode === {v['postal']!r}"
            f" && !!a.state && a.state.id === '{STATE}' && !!a.countryCode && a.countryCode.id === '{COUNTRY}')")


COORDS_AT_REST = (f"(a => !!a && Math.abs(Number(a.latitude) - ({LAT})) < 1e-7"
                  f" && Math.abs(Number(a.longitude) - ({LNG})) < 1e-7 && a.latitude !== null && a.longitude !== null)")


def features(v):
    return ("[{place_type:['address'],text:" + repr(v["street"]) + ",address:" + repr(v["number"]) + ",properties:{}},"
            "{place_type:['place'],text:" + repr(v["city"]) + ",properties:{}},"
            "{place_type:['region'],text:'Louisiana',properties:{short_code:'US-LA'}},"
            "{place_type:['country'],text:'United States',properties:{short_code:'us'}},"
            "{place_type:['postcode'],text:" + repr(v["postal"]) + ",properties:{}}]")


def install_js(v):
    return ("if (!window.__ddOrigFetch) window.__ddOrigFetch = window.fetch;\n"
            "if (!window.__ddOrigGeo) window.__ddOrigGeo = navigator.geolocation.getCurrentPosition;\n"
            f"window.__dd359Features = {features(v)};\n"
            "navigator.geolocation.getCurrentPosition = function (ok) {\n"
            f"  ok({{ coords: {{ latitude: {LAT}, longitude: {LNG}, accuracy: 5 }} }});\n"
            "};\n"
            "// Mapbox ONLY — Apollo and the /graphql reads use fetch, so everything else passes through.\n"
            "window.fetch = function (input) {\n"
            "  var u = typeof input === 'string' ? input : ((input && input.url) || '');\n"
            "  if (u.indexOf('api.mapbox.com/geocoding') !== -1) {\n"
            "    return Promise.resolve(new Response(JSON.stringify({ features: window.__dd359Features }),"
            " { status: 200, headers: { 'Content-Type': 'application/json' } }));\n"
            "  }\n"
            "  return window.__ddOrigFetch.apply(window, arguments);\n"
            "};\n"
            f"return typeof window.__ddOrigFetch === 'function' && window.__dd359Features[0].address === {v['number']!r};")


REMOVE_STUBS = ("if (window.__ddOrigFetch) { window.fetch = window.__ddOrigFetch; delete window.__ddOrigFetch; }\n"
                "if (window.__ddOrigGeo) { navigator.geolocation.getCurrentPosition = window.__ddOrigGeo;"
                " delete window.__ddOrigGeo; }\n"
                "delete window.__dd359Features;\n"
                "return !window.__ddOrigFetch && !window.__ddOrigGeo && !window.__dd359Features;")


def holds_js(v):
    return ("const f = document.getElementById('mobile-geolocate');\n"
            "if (!f) return false;\n"
            "const vals = [...f.querySelectorAll('input')].map(i => (i.value || '').trim());\n"
            f"return vals.includes({addr(v)!r}) && vals.includes({v['city']!r}) && vals.includes({v['postal']!r})\n"
            f"  && vals.includes('{STATE}') && vals.includes('{COUNTRY}');")


GIS_OFF_JS = ("const f = document.getElementById('mobile-geolocate');\n"
              "if (!f) return false;\n"
              "const gis = f.querySelector('input#includeGis'), adr = f.querySelector('input#includeAddress');\n"
              "if (!gis || !adr || gis.type !== 'checkbox' || adr.type !== 'checkbox') return false;\n"
              "if (gis.checked) gis.click();\n"
              "return gis.checked === false && adr.checked === true;")

ARMED_JS = ("const f = document.getElementById('mobile-geolocate');\n"
            "const gis = f && f.querySelector('input#includeGis'), adr = f && f.querySelector('input#includeAddress');\n"
            "const b = document.querySelector('button[form=\"mobile-geolocate\"]');\n"
            "return !!gis && !gis.checked && !!adr && adr.checked && !!b && b.type === 'submit';")

CLOSED_JS = ("if (!document.querySelectorAll('[role=tab]').length) return false;\n"
             "return !document.getElementById('mobile-geolocate');")

NET_KEY = "__dd359_net"
BACKSTOP_JS = (
    f"const K = '{NET_KEY}';\n"
    "const st = sessionStorage.getItem(K);\n"
    "if (st === 'done') return true;\n"
    "if (st === 'asking') return false;\n"
    "sessionStorage.setItem(K, 'asking');\n"
    "const post = body => window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',\n"
    "  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' }, body: JSON.stringify(body) });\n"
    f"post({{ query: {ASSET_Q!r}, variables: {{ id: '{ASSET_ID}' }} }})\n"
    "  .then(r => r.json())\n"
    "  .then(j => {\n"
    f"    if ({fields_at(REST)}(j && j.data && j.data.asset)) {{ sessionStorage.setItem(K, 'done'); return; }}\n"
    "    sessionStorage.setItem(K + ':sent', '1');\n"
    f"    return post({{ query: {UPDATE_M!r}, variables: {{ id: '{ASSET_ID}', data: {{ address: {addr(REST)!r},"
    f" city: {REST['city']!r}, postalCode: {REST['postal']!r}, state: '{STATE}', countryCode: '{COUNTRY}' }} }} }})\n"
    "      .then(() => sessionStorage.setItem(K, 'done'));\n"
    "  })\n"
    "  .catch(() => sessionStorage.setItem(K, 'done'));\n"
    "return false;")


def geolocate_submit(label, v, always=False):
    a = dict(always=always)
    return [
        step("pressKey", "Escape any open modal first", {"value": "Escape"}, **a),
        step("wait", "Let it close", {"value": 1}, **a),
        jsassert(f"Install the geolocation + Mapbox stubs — the geocode answers the {label} address "
                 "(after the last go() — G7)", install_js(v), timeout=30, **a),
        step("click", "Tap Pump 0102's geolocate control (the ActionIcon ROOT — MOB.911)",
             {"element": xpath_el(WO_URL, GEO_ROOT_IN_PANEL)}, timeout=30, **a),
        step("assertPageContains", 'The modal opened — "Updating Asset Location"',
             {"value": "Updating Asset Location"}, timeout=60, **a),
        step("assertElementPresent", "The location form mounted", {"element": xpath_el(WO_URL, FORM)},
             timeout=60, **a),
        jsassert(f"The form holds the stubbed {label} address — `{addr(v)}` · {v['city']} · {STATE} · "
                 f"{v['postal']} · {COUNTRY}", holds_js(v), timeout=30, **a),
        jsassert("Untick `Include GIS` BY FIELD ID and prove it off, with `Include Address` on, in the same step",
                 GIS_OFF_JS, timeout=30, **a),
        step("wait", "Let the form revalidate", {"value": 1}, **a),
        jsassert('Submit is ARMED (`type="submit"`) with GIS off and Address on', ARMED_JS, timeout=30, **a),
        step("click", f"Submit the {label} address", {"element": xpath_el(WO_URL, SUBMIT)}, timeout=30, **a),
        step("assertPageContains", "The `Asset location updated` toast (optional: it fires before the answer)",
             {"value": "Asset location updated"}, optional=True, timeout=10, **a),
        jsassert("The location form is GONE and the page is still alive (not the proof)", CLOSED_JS,
                 timeout=30, **a),
    ]


steps = work_cache_warm() + [
    go(WO_URL, "the fixture work order"),
    step("wait", "Let the detail view begin rendering", {"value": 3}),
    step("assertElementPresent", "GATE: the detail data arrived (tab strip)",
         {"element": xpath_el(WO_URL, TAB_STRIP)}, timeout=60),
    step("click", 'Open the "Assets" tab', {"element": xpath_el(WO_URL, ASSETS_TAB)}, timeout=30),
    step("assertElementPresent", '"Assets" is now the active tab',
         {"element": xpath_el(WO_URL, f'{ASSETS_TAB}[@data-active="true"]')}, timeout=30),
] + server_assert(
    f"PREMISE (server): Pump 0102's address fields are at rest (`{addr(REST)}` · {REST['city']} · {STATE} · "
    f"{REST['postal']} · {COUNTRY}) and so are its coordinates",
    "__dd359_asset", ASSET_Q, {"id": ASSET_ID},
    f"{fields_at(REST)}(data.asset) && {COORDS_AT_REST}(data.asset)") + [

    # ---- 🐞 cache the Asset schema the way the app can: open the existing-asset picker, close it -----
    step("click", "SCHEMA WARM: open `Add Asset` (its picker queries the Asset schema)",
         {"element": xpath_el(WO_URL, ADD_ASSET)}, timeout=30),
    step("click", "SCHEMA WARM: choose `Add Existing Asset`", {"element": xpath_el(WO_URL, ADD_EXISTING)},
         timeout=30),
    step("assertElementPresent", "SCHEMA WARM: the picker mounted (nothing is searched or picked)",
         {"element": xpath_el(WO_URL, SEARCH)}, timeout=60),
    step("click", "SCHEMA WARM: close the picker (its CloseButton beside the segmented control)",
         {"element": xpath_el(WO_URL, PICKER_CLOSE)}, timeout=30),
    jsassert("SCHEMA WARM: the picker closed and the page is still alive",
             "if (!document.querySelectorAll('[role=tab]').length) return false;\n"
             "return !document.querySelector('input[name=\"asset-search\"]');", timeout=30),
    step("assertElementPresent", "GATE: Pump 0102's row now renders the geolocate control (the schema is cached)",
         {"element": xpath_el(WO_URL, f'({VISIBLE_PANEL}//{GEO_ICON})[1]')}, timeout=60),
] + geolocate_submit("written", WRITE) + server_assert(
    f"⭐ SERVER: Pump 0102 now holds `{addr(WRITE)}` · {WRITE['city']} · {STATE} · {WRITE['postal']} · {COUNTRY} "
    "— and its coordinates are UNCHANGED (no GIS write)",
    "__dd359_asset", ASSET_Q, {"id": ASSET_ID},
    f"{fields_at(WRITE)}(data.asset) && {COORDS_AT_REST}(data.asset)") + [

    # ---- restore: the UI, with the FIXED rest address --------------------------------------------
] + geolocate_submit("rest", REST, always=True) + server_assert(
    "⭐ RESTORED (server): the UI wrote the rest address fields back, coordinates unchanged",
    "__dd359_asset", ASSET_Q, {"id": ASSET_ID},
    f"{fields_at(REST)}(data.asset) && {COORDS_AT_REST}(data.asset)", always=True) + [
    step("pressKey", "Escape — leave no modal open", {"value": "Escape"}, always=True),
    jsassert("RESTORED: both stubs removed", REMOVE_STUBS, always=True, timeout=30),
    jsassert("BACKSTOP: if an address field is not at rest, send `updateAsset` with the FIXED rest address "
             "fields — never latitude/longitude/centroid (reads first; sends nothing when the UI restore landed)",
             BACKSTOP_JS, always=True, timeout=45),
    jsassert("Remove the backstop's sessionStorage keys",
             f"['{NET_KEY}', '{NET_KEY}:sent'].forEach(k => sessionStorage.removeItem(k));\nreturn true;",
             always=True, timeout=15),
] + server_assert(
    "⭐ AT REST (server): Pump 0102's address fields and coordinates are the fixed rest values",
    "__dd359_asset", ASSET_Q, {"id": ASSET_ID},
    f"{fields_at(REST)}(data.asset) && {COORDS_AT_REST}(data.asset)", always=True)

write(test(
    "MOB.359_Work_Asset_Geolocate_Submit",
    "`MOB.359` **The asset location form submits** — `AssetGeolocate` on the fixture's Assets tab writes\n"
    "`Pump 0102`'s address fields (`UPDATE_ASSET`), proved over `/graphql`, restored to FIXED values.\n"
    "- `MOB.358` fills the form and never submits. Here a stubbed geocode fills it with a marker address,\n"
    "  `Include GIS` is turned OFF (the coordinates feed MOB.735/731 and equal the work order's x/y), and\n"
    "  the server read proves address/city/postal code written, state/country and lat/long unchanged.\n"
    "- The mutation is optimistic and not awaited, and the toast fires first — the server read is the proof.\n"
    "- Restore, all `alwaysExecute`: the stub answers the rest address and the form is submitted again; a\n"
    "  backstop sends the rest address fields only if the server is not at rest (never coordinates); the\n"
    "  last read requires every field and lat/long at rest.\n"
    "- 🐞 The geolocate control renders only once the Asset schema is cached, which nothing on the work\n"
    "  pages does — the picker is opened and closed first (see MOB.354).",
    steps,
    tags=["Mobile", "env:dev", "Work Order", "Geolocation", "self-restoring"],
))
print("wrote MOB.359 (asset location form submits, address only, self-restoring)")
