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
from dd_tools import (BASE, HERE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      open_filters_drawer, pick_option)

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
    # The visibility gate lives in `dd_tools.pick_option` - ONE copy (MOB.969, 2026-09-16).
    return pick_option(LOOKUP_URL, select_id, label, value, pick_name=f'Pick "{value}"')


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
    "- ✅ **ANSWERED: the filter now SURVIVES the search.** It did not until `02b17aa82e`\n"
    "  (2026-09-17), which gave the submit `refetch` the same `buildParams(1, [...])` the\n"
    "  hook uses; before that it refetched with no conditions and the pill lied. The test\n"
    "  pinned that bug as `bugs_found.md` §20 and went red the first time it ran against the\n"
    "  fix (2026-09-23, under Playwright), which is exactly what it was for. It now asserts\n"
    "  the correct behaviour, and §20 is gone.\n"
    "- ⚠️ The same `refetch` still sends `jobLookup: { jobId: \'??\' }` instead of\n"
    "  `props.jobId` (`index.tsx:171`). That only bites where Asset Lookup is embedded with a\n"
    "  job — `AssetVerification/NewAssetForm` — so this standalone test cannot see it.\n"
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
        *open_filters_drawer(LOOKUP_URL),
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
        step("pressKey", "Select the baseline search first (typeText APPENDS — trap 17; a local replay typed "
             "`Pump 0102Pump 0102`)", {"value": "a", "modifiers": ["Control"]}),
        step("typeText", f"Search for {SEARCH_TERM} with the filter still active",
             {"value": SEARCH_TERM, "element": xpath_el(LOOKUP_URL, SEARCH)}),
        step("pressKey", "Submit the search", {"value": "Enter"}),
        step("wait", "Wait for BOTH racing requests to settle", {"value": 10}),
        # ---------------------------------------------------------------------------
        # THE FIXED BEHAVIOUR. Until 2026-09-17 these two pinned the bug instead: the search
        # discarded the filter and the asset came back while the pill still said Filters (1).
        # `02b17aa82e` gave the submit refetch the filter conditions (`buildParams(1, [...])`
        # on `AssetLookup/index.tsx:173`), so submitting now KEEPS the filter, and the test
        # asserts that - what it was written to assert in the first place.
        # ---------------------------------------------------------------------------
        step("assertPageContains", "The filter still REPORTS as active", {"value": "Filters (1)"}),
        jsassert(f"The filter SURVIVED the search — no result row for {ASSET} while the pill "
                 "says Filters (1)",
                 "const rows = [...document.querySelectorAll('[class*=\"mantine-Accordion-item\"]')];\n"
                 f"return !rows.some(r => (r.textContent || '').includes({ASSET!r}));",
                 timeout=30),

        # -------- leave no filter behind for the next test in the suite
        # EVERY step of the cleanup is `always`, including the one that OPENS the drawer.
        # The first version marked only the Clear-all click `always`: when an earlier
        # assertion failed, the drawer-open step was skipped, so Clear all was still
        # unmounted (trap 4) and the click failed too. A restore leg is only as `always` as
        # its weakest step - mark the whole sequence, not just the part that does the work.
        step("click", "Reopen the Filters drawer to clear",
             {"element": xpath_el(LOOKUP_URL, FILTER_BTN)}, always=True, timeout=30),
        step("wait", "Wait for the drawer", {"value": 2}, always=True),
        # "Clear all" lives INSIDE the drawer and is unmounted when it closes (trap 4).
        step("click", "Clear all filters", {"element": xpath_el(LOOKUP_URL, CLEAR_ALL)},
             always=True),
        step("wait", "Wait for the clear to apply", {"value": 3}, always=True),
        step("pressKey", "Close the Filters drawer", {"value": "Escape"}, always=True),
    ],
    ["Mobile", "env:dev", "Search", "read-only"],
))


print("wrote MOB.820 (Q9: does search discard structured filters?)")
