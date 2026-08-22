"""Build MOB.720_AssetLookup_Event_Readings - the SIXTH tab on an Asset Lookup result.

WHY THIS EXISTS
  `AssetLookupDetails/index.tsx:95-101` appends `{ id: 'event_readings', title: 'Readings' }`
  when `permissions.event.read`. The checklist recorded five tabs (having already corrected
  an inherited "four"), so this one was never listed and never covered - on ANY of the three
  screens that render `AssetLookupDetails`: Asset Lookup, the Collector's asset details, and
  the asset rows inside a verification job.

  ⚠️ NOT the same component as MOB.550's. MOB.550 covers Asset Verification's
  `EventReadings/index.tsx`; this is `AssetLookup/AssetLookupDetails/EventReadings.tsx`. They
  share the field and timeline children but not the container, the query, or the submit path.

READ-ONLY BY DESIGN - and that is a decision, not a shortcut.
  Submitting here calls `CREATE_EVENT` per filled field, and mobile cannot delete, so every
  run would leave permanent Event rows exactly as MOB.550 does. MOB.550 already proves that
  write path. What is NEW here is the entry point, the derived field list, and the
  `AddReadingTypes` picker - so this covers those and stops before submitting. Same shape as
  MOB.575 and MOB.398, both read-only for the same reason.

  If someone later wants the write covered, do it deliberately and record the residue - do not
  quietly make this test submit.

WHAT IT ASSERTS, AND WHY IT CANNOT GO VACUOUS
  `Pump 0102` may or may not already have readings, and the component renders one of two
  things accordingly: a `{n} of {m} recorded recently (in 24h)` progress row when it has
  fields, or `No readings recorded for this asset.` when it has none. Asserting either alone
  would be a fixture test. So the test asserts:
    - the tab exists and becomes active                      (structure - always true)
    - the scoped `<form id="asset-lookup-readings-{assetId}">` mounted   (always true)
    - EXACTLY ONE of the two states above holds              (a real exclusive-or, trap 5)
  The form id is asset-scoped, so it is matched with `starts-with()` - the assetId is not
  known up front and Datadog cannot interpolate an extracted value into an XPath.

THE ADD-READING-TYPES PICKER has a real accessible name, `aria-label="Add reading types"` -
rare here, and worth using rather than hunting an icon (trap 14). Its modal has NO cancel
button (`withCloseButton: false`, and the only Button is `Add`). Escape was the obvious
dismissal - MOB.470 closes the crew modal that way - but MEASURED 2026-08-20 it does NOT close
this one, and that was the test's only failing step. `useModal` opens through
`@mantine/modals`, whose `closeOnClickOutside` default stays true (the override is commented
out in `hooks/useModal.tsx`), so the OVERLAY CLICK is the reliable dismissal. Escape is kept
first and optional, so the test is unaffected either way.
`Add` is DISABLED until a type is selected, which is asserted: it proves the gate without
selecting anything.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

LOOKUP_URL = BASE + "/asset-lookup"
ASSET = "Pump 0102"

# Scoped to the FIRST accordion item, the convention MOB.700/MOB.520 already use: closed
# Accordion panels stay in the DOM, so an unscoped tab locator matches every result's strip
# at once (trap 3).
ITEM = '(//*[contains(@class,"mantine-Accordion-item")])[1]'
TAB = f'{ITEM}//*[@role="tab"]'
READINGS_TAB = f'{TAB}[normalize-space(.)="Readings"]'
# The form id is `asset-lookup-readings-${assetId}` and the assetId is not known up front.
READINGS_FORM = '//form[starts-with(@id, "asset-lookup-readings-")]'
ADD_TYPES_BTN = '//button[@aria-label="Add reading types"]'

steps = [
    go(LOOKUP_URL, "asset lookup"),
    step("wait", "Wait for the page to mount", {"value": 3}),
    step("assertElementContent", 'Test the "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup",
          "element": xpath_el(LOOKUP_URL,
                              '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                              ' "Asset Lookup")]')}, timeout=30),

    # Server-side CONTAINS here, so an exact visible name is safe - trap 11 applies to the
    # CLIENT-side lookups, not to this one.
    step("click", "Focus the search input",
         {"element": xpath_el(LOOKUP_URL, '//input[@name="asset-search"]')}, timeout=30),
    # SELECT-ALL FIRST. `AssetLookup/index.tsx:47` now persists the query to
    # `sessionStorage['asset_lookup_query']` (2026-08-21, "fix: clear persisted asset
    # lookup search"), and a Datadog SUITE SHARES ONE BROWSER SESSION - so the box arrives
    # pre-populated from whatever searched before. `typeText` APPENDS (trap 17), which
    # would make this "Pump 0102Pump 0102" and match nothing.
    step("pressKey", "Select any persisted query first (typeText APPENDS — trap 17)",
         {"value": "a", "modifiers": ["Control"]}),
    step("typeText", f"Search for {ASSET}",
         {"value": ASSET, "element": xpath_el(LOOKUP_URL, '//input[@name="asset-search"]')}),
    step("pressKey", "Submit the search (Enter — there is no search button)",
         {"value": "Enter"}),
    step("wait", "Wait for the search results", {"value": 5}),
    step("assertElementPresent", f"RESULT GUARD: a result row for {ASSET} rendered",
         {"element": xpath_el(LOOKUP_URL,
                              f'{ITEM}[contains(., "{ASSET}")]')}, timeout=60),

    step("click", "Expand the first result",
         {"element": xpath_el(LOOKUP_URL,
                              f'{ITEM}//*[contains(@class,"mantine-Accordion-control")]')},
         timeout=30),
    step("wait", "Wait for the detail panel to mount", {"value": 3}),

    # ---- the tab itself -------------------------------------------------------------------
    step("assertElementPresent", 'The "Readings" tab exists — the SIXTH tab',
         {"element": xpath_el(LOOKUP_URL, READINGS_TAB)}, timeout=60),
    jsassert("The expanded result's tab strip has SIX tabs",
             "const it = document.querySelector('.mantine-Accordion-item');\n"
             "if (!it) return false;\n"
             "return it.querySelectorAll('[role=tab]').length === 6;", timeout=30),

    step("click", 'Open the "Readings" tab',
         {"element": xpath_el(LOOKUP_URL, READINGS_TAB)}, timeout=30),
    step("wait", "Let the readings panel mount", {"value": 3}),
    step("assertElementPresent", 'The "Readings" tab is now the active one',
         {"element": xpath_el(LOOKUP_URL, f'{READINGS_TAB}[@data-active="true"]')},
         timeout=30),

    # ---- the panel's own content ----------------------------------------------------------
    step("assertElementPresent", "The asset-scoped readings FORM mounted",
         {"element": xpath_el(LOOKUP_URL, READINGS_FORM)}, timeout=60),

    # The exclusive-or is what stops this being a fixture test. Whichever way Pump 0102's data
    # falls, exactly one of these two states must be on screen - and if the panel rendered
    # nothing at all, NEITHER is, and this fails (trap 5).
    jsassert("EXACTLY ONE of: a 'recorded recently' progress row, or the empty state",
             "const f = document.querySelector"
             "('form[id^=\"asset-lookup-readings-\"]');\n"
             "if (!f) return false;\n"
             "const panel = f.closest('[role=tabpanel]') || f.parentElement;\n"
             "const txt = (panel.textContent || '');\n"
             "const hasProgress = /recorded recently \\(in 24h\\)/.test(txt);\n"
             "const hasEmpty = /No readings recorded for this asset\\./.test(txt);\n"
             "return hasProgress !== hasEmpty;", timeout=30),

    # ---- the AddReadingTypes picker --------------------------------------------------------
    # Gated on permissions.event.create. Optional ONLY in the sense that a role without create
    # would not render it - but the session role is asserted to be Admin by every suite, so
    # this stays critical.
    step("assertElementPresent", 'The "Add reading types" control renders',
         {"element": xpath_el(LOOKUP_URL, ADD_TYPES_BTN)}, timeout=30),
    step("click", "Open the Add Reading Types modal",
         {"element": xpath_el(LOOKUP_URL, ADD_TYPES_BTN)}, timeout=30),
    step("wait", "Let the modal open", {"value": 2}),
    step("assertPageContains", "The modal's title rendered",
         {"value": "Add Reading Types"}, timeout=30),
    step("assertElementPresent", "Its reading-type search box rendered",
         {"element": xpath_el(LOOKUP_URL,
                              '//input[@placeholder="Search reading types"]')}, timeout=30),
    # Proves the gate: nothing selected, so the confirm button must be disabled. This is the
    # assertion that would catch the picker confirming an empty selection.
    jsassert('The "Add" button is DISABLED while nothing is selected',
             "const bs = [...document.querySelectorAll('button')]"
             ".filter(b => b.textContent.trim() === 'Add');\n"
             "if (!bs.length) return false;\n"
             "return bs.every(b => b.disabled);", timeout=30),

    # DISMISSAL NEEDS A FALLBACK. The modal has no cancel button (`withCloseButton: false`,
    # and `Add` is its only Button), so Escape was the obvious dismissal - and MEASURED
    # 2026-08-20 it does not close this one: the test reached its last step with the modal
    # still up. `useModal` opens through `@mantine/modals`, whose `closeOnClickOutside`
    # default stays true (the override is commented out in `hooks/useModal.tsx`), so the
    # overlay click is the reliable path. Escape is kept first and optional: if it ever
    # starts working the test is unaffected, and if it does not the overlay click closes it.
    step("pressKey", "Try Escape first (optional — measured not to close this modal)",
         {"value": "Escape"}, optional=True, always=True),
    step("wait", "Let the modal react", {"value": 1}, always=True),
    step("click", "Dismiss by clicking the overlay (closeOnClickOutside)",
         {"element": xpath_el(
             LOOKUP_URL,
             '//*[contains(concat(" ", normalize-space(@class), " "),'
             ' " mantine-Modal-overlay ")]')},
         optional=True, always=True, timeout=15),
    step("wait", "Let the modal close", {"value": 2}, always=True),
    step("assertPageLacks", "The modal is gone — nothing was added",
         {"value": "Add Reading Types"}, always=True, timeout=30),
]

write(test(
    "MOB.720_AssetLookup_Event_Readings",
    "`MOB.720` **The `Readings` tab on an Asset Lookup result** — the sixth tab, and the last\n"
    "wholly-uncovered surface in this module apart from `typeId`.\n"
    "- **READ-ONLY BY DESIGN.** Submitting calls `CREATE_EVENT` per field and mobile cannot\n"
    "  delete, so it would leave permanent rows every run — which `MOB.550` already does for\n"
    "  the Asset Verification side. This covers what is NEW: the entry point, the derived\n"
    "  field list and the `AddReadingTypes` picker. **Do not make it submit** without deciding\n"
    "  to accept the residue.\n"
    "- ⚠️ **A different component from `MOB.550`'s** — `AssetLookup/AssetLookupDetails/\n"
    "  EventReadings.tsx`, not `AssetVerification/EventReadings/index.tsx`.\n"
    "- **Cannot go vacuous**: `Pump 0102` may or may not have readings, so the test asserts an\n"
    "  exclusive-or of the progress row and the empty state — if the panel renders nothing,\n"
    "  neither holds and it fails (trap 5).\n"
    "- The picker's modal has **no cancel button**, so it is dismissed with Escape; `Add` is\n"
    "  asserted DISABLED while nothing is selected, which proves the gate.\n"
    "- Covers all three `AssetLookupDetails` entry points by construction, as `MOB.710` does.",
    steps,
    tags=["Mobile", "env:dev", "Asset Lookup", "Readings", "read-only"],
))
print("wrote MOB.720 (asset lookup event readings tab)")
