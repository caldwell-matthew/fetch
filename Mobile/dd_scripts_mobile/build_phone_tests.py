"""Build the PHONE-WIDTH suite - MOB.951, MOB.952 and MOB.984_Phone_Suite, on `chrome.mobile_small`
only (checklist T1.4, 🔴 HARNESS "the phone-width form branch").

WHY THIS DOES NOT BREAK TRAP 1
  Trap 1 forbids a SECOND device on a test: Datadog runs each device_id as a CONCURRENT session and
  two sessions raced on the fixture work order. These tests have ONE device (`chrome.mobile_small`),
  are READ-ONLY, and live in their own suite - run it on its own, never alongside a tablet suite
  that mutates. `set_device.py` pins every other test to `chrome.tablet` and these to phone.
  Children run in their parent's browser, so the SUITE's device is the one that counts; the
  children carry it too so a standalone run is honest. `verify.py` cannot prove them (its
  scratch wrapper is tablet) - run the suite: `dd_tools.py run MOB.984_Phone_Suite` (3 runs).

⚠️ FIRST RUN IS A PROBE. When the suite ran both devices, the phone session "kept dying at login".
  The login prefix is shared; if it dies there again, the fault is the prefix at phone width.

MOB.951 - the phone FORM branch (`WorkOrders/components/Forms/FormDetails.tsx:107-151`)
  `const [wideScreen] = useState(() => window.screen.availWidth >= 750)` picks the DESKTOP form
  (`#apm-dv-tabpanel`, MOB.355) at >= 750 and the MOBILE form (`#senor-work-form`, which is where
  `MobileSignatureField` renders) below. `chrome.tablet` always takes the desktop branch, so the
  mobile form had never rendered in a run. MOB.355's route, the opposite branch asserted.

MOB.952 - the header and the list at phone width
  T1.4: the work list's search control, the affixed `+` and the burger are on screen. BY DESIGN the
  header crew shortcut `.mobile-crew` is `display:none` under 450px (`index.css`, since it was added -
  no room beside the logo, icons and burger); crew switching at phone width is the burger's `Switch
  Crews` item, which the shared login prefix already opens to read the role. `optional`: a design
  change should not turn this red. Common phones are 393-430px wide, so the shortcut shows only on
  tablets and in landscape - a product call, not a defect.

🛑 READ-ONLY: nothing is typed into a form, nothing is submitted.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

PHONE = ["chrome.mobile_small"]
WORK_URL = BASE + "/work"
WO_URL = f"{BASE}/work/EYRpYJ9QYdQ1JFF10JtB0Q"
PANEL = '//*[@role="tabpanel"][not(contains(@style, "display: none"))]'
FORM_CARD = (f'({PANEL}//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")]'
             '[.//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]])[1]')
AFFIX_PLUS = ('//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]'
              '//button')


def on_phone(t):
    t["details"]["options"]["device_ids"] = list(PHONE)
    return t


DEVICE_JS = "const w = window.screen.availWidth;\n"
IN_VIEW = ("const inView = el => { if (!el) return false; const r = el.getBoundingClientRect();\n"
           "  return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= window.innerWidth + 1\n"
           "    && r.top >= 0 && r.bottom <= window.innerHeight + 1; };\n")

# ----------------------------------------------------------------------------------- MOB.951
m951 = [
    go(WORK_URL, "/work — warm the work lookup cache"),
    step("wait", "Let the work list begin rendering", {"value": 3}),
    step("assertPageContains", 'The "Work Orders" page mounted', {"value": "Work Orders"}, timeout=30),
    step("wait", "Let the lookup prefetch run", {"value": 30}),
    go(WO_URL, "the fixture work order"),
    step("wait", "Let the detail view begin rendering", {"value": 3}),
    step("assertElementPresent", "GATE: the detail data arrived (tab strip)",
         {"element": xpath_el(WO_URL, '(//*[@role="tab"])[1]')}, timeout=30),
    jsassert("DEVICE: this session is PHONE width — `screen.availWidth` < 750 (the form's threshold)",
             DEVICE_JS + "return w > 0 && w < 750;", timeout=15),
    step("click", "Open the Forms tab",
         {"element": xpath_el(WO_URL, '//*[@role="tab"][contains(normalize-space(.), "Form")]')}, timeout=30),
    step("wait", "Wait for the forms list", {"value": 3}),
    step("assertElementPresent", "FIXTURE GUARD: the work order has at least one form card",
         {"element": xpath_el(WO_URL, FORM_CARD)}, timeout=30),
    step("click", "Open the first form card", {"element": xpath_el(WO_URL, FORM_CARD)}, timeout=30),
    step("wait", "Let the form page render", {"value": 4}),
    jsassert("ROUTE: we are on /work/<id>/form/<id>",
             "return /\\/work\\/[^/]+\\/form\\/[^/]+$/.test(location.pathname);", timeout=30),
    jsassert("⭐ THE MOBILE FORM BRANCH: `#senor-work-form` rendered, and the desktop `#apm-dv-tabpanel` "
             "did NOT (`FormDetails.tsx`, `availWidth < 750`)",
             "return !!document.getElementById('senor-work-form') && !document.getElementById('apm-dv-tabpanel');",
             timeout=30),
]
write(on_phone(test(
    "MOB.951_Phone_Form_Branch",
    "`MOB.951` **PHONE WIDTH — a work form renders its MOBILE branch.**\n"
    "- `FormDetails.tsx` picks the desktop form at `screen.availWidth >= 750` (MOB.355, on tablet)\n"
    "  and `#senor-work-form` below it — where `MobileSignatureField` lives. No tablet run can\n"
    "  reach it (trap 1).\n"
    "- `chrome.mobile_small` ONLY; runs inside `MOB.984_Phone_Suite`. 🛑 READ-ONLY.",
    m951,
    ["Mobile", "env:dev", "Phone", "Work Order", "Forms", "read-only"],
)))

# ----------------------------------------------------------------------------------- MOB.952
m952 = [
    go(WORK_URL, "the work list"),
    step("wait", "Let the work list render", {"value": 10}),
    step("assertPageContains", 'The "Work Orders" page mounted', {"value": "Work Orders"}, timeout=30),
    jsassert("DEVICE: PHONE width (`availWidth` < 450 — under the crew shortcut's breakpoint too)",
             DEVICE_JS + "return w > 0 && w < 450;", timeout=15),
    jsassert("⭐ The affixed `+` (create work order) is ON SCREEN at phone width",
             IN_VIEW + "const b = document.querySelector('[class*=\"mantine-Affix-root\"] button');\n"
             "return inView(b);", timeout=30),
    jsassert("⭐ The work list's search control is ON SCREEN at phone width",
             # the list's own SearchInput (`WorkOrders/index.tsx:237`) - the locator MOB.150/341/342 use.
             # Run 1 guessed `input[type=search]`/aria-label and read nothing (trap 15: measure, never derive)
             IN_VIEW + "return inView(document.querySelector('input[placeholder=\"Find Workstage(s)\"]'));",
             soft=True, timeout=30),
    jsassert("BY DESIGN: the header crew shortcut `.mobile-crew` exists but is hidden under 450px — the "
             "burger's `Switch Crews` is the phone path (optional)",
             "const c = document.querySelector('.mobile-crew');\n"
             "return !!c && getComputedStyle(c).display === 'none';", optional=True, timeout=15),
    jsassert("The header itself rendered at phone width (the burger is on screen)",
             IN_VIEW + "return inView(document.querySelector('button[aria-label=\"Toggle navigation\"]'));",
             timeout=15),
]
write(on_phone(test(
    "MOB.952_Phone_Header_And_List",
    "`MOB.952` **PHONE WIDTH — the header and the work list.**\n"
    "- The affixed `+` and the list's search control are on screen; the burger is on screen.\n"
    "- By design the header crew shortcut `.mobile-crew` is hidden under 450px; the burger's\n"
    "  `Switch Crews` is the phone path (optional check — a design change should not go red).\n"
    "- `chrome.mobile_small` ONLY; runs inside `MOB.984_Phone_Suite`. 🛑 READ-ONLY.",
    m952,
    ["Mobile", "env:dev", "Phone", "Work Order", "read-only"],
)))

# ----------------------------------------------------------------------------------- MOB.984
import json  # noqa: E402
HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dd_tests_mobile")
login_steps = json.load(open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]
write(on_phone(test(
    "MOB.984_Phone_Suite",
    "`MOB.984` **The PHONE-WIDTH suite** — `chrome.mobile_small` only, READ-ONLY.\n"
    "- Logs in once, then chains its subtests in the same browser session.\n"
    "- Run it ON ITS OWN (trap 1: never alongside a mutating tablet suite).\n"
    "- subtestPublicId values stay PENDING-WIRE-UP until the children exist on Datadog;\n"
    "  run wire_suite.py after pushing them.",
    login_steps + [step("playSubTest", c, {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1})
                   for c in ("MOB.951_Phone_Form_Branch", "MOB.952_Phone_Header_And_List")],
    ["Mobile", "env:dev", "Phone", "suite", "read-only"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
)))
print("wrote MOB.951, MOB.952 and MOB.984_Phone_Suite (chrome.mobile_small)")
