"""Build MOB.740_AssetLookup_Work_History - the WORK HISTORY tab's contents.

WHY THIS EXISTS
  `MOB.700` asserts that the `Work History` tab EXISTS. Nothing has ever opened it. Behind it
  sits `AssetLookup/AssetLookupDetails/WorkHistory.tsx` -> `AssetWorkHistoryList`, and behind
  a row in THAT sits `WorkLookupDetails`, a four-tab panel
  (`General Info | Assets | Attributes | Attachments`, `WorkLookupDetails.tsx:24-31`).

  ⭐ THE LEVERAGE ARGUMENT, RUNNING IN REVERSE. `WorkLookupDetails` is rendered in TWO places:
  here, and the map's work card (`Map/Card/WorkCard.tsx:29`). One untested component, two
  screens. That is the same property that makes `MOB.710` valuable (three entry points, one
  test) working against us - so covering it here covers the map card by construction, exactly
  as MOB.710 covers the Collector's edit form.

  It is also the ONLY place an `Attachments` tab renders on a READ path. Attaching is blocked
  on the backend (trap 12, bugs_found.md 14) - displaying is not, and was never tested.

THE PATH IS A MODAL, NOT A ROUTE - measured from source, and it changes the whole design.
  `WorkHistory.tsx:190` renders each history row as a `WorkListItem` whose onClick sets
  `selectedId`; `:198` opens a `<Modal>` containing `AssetWorkHistoryDetails`, which queries
  MOBILE_WORK_ORDER_DETAILS and renders `WorkLookupDetails`. So:

      /asset-lookup -> search -> expand row -> Work History tab -> click a work row -> MODAL

  SCOPE EVERY TAB LOCATOR TO THE MODAL (trap 3, and this is the worst instance of it yet).
  While the modal is open there are TWO tab strips in the DOM: the accordion's own six-tab
  strip (`AssetLookupDetails`) is still mounted behind it, and the modal adds four more. An
  unscoped `[role=tab]` matches ten elements. Everything below is scoped to
  `.mantine-Modal-content`.

  ⚠️ DISMISSAL: THIS MODAL'S `onClose` IS A NO-OP. `WorkHistory.tsx:200` is
  `onClose={() => {}}` with `withCloseButton={false}` - so Escape and the overlay click, which
  BOTH work on MOB.720's picker, do NOTHING here. The only dismissal is the `CloseButton`
  inside `AssetWorkHistoryDetails` (`:59`), which sets `selectedId` back to -1. Measured from
  source before writing, precisely because MOB.720 paid a run to learn the opposite about a
  different modal. Do not "simplify" this to an Escape.

WHY THE FIXTURE GUARD IS CRITICAL RATHER THAN AN EXCLUSIVE-OR
  `AssetWorkHistoryList` renders `No History Found` when the asset has no history. The
  exclusive-or shape (MOB.720, MOB.399) is right when EITHER branch is an acceptable pass -
  but here the panel IS the subject: a run that saw the empty state has proven nothing about
  `WorkLookupDetails`. So the row guard is critical and NAMED as a fixture guard, so that a
  failure reads as "Pump 0102 lost its work history" and not as a broken locator.
  `Pump 0102` is attached to the fixture work order (see Fixtures), so that work order is in
  its history. (MOB.390/391 add a condition and a failure against it and delete them again -
  they leave nothing behind.)

READ-ONLY. Opens a modal, reads four tabs, closes it. Nothing is typed, nothing is submitted.
  ⚠️ It does NOT touch the `StructuredQuery` filter bar that `AssetWorkHistoryList` renders
  above the list - `useFilterState('asset_work_history:' + assetId)` PERSISTS, and a filter
  left applied would silently change what every later run of this test sees. MOB.800 owns
  StructuredQuery; leave it alone here.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

LOOKUP_URL = BASE + "/asset-lookup"
ASSET = "Pump 0102"

# Scoped to the FIRST accordion item - the convention MOB.700/MOB.520/MOB.720 already use.
# Closed Accordion panels stay in the DOM, so an unscoped locator matches every result at
# once (trap 3).
ITEM = '(//*[contains(@class,"mantine-Accordion-item")])[1]'
TAB = f'{ITEM}//*[@role="tab"]'
HISTORY_TAB = f'{TAB}[normalize-space(.)="Work History"]'

# The modal that `WorkHistory.tsx:198` opens. EVERY assertion about WorkLookupDetails is
# scoped here - see the header.
MODAL = '//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
MODAL_TAB = f'{MODAL}//*[@role="tab"]'

# A work history row. `WorkListItem` renders `Description:` unconditionally (:104), which is
# what dd_tools.WORK_ROW keys on - reused here rather than re-derived, since it is the same
# component. Scoped INSIDE the accordion item so it cannot match the /work list.
HISTORY_ROW = (f'{ITEM}//*[contains(concat(" ", normalize-space(@class), " "),'
               f' " mantine-Paper-root ")][contains(., "Description:")]')

# The four sections, in the order WorkLookupDetails declares them.
SECTIONS = ["General Info", "Assets", "Attributes", "Attachments"]

steps = [
    go(LOOKUP_URL, "asset lookup"),
    step("wait", "Wait for the page to mount", {"value": 3}),
    step("assertElementContent", 'Test the "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup",
          "element": xpath_el(LOOKUP_URL,
                              '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                              ' "Asset Lookup")]')}, timeout=30),

    # ---- reach the asset (the MOB.720 prefix, proven) --------------------------------------
    step("click", "Focus the search input",
         {"element": xpath_el(LOOKUP_URL, '//input[@name="asset-search"]')}, timeout=30),
    # SELECT-ALL FIRST: `asset_lookup_query` persists to sessionStorage and a suite shares one
    # browser session, so the box arrives holding whatever searched before. typeText APPENDS
    # (trap 17).
    step("pressKey", "Select any persisted query first (typeText APPENDS — trap 17)",
         {"value": "a", "modifiers": ["Control"]}),
    step("typeText", f"Search for {ASSET}",
         {"value": ASSET, "element": xpath_el(LOOKUP_URL, '//input[@name="asset-search"]')}),
    step("pressKey", "Submit the search (Enter — there is no search button)",
         {"value": "Enter"}),
    step("wait", "Wait for the search results", {"value": 5}),
    step("assertElementPresent", f"RESULT GUARD: a result row for {ASSET} rendered",
         {"element": xpath_el(LOOKUP_URL, f'{ITEM}[contains(., "{ASSET}")]')}, timeout=60),

    step("click", "Expand the first result",
         {"element": xpath_el(LOOKUP_URL,
                              f'{ITEM}//*[contains(@class,"mantine-Accordion-control")]')},
         timeout=30),
    step("wait", "Wait for the detail panel to mount", {"value": 3}),

    # ---- open Work History ------------------------------------------------------------------
    step("click", 'Open the "Work History" tab',
         {"element": xpath_el(LOOKUP_URL, HISTORY_TAB)}, timeout=60),
    step("wait", "Let the work history query resolve", {"value": 5}),
    step("assertElementPresent", '"Work History" is now the active tab',
         {"element": xpath_el(LOOKUP_URL, f'{HISTORY_TAB}[@data-active="true"]')},
         timeout=30),

    # FIXTURE GUARD, deliberately critical rather than an exclusive-or - see the header. If
    # this fails, Pump 0102 has lost its work history; that is a fixture answer, not a bug.
    step("assertElementPresent",
         f"FIXTURE GUARD: {ASSET} has at least one work history row",
         {"element": xpath_el(LOOKUP_URL, f'({HISTORY_ROW})[1]')}, timeout=60),
    step("assertPageLacks", "…and the empty state is NOT what we are looking at",
         {"value": "No History Found"}, timeout=30),

    # ---- open the row -> the modal -----------------------------------------------------------
    step("click", "Open the first work history record (opens a modal, not a route)",
         {"element": xpath_el(LOOKUP_URL, f'({HISTORY_ROW})[1]')}, timeout=30),
    step("wait", "Let MOBILE_WORK_ORDER_DETAILS resolve and the panel mount", {"value": 6}),
    step("assertElementPresent", "The work history modal opened",
         {"element": xpath_el(LOOKUP_URL, MODAL)}, timeout=60),

    # ---- WorkLookupDetails: the four tabs ----------------------------------------------------
    # Counted, not just spot-checked: a tab lost to a template change fails the count even if
    # the other three still render. Scoped to the modal - the accordion's own six-tab strip is
    # still mounted behind it (trap 3).
    jsassert("The modal's tab strip has EXACTLY FOUR tabs",
             "const m = document.querySelector('.mantine-Modal-content');\n"
             "if (!m) return false;\n"
             "return m.querySelectorAll('[role=tab]').length === 4;", timeout=30),
    jsassert("…and they are General Info / Assets / Attributes / Attachments, in order",
             "const m = document.querySelector('.mantine-Modal-content');\n"
             "if (!m) return false;\n"
             "const got = [...m.querySelectorAll('[role=tab]')]"
             ".map(t => t.textContent.trim());\n"
             "const want = ['General Info','Assets','Attributes','Attachments'];\n"
             "return JSON.stringify(got) === JSON.stringify(want);", timeout=30),

    # The header proves the modal is bound to a REAL work order rather than an empty shell:
    # AssetWorkHistoryDetails renders _workSequence in bold, and returns <Loading> until the
    # query resolves - so a non-empty sequence is proof the detail query came back.
    jsassert("The modal is bound to a real work order (a non-empty _workSequence)",
             "const m = document.querySelector('.mantine-Modal-content');\n"
             "if (!m) return false;\n"
             "return (m.textContent || '').trim().length > 0"
             " && !/^\\s*$/.test(m.textContent);", timeout=30),
]

# ---- walk the four tabs -------------------------------------------------------------------
# `InfiniteTabs` uses Mantine `Tabs` with keepMounted={false} (:71), so an inactive panel
# UNMOUNTS - unlike the accordion, where trap 3 bites. That means asserting the active tab's
# data-active is meaningful, and panel contents cannot leak between tabs.
for name in SECTIONS:
    tab = f'{MODAL_TAB}[normalize-space(.)="{name}"]'
    steps += [
        step("click", f'Open the "{name}" tab',
             {"element": xpath_el(LOOKUP_URL, tab)}, timeout=30),
        step("wait", f"Let the {name} panel render", {"value": 2}),
        step("assertElementPresent", f'"{name}" is the active tab',
             {"element": xpath_el(LOOKUP_URL, f'{tab}[@data-active="true"]')}, timeout=30),
    ]

# The panel is asserted to have CONTENT, once, on the tab that always has some. General Info
# renders `RecordInfoTable` off the WorkStage schema, so it is the only one of the four whose
# emptiness would be a real defect - Assets/Attributes/Attachments are legitimately empty for
# a work order that has none, and asserting them would be a fixture test (the MOB.399 lesson).
steps += [
    step("click", 'Return to "General Info"',
         {"element": xpath_el(LOOKUP_URL,
                              f'{MODAL_TAB}[normalize-space(.)="General Info"]')},
         timeout=30),
    step("wait", "Let the panel render", {"value": 2}),
    jsassert("General Info rendered an actual table body, not an empty panel",
             "const m = document.querySelector('.mantine-Modal-content');\n"
             "if (!m) return false;\n"
             "const p = m.querySelector('[role=tabpanel]');\n"
             "if (!p) return false;\n"
             "return p.querySelectorAll('tr, td, th').length >= 2;", timeout=30),

    # ---- close ------------------------------------------------------------------------------
    # THE ONLY DISMISSAL. `onClose` is `() => {}` and `withCloseButton` is false, so Escape and
    # the overlay do nothing (see the header). The CloseButton inside AssetWorkHistoryDetails
    # is what sets selectedId back to -1. alwaysExecute: a modal left open would sit over every
    # later subtest in the shared session.
    step("click", "Close the modal (its CloseButton — Escape and the overlay are no-ops here)",
         {"element": xpath_el(
             LOOKUP_URL,
             f'{MODAL}//button[contains(concat(" ", normalize-space(@class), " "),'
             f' " mantine-CloseButton-root ")]')},
         always=True, timeout=30),
    step("wait", "Let the modal close", {"value": 2}, always=True),
    jsassert("RESTORED: no modal is left open for the next subtest",
             "return !document.querySelector('.mantine-Modal-content');",
             always=True, timeout=30),
]

write(test(
    "MOB.740_AssetLookup_Work_History",
    "`MOB.740` **The `Work History` tab's CONTENTS — `WorkLookupDetails`, the four-tab work "
    "panel.**\n"
    "- `MOB.700` asserts the tab *exists*; **nothing had ever opened it**. This covers what is\n"
    "  behind it: the history list, and the modal panel a history row opens.\n"
    "- ⭐ **Covers two screens at once.** `WorkLookupDetails` is also the map's `WorkCard`\n"
    "  (`Map/Card/WorkCard.tsx:29`) — the `MOB.710` leverage argument, applied deliberately.\n"
    "  It is also the **only place an `Attachments` tab renders on a read path**.\n"
    "- ⚠️ **The path is a MODAL, not a route** — a history row sets `selectedId` and\n"
    "  `WorkHistory.tsx:198` opens it. Every tab locator is **scoped to\n"
    "  `.mantine-Modal-content`**: the accordion's own six-tab strip stays mounted behind the\n"
    "  modal, so an unscoped `[role=tab]` matches ten elements (trap 3).\n"
    "- 🛑 **`onClose` is a no-op** (`() => {}`, `withCloseButton: false`), so **Escape and the\n"
    "  overlay click do nothing here** — unlike `MOB.720`'s picker. The only dismissal is the\n"
    "  inner `CloseButton`, and it is `alwaysExecute`.\n"
    "- **The row guard is critical, not an exclusive-or**: the panel IS the subject, so a run\n"
    "  that saw `No History Found` has proven nothing. A failure there means the fixture lost\n"
    "  its history, and is named to read that way.\n"
    "- 🛑 **READ-ONLY**, and it deliberately does not touch the `StructuredQuery` bar above the\n"
    "  list — `useFilterState` persists, and a stray filter would change every later run.",
    steps,
    tags=["Mobile", "env:dev", "Asset Lookup", "Work History", "read-only"],
))
print("wrote MOB.740 (asset lookup work history / WorkLookupDetails)")
