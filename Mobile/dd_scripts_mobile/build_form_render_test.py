"""Build MOB.355_Work_Form_Render - the work form RENDERS. Deliberately not filled.

WHY THIS EXISTS, AND WHY IT IS SCOPED THIS WAY
  `MOB.134` tried to FILL a work form and never passed - five attempts, five distinct causes,
  and the last one measured is decisive: typed text never lands in the field at all (DIAG-1
  failed before the blur even happened). See `dd_tests_mobile/_archive/README.md`.

  But everything UP TO the typing worked, every time: the work list gate, the work order, the
  Forms tab, the form card, the route, the container, the field widgets. The route
  `/work/:workStageId/form/:formId` was therefore recorded as uncovered when in fact only the
  WRITE was blocked - and the repo owner's point (2026-08-21) is the right one: work forms are
  freely customisable, so what is worth asserting is that the form RENDERS ITS DEFINITION, not
  that a particular field accepts particular text.

  So this proves the route and the render, and stops there. It is the achievable part of what
  `MOB.134` was trying to do, and it is worth more than the nothing that was there before.

TEMPLATE-AGNOSTIC ON PURPOSE
  A work form's contents are configured per workflow: fields, TEXT widgets, sections and
  signature widgets, in any combination. So NOTHING here names a field, a form, or a count -
  it asserts the SHAPE the renderer always produces:
    - the route is `/work/<id>/form/<id>`
    - the desktop form container `#apm-dv-tabpanel` mounted
    - at least one `.ws-form-widget` - i.e. the definition produced at least one real field
    - the `Progress` bar that `FormDetails` renders after the form
  That survives the fixture's form being edited, replaced, or swapped for another workflow's,
  which a field-level assertion would not.

⚠️ `#apm-dv-tabpanel`, NOT `#senor-work-form`. `FormDetails.tsx:106` renders the DESKTOP form
whenever `screen.availWidth >= 750`, and chrome.tablet is above that (trap 18). The phone
container cannot exist here, and trap 1 forbids adding a phone device.

READ-ONLY. It types nothing and submits nothing - which is also why it can pass where
`MOB.134` could not.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write,  # noqa: E402
                      jsassert, work_cache_warm)

WORK_URL = BASE + "/work"
WORK_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
WORK_DETAIL = f"{WORK_URL}/{WORK_ID}"

CONTAINER = '//*[@id="apm-dv-tabpanel"]'
# The form card: a Paper carrying a Title, inside the tab panel that is NOT hidden. Mantine
# keeps inactive panels mounted with an inline `display: none` (trap 3), which is the only
# thing separating the Forms panel's cards from every other panel's.
PANEL = '//*[@role="tabpanel"][not(contains(@style, "display: none"))]'
PAPER = '*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")]'
TITLE = '*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]'
FIRST_FORM_CARD = f'({PANEL}//{PAPER}[.//{TITLE}])[1]'

steps = (
    work_cache_warm()
    + [
        go(WORK_DETAIL, "the fixture work order"),
        step("wait", "Let the detail view begin rendering", {"value": 3}),
        step("assertElementPresent", "GATE: the detail data arrived (tab strip)",
             {"element": xpath_el(WORK_DETAIL, '(//*[@role="tab"])[1]')}, timeout=60),

        step("click", "Open the Forms tab",
             {"element": xpath_el(WORK_DETAIL,
                                  '//*[@role="tab"][contains(normalize-space(.), "Form")]')},
             timeout=30),
        step("wait", "Wait for the forms list", {"value": 3}),

        # FIXTURE GUARD: there has to BE a form on the work order. Named as a fixture question
        # so that failure is not mistaken for a broken locator - MOB.134 lost runs to exactly
        # that confusion when the `Inspection` form disappeared.
        step("assertElementPresent",
             "FIXTURE GUARD: the work order has at least one form card",
             {"element": xpath_el(WORK_DETAIL, FIRST_FORM_CARD)}, timeout=60),

        step("click", "Open the first form card",
             {"element": xpath_el(WORK_DETAIL, FIRST_FORM_CARD)}, timeout=60),
        step("wait", "Let the form page render", {"value": 4}),

        # ---- the route ------------------------------------------------------------------
        # `/work/:workStageId/form/:formId` - the only entry in MOBILE_ROUTES.WORK.children,
        # and until now the one route in mobile with no passing test.
        jsassert("ROUTE: we are on /work/<id>/form/<id>",
                 "return /\\/work\\/[^/]+\\/form\\/[^/]+$/.test(location.pathname);",
                 timeout=60),

        # ---- the render -----------------------------------------------------------------
        step("assertElementPresent", "The desktop form container mounted",
             {"element": xpath_el(WORK_DETAIL, CONTAINER)}, timeout=60),
        jsassert("The form definition produced at least one field widget",
                 "const c = document.getElementById('apm-dv-tabpanel');\n"
                 "if (!c) return false;\n"
                 "return c.querySelectorAll('.ws-form-widget').length >= 1;", timeout=30),
        jsassert("Those widgets contain real inputs — the form is interactive, not a "
                 "read-only dump",
                 "const c = document.getElementById('apm-dv-tabpanel');\n"
                 "if (!c) return false;\n"
                 "const inputs = [...c.querySelectorAll('input, textarea, select')]"
                 ".filter(e => e.closest('.ws-form-widget'));\n"
                 "return inputs.length >= 1;", timeout=30),
        # `FormDetails` renders a Mantine Progress immediately after the form. Asserting it
        # proves we reached the END of that component's output, not just its first child.
        jsassert("The form's completion Progress bar rendered — the whole component is up",
                 "return document.querySelectorAll("
                 "'.mantine-Progress-root, [class*=\"mantine-Progress\"]').length >= 1;",
                 timeout=30),

        # A field widget carries its own header controls (`FormFieldWidget`), so this
        # distinguishes "the grid rendered" from "the grid rendered EMPTY".
        jsassert("At least one widget carries its field header — not an empty grid",
                 "const c = document.getElementById('apm-dv-tabpanel');\n"
                 "if (!c) return false;\n"
                 "return c.querySelectorAll('.ws-form-widget-header').length >= 1;",
                 optional=True, timeout=30),
    ]
)

write(test(
    "MOB.355_Work_Form_Render",
    "`MOB.355` A work order's **form renders** — the achievable half of what `MOB.134` was\n"
    "trying to do.\n"
    "- **Covers `/work/:workStageId/form/:formId`**, the only entry in\n"
    "  `MOBILE_ROUTES.WORK.children` and previously the one route in mobile with no passing\n"
    "  test. Everything up to the typing always worked; only the WRITE was blocked.\n"
    "- **Deliberately does NOT fill anything.** Typed text never lands in these fields\n"
    "  (measured — `dd_tests_mobile/_archive/README.md`), and work forms are freely\n"
    "  customisable anyway, so the render is the durable thing to assert.\n"
    "- **Template-agnostic**: names no field, form or count. It asserts the shape the renderer\n"
    "  always produces — the route, `#apm-dv-tabpanel`, ≥1 `.ws-form-widget`, real inputs\n"
    "  inside those widgets, and the trailing `Progress` bar that proves the whole component\n"
    "  rendered rather than just its first child. Survives the fixture's form being edited or\n"
    "  swapped.\n"
    "- ⚠️ `#apm-dv-tabpanel`, **not** `#senor-work-form` — `FormDetails.tsx:106` renders the\n"
    "  desktop form above 750px and chrome.tablet is above it (trap 18).\n"
    "- **READ-ONLY**, which is also why it can pass where `MOB.134` could not.",
    steps,
    tags=["Mobile", "env:dev", "Work Orders", "read-only"],
))
print("wrote MOB.355 (work form renders)")
