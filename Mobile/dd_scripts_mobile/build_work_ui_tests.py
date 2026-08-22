"""Build read-only Work Order UI tests: detail tabs (MOB.330) and search/sort (MOB.340).

Both are NON-MUTATING, deliberately: every other Work Order test we could add next
(charges, condition/failure scores, notes) creates child records, and mobile has no
delete, so those accumulate on the fixture forever. These two add coverage with no
cleanup debt.

MOB.330 - detail tabs
  Tabs come from `template.sections`, which is template-driven, so the labels are not
  knowable from source. The test is therefore written template-agnostically against
  Mantine's Tabs markup: Tabs.Tab renders role="tab" and marks the selected one with
  data-active. InfiniteTabs sets keepMounted={false}, so only the active panel is
  mounted - which is what makes "the tab actually switched" a real assertion rather than
  a cosmetic one.

MOB.340 - search and sort
  - SearchInput placeholder "Find Workstage(s)" (renders unconditionally on /work,
    unlike the Asset Verification one which is data-gated).
  - SortDropDown's trigger is an unlabeled Mantine ActionIcon carrying a faSortAlt icon,
    sitting next to ToggleMapViewButton in the same Group - so it must be located by its
    icon class, not by position.
  - It opens a Modal containing FormFieldContainer label="Sort Criteria".
  - Option labels are `${column.label} ▲` / `▼` (SortDropdown.formatSortValue), NOT
    "Ascending"/"Descending" as the inherited checklist assumed. Columns for WorkStage
    are createdAt, status, _workSequence, priority, targetDueDate.

  HONEST LIMIT: this asserts that searching and sorting execute without breaking the
  list. It does not verify that results are correctly filtered or ordered - that needs
  known fixture records in the crew's work list, which we do not have.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write  # noqa: E402

FIXTURE_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
STAGE_URL = f"{BASE}/work/{FIXTURE_ID}"
WORK_URL = BASE + "/work"
TAB = '//*[@role="tab"]'
SEARCH = '//input[@placeholder="Find Workstage(s)"]'
# faSortAlt is imported from pro-regular-svg-icons, but FontAwesome 6 resolves it to its
# canonical alias arrow-down-arrow-up, so the rendered data-icon/class may use either
# name. Match both rather than betting on one. The neighbouring ToggleMapViewButton uses
# faGlobe/faList, so there is no collision.
SORT_ICONS = ("sort-alt", "arrow-down-arrow-up")
SORT_TRIGGER = ("//button[.//*[" + " or ".join(
    f'@data-icon="{i}" or contains(concat(" ", normalize-space(@class), " "), " fa-{i} ")'
    for i in SORT_ICONS) + "]]")
TAGS = ["Mobile", "env:dev", "Work Order"]

# ---------------------------------------------------------------- detail tabs
write(test(
    "MOB.330_Work_Detail_Tabs",
    "`MOB.330` Work order detail tabs render and switch.\n"
    f"- Deep links to the fixture /work/{FIXTURE_ID}.\n"
    "- Template-agnostic: tab labels come from template.sections and are not knowable\n"
    "  from source, so this asserts against Mantine's role=\"tab\" / data-active markup.\n"
    "- InfiniteTabs uses keepMounted={false}, so only the active panel is mounted and a\n"
    "  tab switch is a genuine state change, not just styling.\n"
    "- Read-only.",
    [
        go(STAGE_URL, "the fixture work order"),
        step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}),
        step("assertElementPresent", "Test a tab strip is rendered",
             {"element": xpath_el(STAGE_URL, f'({TAB})[1]')}),
        step("assertElementPresent", "Test the first tab starts active",
             {"element": xpath_el(STAGE_URL, f'({TAB})[1][@data-active]')}),
        step("click", "Switch to the second tab",
             {"element": xpath_el(STAGE_URL, f'({TAB})[2]')}),
        step("wait", "Wait for the panel to mount", {"value": 2}),
        step("assertElementPresent", "Test the second tab is now active",
             {"element": xpath_el(STAGE_URL, f'({TAB})[2][@data-active]')}),
        step("click", "Switch back to the first tab",
             {"element": xpath_el(STAGE_URL, f'({TAB})[1]')}),
        step("wait", "Wait for the panel to mount", {"value": 2}),
        step("assertElementPresent", "Test the first tab is active again",
             {"element": xpath_el(STAGE_URL, f'({TAB})[1][@data-active]')}),
    ],
    TAGS,
))

# ---------------------------------------------------------------- search & sort
write(test(
    "MOB.340_Work_Search_Sort",
    "`MOB.340` Work order list search and sort controls.\n"
    "- Types into 'Find Workstage(s)' and opens the Sort Criteria modal, asserting each\n"
    "  step executes without breaking the list.\n"
    "- LIMIT: does not verify results are correctly filtered or ordered - that needs\n"
    "  known fixture records in the crew's work list, which we do not have.\n"
    "- The sort trigger is an unlabeled ActionIcon next to the map-view toggle, so it is\n"
    "  located by its faSortAlt icon class rather than by position.\n"
    "- Read-only.",
    [
        go(WORK_URL, "/work"),
        step("assertElementContent", 'Test page title "Work Orders"',
             {"check": "contains", "value": "Work Orders",
              "element": xpath_el(WORK_URL,
                  '//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]')}),
        # Appendix F: 10s -> 3s. The search box appearing IS the readiness signal, so the
        # click polls for it (timeout=30) rather than the test sleeping for a fixed 10s.
        step("wait", "Let the work list begin rendering", {"value": 3}),
        # --- search ---
        step("click", "Focus the search box", {"element": xpath_el(WORK_URL, SEARCH)},
             timeout=30),
        step("typeText", "Type a search term",
             {"value": "a", "element": xpath_el(WORK_URL, SEARCH)}),
        step("wait", "Wait for the 300ms search debounce", {"value": 2}),
        step("assertElementPresent", "Test the search box holds the term",
             {"element": xpath_el(WORK_URL, SEARCH)}),
        # --- sort ---
        step("click", "Open the sort dropdown",
             {"element": xpath_el(WORK_URL, SORT_TRIGGER)}),
        step("assertPageContains", "Test the Sort Criteria modal opened",
             {"value": "Sort Criteria"}),
        step("pressKey", "Dismiss the sort modal", {"value": "Escape"}),
        step("assertPageLacks", "Test the sort modal closed", {"value": "Sort Criteria"}),
    ],
    TAGS,
))

print("wrote MOB.330_Work_Detail_Tabs and MOB.340_Work_Search_Sort (both read-only)")
