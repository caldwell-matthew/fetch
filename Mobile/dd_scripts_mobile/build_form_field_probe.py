"""Build MOB.977_DIAG_FormField_Probe - is a work form field WRITABLE by a Synthetics test?

THE ONE QUESTION THIS ANSWERS
  `MOB.134` (archived) reaches the form, types into a visible field, blurs, and nothing
  persists. Cause traced to `tabs/forms/Form.tsx:148`:

      const fieldId = evt.target.id;
      const field = props.fields.find(f => f.id === fieldId);
      if (!field) return;                       // silent no-op
      ...
      props.onBlur(value, fieldId, ...);

  So a blur only saves when the blurred input's DOM `id` is a FIELD ID. `InlineFormField`
  renders `<Input id={field.id}>`, so real field inputs carry a record id; anything Mantine
  generates carries `mantine-*`. That is the whole question, and it is measurable:

      IS THERE A VISIBLE INPUT IN `#apm-dv-tabpanel` WHOSE id IS NOT MANTINE-GENERATED?

  YES -> `MOB.134` is one targeted edit from working: aim at that input.
  NO  -> filling a work form is NOT automatable through this path, and MOB.134 should stay
         archived permanently with that recorded as the reason.

WHY A PROBE RATHER THAN ANOTHER ATTEMPT ON MOB.134
  MOB.134 failed five times, each on a DIFFERENT cause, because every attempt was an edit
  followed by a hopeful run. Four of those causes are fixed and demonstrated; the fifth is
  this one. Measuring it read-only settles it in a single run either way, and cannot leave the
  fixture in a strange state - trap 15, applied to the decision itself rather than to a
  locator.

READ-ONLY. It navigates, opens a form, and reads DOM properties. It types nothing and submits
nothing.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, HERE, step, xpath_el, go, test, write,  # noqa: E402
                      jsassert, work_cache_warm)

WORK_URL = BASE + "/work"
WORK_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
WORK_DETAIL = f"{WORK_URL}/{WORK_ID}"

CONTAINER = '//*[@id="apm-dv-tabpanel"]'
PANEL = '//*[@role="tabpanel"][not(contains(@style, "display: none"))]'
PAPER = '*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")]'
TITLE = '*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]'
FIRST_FORM_CARD = f'({PANEL}//{PAPER}[.//{TITLE}])[1]'

# The shared accessor every probe reads through.
#   all     - editable inputs in the desktop form container
#   inW     - those inside a `.ws-form-widget` (a real field widget)
#   isVis   - Datadog refuses to click anything this is false for
#   realId  - an id that could be a FIELD id: present, and not Mantine-generated
JS = ("const c = document.getElementById('apm-dv-tabpanel');\n"
      "if (!c) return false;\n"
      "const all = [...c.querySelectorAll('input')]"
      ".filter(e => !['checkbox','radio','hidden','file'].includes(e.type));\n"
      "const inW = all.filter(e => e.closest('.ws-form-widget'));\n"
      "const isVis = e => !!(e.offsetParent || e.getClientRects().length);\n"
      "const realId = e => !!e.id && !/^mantine-/.test(e.id);\n")

login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]


def probe(name, expr):
    return jsassert(name, JS + f"return {expr};", optional=True, always=True, timeout=10)


steps = (
    login_steps
    + work_cache_warm()
    + [
        go(WORK_DETAIL, "the fixture work order"),
        step("wait", "Let the detail view begin rendering", {"value": 3}),
        step("assertElementPresent", "GATE: the detail data arrived (tab strip)",
             {"element": xpath_el(WORK_DETAIL, '(//*[@role="tab"])[1]')}, timeout=60),
        step("click", "Open the Forms tab",
             {"element": xpath_el(WORK_DETAIL,
                                  '//*[@role="tab"][contains(normalize-space(.), "Form")]')},
             optional=True, always=True, timeout=60),
        step("wait", "Wait for the forms list", {"value": 3}),
        step("click", "Open the first form card",
             {"element": xpath_el(WORK_DETAIL, FIRST_FORM_CARD)},
             optional=True, always=True, timeout=60),
        step("wait", "Let the form render", {"value": 4}),
        jsassert("GATE: the desktop form container mounted",
                 "return !!document.getElementById('apm-dv-tabpanel');",
                 optional=True, always=True, timeout=60),

        # ---- shape ---------------------------------------------------------------------
        probe("A1: the container holds at least one editable input", "all.length >= 1"),
        probe("A2: at least one is inside a .ws-form-widget", "inW.length >= 1"),
        probe("A3: at least one editable input is VISIBLE", "all.some(isVis)"),

        # ---- ids: the decisive question --------------------------------------------------
        probe("B1: at least one input has a NON-EMPTY id", "all.some(e => !!e.id)"),
        probe("B2: at least one input has a NON-MANTINE id (could be a field id)",
              "all.some(realId)"),
        probe("B3 ⭐ DECISIVE: a VISIBLE input has a NON-MANTINE id — MOB.134 is fixable",
              "all.some(e => isVis(e) && realId(e))"),
        probe("B4: EVERY visible input's id is Mantine-generated — MOB.134 is NOT fixable",
              "const vis = all.filter(isVis);\n"
              "return vis.length > 0 && vis.every(e => !realId(e));"),

        # ---- where is it? so the fix can be aimed ---------------------------------------
        probe("C0: the input MOB.134 currently targets (inW[1]) has a non-Mantine id",
              "return inW.length > 1 && realId(inW[1]);"),
        probe("C1: the first visible non-Mantine-id input is inside a .ws-form-widget",
              "const t = all.find(e => isVis(e) && realId(e));\n"
              "return !!t && !!t.closest('.ws-form-widget');"),
    ]
    + [
        # Its index among the widget inputs, so the fix is an aimed edit, not a guess.
        jsassert(f"C2: that input is inW[{i}]",
                 JS + "const t = all.find(e => isVis(e) && realId(e));\n"
                 f"return !!t && inW.indexOf(t) === {i};",
                 optional=True, always=True, timeout=10)
        for i in range(0, 5)
    ]
    + [
        probe("D1: how many inputs carry a non-Mantine id — exactly one",
              "all.filter(realId).length === 1"),
        probe("D2: how many inputs carry a non-Mantine id — two or more",
              "all.filter(realId).length >= 2"),

        # One non-optional guard, so an all-optional probe cannot pass on a blank page (trap 5).
        jsassert("GUARD: the form container is present and holds editable inputs",
                 JS + "return all.length > 0;", always=True, timeout=30),
    ]
)

write(test(
    "MOB.977_DIAG_FormField_Probe",
    "`MOB.977` **DIAGNOSTIC — is a work form field writable by a Synthetics test?**\n"
    "- Answers ONE question: **is there a VISIBLE input in `#apm-dv-tabpanel` whose `id` is\n"
    "  not Mantine-generated?** `Form.tsx:148` saves on blur only when the blurred input's id\n"
    "  is a FIELD id, and `InlineFormField` renders `<Input id={field.id}>` — so a real field\n"
    "  carries a record id and Mantine's own inputs carry `mantine-*`.\n"
    "- **B3 says MOB.134 is fixable; B4 says it is not** and form filling should stay\n"
    "  archived as not-automatable. `C2` names the index so the fix is aimed, not guessed.\n"
    "- READ-ONLY — it types nothing and submits nothing.\n"
    "- Written instead of another attempt on `MOB.134`, which failed five times because every\n"
    "  attempt was an edit followed by a hopeful run. **Delete once the question is settled.**",
    steps,
    tags=["Mobile", "env:dev", "Diagnostic", "read-only"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))
print("wrote MOB.977 (form field writability probe)")
