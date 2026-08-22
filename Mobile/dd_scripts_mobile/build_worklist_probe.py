"""TEMPORARY probe - why did the work-list ROW locator find nothing on /work?

THE QUESTION
  MOB.341/342's shared `work_list_gate()` passed every readiness check - page title, search
  box, and all three `loadedAll` labels gone - and then failed on the row locator
  `(//*[...mantine-Paper-root...][contains(., "Description:")])[1]`.

  So the page loaded. Two candidate causes, and they need opposite fixes:
    A. the locator is wrong (class name or label text differs from the source reading)
    B. the crew's work list is genuinely EMPTY, so there are no rows to find
  Guessing between them is what trap 15 warns about - measure instead.

  Note no existing test can settle this: MOB.340 asserts only the search box, and MOB.134
  visits /work solely to warm the cache before deep-linking. Nothing has ever asserted that
  a work ROW renders.

EVERY PROBE IS `optional`, so one run reports all of them. Read with `dd_tools.py report`.

  probe                          a PASS means
  -----------------------------------------------------------------------------
  any [class*="Paper"]           Mantine Paper renders under SOME class name
  .mantine-Paper-root > 0        ...and it is the exact class the locator assumes
  body has "Description:"        the row label exists somewhere on the page
  body has "Assets:"/"Address:"  the other two row labels (listFieldsToDisplay)
  Paper contains "Description:"  the label is INSIDE a Paper - locator should work
  Paper count > 5                the list is populated, not a lone chrome element
  RingProgress present           the status summary rendered (needs edges.length)
  legend "Status (n)" items      the legend rendered with non-zero counts
  body has "Ready ("             a Ready legend entry specifically (MOB.342 assumes it)
  virtuoso scroller present      the virtualised list container mounted

  If the Paper probes pass and the "Description:" probes fail -> cause A, fix the label.
  If ALL of them fail but RingProgress passes -> the list is empty -> cause B.
  If RingProgress ALSO fails -> `data.workStages.edges` is empty -> definitely B.

DELETE THIS FILE once the row locator is settled. It is a probe, not coverage.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, go, test, write, jsassert, xpath_el  # noqa: E402

SORT_BTN = ('//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up"'
            ' or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ")'
            ' or contains(concat(" ", normalize-space(@class), " "), " fa-arrow-down-arrow-up ")]]')
SORT_SELECT = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
               '[contains(., "Sort Criteria")]'
               '//input[contains(concat(" ", normalize-space(@class), " "), " mantine-Select-input ")]')

WORK_URL = BASE + "/work"

login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]


# Shared helpers prepended to every probe body, so each probe stays one readable line.
# ROWS() is the work-list row: a Mantine Paper carrying the "Description:" label that
# WorkListItem renders unconditionally.
HELPERS = """
const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]
  .filter(e => (e.textContent || '').includes('Description:'));
const WROWS = () => ROWS().length;
const LEG = () => [...document.querySelectorAll('li')]
  .map(e => (e.textContent || '').trim())
  .filter(t => /^[A-Za-z ]+\\(\\d+\\)$/.test(t));
const OPTS = () => [...document.querySelectorAll('[role="option"]')]
  .map(e => (e.textContent || '').trim());
const OPT = (label) => OPTS().indexOf(label) !== -1;
"""


def probe(label, code):
    return jsassert(label, HELPERS + code, optional=True, timeout=20)


write(test(
    "MOB.978_DIAG_WorkList_Probe",
    "**TEMPORARY DIAGNOSTIC — not coverage. Delete once the row locator is settled.**\n"
    "- Answers in ONE run why `work_list_gate()`'s row guard found nothing while every\n"
    "  other readiness check on /work passed.\n"
    "- Every probe is `optional`, so the test passes and `report` shows which probes failed.\n"
    "- Distinguishes **a wrong locator** from **an empty crew work list** — they need\n"
    "  opposite fixes, and no existing test can tell them apart (MOB.340 asserts only the\n"
    "  search box; MOB.134 only warms the cache).",
    login_steps + [
        go(WORK_URL, "/work — the work order list"),
        step("wait", "Let the list load fully (generous — this is a probe)", {"value": 30}),

        # ---- ROUND 2 (2026-08-18, after work orders were added): the question is no longer
        # "is there data" but "HOW MUCH", because that decides which tests are buildable.
        # Row count thresholds - the first FAIL brackets the true count.
        probe("N>=1  rows", "return WROWS() >= 1;"),
        probe("N>=2  rows  (needed for any SORT-ORDER test)", "return WROWS() >= 2;"),
        probe("N>=3  rows", "return WROWS() >= 3;"),
        probe("N>=5  rows", "return WROWS() >= 5;"),
        probe("N>=10 rows", "return WROWS() >= 10;"),

        # Which statuses are in the legend - decides what MOB.342 can filter on, and
        # whether a NEGATIVE leg (a status the fixture is not) is available at all.
        probe("LEGEND has Ready", "return LEG().some(t => t.startsWith('Ready ('));"),
        probe("LEGEND has In Progress", "return LEG().some(t => t.startsWith('In Progress ('));"),
        probe("LEGEND has On Hold", "return LEG().some(t => t.startsWith('On Hold ('));"),
        probe("LEGEND has Complete", "return LEG().some(t => t.startsWith('Complete ('));"),
        probe("LEGEND has >=2 distinct statuses (needed for a NEGATIVE filter leg)",
              "return LEG().length >= 2;"),

        # Do the legend counts add up to the number of rows? If the legend says Ready(3)
        # and there are 3 rows, one status covers everything and there is no negative leg.
        probe("LEGEND total == row count (sanity: the ring describes THIS list)",
              "const tot = LEG().reduce((a, t) => a + (+(t.match(/\\((\\d+)\\)/) || [0, 0])[1]), 0);\n"
              "return tot === WROWS();"),
        probe("ONE status covers every row (if PASS, no negative filter leg exists)",
              "const n = WROWS();\n"
              "return LEG().some(t => (+(t.match(/\\((\\d+)\\)/) || [0, 0])[1]) === n);"),

        # Rows carry their status only as a border colour - confirm it is readable, since
        # that is the whole proof strategy for MOB.342.
        probe("ROW border colour is readable via getComputedStyle",
              "const r = ROWS()[0];\n"
              "if (!r) return false;\n"
              "const c = getComputedStyle(r).borderLeftColor;\n"
              "return /^rgb/.test(c);"),
        probe("ROW border colour is the READY green rgb(155, 203, 82)",
              "const r = ROWS()[0];\n"
              "if (!r) return false;\n"
              "return getComputedStyle(r).borderLeftColor === 'rgb(155, 203, 82)';"),
        probe("ROWS have >=2 DISTINCT border colours (a mixed-status list)",
              "const s = new Set(ROWS().map(r => getComputedStyle(r).borderLeftColor));\n"
              "return s.size >= 2;"),

        # Sort control - MOB.340 only opens the modal today.
        # ---- ROUND 3: what are the WorkStage sort options actually LABELLED?
        # `SortDropDown` builds them from the RUNTIME schema (`field.label`), so the labels
        # cannot be derived from the source - `columns` names the ids, not the labels, and
        # MOB.580 needs an exact string: //*[@role="option"][normalize-space(.)="Name ▲"].
        # Measure, never derive (trap 15).
        step("click", "Open the sort dropdown",
             {"element": xpath_el(WORK_URL, SORT_BTN)}, timeout=30),
        step("wait", "Wait for the sort modal", {"value": 3}),
        step("click", "Open the sort options",
             {"element": xpath_el(WORK_URL, SORT_SELECT)}, timeout=30),
        step("wait", "Wait for the options", {"value": 2}),

        probe("OPT any option is rendered at all",
              "return document.querySelectorAll('[role=\"option\"]').length > 0;"),
        probe("OPT count >= 6", "return document.querySelectorAll('[role=\"option\"]').length >= 6;"),
        probe("OPT count >= 10", "return document.querySelectorAll('[role=\"option\"]').length >= 10;"),
        probe("OPT label 'Work Sequence \u25b2' exists", "return OPT('Work Sequence \u25b2');"),
        probe("OPT label 'Sequence \u25b2' exists", "return OPT('Sequence \u25b2');"),
        probe("OPT label 'Status \u25b2' exists", "return OPT('Status \u25b2');"),
        probe("OPT label 'Priority \u25b2' exists", "return OPT('Priority \u25b2');"),
        probe("OPT label 'Created At \u25b2' exists", "return OPT('Created At \u25b2');"),
        probe("OPT label 'Target Due Date \u25b2' exists", "return OPT('Target Due Date \u25b2');"),
        probe("OPT every option ends with an arrow (so none is a bare 'Collected By Me')",
              "const o = OPTS();\n"
              "return o.length > 0 && o.every(t => /[\u25b2\u25bc]$/.test(t));"),

        probe("SORT dropdown button is present",
              "return !!document.querySelector('button [data-icon=\"sort-alt\"],"
              " button [data-icon=\"arrow-down-arrow-up\"]');"),
    ],
    ["Mobile", "env:dev", "diagnostic"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))

print("wrote MOB.978_DIAG_WorkList_Probe")
