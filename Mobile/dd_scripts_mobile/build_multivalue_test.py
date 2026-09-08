"""Build MOB.806_Search_MultiValue - the MULTI-VALUE branch of StructuredQuery's value input.

WHY THIS EXISTS
  `renderValueInput` (`index.tsx:134-159`) has TWO branches, and `MOB.800`/`MOB.805` only ever
  exercise the single-value one:

      isMultiValue(op)  ->  <MultiValueSelector>      (`includes` / `does not include`)
      otherwise         ->  <FormField id="value">    (everything else)

  Picking `includes` therefore REPLACES the value input entirely. Nothing has ever selected
  that operator, so the swap and everything behind it is untested.

  `MultiValueSelector` itself forks again on field type — `enum` -> MultiSelect,
  `record` -> RecordMultiSelect (async `loadFilterOptions`), anything else -> `TagsInput`.
  This test drives the **string** case (`Name`), which renders the `TagsInput` and needs no
  option loading, so it tests the branch rather than the network.

⭐ THE VALIDATION RULE IS THE REAL SUBJECT, AND IT IS DIFFERENT FROM EVERY OTHER FORM HERE.
  `validation` (`index.tsx:44-48`) applies a multi-value-only rule:

      if (isMultiValue(op)) -> value must be a NON-EMPTY ARRAY
      else                  -> value must not be '' or null

  So with `includes` chosen and no tags entered, the draft is invalid and `SubmitButton` is
  `type="button"` — inert (trap 8). Adding one tag must flip it to `type="submit"`. That pair
  is asserted around a real state change, the same shape as `MOB.357` and `MOB.358`: the
  invariant is *the button tracks validity*, not a fixed expectation about either state.

  ⚠️ This is NOT a repeat of `MOB.356`. That proves trap 8 on the four work-collection forms,
  which share one component and one `isValid`. This is a different form with a different
  validity rule — the array-length branch, which nothing else in mobile has.

WHAT PROVES THE SWAP HAPPENED
  Asserting the `TagsInput` appeared is half of it; the other half is that the single-value
  `#value` input is GONE. Both together prove a branch swap rather than an addition — a
  `renderValueInput` that returned both would still satisfy the first assertion alone.

🛑 READ-ONLY, and it never submits. The filter is never added, so `filters` is never touched
  and there is nothing to clear — the draft form dies with the drawer. `Escape` closes it.
  (`MOB.805` is the test that adds and clears a filter; this one deliberately stops short.)
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

LOOKUP_URL = BASE + "/asset-lookup"
TAG = "Pump"

FILTER_BTN = ('//button[contains(concat(" ", normalize-space(@class), " "),'
              ' " asset-lookup-filter-button ")]')
ADD = '//button[normalize-space(.)="Add Filter"]'
# The TagsInput rendered by MultiValueSelector's default branch.
TAGS_INPUT = '//input[@placeholder="Type and press Enter..."]'

# `SubmitButton type={isValid ? 'submit' : 'button'}` — the same mechanism trap 8 describes,
# read here against the multi-value validation rule.
ADD_BTN_TYPE = (
    "const b = [...document.querySelectorAll('button')]"
    ".find(x => (x.textContent || '').trim() === 'Add Filter');\n"
    "if (!b) return false;\n"
)

steps = [
    go(LOOKUP_URL, "asset lookup"),
    step("wait", "Let the page begin loading", {"value": 3}),
    step("assertElementContent", 'Test the "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup",
          "element": xpath_el(LOOKUP_URL,
                              '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                              ' "Asset Lookup")]')}, timeout=30),

    step("click", "Open the Filters drawer",
         {"element": xpath_el(LOOKUP_URL, FILTER_BTN)}, timeout=30),
    step("assertElementPresent", "The Filters drawer opened",
         {"element": xpath_el(LOOKUP_URL, ADD)}, timeout=30),

    # ---- single-value baseline ----------------------------------------------------------------
    step("click", "Open the Field select",
         {"element": xpath_el(LOOKUP_URL, '//*[@id="fieldId"]')}, timeout=30),
    step("wait", "Wait for Field options", {"value": 2}),
    step("click", 'Pick Field = "Name"',
         {"element": xpath_el(LOOKUP_URL, '//*[@role="option"][normalize-space(.)="Name"]')},
         timeout=30),
    step("click", "Open the Operator select",
         {"element": xpath_el(LOOKUP_URL, '//*[@id="operator"]')}, timeout=30),
    step("wait", "Wait for Operator options", {"value": 2}),
    step("click", 'Pick Operator = "contains" (the SINGLE-value branch)',
         {"element": xpath_el(LOOKUP_URL,
                              '//*[@role="option"][normalize-space(.)="contains"]')},
         timeout=30),
    step("wait", "Let the value input render", {"value": 2}),
    jsassert("BASELINE: the single-value `#value` input is what renders for `contains`",
             "const v = document.getElementById('value');\n"
             "const tags = document.querySelector"
             "('input[placeholder=\"Type and press Enter...\"]');\n"
             "return !!v && !tags;", timeout=30),

    # ---- swap to the multi-value branch --------------------------------------------------------
    step("click", "Open the Operator select again",
         {"element": xpath_el(LOOKUP_URL, '//*[@id="operator"]')}, timeout=30),
    step("wait", "Wait for Operator options", {"value": 2}),
    step("click", 'Pick Operator = "includes" (the MULTI-value branch)',
         {"element": xpath_el(LOOKUP_URL,
                              '//*[@role="option"][normalize-space(.)="includes"]')},
         timeout=30),
    step("wait", "Let the value input swap", {"value": 2}),
    step("assertElementPresent", "The `TagsInput` rendered",
         {"element": xpath_el(LOOKUP_URL, TAGS_INPUT)}, timeout=30),
    # ⭐ A SWAP, not an addition. `renderValueInput` returns one or the other; if it ever
    # returned both, the assertion above alone would still pass.
    jsassert("⭐ IT IS A SWAP: the single-value `#value` input is GONE",
             "const v = document.getElementById('value');\n"
             "const tags = document.querySelector"
             "('input[placeholder=\"Type and press Enter...\"]');\n"
             "return !!tags && !v;", timeout=30),

    # ---- ⭐ the multi-value validation rule ------------------------------------------------------
    jsassert("⭐ VALIDITY 1/2: with NO tags, `Add Filter` is INERT (type=button)",
             ADD_BTN_TYPE + "return b.type === 'button';", timeout=30),
    step("click", "Focus the tags input",
         {"element": xpath_el(LOOKUP_URL, TAGS_INPUT)}, timeout=30),
    step("typeText", f'Type "{TAG}"',
         {"value": TAG, "element": xpath_el(LOOKUP_URL, TAGS_INPUT)}),
    # TagsInput commits on Enter — that is what turns typed text into an array entry, and the
    # array is what the validator measures.
    step("pressKey", "Press Enter to commit the tag", {"value": "Enter"}),
    step("wait", "Let the draft revalidate", {"value": 2}),
    jsassert(f'The tag "{TAG}" was committed as a pill',
             "const d = document.querySelector('.mantine-Drawer-content') || document;\n"
             "return [...d.querySelectorAll('.mantine-Pill-label')]"
             f".some(p => (p.textContent || '').trim() === '{TAG}');", timeout=30),
    # ⭐ The other half of the invariant, after a real state change.
    jsassert("⭐ VALIDITY 2/2: with one tag, `Add Filter` is LIVE (type=submit)",
             ADD_BTN_TYPE + "return b.type === 'submit';", timeout=30),

    # ---- close without adding -------------------------------------------------------------------
    # 🛑 The filter is never added, so `filters` is untouched and there is nothing to clear.
    step("pressKey", "Escape — close WITHOUT adding the filter", {"value": "Escape"},
         always=True),
    step("wait", "Let the drawer close", {"value": 2}, always=True),
    jsassert("RESTORED: no filter was added — the trigger still reads `Filters (0)`",
             "const b = document.querySelector('.asset-lookup-filter-button');\n"
             "if (!b) return false;\n"
             "return /Filters\\s*\\(0\\)/.test(b.textContent || '');", always=True, timeout=30),
]

write(test(
    "MOB.806_Search_MultiValue",
    "`MOB.806` **The MULTI-VALUE branch of `StructuredQuery`'s value input.**\n"
    "- `renderValueInput` has two branches; `MOB.800`/`MOB.805` only ever drive the\n"
    "  single-value one. Picking operator **`includes`** replaces the value input with\n"
    "  `MultiValueSelector` — untested until now.\n"
    "- Drives the **string** case, which renders a `TagsInput` and needs no option loading, so\n"
    "  it tests the branch rather than the network. (`enum` → MultiSelect and `record` →\n"
    "  async `RecordMultiSelect` are the other two forks.)\n"
    "- ⭐ **The real subject is the validation rule**, which nothing else in mobile has:\n"
    "  multi-value operators require a **non-empty array**, so `Add Filter` is inert with no\n"
    "  tags and live with one. Asserted around a real state change.\n"
    "  ⚠️ **Not a repeat of `MOB.356`** — that covers the four work-collection forms, which\n"
    "  share one component and one `isValid`. This is a different form and a different rule.\n"
    "- ⭐ **Proves a SWAP, not an addition**: the `TagsInput` appears **and** the single-value\n"
    "  `#value` input is gone. The first assertion alone would pass on a component that\n"
    "  rendered both.\n"
    "- 🛑 **READ-ONLY and it never submits.** The filter is never added, so `filters` is\n"
    "  untouched and there is nothing to clear; a closing check confirms the trigger still\n"
    "  reads `Filters (0)`.",
    steps,
    tags=["Mobile", "env:dev", "Search", "StructuredQuery", "read-only"],
))
print("wrote MOB.806 (structured query multi-value branch)")
