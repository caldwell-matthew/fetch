"""Build MOB.912_Offline_Connection_Screens - the screens that read `navigator.onLine` ITSELF.

WHY THESE WERE UNREACHABLE, AND WHAT CHANGED
  `MOB.910`/`MOB.911` go offline with a window `offline` event, which flips every `useNetwork()`
  consumer but leaves `navigator.onLine` true. Two screens read the property directly
  (`origin/development`):

      components/AssetLookup/index.tsx:160
          if (!window.navigator.onLine) return <ConnectionRequired />      -> OFFLINE_FEATURE_MESSAGE
      components/WorkOrders/components/MaterialCharges.tsx:104
          if (!window.navigator.onLine) return <Box>Internet Connection is required to make a
          material charge</Box>

  `MOB.980` settled it: Datadog step JS runs in the PAGE's world, so an own `onLine` getter
  defined on `navigator` shadows the prototype's, and the app reads `false`.

⭐ EACH LEG IS A PAIR, IN ONE PAGE SESSION — the same screen online, then offline
  No `offline` event is dispatched, so `useNetwork()` stays online and the Home tile, the menu and
  the tab strip stay usable. The override is set, then the screen is (re)mounted by an IN-APP
  route or tab change, because a `goToUrl` reloads and wipes the getter:
    Asset Lookup  online via the Home tile (search input) -> `history.back()` -> override ->
                  the tile again -> ConnectionRequired, no search input
    Material tab  online (CHARGES / ESTIMATES control) -> Notes tab -> override -> Material again
                  (`InfiniteTabs` is `keepMounted={false}`, so the panel remounts and re-reads
                  the property) -> the message, no CHARGES control
  The online half is what makes the offline half mean something: the same screen, same session,
  one property different.

NOT HERE: the offline geolocate form (`AssetGeolocate.tsx:272`) only renders after the geolocate
button returns a position - a Mapbox + geolocation chain that `MOB.358` stubs and has never run
meaningfully. It stays a checklist row.

🛑 READ-ONLY. Nothing is submitted; Asset Lookup's query is `skip: !navigator.onLine`. RESTORE is
`always` per leg: delete the getter, reload (a reload discards any JS override), and a hard gate
that the app reads online again.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert, ACTIVE_PANEL_JS  # noqa: E402

HOME = BASE + "/"
WO_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
WO_URL = f"{BASE}/work/{WO_ID}"
CONNECTION_REQUIRED = "This feature requires an internet connection."   # OFFLINE_FEATURE_MESSAGE
MATERIAL_OFFLINE = "Internet Connection is required to make a material charge"
TILE = '//img[starts-with(@alt, "icon for ") and contains(@alt, "Asset Lookup")]'
TILE_JS = ("const tiles = () => [...document.querySelectorAll('img[alt^=\"icon for \"]')]"
           ".map(i => i.getAttribute('alt') || '');\n")
ON_LOOKUP = "/\\/asset-lookup/.test(location.pathname)"
SEARCH = "document.querySelector('input[name=\"asset-search\"]')"


def tab(label):
    return f'//*[@role="tab"][contains(normalize-space(.), "{label}")]'


def override():
    return jsassert("OVERRIDE: define an own `onLine` getter (false) on navigator — no `offline` "
                    "event, so `useNetwork()` stays online",
                    "Object.defineProperty(navigator, 'onLine', "
                    "{ configurable: true, get: function () { return false; } });\n"
                    "return navigator.onLine === false;", timeout=15)


def restore(url, label, gate):
    return [
        jsassert("RESTORE: remove the getter", "try { delete navigator.onLine; } catch (e) {}\nreturn true;",
                 always=True, timeout=15),
        step("goToUrl", f"Navigate to {label} (a reload discards any override)", {"value": url},
             always=True),
        step("wait", "Let it render", {"value": 3}, always=True),
        step("assertPageContains", "GATE: the page rendered", {"value": gate}, always=True, timeout=60),
        jsassert("RESTORED: navigator.onLine is true again", "return navigator.onLine === true;",
                 always=True, timeout=15),
    ]


# PANEL: the Material tab's active panel.
MAT_JS = (ACTIVE_PANEL_JS +
          "const t = (p.textContent || '');\n"
          "const segs = [...p.querySelectorAll('label, button')].map(e => (e.textContent || '').trim());\n")

steps = [
    # ---- leg 1: Asset Lookup -> ConnectionRequired -------------------------------------------
    go(HOME, "the home screen"),
    step("wait", "Let home render", {"value": 4}),
    step("assertPageContains", "GATE: the home screen rendered", {"value": "Welcome,"}, timeout=60),
    jsassert("BASELINE: online, and the Asset Lookup tile is on Home",
             TILE_JS + "return navigator.onLine === true && tiles().some(a => /Asset Lookup/i.test(a));",
             timeout=30),
    step("click", "Open Asset Lookup from its Home tile (online)", {"element": xpath_el(HOME, TILE)},
         timeout=30),
    step("wait", "Let Asset Lookup render", {"value": 4}),
    jsassert("ONLINE HALF: Asset Lookup renders its search — no ConnectionRequired",
             f"return {ON_LOOKUP} && !!{SEARCH}\n"
             f"  && !(document.body.textContent || '').includes('{CONNECTION_REQUIRED}');", timeout=30),
    jsassert("Back to Home in-app (`history.back()` — no reload)", "history.back();\nreturn true;",
             timeout=15),
    step("wait", "Let Home render", {"value": 3}),
    jsassert("Home again, still the same page session (tile present)",
             TILE_JS + f"return !{ON_LOOKUP} && tiles().some(a => /Asset Lookup/i.test(a));", timeout=30),
    override(),
    step("click", "Open Asset Lookup from its Home tile (property offline)",
         {"element": xpath_el(HOME, TILE)}, timeout=30),
    step("wait", "Let Asset Lookup render", {"value": 4}),
    jsassert("⭐ OFFLINE HALF: ConnectionRequired — OFFLINE_FEATURE_MESSAGE, and no search input",
             f"return {ON_LOOKUP}\n"
             f"  && (document.body.textContent || '').includes('{CONNECTION_REQUIRED}')\n"
             f"  && !{SEARCH};", timeout=30),
] + restore(HOME, "the home screen", "Welcome,") + [

    # ---- leg 2: the Material tab -> its offline message --------------------------------------
    go(WO_URL, "the fixture work order"),
    step("wait", "Let the detail view begin rendering", {"value": 2}),
    step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}, timeout=30),
    step("click", "Open the Material tab (online)", {"element": xpath_el(WO_URL, tab("Material"))},
         timeout=30),
    step("wait", "Let the Material panel render", {"value": 2}),
    jsassert("ONLINE HALF: the Material panel shows its CHARGES / ESTIMATES control — no offline "
             "message",
             MAT_JS + f"return segs.includes('CHARGES') && segs.includes('ESTIMATES') && !t.includes('{MATERIAL_OFFLINE}');",
             timeout=30),
    step("click", "Switch to the Notes tab (unmounts the Material panel — `keepMounted={false}`)",
         {"element": xpath_el(WO_URL, tab("Notes"))}, timeout=30),
    step("wait", "Let the Notes panel render", {"value": 1}),
    override(),
    step("click", "Back to the Material tab (remounts it, re-reading the property)",
         {"element": xpath_el(WO_URL, tab("Material"))}, timeout=30),
    step("wait", "Let the Material panel render", {"value": 2}),
    jsassert(f"⭐ OFFLINE HALF: the panel reads `{MATERIAL_OFFLINE}` — and the CHARGES control is gone",
             MAT_JS + f"return t.includes('{MATERIAL_OFFLINE}') && !segs.includes('CHARGES');", timeout=30),
] + restore(WO_URL, "the fixture work order", "Status:")

write(test(
    "MOB.912_Offline_Connection_Screens",
    "`MOB.912` **The screens that read `navigator.onLine` itself — online, then offline, same session.**\n"
    "- `MOB.910`'s `offline` event cannot reach them; `MOB.980` proved a step can define the\n"
    "  property. No `offline` event here, so navigation stays usable.\n"
    "- **Asset Lookup**: search input online → `history.back()` → override → the tile again →\n"
    "  **ConnectionRequired** (OFFLINE_FEATURE_MESSAGE), no search input.\n"
    "- **Material tab**: CHARGES / ESTIMATES online → Notes → override → Material again (the panel\n"
    f"  remounts) → **{MATERIAL_OFFLINE}**, no CHARGES control.\n"
    "- 🛑 **READ-ONLY**. Each leg restores with `always` steps: delete the getter, reload, and a\n"
    "  hard gate that the app reads online.",
    steps,
    ["Mobile", "env:dev", "Offline", "Work Order", "Asset Lookup", "read-only"],
))
print("wrote MOB.912 (offline screens that read navigator.onLine)")
