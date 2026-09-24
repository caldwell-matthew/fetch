"""Build MOB.910_Offline_UI - the app's reaction to going offline. Previously "unreachable".

WHAT CHANGED
  Appendix C held that offline behaviour was unreachable because Synthetics has no
  network-toggle step. True, and beside the point: the app does not read the network, it reads
  `useNetwork()` from `@mantine/hooks` -

      useWindowEvent("offline", () => setStatus({ online: false, ... }));

  so a `Run JavaScript` step can dispatch that event and flip every offline branch.
  `MOB.975_DIAG_Offline` proved it on 2026-08-21 - ten probes, all green, in 55s. This is the
  real test built on that measurement.

🛑 WHAT THIS DOES **NOT** PROVE - read before extending it
  `navigator.onLine` stays TRUE (measured, probe A4), so the browser is still online and every
  request still goes out. This proves the UI's REACTION to an offline signal. It proves
  NOTHING about the transaction queue - not that mutations queue, not that they drain in
  order, not that they survive a reload. Those need a real network cut.
  ⚠️ The queue is also untested in **Jest** (`QueueLink`, `PersistedQueueLink`, `SerializeLink`,
  `ErrorLink` have no tests at all), so a green run here must not be read as covering it.

WHY THE NEGATIVES ARE THE POINT
  Three separate components gate on `online`, in two directions:
      NetworkStatusIcon   swaps the icon         -> POSITIVE: wifi-slash appears
      Home.tsx            `asset.read && online` -> NEGATIVE: the tile disappears
      TopHeader           `!permissions || !online` -> NEGATIVE: the menu item disappears
  A bare absence check is vacuous (trap 5), so each negative is paired with its own baseline
  asserted BEFORE the dispatch: the tile and the item are proven present first, which is what
  makes their disappearance evidence rather than an accident of the page not loading.

SELF-RESTORING, AND IT HAS TO BE. A suite shares one browser session, so a run left offline
would hide the Asset Lookup tile and menu item from every later subtest and put half the app
into its degraded state. The `online` dispatch and its verification are `alwaysExecute`
(trap 16c) - this is a session-wide state change, the same hazard class as the map toggles but
with wider blast radius.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

HOME = BASE + "/"
BURGER = '//button[@aria-label="Toggle navigation"]'

# Icon names measured for MOB.470 (trap 14): faWifi -> `wifi`, faWifiSlash -> `wifi-slash`.
TILE_JS = ("const tiles = () => [...document.querySelectorAll('img[alt^=\"icon for \"]')]"
           ".map(i => i.getAttribute('alt') || '');\n")
MENU_JS = ("const items = () => [...document.querySelectorAll('.mantine-Menu-item')]"
           ".map(e => (e.textContent || '').trim());\n")


def dispatch(evt, always=False):
    return jsassert(f"Dispatch a window '{evt}' event",
                    f"window.dispatchEvent(new Event('{evt}'));\nreturn true;",
                    always=always, timeout=15)


steps = [
    go(HOME, "the home screen"),
    step("wait", "Let home render", {"value": 4}),
    step("assertPageContains", "GATE: the home screen rendered",
         {"value": "Welcome,"}, timeout=60),

    # ---- BASELINES, all asserted BEFORE the dispatch ---------------------------------
    # Without these the three negatives below would be vacuous - "the tile is absent" is
    # equally true on a page that never rendered (trap 5).
    jsassert("BASELINE: the ONLINE wifi icon is showing",
             "return !!document.querySelector('[data-icon=\"wifi\"]')"
             " && !document.querySelector('[data-icon=\"wifi-slash\"]');", timeout=30),
    jsassert("BASELINE: the Asset Lookup TILE is present on Home",
             TILE_JS + "return tiles().some(a => /Asset Lookup/i.test(a));", timeout=30),
    step("click", "Open the menu", {"element": xpath_el(HOME, BURGER)}, timeout=30),
    step("wait", "Let the menu open", {"value": 2}),
    jsassert("BASELINE: the Asset Lookup MENU ITEM is present",
             MENU_JS + "return items().some(t => /^Asset Lookup$/.test(t));", timeout=30),
    step("pressKey", "Close the menu", {"value": "Escape"}),
    step("wait", "Let the menu close", {"value": 1}),

    # ---- GO OFFLINE ------------------------------------------------------------------
    dispatch("offline"),
    step("wait", "Let React re-render", {"value": 3}),

    jsassert("POSITIVE: the offline icon (wifi-slash) is now showing",
             "return !!document.querySelector('[data-icon=\"wifi-slash\"]');",
             always=True, timeout=30),
    jsassert("POSITIVE: the online icon is gone — the swap really happened",
             "return !document.querySelector('[data-icon=\"wifi\"]');",
             always=True, timeout=30),
    jsassert("NEGATIVE: the Asset Lookup TILE is hidden (Home gates it on `online`)",
             TILE_JS + "return !tiles().some(a => /Asset Lookup/i.test(a));",
             always=True, timeout=30),
    jsassert("NEGATIVE: the other tiles are STILL there — only the online-gated one went",
             TILE_JS + "return tiles().length >= 3;", always=True, timeout=30),

    step("click", "Open the menu again", {"element": xpath_el(HOME, BURGER)},
         always=True, timeout=30),
    step("wait", "Let the menu open", {"value": 2}, always=True),
    jsassert("NEGATIVE: the Asset Lookup MENU ITEM is hidden while offline",
             MENU_JS + "if (!items().length) return false;\n"
             "return !items().some(t => /^Asset Lookup$/.test(t));",
             always=True, timeout=30),
    jsassert("The rest of the menu is intact — this is gating, not a broken render",
             MENU_JS + "return items().some(t => /Work Orders|Transaction Log/.test(t));",
             always=True, timeout=30),
    step("pressKey", "Close the menu", {"value": "Escape"}, always=True),
    step("wait", "Let the menu close", {"value": 1}, always=True),

    # THE LIMIT, asserted so it cannot be forgotten: the browser never actually went offline.
    jsassert("LIMIT: navigator.onLine is STILL true — this proves UI reaction, NOT the queue",
             "return navigator.onLine === true;", always=True, timeout=15),

    # ---- RESTORE. alwaysExecute — a session left offline degrades every later subtest --
    dispatch("online", always=True),
    step("wait", "Let React re-render", {"value": 3}, always=True),
    jsassert("RESTORED: the online wifi icon is back and wifi-slash is gone",
             "return !!document.querySelector('[data-icon=\"wifi\"]')"
             " && !document.querySelector('[data-icon=\"wifi-slash\"]');",
             always=True, timeout=30),
    jsassert("RESTORED: the Asset Lookup tile is back on Home",
             TILE_JS + "return tiles().some(a => /Asset Lookup/i.test(a));",
             always=True, timeout=30),
]

write(test(
    "MOB.910_Offline_UI",
    "`MOB.910` **The app's reaction to going offline** — a surface Appendix C called\n"
    "unreachable until 2026-08-21.\n"
    "- **How**: the app reads `useNetwork()`, which is `useWindowEvent('offline', ...)`, so a\n"
    "  JS step dispatches that event and flips every offline branch. Proven first by\n"
    "  `MOB.975_DIAG_Offline` (ten probes, green) rather than assumed.\n"
    "- **Covers**: `NetworkStatusIcon`'s offline half (`MOB.470` could only ever assert the\n"
    "  online one), the Asset Lookup **tile** gate on Home, and the Asset Lookup **menu item**\n"
    "  gate in `TopHeader`.\n"
    "- **Every negative is paired with a baseline asserted BEFORE the dispatch** — otherwise\n"
    "  \"the tile is absent\" would be equally true of a page that never rendered (trap 5). It\n"
    "  also asserts the OTHER tiles and menu items survive, so this reads as gating rather\n"
    "  than a broken render.\n"
    "- 🛑 **It does NOT prove the transaction queue.** `navigator.onLine` stays true (asserted\n"
    "  explicitly), so requests still go out. The queue is untested here **and in Jest** —\n"
    "  `QueueLink`/`PersistedQueueLink`/`SerializeLink`/`ErrorLink` have no tests at all.\n"
    "- **SELF-RESTORING**, restore legs `alwaysExecute`: a suite shares one browser session, so\n"
    "  a run left offline would hide half the app from every later subtest.",
    steps,
    tags=["Mobile", "env:dev", "Offline", "read-only"],
))
print("wrote MOB.910 (offline UI)")
