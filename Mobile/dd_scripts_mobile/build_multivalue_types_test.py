"""Build MOB.807 - `MultiValueSelector`'s `enum` and `record` branches (checklist 🟢 #1).

WHAT IT COVERS
  With operator `includes`, `StructuredQuery` swaps its value input for `MultiValueSelector`
  (`ui/StructuredQuery/MultiValueSelector.tsx`), which forks on field type:

      enum    -> MultiSelect, options PRE-LOADED from `field.options`
      record  -> RecordMultiSelect, options loaded from the SERVER via `loadFilterOptions`
      other   -> TagsInput                                            (MOB.806)

  The field list is runtime schema (trap 15), so it was read through the API for 0 runs rather
  than probed again: `Failure Curve` is an `enum` with 7 label options (stored as `FLAT`, ... -
  the server accepts the label, measured), and `Asset Type` is a `record` with a `query`.

⭐ ENUM, END TO END
  Pick `flat` -> `Add Filter` goes live -> the pill reads `Failure Curve includes flat` -> and
  the asset list RE-QUERIED: its first rendered rows are not the unfiltered ones (measured
  through the API: 81 of 303 assets are FLAT, and only 2 of the first 8 names coincide).

🟡 RECORD IS BROKEN TWICE (bugs §39) - measured through the API before a run was spent
  `addFilter` (`StructuredQuery/index.tsx:100-106`) builds a record filter's value as
  `(vals.value as listFilterOption)?.label || ...?.name` - written for ONE option object. With
  `includes`, `vals.value` is an ARRAY of ids, so the value is `undefined`:
      the pill reads `Asset Type includes` and nothing else
      the condition goes out as `{ column: 'typeId', operator: 'IN' }` - and the server IGNORES
      it: 303 of 303 assets come back
  (and the ids it held would not have helped: `IN [id]` returns 0; the server matches NAMES.)
  The branch itself is asserted (options arrive from the server, a pick makes the draft valid);
  the broken outcome is two OPTIONAL sentinels, so a fix turns them red without failing this.

READ-ONLY: filters are an in-memory store (`useFilterState`); both are cleared `always`.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      open_filters_drawer)

LOOKUP_URL = BASE + "/asset-lookup"
ENUM_FIELD, ENUM_VALUE = "Failure Curve", "flat"
RECORD_FIELD = "Asset Type"
VALUES_PLACEHOLDER = "Choose values..."          # both MultiSelect branches
TAGS_PLACEHOLDER = "Type and press Enter..."     # the TagsInput branch (MOB.806)

BTN = '//button[normalize-space(.)="{}"]'
ADD = BTN.format("Add Filter")
CLEAR_ALL = BTN.format("Clear all")

# The MultiSelect's OWN listbox: its input names it in aria-controls while open, so a stale
# option left by the Field/Operator selects (trap 3) can never answer.
LISTBOX_JS = (
    "const inp = document.querySelector('input[placeholder=\"" + VALUES_PLACEHOLDER + "\"]');\n"
    "const host = inp && inp.closest('[aria-controls]');\n"
    "const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');\n"
    "if (!lb) return false;\n"
    "const opts = [...lb.querySelectorAll('[role=\"option\"]')];\n"
    "const labels = opts.map(o => (o.textContent || '').trim());\n")
# The rendered asset rows, as a key per row - enough to tell one result window from another.
WINDOW_JS = ("const win = [...document.querySelectorAll('[class*=\"mantine-Accordion-control\"]')]\n"
             "  .slice(0, 8).map(c => (c.textContent || '').trim());\n")
ADD_BTN_JS = ("const add = [...document.querySelectorAll('button')]\n"
              "  .find(x => (x.textContent || '').trim() === 'Add Filter');\n"
              "if (!add) return false;\n")


def pill_js(field):
    return ("const pill = [...document.querySelectorAll('[class*=\"mantine-Pill-root\"]')]\n"
            f"  .find(p => (p.textContent || '').includes('{field}'));\n"
            "if (!pill) return false;\n"
            "const ptext = (pill.textContent || '').replace(/\\s+/g, ' ').trim();\n")


def pick_field_and_includes(field):
    return [
        step("click", "Open the Field select", {"element": xpath_el(LOOKUP_URL, '//*[@id="fieldId"]')},
             timeout=30),
        step("wait", "Wait for Field options", {"value": 2}),
        step("click", f'Pick Field = "{field}"',
             {"element": xpath_el(LOOKUP_URL, f'//*[@role="option"][normalize-space(.)="{field}"]')},
             timeout=30),
        step("click", "Open the Operator select", {"element": xpath_el(LOOKUP_URL, '//*[@id="operator"]')},
             timeout=30),
        step("wait", "Wait for Operator options", {"value": 2}),
        step("click", 'Pick Operator = "includes" (the MULTI-value branch)',
             {"element": xpath_el(LOOKUP_URL, '//*[@role="option"][normalize-space(.)="includes"]')},
             timeout=30),
        step("wait", "Let the value input swap", {"value": 2}),
        jsassert(f"{field.upper()}: a MultiSelect rendered — not the TagsInput, not `#value`",
                 f"return !!document.querySelector('input[placeholder=\"{VALUES_PLACEHOLDER}\"]')\n"
                 f"  && !document.querySelector('input[placeholder=\"{TAGS_PLACEHOLDER}\"]')\n"
                 "  && !document.getElementById('value');", timeout=30),
        step("click", "Open the values dropdown",
             {"element": xpath_el(LOOKUP_URL, f'//input[@placeholder="{VALUES_PLACEHOLDER}"]')},
             timeout=30),
        step("wait", "Let the options load", {"value": 3}),
    ]


def close_dropdown_and_add():
    return [
        jsassert("Close the values dropdown (blur) so it cannot sit over `Add Filter`",
                 "if (document.activeElement) document.activeElement.blur();\nreturn true;",
                 timeout=15),
        step("wait", "Let the dropdown close", {"value": 1}),
        jsassert("VALID: with one value chosen, `Add Filter` is LIVE (type=submit)",
                 ADD_BTN_JS + "return add.type === 'submit';", timeout=30),
        step("click", "Add the filter", {"element": xpath_el(LOOKUP_URL, ADD)}, timeout=30),
        step("wait", "Let the filter apply and the list re-query", {"value": 4}),
    ]


def clear_and_close(always=True):
    return [
        step("click", 'Restore: "Clear all"', {"element": xpath_el(LOOKUP_URL, CLEAR_ALL)},
             always=always, timeout=30),
        step("wait", "Let the unfiltered re-query run", {"value": 4}, always=always),
        jsassert("RESTORED: no active filter pills remain",
                 "return document.querySelectorAll('[class*=\"mantine-Pill-root\"]').length === 0;",
                 always=always, timeout=30),
        step("pressKey", "Close the Filters drawer", {"value": "Escape"}, always=always),
        step("wait", "Let the drawer close", {"value": 2}, always=always),
    ]


steps = [
    go(LOOKUP_URL, "asset lookup"),
    step("wait", "Let the page begin loading", {"value": 3}),
    step("assertElementContent", 'Test the "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup",
          "element": xpath_el(LOOKUP_URL, '//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]')},
         timeout=30),
    step("wait", "Let the asset list render", {"value": 3}),
    jsassert("CAPTURE: the unfiltered list's first rendered rows",
             WINDOW_JS + "if (win.length < 3) return false;\n"
             "window.__ddUnfiltered = JSON.stringify(win);\nreturn true;", timeout=30),

    # ---- ENUM ------------------------------------------------------------------------------
    *open_filters_drawer(LOOKUP_URL),
] + pick_field_and_includes(ENUM_FIELD) + [
    jsassert(f"⭐ ENUM: the options are PRE-LOADED from the schema — several, `{ENUM_VALUE}` among "
             "them, nothing typed",
             LISTBOX_JS + f"return labels.length >= 2 && labels.includes('{ENUM_VALUE}');", timeout=30),
    jsassert(f'Pick "{ENUM_VALUE}" from the MultiSelect\'s own listbox',
             LISTBOX_JS + f"const o = opts.find(x => (x.textContent || '').trim() === '{ENUM_VALUE}');\n"
             "if (!o) return false;\no.click();\nreturn true;", timeout=30),
    step("wait", "Let the pick register", {"value": 1}),
] + close_dropdown_and_add() + [
    jsassert(f"⭐ ENUM: the pill reads `{ENUM_FIELD} includes {ENUM_VALUE}`",
             pill_js(ENUM_FIELD) + f"return ptext.includes('includes') && ptext.endsWith('{ENUM_VALUE}');",
             timeout=30),
    step("pressKey", "Close the drawer to see the list", {"value": "Escape"}),
    step("wait", "Let the drawer close", {"value": 2}),
    jsassert("⭐ ENUM: the list RE-QUERIED — its first rows are not the unfiltered ones",
             WINDOW_JS + "return win.length >= 1 && JSON.stringify(win) !== window.__ddUnfiltered;",
             timeout=30),
    *open_filters_drawer(LOOKUP_URL, label="Reopen the Filters drawer"),
] + clear_and_close() + [

    # ---- RECORD ----------------------------------------------------------------------------
    jsassert("The list is unfiltered again — the same first rows as at the start",
             WINDOW_JS + "return JSON.stringify(win) === window.__ddUnfiltered;", timeout=30),
    *open_filters_drawer(LOOKUP_URL, label="Open the Filters drawer for the record field"),
] + pick_field_and_includes(RECORD_FIELD) + [
    jsassert("⭐ RECORD: the options arrived from the SERVER (`loadFilterOptions`) — capture the "
             "first one",
             LISTBOX_JS + "if (!labels.length || !labels[0]) return false;\n"
             "window.__ddRecordPick = labels[0];\nreturn true;", timeout=30),
    jsassert("Pick that option from the MultiSelect's own listbox",
             LISTBOX_JS + "const o = opts.find(x => (x.textContent || '').trim() === window.__ddRecordPick);\n"
             "if (!o) return false;\no.click();\nreturn true;", timeout=30),
    step("wait", "Let the pick register", {"value": 1}),
] + close_dropdown_and_add() + [
    jsassert(f"SENTINEL (bugs §39): the pill reads `{RECORD_FIELD} includes` with NO value — "
             "`addFilter` took `.label` of an ARRAY. Red here means it was fixed: rewrite this step",
             pill_js(RECORD_FIELD) + "return ptext.endsWith('includes')\n"
             "  && !ptext.includes(window.__ddRecordPick || '\\u0000');", optional=True, timeout=30),
    step("pressKey", "Close the drawer to see the list", {"value": "Escape"}, optional=True),
    step("wait", "Let the drawer close", {"value": 2}, optional=True),
    jsassert("SENTINEL (bugs §39): …and the list did NOT narrow — the first rows are the "
             "unfiltered ones; the server ignored a condition with no value",
             WINDOW_JS + "return JSON.stringify(win) === window.__ddUnfiltered;",
             optional=True, timeout=30),
    *[dict(s, alwaysExecute=True) for s in open_filters_drawer(LOOKUP_URL, label="Reopen the Filters drawer to clear")],
] + clear_and_close()

write(test(
    "MOB.807_Search_MultiValue_Enum_Record",
    "`MOB.807` **`MultiValueSelector`'s `enum` and `record` branches** — checklist 🟢 #1.\n"
    "- `MOB.806` covers the `TagsInput` branch; this covers the other two, with fields chosen\n"
    "  from the runtime schema read over the API (trap 15): `Failure Curve` (enum) and\n"
    "  `Asset Type` (record).\n"
    "- ⭐ **Enum, end to end**: options pre-loaded without typing, `flat` picked, `Add Filter`\n"
    "  live, pill `Failure Curve includes flat`, and the list re-queried (its first rows change).\n"
    "- 🟡 **Record (bugs §39)**: options arrive from the server and a pick makes the draft valid,\n"
    "  but `addFilter` reads `.label` off an ARRAY, so the filter is saved with no value — the pill\n"
    "  shows none, and the server ignores the condition (303 of 303 assets, measured). Two\n"
    "  OPTIONAL sentinels record it.\n"
    "- Pick steps go through the MultiSelect's own listbox (`aria-controls`), never a bare\n"
    "  `role=option`, which could hit a stale Field/Operator option (trap 3).\n"
    "- READ-ONLY: both filters are cleared `always`.",
    steps,
    ["Mobile", "env:dev", "Search", "StructuredQuery", "read-only"],
))
print("wrote MOB.807 (multi-value enum + record)")
