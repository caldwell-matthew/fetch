"""Build MOB.855_MaterialLookup_Column_Sort - the column-header sort and the match count
(checklist 🟢 #13).

WHAT IS PROVEN, AND HOW A SORT IS PROVEN HONESTLY
  `MaterialLookup/index.tsx` renders a `Th` per column whose button refetches with `sortId` set
  to that column and `sortDir` FLIPPING when the same column is clicked twice; the header whose
  `columnId` matches `pageInfo.sort` shows a chevron (`chevron-up` for ASC, `chevron-down` for
  DESC). `Bins`' handler is `console.log` - dead - so it is not clicked.

  The chevron is the app's own statement of the current sort; the ORDER of the rendered `Qty`
  column is the proof that the server honoured it. Each leg asserts BOTH: the chevron is on
  `Qty` with the expected direction, AND the parsed quantities are monotonic that way. A sort test
  that reads only the chevron would pass on a server that ignores `sortDir` (`MOB.580`'s lesson:
  compare positions, not the icon).

  ⚠️ VACUOUS-ORDER GUARD. Ascending and descending are BOTH true of a column whose values are all
  equal, so the fixture guard requires >= 2 rows and >= 2 DISTINCT quantities in the storeroom.
  It is `soft` (goes red, does not abort the suite) because it is a claim about fixture data.

  Quantities render through `formatNumber` (thousands separators), so they are parsed with the
  separators stripped, and the `Qty` column INDEX is found from the header row rather than
  assumed - the leading action column exists only when `storeRoom.permissions.canAdjust` is on.

THE MATCH COUNT
  `${data.results.pageInfo.totalCount} matches` renders above the table, but the query is
  `limit: 500` with no paging - MEASURED: 996 matches, 500 rows (bugs §33). So the cross-check is
  rows == min(matches, 500): a real relation in both regimes, not a presence test.

READ-ONLY. Sorting refetches; it writes nothing and persists nothing (`inputText` and the sort
live in React state, so a reload resets both). The sort is put back on `Material Item` on the
way out anyway, with `alwaysExecute`, so `MOB.998`'s later children see the default order.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

MATERIAL_URL = BASE + "/material-lookup"
STOREROOM = "Central Storeroom"
PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]'
STOREROOM_SELECT = '//*[@id="storeroomLocationId"]'


def option(text):
    return f'//*[@role="option"][contains(normalize-space(.), "{text}")]'


def header_button(label):
    return f'//th[.//*[normalize-space(.)="{label}"]]//button'


# Shared JS prelude: the table, the header labels, the Qty column index, the parsed quantities.
TABLE_JS = (
    "const table = document.querySelector('table');\n"
    "if (!table) return false;\n"
    "const heads = [...table.querySelectorAll('thead th')].map(h => (h.textContent || '').trim());\n"
    "const qi = heads.indexOf('Qty');\n"
    "if (qi < 0) return false;\n"
    "const rows = [...table.querySelectorAll('tbody tr')];\n"
    "const qty = rows.map(r => {\n"
    "  const td = r.querySelectorAll('td')[qi];\n"
    "  return td ? Number((td.textContent || '').replace(/[^0-9.\\-]/g, '')) : NaN;\n"
    "});\n"
    "if (qty.some(n => Number.isNaN(n))) return false;\n")


def chevron_js(label, icon):
    """The header for `label` carries `icon` (chevron-up / chevron-down) and no other header carries any."""
    return (
        "const ths = [...table.querySelectorAll('thead th')];\n"
        f"const th = ths.find(h => (h.textContent || '').trim() === '{label}');\n"
        "if (!th) return false;\n"
        f"const mine = th.querySelector('[data-icon=\"{icon}\"], .fa-{icon}');\n"
        "const others = ths.filter(h => h !== th)\n"
        "  .some(h => h.querySelector('[data-icon=\"chevron-up\"], [data-icon=\"chevron-down\"],"
        " .fa-chevron-up, .fa-chevron-down'));\n"
        "if (!mine || others) return false;\n")


MONO_ASC = "return qty.every((v, i) => i === 0 || qty[i - 1] <= v);"
MONO_DESC = "return qty.every((v, i) => i === 0 || qty[i - 1] >= v);"

steps = [
    go(MATERIAL_URL, "material lookup"),
    step("wait", "Wait for the page to mount", {"value": 6}),
    step("assertElementContent", 'Test the "Material Lookup" page rendered',
         {"check": "contains", "value": "Material Lookup",
          "element": xpath_el(MATERIAL_URL, PAGE_TITLE)}, timeout=30),
    step("click", "Open the storeroom dropdown",
         {"element": xpath_el(MATERIAL_URL, STOREROOM_SELECT)}, timeout=30),
    step("wait", "Wait for storeroom options", {"value": 2}),
    step("click", f"Pick {STOREROOM}", {"element": xpath_el(MATERIAL_URL, option(STOREROOM))},
         timeout=30),
    step("wait", "Wait for the material list to load", {"value": 8}),

    jsassert("FIXTURE GUARD: >= 2 rows and >= 2 DISTINCT quantities — without that, both sort "
             "directions are vacuously true",
             TABLE_JS + "return rows.length >= 2 && new Set(qty).size >= 2;",
             timeout=30, soft=True),
    # ⚠️ MEASURED 2026-09-09: `Central Storeroom` holds 996 items and the query is `limit: 500`
    # with no paging, so 500 rows render under a label reading `996 matches` (bugs §33). The
    # honest cross-check is therefore rows == min(matches, 500): equality below the cap, and the
    # cap itself above it. A label that disagreed with BOTH would still fail.
    jsassert("⭐ MATCH COUNT: rendered rows == min(`N matches`, 500) — the query's `limit`",
             TABLE_JS +
             "const m = (document.body.textContent || '').match(/(\\d[\\d,]*)\\s+matches/);\n"
             "if (!m) return false;\n"
             "const matches = Number(m[1].replace(/,/g, ''));\n"
             "const limit = 500;   // MOBILE_MATERIAL_ITEM_LOOKUP params.limit, no paging\n"
             "return rows.length === Math.min(matches, limit);", timeout=30),
    jsassert("BASELINE: the sort chevron sits on `Material Item`, ascending, and on no other header",
             TABLE_JS + chevron_js("Material Item", "chevron-up") + "return true;", timeout=30),

    # ---- leg 1: Qty ascending ---------------------------------------------------------------
    step("click", 'Click the "Qty" header (first click = ASC)',
         {"element": xpath_el(MATERIAL_URL, header_button("Qty"))}, timeout=30),
    step("wait", "Let the sorted refetch land", {"value": 4}),
    jsassert("⭐ ASC: the chevron is on `Qty` pointing up AND the column really is non-decreasing",
             TABLE_JS + chevron_js("Qty", "chevron-up") + MONO_ASC, timeout=30),

    # ---- leg 2: Qty descending — the same column must now come out the other way ------------
    step("click", 'Click the "Qty" header again (same column = flip to DESC)',
         {"element": xpath_el(MATERIAL_URL, header_button("Qty"))}, timeout=30),
    step("wait", "Let the sorted refetch land", {"value": 4}),
    jsassert("⭐ DESC: the chevron is on `Qty` pointing down AND the column really is non-increasing",
             TABLE_JS + chevron_js("Qty", "chevron-down") + MONO_DESC, timeout=30),

    # ---- restore ------------------------------------------------------------------------------
    step("click", 'RESTORE: click "Material Item" to put the default sort back',
         {"element": xpath_el(MATERIAL_URL, header_button("Material Item"))}, always=True,
         timeout=30),
    step("wait", "Let the refetch land", {"value": 4}, always=True),
    jsassert("RESTORED: the chevron is back on `Material Item`, ascending",
             TABLE_JS + chevron_js("Material Item", "chevron-up") + "return true;",
             always=True, timeout=30),
]

write(test(
    "MOB.855_MaterialLookup_Column_Sort",
    "`MOB.855` **Column-header sort really reorders, and the match count is real.**\n"
    "- READ-ONLY; sorting only refetches, and the default sort is put back on the way out.\n"
    "- ⭐ **Each leg asserts the app's own chevron AND the rendered order.** The chevron says\n"
    "  what was asked for; the parsed `Qty` column being monotonic proves the server honoured it.\n"
    "  A chevron-only check would pass on a server that ignores `sortDir` (`MOB.580`'s lesson).\n"
    "- ⚠️ **Vacuous-order guard**: both directions are true of an all-equal column, so the fixture\n"
    "  guard requires >= 2 rows and >= 2 distinct quantities in `Central Storeroom`.\n"
    "- The `Qty` column index is read from the header row, not assumed — the leading action\n"
    "  column exists only with `canAdjust`. Quantities are parsed with `formatNumber`'s\n"
    "  separators stripped.\n"
    "- ⭐ `N matches` vs rendered rows: rows == min(matches, 500) — the storeroom has 996 items\n"
    "  and the query is capped at 500 with no paging (bugs §33).\n"
    "- `Bins` is not clicked: its handler is `console.log` (dead).",
    steps,
    tags=["Mobile", "env:dev", "Material Lookup", "Sort", "read-only"],
))
print("wrote MOB.855 (material lookup column sort + match count)")
