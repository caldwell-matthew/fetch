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
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

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

# ALL EIGHT assignable statuses (WORK_STATUS_OPTIONS minus Superseded/Created, which the menu
# hides). Requested and Not Completed were offered and never clicked until 2026-09-11.
STATUS_SEQUENCE = ["Pending", "In Progress", "On Hold", "Requested", "Not Completed", "Complete",
                   "Canceled"]
# The badge is read EXACTLY: `contains "Complete"` would also pass on "Not Completed".
BADGE_JS = ("const span = [...document.querySelectorAll('span')]\n"
            "  .find(x => (x.textContent || '').trim().indexOf('Status:') === 0);\n"
            "const badge = span && span.querySelector('[class*=\"mantine-Badge\"]');\n"
            "const now = badge ? (badge.textContent || '').trim() : null;\n")


def transition(label, first=False, always=False):
    """One status change: open menu -> pick status -> settle -> read the badge EXACTLY.
    ⚠️ The badge is set OPTIMISTICALLY (`StatusMenuIcon` modifies the cache before the mutation),
    so this proves the menu did what was asked, not that the server has it - see the reloads."""
    return [
        step("click", f"Open the status menu (-> {label})",
             {"element": xpath_el(STAGE_URL, STATUS_TARGET)}, always=always, timeout=30),
        step("click", f"Mark as {label}" + (" (optional: may already be set)" if first else ""),
             {"element": xpath_el(STAGE_URL,
                 f'//button[normalize-space(.)="Mark as {label}"]')},
             optional=first, always=always, timeout=30),
        step("wait", f"Wait for the status mutation (-> {label})", {"value": 3}, always=always),
        jsassert(f'Test the status badge now reads exactly "{label}"',
                 BADGE_JS + f"return now === '{label}';", always=always, timeout=30),
    ]


def reload_reads(label, always=False):
    """A RELOAD, then the badge: the server's status, not the optimistic one."""
    return [
        go(STAGE_URL, "the fixture work order (reload: the server's status)") if not always else
        step("goToUrl", "Navigate to the fixture work order (reload: the server's status)",
             {"value": STAGE_URL}, always=True),
        step("wait", "Let the detail view begin rendering", {"value": 2}, always=always),
        step("assertPageContains", "Test work order detail rendered", {"value": "Status:"},
             always=always, timeout=30),
        jsassert(f'⭐ SERVER: after a reload the badge reads "{label}"',
                 BADGE_JS + f"return now === '{label}';", always=always, timeout=30),
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
    if label == "Not Completed":
        steps += reload_reads("Not Completed")       # one mid-walk server proof
# 🛑 RESTORE - `always`. Until 2026-09-11 the final "-> Ready" was an ordinary step, so a failure
# anywhere left the fixture on whatever status it had reached: it sat `Canceled` for two days and
# dropped out of the crew's list (a stage outside In Progress/On Hold/Ready is not fetched).
steps += transition("Ready", always=True) + reload_reads("Ready", always=True)

write(test(
    "MOB.320_Work_Status_Update",
    "`MOB.320` Walk the fixture work order through ALL EIGHT assignable statuses, ending on Ready.\n"
    f"- Sequence: {' -> '.join(STATUS_SEQUENCE)} -> Ready\n"
    "- Each transition reads the badge EXACTLY (`Complete` ≠ `Not Completed`). The badge is\n"
    "  optimistic, so a RELOAD proves the server twice: after Not Completed, and at Ready.\n"
    "- The final -> Ready and its reload are `always`: a failure mid-walk can no longer strand\n"
    "  the fixture (it once sat Canceled and fell out of the crew's list).\n"
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
