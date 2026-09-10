"""Build MOB.805_Search_Filter_Edit - EDITING an existing StructuredQuery filter.

WHY THIS EXISTS
  `MOB.800` builds a filter and clears it. Nothing has ever EDITED one, and edit is a genuinely
  separate branch of the same component:

      ActiveFilters passes onSelect -> setEditFilterIndex(i)      (ActiveFilters.tsx:27)
      -> a useEffect resets the draft form from filters[i]        (index.tsx:70-82)
      -> SubmitButton buttonText flips `Add Filter` -> `Update Filter`   (index.tsx:203)
      -> a `Cancel edit` button appears                           (index.tsx:207-210)
      -> submitting REPLACES filters[i] instead of appending      (index.tsx:105-110)

  StructuredQuery is the larger of the two search systems and builds **server-side** query
  conditions, so a defect here returns *wrong data* rather than a visibly broken control. That
  is the argument for covering its second branch rather than assuming the first implies it.

THE LABEL FLIP IS THE ASSERTABLE STATE - the same shape as `MOB.121`'s style button and the
  work-view toggle: a control whose text names the state it is in, so a genuine state change is
  readable without a screenshot.

⚠️ CLICK THE PILL'S LABEL, NOT THE PILL ROOT'S REMOVE BUTTON. `ActiveFilter` renders a Mantine
  `Pill withRemoveButton` carrying BOTH handlers: `onClick -> onSelect(i)` (edit) and
  `onRemove -> onRemove(i)` (delete). They are millimetres apart, and hitting the wrong one
  silently deletes the filter instead of editing it — which would then fail the *next*
  assertion for a reason that looks nothing like the cause. Targeting `.mantine-Pill-label`
  keeps the click on the edit half; the click still bubbles to the root, where `onClick` lives.

WHY THE FORM CONTENTS ARE ASSERTED, NOT JUST THE BUTTON TEXT
  A button whose text changed proves `editFilterIndex` moved. It does NOT prove the draft form
  was rebound to the RIGHT filter — the `useEffect` at `:70` could reset to the wrong index, or
  not fire at all, and the label would still flip. So the test asserts the round trip:

      after Add Filter   -> `#value` is absent/empty   (addFilter calls reset(DEFAULTS), and
                                                        with no field chosen renderValueInput
                                                        returns null, so #value does not exist)
      after clicking Pill -> `#value` === "Pump 0102"  (reset() rebound it from the filter)

  That pair cannot both hold by accident, and it is why the test does not simply read the
  button.

🛑 CANCEL MUST NOT DESTROY THE FILTER. `cancelEdit` only resets the draft (`setEditFilterIndex(-1)`
  + `reset(DEFAULTS)`) and leaves `filters` untouched. The test asserts the pill is STILL THERE
  afterwards — a cancel that quietly dropped the filter would otherwise look like success.

READ-ONLY against the server: filters are client-side query state. `useFilterState` is an
  **in-memory module store**, not localStorage (`utils.ts:38`, and the comment there says the
  switch was deliberate), so a `goToUrl` clears it and filters cannot leak into another
  subtest. The test still clears its own filter on the way out with `alwaysExecute`, because
  within this test the store survives client-side navigation.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      open_filters_drawer)

LOOKUP_URL = BASE + "/asset-lookup"
ASSET = "Pump 0102"

# Lifted from MOB.800 — same screen, same drawer, already proven green.
FILTER_BTN = ('//button[contains(concat(" ", normalize-space(@class), " "),'
              ' " asset-lookup-filter-button ")]')
BTN = '//button[normalize-space(.)="{}"]'
ADD = BTN.format("Add Filter")
UPDATE = BTN.format("Update Filter")
CANCEL_EDIT = BTN.format("Cancel edit")
CLEAR_ALL = BTN.format("Clear all")

# ⚠️ EVERY FILTER RENDERS AS *TWO* PILLS — measured, and it broke the first run with
# "Multiple elements found" (trap 3). `StructuredQuery` mounts `ActiveFilter` in two places:
#     index.tsx:212  ActiveFilters  -> INSIDE the Drawer (unmounted when it closes, trap 4)
#     index.tsx:264  FilterInfo     -> OUTSIDE it, in the always-visible bar that also holds
#                                      the `Filters (N)` button (.asset-lookup-active-filters)
# Both wire `onSelect`, so either can start an edit — but any page-level pill locator matches
# both. Everything here is scoped to the DRAWER's copy, which is the one in the same context as
# the form and buttons being asserted.
DRAWER = '//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Drawer-content ")]'
# `.mantine-Pill-label` sits inside the root that carries onClick, so the click bubbles to
# `onSelect`; the remove button is a sibling and is never targeted.
PILL_LABEL = (f'{DRAWER}//*[contains(concat(" ", normalize-space(@class), " "),'
              f' " mantine-Pill-label ")][contains(., "{ASSET}")]')

steps = [
    go(LOOKUP_URL, "asset lookup"),
    step("wait", "Let the page begin loading", {"value": 3}),
    step("assertElementContent", 'Test the "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup",
          "element": xpath_el(LOOKUP_URL,
                              '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                              ' "Asset Lookup")]')}, timeout=30),

    # ---- build one filter (MOB.800's proven sequence) ----------------------------------------
    *open_filters_drawer(LOOKUP_URL),
    step("click", "Open the Field select",
         {"element": xpath_el(LOOKUP_URL, '//*[@id="fieldId"]')}, timeout=30),
    step("wait", "Wait for Field options", {"value": 2}),
    step("click", 'Pick Field = "Name"',
         {"element": xpath_el(LOOKUP_URL, '//*[@role="option"][normalize-space(.)="Name"]')},
         timeout=30),
    step("click", "Open the Operator select",
         {"element": xpath_el(LOOKUP_URL, '//*[@id="operator"]')}, timeout=30),
    step("wait", "Wait for Operator options", {"value": 2}),
    step("click", 'Pick Operator = "contains"',
         {"element": xpath_el(LOOKUP_URL,
                              '//*[@role="option"][normalize-space(.)="contains"]')},
         timeout=30),
    step("typeText", f"Enter the value {ASSET}",
         {"value": ASSET, "element": xpath_el(LOOKUP_URL, '//*[@id="value"]')}),
    step("click", "Add the filter",
         {"element": xpath_el(LOOKUP_URL, ADD)}, timeout=30),
    step("wait", "Let the filter apply", {"value": 3}),

    # ---- baseline: we are NOT in edit mode ----------------------------------------------------
    step("assertElementPresent", "The filter is now an ACTIVE pill",
         {"element": xpath_el(LOOKUP_URL, PILL_LABEL)}, timeout=30),
    jsassert("BASELINE: not editing — `Add Filter` shown, no `Update Filter`/`Cancel edit`",
             "const t = [...document.querySelectorAll('button')]"
             ".map(b => (b.textContent || '').trim());\n"
             "return t.includes('Add Filter')\n"
             "  && !t.includes('Update Filter')\n"
             "  && !t.includes('Cancel edit');", timeout=30),
    # addFilter ends with reset(DEFAULTS): no field chosen -> renderValueInput returns null, so
    # #value should not exist at all. Half of the round-trip proof below.
    jsassert("BASELINE: the draft form was reset — `#value` is absent or empty",
             "const v = document.getElementById('value');\n"
             "return !v || (v.value || '') === '';", timeout=30),

    # ---- enter edit mode ----------------------------------------------------------------------
    step("click", "Click the pill's LABEL to edit it (never the remove button)",
         {"element": xpath_el(LOOKUP_URL, PILL_LABEL)}, timeout=30),
    step("wait", "Let the draft form rebind", {"value": 2}),
    jsassert("⭐ EDIT MODE: `Update Filter` replaced `Add Filter`, and `Cancel edit` appeared",
             "const t = [...document.querySelectorAll('button')]"
             ".map(b => (b.textContent || '').trim());\n"
             "return t.includes('Update Filter')\n"
             "  && !t.includes('Add Filter')\n"
             "  && t.includes('Cancel edit');", timeout=30),
    # ⭐ The half that proves the form bound to the RIGHT filter rather than merely flipping a
    # label. A useEffect that reset to the wrong index, or never fired, would still flip the
    # button — this is what distinguishes those cases.
    jsassert(f'⭐ THE DRAFT REBOUND FROM THE FILTER — `#value` is now "{ASSET}"',
             "const v = document.getElementById('value');\n"
             "if (!v) return false;\n"
             f"return (v.value || '').trim() === '{ASSET}';", timeout=30),

    # ---- cancel, and prove it did not destroy the filter --------------------------------------
    step("click", 'Click "Cancel edit"',
         {"element": xpath_el(LOOKUP_URL, CANCEL_EDIT)}, timeout=30),
    step("wait", "Let the form reset", {"value": 2}),
    jsassert("BACK OUT OF EDIT MODE: `Add Filter` returned, `Cancel edit` gone",
             "const t = [...document.querySelectorAll('button')]"
             ".map(b => (b.textContent || '').trim());\n"
             "return t.includes('Add Filter')\n"
             "  && !t.includes('Update Filter')\n"
             "  && !t.includes('Cancel edit');", timeout=30),
    # 🛑 cancelEdit touches only the draft. If it ever started clearing `filters`, this is the
    # assertion that catches it — and without it, a cancel that deleted the filter would read
    # as a clean pass.
    step("assertElementPresent", "🛑 CANCEL PRESERVED THE FILTER — the pill is still there",
         {"element": xpath_el(LOOKUP_URL, PILL_LABEL)}, timeout=30),

    # ---- restore ------------------------------------------------------------------------------
    # alwaysExecute: the in-memory filter store survives client-side navigation within this
    # test, so leaving a filter applied would change what a later step on this screen sees.
    step("click", 'Restore: "Clear all"',
         {"element": xpath_el(LOOKUP_URL, CLEAR_ALL)}, always=True, timeout=30),
    step("wait", "Let the unfiltered re-query run", {"value": 4}, always=True),
    jsassert("RESTORED: no active filter pills remain",
             "return document.querySelectorAll('.mantine-Pill-root').length === 0;",
             always=True, timeout=30),
    step("pressKey", "Close the Filters drawer", {"value": "Escape"}, always=True),
    step("wait", "Let the drawer close", {"value": 2}, always=True),
]

write(test(
    "MOB.805_Search_Filter_Edit",
    "`MOB.805` **Editing an existing `StructuredQuery` filter** — the branch `MOB.800` never\n"
    "reaches.\n"
    "- `MOB.800` builds a filter and clears it. **Nothing had ever edited one**, and edit is a\n"
    "  separate path: clicking an active pill sets `editFilterIndex`, a `useEffect` rebinds the\n"
    "  draft form, `Add Filter` becomes **`Update Filter`**, `Cancel edit` appears, and\n"
    "  submitting **replaces** `filters[i]` instead of appending.\n"
    "- **StructuredQuery builds server-side conditions**, so a defect returns *wrong data*\n"
    "  rather than a visibly broken control — the reason its second branch is worth covering.\n"
    "- ⭐ **It asserts the form contents, not just the button text.** A label flip only proves\n"
    "  `editFilterIndex` moved; the round trip (`#value` absent after Add → `Pump 0102` after\n"
    "  clicking the pill) is what proves the draft rebound to the **right** filter.\n"
    "- ⚠️ **Every filter renders as TWO pills** — `ActiveFilters` inside the drawer and\n"
    "  `FilterInfo` in the always-visible bar outside it, both wired to `onSelect`. A\n"
    "  page-level pill locator matches both (trap 3), so everything here is scoped to the\n"
    "  **drawer's** copy.\n"
    "- ⚠️ **Clicks the pill's LABEL, never the pill's remove button.** `Pill withRemoveButton`\n"
    "  carries both handlers millimetres apart; hitting the wrong one deletes the filter and\n"
    "  fails a later assertion for a reason that looks nothing like the cause.\n"
    "- 🛑 **Asserts that Cancel PRESERVES the filter** — `cancelEdit` touches only the draft, and\n"
    "  a cancel that quietly dropped the filter would otherwise read as a clean pass.\n"
    "- **READ-ONLY** against the server: filters are client-side query state, held in an\n"
    "  **in-memory** store (`utils.ts:38` — not localStorage), so a `goToUrl` clears them. The\n"
    "  test still clears its own filter with `alwaysExecute`.",
    steps,
    tags=["Mobile", "env:dev", "Search", "StructuredQuery", "read-only"],
))
print("wrote MOB.805 (structured query filter edit)")
