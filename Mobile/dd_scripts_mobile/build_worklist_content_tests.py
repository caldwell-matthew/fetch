"""Build MOB.343_Work_List_Search_Filter and MOB.344_Work_List_Row_Navigate - the two work
LIST behaviours that became testable on 2026-08-18 when work orders were assigned to the
`Admin` crew.

BOTH ARE DATA-INDEPENDENT ON PURPOSE
  The crew's list holds 3-4 rows today, all `Ready`, and nobody should have to edit these
  tests when that changes. Neither asserts a record name, a row count, or a status. What
  they assert are INVARIANTS that hold for any non-empty list - which is also what stops
  them decaying back into the vacuous state MOB.340 was in.

MOB.343 - SEARCH ACTUALLY FILTERS
  `MOB.340` types a term and asserts the input holds it. That passed for weeks against an
  EMPTY list (`bugs_found.md` §25), and it would still pass if the filter were deleted: the
  input holding text says nothing about the list.

  The fix is a NEGATIVE that cannot be satisfied by chrome: type a term no record can match
  and require the row count to reach zero, then clear it and require the rows back. Chrome
  echoes the search text (trap 5b), so a page-text assertion is useless here - the row
  count is the only honest signal, and it is read in JS because rows have no test hook.

  Both legs are load-bearing. Alone, "0 rows after a nonsense term" would also pass if the
  list simply never rendered; the restore leg is what proves rows existed to be filtered.

MOB.344 - A ROW OPENS ITS WORK ORDER
  Every existing work-order test reaches the detail page by DEEP LINK
  (`/work/EYRpYJ9QYdQ1JFF10JtB0Q`), which is allowed here because `WorkStageDetails` reads
  its id from `useParams()` and queries directly. But that means the actual user path -
  see the list, tap a row - has never been exercised. This is the standing rule about
  navigating the way a user does, applied to the one module that was exempt from it.

  It also covers a guard that deep-linking skips entirely: `WorkListItem`'s onClick bails
  with `if (!loadedAll || lookupDownloadProgress || downloadingStages.has(...)) return`, so
  a row tapped too early is INERT. `work_list_gate()` is what makes the tap land.

  The assertion is the page title plus `Status:`, not a record name - so any assigned work
  order satisfies it.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, HERE, WORK_URL, WORK_ROW, BACK_ARROW, step, xpath_el,  # noqa: E402
                      test, write, jsassert, work_list_gate)

SEARCH = '//input[@placeholder="Find Workstage(s)"]'
# A term no work order can contain. Deliberately not a real word: the point is a term whose
# zero-result outcome is guaranteed by construction rather than by today's fixture data.
NONSENSE = "ZZQXJV0000"

ROWS_JS = ("const ROWS = () => [...document.querySelectorAll('.mantine-Paper-root')]\n"
           "  .filter(e => (e.textContent || '').includes('Description:'));\n")


# ---------------------------------------------------------------- MOB.343
write(test(
    "MOB.343_Work_List_Search_Filter",
    "`MOB.343` The work list's search box **actually filters the list** (T2.1).\n"
    "- READ-ONLY. `inputText` is component state; nothing is written or persisted.\n"
    "- **This is the test `MOB.340` should have been.** MOB.340 types a term and asserts the\n"
    "  *input* holds it — which passed for weeks against an empty list\n"
    "  (`bugs_found.md` §25) and would still pass if the filter were deleted.\n"
    "- **The proof is a row count, read in JS.** The search box, the sort label and the\n"
    "  status legend all echo their values into the page, so `assertPageContains` on a\n"
    "  search term passes against zero results (trap 5b). Rows have no test hook, so\n"
    "  counting them is a JS step.\n"
    "- **Both legs are load-bearing.** \"0 rows after a nonsense term\" would also pass if\n"
    "  the list never rendered at all; the restore leg is what proves there were rows to\n"
    "  filter (trap 5).\n"
    "- Asserts no record name, count or status, so it does not need editing when the crew's\n"
    "  work list changes.\n"
    "- ⚠️ The search is debounced 300ms (`useDebouncedState`), so each leg waits before\n"
    "  counting.",
    work_list_gate() + [
        jsassert("BASELINE: the unfiltered list has at least one row",
                 ROWS_JS + "return ROWS().length >= 1;", timeout=30),

        step("click", "Focus the search box",
             {"element": xpath_el(WORK_URL, SEARCH)}, timeout=30),
        # typeText APPENDS (trap 17). The box starts empty here, but select-all first so the
        # test is correct if it is ever re-entered with a term already present.
        step("pressKey", "Select any existing text (typeText APPENDS without this)",
             {"value": "a", "modifiers": ["Control"]}),
        step("typeText", f'Type a term nothing can match ("{NONSENSE}")',
             {"value": NONSENSE, "element": xpath_el(WORK_URL, SEARCH)}),
        step("wait", "Wait past the 300ms search debounce", {"value": 3}),
        jsassert("PROOF: the list filtered to ZERO rows — the search really filters",
                 ROWS_JS + "return ROWS().length === 0;", timeout=30),

        step("click", "Focus the search box again",
             {"element": xpath_el(WORK_URL, SEARCH)}, timeout=30, always=True),
        step("pressKey", "Select the nonsense term",
             {"value": "a", "modifiers": ["Control"]}, always=True),
        step("pressKey", "Delete it — restore the unfiltered list",
             {"value": "Delete"}, always=True),
        step("wait", "Wait past the debounce again", {"value": 3}, always=True),
        jsassert("RESTORED: the rows are back — so there WERE rows to filter",
                 ROWS_JS + "return ROWS().length >= 1;", timeout=30, always=True),
    ],
    ["Mobile", "env:dev", "Work Order", "Search", "read-only"],
))

# ---------------------------------------------------------------- MOB.344
write(test(
    "MOB.344_Work_List_Row_Navigate",
    "`MOB.344` Tapping a work row opens that work order (T2.1).\n"
    "- READ-ONLY. Navigation only; nothing is written.\n"
    "- **Every other work-order test reaches the detail page by DEEP LINK.** That is\n"
    "  legitimate — `WorkStageDetails` reads its id from `useParams()` and queries directly,\n"
    "  which is why it is the documented exception to the navigate-like-a-user rule — but it\n"
    "  means the actual user path, *see the list and tap a row*, had never been exercised.\n"
    "- **It covers a guard deep-linking skips entirely.** `WorkListItem`'s onClick bails with\n"
    "  `if (!loadedAll || lookupDownloadProgress || downloadingStages.has(id)) return`, so a\n"
    "  row tapped before the list finishes loading is INERT — the click succeeds and nothing\n"
    "  happens (trap 5). `work_list_gate()` is what makes the tap land.\n"
    "- Asserts the page title and `Status:`, **not** a record name, so any assigned work\n"
    "  order satisfies it and the test survives fixture churn.\n"
    "- The URL check is the real proof of *which* record opened: it must have gained a\n"
    "  `/work/<id>` segment.",
    work_list_gate() + [
        jsassert("BASELINE: we are on the LIST, not a detail page",
                 "return /\\/work\\/?$/.test(location.pathname);", timeout=30),

        step("click", "Tap the first work order in the list",
             {"element": xpath_el(WORK_URL, WORK_ROW + "[1]")}, timeout=30),
        step("wait", "Let the detail route mount", {"value": 5}),

        step("assertElementContent", "PROOF: the Work Orders detail page rendered",
             {"check": "contains", "value": "Work Orders",
              "element": xpath_el(WORK_URL,
                                  '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                                  ' "Work Orders")]')}, timeout=30),
        step("assertPageContains", "The detail view rendered its status control",
             {"value": "Status:"}),
        jsassert("PROOF: the URL gained a /work/<id> segment — a record really opened",
                 "return /\\/work\\/[^/]+$/.test(location.pathname);", timeout=30),

        step("click", "Go back to the list with the header back arrow",
             {"element": xpath_el(WORK_URL, BACK_ARROW)}, timeout=30, always=True),
        step("wait", "Let the list re-render", {"value": 4}, always=True),
        jsassert("RESTORED: back on the work list",
                 "return /\\/work\\/?$/.test(location.pathname);", timeout=30, always=True),
    ],
    ["Mobile", "env:dev", "Work Order", "Navigation", "read-only"],
))

# ---------------------------------------------------------------- wire into MOB.986
suite_path = os.path.join(HERE, "MOB.986_WorkOrders_Extra_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
existing = [s.get("name") for s in steps]
for child in ["MOB.343_Work_List_Search_Filter", "MOB.344_Work_List_Row_Navigate"]:
    if child not in existing:
        steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                      "isCritical": True, "name": child, "noScreenshot": False,
                      "type": "playSubTest",
                      "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
        print(f"added {child} to MOB.986_WorkOrders_Extra_Suite")
with open(suite_path, "w") as f:
    f.write(json.dumps(doc, indent=4))

print("wrote MOB.343 (search filters), MOB.344 (row navigates)")
