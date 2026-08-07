"""Build the hamburger-menu tests (MOB.4xx) - checklist section 3.

Verified against client/mobile/components/Layout/TopHeader/index.tsx:
  - Menu.Target is a Mantine <Burger aria-label="Toggle navigation" /> - width-independent,
    unlike span.mobile-crew which is display:none below 450px.
  - Menu.Item renders as a button; items are: ReSync, Transaction Log, Dev Logs (hidden
    unless env is development/development2), Switch Crews, a divider, the permission-gated
    route items, Log Out, and a disabled "Version: ..." entry.
  - ReSync is disabled when offline; Synthetics always runs online so it is clickable.
  - Both the crew and logout modals are opened with `withCloseButton: false`, so there is
    NO X control on either. Dismissal is via their own buttons (Cancel / Take Me Back) or
    click-outside (useModal leaves closeOnClickOutside at Mantine's default).
  - LogoutModal text: "Are you sure you want to log out?", buttons "Take Me Back" and
    "Log Out". Confirming clears the Apollo store, wipes the persisted transaction queues
    and redirects to /login?src=mobile - so MOB.440 is standalone and ends the session.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, HERE  # noqa: E402

HOME = BASE + "/"
BURGER = '//button[@aria-label="Toggle navigation"]'
TAGS = ["Mobile", "env:dev", "Menu"]


def item(label):
    """A Mantine Menu.Item button carrying this label."""
    return f'//button[normalize-space(.)="{label}"]'


def open_menu(n=""):
    suffix = f" ({n})" if n else ""
    return step("click", f"Open the hamburger menu{suffix}", {"element": xpath_el(HOME, BURGER)})


# ---------------------------------------------------------------- open / close
write(test(
    "MOB.400_Menu_Open_Close",
    "`MOB.400` Hamburger menu opens and closes.\n"
    "- Asserts the always-present items render (ReSync / Switch Crews / Log Out), then\n"
    "  closes with Escape and asserts the dropdown is gone.\n"
    "- Route items are permission-gated so they are deliberately not asserted here.\n"
    "- Read-only.",
    [
        go("{{ MOBDEV }}", "mobile home"),
        open_menu(),
        step("assertPageContains", "Test ReSync item is listed", {"value": "ReSync"}),
        step("assertPageContains", "Test Switch Crews item is listed", {"value": "Switch Crews"}),
        step("assertPageContains", "Test Log Out item is listed", {"value": "Log Out"}),
        step("pressKey", "Close the menu with Escape", {"value": "Escape"}),
        step("assertPageLacks", "Test menu closed", {"value": "Switch Crews"}),
    ],
    TAGS,
))

# ---------------------------------------------------------------- resync
write(test(
    "MOB.410_Menu_Resync",
    "`MOB.410` ReSync from the hamburger menu.\n"
    "- ReSync refetches and rebuilds the cache; asserting the shell survives is the\n"
    "  meaningful check, since there is no completion toast.\n"
    "- The item is disabled when offline (window.navigator.onLine); Synthetics is online.\n"
    "- Read-only from the user's perspective (no records change).",
    [
        go("{{ MOBDEV }}", "mobile home"),
        open_menu(),
        step("click", "Click ReSync", {"element": xpath_el(HOME, item("ReSync"))}),
        step("wait", "Wait for the resync to complete", {"value": 10}),
        step("assertElementPresent", "Test app shell survived the resync",
             {"element": xpath_el(HOME, BURGER)}),
    ],
    TAGS,
))

# ---------------------------------------------------------------- transaction log
TX_URL = BASE + "/transactions"
write(test(
    "MOB.420_Menu_Transaction_Log",
    "`MOB.420` Reach the Transaction Log through the hamburger menu.\n"
    "- Complements MOB.130, which deep-links to /transactions directly; this proves the\n"
    "  menu route actually navigates.\n"
    "- Read-only.",
    [
        go("{{ MOBDEV }}", "mobile home"),
        open_menu(),
        step("click", "Click Transaction Log",
             {"element": xpath_el(HOME, item("Transaction Log"))}),
        step("assertElementContent", 'Test page title "Transaction Log"',
             {"check": "contains", "value": "Transaction Log",
              "element": xpath_el(TX_URL,
                  '//*[@id="page-title"]//h4[contains(normalize-space(.), "Transaction Log")]')}),
    ],
    TAGS,
))

# ---------------------------------------------------------------- crew modal dismissal
write(test(
    "MOB.430_Crew_Modal_Dismiss",
    "`MOB.430` Crew switcher can be opened and dismissed without changing crew.\n"
    "- NON-MUTATING counterpart to MOB.200: opens the modal, asserts it, clicks Cancel,\n"
    "  and asserts it closed. No CHANGE_SESSION_ROLE is fired.\n"
    "- NOTE: the checklist's 'Switch Crews - Close button' item does not exist. The modal\n"
    "  is opened with withCloseButton: false, so Cancel (or click-outside) is the only\n"
    "  dismissal path.",
    [
        go("{{ MOBDEV }}", "mobile home"),
        open_menu(),
        step("click", "Click Switch Crews",
             {"element": xpath_el(HOME, '//button[.//div[normalize-space(.)="Switch Crews"]]')}),
        step("assertPageContains", "Test crew switcher opened", {"value": "Switch Crew"}),
        step("assertPageContains", "Test current-crew label is shown",
             {"value": "Currently logged in as"}),
        step("click", "Dismiss with Cancel",
             {"element": xpath_el(HOME, '//button[normalize-space(.)="Cancel"]')}),
        step("assertPageLacks", "Test crew switcher closed",
             {"value": "Currently logged in as"}),
    ],
    TAGS + ["Crew"],
))

# ---------------------------------------------------------------- logout
login_steps = json.load(open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]
LOGIN_URL = "https://dev.mentorapm.com/login"
write(test(
    "MOB.440_Logout",
    "`MOB.440` Log out, including the 'Take Me Back' escape hatch.\n"
    "- Self-contained (own login steps) and deliberately NOT part of any suite: confirming\n"
    "  logout clears the Apollo store, wipes persisted transaction queues and redirects to\n"
    "  /login?src=mobile, which would break every subsequent subtest.\n"
    "- Order matters: the non-destructive 'Take Me Back' path is exercised first, then the\n"
    "  real logout last.\n"
    "- Ends the session by design; nothing may follow it.",
    login_steps + [
        open_menu(1),
        step("click", "Click Log Out", {"element": xpath_el(HOME, item("Log Out"))}),
        step("assertPageContains", "Test logout confirmation shown",
             {"value": "Are you sure you want to log out?"}),
        # --- escape hatch: back out without logging out ---
        step("click", "Click Take Me Back",
             {"element": xpath_el(HOME, item("Take Me Back"))}),
        step("assertPageLacks", "Test logout cancelled",
             {"value": "Are you sure you want to log out?"}),
        step("assertElementPresent", "Test still signed in",
             {"element": xpath_el(HOME, BURGER)}),
        # --- now really log out ---
        open_menu(2),
        step("click", "Click Log Out again", {"element": xpath_el(HOME, item("Log Out"))}),
        step("click", "Confirm logout", {"element": xpath_el(HOME, item("Log Out"))}),
        step("wait", "Wait for the redirect to /login", {"value": 5}),
        step("assertElementPresent", "Test returned to the login page",
             {"element": xpath_el(LOGIN_URL, '//input[@name="email"]')}),
    ],
    TAGS + ["Login"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))

print("wrote MOB.400, MOB.410, MOB.420, MOB.430 (suite-safe) and MOB.440 (standalone)")
