"""Build the Asset Lookup tests.

READ-ONLY. Searching and expanding a result mutate nothing, so this suite can run on a
schedule indefinitely - the same property MOB.993 has and MOB.994 does not.

SEARCH IS SUBMITTED BY THE FORM, NOT A BUTTON
  index.tsx wraps the SearchInput in `<form onSubmit={...}>` and there is no search button.
  The visible SubmitButton ("Add N Asset(s)") belongs to the picker flow used when Asset
  Lookup is embedded elsewhere with `assetIds` - it is not the search control. So the test
  types and presses Enter. The inherited checklist's "click search button" step describes a
  control that does not exist on this screen.

FIXTURE
  `Pump 0102` - already proven to exist by the work-order tests (MOB.390/391 attach it), so
  this needs no new dev data. Searching by name is safe here: this lookup queries the server
  with a CONTAINS condition rather than going through the client-side `defaultFilter` that
  carries the case-sensitivity bug (bugs_found.md #1).

TABS ARE THE SAME COMPONENT MOB.520 ALREADY COVERS
  The expanded result renders AssetLookupDetails - the same hardcoded five tabs (General
  Info / Attributes / Photos / Docs / Work History) exercised in the verification job. This
  test therefore only proves the panel MOUNTS here; it does not re-walk every tab. Note the
  inherited checklist lists four tabs and omits Work History.

  Mantine Accordion keeps closed panels mounted, so every result row carries its own tab
  strip. Locators are scoped to the first accordion item - the same fix MOB.520 needed.

NOT COVERED, DELIBERATELY
  Tag Lookup / Scan Barcode - `useBarcodeScanner` plus a `capture: 'environment'` file
  dialog, and captured images are routed through an OpenAI call to read the tag. Camera is
  unreachable from Synthetics and the AI step is non-deterministic even if it were.
  Add Work - creates a permanent work order and exercises the same WorkInsertForm MOB.300
  already covers; the only new behaviour is the asset being pre-filled as defaultAsset.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write  # noqa: E402

LOOKUP_URL = BASE + "/asset-lookup"
ASSET = "Pump 0102"
TAGS = ["Mobile", "env:dev", "Asset Lookup", "read-only"]

PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]'
SEARCH = '//input[@name="asset-search"]'
FIRST_ITEM = '(//*[contains(@class,"mantine-Accordion-item")])[1]'
FIRST_CONTROL = FIRST_ITEM + '//*[contains(@class,"mantine-Accordion-control")]'

write(test(
    "MOB.700_AssetLookup_Search",
    "`MOB.700` Search Asset Lookup by name and open the result.\n"
    "- READ-ONLY: searching and expanding mutate nothing, so this is safe to schedule.\n"
    f"- Searches for `{ASSET}`, which the work-order fixture already guarantees exists.\n"
    "- Submits with Enter: the SearchInput sits in a `<form onSubmit>` and there is no\n"
    "  search button. The visible 'Add N Asset(s)' button belongs to the embedded picker\n"
    "  flow, not to search.\n"
    "- Asserts the result row, then that the detail panel mounts. It does NOT re-walk all\n"
    "  five tabs - that is the same AssetLookupDetails component MOB.520 already covers.\n"
    "- Tab/panel locators are scoped to the first accordion item because Mantine keeps\n"
    "  closed panels mounted, so every row carries its own tab strip.",
    [
        go(LOOKUP_URL, "asset lookup"),
        step("wait", "Wait for the page to mount", {"value": 5}),
        step("assertElementContent", 'Test the "Asset Lookup" page rendered',
             {"check": "contains", "value": "Asset Lookup",
              "element": xpath_el(LOOKUP_URL, PAGE_TITLE)}),
        step("assertElementPresent", "Test the search input renders",
             {"element": xpath_el(LOOKUP_URL, SEARCH)}),
        step("click", "Focus the search input",
             {"element": xpath_el(LOOKUP_URL, SEARCH)}),
        # SELECT-ALL FIRST. `AssetLookup/index.tsx:47` now persists the query to
        # `sessionStorage['asset_lookup_query']` (2026-08-21, "fix: clear persisted asset
        # lookup search"), and a Datadog SUITE SHARES ONE BROWSER SESSION - so the box can
        # arrive pre-populated from whatever searched before it. `typeText` APPENDS (trap 17),
        # which would make this "Pump 0102Pump 0102" and match nothing.
        step("pressKey", "Select any persisted query first (typeText APPENDS — trap 17)",
             {"value": "a", "modifiers": ["Control"]}),
        step("typeText", f"Search for {ASSET}",
             {"value": ASSET, "element": xpath_el(LOOKUP_URL, SEARCH)}),
        step("pressKey", "Submit the search (Enter - there is no search button)",
             {"value": "Enter"}),
        step("wait", "Wait for the search results", {"value": 8}),
        step("assertPageContains", f"Test {ASSET} is in the results", {"value": ASSET}),
        step("click", "Expand the first result",
             {"element": xpath_el(LOOKUP_URL, FIRST_CONTROL)}),
        step("wait", "Wait for the detail panel to mount", {"value": 3}),
        step("assertElementPresent", "Test the asset detail tab strip rendered",
             {"element": xpath_el(LOOKUP_URL, f'({FIRST_ITEM}//*[@role="tab"])[1]')}),
        step("assertElementPresent", 'Test the "Work History" tab exists (one of the six)',
             {"element": xpath_el(
                 LOOKUP_URL,
                 f'{FIRST_ITEM}//*[@role="tab"][normalize-space(.)="Work History"]')}),
    ],
    TAGS,
))

# ---------------------------------------------------------------- suite
login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]

write(test(
    "MOB.995_AssetLookup_Suite",
    "Asset Lookup - READ-ONLY, safe to schedule.\n"
    "- Logs in once, then chains its subtests in the same browser session.\n"
    "- Mutates nothing: no records are created, so unlike MOB.991/MOB.994 this leaves no\n"
    "  residue on dev.\n"
    "- subtestPublicId values stay PENDING-WIRE-UP until the children exist on Datadog;\n"
    "  run wire_suite.py after pushing them.",
    # ⚠️ KEEP IN SYNC WITH THE JSON. Regenerating this script on 2026-08-21 silently DROPPED
    # `MOB.720` from the suite, because it had been wired into MOB.995's JSON directly and
    # never back-ported here - the same trap 19 (reverse direction) that removed five children
    # from MOB.986. Nothing warns; the suite just comes out shorter. Before regenerating any
    # suite, diff its children against the JSON.
    login_steps + [step("playSubTest", c,
                        {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1})
                   # 🔁 RE-SYNCED 2026-08-23. This list still lacked `MOB.731`, wired into the
                   # JSON on 08-21 — the same drift the warning above describes, one release
                   # after it was written. Full order, and the ORDER IS LOAD-BEARING:
                   #   740/735 run BEFORE 730/731 because those two own the proximity-radius
                   #   restore, and nothing should run between the radius being cleared and
                   #   the end of the suite. 735 also ENDS ON /map — harmless, since every
                   #   child here starts with its own goToUrl, but it is why it is not last.
                   #   741 follows 740 because they share a route and a fixture (Pump 0102's
                   #   work history): back to back, the second runs against a warm cache and a
                   #   failure in either localises to the same screen. 741 uploads a file but
                   #   writes NOTHING - the image is filtered client-side - so the suite stays
                   #   read-only and schedulable.
                   for c in ["MOB.700_AssetLookup_Search",
                             "MOB.720_AssetLookup_Event_Readings",
                             "MOB.740_AssetLookup_Work_History",
                             "MOB.741_Work_Attachments_Docs",
                             "MOB.735_AssetLookup_View_In_Map",
                             "MOB.730_AssetLookup_Proximity",
                             "MOB.731_AssetLookup_Proximity_Radius"]],
    # NB MOB.711 (column-picker search) is deliberately NOT here - un-wired 2026-08-21.
    ["Mobile", "env:dev", "Asset Lookup", "suite", "read-only"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))

print("wrote MOB.700 (asset lookup search), MOB.995 (suite)")
