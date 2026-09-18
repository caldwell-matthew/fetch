"""Build MOB.331_Work_GenInfo_Value_Modal - the arrow beside a multiline field opens its full VALUE.

WHAT THE SOURCE SAYS (`DetailPage/utils/MultiLineLabel.tsx`, `DetailPage/GeneralInfo.tsx:94-101`)
  General Info passes every `multiline` / `richtext` field a `labelRightSection`:

      <MultiLineLabel label={methods.getValues(field.id)} />

  and `MultiLineLabel` returns NOTHING when that value is empty; otherwise an `ActionIcon` holding a
  `faSquareArrowUpRight` icon, and a `Modal` that shows the value through `RichTextDisplay`. Despite the
  prop name, `label` is the field's VALUE, not its label.

  ⚠️ THE CLICK HANDLER IS ON THE ICON, NOT THE BUTTON: `<FontAwesomeIcon onClick={open} />` inside
  `<ActionIcon aria-label="Settings">`. So the click is dispatched on the <svg>, and the misleading
  `Settings` label is not relied on.
  ⚠️ trap 14: `faSquareArrowUpRight`'s alias is `external-link-square`; it renders its canonical
  `square-arrow-up-right` (read from node_modules).

THE FIXTURE MAKES IT A BICONDITIONAL, IN ONE READ (read over /graphql 2026-09-17)
  Both of WorkStage's `multiline` fields are on this form: `desc` (`Stage Notes`) holds `DATADOG FIXTURE`,
  `problemDesc` (`Problem Description`) is null. So the arrow must render beside Stage Notes AND must not
  beside Problem Description - a component that always drew it, or never did, fails one half.
  `MOB.395` writes `desc` and restores it to `DATADOG FIXTURE`; the premise here reads the value first, so a
  run after a half-finished MOB.395 fails on the premise rather than on a stranger's text.

READ-ONLY. It opens and closes a modal. Nothing is typed, so the form is never dirty and nothing is sent.

THE WARM-UP IS `work_list_gate`, NOT A DEEP LINK ALONE: General Info builds its form from cached schema,
the way every General Info test here gets it (the blind-warm-up sweep, 2026-09-17).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert, work_list_gate  # noqa: E402

FIXTURE_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
STAGE_URL = f"{BASE}/work/{FIXTURE_ID}"
VALUE = "DATADOG FIXTURE"
GEN_TAB = '//*[@role="tab"][normalize-space(.)="General Info"]'
ICON = "square-arrow-up-right"

# A field's container: `FormFieldContainer` (`helper-components/FormField/index.tsx:319-352`) renders
#     div.form-group > label[for=id] + div (the labelRightSection) + the input
# so the arrow is a SIBLING of the Textarea's own Mantine InputWrapper, not inside it — scoping to the
# InputWrapper found nothing on local replay 1. Scope to `.form-group`.
FIELD_JS = ("const field = id => {\n"
            "  const i = document.getElementById(id);\n"
            "  return i && i.closest('.form-group');\n"
            "};\n"
            f"const arrow = w => w && w.querySelector('svg[data-icon=\"{ICON}\"]');\n")
VALUE_MODAL = ("const m = [...document.querySelectorAll('.mantine-Modal-content')]\n"
               f"  .find(x => ((x.querySelector('.mantine-Modal-body') || {{}}).textContent || '').trim() === '{VALUE}');\n")

steps = [
    *work_list_gate(require_row=False),
    go(STAGE_URL, "the fixture work order"),
    step("wait", "Let the detail view begin rendering", {"value": 2}),
    step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}, timeout=30),
    step("click", 'Open the "General Info" tab', {"element": xpath_el(STAGE_URL, GEN_TAB)}, timeout=30),
    step("assertElementPresent", '"General Info" is the active tab',
         {"element": xpath_el(STAGE_URL, f"{GEN_TAB}[@data-active]")}, timeout=30),
    jsassert(f"PREMISE: the form shows Stage Notes (`#desc`) = `{VALUE}` and an empty Problem Description "
             "(`#problemDesc`) — the two multiline fields",
             "const d = document.getElementById('desc'), p = document.getElementById('problemDesc');\n"
             f"return !!document.getElementById('mobile-genInfo') && !!d && d.value === '{VALUE}' && !!p && !p.value;",
             timeout=45),
    jsassert("⭐ The value arrow renders beside Stage Notes (it holds a value) and NOT beside Problem "
             "Description (empty) — `MultiLineLabel` returns nothing for an empty value",
             FIELD_JS + "return !!arrow(field('desc')) && !!field('problemDesc') && !arrow(field('problemDesc'));",
             timeout=30),
    jsassert("Click Stage Notes' arrow — dispatched on the ICON, which carries the onClick "
             "(its ActionIcon's `aria-label` is `Settings` and does nothing)",
             FIELD_JS + "const a = arrow(field('desc'));\n"
             "if (!a) return false;\n"
             "a.dispatchEvent(new MouseEvent('click', { bubbles: true }));\nreturn true;", timeout=20),
    jsassert(f"⭐ A modal opened showing the field's VALUE — exactly `{VALUE}` (not its label `Stage Notes`)",
             VALUE_MODAL + "return !!m;", timeout=20),
    jsassert("Close it with its own close button",
             VALUE_MODAL + "const c = m && m.querySelector('.mantine-Modal-close');\n"
             "if (!c) return false;\nc.click();\nreturn true;", always=True, timeout=20),
    jsassert("The value modal is gone", VALUE_MODAL + "return !m;", always=True, timeout=20),
    jsassert(f"RESTORED: the form is untouched — Stage Notes still `{VALUE}`, nothing typed",
             f"const d = document.getElementById('desc');\nreturn !!d && d.value === '{VALUE}';",
             always=True, timeout=20),
]

write(test(
    "MOB.331_Work_GenInfo_Value_Modal",
    "`MOB.331` **The arrow beside a multiline field opens its full value.**\n"
    f"- General Info's Stage Notes (`desc` = `{VALUE}`) carries the arrow; Problem Description\n"
    "  (`problemDesc`, empty) does not — `MultiLineLabel` renders nothing for an empty value, so\n"
    "  the pair is a biconditional read at once.\n"
    f"- Clicking it opens a modal showing exactly `{VALUE}` — the field's VALUE, not its label.\n"
    "- ⚠️ The onClick is on the icon, not the button (whose `aria-label` is `Settings`), so the\n"
    "  click is dispatched on the <svg>.\n"
    "- Read-only: a modal opened and closed, nothing typed.",
    steps,
    ["Mobile", "env:dev", "Work Order", "read-only"],
))

print("wrote MOB.331 (General Info value modal)")
