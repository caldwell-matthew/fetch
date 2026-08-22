"""Build MOB.997_Session_Suite - T1.3 permissions and crew scoping.

THE ROLE NAMING IS THE FIXTURE
  This org has roles named `Admin <CRUD>` where each digit is a permission flag in
  Create/Read/Update/Delete order - so `Admin (1000)` is create-only and `Admin (0000)` has
  nothing. That gives us, for free, the thing a gating test needs and usually cannot get:
  a role that genuinely LACKS read.

  Naming is consistent - always `Admin (####)` with parentheses. Locators still match on the
  DIGITS (`contains(., "0000")`) rather than the full string, because the digits are the part
  that carries the meaning and the match survives the role being renamed around them.
  Restoring to plain `Admin` DOES use an exact match, precisely so it cannot land on
  `Admin (0000)`.

WHY THIS IS SAFE TO RUN
  Switching crew is a user-level change, so a test that failed halfway would leave the
  session on the wrong role and break every other suite (they all assert the role is exactly
  `Admin`). Two things make it safe:
    - `Switch Crews` has NO permission gate (TopHeader/index.tsx:61), so even a role with no
      read at all can switch back.
    - The restore leg is CRITICAL and asserts the role afterwards.

  Still: do not run this suite concurrently with another. Crew is shared session state, the
  same hazard as trap 1.

FIXING WHAT MOB.200 DOES NOT PROVE
  MOB.200 marks "Select Operator" and "Submit crew change" as `optional`, and asserts nothing
  about the crew afterwards. If the option is not found both steps skip silently and the test
  still passes, having restored Admin to Admin. Here every switch is critical and is followed
  by an assertion on the role label under "Switch Crews", so a switch that did not happen
  fails loudly (trap 5).
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write, jsassert  # noqa: E402

HOME = BASE + "/"
JOBS_URL = BASE + "/asset-verify"
FIXTURE_JOB = "DATADOG MOBILE JOB"
TAGS = ["Mobile", "env:dev", "Session", "permissions"]

BURGER = '//button[@aria-label="Toggle navigation"]'
SWITCH_CREWS = '//button[.//div[normalize-space(.)="Switch Crews"]]'
SUBMIT = '//button[normalize-space(.)="Submit"]'
WORK_MENU_ITEM = "Work Orders"

NO_READ = "0000"     # Create/Read/Update/Delete all off -> every gated menu item hidden
READ_ONLY = "0100"   # read on, so lists still load - isolates CREW SCOPING from permissions

# ---------------------------------------------------------------- home tiles (added 2026-08-18)
# The SAME six permissions gate the hamburger menu AND the six tiles on `routing/Home.tsx`.
# MOB.210 already lands on the home page three times and asserted nothing about it, so the
# tile checks below cost a handful of steps and take gating coverage from ONE gate to SEVEN.
#
# Locate tiles by their icon ALT, never by their title text. Home's `Link` renders
# `<img alt="icon for {title} url">`; the menu renders the same six titles with an `<img>`
# that has NO alt. A text match would therefore pass with every tile missing (trap 5b) -
# and it is the menu that MOB.210 has open two lines earlier.
HOME_TILES = ["Asset Collector / Lens", "Mobile Jobs", "Asset Lookup",
              "Material Lookup", "Work Orders", "The Map"]
TILE_SEL = 'img[alt^="icon for "]'


def tiles_present(n):
    """Datadog has no assertElementAbsent, and the alt text is an ATTRIBUTE rather than page
    text (trap 9), so tile counting is a JS step in both directions."""
    return jsassert(
        f"HOME TILES: exactly {n} permission-gated tile(s) rendered",
        f"return document.querySelectorAll('{TILE_SEL}').length === {n};",
        timeout=30)


def role_option(digits=None, exact=None):
    """Pick a role in the crew switcher.

    digits -> match on the CRUD digits, the digits carry the meaning.
    exact  -> exact text, used only for plain `Admin` so it cannot match `Admin (0000)`.
    """
    if exact:
        return f'//label[normalize-space(.)="{exact}"]'
    return f'//label[contains(normalize-space(.), "{digits}")]'


def switch_to(label, locator):
    return [
        step("click", "Open the header menu", {"element": xpath_el(HOME, BURGER)}),
        step("click", "Click Switch Crews", {"element": xpath_el(HOME, SWITCH_CREWS)}),
        step("wait", "Wait for the crew list", {"value": 2}),
        step("click", f"Select {label}", {"element": xpath_el(HOME, locator)}),
        step("click", "Submit the crew change", {"element": xpath_el(HOME, SUBMIT)}),
        step("wait", "Wait for the crew change to resync", {"value": 8}),
    ]


def assert_role(contains):
    """The current role renders under "Switch Crews" in the menu, so opening the burger and
    asserting on it is how we prove a switch actually took effect."""
    return [
        step("click", "Open the menu to read the session role",
             {"element": xpath_el(HOME, BURGER)}),
        step("wait", "Wait for the menu", {"value": 2}),
        step("assertPageContains", f'Role is now "{contains}"', {"value": contains}),
    ]


# ---------------------------------------------------------------- menu gating
write(test(
    "MOB.210_Perms_Menu_Gating",
    "`MOB.210` Prove the hamburger menu is gated by role permissions.\n"
    "- SELF-RESTORING: switches to a no-permission role and back to `Admin`.\n"
    f"- Uses `Admin {NO_READ}` — CRUD all off, so `!permissions.*.read` hides **all six**\n"
    "  gated menu items at once (Collector, Mobile Jobs, Asset Lookup, Material Lookup,\n"
    "  Work Orders, Map).\n"
    "- **Covers the six HOME TILES as well as the menu** (added 2026-08-18). The same six\n"
    "  permissions gate both, and this test already landed on Home three times without\n"
    "  asserting anything about it — so gating coverage went from ONE gate to SEVEN for a\n"
    "  handful of steps.\n"
    "- Tiles are counted via JS on `img[alt^=\"icon for \"]`, because Datadog has no\n"
    "  `assertElementAbsent` and the alt text is an attribute, not page text (trap 9).\n"
    "  The menu's own icons carry no `alt`, so the count cannot pick them up — and every\n"
    "  tile assertion runs with the menu CLOSED (trap 5b).\n"
    "- `No valid permissions` is the POSITIVE half of the proof: six absence checks would\n"
    "  pass on a blank page too (trap 5).\n"
    "- The PROOF is the negative: `Work Orders` must vanish from the menu. Asserting the\n"
    "  items are present under `Admin` proves nothing on its own — they are always present\n"
    "  there (trap 5).\n"
    "- Every switch is critical and followed by a role assertion, unlike MOB.200 where the\n"
    "  outbound switch is optional and unverified.\n"
    "- Navigates home first: `Work Orders` appears as a PAGE TITLE on /work, which would\n"
    "  satisfy the assertion without the menu item existing (trap 5b).",
    [
        go(HOME, "the mobile home page"),
        step("wait", "Wait for the app shell", {"value": 5}),
    ] + assert_role("Admin") + [
        step("assertPageContains", f'Baseline: "{WORK_MENU_ITEM}" is in the menu under Admin',
             {"value": WORK_MENU_ITEM}),
        step("pressKey", "Close the menu", {"value": "Escape"}),
        # Menu CLOSED from here on - Mantine unmounts Menu.Dropdown, so nothing below can be
        # satisfied by the menu items echoing the same six titles.
        tiles_present(len(HOME_TILES)),
        step("assertElementPresent",
             f'Baseline: the "{WORK_MENU_ITEM}" home TILE is present under Admin',
             {"element": xpath_el(HOME, f'//img[@alt="icon for {WORK_MENU_ITEM} url"]')},
             timeout=30),
    ] + switch_to(f"Admin {NO_READ}", role_option(digits=NO_READ)) + [
        go(HOME, "the mobile home page"),
        step("wait", "Wait for the app shell", {"value": 5}),
    ] + assert_role(NO_READ) + [
        step("assertPageLacks",
             f'PROOF: "{WORK_MENU_ITEM}" is hidden without read permission',
             {"value": WORK_MENU_ITEM}),
        step("pressKey", "Close the menu", {"value": "Escape"}),
        # The POSITIVE half of the gating proof. Six absence checks would all pass on a
        # blank page too; this one fails loudly if Home rendered nothing at all (trap 5).
        step("assertPageContains",
             'PROOF: Home falls through to its "No valid permissions" empty state',
             {"value": "No valid permissions"}),
        tiles_present(0),
    ] + switch_to("Admin (restore)", role_option(exact="Admin")) + [
        go(HOME, "the mobile home page"),
        step("wait", "Wait for the app shell", {"value": 5}),
    ] + assert_role("Admin") + [
        step("assertPageContains", f'RESTORED: "{WORK_MENU_ITEM}" is back in the menu',
             {"value": WORK_MENU_ITEM}),
        step("pressKey", "Close the menu", {"value": "Escape"}),
        tiles_present(len(HOME_TILES)),
        step("assertPageLacks", 'RESTORED: the empty state is gone',
             {"value": "No valid permissions"}),
    ],
    TAGS + ["CRUD"],
))

# ---------------------------------------------------------------- crew scoping
write(test(
    "MOB.220_Crew_Scoping",
    "`MOB.220` Prove switching crew changes the visible mobile-job set.\n"
    "- SELF-RESTORING: switches crew and back to `Admin`.\n"
    f"- Uses `Admin {READ_ONLY}` — read is ON, so the job list still loads. That isolates\n"
    "  CREW SCOPING from permissions: if the fixture job disappears here it is because the\n"
    f"  crew changed, not because the role cannot read. Using `Admin {NO_READ}` would\n"
    "  confound the two.\n"
    f"- The PROOF is the negative: `{FIXTURE_JOB}` is listed under `Admin` and must NOT be\n"
    "  listed under another crew, because `mobileJobsForCrew` scopes by the session crew.\n"
    "- A crew is a role in MentorTwo, so switching role IS switching crew.",
    [
        go(JOBS_URL, "the mobile job list"),
        step("wait", "Wait for the job list", {"value": 25}),
        step("assertPageContains", f'Baseline: "{FIXTURE_JOB}" is visible under Admin',
             {"value": FIXTURE_JOB}),
    ] + switch_to(f"Admin {READ_ONLY}", role_option(digits=READ_ONLY)) + [
        go(JOBS_URL, "the mobile job list"),
        step("wait", "Wait for the job list to reload for the new crew", {"value": 25}),
        step("assertPageLacks", f'PROOF: "{FIXTURE_JOB}" is not visible to another crew',
             {"value": FIXTURE_JOB}),
    ] + switch_to("Admin (restore)", role_option(exact="Admin")) + [
        go(JOBS_URL, "the mobile job list"),
        step("wait", "Wait for the job list to reload", {"value": 25}),
        step("assertPageContains", f'RESTORED: "{FIXTURE_JOB}" is visible again',
             {"value": FIXTURE_JOB}),
    ],
    TAGS + ["CRUD"],
))

# ---------------------------------------------------------------- suite
login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]

write(test(
    "MOB.997_Session_Suite",
    "Session, permissions and crew scoping (T1.3).\n"
    "- MUTATES the session crew, but **self-restoring**: every subtest returns to `Admin`\n"
    "  with a critical step and asserts it.\n"
    "- ⚠️ Do NOT run concurrently with another suite. Crew is shared session state and every\n"
    "  other suite asserts the role is exactly `Admin` — the same class of hazard as trap 1.\n"
    "- If this suite fails midway, check the session crew before rerunning anything else.\n"
    "- subtestPublicId values stay PENDING-WIRE-UP until the children exist on Datadog;\n"
    "  run wire_suite.py after pushing them.",
    login_steps + [step("playSubTest", c,
                        {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1})
                   for c in ["MOB.210_Perms_Menu_Gating", "MOB.220_Crew_Scoping"]],
    ["Mobile", "env:dev", "Session", "suite"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))

print("wrote MOB.210 (menu gating), MOB.220 (crew scoping), MOB.997 (suite)")
