"""Build MOB.721_AssetLookup_Readings_Empty - the Readings tab's empty state (checklist 🟢 #21).

WHAT THE SOURCE SAYS (`AssetLookup/AssetLookupDetails/EventReadings.tsx`, origin/development)
  Outside a work order the tab's `fields` are derived ONLY from the asset's current readings
  (`ASSET_CURRENT_READINGS`) plus types the user adds in the session; with none of either:

      {fields.length === 0 && <Text c="dimmed" p="sm">No readings recorded for this asset.</Text>}

  `MOB.720` covers the tab on an asset WITH readings; nothing asserted the empty branch (the
  rendered-string sweep found the string in no test).

FIXTURE: `⚡ Building 0000` (`wkcJw8pIdJFt1c1BFsZJss`) - 0 latest readings over the API, a
building (no meters to read), and referenced by no other test. NOT an AV job asset: `MOB.550`
writes readings to those, which would make this a drifting fixture.

READ-ONLY. It searches, expands one row, reads one tab. Nothing is typed into a form.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

LOOKUP_URL = BASE + "/asset-lookup"
TARGET = "Building 0000"            # stored as `⚡ Building 0000` - matched by containment (trap 29)
EMPTY = "No readings recorded for this asset."
SEARCH = '//input[@name="asset-search"]'
PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]'


def tok(cls):
    return f'contains(concat(" ", normalize-space(@class), " "), " {cls} ")'


ITEM = (f'(//*[{tok("mantine-Accordion-item")}]'
        f'[.//*[{tok("mantine-Accordion-control")}][contains(., "{TARGET}")]])[1]')
CHEVRON = f'{ITEM}//*[{tok("mantine-Accordion-chevron")}]'
READINGS_TAB = f'{ITEM}//*[@role="tab"][normalize-space(.)="Readings"]'

# The target row's ACTIVE tab panel (the tab strip lives inside the row).
PANEL_JS = (
    "const items = [...document.querySelectorAll('[class*=\"mantine-Accordion-item\"]')];\n"
    "const it = items.find(i => { const c = i.querySelector('[class*=\"mantine-Accordion-control\"]');\n"
    f"  return c && (c.textContent || '').includes('{TARGET}'); }});\n"
    "if (!it) return false;\n"
    "const tabEl = it.querySelector('[role=\"tab\"][aria-selected=\"true\"], [role=\"tab\"][data-active]');\n"
    "const byId = tabEl && tabEl.getAttribute('aria-controls')\n"
    "  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;\n"
    "const p = byId || [...it.querySelectorAll('[role=\"tabpanel\"]')].find(x => x.style.display !== 'none');\n"
    "if (!p || !tabEl) return false;\n"
    "const t = (p.textContent || '');\n")

steps = [
    go(LOOKUP_URL, "Asset Lookup"),
    step("wait", "Wait for the page to mount", {"value": 5}),
    step("assertElementContent", 'Test the "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup", "element": xpath_el(LOOKUP_URL, PAGE_TITLE)},
         timeout=30),
    step("click", "Focus the search input", {"element": xpath_el(LOOKUP_URL, SEARCH)}, timeout=30),
    step("pressKey", "Select any persisted query first (typeText APPENDS — trap 17)",
         {"value": "a", "modifiers": ["Control"]}),
    step("typeText", f"Search for {TARGET}", {"value": TARGET, "element": xpath_el(LOOKUP_URL, SEARCH)}),
    step("pressKey", "Submit the search (Enter)", {"value": "Enter"}),
    step("wait", "Wait for the search results (network-only)", {"value": 8}),
    step("click", f"Expand {TARGET}'s row by its chevron (never the avatar — bugs §35)",
         {"element": xpath_el(LOOKUP_URL, CHEVRON)}, timeout=30),
    step("wait", "Let the detail panel mount", {"value": 3}),
    step("click", 'Open its "Readings" tab', {"element": xpath_el(LOOKUP_URL, READINGS_TAB)}, timeout=30),
    step("wait", "Let the Readings panel render", {"value": 3}),
    jsassert("The ACTIVE tab of the Building 0000 row is `Readings` (the panel below is its own)",
             PANEL_JS + "return (tabEl.textContent || '').trim() === 'Readings';", timeout=30),
    jsassert(f"⭐ EMPTY STATE: the panel reads `{EMPTY}` — the asset has no readings",
             PANEL_JS + f"return t.includes('{EMPTY}');", timeout=30),
]

write(test(
    "MOB.721_AssetLookup_Readings_Empty",
    "`MOB.721` **The Readings tab's empty state** on an asset with no readings.\n"
    f"- `EventReadings.tsx`: outside a work order the fields come only from current readings, so\n"
    f"  with none the panel reads **`{EMPTY}`**. `MOB.720` covers the tab WITH readings.\n"
    f"- Fixture `⚡ {TARGET}` — 0 readings, no meters, used by no other test (not an AV job asset,\n"
    "  which `MOB.550` writes readings to).\n"
    "- 🛑 **READ-ONLY**.",
    steps,
    ["Mobile", "env:dev", "Asset Lookup", "Readings", "read-only"],
))
print("wrote MOB.721 (Readings empty state)")
