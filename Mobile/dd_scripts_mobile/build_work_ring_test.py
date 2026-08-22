"""Rebuild MOB.342_Work_Status_Ring - withdrawn 2026-08-18 for want of data, rebuilt the
same day once work orders were assigned to the `Admin` crew.

WHAT CHANGED, AND WHAT DID NOT
  The original design was never wrong; there was simply nothing to filter. Re-measured with
  MOB.978_DIAG_WorkList_Probe before rebuilding:

      rows rendered ....................... 3-4      (N>=3 PASS, N>=5 FAIL)
      legend entries ...................... Ready ONLY
      >=2 distinct statuses ............... FAIL
      row borderLeft readable ............. PASS
      first row is Ready green ............ PASS  rgb(155, 203, 82)
      >=2 distinct row colours ............ FAIL

THE COLOUR PROOF IS THE POINT
  A work row NEVER renders its own status as text - `listFieldsToDisplay` is `_assets` and
  `address` only - so the status exists in the DOM solely as the row's `borderLeft` colour.
  This is why the checklist had "status badge colour" pencilled in as "likely an honest
  `[-]`". It is not: colour is unreachable from an XPath and perfectly reachable from
  `getComputedStyle`. Asserting it here closes that item.

⚠️ WHAT THIS TEST STILL CANNOT PROVE, AND WHY THAT IS RECORDED RATHER THAN PAPERED OVER
  Every work order in the crew's list is `Ready`, so the legend has ONE entry. That means
  there is no status to filter to that would HIDE anything, and the exclusion half of
  MOB.560's shape - "the Completed badge hides the fixture job" - has no analogue here yet.

  What is proven: the legend renders in `Status (n)` form; clicking it registers as selected;
  every rendered row is Ready-coloured; clicking again clears it. What is NOT proven: that a
  non-matching row would be removed. A single-status list cannot distinguish "filtered
  correctly" from "did not filter at all", and pretending otherwise would be exactly the
  vacuous-assertion mistake that MOB.340 made (trap 5).

  TO COMPLETE IT: set one work order in the crew's list to `In Progress` or `On Hold`. Then
  add a leg that selects that status and asserts NO row carries the Ready green - which is a
  true exclusion proof and needs no record names.

THE EXCLUSION LEG IS STILL BLOCKED - and the reason CHANGED on 2026-08-20.
  It was blocked because every work order in the crew's list was `Ready`, so no status could
  hide anything and a filter that did nothing passed exactly as well as one that worked
  (trap 5). The repo owner set a work order to `In Progress` that day to unblock it, and the
  leg was written - then measured: the legend STILL carries only one status, while rows do
  render (`BASELINE: rows are rendered` passed, `MORE THAN ONE status` failed).

  So the In Progress work order is not IN the crew's list. The likely cause is the OTHER
  fixture change made the same day: the `Admin` role was set to `mobileDownloadMode:
  SCHEDULED` (to unblock MOB.346), and per bugs_found.md 25's fourth rule a SCHEDULED role
  only sees stages that also have a SCHEDULED EVENT. A work order with no scheduled event
  drops out of the list regardless of its status.

  TO FINISH IT: give the In Progress work order a scheduled event, then restore the leg -
  it is preserved in git, and its shape was: assert an `In Progress (n)` legend entry, select
  it, then assert rows remain AND not one carries `rgb(155, 203, 82)`, AND every one carries
  `rgb(77, 128, 0)` (STATUS_COLORS.InProgress = #4D8000).

  ⚠️ Two fixture changes interacted here. Neither was wrong; together they cancelled out.

NOT ASSERTED: legend count vs rendered row count. Virtuoso VIRTUALISES the list, so the DOM
holds only what is on screen while the legend counts the whole result set. The probe measured
these as unequal; treating that as a bug would be a misreading of the component.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, HERE, WORK_URL, WORK_ROW, step, xpath_el, test, write,  # noqa: E402
                      jsassert, work_list_gate)

READY_RGB = "rgb(155, 203, 82)"      # STATUS_COLORS.Ready      = #9BCB52
INPROGRESS_RGB = "rgb(77, 128, 0)"   # STATUS_COLORS.InProgress = #4D8000
# NB the enum id is `InProgress` (no space) while the LEGEND renders the label `In Progress`.
# `WorkListItem` colours the border from `STATUS_COLORS[workStage.status]`, i.e. from the id.

ROWS_JS = ("const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]\n"
           "  .filter(e => (e.textContent || '').includes('Description:'));\n")


def legend(status):
    """Rendered as `<List.Item>` -> <li> with text `Ready (n)`. The COUNT is deliberately not
    matched: it tracks the crew's list and would make this test fixture-coupled."""
    return f'//li[contains(normalize-space(.), "{status} (")]'


write(test(
    "MOB.342_Work_Status_Ring",
    "`MOB.342` The work list's status ring and its clickable legend (T2.1).\n"
    "- READ-ONLY. `selectedStatus` is component state; nothing is written or persisted.\n"
    "- The analogue of `MOB.560`, which does this for the mobile job list.\n"
    "- **Withdrawn once and rebuilt.** The first version failed on a locator that was\n"
    "  correct — the crew's work list was empty (`bugs_found.md` §25). Rebuilt after work\n"
    "  orders were assigned, and after re-measuring the list with the diagnostic probe\n"
    "  rather than assuming what was in it.\n"
    "- **The proof is a COMPUTED STYLE, and that is not a shortcut.** A work row never\n"
    "  renders its status as text — `listFieldsToDisplay` is `_assets` and `address` only —\n"
    f"  so status lives solely in the row's `borderLeft`. Every rendered row must be\n"
    f"  `{READY_RGB}` (`STATUS_COLORS.Ready` = `#9BCB52`).\n"
    "- **This closes the `status badge colour` item**, which this checklist had guessed was\n"
    "  \"likely an honest `[-]`\". Colour is unreachable from an XPath, not from JS.\n"
    "- ⚠️ **The exclusion half is NOT proven, and cannot be yet.** Every work order in the\n"
    "  crew's list is `Ready`, so the legend has one entry and there is no status to filter\n"
    "  to that would hide anything. A single-status list cannot distinguish \"filtered\n"
    "  correctly\" from \"did not filter at all\" (trap 5). **To complete it:** set one work\n"
    "  order to `In Progress`, then assert no row is Ready-green while that status is\n"
    "  selected.\n"
    "- ⚠️ **Legend counts are NOT compared to rendered row counts.** Virtuoso virtualises the\n"
    "  list, so the DOM holds only what is on screen while the legend counts the whole set.\n"
    "  Measured as unequal; that is the component working, not a bug.\n"
    "- The count in `Ready (n)` is deliberately not matched — it tracks the crew's list.",
    work_list_gate() + [
        step("assertElementPresent", "The status ring rendered",
             {"element": xpath_el(WORK_URL,
                                  '//*[contains(@class,"mantine-RingProgress-root")]')},
             timeout=30),
        jsassert("The legend renders at least one `Status (n)` entry",
                 "const items = [...document.querySelectorAll('li')]\n"
                 "  .map(e => (e.textContent || '').trim())\n"
                 "  .filter(t => /^[A-Za-z ]+\\(\\d+\\)$/.test(t));\n"
                 "return items.length > 0;",
                 timeout=30),
        step("assertElementPresent", 'A "Ready (n)" legend entry is present',
             {"element": xpath_el(WORK_URL, legend("Ready"))}, timeout=30),
        # BASELINE. Deliberately weaker than "every row is Ready-green", which is what this
        # asserted before 2026-08-20. Rows rendering is the part that is safe to claim
        # unconditionally; the colour claims live in the filtered leg below, where they mean
        # something. See the EXCLUSION note in the header for why the mixed-status leg is not
        # here.
        jsassert("BASELINE: rows are rendered",
                 ROWS_JS + "return ROWS().length > 0;", timeout=30),


        step("click", "Select the Ready status in the legend",
             {"element": xpath_el(WORK_URL, legend("Ready"))}, timeout=30),
        step("wait", "Let the list re-filter", {"value": 3}),
        jsassert("PROOF: the Ready entry now renders as SELECTED (Highlight emits a <mark>)",
                 "return [...document.querySelectorAll('li mark')]\n"
                 "  .some(m => (m.textContent || '').includes('Ready'));",
                 timeout=30),
        jsassert(
            "PROOF: rows survive the Ready filter, and all are still Ready-green",
            ROWS_JS +
            "const rows = ROWS();\n"
            "// Non-vacuous: a filter that emptied the list would pass an all-match test.\n"
            "if (!rows.length) return false;\n"
            f"return rows.every(r => getComputedStyle(r).borderLeftColor === '{READY_RGB}');",
            timeout=30),

        # --- restore. ONE click only: the legend is a TOGGLE
        # (`c === status ? '' : status`), so a second deselect RE-SELECTS Ready. Removing the
        # exclusion leg on 2026-08-20 left two of these behind and the restore assertion duly
        # failed with Ready still marked - the deletion, not the logic, was the bug.
        step("click", "Deselect Ready (the legend toggles)",
             {"element": xpath_el(WORK_URL, legend("Ready"))}, timeout=30, always=True),
        step("wait", "Let the list restore", {"value": 3}, always=True),
        jsassert("RESTORED: nothing in the legend is marked selected",
                 "return [...document.querySelectorAll('li mark')].length === 0;",
                 always=True, timeout=30),
        step("assertElementPresent", "RESTORED: the unfiltered list is back",
             {"element": xpath_el(WORK_URL, WORK_ROW + "[1]")}, timeout=60, always=True),
    ],
    ["Mobile", "env:dev", "Work Order", "read-only"],
))

# ---------------------------------------------------------------- wire into MOB.986
suite_path = os.path.join(HERE, "MOB.986_WorkOrders_Extra_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
CHILD = "MOB.342_Work_Status_Ring"
if CHILD not in [s.get("name") for s in steps]:
    steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                  "isCritical": True, "name": CHILD, "noScreenshot": False,
                  "type": "playSubTest",
                  "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"added {CHILD} to MOB.986_WorkOrders_Extra_Suite")

print("wrote MOB.342 (work status ring, rebuilt)")
