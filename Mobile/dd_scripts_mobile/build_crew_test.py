"""Rebuild MOB.200_Crew_Switch as a reverting A->B->A test, and harden MOB.300.

CREW REVERT (Admin -> Operator -> Admin)
  RoleSelection disables Submit when the selected role IS the current role
  (`disabled={currRole?.id === selectedRoleId || !isOnline}`), so a "normalise to Admin
  first" opener would click a dead button whenever we already are Admin. Instead the
  OUTBOUND leg (-> Operator) is optional and the RETURN leg (-> Admin) is critical:

    already Admin    -> outbound works, return works      -> ends Admin
    already Operator -> outbound fails (allowed), return works -> ends Admin

  Either way the run ends on Admin, so from the second run on it is a true A->B->A.
  Note Datadog cannot parameterise an XPath with an extracted variable, so a dynamic
  "restore whatever it was" is not expressible - fixed role names are the way to do it.

MOB.300 TOAST
  toast.success('Work order successfully created!') is transient (ToastContainer
  autoClose={5000}) and racing it is flaky. The durable signal that the submit landed is
  the create modal closing, so assert that critically and keep the toast as a bonus.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, HERE  # noqa: E402

# MOB.200 runs standalone (it is deliberately kept out of every suite because switching
# crews changes crew-scoped data other tests depend on), so it must carry its own login.
# Those steps are read from MOB.000 rather than hand-maintained here - previously they
# were bolted on by a one-off patch that lived only in the JSON, so regenerating this
# script silently produced a test that never logged in and failed on the first burger click.
LOGIN_STEPS = json.load(open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]
CREDS = ("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD")

HOME = BASE + "/"
BURGER = '//button[@aria-label="Toggle navigation"]'
SWITCH_CREWS = '//button[.//div[normalize-space(.)="Switch Crews"]]'
SUBMIT = '//button[normalize-space(.)="Submit"]'
CANCEL = '//button[normalize-space(.)="Cancel"]'
HOME_CREW, OTHER_CREW = "Admin", "Operator"


def radio(label):
    """Mantine Radio renders a visible <label>. Match EXACTLY, not with contains().

    The org has several roles whose names share a prefix - "Admin" and "Admin (0000)"
    both exist - so contains() can select the wrong one. That is not cosmetic: a Crew IS
    a Role in MentorTwo, and permissions are aggregated from the groups linked to that
    role, so landing on the wrong "Admin" silently changes the session's permission set.
    It is what made CreateWorkButton return null (no work.create) and MOB.300 fail with
    the affixed create button missing from the DOM.

    Note this is the opposite call from the workflow picker in build_work_tests.py, which
    needs contains() because its name carries an emoji prefix. Match exactly when names
    share prefixes; match loosely when the name is decorated.
    """
    return f'//label[normalize-space(.)="{label}"]'


def open_crew_modal(n):
    return [
        step("click", f"Open the header menu ({n})", {"element": xpath_el(HOME, BURGER)}),
        step("click", f'Click "Switch Crews" ({n})', {"element": xpath_el(HOME, SWITCH_CREWS)}),
    ]


write(test(
    "MOB.200_Crew_Switch",
    "`MOB.200` Switch crews and revert (Admin -> Operator -> Admin).\n"
    "- Always ENDS ON Admin, so the run is self-restoring and repeatable.\n"
    "- The outbound leg is optional: if the account is already on Operator, Submit is\n"
    "  disabled for the current role, and the critical return leg still lands on Admin.\n"
    "- Reached via the burger menu, not span.mobile-crew (that span is display:none\n"
    "  below 450px, so the menu path works at every viewport).\n"
    "- MUTATES then RESTORES: fires CHANGE_SESSION_ROLE twice.\n"
    "- Kept OUT of MOB.999: mobile jobs and work orders are crew-scoped, so running it\n"
    "  mid-suite changes the data other subtests depend on.",
    LOGIN_STEPS + [
        go("{{ MOBDEV }}", "mobile home"),
        *open_crew_modal(1),
        step("assertPageContains", "Test crew switcher opened", {"value": "Switch Crew"}),
        step("assertPageContains", "Test current-crew label is shown",
             {"value": "Currently logged in as"}),
        # ---- outbound: Admin -> Operator (optional; no-op if already on Operator) ----
        step("click", f'Select "{OTHER_CREW}" (optional)',
             {"element": xpath_el(HOME, radio(OTHER_CREW))}, optional=True),
        step("click", "Submit crew change (optional)",
             {"element": xpath_el(HOME, SUBMIT)}, optional=True),
        step("wait", "Wait for the crew change to resync", {"value": 3}),
        # If the outbound leg was skipped the modal is still open - close it so the
        # burger is clickable again. Fails harmlessly when the modal already closed.
        step("click", "Close the modal if still open (optional)",
             {"element": xpath_el(HOME, CANCEL)}, optional=True),
        # ---- return: -> Admin (critical; this is what guarantees the end state) ----
        *open_crew_modal(2),
        step("click", f'Select "{HOME_CREW}" to restore',
             {"element": xpath_el(HOME, radio(HOME_CREW))}),
        step("click", "Submit the restore", {"element": xpath_el(HOME, SUBMIT)}),
        step("wait", "Wait for the restore to resync", {"value": 3}),
        step("assertElementPresent", "Test app shell still rendered after restore",
             {"element": xpath_el(HOME, BURGER)}),
    ],
    ["Mobile", "env:dev", "Crew", "E2E"],
    extra_globals=CREDS,
))

# NOTE: a one-shot MOB.300 hardening block used to live here (modal-closed assertion
# critical, toast optional). It has been APPLIED and is now DELETED rather than guarded:
# it wrote MOB.300's JSON directly, bypassing dd_tools.write()'s overwrite guard, and
# every DD_FORCE=1 run appended the same paragraph to the test message again. The change
# lives in MOB.300_Work_Create.json, which is the source of truth.

print("rebuilt MOB.200 with login + Admin -> Operator -> Admin revert")
