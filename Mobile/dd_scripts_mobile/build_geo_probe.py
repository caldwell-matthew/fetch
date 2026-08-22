"""Build MOB.974_DIAG_Geolocation - can a Synthetics test stub the browser's geolocation?

THE QUESTION, AND WHY IT IS ASKED THE SAME WAY THE OFFLINE ONE WAS
  `MOB.730` currently stops at the menu, with a 🛑 saying a radius must never be clicked
  because `getCurrentPosition` cannot be satisfied in a runner. That is the same shape of claim
  Appendix C made about offline - a statement about the HARNESS, inherited and never retested -
  and offline turned out to be wrong. So: measure before building, exactly as `MOB.975` did.

  The claim here is narrower and might well hold. `navigator.geolocation` is a readonly
  accessor on `Navigator.prototype`, so the OBJECT cannot be replaced. But the probe does not
  need to replace it - it only needs the METHOD to be writable:

      navigator.geolocation.getCurrentPosition = fn

  G1 asks exactly that and nothing else. Everything after it is contingent.

TWO CONSUMERS, TWO DIFFERENT METHODS - a detail that would break a stub built on the summary
  ProximityMenu.tsx:28   getCurrentPosition   <- what MOB.730 needs
  GeolocateButton.tsx:27 getCurrentPosition
  useGeolocation.ts:28   watchPosition + clearWatch
  So the stub covers all three. ⚠️ `useGeolocation` is **dead in mobile** - its only consumer
  (`Map/index.tsx:61`) is commented out - so it is stubbed for completeness, not for coverage.

WHY G3 IS THE DECISIVE ONE, NOT G1
  G1 only proves the assignment stuck. It does not prove the APP uses it: a component that
  captured a reference at module load, or a runner that evaluates JS in an isolated world,
  would leave G1 green and the app unaffected. G3 clicks a real radius and reads the button's
  own label - `Near Me` -> `Within 100 mi` - which only changes if `locate()` resolved through
  the stub. That is a state change readable without a screenshot, the same shape as MOB.121's
  style button and MOB.346's toggle.

G7 IS THE ONE THAT DECIDES THE COST OF THE REAL TEST
  A `Run JavaScript` step runs in the page's context, so a navigation almost certainly discards
  the stub. If G7 shows that, every future geolocation test must re-apply the stub after each
  `go()` - which is a real constraint on how such a test is written, and much cheaper to learn
  here than halfway through building one.

⚠️ THE PERSISTENCE HAZARD IS WORSE HERE THAN ANYWHERE ELSE IN THE SUITE, and this probe is
the first thing that can actually trigger it. `AssetLookup/index.tsx:56` stores the chosen
radius in `sessionStorage['asset_lookup_proximity_radius']`, and `ProximityMenu`'s mount effect
AUTO-LOCATES when one is present. A radius left behind does not just alter a toggle - it
silently filters the asset list, and re-sorts it by `distanceFromMe`, for every later subtest
in the shared session. That would corrupt `MOB.700` and `MOB.720` while leaving them green.
Hence the restore is belt AND braces, both `alwaysExecute`: click `Clear`, then remove the key
directly, then assert it is gone.

STANDALONE, so it borrows MOB.000's login steps and declares the credential globals - a
diagnostic that forgets this misses every locator (trap noted under Appendix C).
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write, jsassert  # noqa: E402

HOME = BASE + "/"
LOOKUP_URL = BASE + "/asset-lookup"
RADIUS_KEY = "asset_lookup_proximity_radius"
RADIUS = 100  # the widest option, to give the result list its best chance of being non-empty

NEAR_ME_BTN = '//button[contains(normalize-space(.), "Near Me")]'
MENU_ITEMS_JS = ("const items = [...document.querySelectorAll('.mantine-Menu-item')]"
                 ".map(e => (e.textContent || '').trim());\n")

login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]

# A fixed, valid position. Coordinates are deliberately unremarkable - the probe asks whether
# the stub is CONSUMED, not whether any asset is nearby, so G6 (rows) is optional by design.
STUB = """
try {
  var pos = { coords: { latitude: 41.8781, longitude: -87.6298, accuracy: 5,
                        altitude: null, altitudeAccuracy: null, heading: null, speed: null },
              timestamp: Date.now() };
  var g = navigator.geolocation;
  var ok = function (cb) { setTimeout(function () { cb(pos); }, 0); };
  g.getCurrentPosition = function (s) { ok(s); };
  g.watchPosition = function (s) { ok(s); return 1; };
  g.clearWatch = function () {};
  // Tag the functions so a later step can prove THESE are still installed, rather than
  // merely that something callable is there (trap 5 in JS form).
  g.getCurrentPosition.__dd = true;
  g.watchPosition.__dd = true;
  return true;
} catch (e) { return false; }
"""

INSTALLED = ("var f = navigator.geolocation && navigator.geolocation.getCurrentPosition;\n"
             "return !!f && f.__dd === true;")

steps = (
    login_steps
    + [
        go(LOOKUP_URL, "asset lookup"),
        step("wait", "Let the page mount", {"value": 4}),
        step("assertElementContent", 'GATE: the "Asset Lookup" page rendered',
             {"check": "contains", "value": "Asset Lookup",
              "element": xpath_el(LOOKUP_URL,
                                  '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                                  ' "Asset Lookup")]')}, timeout=60),

        # ---- BASELINE ---------------------------------------------------------------------
        # Not optional: if a radius were already stored the page would have auto-located on
        # mount and every reading below would be about the wrong starting state.
        jsassert(f"BASELINE: no radius stored in sessionStorage['{RADIUS_KEY}']",
                 f"const v = sessionStorage.getItem('{RADIUS_KEY}');\n"
                 "return v === null || v === 'null' || v === '';", timeout=30),
        step("assertElementPresent", 'BASELINE: the button reads "Near Me" (no radius set)',
             {"element": xpath_el(LOOKUP_URL, NEAR_ME_BTN)}, timeout=60),

        # ---- G0: is there anything to stub at all? ----------------------------------------
        jsassert("G0: navigator.geolocation exists in this runner",
                 "return !!(navigator && navigator.geolocation)"
                 " && typeof navigator.geolocation.getCurrentPosition === 'function';",
                 optional=True, always=True, timeout=15),

        # ---- THE EXPERIMENT ---------------------------------------------------------------
        jsassert("STUB: overwrite getCurrentPosition / watchPosition / clearWatch",
                 STUB, optional=True, always=True, timeout=15),

        jsassert("G1 ⭐ the assignment STUCK — the method was writable",
                 INSTALLED, optional=True, always=True, timeout=15),
        step("wait", "A beat, to see whether anything reverts it", {"value": 2}, always=True),
        jsassert("G2: the stub SURVIVES to the next step (same page, no navigation)",
                 INSTALLED, optional=True, always=True, timeout=15),

        # ---- G3: the decisive one — does the APP consume it? -------------------------------
        step("click", 'Open the "Near Me" menu',
             {"element": xpath_el(LOOKUP_URL, f"({NEAR_ME_BTN})[1]")},
             optional=True, always=True, timeout=30),
        step("wait", "Let the menu open", {"value": 2}, always=True),
        step("click", f'Choose "{RADIUS} miles" — this calls locate() → getCurrentPosition',
             {"element": xpath_el(
                 LOOKUP_URL,
                 f'//*[contains(concat(" ", normalize-space(@class), " "),'
                 f' " mantine-Menu-item ")][normalize-space(.)="{RADIUS} miles"]')},
             optional=True, always=True, timeout=30),
        # locate() is async: getCurrentPosition -> setState -> refetch -> re-render.
        step("wait", "Let locate() resolve and the list refetch", {"value": 6}, always=True),

        jsassert(f'G3 ⭐⭐ DECISIVE: the button now reads "Within {RADIUS} mi" — the app '
                 f'consumed the stub',
                 "return [...document.querySelectorAll('button')]"
                 f".some(b => /Within\\s+{RADIUS}\\s*mi/.test((b.textContent || '').trim()));",
                 optional=True, always=True, timeout=30),
        jsassert("G3b: the \"Near Me\" label is GONE — it is a swap, not a second button",
                 "return ![...document.querySelectorAll('button')]"
                 ".some(b => /^Near Me$/.test((b.textContent || '').trim()));",
                 optional=True, always=True, timeout=15),

        # ---- G4/G5: the downstream effects a real test would assert ------------------------
        step("click", "Re-open the menu to read its conditional items",
             {"element": xpath_el(
                 LOOKUP_URL,
                 f'//button[contains(normalize-space(.), "Within {RADIUS} mi")]')},
             optional=True, always=True, timeout=30),
        step("wait", "Let the menu open", {"value": 2}, always=True),
        jsassert('G4: "Update my location" and "Clear" have APPEARED (the `!!value` branch)',
                 MENU_ITEMS_JS +
                 "return items.includes('Update my location') && items.includes('Clear');",
                 optional=True, always=True, timeout=15),
        step("pressKey", "Close the menu", {"value": "Escape"}, always=True),
        step("wait", "Let the menu close", {"value": 1}, always=True),

        jsassert(f"G5: sessionStorage['{RADIUS_KEY}'] now holds {RADIUS} — the hazard is REAL "
                 f"and this probe just created it",
                 f"return String(sessionStorage.getItem('{RADIUS_KEY}') || '')"
                 f".indexOf('{RADIUS}') >= 0;", optional=True, always=True, timeout=15),
        jsassert('G6: result rows show a "mi away" distance (optional — depends on whether '
                 'any fixture asset is near the stubbed coordinates)',
                 "return /\\d+(\\.\\d+)?\\s*mi away/.test(document.body.innerText || '');",
                 optional=True, always=True, timeout=15),

        # ---- G7: does the stub survive a navigation? --------------------------------------
        # Decides whether a real test must re-apply the stub after every go().
        go(HOME, "home, to force a navigation"),
        step("wait", "Let home render", {"value": 4}, always=True),
        jsassert("G7: the stub SURVIVED a navigation (if this fails, a real test must "
                 "re-apply it after every go())",
                 INSTALLED, optional=True, always=True, timeout=15),

        # ---- S1-S3: the OTHER section-B question, folded into this run for free ------------
        jsassert("S1: navigator.serviceWorker is readable",
                 "return 'serviceWorker' in navigator;",
                 optional=True, always=True, timeout=15),
        jsassert("S2: a service worker is CONTROLLING this page",
                 "return !!(navigator.serviceWorker && navigator.serviceWorker.controller);",
                 optional=True, always=True, timeout=15),
        # getRegistrations() is async and a JS assertion must return a boolean, so the promise
        # is kicked off in one step and read in the next.
        jsassert("S3a: kick off getRegistrations()",
                 "window.__ddSW = 'pending';\n"
                 "try { navigator.serviceWorker.getRegistrations()\n"
                 "  .then(function (r) { window.__ddSW = r.length; })\n"
                 "  .catch(function () { window.__ddSW = -1; }); } catch (e) "
                 "{ window.__ddSW = -2; }\nreturn true;",
                 optional=True, always=True, timeout=15),
        step("wait", "Let the promise settle", {"value": 3}, always=True),
        jsassert("S3b: at least one service worker is REGISTERED",
                 "return typeof window.__ddSW === 'number' && window.__ddSW > 0;",
                 optional=True, always=True, timeout=15),

        # ---- RESTORE. Belt AND braces, both alwaysExecute ----------------------------------
        # A radius left behind silently filters and re-sorts Asset Lookup for every later
        # subtest. Clearing through the UI alone is not enough if any step above failed part
        # way, so the key is removed directly as well.
        go(LOOKUP_URL, "back to asset lookup, to clear the radius"),
        step("wait", "Let the page mount", {"value": 4}, always=True),
        jsassert(f"RESTORE: remove sessionStorage['{RADIUS_KEY}'] directly",
                 f"try {{ sessionStorage.removeItem('{RADIUS_KEY}'); }} catch (e) {{}}\n"
                 "return true;", always=True, timeout=15),
        go(LOOKUP_URL, "reload asset lookup so the cleared radius takes effect"),
        step("wait", "Let the page re-mount", {"value": 4}, always=True),
        jsassert(f"RESTORED: sessionStorage['{RADIUS_KEY}'] is empty again",
                 f"const v = sessionStorage.getItem('{RADIUS_KEY}');\n"
                 "return v === null || v === 'null' || v === '';", always=True, timeout=30),
        jsassert('RESTORED: the button reads "Near Me" again — no radius is filtering the list',
                 "return [...document.querySelectorAll('button')]"
                 ".some(b => /^Near Me$/.test((b.textContent || '').trim()));",
                 always=True, timeout=30),
    ]
)

write(test(
    "MOB.974_DIAG_Geolocation",
    "`MOB.974` **DIAGNOSTIC — can a Synthetics test stub geolocation?**\n"
    "- `MOB.730` stops at the menu because clicking a radius calls `getCurrentPosition`, which\n"
    "  *\"a runner cannot satisfy\"*. That is a claim about the **harness**, inherited and never\n"
    "  retested — the same shape of claim that turned out to be wrong for offline. So this\n"
    "  measures it, in one run, before anything is built on either answer.\n"
    "- `navigator.geolocation` is a readonly accessor, but the probe only needs the **method**\n"
    "  to be writable. **G1** asks exactly that; everything after it is contingent.\n"
    "- **G3 is the decisive one, not G1.** G1 only proves the assignment stuck — a component\n"
    "  holding an early reference, or an isolated JS world, would leave G1 green and the app\n"
    "  unaffected. G3 clicks a real radius and reads the button's own label\n"
    f"  (`Near Me` → `Within {RADIUS} mi`), which only changes if `locate()` resolved.\n"
    "- **G7 decides the cost of the real test**: if the stub does not survive a navigation,\n"
    "  every geolocation test must re-apply it after each `go()`.\n"
    "- **S1–S3 fold in the other section-B question** (service-worker registration) for the\n"
    "  price of four steps rather than a second run.\n"
    "- ⚠️ **This probe deliberately triggers the suite's worst persistence hazard**: a stored\n"
    "  `asset_lookup_proximity_radius` makes Asset Lookup AUTO-LOCATE on mount, silently\n"
    "  filtering and re-sorting the list for every later subtest. Restore is belt **and**\n"
    "  braces — `Clear` via the key, a reload, and an assertion that it is gone.\n"
    "- Delete once `MOB.730`'s 🛑 has been corrected either way.",
    steps,
    tags=["Mobile", "env:dev", "Diagnostic", "Geolocation", "read-only"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))
print("wrote MOB.974 (geolocation + service-worker reachability probe)")
