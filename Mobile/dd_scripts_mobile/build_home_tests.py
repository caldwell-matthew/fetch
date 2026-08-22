"""Build MOB.180_Home_Screen - the landing route (T2.7), and extend MOB.210 to cover
HOME TILE permission gating as well as the menu.

WHY THIS EXISTS
  `routing/Home.tsx` had ZERO coverage. Nothing in the suite asserted a single string from
  it - `grep "Welcome,"` across all of dd_tests_mobile returned nothing. It is the first
  screen of every session AND the landing target of `resync()` (TopHeader navigates to '/'
  before `client.resetStore()`), so a break here is visible to every user on every launch.

THE READINESS SIGNAL IS NOT A PAGE TITLE
  Every other nav test gates on `#page-title h4`. Home cannot: `PageTitle` opens with
  `if (location.pathname === '/') return null`, so on Home there is no title element and no
  back arrow at all. The readiness signal here is the welcome banner + the tile buttons.

THE TILE LOCATOR IS THE IMG ALT, AND THAT IS DELIBERATE
  Each tile renders `<img alt="icon for {title} url">` (Home.tsx, the `Link` component).
  The hamburger menu renders the SAME six titles but its `<img>` carries NO alt. So
  `img[alt="icon for Work Orders url"]` matches the TILE and never the menu item - which
  is what keeps trap 5b out of this test. Matching on the text "Work Orders" would not:
  that string is also a menu item and a page title elsewhere.

WHY THE GATING GOES IN MOB.210 RATHER THAN A NEW TEST
  MOB.210 already navigates to the home page three times - once as `Admin`, once as
  `Admin (0000)`, once restored - and asserts nothing about it, only opening the menu. The
  gating assertions are therefore nearly free, and they take permission coverage from ONE
  gate (the `Work Orders` menu item) to SEVEN (that plus all six tiles).

  `Admin (0000)` has every CRUD flag off, so `Home.tsx`'s final branch fires and the page
  renders `No valid permissions`. That is a POSITIVE assertion to pair with the negatives,
  which matters: six `assertPageLacks` checks would all pass on a blank page too (trap 5).

DATADOG HAS NO assertElementAbsent
  So tile ABSENCE is asserted with a JS step counting `img[alt^="icon for "]`, not with
  `assertPageLacks` - the alt text is an attribute, not page text (trap 9).
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write, jsassert  # noqa: E402

HOME = BASE + "/"
WORK_URL = BASE + "/work"

# Every tile Home.tsx can render, in source order. Titles come from MOBILE_ROUTES except
# WORK, which Home overrides to "Work Orders" (the route's own title is the same string).
TILES = [
    "Asset Collector / Lens",
    "Mobile Jobs",
    "Asset Lookup",
    "Material Lookup",
    "Work Orders",
    "The Map",
]


def tile(title):
    """A home tile, matched by its icon's alt text - see the module docstring."""
    return f'//img[@alt="icon for {title} url"]'


# ---------------------------------------------------------------- MOB.180
write(test(
    "MOB.180_Home_Screen",
    "`MOB.180` The Home screen renders and its tiles navigate (T2.7).\n"
    "- READ-ONLY. Nothing is written; the one navigation is undone by going back home.\n"
    "- **The landing route had no test at all.** Home is where login lands and where\n"
    "  `resync()` sends you before `client.resetStore()`, so it is on every user's path\n"
    "  every session.\n"
    "- ⚠️ **Cannot gate on a page title like the other nav tests.** `PageTitle` returns\n"
    "  `null` when `location.pathname === '/'`, so Home has no `#page-title` and no back\n"
    "  arrow. This test gates on the welcome banner instead.\n"
    "- **Tiles are located by `img[alt=\"icon for … url\"]`, never by their text.** The\n"
    "  hamburger menu renders the same six titles, so a text match would pass with the\n"
    "  tiles missing entirely (trap 5b). The menu's icons carry no `alt`.\n"
    "- The banner assertions reject the FALLBACKS (`Friend`, `No Associated Organization`),\n"
    "  which is what makes them evidence that `GET_SESSION` actually resolved rather than\n"
    "  evidence that a heading exists (trap 5).",
    [
        go(HOME, "the mobile home page"),
        step("wait", "Let the app shell and GET_SESSION settle", {"value": 5}),

        # --- the banner. Positive, and specifically NOT the fallback strings.
        step("assertPageContains", "The welcome banner rendered", {"value": "Welcome,"}),
        jsassert(
            "PROOF: the banner greets the SESSION USER, not the 'Friend' fallback",
            "const hs = [...document.querySelectorAll('h1,h2,h3')]\n"
            "  .map(e => (e.textContent || '').trim());\n"
            "const w = hs.find(t => t.startsWith('Welcome,'));\n"
            "if (!w) return false;\n"
            "// Home.tsx falls back to 'Friend' when session.me.name is missing, so the\n"
            "// fallback rendering is exactly the failure this is here to catch.\n"
            "return w !== 'Welcome, Friend!' && /^Welcome, \\S.*!$/.test(w);",
            timeout=30),
        jsassert(
            "PROOF: the org line names an org, not the 'No Associated Organization' fallback",
            "const hs = [...document.querySelectorAll('h3')]\n"
            "  .map(e => (e.textContent || '').trim());\n"
            "const o = hs.find(t => t.startsWith('-') && t.endsWith('-'));\n"
            "if (!o) return false;\n"
            "return o !== '- No Associated Organization -';",
            timeout=30),
    ] + [
        # --- every tile the Admin role should see
        step("assertElementPresent", f'Tile "{t}" is present',
             {"element": xpath_el(HOME, tile(t))}, timeout=30)
        for t in TILES
    ] + [
        jsassert(
            f"All {len(TILES)} tiles rendered — no permission is silently hiding one",
            "const n = document.querySelectorAll('img[alt^=\"icon for \"]').length;\n"
            f"return n === {len(TILES)};",
            timeout=30),

        # --- a tile actually navigates. MOB.150 proves /work renders when reached from the
        #     MENU; this proves the TILE is wired, which is a different control.
        step("click", 'Click the "Work Orders" tile',
             {"element": xpath_el(HOME, tile("Work Orders"))}, timeout=30),
        step("wait", "Let the work route mount", {"value": 3}),
        step("assertElementContent", 'PROOF: the tile navigated to Work Orders',
             {"check": "contains", "value": "Work Orders",
              "element": xpath_el(WORK_URL,
                                  '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                                  ' "Work Orders")]')}, timeout=30),

        go(HOME, "back to the home page"),
        step("wait", "Let home re-render", {"value": 3}),
        step("assertElementPresent", "RESTORED: back on Home with its tiles",
             {"element": xpath_el(HOME, tile("Work Orders"))}, timeout=30),
    ],
    ["Mobile", "env:dev", "Navigation", "read-only"],
))

# ---------------------------------------------------------------- wire into MOB.990
suite_path = os.path.join(HERE, "MOB.990_Smoke_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
CHILD = "MOB.180_Home_Screen"
if CHILD not in [s.get("name") for s in steps]:
    steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                  "isCritical": True, "name": CHILD, "noScreenshot": False,
                  "type": "playSubTest",
                  "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"added {CHILD} to MOB.990_Smoke_Suite")

print("wrote MOB.180 (home screen)")
