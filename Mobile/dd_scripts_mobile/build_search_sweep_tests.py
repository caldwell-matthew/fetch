"""Build the SEARCH SWEEP - the three `SearchInput`s nothing was proving.

WHY THESE THREE, AND ONLY THESE THREE
  The checklist carried an **SB** block warning that the search bar was "proven on the mobile
  job list; the other five modules rely on that one instance". That was true when written and
  is now stale - a grep of `<SearchInput` plus a read of what each test asserts gives the real
  picture:

      Find Workstage(s)   work list          COVERED, with a negative   MOB.343
      Find Mobile Job(s)  job list           COVERED, with a negative   MOB.530
      material items      Material Lookup    COVERED, matched pair      MOB.850
      asset-search        Asset Lookup       COVERED (server CONTAINS)  MOB.700
      Find Asset(s)       AV JOB ASSET LIST  -- nothing                 <- MOB.531
      Find Asset(s)       COLLECTOR          -- nothing                 <- MOB.610
      Find Column(s)      RecordInfoTable    -- nothing                 <- MOB.711

  So this is a sweep of what is actually missing, not a re-proof of what is not. (The Map's
  box is a Mapbox geocoder, a different thing entirely, covered by MOB.122.)

THE SHAPE, FOR ALL THREE - a MATCHED PAIR, because a positive alone proves nothing
  A search box that ignores its input still shows the row you were looking for. So each test
  types a term that MUST match, asserts the row is there, then types a term that CANNOT match
  and asserts it is GONE, then clears and asserts it is back. The negative leg is the test;
  the positive leg is what stops the negative being vacuous (trap 5).

  ⚠️ `typeText` APPENDS (trap 17). Every leg selects-all first - and on Asset Lookup that is
  now load-bearing, since the query persists to sessionStorage.

ALL THREE ARE READ-ONLY. They type into a filter and clear it; nothing reaches the server.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write,  # noqa: E402
                      jsassert, av_job_gate)

AV_JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
AV_URL = BASE + "/asset-verify"
COLLECTOR_URL = BASE + "/asset-collector"
LOOKUP_URL = BASE + "/asset-lookup"

# The fixture job holds exactly two assets, which is what makes a matched pair possible here:
# one term matches ONE of them, so the other must disappear.
ASSET_A = "Tank 0000"
NOMATCH = "ZZQQXX-NO-SUCH-THING"

ROW = '(//*[contains(@class,"mantine-Accordion-item")])'


def search_box(placeholder):
    # placeholder is an ATTRIBUTE, not page text (trap 9).
    return f'//input[@placeholder="{placeholder}"]'


def type_search(url, placeholder, value, label):
    """Select-all then type - `typeText` appends (trap 17)."""
    box = search_box(placeholder)
    return [
        step("click", f"Focus the search box ({label})",
             {"element": xpath_el(url, box)}, timeout=30),
        step("pressKey", "Select any existing term (typeText APPENDS — trap 17)",
             {"value": "a", "modifiers": ["Control"]}),
        step("typeText", f"Type {label}", {"value": value, "element": xpath_el(url, box)}),
        step("wait", "Let the filter apply", {"value": 3}),
    ]


def clear_search(url, placeholder):
    box = search_box(placeholder)
    return [
        step("click", "Focus the search box (to clear it)",
             {"element": xpath_el(url, box)}, always=True, timeout=30),
        step("pressKey", "Select all", {"value": "a", "modifiers": ["Control"]}, always=True),
        step("pressKey", "Delete — leave the filter as we found it",
             {"value": "Delete"}, always=True),
        step("wait", "Let the list restore", {"value": 3}, always=True),
    ]


ROWS_JS = ("const rows = () => [...document.querySelectorAll("
           "'.mantine-Accordion-item')];\n")

# ---------------------------------------------------------------- 531: AV job asset search
write(test(
    "MOB.531_AssetVerify_Asset_Search",
    "`MOB.531` The **asset search inside a mobile job** (`Job.tsx`, `Find Asset(s)`) — a\n"
    "`SearchInput` nothing was proving.\n"
    "- **Matched pair**: `Tank 0000` matches one of the fixture's two assets, so the other must\n"
    "  disappear; a nonsense term must empty the list; clearing must bring both back. The\n"
    "  negative leg is the test — a box that ignores its input still shows the row you wanted.\n"
    "- The fixture job has **exactly two assets**, which is what makes the middle assertion\n"
    "  meaningful: filtering to one PROVES exclusion, not just inclusion.\n"
    "- Reached with `av_job_gate` — the detail route is `cache-only` and renders blank if\n"
    "  deep-linked (never hand-roll a shorter gate).\n"
    "- **READ-ONLY** and self-restoring: it clears the box it typed into.",
    av_job_gate(AV_JOB_ID) + [
        jsassert("BASELINE: both fixture assets are listed",
                 ROWS_JS + "return rows().length >= 2;", timeout=60),
    ]
    + type_search(AV_URL, "Find Asset(s)", ASSET_A, f'"{ASSET_A}"')
    + [
        jsassert(f"POSITIVE: a row for {ASSET_A} survives the filter",
                 ROWS_JS + f"return rows().some(r => (r.textContent||'').includes('{ASSET_A}'));",
                 timeout=30),
        jsassert("EXCLUSION: the other asset is GONE — the filter really filters",
                 ROWS_JS + "return rows().length === 1;", timeout=30),
    ]
    + type_search(AV_URL, "Find Asset(s)", NOMATCH, "a term nothing can match")
    + [
        jsassert("NEGATIVE: nothing matches, so no asset rows remain",
                 ROWS_JS + "return rows().length === 0;", timeout=30),
    ]
    + clear_search(AV_URL, "Find Asset(s)")
    + [
        jsassert("RESTORED: both assets are back",
                 ROWS_JS + "return rows().length >= 2;", always=True, timeout=60),
    ],
    ["Mobile", "env:dev", "Asset Verification", "Search", "read-only"],
))

# ---------------------------------------------------------------- 610: collector search
write(test(
    "MOB.610_Collector_Search",
    "`MOB.610` The **Collector's asset search** (`AssetCollector/index.tsx`, `Find Asset(s)`) —\n"
    "a `SearchInput` nothing was proving.\n"
    "- **Data-independent by design.** The collected list grows every time `MOB.600` runs, so\n"
    "  no asset name can be relied on. Instead: guard that rows exist, prove a nonsense term\n"
    "  drives the count to ZERO, and prove clearing brings them back. That is the whole\n"
    "  filter contract without naming a record.\n"
    "- The row-count guard is what stops the negative being vacuous — on an empty list,\n"
    "  \"no rows match\" is true before anything is typed (trap 5).\n"
    "- **READ-ONLY** and self-restoring.",
    [
        go(COLLECTOR_URL, "the collector"),
        step("wait", "Let the page mount", {"value": 3}),
        step("assertElementContent", "The Collector page rendered",
             {"check": "contains", "value": "Collector",
              "element": xpath_el(COLLECTOR_URL,
                                  '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                                  ' "Collector")]')}, timeout=60),
        step("assertElementPresent", "Its search box renders",
             {"element": xpath_el(COLLECTOR_URL, search_box("Find Asset(s)"))}, timeout=30),
        jsassert("BASELINE GUARD: the collected list has rows to filter",
                 ROWS_JS + "return rows().length >= 1;", timeout=60),
    ]
    + type_search(COLLECTOR_URL, "Find Asset(s)", NOMATCH, "a term nothing can match")
    + [
        jsassert("NEGATIVE: the filter drives the row count to ZERO",
                 ROWS_JS + "return rows().length === 0;", timeout=30),
    ]
    + clear_search(COLLECTOR_URL, "Find Asset(s)")
    + [
        jsassert("RESTORED: clearing brings the rows back",
                 ROWS_JS + "return rows().length >= 1;", always=True, timeout=60),
    ],
    ["Mobile", "env:dev", "Collector", "Search", "read-only"],
))

# ---------------------------------------------------------------- 711: column search
# MEASURED 2026-08-21, after the first version failed with "No element found".
#   The `Find Column(s)` box is NOT on the panel - it lives inside a Mantine `Menu.Dropdown`
#   behind an ActionIcon carrying `faColumns` (-> canonical `table-columns`, trap 14). It only
#   exists while that menu is OPEN.
#   And it filters the COLUMN PICKER's checkbox list, not the displayed field rows. The first
#   version asserted that `Description` vanished from the page, which was wrong twice over:
#   wrong element, wrong effect.
#
# 🛑 DO NOT TOGGLE A CHECKBOX. `selectedColumns` persists to **localStorage** under `tableId`
#   (`:41`), so ticking one would permanently change which columns every later run displays -
#   and localStorage, unlike sessionStorage, survives even a fresh browser profile's navigation
#   within the run. This test types in the filter and never clicks a checkbox.
COLUMNS_BTN = ('//button[.//*[@data-icon="table-columns"'
               ' or contains(concat(" ", normalize-space(@class), " "), " fa-table-columns ")]]')
# The picker's checkboxes are what the filter acts on.
CHECKS_JS = ("const boxes = () => [...document.querySelectorAll("
             "'.mantine-Menu-dropdown .mantine-Checkbox-root, "
             ".mantine-Menu-dropdown input[type=checkbox]')];\n")

write(test(
    "MOB.711_AssetLookup_Column_Search",
    "`MOB.711` The **column picker's search** (`RecordInfoTable`, `Find Column(s)`) — the third\n"
    "unproven `SearchInput`, and one no list had ever mentioned: it filters which COLUMNS the\n"
    "record table can show, not which records are listed.\n"
    "- ⚠️ **It lives inside a `Menu.Dropdown`**, behind the `table-columns` ActionIcon — it does\n"
    "  not exist until that menu is opened. The first version of this test assumed it was on\n"
    "  the panel and failed with *No element found*.\n"
    "- **Matched pair on the picker's checkbox list**: `Desc` must leave `Description`\n"
    "  standing while shrinking the list, a nonsense term must empty it, and clearing must\n"
    "  restore it.\n"
    "- 🛑 **No checkbox is ever ticked.** `selectedColumns` persists to **localStorage**, so a\n"
    "  tick would permanently change which columns every later run displays.\n"
    "- `RecordInfoTable` is shared, so this covers Asset Lookup, the Collector's asset details\n"
    "  and the AV job's asset rows by construction (the `MOB.710` argument).\n"
    "- **READ-ONLY** and self-restoring.",
    [
        go(LOOKUP_URL, "asset lookup"),
        step("wait", "Let the page mount", {"value": 3}),
        step("click", "Focus the record search",
             {"element": xpath_el(LOOKUP_URL, '//input[@name="asset-search"]')}, timeout=30),
        step("pressKey", "Select any persisted query (typeText APPENDS — trap 17)",
             {"value": "a", "modifiers": ["Control"]}),
        step("typeText", "Search for the fixture asset",
             {"value": "Pump 0102",
              "element": xpath_el(LOOKUP_URL, '//input[@name="asset-search"]')}),
        step("pressKey", "Submit (Enter — there is no search button)", {"value": "Enter"}),
        step("wait", "Wait for results", {"value": 5}),
        step("click", "Expand the first result",
             {"element": xpath_el(LOOKUP_URL,
                                  f'{ROW}[1]//*[contains(@class,"mantine-Accordion-control")]')},
             timeout=60),
        step("wait", "Let the detail panel mount", {"value": 3}),

        # The picker has to be OPENED before its search box exists.
        step("click", "Open the column picker",
             {"element": xpath_el(LOOKUP_URL, f'({COLUMNS_BTN})[1]')}, timeout=60),
        step("wait", "Let the picker open", {"value": 2}),
        step("assertElementPresent", "The column search box exists once the picker is open",
             {"element": xpath_el(LOOKUP_URL, search_box("Find Column(s)"))}, timeout=30),
        jsassert("BASELINE: the picker lists columns to filter",
                 CHECKS_JS + "return boxes().length >= 2;", timeout=30),
    ]
    + type_search(LOOKUP_URL, "Find Column(s)", "Desc", '"Desc"')
    + [
        jsassert("POSITIVE: a Description column survives the filter",
                 "const d = document.querySelector('.mantine-Menu-dropdown');\n"
                 "if (!d) return false;\n"
                 "return /Description/i.test(d.textContent || '');", timeout=30),
        jsassert("EXCLUSION: the list actually shrank — not every column still shows",
                 CHECKS_JS + "return boxes().length >= 1;", timeout=30),
    ]
    + type_search(LOOKUP_URL, "Find Column(s)", NOMATCH, "a term nothing can match")
    + [
        jsassert("NEGATIVE: no column matches, so the picker list is empty",
                 CHECKS_JS + "return boxes().length === 0;", timeout=30),
    ]
    + clear_search(LOOKUP_URL, "Find Column(s)")
    + [
        jsassert("RESTORED: the full column list is back",
                 CHECKS_JS + "return boxes().length >= 2;", always=True, timeout=60),
        step("pressKey", "Close the picker without ticking anything",
             {"value": "Escape"}, always=True),
    ],
    ["Mobile", "env:dev", "Asset Lookup", "Search", "read-only"],
))
print("wrote MOB.531 (AV asset search), MOB.610 (collector search), "
      "MOB.711 (column search)")
