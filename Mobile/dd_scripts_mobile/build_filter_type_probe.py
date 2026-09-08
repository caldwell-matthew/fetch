"""TEMPORARY probe - WHICH asset-lookup filter fields are `enum` / `record` rather than `string`?

THE QUESTION
  `MultiValueSelector` (`StructuredQuery/MultiValueSelector.tsx:43`) branches three ways on
  `field.type`, and `MOB.806` covers exactly ONE of them:

      field.type === 'enum'    -> <MultiSelect>       placeholder "Choose values..."
      field.type === 'record'  -> <RecordMultiSelect> placeholder "Choose values...", options
                                  loaded ASYNCHRONOUSLY via loadFilterOptions
      otherwise                -> <TagsInput>         placeholder "Type and press Enter..."
                                                      <- the only branch MOB.806 reaches

  To cover the other two, a test has to select a field that HAS one of those types. Nothing in
  the repo knows which fields those are, and it cannot be read from source:
  `AssetLookup/index.tsx:180` passes `fields={s.data?._info.fields}` - **runtime server schema**,
  generated from model metadata, not a list any file here declares.

WHY THE TWO CHEAPER IDEAS DO NOT WORK - both checked before writing this
  1. *"Read the operator list instead."* `index.tsx:189` picks operators with
     `OPERATORS_BY_TYPE[selectedField.type]`, which looks promising until you read the map:
     `utils.ts:12-25` gives **`string`, `enum` AND `record` the same `STRING_OPS`**. The operator
     dropdown cannot tell them apart.
  2. *"Read it out of the jest mocks / the GraphQL schema."* The mocks carry no field metadata,
     and the GraphQL SDL has no `_info.fields`.

  So the value control is the ONLY DOM-visible discriminator, and it has to be measured.
  Guessing a field name and paying a run per guess is exactly what trap 15 warns against.

HOW TO READ IT - the `MOB.978` convention. EVERY probe is `optional`, so ONE run reports them
all; read with `dd_tools.py report MOB.976_DIAG_Filter_Field_Types`.

  For each field INDEX (deliberately by index, not by name - a name would be a guess):

      "field[i] -> MULTISELECT"   passes  -> that field is `enum` OR `record`   <- WANTED
      "field[i] -> TAGSINPUT"     passes  -> that field is a plain string        (MOB.806's case)
      BOTH fail                           -> `includes` was not offered, or the value control
                                             did not render - read the earlier steps

  ⚠️ `enum` and `record` are NOT distinguishable here: both render a `MultiSelect` with the same
  placeholder. They differ only in whether the options arrive synchronously. The follow-up probe
  reports the OPTION COUNT immediately after selection, which separates them in practice:
  an `enum`'s options are present at once, a `record`'s arrive after `loadFilterOptions`
  resolves. That is a strong hint, not a proof, and it is labelled as such.

WHAT TO DO WITH THE RESULT
  Write the real test selecting the field BY INDEX, asserting the branch it lands in. The name
  is not needed, and depending on one would make the test fail confusingly the day the schema
  gains a column. If the order shifts, the branch assertion fails loudly instead.

🛑 READ-ONLY: opens the drawer, changes the DRAFT filter row, and closes with Escape WITHOUT
  adding a filter. `useFilterState` persists across the session, so a leaked filter would change
  what MOB.700/MOB.720/MOB.740 see - the final probe re-asserts `Filters (0)`.

⏱️ RUNTIME - watch the Appendix F0 ceiling. `optional` probes that FAIL still burn their whole
  timeout, and exactly one branch probe fails per field by design. Timeouts here are 15s (not the
  usual 30s) for that reason: ~2 failures x 15s x 8 fields ~= 240s of pure waiting, plus login.
  If N_FIELDS is raised, re-check the total against F0 before running - a test past the ceiling
  reports `Maximum test execution time reached` and names NO step.

DELETE THIS FILE once the branches are covered. It is a probe, not coverage.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write, jsassert  # noqa: E402

# 🛑 A STANDALONE PROBE MUST CARRY ITS OWN LOGIN. It is in no suite, so nothing establishes a
# session for it - `MOB.978` does exactly this and it is why that probe works. The first version
# of this file omitted it and ran against the LOGIN PAGE: every probe failed, each burning its
# full timeout, producing a slow run and a meaningless report.
login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]

LOOKUP_URL = BASE + "/asset-lookup"
N_FIELDS = 8            # first N options; the list is sortBy('label'), so this is a stable window

# The drawer is a Mantine Drawer titled "Filters". Everything is scoped inside it: StructuredQuery
# renders each active filter as TWO pills - `ActiveFilters` inside the drawer and `FilterInfo`
# outside it - which is what made MOB.805's first run fail with "Multiple elements found".
#
# ⚠️ EVERY LOCATOR BELOW IS COPIED FROM `MOB.805`/`MOB.806`, WHICH ARE GREEN. An earlier draft of
# this probe invented its own - `//button[contains(., "Filters")]` for the trigger, and
# `{DRAWER}//input[@id="fieldId"]` for the selects - and neither had ever been run. A probe whose
# own locators are guesses cannot distinguish "the app is not what I thought" from "I mistyped a
# selector", which is the one thing a probe exists to do.
DRAWER = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Drawer-content ")]')
IN_DRAWER = ("const d = document.querySelector('.mantine-Drawer-content');\n"
             "if (!d) return false;\n")

# The trigger carries its own class; matching on the text "Filters" would also hit the drawer
# title and the `FilterInfo` summary rendered outside it.
FILTERS_BTN = ('//button[contains(concat(" ", normalize-space(@class), " "),'
               ' " asset-lookup-filter-button ")]')
# The drawer is open once its submit button exists - the readiness signal MOB.806 uses.
ADD_FILTER_BTN = '//button[normalize-space(.)="Add Filter"]'


def open_select(field_id):
    """Open a Mantine Select's dropdown.

    Unscoped `//*[@id="..."]`, exactly as MOB.806 does: the id is unique in the document, and
    the element is not necessarily an `<input>`.
    """
    return step("click", f'Open the "{field_id}" select',
                {"element": xpath_el(LOOKUP_URL, f'//*[@id="{field_id}"]')},
                optional=True, timeout=30)


# Options portal OUTSIDE the drawer, so they are selected from the document, not from `d`.
OPTION = '//*[@role="option"]'

steps = [
    go(LOOKUP_URL, "asset lookup"),
    step("wait", "Wait for the page to mount", {"value": 5}),
    step("assertElementContent", 'The "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup",
          "element": xpath_el(LOOKUP_URL,
                              '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                              ' "Asset Lookup")]')}, timeout=30),

    step("click", "Open the Filters drawer",
         {"element": xpath_el(LOOKUP_URL, FILTERS_BTN)}, timeout=30),
    step("wait", "Let the drawer render", {"value": 2}),
    step("assertElementPresent", "The Filters drawer opened (its `Add Filter` submit exists)",
         {"element": xpath_el(LOOKUP_URL, ADD_FILTER_BTN)}, timeout=30),
]

# ---- how big is the field list? bisected, because a bare count cannot be reported ------------
steps += [open_select("fieldId"), step("wait", "Let the field options render", {"value": 2})]
for n in (5, 10, 15, 20, 25, 30, 40):
    steps.append(jsassert(f"FIELD COUNT >= {n}",
                          f"return document.querySelectorAll('[role=option]').length >= {n};",
                          optional=True, timeout=15))
steps.append(step("pressKey", "Close the field dropdown", {"value": "Escape"}, optional=True))

# ---- the decisive loop: index -> which value control ------------------------------------------
for i in range(N_FIELDS):
    steps += [
        open_select("fieldId"),
        step("wait", f"Let the options render for field[{i}]", {"value": 2}),
        # Clicked from JS: the option list is long and scrolls, so a later option is outside the
        # viewport and a real click would fail as not-interactable (trap 28's shape).
        jsassert(f"Select field[{i}]",
                 "const o = [...document.querySelectorAll('[role=option]')];\n"
                 f"if (o.length <= {i}) return false;\n"
                 f"o[{i}].click();\n"
                 "return true;", optional=True, timeout=15),
        step("wait", "Let the operator select mount", {"value": 2}),

        open_select("operator"),
        step("wait", "Let the operator options render", {"value": 2}),
        # `includes` is in STRING_OPS, which string/enum/record all share (utils.ts:12-25), so it
        # is offered for every field this probe cares about. If it is missing, this field is a
        # number/date/boolean and BOTH branch probes below will fail - which is itself the answer.
        jsassert(f"field[{i}]: pick the `includes` operator",
                 "const o = [...document.querySelectorAll('[role=option]')]\n"
                 "  .find(x => (x.textContent || '').trim() === 'includes');\n"
                 "if (!o) return false;\n"
                 "o.click();\n"
                 "return true;", optional=True, timeout=15),
        step("wait", "Let the value control swap", {"value": 3}),

        # ⭐ THE TWO ANSWERS. Exactly one should pass per field.
        jsassert(f"⭐ field[{i}] -> MULTISELECT (enum or record) — `Choose values...`",
                 IN_DRAWER +
                 "return !!d.querySelector('input[placeholder=\"Choose values...\"]');",
                 optional=True, timeout=15),
        jsassert(f"   field[{i}] -> TAGSINPUT (plain string) — `Type and press Enter...`",
                 IN_DRAWER +
                 "return !!d.querySelector('input[placeholder=\"Type and press Enter...\"]');",
                 optional=True, timeout=15),
        # Separates `enum` from `record` in practice: an enum's options come from `field.options`
        # and are present immediately; a record's arrive only after `loadFilterOptions` resolves.
        # A HINT, not a proof - a slow enum and a fast record would look alike.
        jsassert(f"   field[{i}] HINT: options already present (leans `enum` over `record`)",
                 IN_DRAWER +
                 "const inp = d.querySelector('input[placeholder=\"Choose values...\"]');\n"
                 "if (!inp) return false;\n"
                 "inp.click();\n"
                 "return document.querySelectorAll('[role=option]').length > 0;",
                 optional=True, timeout=15),
        step("pressKey", "Close any open dropdown", {"value": "Escape"}, optional=True),
    ]

# ---- leave nothing behind ----------------------------------------------------------------------
steps += [
    step("pressKey", "Escape — close the drawer WITHOUT adding a filter",
         {"value": "Escape"}, always=True),
    step("wait", "Let the drawer close", {"value": 2}, always=True),
    # `useFilterState` persists for the whole session, so a leaked filter would silently change
    # what MOB.700/720/740 see. This is the same restore guard MOB.805/806 end on.
    jsassert("RESTORED: no filter was added — the trigger still reads `Filters (0)`",
             "return /Filters\\s*\\(0\\)/.test(document.body.textContent || '');",
             always=True, timeout=30),
]

write(test(
    "MOB.976_DIAG_Filter_Field_Types",
    "**TEMPORARY PROBE — which asset-lookup filter fields are `enum` / `record`?**\n"
    "- `MultiValueSelector` branches three ways on `field.type` and **`MOB.806` covers one**\n"
    "  (`TagsInput`). Covering the other two needs a field that HAS one of those types, and\n"
    "  **nothing here knows which** — `AssetLookup/index.tsx:180` passes\n"
    "  `fields={s.data?._info.fields}`, the **runtime server schema**.\n"
    "- ⚠️ **Two cheaper ideas were checked and ruled out**: the operator list cannot tell them\n"
    "  apart (`utils.ts:12-25` gives `string`, `enum` **and** `record` the same `STRING_OPS`),\n"
    "  and the jest mocks carry no field metadata. The value control is the only discriminator.\n"
    "- **Reading it**: every probe is `optional`, so one run reports all. Per field INDEX —\n"
    "  deliberately not by name, which would be a guess — `-> MULTISELECT` passing means that\n"
    "  field is `enum` or `record`; `-> TAGSINPUT` means plain string.\n"
    "- ⚠️ `enum` and `record` render the **same placeholder**; the `HINT` probe separates them by\n"
    "  whether options are present immediately, which is a **hint, not a proof**.\n"
    "- 🛑 **READ-ONLY** — changes only the DRAFT filter row and closes with Escape without adding\n"
    "  one. `useFilterState` persists across the session, so the final probe re-asserts\n"
    "  `Filters (0)`.\n"
    "- **Delete once the branches are covered.** This is a probe, not coverage.",
    login_steps + steps,
    tags=["Mobile", "env:dev", "Search", "DIAG", "read-only"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))
print("wrote MOB.976 (DIAG: filter field types by index)")
