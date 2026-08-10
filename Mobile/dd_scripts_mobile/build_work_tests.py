"""Build the Work Order read/status tests (MOB.310, MOB.320) against a fixed fixture.

FIXTURE: workStageId EYRpYJ9QYdQ1JFF10JtB0Q - a throwaway work order we may mutate.

Why a deep link rather than list navigation: WorkStageDetails reads workStageId from
useParams() and runs MOBILE_WORK_ORDER_DETAILS with { id }, a self-contained query that
never consults the crew's stage list. Navigating straight to /work/<id> therefore drops
all of these, each of which has already cost us a failed run:
  - the wait for loadedAll (WorkListItem.onClick is inert until the list downloads)
  - the Virtuoso (//*[@data-index])[1] row locator
  - "whichever work order happens to be first"
  - the crew-scoped list (workStages(crew: '<SESSION>')), which is what broke MOB.140

STATUS MATRIX (MOB.320): walks the six statuses from the checklist and finishes on Ready,
so the fixture always ends in the same known state and the test is repeatable.

  Pending -> In Progress -> On Hold -> Complete -> Canceled -> Ready

  StatusMenuIcon filters the CURRENT status out of its menu, so "Mark as X" is absent
  whenever the record already is X. Consecutive steps never repeat a status, so every
  transition after the first is deterministic. Only the FIRST leg is optional, to cover
  the case where a previous run left the record on Pending - and its assertion still
  holds in that case, because the status is Pending either way.

  Caveat: the "Complete" assertion uses contains(), which would also match "Not Completed".
  We never set Not Completed, so it is unambiguous in this sequence - do not add it
  without tightening that assertion.

There are no status-notes steps: the fixture template's requireStatusNotes is confirmed
false (see the note beside STATUS_SEQUENCE). That removed 12 optional steps, one of which
was actively clicking the wrong button.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write  # noqa: E402

FIXTURE_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
STAGE_URL = f"{BASE}/work/{FIXTURE_ID}"
STATUS_TARGET = '//span[contains(normalize-space(.), "Status:")]'
TAGS = ["Mobile", "env:dev", "Work Order", "CRUD"]

# The status-notes branch was REMOVED, confirmed empirically from a MOB.991 run:
#   - every "Fill status notes" step failed with
#     `No element found using locator: //*[@id="statusNotes"]`
#     => this fixture's work template does NOT set requireStatusNotes; the modal never opens.
#   - but the paired "Submit status notes" step PASSED every time, because
#     //button[normalize-space(.)="Submit"] matched some OTHER Submit control on the work
#     order detail page and clicked it - 6 times per run, unintentionally.
# An optional step that "passes" by hitting the wrong element is the exact failure mode
# optional steps invite. If a template requiring status notes is ever used here, re-add
# these steps but scope the Submit locator to the modal instead of the whole page.

# Ends on Ready so the fixture is always left in a known state.
STATUS_SEQUENCE = ["Pending", "In Progress", "On Hold", "Complete", "Canceled", "Ready"]


def transition(label, first=False):
    """One status change: open menu -> pick status -> settle -> verify."""
    return [
        step("click", f"Open the status menu (-> {label})",
             {"element": xpath_el(STAGE_URL, STATUS_TARGET)}),
        step("click", f"Mark as {label}" + (" (optional: may already be set)" if first else ""),
             {"element": xpath_el(STAGE_URL,
                 f'//button[starts-with(normalize-space(.), "Mark as {label}")]')},
             optional=first),
        step("wait", f"Wait for the status mutation (-> {label})", {"value": 3}),
        step("assertElementContent", f'Test status is now "{label}"',
             {"check": "contains", "value": label,
              "element": xpath_el(STAGE_URL, STATUS_TARGET)}),
    ]


write(test(
    "MOB.310_Work_Read",
    "`MOB.310` Open the fixture work order directly.\n"
    f"- Deep links to /work/{FIXTURE_ID}; no list traversal, no crew dependency.\n"
    "- Asserts the detail view rendered via StageStatusIcon's 'Status:' label.\n"
    "- If this fails with an empty page, check the fixture's workflow has a mobile\n"
    "  template: WorkDetails returns null when template is missing.\n"
    "- Read-only: no mutations.",
    [
        go(STAGE_URL, "the fixture work order"),
        step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}),
        step("assertElementPresent", "Test status control is present",
             {"element": xpath_el(STAGE_URL, STATUS_TARGET)}),
    ],
    TAGS,
))

steps = [go(STAGE_URL, "the fixture work order"),
         step("assertPageContains", "Test work order detail rendered", {"value": "Status:"})]
for i, label in enumerate(STATUS_SEQUENCE):
    steps += transition(label, first=(i == 0))

write(test(
    "MOB.320_Work_Status_Update",
    "`MOB.320` Walk the fixture work order through all six statuses, ending on Ready.\n"
    f"- Sequence: {' -> '.join(STATUS_SEQUENCE)}\n"
    "- Always ENDS ON Ready, so the fixture is left in a known state and the test is\n"
    "  repeatable. Each transition is verified against the status badge, not just the\n"
    "  toast, so a silently-failed mutation is caught.\n"
    "- Only the first leg is optional: StatusMenuIcon hides the CURRENT status, so\n"
    "  'Mark as Pending' is absent if a previous run left it there. Its assertion still\n"
    "  holds in that case.\n"
    f"- MUTATES the fixture ({FIXTURE_ID}) only - never real assigned work.\n"
    "- No status-notes steps: confirmed empirically that this fixture template does not\n"
    "  set requireStatusNotes. See the note in this build script before re-adding them.",
    steps,
    TAGS,
))

print(f"wrote MOB.310_Work_Read and MOB.320_Work_Status_Update "
      f"({len(STATUS_SEQUENCE)} transitions, {len(steps)} steps)")
