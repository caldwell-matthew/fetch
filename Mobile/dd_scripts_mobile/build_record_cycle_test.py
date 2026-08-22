"""Build MOB.349_Work_Record_Cycling - the < > arrows on the work order title.

WHY THIS EXISTS
  `WorkDetails.tsx:73` wraps the title in `RecordCycleButtons`. `MOB.570` proves the same
  component on Asset Verification assets; the WORK ORDER instance had no coverage and was
  unlisted until the 2026-08-18 walk.

⚠️ IT ONLY WORKS WHEN THE DETAIL WAS REACHED FROM THE LIST - which is why every other
work-order test misses it, and why this one must not deep-link.
  `RecordCycleButtons` cycles `records`, and `WorkDetails.tsx` passes
  `location.state?.stageIds ?? []`. A deep link carries no router state, so `records` is `[]`,
  `total` is 0, `currentIndex` is -1, and:

      const newId = sortedRecords[newIndex]?.id ?? '';
      navigate(location.pathname.replace(currentId, newId), ...)

  ...navigates to `/work/` with the id replaced by an EMPTY STRING. So on a deep-linked page
  the arrows are not merely inert, they are actively broken - and a test that deep-linked would
  "prove" cycling against a control that cannot work. This walks the list and clicks a row,
  the `MOB.344` path.

HOW IT PROVES A CYCLE, given Datadog cannot hold a value between steps
  The proof is the URL. `onClick` navigates by replacing the id in `location.pathname`, so a
  successful cycle changes the path and a successful return restores it. Datadog cannot
  interpolate an extracted value into a later assertion, so the starting path is stashed in
  **sessionStorage** from inside a JS step and compared from a later one - the same
  assert-the-source-of-truth shape MOB.810 uses for sort, and cheaper than any DOM proxy.

  Leg 1: forward  -> the path must DIFFER from the stash
  Leg 2: back     -> the path must EQUAL the stash again
  Leg 2 is what makes it self-restoring in navigation terms, and it is `alwaysExecute` so a
  failed leg 1 cannot strand the session on a different work order.

FIXTURE REQUIREMENT: at least TWO work orders in the crew's list. With one, forward wraps to
itself, the path never changes, and leg 1 would fail for a fixture reason rather than a code
one - so the row count is guarded up front with a message that says so. The crew's list was
empty until work orders were assigned on 2026-08-20; before that this test was impossible.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write,  # noqa: E402
                      jsassert, WORK_ROW)

WORK_URL = BASE + "/work"

# THERE ARE TWO CYCLERS ON THIS PAGE AND THEY USE THE SAME ICONS - trap 3.
# `RecordCycleButtons` cycles WORK ORDERS (WorkDetails.tsx:73) and `InfiniteTabs` renders
# `CycleButtons` to cycle TABS (`components/ui/CycleButtons.tsx`) - both draw
# faCircleArrowLeft/Right. An unscoped locator matches both and Datadog reports
# "Multiple elements found" rather than picking one. MOB.570 hit the same thing on the asset
# detail and solved it by scoping to the cycler showing a known title.
#
# Here the record cycler is identified by what it WRAPS: its children are the work order
# title, which contains the MapLink globe. The tab cycler wraps nothing of the sort. So
# "the arrow in the group that also contains the globe" names the right one structurally,
# without depending on DOM order.
#
# Icon names measured, not guessed (trap 14): faCircleArrowLeft -> `circle-arrow-left`,
# faCircleArrowRight -> `circle-arrow-right`.
RECORD_CYCLER = ('//*[contains(concat(" ", normalize-space(@class), " "),'
                 ' " mantine-Group-root ")]'
                 '[.//*[@data-icon="globe" or contains(concat(" ",'
                 ' normalize-space(@class), " "), " fa-globe ")]]')


def arrow(name):
    return (f'{RECORD_CYCLER}//button[.//*[@data-icon="{name}"'
            f' or contains(concat(" ", normalize-space(@class), " "), " fa-{name} ")]]')


STASH = "dd_cycle_from"

steps = [
    go(WORK_URL, "the work order list"),
    step("wait", "Let the work list begin rendering", {"value": 3}),
    step("assertElementContent", 'The "Work Orders" page mounted',
         {"check": "contains", "value": "Work Orders",
          "element": xpath_el(WORK_URL,
                              '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                              ' "Work Orders")]')}, timeout=30),

    # A POSITIVE polling gate - the rows themselves. Now the crew's list is populated this is
    # available, and it is strictly better than the LOADEDALL absence checks, which cannot
    # poll (trap 21).
    step("assertElementPresent", "ROW GATE: at least one work order rendered",
         {"element": xpath_el(WORK_URL, WORK_ROW + "[1]")}, timeout=120),

    # FIXTURE GUARD, with its reason in the name: one row makes forward wrap to itself and the
    # URL never changes, so leg 1 would fail on data rather than on code.
    jsassert("FIXTURE GUARD: the list holds at least TWO work orders (one cannot cycle)",
             "const rows = [...document.querySelectorAll('.mantine-Paper-root')]"
             ".filter(e => /Description:/.test(e.textContent||''));\n"
             "return rows.length >= 2;", timeout=60),

    # THE USER PATH. Not a deep link - see the header note.
    step("click", "Tap the first work order row",
         {"element": xpath_el(WORK_URL, WORK_ROW + "[1]")}, timeout=60),
    step("wait", "Let the detail view render", {"value": 4}),
    step("assertElementPresent", "The work order detail rendered (tab strip)",
         {"element": xpath_el(WORK_URL, '(//*[@role="tab"])[1]')}, timeout=60),
    jsassert("We are on a /work/<id> route, not still on the list",
             "return /\\/work\\/[^/]+$/.test(location.pathname);", timeout=30),

    # Stash the starting path. A JS step's side effect is the only way to carry a value
    # between Datadog steps.
    jsassert("Remember which work order we started on",
             f"sessionStorage.setItem('{STASH}', location.pathname);\n"
             f"return !!sessionStorage.getItem('{STASH}');", timeout=30),

    step("assertElementPresent", "The BACK cycle arrow renders",
         {"element": xpath_el(WORK_URL, arrow("circle-arrow-left"))}, timeout=30),
    step("assertElementPresent", "The FORWARD cycle arrow renders",
         {"element": xpath_el(WORK_URL, arrow("circle-arrow-right"))}, timeout=30),

    # ---- LEG 1: forward ---------------------------------------------------------------
    step("click", "Cycle FORWARD to the next work order",
         {"element": xpath_el(WORK_URL, f'({arrow("circle-arrow-right")})[1]')}, timeout=30),
    step("wait", "Let the next work order render", {"value": 4}),
    jsassert("CYCLED: the route now points at a DIFFERENT work order",
             f"const from = sessionStorage.getItem('{STASH}');\n"
             "if (!from) return false;\n"
             "return /\\/work\\/[^/]+$/.test(location.pathname)"
             " && location.pathname !== from;", timeout=60),

    # ---- LEG 2: back, and it restores ---------------------------------------------------
    # alwaysExecute: if leg 1 failed, the session must still be put back on the original work
    # order or every later subtest inherits the wrong one (trap 16c).
    step("click", "Cycle BACK again",
         {"element": xpath_el(WORK_URL, f'({arrow("circle-arrow-left")})[1]')},
         always=True, timeout=30),
    step("wait", "Let the original work order render", {"value": 4}, always=True),
    jsassert("RESTORED: the route points at the work order we started on",
             f"const from = sessionStorage.getItem('{STASH}');\n"
             "if (!from) return false;\n"
             "return location.pathname === from;", always=True, timeout=60),
    jsassert("Tidy up the stash",
             f"sessionStorage.removeItem('{STASH}');\nreturn true;",
             optional=True, always=True, timeout=15),
]

write(test(
    "MOB.349_Work_Record_Cycling",
    "`MOB.349` The **< > cycle arrows on the work order title** — `MOB.570` proves the same\n"
    "component on Asset Verification assets; this instance was unlisted until 2026-08-18.\n"
    "- ⚠️ **Must reach the detail from the LIST, never by deep link.** `WorkDetails` passes\n"
    "  `location.state?.stageIds ?? []`, so a deep-linked page cycles an EMPTY array and\n"
    "  navigates to `/work/` with the id replaced by an empty string — the arrows are actively\n"
    "  broken there, not merely inert. This walks the `MOB.344` user path.\n"
    "- **Proof is `location.pathname`**, stashed in `sessionStorage` from a JS step because\n"
    "  Datadog cannot carry an extracted value into a later assertion — the same\n"
    "  assert-the-source-of-truth shape as `MOB.810`.\n"
    "- **SELF-RESTORING**: leg 2 cycles back and asserts the original route, with\n"
    "  `alwaysExecute` so a failed leg 1 cannot strand the session on another work order.\n"
    "- **Needs ≥2 work orders** in the crew's list — with one, forward wraps to itself and the\n"
    "  URL never changes. Guarded up front, so that failure names itself as fixture, not code.\n"
    "  (Impossible before work orders were assigned on 2026-08-20.)\n"
    "- Icon names measured, not guessed (trap 14): `circle-arrow-left` / `circle-arrow-right`.\n"
    "- ⚠️ **Two cyclers on this page share those icons** — `RecordCycleButtons` (work orders)\n"
    "  and `InfiniteTabs`' `CycleButtons` (tabs). An unscoped locator matches both and fails\n"
    "  with *Multiple elements found* (trap 3). The record cycler is scoped by what it wraps:\n"
    "  the title, which carries the MapLink globe.",
    steps,
    tags=["Mobile", "env:dev", "Work Orders", "read-only"],
))
print("wrote MOB.349 (work order record cycling)")
