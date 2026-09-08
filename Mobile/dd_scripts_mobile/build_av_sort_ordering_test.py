"""Build MOB.535_AssetVerify_Sort_Ordering - the mobile job list really comes out in order.

WHY THIS EXISTS, AND WHY IT COULD NOT BE BUILT BEFORE
  `MOB.530` covers the job list's sort dropdown as OPEN/DISMISS only, and its checklist row has
  read `[~] ordering is not verified` since the beginning. The blocker was never the test: it
  was the fixture. Proving an order needs >=2 records, and only one mobile job
  (`DATADOG MOBILE JOB`) was known to exist for this crew.

  ✅ UNBLOCKED 2026-08-23 - repo owner confirmed the crew has MULTIPLE mobile jobs.

  This is the job-list analogue of `MOB.580` (ordering on a job's ASSET list) and of
  `MOB.345`'s ordering leg (the work list). All three now exist.

🔁 VERSION 2 - THE EXACT-REVERSAL INVARIANT DOES NOT SURVIVE VIRTUALISATION.
  Version 1 copied `MOB.345`'s shape: capture the rendered order under ASC, then assert DESC is
  its exact `reverse()`. It FAILED on its first run (2026-08-23, MOB.996), and its own
  diagnostics attributed it in a single run - exactly what they were added for:

      DIAG: ASC and DESC rendered the SAME NUMBER of rows   -> FALSE
      DIAG: ASC and DESC rendered the SAME SET of rows      -> FALSE

  So ASC and DESC did not even render the same rows. That is **Virtuoso**, not the sort: the
  job list is virtualised, so the DOM holds only the window currently on screen, and re-sorting
  changes which records fall in that window. `MOB.345` gets away with the reversal invariant
  because the work list is short enough to render whole; this list is not. The checklist has
  warned about exactly this since August - *"Virtuoso renders only what is on screen, so a DOM
  row count is not the result-set size"* - and version 1 walked into it anyway.

  ⭐ THE FIX IS A DIFFERENT INVARIANT, NOT A BIGGER WAIT: **monotonicity of the rendered
  window.** Any contiguous window of a sorted list is itself sorted, so:

      Name ▲  ->  the rendered names are non-DECREASING
      Name ▼  ->  the rendered names are non-INCREASING

  This is *stronger* than the reversal check (it reads the actual ordering key rather than
  comparing two opaque orders), needs no cross-step state at all, and is **immune to
  virtualisation, to how many jobs exist, and to which ones they are**.

WHY `name` AND NOT `createdAt`
  The AV job list offers `['createdAt', 'name', 'status']` (`AssetVerification/index.tsx:216`).
  Monotonicity has to read the sort KEY off the row, and `name` is the only one of the three
  the card renders (`JobListItem` puts `job.name` in a `Title`). `createdAt` is not on screen,
  which is why version 1 had to compare opaque row order in the first place.

MATCH LODASH'S COMPARISON, NOT `localeCompare`
  `applySortValue` is `sortBy(list, 'name')` / `reverse(sortBy(...))` (`ui/SortDropdown.tsx:28`).
  lodash's `compareAscending` uses plain `<` / `>` on strings - JS code-unit order, so
  `'Z' < 'a'`. `localeCompare` would disagree on exactly the mixed-case pairs this fixture is
  most likely to contain, and would produce a failure that looks like a sort bug. The
  assertions below use `<=` / `>=` on the raw strings.

🛑 IT MUST RESTORE, AND UNLIKE `MOB.810` IT DOES.
  Selecting a sort writes `sessionStorage['mobile-MobileJob-sort']`, and a Datadog suite shares
  ONE browser session - so a leaked sort silently changes what every later subtest sees.
  `MOB.810` ends leaving `Created At ▼` set (it asserts persistence and never clears it); this
  test removes the key on the way out with `alwaysExecute`. It is wired LAST in `MOB.996` for
  the same reason.

READ-ONLY: selects sort options and reads row order. Nothing is created, edited or verified.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (step, xpath_el, test, write, jsassert,  # noqa: E402
                      av_list_gate, AV_JOBS_URL)

SORT_KEY = "mobile-MobileJob-sort"

# Locators lifted verbatim from MOB.810 - same screen, same control, already proven green.
# Trap 14: the sort trigger is an unlabelled ActionIcon, so every plausible icon name is
# matched rather than guessed at.
SORT_BTN = ('//button[.//*[@data-icon="sort-alt"'
            ' or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ")'
            ' or @data-icon="arrow-down-arrow-up"'
            ' or contains(concat(" ", normalize-space(@class), " "),'
            ' " fa-arrow-down-arrow-up ")]]')
SORT_SELECT = ('//*[contains(concat(" ", normalize-space(@class), " "),'
               ' " mantine-Modal-content ")][contains(., "Sort Criteria")]'
               '//input[contains(concat(" ", normalize-space(@class), " "),'
               ' " mantine-Select-input ")]')

# The option is matched on "Name" + the arrow rather than the exact string `Name ▲`, because
# the label comes from the SCHEMA (`formatSchema`), not from this repo - it could read
# `Job Name` without anything here changing. Of the three columns offered
# (createdAt / name / status) only one can contain "Name", so this cannot be ambiguous.
def option(arrow):
    return (f'//*[@role="option"][contains(normalize-space(.), "Name")]'
            f'[contains(normalize-space(.), "{arrow}")]')


# A job row is a `JobListItem` Paper, identified by the one string every job card renders and
# nothing else on this screen does - `VerificationProgress`'s "{v} out of {t} Assets Verified".
#
# ⚠️ `!e.querySelector('.mantine-Paper-root')` selects the LEAF row: a Paper wrapping the whole
# list would also contain that text, and including it would add one entry holding every row's
# text at once.
#
# NAMES(), not whole textContent - the sort key is what has to be checked for monotonicity, and
# `JobListItem` renders `job.name` in the Title.
NAMES_JS = ("const NAMES = () => [...document.querySelectorAll('.mantine-Paper-root')]\n"
            "  .filter(e => /out of \\d+ Assets Verified/.test(e.textContent || '')\n"
            "            && !e.querySelector('.mantine-Paper-root'))\n"
            "  .map(e => ((e.querySelector('.mantine-Title-root') || {}).textContent || '')\n"
            "             .replace(/\\s+/g, ' ').trim());\n")


def pick_sort(arrow, human):
    """Open the Sort Criteria modal and choose the Name sort in `arrow` direction. Each click
    is a polling gate rather than a bare wait - trap 21, and the lesson MOB.974 run 1 paid
    for on Mantine menus."""
    return [
        step("click", f'Open the sort dropdown (for Name {human})',
             {"element": xpath_el(AV_JOBS_URL, SORT_BTN)}, timeout=30),
        step("assertPageContains", "The Sort Criteria modal opened",
             {"value": "Sort Criteria"}, timeout=30),
        step("click", "Open the sort options",
             {"element": xpath_el(AV_JOBS_URL, SORT_SELECT)}, timeout=30),
        step("assertElementPresent", f'GATE: a "Name {arrow}" option exists',
             {"element": xpath_el(AV_JOBS_URL, option(arrow))}, timeout=30),
        step("click", f'Pick "Name {arrow}"',
             {"element": xpath_el(AV_JOBS_URL, option(arrow))}, timeout=30),
        step("wait", "Let the sort apply and the list re-render", {"value": 3}),
        # The app's own contract, not the Select's input value - the input holds the option id,
        # not the human label (the note at the foot of build_work_sort_test.py). The label is
        # read from storage rather than asserted equal to a hard-coded string, since the schema
        # owns its wording.
        jsassert(f"The {human} Name sort was persisted",
                 f"const raw = sessionStorage.getItem('{SORT_KEY}');\n"
                 "if (!raw) return false;\n"
                 "const v = JSON.parse(raw);\n"
                 f"return v.column === 'name' && String(v.label || '').includes('{arrow}');",
                 timeout=30),
    ]


steps = av_list_gate() + [
    # ⭐ THE FIXTURE FACT THIS TEST WAS BLOCKED ON, asserted rather than assumed. Owner
    # confirmed >=2 mobile jobs on 2026-08-23; this turns that into something the run checks.
    #
    # NB the name deliberately does NOT start with "FIXTURE GUARD": `av_list_gate` already
    # contributes `FIXTURE GUARD: "DATADOG MOBILE JOB" is in this crew's list`, and two
    # identically-prefixed steps make a failure report ambiguous about which fact broke.
    jsassert("TWO-JOB GUARD: at least TWO job rows are rendered — "
             "ordering is vacuous with one (trap 5)",
             NAMES_JS + "return NAMES().length >= 2;", timeout=60),
    # Monotonicity is trivially true for a list whose names are all identical, which would make
    # BOTH assertions below unfalsifiable at once (trap 5). This rules that out up front.
    jsassert("DISTINCTNESS GUARD: the rendered jobs do not all share one name",
             NAMES_JS +
             "const n = NAMES();\n"
             "return new Set(n).size >= 2;", timeout=30),
] + pick_sort("▲", "ascending") + [
    # ⭐ THE PROOF, ascending. Valid under virtualisation: any contiguous window of a sorted
    # list is itself sorted, so this holds whatever subset Virtuoso has mounted.
    jsassert("⭐ PROOF ASC: the rendered job names are in non-DECREASING order",
             NAMES_JS +
             "const n = NAMES();\n"
             "if (n.length < 2) return false;\n"
             "// lodash sortBy uses plain < / > on strings (code-unit order), NOT\n"
             "// localeCompare — match it, or mixed case reads as a sort bug.\n"
             "for (let i = 1; i < n.length; i++) if (n[i - 1] > n[i]) return false;\n"
             "return true;", timeout=30),
] + pick_sort("▼", "descending") + [
    jsassert("⭐ PROOF DESC: the rendered job names are in non-INCREASING order",
             NAMES_JS +
             "const n = NAMES();\n"
             "if (n.length < 2) return false;\n"
             "for (let i = 1; i < n.length; i++) if (n[i - 1] < n[i]) return false;\n"
             "return true;", timeout=30),

    # Attribution, optional. A monotonicity failure is already specific, but the rendered COUNT
    # is the thing that broke version 1 and is worth recording on every run so the next person
    # can see how much of the list is actually on screen.
    jsassert("DIAG: how many rows Virtuoso has mounted (informational — always true)",
             NAMES_JS +
             "const n = NAMES();\n"
             "return n.length >= 1 || true;",
             optional=True, always=True, timeout=15),

    # ---- RESTORE ----------------------------------------------------------------------------
    # alwaysExecute: a run that dies mid-way must not leave the session sorted, because every
    # later subtest in MOB.996 shares this browser session. Removing the key returns the list
    # to its default ordering rather than to some other explicit sort.
    jsassert("RESTORE: clear the persisted sort",
             f"sessionStorage.removeItem('{SORT_KEY}');\n"
             f"return !sessionStorage.getItem('{SORT_KEY}');",
             always=True, timeout=30),
]

write(test(
    "MOB.535_AssetVerify_Sort_Ordering",
    "`MOB.535` **The mobile job list really comes out in the chosen order.**\n"
    "- Closes `MOB.530`'s long-standing `[~]` — *sort ordering is not verified* — which was\n"
    "  **blocked on the FIXTURE, not on test effort**: proving an order needs ≥2 records.\n"
    "  ✅ Unblocked 2026-08-23 when the owner confirmed the crew has multiple mobile jobs.\n"
    "- 🔁 **Version 2. The exact-reversal invariant (`MOB.345`'s shape) does NOT survive\n"
    "  virtualisation** — version 1 failed on its first run, and its own diagnostics said why\n"
    "  in one run: ASC and DESC rendered **different row counts and different sets**, because\n"
    "  Virtuoso mounts only the visible window.\n"
    "- ⭐ **The invariant is now MONOTONICITY of the rendered window**: `Name ▲` → names\n"
    "  non-decreasing, `Name ▼` → non-increasing. Any contiguous window of a sorted list is\n"
    "  itself sorted, so this is immune to virtualisation, to how many jobs exist, and to which\n"
    "  ones they are — and it is *stronger* than reversal, because it reads the actual sort key\n"
    "  rather than comparing two opaque orders.\n"
    "- Sorts by **`name`** because it is the only one of the three offered columns\n"
    "  (`createdAt`/`name`/`status`) that the card actually renders — monotonicity has to read\n"
    "  the key off the row.\n"
    "- ⚠️ Comparison uses `<`/`>` on raw strings to match lodash's `compareAscending`.\n"
    "  `localeCompare` disagrees on mixed case and would look like a sort bug.\n"
    "- **Cannot go vacuous**: guards require ≥2 rendered rows **and** ≥2 distinct names —\n"
    "  monotonicity is trivially true both ways for a list of identical names (trap 5).\n"
    "- 🛑 **Self-restoring, `alwaysExecute` — and unlike `MOB.810` it really does clear\n"
    "  `mobile-MobileJob-sort`.** Wired **last** in `MOB.996` so a leaked sort cannot reach\n"
    "  `MOB.810`, which deliberately leaves one set.\n"
    "- 🛑 **READ-ONLY**.",
    steps,
    tags=["Mobile", "env:dev", "Asset Verification", "Sort", "read-only"],
))
print("wrote MOB.535 v2 (mobile job list sort ordering — monotonicity)")
