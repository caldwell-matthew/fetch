"""Build MOB.389 - the work-order asset lookups match regardless of case (checklist 🟢 #19).

WHAT CHANGED, AND WHY IT NEEDS A TEST
  Until `cad415620c` the Condition and Failure forms filtered their asset lookup with
  `v.name.includes(str)` against a LOWER-CASED query (bugs §1, found at runtime by `MOB.390`:
  typing the visible name `Pump 0102` returned nothing). Both now lowercase both sides
  (`Conditions/Form.tsx:107`, `Failures/Form.tsx:80`). A fix with no test is a fix that can
  quietly come back - and this one came back once already: §1 was a pattern, fixed in one
  lookup while its twin stayed broken.

THE PROOF IS A MATCHED PAIR, IN EACH FORM
  1. NO MATCH   `ZZZZ-NO-SUCH-ASSET` -> the field's own dropdown says `No results found` and
                lists nothing. Without this, a filter that ignored its input and always
                returned every asset would pass step 2 (trap 5).
  2. WRONG CASE `pUMP 0102` (the fixture name, case-swapped) -> the dropdown lists exactly
                `Pump 0102`. Under the old code this was the `No results found` screen.
  The typed value is asserted to DIFFER from the name it finds, so the probe cannot
  silently degrade into an exact-case search.

⭐ SCOPED TO THE FIELD'S OWN DROPDOWN, NOT THE PAGE
  Mantine's `Combobox.Target` clones `ListFilter`'s wrapper `<span>` and gives it
  `aria-controls = <listbox id>` while the dropdown is open (`use-combobox-target-props.mjs:
  71`). The assertions follow that link from `#assetId`, so an option left behind by another
  dropdown (Combobox keeps closed dropdowns' DOM - see `build_tab_tests.lookup`) can never
  answer for this one.

READ-ONLY. The add form is opened, probed and closed with its close button; nothing is
submitted. Closing unmounts the form (`NewItemForm.tsx: {opened && Form(...)}`), so "the form
element is gone" is a true closed signal.

FIXTURE: `Pump 0102` is the only asset attached to the fixture work order (read over the API
for 0 runs); the lookup lists only attached assets. The same constant is `MOB.390`'s.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

# Shared with build_tab_tests.py (MOB.390/391) - same fixture work order and asset.
FIXTURE_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
STAGE_URL = f"{BASE}/work/{FIXTURE_ID}"
WORK_URL = BASE + "/work"
ADD_BTN = '//button[normalize-space(.)="Add"]'
ASSET = "Pump 0102"
WRONG_CASE = ASSET.swapcase()            # "pUMP 0102"
NO_MATCH = "ZZZZ-NO-SUCH-ASSET"
assert WRONG_CASE != ASSET and WRONG_CASE.lower() == ASSET.lower()

FORMS = [("Condition", "work-condition-form"), ("Failure", "work-failure-form")]

INPUT_JS = ("const el0 = document.getElementById('assetId');\n"
            "const inp = el0 && (el0.tagName === 'INPUT' ? el0 : el0.querySelector('input'));\n")
# The field's OWN listbox: the Combobox target (a wrapper of the input) names it while open.
LISTBOX_JS = (INPUT_JS +
              "const host = inp && inp.closest('[aria-controls]');\n"
              "const lb = host && document.getElementById(host.getAttribute('aria-controls') || '');\n"
              "if (!lb) return false;\n"
              "const titles = [...lb.querySelectorAll('[role=\"option\"] .option-title')]\n"
              "  .map(t => (t.textContent || '').trim());\n")


def tab(label):
    return f'//*[@role="tab"][contains(normalize-space(.), "{label}")]'


def type_lookup(value, label):
    """React's value setter + an `input` event: `ListFilter.onChange` then re-runs
    `loadOptions` with exactly this text. (`MOB.547`'s bench-proven recipe.)"""
    js = (INPUT_JS +
          "if (!inp) return false;\n"
          "const view = inp.ownerDocument.defaultView;\n"
          "const setter = Object.getOwnPropertyDescriptor(\n"
          "  view.HTMLInputElement.prototype, 'value').set;\n"
          f"setter.call(inp, {json.dumps(value)});\n"
          "inp.dispatchEvent(new view.Event('input', { bubbles: true }));\n"
          f"return inp.value === {json.dumps(value)};")
    return [
        jsassert(f"Type {label} into the asset lookup", js, timeout=30),
        step("wait", "Let the lookup re-filter", {"value": 2}),
    ]


def probe(form_label, form_id):
    return [
        step("click", f"Open the {form_label} tab",
             {"element": xpath_el(STAGE_URL, tab(form_label))}, timeout=30),
        step("click", "Open the add form", {"element": xpath_el(STAGE_URL, ADD_BTN)}, timeout=30),
        step("wait", "Let the form load its schema", {"value": 2}),
        step("assertElementPresent", f"The {form_label} form rendered (past `Loading form…`)",
             {"element": xpath_el(STAGE_URL, f'//form[@id="{form_id}"]//*[@id="assetId"]')},
             timeout=30),
        step("click", "Focus the asset lookup",
             {"element": xpath_el(STAGE_URL, f'//form[@id="{form_id}"]//*[@id="assetId"]')},
             timeout=30),
        step("wait", "Let the dropdown open", {"value": 1}),
    ] + type_lookup(NO_MATCH, f'"{NO_MATCH}"') + [
        jsassert(f"{form_label.upper()} NO MATCH: the field's own dropdown lists nothing and "
                 "says `No results found` — the filter really filters",
                 LISTBOX_JS +
                 "return titles.length === 0 && (lb.textContent || '').includes('No results found');",
                 timeout=30),
    ] + type_lookup(WRONG_CASE, f'"{WRONG_CASE}" (the fixture name, case-swapped)') + [
        jsassert(f"⭐ {form_label.upper()} WRONG CASE: `{WRONG_CASE}` finds exactly "
                 f"`{ASSET}` — before `cad415620c` this was `No results found` (bugs §1)",
                 LISTBOX_JS +
                 f"return inp.value === {json.dumps(WRONG_CASE)} && inp.value !== {json.dumps(ASSET)}\n"
                 f"  && titles.length === 1 && titles[0] === {json.dumps(ASSET)};", timeout=30),

        # ---- close without saving -----------------------------------------------------------
        jsassert("Close the add form with the modal's close button — nothing is submitted",
                 f"const f = document.getElementById('{form_id}');\n"
                 "const m = f && f.closest('[class*=\"mantine-Modal-content\"]');\n"
                 "const x = m && m.querySelector('button[class*=\"mantine-Modal-close\"]');\n"
                 "if (!x) return false;\n"
                 "x.click();\n"
                 "return true;", always=True, timeout=30),
        step("wait", "Let the modal close", {"value": 2}, always=True),
        jsassert(f"CLOSED: the {form_label} form is unmounted",
                 f"return !document.getElementById('{form_id}');", always=True, timeout=30),
    ]


steps = [
    # /work first warms the cache-only lookups - `build_tab_tests.open_fixture`'s recipe.
    go(WORK_URL, "/work to warm the lookup cache"),
    step("wait", "Wait for the work list and lookup prefetch", {"value": 20}),
    go(STAGE_URL, "the fixture work order"),
    step("wait", "Let the detail view begin rendering", {"value": 2}),
    step("assertPageContains", "Test work order detail rendered", {"value": "Status:"},
         timeout=30),
]
for label, form_id in FORMS:
    steps += probe(label, form_id)

write(test(
    "MOB.389_Work_Lookup_Case_Insensitive",
    "`MOB.389` **The Condition and Failure asset lookups match regardless of case** — the\n"
    "regression guard for bugs §1, fixed in `cad415620c` with no test.\n"
    f"- In each form, a matched pair in the field's own dropdown: `{NO_MATCH}` → `No results\n"
    f"  found` (the filter filters), then `{WRONG_CASE}` → exactly `{ASSET}` (it ignores case).\n"
    "  Before the fix the second probe was the `No results found` screen.\n"
    "- Assertions follow the Combobox's `aria-controls` from `#assetId` to its own listbox, so\n"
    "  a leftover dropdown elsewhere on the page can never answer.\n"
    "- READ-ONLY: each form is opened, probed and closed with its close button; nothing is\n"
    "  submitted.",
    steps,
    ["Mobile", "env:dev", "Work Order", "read-only"],
))
print("wrote MOB.389 (asset lookup case-insensitivity)")
