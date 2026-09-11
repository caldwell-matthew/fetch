"""Build MOB.358_Work_Asset_Geolocate - the ASSET LOCATION FORM behind GeolocateButton.

WHY THIS EXISTS
  T1.6 has carried `[~] Geolocate populates address/lat/long` since the beginning. `MOB.731`
  closed half of it — `ProximityMenu` — and the row says explicitly that what remains is
  **`GeolocateButton`'s form-fill**. This is that form: `AssetCollector/AssetGeolocate.tsx`.

  ⭐ THREE ENTRY POINTS, ONE COMPONENT. `AssetGeolocate` renders on the Collector row
  (`AssetCollector/index.tsx:187`), in the map card header (`Map/Card/CardHeader.tsx:188`), and
  on the work order's **Assets tab** (`WorkOrders/components/Assets/index.tsx:127`). This test
  drives the Assets tab because `MOB.347` already proves that path — so the entry point is
  proven and the new surface is the only thing under test.

THE CHAIN THIS PROVES, END TO END
    stubbed position -> getCurrentPosition -> reverseGeocode (Mapbox) -> response mapping
    -> AssetLocationForm defaultValues -> the rendered form

  ⚠️ `onResult` FIRES ONLY AFTER THE MAPBOX CALL RESOLVES. `GeolocateButton.tsx:27` awaits
  `reverseGeocode` *inside* the geolocation callback and only then calls `onResult`. So a
  stubbed position alone is not enough — nothing opens until a network round-trip to
  `api.mapbox.com` completes. Two consequences:

  1. **`fetch` is stubbed for the Mapbox geocoding URL only**, passing everything else through
     (Apollo uses `fetch`; blanket-stubbing it would break the app). Without this the test
     would carry a **live third-party dependency** — the failure mode that makes `MOB.122` the
     one flaky test in the suite — and the address values would be whatever Mapbox says today.
  2. Because the stub returns FIXED features, the form's contents become **deterministic and
     assertable**: `1600 Main Street` / `Chicago` / `IL` / `US` / `60601`. That turns "a form
     opened" into "the geocode response was mapped into the form correctly", which is the part
     that can actually regress.

  🐞 The same code path is `bugs_found.md` **§29**: `reverseGeocode` has no `ok` check and no
  `catch`, so a Mapbox error means `onResult` never fires and the user's tap does nothing at
  all. This test cannot assert that (it stubs the call), but it is why the stub matters.

WHAT IS ASSERTED
  - the geolocate control renders on an asset row and is ENABLED (it gates on `online`)
  - clicking it opens the modal titled `Updating Asset Location`
  - `<form id="mobile-geolocate">` mounted, with `Include GIS` / `Include Address`
  - ⭐ the form carries the STUBBED GEOCODE VALUES, not empty defaults
  - ⭐ the trap 8 validity gate as a BICONDITIONAL, asserted twice around a real toggle

WHY THE VALIDITY GATE IS A BICONDITIONAL AND NOT A FIXED EXPECTATION
  `SubmitButton isValid={!!includeGis || !!includeAddress}` (`AssetGeolocate.tsx:160`), and
  `includeGis` defaults to `allowGis`, which is true only when the asset's `typeId.geometry` is
  Point/LineString/Polygon. So the starting checkbox state is a FIXTURE property, and any fixed
  expectation ("Submit is inert after one untick") would be asking the fixture a question — the
  mistake `MOB.357` run 1 made. Instead: **Submit's `type` is `submit` if and only if some box
  is checked**, evaluated before and after toggling `Include Address`. True in every fixture
  shape, and false the moment the button stops tracking the boxes.

🛑 STRICTLY READ-ONLY. Submitting fires `UPDATE_ASSET` against the asset's REAL address and
  coordinates, with an `optimisticResponse` — so a failed run would still repaint the UI as if
  it had worked (trap 6). Nothing is submitted; the modal is escaped and both stubs are removed
  with `alwaysExecute`.

⚠️ STUB PLACEMENT. The geolocation stub does **not survive a navigation** (measured, `MOB.974`
  G7), so it is installed AFTER the last `go()` — i.e. after the Assets tab is already open.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      work_cache_warm)

FIXTURE = "EYRpYJ9QYdQ1JFF10JtB0Q"
WO_URL = f"{BASE}/work/{FIXTURE}"

TAB_STRIP = '(//*[@role="tab"])[1]'
ASSETS_TAB = '//*[@role="tab"][normalize-space(.)="Assets"]'
VISIBLE_PANEL = '//*[@role="tabpanel"][not(contains(@style, "display: none"))]'

# trap 14: `faLocation` is an ALIAS for `faLocationCrosshairs`, so the rendered attribute is
# `location-crosshairs`. Measured by MOB.911, which lost a run to guessing `location`.
GEO_ICON = ('*[@data-icon="location-crosshairs"'
            ' or contains(concat(" ", normalize-space(@class), " "),'
            ' " fa-location-crosshairs ")]')
# MOB.911's lesson: ASSERT on the icon (it identifies the control), CLICK the ActionIcon ROOT
# (it carries the onClick). `ActionIcon` nests an inner slot that carries nothing, so
# `icon.closest('span')` resolves to the wrong node.
GEO_ICON_IN_PANEL = f'({VISIBLE_PANEL}//{GEO_ICON})[1]'
GEO_ROOT_IN_PANEL = (f'({VISIBLE_PANEL}//*[contains(concat(" ", normalize-space(@class), " "),'
                     f' " mantine-ActionIcon-root ")][.//{GEO_ICON}])[1]')

FORM = '//form[@id="mobile-geolocate"]'

# The canned Mapbox response. Shaped exactly as `GeolocateButton`'s mapping loop reads it:
# place_type -> address / place / region / country / postcode, with `short_code` on the
# region and country entries.
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

# Submit is rendered OUTSIDE the <form> (StackGrid.Footer) and bound with `form=`, so it is
# located by that attribute first and by its text only as a fallback.
VALIDITY_BICONDITIONAL = (
    "const f = document.getElementById('mobile-geolocate');\n"
    "if (!f) return false;\n"
    "const boxes = [...f.querySelectorAll('input[type=checkbox]')];\n"
    "if (boxes.length < 2) return false;\n"
    "const anyChecked = boxes.some(b => b.checked);\n"
    "const btn = document.querySelector('button[form=\"mobile-geolocate\"]')\n"
    "  || [...document.querySelectorAll('button')]"
    ".find(b => (b.textContent || '').trim() === 'Submit');\n"
    "if (!btn) return false;\n"
    "// SubmitButton.tsx: type={isValid ? 'submit' : 'button'},"
    " isValid = includeGis || includeAddress\n"
    "return anyChecked ? btn.type === 'submit' : btn.type === 'button';\n"
)

steps = work_cache_warm() + [
    go(WO_URL, "the fixture work order"),
    step("wait", "Let the detail view begin rendering", {"value": 3}),
    step("assertElementPresent", "GATE: the detail data arrived (tab strip)",
         {"element": xpath_el(WO_URL, TAB_STRIP)}, timeout=60),
    step("click", 'Open the "Assets" tab',
         {"element": xpath_el(WO_URL, ASSETS_TAB)}, timeout=30),
    step("wait", "Wait for the asset list", {"value": 3}),
    step("assertElementPresent", '"Assets" is now the active tab',
         {"element": xpath_el(WO_URL, f'{ASSETS_TAB}[@data-active="true"]')}, timeout=30),

    # ---- the control ------------------------------------------------------------------------
    step("assertElementPresent",
         "FIXTURE GUARD: an asset row renders the geolocate control",
         {"element": xpath_el(WO_URL, GEO_ICON_IN_PANEL)}, timeout=60),
    # It gates on `online`; every suite runs online, so ENABLED is the expected state and a
    # disabled control here would mean the network gate has drifted (MOB.911 owns the offline
    # half of this same control).
    jsassert("The control is ENABLED — it gates on `online`, and we are online",
             "const icon = document.querySelector"
             "('[data-icon=\"location-crosshairs\"]');\n"
             "if (!icon) return false;\n"
             "const root = icon.closest('.mantine-ActionIcon-root');\n"
             "if (!root) return false;\n"
             "return !root.hasAttribute('data-disabled') && navigator.onLine === true;",
             timeout=30),

    # ---- stubs, installed AFTER the last navigation (G7) --------------------------------------
    jsassert("Install the geolocation + Mapbox stubs (must follow the last go() — G7)",
             INSTALL_STUBS, timeout=30),

    # ---- open the form -----------------------------------------------------------------------
    step("click", "Tap the geolocate control (click the ActionIcon ROOT — MOB.911)",
         {"element": xpath_el(WO_URL, GEO_ROOT_IN_PANEL)}, timeout=30),
    # The modal cannot open until the stubbed Mapbox promise resolves, so this gates on the
    # modal itself rather than sleeping.
    step("assertPageContains", 'The modal opened — "Updating Asset Location"',
         {"value": "Updating Asset Location"}, timeout=60),
    step("assertElementPresent", "The location form mounted",
         {"element": xpath_el(WO_URL, FORM)}, timeout=60),
    step("assertPageContains", "…with its `Include GIS` control",
         {"value": "Include GIS"}, timeout=30),
    step("assertPageContains", "…and its `Include Address` control",
         {"value": "Include Address"}, timeout=30),

    # ---- ⭐ the chain actually mapped ---------------------------------------------------------
    # This is what separates "a form opened" from "the geocode response reached the form".
    # Every value below is traceable to one feature in the stubbed response.
    jsassert("⭐ THE STUBBED GEOCODE REACHED THE FORM — address, city and postcode",
             "const f = document.getElementById('mobile-geolocate');\n"
             "if (!f) return false;\n"
             "const vals = [...f.querySelectorAll('input')]"
             ".map(i => (i.value || '').trim());\n"
             "const joined = vals.join('|');\n"
             "// address = `${streetNumber} ${street}` per AssetGeolocate defaultValues\n"
             "return joined.includes('1600 Main Street')\n"
             "  && joined.includes('Chicago')\n"
             "  && joined.includes('60601');", timeout=30),
    jsassert("…and the region/country short_codes were unwrapped (US-IL -> IL, us -> US)",
             "const f = document.getElementById('mobile-geolocate');\n"
             "if (!f) return false;\n"
             "const joined = [...f.querySelectorAll('input')]"
             ".map(i => (i.value || '').trim()).join('|');\n"
             "return /(^|\\|)IL(\\||$)/.test(joined) && /(^|\\|)US(\\||$)/.test(joined);",
             timeout=30),

    # ---- ⭐ trap 8, as a biconditional ---------------------------------------------------------
    jsassert("⭐ VALIDITY 1/2: Submit is `submit` iff some include-box is checked",
             VALIDITY_BICONDITIONAL, timeout=30),
    # ⚠️ THIS CHECKBOX CANNOT BE CLICKED BY DATADOG — measured twice, and the reason is
    # component-specific rather than general.
    #   attempt 1: `label[.//input[@type="checkbox"]]`  -> "No element found". Mantine renders
    #              the input and label as SIBLINGS, and here `FormField ... label=""` gives the
    #              checkbox no label text at all (the visible "Include Address" is a separate
    #              <Text> above it).
    #   attempt 2: the raw `input[@type="checkbox"]`    -> "Element located but it's invisible".
    #              `MOB.510` clicks a raw checkbox input successfully, which is why this looked
    #              safe — but that is `VerificationCheckbox`, a DIFFERENT component whose input
    #              is visible. **Two Mantine checkboxes in this app do not behave the same.**
    # So the flip is driven from JS: `HTMLElement.click()` dispatches a real click event that
    # React's synthetic onChange handles, and it is immune to how the input is styled. This is
    # still driving the app through a real event — not writing `checked` directly, which React
    # would ignore.
    jsassert("CHECKBOX GUARD: the form has exactly two include-boxes, so [2] is unambiguous",
             "const f = document.getElementById('mobile-geolocate');\n"
             "if (!f) return false;\n"
             "return f.querySelectorAll('input[type=checkbox]').length === 2;", timeout=30),
    # ⭐ ACTS AND PROVES IN ONE STEP. The first version clicked in one step and asserted the
    # flip in another; when the click silently failed, the assertion simply re-read an
    # unchanged state. Folding them together means a toggle that does not happen cannot be
    # mistaken for one that did (trap 5).
    # ⚠️ IDENTIFY THE CHECKBOX BY ITS FIELD ID, NOT BY POSITION — found by `audit_assertions.py`.
    # This step used to take `boxes[1]`, the second checkbox in the form, while its NAME claimed
    # it was flipping `Include Address`. Those are only the same thing by accident of ordering:
    # add or reorder a checkbox and it would silently toggle a DIFFERENT control and still pass,
    # because the only assertion is "some value changed". That is MOB.348's defect wearing
    # different clothes — a positional selector under a name that promises a specific control.
    # ⚠️ Label-matching does NOT work here: `AssetGeolocate.tsx:145-148` renders the visible
    # "Include Address" as a sibling `<Text>` with the field itself passed `label=""`, so there is
    # no bound <label> to walk. The field id is the real handle (`fields.includeAddress.id`).
    # The positional path is KEPT as a fallback so this cannot go red on an id that turns out not
    # to be rendered — and the DIAG below reports which path actually ran, so the fallback cannot
    # quietly become permanent.
    jsassert("⭐ TOGGLE + PROOF: flip `Include Address` (BY FIELD ID) and confirm it changed",
             "const f = document.getElementById('mobile-geolocate');\n"
             "if (!f) return false;\n"
             "let el = f.querySelector('#includeAddress, input[name=\"includeAddress\"]');\n"
             "if (!el) {\n"
             "  const boxes = [...f.querySelectorAll('input[type=checkbox]')];\n"
             "  if (boxes.length !== 2) return false;   // shape changed — refuse to guess\n"
             "  el = boxes[1];\n"
             "}\n"
             "const before = el.checked;\n"
             "el.click();                // real click event — React's onChange fires\n"
             "return el.checked !== before;", timeout=30),
    jsassert("DIAG: the `includeAddress` field id resolved (if this fails, the toggle above "
             "fell back to position and the id needs re-reading)",
             "const f = document.getElementById('mobile-geolocate');\n"
             "if (!f) return false;\n"
             "return !!f.querySelector('#includeAddress, input[name=\"includeAddress\"]');",
             optional=True, timeout=15),
    step("wait", "Let the form revalidate", {"value": 2}),
    # Re-evaluated after a PROVEN state change — that is what makes this a second data point
    # rather than a repeat of the first.
    jsassert("⭐ VALIDITY 2/2: the invariant still holds after a real toggle",
             VALIDITY_BICONDITIONAL, timeout=30),

    # ---- close, submit nothing ----------------------------------------------------------------
    # A plain Mantine <Modal> with onClose -> setGeolocation(null); closeOnEscape defaults true.
    step("pressKey", "Escape — close WITHOUT submitting", {"value": "Escape"},
         always=True, timeout=15),
    step("wait", "Let the modal close", {"value": 2}, always=True),
    step("assertPageLacks", "RESTORED: the modal is gone and nothing was submitted",
         {"value": "Updating Asset Location"}, always=True, timeout=30),

    # ---- OFFLINE LEG - the same modal's other branch (checklist 🟢 #20) ------------------------
    # `AssetGeolocate.tsx:272` renders `OfflineGeolocateForm` when `!navigator.onLine` - the
    # PROPERTY, which an `offline` event does not change. A step-defined getter reaches it (the
    # probe that settled that: step JS runs in the page's world). No event is dispatched, so
    # `useNetwork()` stays online and the geolocate control stays ENABLED. Both stubs are still
    # installed, so the tap resolves to a position and the modal opens as before.
    jsassert("OFFLINE LEG: define an own `onLine` getter (false) — no `offline` event, so the "
             "control stays enabled",
             "Object.defineProperty(navigator, 'onLine', "
             "{ configurable: true, get: function () { return false; } });\n"
             "return navigator.onLine === false;", timeout=15),
    step("click", "Tap the geolocate control again (property offline)",
         {"element": xpath_el(WO_URL, GEO_ROOT_IN_PANEL)}, timeout=30),
    step("assertPageContains", 'The modal opened again — "Updating Asset Location"',
         {"value": "Updating Asset Location"}, timeout=60),
    jsassert("⭐ OFFLINE FORM: `Location details are unavailable offline.` + `Submit to update "
             "latitude/longitude.` in `#mobile-geolocate-offline` — and the online form is NOT there",
             "const off = document.getElementById('mobile-geolocate-offline');\n"
             "const t = off ? (off.textContent || '') : '';\n"
             "return t.includes('Location details are unavailable offline.')\n"
             "  && t.includes('Submit to update latitude/longitude.')\n"
             "  && !document.getElementById('mobile-geolocate');", timeout=30),
    step("pressKey", "Escape — close the offline form WITHOUT submitting", {"value": "Escape"},
         always=True, timeout=15),
    step("wait", "Let the modal close", {"value": 2}, always=True),
    jsassert("RESTORE: remove the `onLine` getter", "try { delete navigator.onLine; } catch (e) {}\n"
             "return navigator.onLine === true;", always=True, timeout=15),
    step("assertPageLacks", "RESTORED: the modal is gone again, nothing submitted",
         {"value": "Updating Asset Location"}, always=True, timeout=30),
    jsassert("RESTORED: both stubs removed", REMOVE_STUBS, always=True, timeout=30),
]

write(test(
    "MOB.358_Work_Asset_Geolocate",
    "`MOB.358` **`AssetGeolocate` — the asset location form behind `GeolocateButton`.**\n"
    "- Closes the half of T1.6 that `MOB.731` does not: that covers `ProximityMenu`, **this is\n"
    "  `GeolocateButton`'s form-fill.**\n"
    "- ⭐ **One component, three entry points** — the Collector row, the map card header, and the\n"
    "  work order **Assets tab**, which is the path used here because `MOB.347` already proves\n"
    "  it.\n"
    "- ⚠️ **`onResult` fires only AFTER a live Mapbox reverse-geocode** "
    "(`GeolocateButton.tsx:27`), so a stubbed position alone opens nothing. **`fetch` is stubbed\n"
    "  for the Mapbox geocoding URL only** (Apollo uses `fetch`; everything else passes\n"
    "  through). That removes a third-party dependency *and* makes the form's contents\n"
    "  deterministic — so the test proves the response was **mapped into the form**, not merely\n"
    "  that a form opened.\n"
    "- ⭐ **Trap 8 as a BICONDITIONAL, asserted twice around a real toggle**: Submit's `type` is\n"
    "  `submit` **iff** some include-box is checked. `includeGis` defaults to the asset's\n"
    "  geometry, so any fixed expectation would be asking the fixture a question — the mistake\n"
    "  `MOB.357` run 1 made.\n"
    "- ⚠️ Stubs are installed **after the last `go()`** — geolocation stubs do not survive a\n"
    "  navigation (`MOB.974` G7).\n"
    "- 🛑 **STRICTLY READ-ONLY.** Submitting fires `UPDATE_ASSET` on the asset's real address and\n"
    "  coordinates *with an `optimisticResponse`*, so a bad run would repaint as if it worked\n"
    "  (trap 6). Nothing is submitted; the modal is escaped and both stubs removed\n"
    "  (`alwaysExecute`).\n"
    "- 🐞 Related: `bugs_found.md` **§29** — `reverseGeocode` has no `ok` check and no `catch`,\n"
    "  so a Mapbox failure means the user's tap silently does nothing.",
    steps,
    tags=["Mobile", "env:dev", "Work Order", "Geolocation", "read-only"],
))
print("wrote MOB.358 (asset geolocate location form)")
