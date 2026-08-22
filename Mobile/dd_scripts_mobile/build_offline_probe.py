"""Build MOB.975_DIAG_Offline - can a Synthetics test put the app into OFFLINE mode?

THE ONE QUESTION
  Appendix C has said since the suite began that offline behaviour is unreachable because
  "Synthetics has no network-toggle step". True as far as it goes - but the app does not read
  the network. It reads **`useNetwork()`** from `@mantine/hooks`, and that hook is:

      useWindowEvent("online",  () => setStatus({ online: true,  ... }));
      useWindowEvent("offline", () => setStatus({ online: false, ... }));

  So a `Run JavaScript` step can `window.dispatchEvent(new Event('offline'))` and flip every
  offline branch in the UI **without touching the network at all**. This probe asks whether
  that actually works in a Datadog runner, before any test is built on the assumption.

  Written as a probe rather than as the test itself because assuming has been expensive here:
  `MOB.134` cost five attempts to a chain of unverified assumptions. One read-only run settles
  this instead.

WHAT IT CANNOT DO, AND WHY THAT MATTERS
  `graphql/index.tsx:68` reads `navigator.onLine` directly, and a dispatched event does not
  change that property - so requests still go out. If this probe passes, what becomes testable
  is **the UI's reaction to going offline**, NOT the transaction queue. Anyone building on it
  must not claim the queue is covered. The queue remains untested in Datadog *and* in Jest
  (`QueueLink`, `PersistedQueueLink`, `SerializeLink` and `ErrorLink` have no tests at all).

READ-ONLY, and it RESTORES. `online` is dispatched again at the end with `alwaysExecute`: a
session left offline would poison every later subtest, which is the same session-wide hazard
as the map toggles - and worse, because half the app hides itself.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write, jsassert  # noqa: E402

HOME = BASE + "/"

login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]

# `NetworkStatusIcon` swaps faWifi -> faWifiSlash. Canonical names already measured for
# MOB.470 (trap 14): `wifi` and `wifi-slash`.
def icon(name):
    return (f'//*[@data-icon="{name}"'
            f' or contains(concat(" ", normalize-space(@class), " "), " fa-{name} ")]')


DISPATCH = ("window.dispatchEvent(new Event('{}'));\n"
            "return true;")

steps = (
    login_steps
    + [
        go(HOME, "the home screen"),
        step("wait", "Let home render", {"value": 4}),
        step("assertPageContains", "GATE: home rendered", {"value": "Welcome,"}, timeout=60),

        # ---- BASELINE: online ------------------------------------------------------------
        jsassert("BASELINE: the wifi icon is the ONLINE one",
                 "return !!document.querySelector('[data-icon=\"wifi\"]')"
                 " && !document.querySelector('[data-icon=\"wifi-slash\"]');", timeout=30),
        jsassert("BASELINE: the Asset Lookup tile is present (Home gates it on `online`)",
                 "return [...document.querySelectorAll('img[alt^=\"icon for \"]')]"
                 ".some(i => /Asset Lookup/i.test(i.getAttribute('alt') || ''));", timeout=30),

        # ---- THE EXPERIMENT --------------------------------------------------------------
        jsassert("DISPATCH: fire a window 'offline' event",
                 DISPATCH.format("offline"), timeout=15),
        step("wait", "Let React re-render", {"value": 3}),

        # A1 is the decisive one: if useNetwork honoured the event, the icon swapped.
        jsassert("A1 ⭐ DECISIVE: the icon is now wifi-slash — useNetwork honoured the event",
                 "return !!document.querySelector('[data-icon=\"wifi-slash\"]');",
                 optional=True, always=True, timeout=30),
        jsassert("A2: the online wifi icon is GONE",
                 "return !document.querySelector('[data-icon=\"wifi\"]');",
                 optional=True, always=True, timeout=15),
        jsassert("A3: the Asset Lookup tile disappeared from Home",
                 "return ![...document.querySelectorAll('img[alt^=\"icon for \"]')]"
                 ".some(i => /Asset Lookup/i.test(i.getAttribute('alt') || ''));",
                 optional=True, always=True, timeout=15),
        # Confirms the LIMIT, so nobody later mistakes this for a queue test.
        jsassert("A4: navigator.onLine is STILL true — the network was never touched",
                 "return navigator.onLine === true;", optional=True, always=True, timeout=15),

        # ---- the menu, which gates Asset Lookup on `!online` too --------------------------
        step("click", "Open the menu",
             {"element": xpath_el(HOME, '//button[@aria-label="Toggle navigation"]')},
             optional=True, always=True, timeout=30),
        step("wait", "Let the menu open", {"value": 2}, always=True),
        jsassert("A5: the Asset Lookup MENU ITEM is hidden while offline",
                 "const items = [...document.querySelectorAll('.mantine-Menu-item')]"
                 ".map(e => (e.textContent || '').trim());\n"
                 "if (!items.length) return false;\n"
                 "return !items.some(t => /^Asset Lookup$/.test(t));",
                 optional=True, always=True, timeout=15),
        step("pressKey", "Close the menu", {"value": "Escape"}, always=True),
        step("wait", "Let the menu close", {"value": 1}, always=True),

        # ---- RESTORE. alwaysExecute: a session left offline hides half the app ------------
        jsassert("RESTORE: fire a window 'online' event",
                 DISPATCH.format("online"), always=True, timeout=15),
        step("wait", "Let React re-render", {"value": 3}, always=True),
        jsassert("RESTORED: the online wifi icon is back",
                 "return !!document.querySelector('[data-icon=\"wifi\"]')"
                 " && !document.querySelector('[data-icon=\"wifi-slash\"]');",
                 always=True, timeout=30),
    ]
)

write(test(
    "MOB.975_DIAG_Offline",
    "`MOB.975` **DIAGNOSTIC — can a Synthetics test put the app offline?**\n"
    "- Appendix C says offline is unreachable because there is no network-toggle step. But the\n"
    "  app reads **`useNetwork()`**, which is `useWindowEvent('offline', ...)` — so a JS step\n"
    "  can dispatch that event and flip every offline branch **without touching the network**.\n"
    "- **A1 is the decisive probe**: does the wifi icon become `wifi-slash`? A2/A3/A5 then show\n"
    "  how far the effect reaches (the Home tile and the menu item both gate on `online`).\n"
    "- **A4 confirms the LIMIT**: `navigator.onLine` stays true, so requests still go out.\n"
    "  This can only ever prove *the UI reacts to going offline* — **never** that the\n"
    "  transaction queue works. Do not let anyone claim otherwise.\n"
    "- **RESTORES** with an `alwaysExecute` `online` dispatch: a session left offline hides\n"
    "  half the app from every later subtest.\n"
    "- Delete once Appendix C has been corrected either way.",
    steps,
    tags=["Mobile", "env:dev", "Diagnostic", "Offline", "read-only"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))
print("wrote MOB.975 (offline reachability probe)")
