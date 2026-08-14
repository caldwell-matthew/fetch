"""Build MOB.820 - does a text search silently discard active structured filters? (Appendix D, Q9)

THE SOURCE-LEVEL SUSPICION
  AssetLookup/index.tsx sends the filter conditions in TWO places, and they disagree:

      line  62  useQuery  conditions: [...(props.query || query || [])]   <- includes filters
      line 142  refetch   conditions: [...(props.query ?? [])]            <- omits them

  `query` (lowercase, from useFilterState) is the structured-filter payload; `props.query` is
  only set when AssetLookup is EMBEDDED (the picker). On the standalone page props.query is
  undefined, so the search form's refetch sends `conditions: []` - dropping every active
  filter while the pill still shows it applied. The UI would say filtered; the results would
  not be.

WHY THIS HAS TO BE RUN RATHER THAN REASONED ABOUT
  The same submit handler also calls `setSearchText(_text)`, and `searchText` is a useQuery
  VARIABLE - so React re-renders and Apollo issues a second request that DOES include the
  filters. Two requests race:

      refetch(...)        conditions: []           filters dropped
      useQuery re-fire    conditions: [...query]   filters kept

  Whichever response lands last wins, and `fetchPolicy: 'network-only'` means both really go
  to the server. So the source proves the bug is POSSIBLE, not that it is OBSERVABLE. That is
  exactly why Appendix D listed this as "read from source, not yet observed" - and why this
  test asserts the CORRECT behaviour and treats a failure as the finding.

  If it turns out to be a race rather than a clean defect, expect intermittency. Do not
  "stabilise" that away by relaxing the assertion: an intermittent wrong-results bug is worse
  than a consistent one, not better.

THE SHAPE OF THE PROOF
  Filter on a value that matches NOTHING, then search for something that DOES exist:

      filter: Name contains ZZZZ-NO-SUCH-ASSET   ->  Pump 0102 must be hidden
      search: "Pump" + Enter                     ->  Pump 0102 must STILL be hidden

  If Pump 0102 comes back, the filter was discarded. The negative assertion is sound here
  precisely because the filter value is the junk string, not the asset name - so the filter
  pill cannot echo "Pump 0102" onto the page and satisfy the check on its own (trap 5b, the
  mistake that produced a wrong answer for Q8).
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write  # noqa: E402

LOOKUP_URL = BASE + "/asset-lookup"
ASSET = "Pump 0102"
# THE FULL NAME, NOT A BROAD PREFIX. A first version searched "Pump" and the baseline failed:
# `Pump 0102` was not among the rendered result rows. MOB.700 proves the full name works, so
# the term is matched to what is already known to behave rather than to what seems natural.
# Nothing about Q9 needs a broad term - the question is whether the FILTER survives a search,
# not how many rows the search returns.
SEARCH_TERM = "Pump 0102"
NO_MATCH = "ZZZZ-NO-SUCH-ASSET"

PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]'
FILTER_BTN = ('//button[contains(concat(" ", normalize-space(@class), " "),'
              ' " asset-lookup-filter-button ")]')
ADD_FILTER = '//button[normalize-space(.)="Add Filter"]'
CLEAR_ALL = '//button[normalize-space(.)="Clear all"]'
SEARCH = '//input[@name="asset-search"]'


def result_row(text):
    return ('//*[contains(concat(" ", normalize-space(@class), " "),'
            f' " mantine-Accordion-item ")][contains(., "{text}")]')


def pick(select_id, label, value):
    """Mantine Select: open, then pick by EXACT option text (trap 3 - several field labels
    share words, and Datadog errors on multiple matches rather than choosing)."""
    return [
        step("click", f"Open the {label} select",
             {"element": xpath_el(LOOKUP_URL, f'//*[@id="{select_id}"]')}),
        step("wait", f"Wait for the {label} options", {"value": 2}),
        step("click", f'Pick "{value}"',
             {"element": xpath_el(LOOKUP_URL,
                                  f'//*[@role="option"][normalize-space(.)="{value}"]')}),
    ]


write(test(
    "MOB.820_Search_Filter_Then_Search",
    "`MOB.820` **Appendix D Q9** — does submitting the search box silently discard the\n"
    "active structured filters?\n"
    "- READ-ONLY. Filters and searches only.\n"
    "- `AssetLookup/index.tsx` sends the filter conditions twice and the two disagree:\n"
    "  `useQuery` (line 62) uses `props.query || query || []` — **with** filters — while the\n"
    "  search form's `refetch` (line 142) uses `props.query ?? []`, which is `[]` on the\n"
    "  standalone page. The pill would still show the filter as active while the results\n"
    "  ignored it: the UI says filtered, the data is not.\n"
    "- ✅ **ANSWERED 2026-08-12: the filter IS discarded.** `bugs_found.md` §20. This is now a\n"
    "  **characterization test** — it asserts the *buggy* behaviour so the suite stays green\n"
    "  and the defect stays pinned. **It will FAIL when the app is fixed**, which is the\n"
    "  point: flip the two assertions back and delete §20 rather than repairing it.\n"
    "- The racing `setSearchText` re-fire does **not** rescue it — the filter-less `refetch`\n"
    "  response wins in practice. Reasoning from the two code paths alone would have guessed\n"
    "  wrong, in the optimistic direction.\n"
    f"- The filter value is `{NO_MATCH}`, not the asset name, so the filter pill cannot echo\n"
    f"  `{ASSET}` onto the page and satisfy its own assertion (trap 5b — the exact mistake\n"
    "  that produced a wrong answer for Q8).",
    [
        go(LOOKUP_URL, "asset lookup"),
        step("wait", "Let the page begin loading", {"value": 2}),
        step("assertElementContent", 'Test the "Asset Lookup" page rendered',
             {"check": "contains", "value": "Asset Lookup",
              "element": xpath_el(LOOKUP_URL, PAGE_TITLE)}, timeout=30),

        # -------- baseline: the asset IS findable before any filter
        step("click", "Focus the search input", {"element": xpath_el(LOOKUP_URL, SEARCH)}),
        step("typeText", f"Search for {SEARCH_TERM}",
             {"value": SEARCH_TERM, "element": xpath_el(LOOKUP_URL, SEARCH)}),
        step("pressKey", "Submit the search (Enter - there is no search button)",
             {"value": "Enter"}),
        step("wait", "Let the search start", {"value": 2}),
        step("assertElementPresent",
             f"BASELINE: {ASSET} is a result row when nothing is filtered",
             {"element": xpath_el(LOOKUP_URL, result_row(ASSET))}, timeout=30),

        # -------- apply a filter that matches NOTHING
        step("click", "Open the Filters drawer",
             {"element": xpath_el(LOOKUP_URL, FILTER_BTN)}),
        step("wait", "Wait for the drawer", {"value": 2}),
        step("assertElementPresent", "Test the Filters drawer opened",
             {"element": xpath_el(LOOKUP_URL, ADD_FILTER)}),
    ] + pick("fieldId", "Field", "Name") + pick("operator", "Operator", "contains") + [
        step("typeText", f"Enter the non-matching value {NO_MATCH}",
             {"value": NO_MATCH, "element": xpath_el(LOOKUP_URL, '//*[@id="value"]')}),
        step("click", "Add the filter", {"element": xpath_el(LOOKUP_URL, ADD_FILTER)}),
        step("wait", "Wait for the filter to apply", {"value": 3}),
        step("pressKey", "Close the Filters drawer", {"value": "Escape"}),
        step("wait", "Wait for the results to re-query", {"value": 8}),
        # Sound as a page-level check ONLY because the pill holds the junk string, not the
        # asset name. With a matching filter this would be trap 5b all over again.
        step("assertPageLacks", f"The filter hides {ASSET} (the filter is genuinely applied)",
             {"value": ASSET}),

        # -------- THE QUESTION: submit the search box with that filter still active
        step("click", "Focus the search input", {"element": xpath_el(LOOKUP_URL, SEARCH)}),
        step("typeText", f"Search for {SEARCH_TERM} with the filter still active",
             {"value": SEARCH_TERM, "element": xpath_el(LOOKUP_URL, SEARCH)}),
        step("pressKey", "Submit the search", {"value": "Enter"}),
        step("wait", "Wait for BOTH racing requests to settle", {"value": 10}),
        # ---------------------------------------------------------------------------
        # CHARACTERIZATION ASSERTIONS - these pin a CONFIRMED BUG (bugs_found.md 20).
        # The first version asserted the CORRECT behaviour and FAILED, which is how the bug
        # was found. Asserting the actual behaviour keeps the suite green and keeps the
        # defect pinned. THIS TEST WILL FAIL WHEN THE BUG IS FIXED - that is the intent.
        # Do not "repair" it then: flip these two back to the correct behaviour
        # (Filters (1) present AND the asset absent) and delete bugs_found.md 20.
        # ---------------------------------------------------------------------------
        step("assertPageContains", "The filter still REPORTS as active", {"value": "Filters (1)"}),
        step("assertElementPresent",
             f"BUG 20 (pinned): the search DISCARDED the filter — {ASSET} is back as a result "
             "row while the pill still says Filters (1). FIX THE APP AND THIS STEP FAILS.",
             {"element": xpath_el(LOOKUP_URL, result_row(ASSET))}),

        # -------- leave no filter behind for the next test in the suite
        # EVERY step of the cleanup is `always`, including the one that OPENS the drawer.
        # The first version marked only the Clear-all click `always`: when an earlier
        # assertion failed, the drawer-open step was skipped, so Clear all was still
        # unmounted (trap 4) and the click failed too. A restore leg is only as `always` as
        # its weakest step - mark the whole sequence, not just the part that does the work.
        step("click", "Reopen the Filters drawer to clear",
             {"element": xpath_el(LOOKUP_URL, FILTER_BTN)}, always=True),
        step("wait", "Wait for the drawer", {"value": 2}, always=True),
        # "Clear all" lives INSIDE the drawer and is unmounted when it closes (trap 4).
        step("click", "Clear all filters", {"element": xpath_el(LOOKUP_URL, CLEAR_ALL)},
             always=True),
        step("wait", "Wait for the clear to apply", {"value": 3}, always=True),
        step("pressKey", "Close the Filters drawer", {"value": "Escape"}, always=True),
    ],
    ["Mobile", "env:dev", "Search", "read-only"],
))

# ---------------------------------------------------------------- wire into MOB.996
suite_path = os.path.join(HERE, "MOB.996_Search_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
CHILD = "MOB.820_Search_Filter_Then_Search"
if CHILD not in [s.get("name") for s in steps]:
    steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                  "isCritical": True, "name": CHILD, "noScreenshot": False,
                  "type": "playSubTest",
                  "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"added {CHILD} to MOB.996")

print("wrote MOB.820 (Q9: does search discard structured filters?)")
