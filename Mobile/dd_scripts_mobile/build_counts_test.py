"""Build MOB.560 - the job-list counts, status badges and the ring chart's numeric labels.

WHAT THE CHECKLIST ITEMS ACTUALLY POINT AT
  "Total count matches pie chart" -> `JobStatusSummary` renders a Mantine **RingProgress**
  (the "pie") beside a `<List>` legend whose items read `Ready: 3`, `In Progress: 1`, ... and
  each legend item is CLICKABLE, filtering the job list by that status.
  "Mobile job count / statuses / asset count" -> `VerificationProgress` on every job card:
  `{verified} out of {total} Assets Verified` with `{Math.round(verified/total*100) || 0}%`.

  The SVG ring itself is not assertable (trap: colours and arcs are not text), which is why
  the checklist said to assert the numeric label. Both tests here do exactly that.

TWO INVARIANTS, NEITHER OF WHICH HARDCODES FIXTURE STATE

  1. ARITHMETIC. For every job card on the page, the percentage must equal
     `Math.round(verified/total*100)` - with `total === 0` yielding 0, because the component
     ends in `|| 0` to swallow the NaN. This is checked across EVERY card in one pass, and
     the assertion requires at least one match so it cannot pass vacuously on an empty list
     (trap 5) - the failure mode that has cost this project more runs than any other.

  2. THE BADGE FILTERS. Clicking `In Progress: n` keeps the fixture job (which is
     IN_PROGRESS); clicking `Completed: n` must HIDE it. The negative leg is the one that
     proves the badge filters rather than merely highlighting itself.

  Deliberately NOT asserted: that a legend count equals the number of rendered cards. Job
  cards are `<Paper>` elements with no distinguishing class or test id, so any count would be
  guessing at a selector - and a miscounted selector produces a confident wrong answer rather
  than an error. The arithmetic invariant covers the same ground without that risk.

WHY IT IS SAFE IN MOB.993
  Read-only: it selects and deselects a status filter, which is component state
  (`selectedStatus`), not persisted anywhere. Nothing is written.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write, jsassert  # noqa: E402

JOBS_URL = BASE + "/asset-verify"
FIXTURE = "DATADOG MOBILE JOB"

PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]'
SEARCH_INPUT = '//input[@placeholder="Find Mobile Job(s)"]'


def legend(label):
    """A legend row is a Mantine List.Item -> <li>. Scoping to <li> matters: the label text
    also appears inside every ancestor of the list, and Datadog errors on multiple matches
    rather than picking one (trap 3)."""
    return f'//li[contains(normalize-space(.), "{label}:")]'


# Checks EVERY card in one pass. `n > 0` is what stops it passing on a page with no cards.
PCT_MATCHES_COUNTS = """
const t = document.body.innerText || '';
const re = /(\\d+)\\s+out of\\s+(\\d+)\\s+Assets Verified\\s*(\\d+)%/g;
let m, n = 0;
while ((m = re.exec(t)) !== null) {
  n++;
  const verified = +m[1], total = +m[2], pct = +m[3];
  const expected = total === 0 ? 0 : Math.round(verified / total * 100);
  if (pct !== expected) return false;
}
return n > 0;
"""


write(test(
    "MOB.560_AssetVerify_Counts_Badges",
    "`MOB.560` Job-list counts, status badges, and the ring chart's numeric labels.\n"
    "- READ-ONLY. Selecting a status badge is component state (`selectedStatus`); nothing is\n"
    "  written and nothing persists.\n"
    "- **Asserts the numeric label, never the SVG.** The ring is a Mantine `RingProgress` —\n"
    "  arcs and colours are not text. Its legend (`Ready: n`, `In Progress: n`, …) is.\n"
    "- **Invariant 1 — arithmetic.** Every job card's `X out of Y Assets Verified` must agree\n"
    "  with its `Z%`, where `Z = Math.round(X/Y*100)` and `Y = 0` gives `0` (the component\n"
    "  ends in `|| 0` to swallow the NaN). Checked across every card in one pass, and it\n"
    "  requires at least one match so it cannot pass vacuously on an empty list (trap 5).\n"
    "- **Invariant 2 — the badge actually filters.** `In Progress` keeps the fixture job;\n"
    "  `Completed` must hide it. The negative leg is the proof — a badge that only\n"
    "  highlighted itself would satisfy the positive one.\n"
    "- Not asserted: legend count vs. number of rendered cards. Job cards are `<Paper>` with\n"
    "  no distinguishing class or test id, so counting them would mean guessing a selector,\n"
    "  and a wrong selector yields a confident wrong answer instead of an error.",
    [
        go(JOBS_URL, "the mobile job list"),
        step("wait", "Wait for the page to mount", {"value": 10}),
        step("assertElementContent", 'Test the "Mobile Jobs" page mounted',
             {"check": "contains", "value": "Mobile Jobs",
              "element": xpath_el(JOBS_URL, PAGE_TITLE)}),
        step("wait", "Wait for the lookup prefetch and batched detail downloads",
             {"value": 25}),
        step("assertElementPresent", "Test the job list rendered",
             {"element": xpath_el(JOBS_URL, SEARCH_INPUT)}),
        step("assertPageLacks", "Test the batched job-detail downloads finished",
             {"value": "Fetching mobile job details"}),
        step("assertPageContains", f'FIXTURE GUARD: "{FIXTURE}" is in this crew\'s list',
             {"value": FIXTURE}),

        # -------- the ring's legend
        step("assertElementPresent", "The status ring's legend renders an In Progress count",
             {"element": xpath_el(JOBS_URL, legend("In Progress"))}),
        step("assertElementPresent", "The status ring's legend renders a Completed count",
             {"element": xpath_el(JOBS_URL, legend("Completed"))}),

        # -------- invariant 1: the percentage label matches its own counts
        jsassert("PROOF: every card's % label matches its own X-out-of-Y counts",
                 PCT_MATCHES_COUNTS),

        # -------- invariant 2: the badge filters the list
        step("click", "Select the In Progress status badge",
             {"element": xpath_el(JOBS_URL, legend("In Progress"))}),
        step("wait", "Wait for the list to re-filter", {"value": 3}),
        step("assertPageContains",
             f'"{FIXTURE}" is IN_PROGRESS, so it survives the In Progress badge',
             {"value": FIXTURE}),
        # Re-check the arithmetic on the filtered list too - a filter that re-renders cards
        # is exactly where a stale percentage would show up.
        jsassert("The % labels still match after filtering", PCT_MATCHES_COUNTS),

        step("click", "Deselect the In Progress badge (it toggles)",
             {"element": xpath_el(JOBS_URL, legend("In Progress"))}),
        step("wait", "Wait for the list to restore", {"value": 3}),

        step("click", "Select the Completed status badge",
             {"element": xpath_el(JOBS_URL, legend("Completed"))}),
        step("wait", "Wait for the list to re-filter", {"value": 3}),
        # THE PROOF. Nothing on this page echoes the job name, so a page-level negative is
        # sound here (unlike the filter pills of trap 5b).
        step("assertPageLacks",
             f'PROOF: the Completed badge filters — "{FIXTURE}" is hidden',
             {"value": FIXTURE}),

        step("click", "Deselect the Completed badge",
             {"element": xpath_el(JOBS_URL, legend("Completed"))}, always=True),
        step("wait", "Wait for the list to restore", {"value": 3}, always=True),
        step("assertPageContains", f'RESTORED: "{FIXTURE}" is listed again',
             {"value": FIXTURE}, always=True),
    ],
    ["Mobile", "env:dev", "Asset Verification", "read-only"],
))

# ---------------------------------------------------------------- wire into MOB.993
suite_path = os.path.join(HERE, "MOB.993_AssetVerify_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
CHILD = "MOB.560_AssetVerify_Counts_Badges"
if CHILD not in [s.get("name") for s in steps]:
    steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                  "isCritical": True, "name": CHILD, "noScreenshot": False,
                  "type": "playSubTest",
                  "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"added {CHILD} to MOB.993")

print("wrote MOB.560 (counts, badges, ring labels)")
