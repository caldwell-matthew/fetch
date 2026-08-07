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

HOME = BASE + "/"
BURGER = '//button[@aria-label="Toggle navigation"]'
SWITCH_CREWS = '//button[.//div[normalize-space(.)="Switch Crews"]]'
SUBMIT = '//button[normalize-space(.)="Submit"]'
CANCEL = '//button[normalize-space(.)="Cancel"]'
HOME_CREW, OTHER_CREW = "Admin", "Operator"


def radio(label):
    # Mantine Radio renders a visible <label>; match on contained text (roles may carry
    # prefixes/suffixes, same lesson as the emoji-prefixed workflow name).
    return f'//label[contains(normalize-space(.), "{label}")]'


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
    [
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
))

# ---------------------------------------------------------------- harden MOB.300
# ALREADY APPLIED - this block is one-shot and is now disabled. It mutated
# MOB.300_Work_Create.json through a raw open(...,"w"), bypassing dd_tools.write()'s
# overwrite guard, and re-running it appended the same note to the message a second time.
# The change it makes (modal-closed assertion critical, toast optional) is already baked
# into the JSON, which is the source of truth. Re-enable only if you know why.
if os.environ.get("DD_FORCE") != "1":
    print("SKIP  MOB.300 hardening - already applied (set DD_FORCE=1 to re-run)")
    raise SystemExit(0)

p = os.path.join(HERE, "MOB.300_Work_Create.json")
d = json.load(open(p))
steps = d["details"]["steps"]
for s in steps:
    if s["type"] == "assertPageContains" and "success toast" in s["name"]:
        s["allowFailure"] = True
        s["isCritical"] = False
        s["name"] = "Test success toast (optional: transient, autoClose 5000)"
if not any("modal closed" in s["name"] for s in steps):
    idx = next(i for i, s in enumerate(steps) if s["type"] == "wait") + 1
    idx = max(i for i, s in enumerate(steps) if s["type"] == "wait") + 1
    steps.insert(idx, step(
        "assertPageLacks",
        "Test create modal closed (durable success signal)",
        {"value": "Creating New Work Order"}))
d["details"]["message"] += (
    "\n- Success is asserted by the create modal closing, which is durable; the toast\n"
    "  check is optional because ToastContainer autoCloses it after 5s.")
with open(p, "w") as f:
    f.write(json.dumps(d, indent=4))

print("rebuilt MOB.200 with Admin -> Operator -> Admin revert")
print("hardened MOB.300: modal-closed assertion critical, toast optional")
