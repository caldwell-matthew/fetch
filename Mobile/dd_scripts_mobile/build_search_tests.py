"""Build MOB.996_Search_Suite - the cross-cutting search / filter / sort controls.

WHY THESE LIVE IN THEIR OWN SUITE
  Search, sort and StructuredQuery are not module features; they are shared controls that
  appear on every list screen. Testing them per module would repeat the same work six times
  (the checklist's SB block says as much). Grouping them here also keeps MOB.993 purely
  about verification and obviously self-restoring.

  They still cannot be tested in isolation - the controls only exist inside module screens,
  and proving a filter WORKS needs a known-stable record, which is module-specific:

      simple search/sort   /asset-verify job list   "DATADOG MOBILE JOB"   -> MOB.530
      StructuredQuery      /asset-lookup            "Pump 0102"            -> MOB.800
      simple search        /work list               NOTHING KNOWN-STABLE   -> MOB.340 can
                                                                              only prove the
                                                                              input accepts text

  So the suite is grouped by CONTROL, and each test navigates to whichever screen has a
  provable fixture.

TWO DIFFERENT SYSTEMS - DO NOT CONFLATE THEM
  simple      SearchInput free-text + SortDropDown + status/segment filters. Filters a list
              that is already loaded.
  advanced    StructuredQuery - a field/operator/value builder that constructs SERVER-SIDE
              query conditions. A defect here returns WRONG DATA rather than a visibly
              broken control, which makes it the higher-risk of the two and the reason it is
              worth testing even though it is fiddly.

STRUCTURED QUERY MECHANICS (AssetLookup)
  trigger   <Button class="asset-lookup-filter-button">Filters (N)</Button>
  drawer    Mantine Drawer, title "Filters", containing Field / Operator / Value and a
            SubmitButton labelled "Add Filter"
  applying  `addFilter` calls onChange([...filters, next]) and does NOT close the drawer, so
            the test closes it explicitly. No manual re-search is needed: `filters` feeds the
            useQuery variables, so Apollo re-runs the query when they change.
  clearing  ActiveFilters - and its "Clear all" button - renders INSIDE the Drawer
            (index.tsx:212), so it is unmounted whenever the drawer is closed (trap 4).
            Every clear must happen while the drawer is open. A first attempt clicked it
            after pressing Escape and failed with "No element found".
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write, jsassert  # noqa: E402

LOOKUP_URL = BASE + "/asset-lookup"
ASSET = "Pump 0102"
NO_MATCH = "ZZZZ-NO-SUCH-ASSET"
TAGS = ["Mobile", "env:dev", "Search", "read-only"]

PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]'
FILTER_BTN = '//button[contains(concat(" ", normalize-space(@class), " "), " asset-lookup-filter-button ")]'
ADD_FILTER = '//button[normalize-space(.)="Add Filter"]'
CLEAR_ALL = '//button[normalize-space(.)="Clear all"]'

# THE FILTER PILL CONTAINS THE VALUE YOU FILTERED ON, so a page-text assertion cannot tell
# "the asset is in the results" from "the asset's name is echoed in the active-filter pill".
# ActiveFilters.tsx renders <Pill>{field.label}{operator}{value}</Pill>, so filtering for
# "Pump 0102" puts that string on the page whether or not anything matched. The first version
# of this test asserted page-contains and would have passed against zero results (trap 5).
# Scope the positive assertion to an actual RESULT ROW instead.
def result_row(text):
    return ('//*[contains(concat(" ", normalize-space(@class), " "),'
            f' " mantine-Accordion-item ")][contains(., "{text}")]')


def pick(select_id, label, value):
    """Mantine Select: click to open, then pick by EXACT option text.

    Exact, not contains: the Asset field list contains several labels sharing a word
    ("Name", "System", ...), and a substring match would hit more than one - Datadog errors
    on multiple matches rather than choosing (trap 3).
    """
    return [
        step("click", f"Open the {label} select",
             {"element": xpath_el(LOOKUP_URL, f'//*[@id="{select_id}"]')}),
        step("wait", f"Wait for {label} options", {"value": 2}),
        step("click", f'Pick {label} = "{value}"',
             {"element": xpath_el(
                 LOOKUP_URL, f'//*[@role="option"][normalize-space(.)="{value}"]')}),
    ]


write(test(
    "MOB.800_Search_StructuredQuery",
    "`MOB.800` Build a structured filter on Asset Lookup and prove it filters.\n"
    "- READ-ONLY. Filters are client state feeding query variables; nothing is written.\n"
    "- This is the **advanced** filter system, distinct from the simple search/sort in\n"
    "  MOB.530. It builds SERVER-SIDE query conditions, so a defect returns wrong data\n"
    "  rather than a visibly broken control.\n"
    f"- Proves filtering with a matched pair: `name contains {ASSET}` must SHOW the asset,\n"
    f"  and `name contains {NO_MATCH}` must HIDE it. The negative leg is the one that proves\n"
    "  the filter is actually applied rather than merely accepted.\n"
    "- Each leg runs with EXACTLY ONE filter active — the test clears between them. Adding a\n"
    "  second contradictory filter did not hide the asset, so multi-filter combination is\n"
    "  not AND as assumed; that is an open question, not something to build on.\n"
    "- The positive leg asserts on a RESULT ROW, not page text: the active-filter pill\n"
    "  echoes the value you filtered on, so page-contains would pass against zero results.\n"
    "- The drawer does not close itself after 'Add Filter' (`addFilter` only calls\n"
    "  `onChange`), so the test closes it. No re-search is needed: `filters` feeds the\n"
    "  useQuery variables and Apollo re-runs on change.",
    [
        go(LOOKUP_URL, "asset lookup"),
        step("wait", "Let the page begin loading", {"value": 2}),
        step("assertElementContent", 'Test the "Asset Lookup" page rendered',
             {"check": "contains", "value": "Asset Lookup",
              "element": xpath_el(LOOKUP_URL, PAGE_TITLE)}, timeout=30),

        # -------- build a matching filter
        step("click", "Open the Filters drawer",
             {"element": xpath_el(LOOKUP_URL, FILTER_BTN)}),
        step("wait", "Wait for the drawer", {"value": 2}),
        # "Add Filter" is unique to the drawer; the trigger button itself reads "Filters (N)",
        # so asserting the word "Filters" would match the closed state too (trap 5).
        step("assertElementPresent", "Test the Filters drawer opened",
             {"element": xpath_el(LOOKUP_URL, ADD_FILTER)}),
    ] + pick("fieldId", "Field", "Name") + pick("operator", "Operator", "contains") + [
        step("typeText", f"Enter the value {ASSET}",
             {"value": ASSET, "element": xpath_el(LOOKUP_URL, '//*[@id="value"]')}),
        step("click", "Add the filter", {"element": xpath_el(LOOKUP_URL, ADD_FILTER)}),
        step("wait", "Wait for the filter to apply", {"value": 3}),
        step("pressKey", "Close the Filters drawer", {"value": "Escape"}),
        step("wait", "Let the re-query start", {"value": 2}),
        step("assertElementPresent", f"PROOF: {ASSET} is a RESULT ROW, not just a filter pill",
             {"element": xpath_el(LOOKUP_URL, result_row(ASSET))}, timeout=30),

        # -------- CLEAR FIRST, then test the negative in isolation.
        # The first version added a second, contradictory filter on the same field and
        # asserted the asset disappeared. It did not: with `name contains "Pump 0102"` AND
        # `name contains "ZZZZ..."` both active the asset was still listed, so the two
        # conditions do not combine the way an AND would. Whether that is OR semantics or
        # the second condition being dropped is UNVERIFIED - see Appendix D. Either way the
        # test must not depend on it, so each leg now runs with exactly one filter active.
        step("click", "Reopen the Filters drawer",
             {"element": xpath_el(LOOKUP_URL, FILTER_BTN)}),
        step("wait", "Wait for the drawer", {"value": 2}),
        # "Clear all" lives INSIDE the drawer, so it only exists while the drawer is open.
        step("click", "Clear the matching filter (Clear all is inside the drawer)",
             {"element": xpath_el(LOOKUP_URL, CLEAR_ALL)}),
        step("wait", "Wait for the unfiltered re-query", {"value": 4}),
    ] + pick("fieldId", "Field", "Name") + pick("operator", "Operator", "contains") + [
        step("typeText", "Enter a value that cannot match",
             {"value": NO_MATCH, "element": xpath_el(LOOKUP_URL, '//*[@id="value"]')}),
        step("click", "Add the non-matching filter",
             {"element": xpath_el(LOOKUP_URL, ADD_FILTER)}),
        step("wait", "Wait for the filter to apply", {"value": 3}),
        step("pressKey", "Close the Filters drawer", {"value": "Escape"}),
        step("wait", "Wait for the results to re-query", {"value": 6}),
        # Page-lacks is sound HERE only because the active pill now reads
        # "Name contains ZZZZ-NO-SUCH-ASSET" - it cannot contribute the string being checked.
        # That is exactly why the clear step above is load-bearing: with the previous filter
        # still active its pill would echo "Pump 0102" and this could never pass.
        step("assertPageLacks", f"PROOF: the non-matching filter hides {ASSET}",
             {"value": ASSET}),

        # -------- restore
        step("click", "Reopen the Filters drawer to clear",
             {"element": xpath_el(LOOKUP_URL, FILTER_BTN)}),
        step("wait", "Wait for the drawer", {"value": 2}),
        step("click", "Clear all filters",
             {"element": xpath_el(LOOKUP_URL, CLEAR_ALL)}),
        step("wait", "Wait for the clear", {"value": 2}),
        step("pressKey", "Close the Filters drawer", {"value": "Escape"}),
        step("wait", "Wait for the unfiltered re-query", {"value": 6}),
        step("assertPageContains", "RESTORED: no filters remain",
             {"value": "Filters (0)"}),
        # NB: do NOT assert the asset is visible again here. Clearing filters returns the
        # list to its DEFAULT state - paginated (limit 500, name ASC) with only the first
        # page rendered - so there is no guarantee any particular asset is on screen. The
        # first version asserted it and failed for that reason, not because the clear broke.
        # `Filters (0)` is the honest proof that the restore happened.
    ],
    TAGS + ["StructuredQuery"],
))

# ---------------------------------------------------------------- suite
login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]
# Keep this list COMPLETE. MOB.810 was appended to the suite JSON by hand once, and the
# next DD_FORCE=1 rebuild silently dropped it — the suite then ran green with the test
# missing entirely, which is indistinguishable from it passing (trap 5 / trap 12).
CHILDREN = ["MOB.530_AssetVerify_Search_Filter_Sort",
            "MOB.800_Search_StructuredQuery",
            "MOB.810_Search_Sort_Apply",
            "MOB.820_Search_Filter_Then_Search"]   # keep COMPLETE - trap 12

write(test(
    "MOB.996_Search_Suite",
    "Cross-cutting search / filter / sort controls — **READ-ONLY**, safe to schedule.\n"
    "- Groups the shared controls (the checklist's SB block, plus StructuredQuery) so they\n"
    "  are tested once rather than repeated per module.\n"
    "- The tests still navigate into module screens, because that is where the controls live\n"
    "  and where the known-stable fixtures are: MOB.530 uses the mobile job list, MOB.800\n"
    "  uses Asset Lookup.\n"
    "- MOB.530 moved here out of MOB.993, which is now purely the mutating,\n"
    "  self-restoring verification suite.\n"
    "- subtestPublicId values stay PENDING-WIRE-UP until the children exist on Datadog;\n"
    "  run wire_suite.py after pushing them.",
    login_steps + [step("playSubTest", c,
                        {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1})
                   for c in CHILDREN],
    ["Mobile", "env:dev", "Search", "suite", "read-only"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))

print("wrote MOB.800 (structured query), MOB.996 (search suite)")


# ---------------------------------------------------------------- sort, applied
# THE LAST SB ITEM: "sort options, once".
#
# Labels are built as `${column.label} ${dir === 'ASC' ? '▲' : '▼'}`, so for MobileJob's
# createdAt column they read exactly "Created At ▲" / "Created At ▼".
#
# WHAT THIS PROVES, AND WHAT IT DOES NOT
#   Selecting a sort and reading it back proves the control accepts and RETAINS the choice -
#   and because SortDropDown writes to sessionStorage (`mobile-MobileJob-sort`) while
#   AssetVerification reads it on mount, navigating away and back proves the selection
#   genuinely PERSISTS rather than just sitting in component state.
#   It does NOT prove the list is ordered correctly. That needs two known records in a known
#   order, and only one job in this list is known (Appendix D, Q7). Do not read more into a
#   green run here than that.
#
# NB the assertion reads the control's own value, which is chrome (trap 5b). That is
# legitimate HERE because the control's state is the thing under test - but it is the reason
# this cannot stand in for an ordering assertion.
JOBS_URL_ = BASE + "/asset-verify"
WORK_URL_ = BASE + "/work"
SORT_BTN_ = ('//button[.//*[@data-icon="sort-alt"'
             ' or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ")'
             ' or @data-icon="arrow-down-arrow-up"'
             ' or contains(concat(" ", normalize-space(@class), " "),'
             ' " fa-arrow-down-arrow-up ")]]')
# `FormFieldContainer` uses its `id` as the LABEL's htmlFor, and SortDropDown passes
# `id={''}` to the Select — so NO element carries id="mobile-MobileJob-sort". The first
# version located on that id and found nothing. Scope to the modal instead.
# ...and `//input` inside the modal matches MORE THAN ONE element (Mantine renders a hidden
# companion input alongside the visible Select). Target the Select's own class.
SORT_SELECT = ('//*[contains(concat(" ", normalize-space(@class), " "),'
               ' " mantine-Modal-content ")][contains(., "Sort Criteria")]'
               '//input[contains(concat(" ", normalize-space(@class), " "),'
               ' " mantine-Select-input ")]')
# Read the persisted sort straight out of sessionStorage. SortDropDown writes it there
# (`mobile-<model>-sort`) and AssetVerification reads it back on mount, so this both proves
# the selection took AND that it survives a page load - neither of which the UI exposes as
# page text.
SORT_STORED = ("const raw = sessionStorage.getItem('mobile-MobileJob-sort');\n"
               "if (!raw) return false;\n"
               "return JSON.parse(raw).label === '{}';")
SORT_ASC = "Created At ▲"
SORT_DESC = "Created At ▼"


def open_sort():
    return [
        # POLLS for the sort button (timeout=40) instead of the caller sleeping 25s first.
        # Datadog steps poll until their timeout - measured 58.2s against a 60s limit on
        # 2026-08-13 - so a gate returns as soon as it is satisfied. See Appendix F.
        step("click", "Open the sort dropdown", {"element": xpath_el(JOBS_URL_, SORT_BTN_)},
             timeout=40),
        step("wait", "Wait for the sort modal", {"value": 2}),
        step("assertPageContains", "The Sort Criteria modal opened", {"value": "Sort Criteria"}),
    ]


def choose_sort(label):
    return [
        step("click", "Open the sort options",
             {"element": xpath_el(JOBS_URL_, SORT_SELECT)}),
        step("wait", "Wait for the sort options", {"value": 2}),
        step("click", f'Pick "{label}"',
             {"element": xpath_el(
                 JOBS_URL_, f'//*[@role="option"][normalize-space(.)="{label}"]')}),
        step("wait", "Wait for the sort to apply", {"value": 3}),
        # SortDropDown calls setOpen(false) on selection, so the modal closes itself.
        step("assertPageLacks", "The sort modal closed on selection",
             {"value": "Sort Criteria"}),
    ]


write(test(
    "MOB.810_Search_Sort_Apply",
    "`MOB.810` Apply a sort and prove the choice persists.\n"
    "- READ-ONLY.\n"
    f"- Selects `{SORT_ASC}`, then navigates away and back and re-reads it — proving the\n"
    "  choice survives a page load via `sessionStorage` (`mobile-MobileJob-sort`), not just\n"
    "  that the dropdown accepted a click.\n"
    "- Then switches to the descending option to show both directions are selectable.\n"
    "- **Does NOT verify ordering.** That needs two known records in a known order and only\n"
    "  one job in this list is known (Appendix D, Q7). A green run here means the control\n"
    "  works, not that the list is sorted correctly.\n"
    "- Leaves the sort set for the rest of the browser session. Harmless: no other subtest\n"
    "  asserts on list order.",
    [
        go(JOBS_URL_, "the mobile job list"),
        # 25s -> 5s: open_sort's click polls up to 40s, so the fixed sleep only has to cover
        # initial paint. Appendix F conversion, 2026-08-13.
        step("wait", "Let the page begin loading", {"value": 5}),
    ] + open_sort() + choose_sort(SORT_ASC) + [
        # Mantine Select shows the chosen label inside an <input>, and an input's value is a
        # PROPERTY, not page text - assertPageContains can never see it (trap 9, the same
        # mistake as the placeholder). Read the persisted value directly instead, which is
        # also a stronger claim: it proves the write happened, not that a control looks right.
        jsassert(f'The choice was persisted as "{SORT_ASC}"', SORT_STORED.format(SORT_ASC)),
        # Navigate away and back: sessionStorage is what carries the choice across a mount.
        go(WORK_URL_, "/work"),
        step("wait", "Wait for the work list", {"value": 8}),
        go(JOBS_URL_, "back to the mobile job list"),
        # Kept at 5s rather than 0: the claim is that the choice survived a PAGE LOAD, so the
        # page must actually have started loading before the assertion reads sessionStorage
        # (which persists regardless and would otherwise pass instantly, proving less).
        step("wait", "Let the page begin loading", {"value": 5}),
        jsassert(f'PROOF: "{SORT_ASC}" survived a page load', SORT_STORED.format(SORT_ASC),
                 timeout=40),
    ] + open_sort() + choose_sort(SORT_DESC) + [
        jsassert(f'The descending option applied ("{SORT_DESC}")',
                 SORT_STORED.format(SORT_DESC)),
    ],
    TAGS + ["SB"],
))

print("wrote MOB.810 (sort applied + persisted)")
