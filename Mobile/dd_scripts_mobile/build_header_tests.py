"""Build MOB.470_Header_Status_Icons - the four things `TopHeader` renders that no test
asserted (T3.2, found uncovered 2026-08-18).

THE VERSION STRING IS THE POINT OF THIS TEST
  The menu's last item is `'Version: ' + window.__mentorapm.shortVersion`, disabled. It is
  the ONLY place a synthetic test can see which build is actually running, which makes it
  the cheapest real deploy signal in the whole suite - and it was never asserted. It is
  checked two ways: the literal prefix as page text, and a JS read of
  `window.__mentorapm.shortVersion` proving the value behind it is non-empty. The second
  matters because `'Version: ' + undefined` still renders the prefix (trap 5).

WHAT EACH ICON CAN AND CANNOT PROVE FROM A BROWSER RUNNER
  NetworkStatusIcon  faWifi online / faWifiSlash offline. The ONLINE half is provable here;
                     the offline half needs the network toggled off (Appendix C). Asserting
                     `wifi` present AND `wifi-slash` absent is a real pair - a component
                     stuck on the offline icon fails it.
  TransactionStatus  `if (!count) return null`, and the count is always 0 while online, so
                     the only online assertion is ABSENCE. That is weak on its own (trap 5),
                     so it is stated as what it is: proof of the `!count` branch, nothing
                     more. The meaningful half is offline-only.
  UploadStatusIcon   NOT TESTED AT ALL, and not a gap. `TopHeader` renders it as
                     `{!!window.ReactNativeWebView && <UploadStatusIcon />}` - it does not
                     mount in a browser, only inside the Expo shell (T1.7). The checklist
                     carried this as open work blocked on "an in-flight upload"; the real
                     blocker was one line higher. A JS step asserts the bridge is absent, so
                     the reasoning is checked rather than assumed.
  .mobile-crew       The crew label beside the logo opens the SAME RoleSelection modal as
                     the menu item. MOB.430 dismisses that modal from the MENU path; this
                     second entry point was untested. Opening and escaping is read-only -
                     nothing is submitted, so no crew changes.

ICON NAMES WERE MEASURED, NOT GUESSED (trap 14):
    faWifi -> "wifi"   faWifiSlash -> "wifi-slash"   faUpload -> "upload"
    faCodeFork -> "code-fork"
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write, jsassert  # noqa: E402

HOME = BASE + "/"
BURGER = '//button[@aria-label="Toggle navigation"]'
CREW_SPAN = '//*[contains(concat(" ", normalize-space(@class), " "), " mobile-crew ")]'


def icon(name):
    return (f'//*[@data-icon="{name}" or contains(concat(" ", normalize-space(@class), " "),'
            f' " fa-{name} ")]')


write(test(
    "MOB.470_Header_Status_Icons",
    "`MOB.470` The header's status icons, version string and crew shortcut (T3.2).\n"
    "- READ-ONLY. The crew modal is opened and dismissed with Escape; nothing is submitted,\n"
    "  so no crew changes (unlike `MOB.200`).\n"
    "- **The version string is the reason this test exists.** `Version: ` +\n"
    "  `window.__mentorapm.shortVersion` is the only place a synthetic run can see which\n"
    "  build is live — the cheapest real deploy signal available — and nothing asserted it.\n"
    "  Checked twice: the rendered prefix, and a JS read proving the value behind it is\n"
    "  non-empty, because `'Version: ' + undefined` still renders the prefix (trap 5).\n"
    "- **Network icon:** the ONLINE half is provable here (`wifi` present *and*\n"
    "  `wifi-slash` absent, so a component stuck offline fails). The offline half needs the\n"
    "  network toggled off — Appendix C.\n"
    "- **Pending-transaction icon:** `if (!count) return null`, and the count is always 0\n"
    "  while online, so the only online assertion is absence. That proves the `!count`\n"
    "  branch and nothing else — stated plainly rather than dressed up (trap 5).\n"
    "- **The upload icon is deliberately not tested.** It is rendered as\n"
    "  `{!!window.ReactNativeWebView && <UploadStatusIcon />}`, so it never mounts in a\n"
    "  browser (T1.7). The checklist had carried it as open work blocked on \"an in-flight\n"
    "  upload\"; the real blocker was one line higher up. The absence of the bridge is\n"
    "  asserted so that reasoning is checked, not assumed.\n"
    "- **The crew shortcut is a second entry point** to the modal `MOB.430` reaches from the\n"
    "  menu — `<span class=\"mobile-crew\">` beside the logo.\n"
    "- Icon names were **measured** (trap 14): `wifi`, `wifi-slash`, `upload`, `code-fork`.",
    [
        go(HOME, "the mobile home page"),
        step("wait", "Let the app shell and GET_SESSION settle", {"value": 5}),

        # ---- network status: online half
        step("assertElementPresent", "NETWORK: the online wifi icon is rendered",
             {"element": xpath_el(HOME, icon("wifi"))}, timeout=30),
        jsassert("NETWORK: the OFFLINE icon is not — the pair is what makes this a real check",
                 "return !document.querySelector('[data-icon=\"wifi-slash\"], .fa-wifi-slash');",
                 timeout=30),
        jsassert("Sanity: the runner really is online (navigator.onLine)",
                 "return navigator.onLine === true;", timeout=30),

        # ---- pending transactions: absence only, and said so
        jsassert("PENDING TX: no upload icon while online — the `!count` branch",
                 'return !document.querySelector(\'[data-icon="upload"], .fa-upload\');',
                 timeout=30),

        # ---- the Expo-only upload icon: check the REASON it is absent
        jsassert("The ReactNativeWebView bridge is absent, so UploadStatusIcon cannot mount",
                 "return !window.ReactNativeWebView;", timeout=30),

        # ---- version string, in the menu
        step("click", "Open the header menu",
             {"element": xpath_el(HOME, BURGER)}, timeout=30),
        step("wait", "Wait for the menu", {"value": 2}),
        step("assertPageContains", "VERSION: the menu renders a version item",
             {"value": "Version: "}),
        step("assertElementPresent", "VERSION: it carries the code-fork icon",
             {"element": xpath_el(HOME, icon("code-fork"))}, timeout=30),
        jsassert(
            "PROOF: the version has a real value — 'Version: ' + undefined renders too",
            "const v = window.__mentorapm && window.__mentorapm.shortVersion;\n"
            "if (!v || !String(v).trim()) return false;\n"
            "// and the DOM must actually be showing that value, not just the prefix\n"
            "return (document.body.innerText || '').includes('Version: ' + v);",
            timeout=30),
        step("pressKey", "Close the menu", {"value": "Escape"}),

        # ---- crew shortcut: the second entry point to RoleSelection
        step("assertElementPresent", "CREW SHORTCUT: the crew label is rendered",
             {"element": xpath_el(HOME, CREW_SPAN)}, timeout=30),
        step("click", "Click the crew label beside the logo",
             {"element": xpath_el(HOME, CREW_SPAN)}, timeout=30),
        step("wait", "Wait for the RoleSelection modal", {"value": 3}),
        step("assertPageContains",
             "PROOF: the crew shortcut opens the same RoleSelection modal as the menu",
             {"value": "Submit"}),
        step("pressKey", "Dismiss the modal without submitting — nothing changes",
             {"value": "Escape"}, always=True),
        step("wait", "Let the modal close", {"value": 2}, always=True),
        step("assertElementPresent", "RESTORED: back on Home with the header intact",
             {"element": xpath_el(HOME, icon("wifi"))}, timeout=30, always=True),
    ],
    ["Mobile", "env:dev", "Menu", "read-only"],
))

# ---------------------------------------------------------------- wire into MOB.992
suite_path = os.path.join(HERE, "MOB.992_Menu_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
CHILD = "MOB.470_Header_Status_Icons"
if CHILD not in [s.get("name") for s in steps]:
    steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                  "isCritical": True, "name": CHILD, "noScreenshot": False,
                  "type": "playSubTest",
                  "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"added {CHILD} to MOB.992_Menu_Suite")

print("wrote MOB.470 (header status icons)")
