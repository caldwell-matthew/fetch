"""Build MOB.134_Work_Form_Fill - filling out an inserted form (T2.1's last forms item).

STATUS 2026-08-20: PARKED, UN-WIRED FROM MOB.989. Five distinct causes have been found and
four fixed; it has never passed. Read CAUSE 5 before spending another run on it.

CAUSE 5 - THE SAVE IS GATED ON THE INPUT'S `id`, AND THAT IS WHY NOTHING PERSISTS.
  The desktop form's blur handler (`tabs/forms/Form.tsx:148`) is:

      const fieldId = evt.target.id;
      const field = props.fields.find(f => f.id === fieldId);
      if (!field) return;                          // <- silent no-op
      ...
      if (!formState.isDirty || formState.invalid) return;
      props.onBlur(value, fieldId, ...);

  So a blur only saves when the blurred element's DOM `id` matches a field id in the form's
  own `fields` array. This test types into `(container//ws-form-widget//input)[2]` - chosen
  because it is the first VISIBLE input - and that element's id is evidently NOT a field id,
  so `handleOnBlur` returns immediately. That matches every symptom exactly: the text types,
  the blur fires, no `Field updated` toast appears, and the value is gone on re-navigation.

  NEXT STEP IF SOMEONE RESUMES IT: measure, do not guess (trap 15). Add a probe reporting
  (a) the `id` of each non-checkbox input inside `#apm-dv-tabpanel`, and (b) which of those
  ids the form actually knows about - the ids come from `InlineFormField`, which renders
  `<Input id={field.id}>`. Then target an input whose id IS a field id, which may well not be
  the first visible one. Only then is the blur path even reachable.

  RECOMMENDATION: retiring this is defensible. It has cost more than any other test here, the
  route it covers is `/work/:id/form/:formId`, and the repo owner has already recorded that
  forms are low priority for mobile. What it HAS produced is worth keeping either way: traps
  18 (viewport branch), 19 (generator/JSON drift) and 21 (absence assertions cannot poll) all
  came out of debugging it.

REBUILT 2026-08-18 AFTER MOB.977 MEASURED THE PAGE. The previous version could never pass on
this suite's only device, for three independent reasons, all now fixed:

1. THE WIDTH BRANCH - the real defect.
   `FormDetails.tsx:106` is `if (window.screen.availWidth >= 750 && form?.fields)`. Above the
   threshold it renders the DESKTOP form into `<div id="apm-dv-tabpanel">`; only BELOW it does
   it render `<form id="senor-work-form">`. `chrome.tablet` measures availWidth >= 750
   (MOB.977 probe W3), so `#senor-work-form` - which every locator in the old version was
   written against - CANNOT EXIST here. The test was targeting the phone branch while trap 1
   forbids a phone device. Hence `#apm-dv-tabpanel` throughout.

2. THE FORM NAME NO LONGER EXISTS ON THE FIXTURE.
   The old version opened the card named `Inspection`, on the premise that MOB.393 had
   stranded one there. MOB.393 has since been made read-only and no longer attaches anything,
   and MOB.977 measured ZERO elements whose exact heading is `Inspection` (probe C3) while
   >= 2 merely CONTAIN that substring - Mantine keeps inactive Tabs panels mounted with an
   inline `display: none`, and the Condition tab reads "Inspection Group" (trap 3). That
   substring match is what produced "Multiple elements found".
   So this no longer names a form at all: it opens the FIRST form card in the VISIBLE panel.
   Its subject is filling in a form, not that particular form, and a locator that does not
   depend on fixture naming cannot rot when the fixture is cleaned from desktop.

3. THE BLIND WARM-UP.
   It waited 20s on /work and deep-linked. The `Admin` crew's work list is EMPTY on dev
   (bugs_found.md 25), so there was no row to wait for and the wait proved nothing; the first
   leg's readiness assertion duly failed while later legs passed. Now uses the shared
   `work_list_gate(require_row=False)`, which waits on `loadedAll`.

THE BASELINE IS AN EMPTY FIELD. MOB.977 probe W10 measured the first editable input as empty
at rest, so this writes a marker and clears it back to empty - Control+A then Delete, since
`typeText` appends (trap 17) and there is no value to overwrite.

FIELDS SAVE ON BLUR, ONE AT A TIME. `FormDetails` passes `onBlur` to the form and there is no
form-level submit, so the test types then Tabs. Typing alone saves nothing. The mutation has
no `optimisticResponse` and its `toast.success('Field updated')` fires inside `update()`, so
that toast IS server-confirmed - but transient, asserted before the 5000ms autoClose (trap
16b) and still only optional. The durable proof is a re-navigation and a JS read (trap 16).
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write,  # noqa: E402
                      jsassert, work_cache_warm)

WORK_URL = BASE + "/work"
WORK_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
WORK_DETAIL = f"{WORK_URL}/{WORK_ID}"
MARKER = "DD FORM EDIT"

# The DESKTOP form container - the branch chrome.tablet actually renders (see 1 above).
CONTAINER = '//*[@id="apm-dv-tabpanel"]'
# Excludes the input types that are not free-text so the "first field" cannot silently become
# a checkbox. MOB.977 W6/W7 measured >= 2 such inputs here, the first editable.
TEXTY = ('input[not(@type="checkbox") and not(@type="radio")'
         ' and not(@type="hidden") and not(@type="file")]')

# SCOPED TO A FIELD WIDGET, not to the container. `(//input)[1]` inside the container located
# an element that Datadog then refused to click - "Element located but it's invisible". The
# desktop form lays out through react-grid-layout (`tabs/forms/Grid.tsx`), so DOM order is
# not layout order and the first input in the document need not be a laid-out field. Each
# real field is a `.ws-form-widget` (`FormFieldWidget.tsx`; `is-static` here because mobile
# passes isDraggable={false}), so scoping to that is structural rather than an index guess
# (trap 3: scope to the item under test; trap 15: measure, do not derive).
WIDGET = '*[contains(concat(" ", normalize-space(@class), " "), " ws-form-widget ")]'

# INDEX [2], AND IT WAS MEASURED - not derived (trap 15), the same way MOB.600's file input
# turned out to be index 3 rather than the 1 that render order predicted.
#
# MEASUREMENT (MOB.989, 2026-08-20, via this test's own DIAG steps):
#   inW[0] is present but display:none  - all three DIAG CAUSE probes passed
#                                         (offsetParent null, zero client rects, display none)
#   inW[1] is the FIRST VISIBLE one     - the only DIAG INDEX probe that passed
# Datadog refuses to click an invisible element, which is why `[1]` failed every run with
# "Element located but it's invisible" while the container and the widgets were all present.
#
# An XPath cannot ask "is this visible", so an index is the honest tool here. The DIAG steps
# are KEPT below so that if the form's field order ever changes, the report says which index
# moved instead of just reporting an invisible element again.
FIRST_FIELD = f'({CONTAINER}//{WIDGET}//{TEXTY})[2]'

# A form card is a Paper carrying a Title, inside the tab panel that is NOT hidden. Mantine
# hides inactive panels with an inline `display: none` (TabsPanel.cjs:34) - that is the only
# thing separating the Forms panel's cards from every other panel's, measured not assumed
# (trap 15). Validated end to end by MOB.977: clicking this opened the form.
PANEL = '//*[@role="tabpanel"][not(contains(@style, "display: none"))]'
PAPER = '*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")]'
TITLE = '*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]'
FIRST_FORM_CARD = f'({PANEL}//{PAPER}[.//{TITLE}])[1]'

# READS THE SAME ELEMENT THE WRITES TARGET. This was wrong on the first attempt and the bug
# is worth recording: the writes go to XPath `(...//ws-form-widget//input)[2]` - the second
# WIDGET input - while this read took `els[0]`, the first input in the CONTAINER. Different
# elements, so the proof compared a field nobody had typed into against the marker and
# reported "falsy" as though the write had failed.
#
# The lesson generalises: when a test writes by XPath and verifies by JS, the two selectors
# are a pair, and changing one without the other produces a failure that looks like a broken
# app rather than a broken test. Keep them derived from the same rule - widget inputs, index
# 1 (0-based), matching the XPath's [2] (1-based).
VAL = ("const c = document.getElementById('apm-dv-tabpanel');\n"
       "if (!c) return false;\n"
       "const inW = [...c.querySelectorAll('input')]"
       ".filter(e => !['checkbox','radio','hidden','file'].includes(e.type))"
       ".filter(e => e.closest('.ws-form-widget'));\n"
       "if (inW.length < 2) return false;\n"
       "const v = inW[1].value.trim();\n")


def open_form(gate=False):
    """Work order -> Forms tab -> the first form card.

    Cannot be deep-linked to the FORM: `MOBILE_WORK_FORM` is cache-only, so the form page
    renders blank unless it is reached through the work order that populated the cache.

    gate=True runs `work_list_gate` first, and only the FIRST leg needs it. The cache it warms
    is per browser SESSION, and Datadog gives the whole test (and the whole suite) one session
    - so repeating it per leg buys nothing and costs ~23s each time. Three gates is what took
    MOB.991 past Datadog's maximum test execution time (1071s, capped) when this was first
    wired in; the suite had been 474s.
    """
    # `work_cache_warm`, NOT `work_list_gate`. This test only needs the lookup cache warm
    # before deep-linking; it does not need `loadedAll`. The gate's LOADEDALL checks are
    # `assertPageLacks` on the LoadingProgress labels and cannot poll, so once the crew's
    # work list stopped being empty they began failing here at 20s and again at 45s. The
    # real readiness signals for this test are its own GATE 1/2 and 2/2 below, which poll.
    return (work_cache_warm() if gate else []) + [
        go(WORK_DETAIL, "the fixture work order"),
        step("wait", "Let the detail view begin rendering", {"value": 3}),
        # The route mounting and the DATA arriving are different failures: WorkStageDetails
        # renders null when the query has no workStage or no mobileTemplate, and a null
        # render still leaves the page title up. Gate on both, separately.
        step("assertElementPresent", "GATE 1/2: the /work/:id route mounted",
             {"element": xpath_el(WORK_DETAIL, '//*[@id="page-title"]//h4')}, timeout=60),
        step("assertElementPresent", "GATE 2/2: the detail data arrived (tab strip)",
             {"element": xpath_el(WORK_DETAIL, '(//*[@role="tab"])[1]')}, timeout=60),
        step("click", "Open the Forms tab",
             {"element": xpath_el(WORK_DETAIL,
                                  '//*[@role="tab"][contains(normalize-space(.), "Form")]')},
             timeout=30),
        step("wait", "Wait for the forms list", {"value": 3}),
        step("click", "Open the first form card in the visible panel",
             {"element": xpath_el(WORK_DETAIL, FIRST_FORM_CARD)}, timeout=60),
        step("wait", "Let the form page render", {"value": 3}),
        step("assertElementPresent", "The form rendered its field container",
             {"element": xpath_el(WORK_DETAIL, CONTAINER)}, timeout=60),
        step("assertElementPresent", "FIELD GUARD: the form has an editable field",
             {"element": xpath_el(WORK_DETAIL, FIRST_FIELD)}, timeout=60),
    ]


# If the widget-scoped locator is ALSO invisible, these say why in the same run rather than
# costing another standalone probe - and a standalone probe is unreliable here anyway,
# because the work detail only renders on a warm cache and the crew's work list is empty.
def field_diagnostics():
    """Pin down WHY the first widget input is not clickable, and which one is.

    Measured so far (MOB.991, 2026-08-20): widget inputs exist; the FIRST is invisible; SOME
    input is visible; and the first visible one IS inside a `.ws-form-widget`. So the target
    is "the first VISIBLE widget input" - which XPath cannot express, hence these.

    All optional+always (trap 16c) so they report even when the click below fails.
    """
    js = ("const c = document.getElementById('apm-dv-tabpanel');\n"
          "if (!c) return false;\n"
          "const isVis = e => !!(e.offsetParent || e.getClientRects().length);\n"
          "const all = [...c.querySelectorAll('input')]"
          ".filter(e => !['checkbox','radio','hidden','file'].includes(e.type));\n"
          "const inW = all.filter(e => e.closest('.ws-form-widget'));\n")
    out = [
        jsassert("DIAG: the container holds at least one .ws-form-widget input",
                 js + "return inW.length >= 1;", optional=True, always=True, timeout=10),
        jsassert("DIAG: the first .ws-form-widget input is VISIBLE",
                 js + "return inW.length > 0 && isVis(inW[0]);",
                 optional=True, always=True, timeout=10),
        jsassert("DIAG: SOME editable input in the container is visible",
                 js + "return all.some(isVis);", optional=True, always=True, timeout=10),
        jsassert("DIAG: the first VISIBLE input is inside a .ws-form-widget",
                 js + "const v = all.find(isVis);\n"
                 "return !!v && !!v.closest('.ws-form-widget');",
                 optional=True, always=True, timeout=10),
        # WHY is inW[0] hidden? One of these three is the reason, and each implies a
        # different fix - a zero rect means layout, display:none means a branch not taken.
        jsassert("DIAG CAUSE: inW[0].offsetParent is null",
                 js + "return inW.length > 0 && inW[0].offsetParent === null;",
                 optional=True, always=True, timeout=10),
        jsassert("DIAG CAUSE: inW[0] has ZERO client rects",
                 js + "return inW.length > 0 && inW[0].getClientRects().length === 0;",
                 optional=True, always=True, timeout=10),
        jsassert("DIAG CAUSE: inW[0] computes to display:none or visibility:hidden",
                 js + "if (!inW.length) return false;\n"
                 "const st = getComputedStyle(inW[0]);\n"
                 "return st.display === 'none' || st.visibility === 'hidden';",
                 optional=True, always=True, timeout=10),
    ]
    # WHICH index is first visible - so the fix can be structural rather than a guess.
    for i in range(1, 6):
        out.append(jsassert(
            f"DIAG INDEX: the first VISIBLE widget input is inW[{i - 1}]",
            js + f"return inW.findIndex(isVis) === {i - 1};",
            optional=True, always=True, timeout=10))
    return out


def write_field(steps_label, typed, clear_only=False):
    """Focus, replace the contents, and BLUR - the blur is what saves.

    always=True on every write step (trap 16c): if leg 1's proof fails, leg 2 still has to
    run or the fixture is left holding the marker for every future run.
    """
    out = [
        step("click", f"Focus the first field ({steps_label})",
             {"element": xpath_el(WORK_DETAIL, FIRST_FIELD)}, always=True, timeout=30),
        # typeText APPENDS (trap 17) - select-all first or the value grows every run.
        step("pressKey", "Select the existing text (typeText APPENDS without this)",
             {"value": "a", "modifiers": ["Control"]}, always=True),
    ]
    if clear_only:
        # The rest state is an EMPTY field (MOB.977 W10), so the restore is a deletion, not
        # a re-type. Delete over the selection made above.
        out.append(step("pressKey", "Delete the selection — the field's rest state is empty",
                        {"value": "Delete"}, always=True))
    else:
        out.append(step("typeText", f"Type {steps_label}",
                        {"value": typed, "element": xpath_el(WORK_DETAIL, FIRST_FIELD)},
                        always=True))
    out += [
        # THE SAVE IS ON BLUR. Typing alone writes nothing.
        # DID THE TEXT EVEN LAND? Before the blur, so a failure here separates "typing did
        # not work" from "typing worked but the save was gated".
        jsassert(f"DIAG-1: the input holds the typed text BEFORE the blur ({steps_label})",
                 "const c = document.getElementById('apm-dv-tabpanel');\n"
                 "if (!c) return false;\n"
                 "const inW = [...c.querySelectorAll('input')]"
                 ".filter(e => !['checkbox','radio','hidden','file'].includes(e.type))"
                 ".filter(e => e.closest('.ws-form-widget'));\n"
                 "if (inW.length < 2) return false;\n"
                 + (f"return inW[1].value.trim() === '';"
                    if clear_only else
                    f"return inW[1].value.trim() === '{typed}';"),
                 optional=True, always=True, timeout=10),
        step("pressKey", "Tab out — the field saves on BLUR, not on change",
             {"value": "Tab"}, always=True),
        step("wait", "Brief wait for the toast", {"value": 2}, always=True),
        # THE DECISIVE PAIR. `Form.tsx:148` returns early unless react-hook-form reports the
        # field DIRTY, and that state is not readable from the DOM - but its consequence is:
        # the mutation fires, and `Field updated` toasts from inside `update()`. So
        #   DIAG-1 pass + DIAG-2 fail  =  the text landed but the save was GATED (isDirty),
        #                                 which is an app/harness incompatibility, not a
        #                                 locator problem, and no further run fixes it.
        #   DIAG-1 fail                =  typing never landed; a different problem entirely.
        jsassert(f"DIAG-2: a toast is on screen after the blur ({steps_label})",
                 "return /Field updated|Record Updated|updated/i"
                 ".test(document.body.innerText || '');",
                 optional=True, always=True, timeout=10),
        jsassert(f"DIAG-3: the value SURVIVED the blur in the DOM ({steps_label})",
                 "const c = document.getElementById('apm-dv-tabpanel');\n"
                 "if (!c) return false;\n"
                 "const inW = [...c.querySelectorAll('input')]"
                 ".filter(e => !['checkbox','radio','hidden','file'].includes(e.type))"
                 ".filter(e => e.closest('.ws-form-widget'));\n"
                 "if (inW.length < 2) return false;\n"
                 + (f"return inW[1].value.trim() === '';"
                    if clear_only else
                    f"return inW[1].value.trim() === '{typed}';"),
                 optional=True, always=True, timeout=10),
        step("assertPageContains",
             "Field updated toast (optional: transient, but server-confirmed — it fires "
             "inside update() with no optimisticResponse)",
             {"value": "Field updated"}, optional=True, always=True),
        step("wait", "Let the update mutation settle", {"value": 4}, always=True),
    ]
    return out


# NO LOGIN STEPS. Leaves are subtests: MOB.991 logs in once and chains them in that one
# browser session, so a leaf that logged in again would restart the session mid-suite. Only
# the standalone diagnostics (MOB.977/979) borrow MOB.000's login steps.
write(test(
    "MOB.134_Work_Form_Fill",
    "`MOB.134` **Fill out an inserted form** — T2.1's last forms item.\n"
    "- **SELF-RESTORING**: leg 1 writes `DD FORM EDIT`, leg 2 clears the field back to empty,\n"
    "  which MOB.977 measured as its rest state.\n"
    "- **Targets `#apm-dv-tabpanel`, NOT `#senor-work-form`.** `FormDetails.tsx:106` renders\n"
    "  the desktop form whenever `screen.availWidth >= 750`; chrome.tablet is above that, so\n"
    "  the phone container this test used to target cannot exist here. That, not a locator\n"
    "  typo, is why it never passed.\n"
    "- **Opens the FIRST form card in the visible panel** rather than naming one. The\n"
    "  `Inspection` form it used to name is no longer on the fixture (MOB.977 probe C3), and\n"
    "  matching that name as a substring spans Mantine's keepMounted tab panels (trap 3).\n"
    "- **Fields save on BLUR, one at a time** — there is no form-level submit, so the test\n"
    "  types then Tabs. Typing alone saves nothing.\n"
    "- The `Field updated` toast IS server-confirmed (inside `update()`, no\n"
    "  `optimisticResponse`) but transient, so it is asserted before the 5000ms autoClose and\n"
    "  still only optional. **The durable proof is the re-navigation + JS read.**\n"
    "- Each leg walks work list → work order → Forms tab → the card, because\n"
    "  `MOBILE_WORK_FORM` is `cache-only` and the page renders blank if deep-linked.",
    open_form(gate=True)
    + field_diagnostics()
    + write_field("the marker", MARKER)
    + open_form()
    + [jsassert("PROOF: after re-navigating, the field came back holding the marker",
                VAL + f"return v === '{MARKER}';", always=True, timeout=30)]
    + write_field("the empty rest state", None, clear_only=True)
    + open_form()
    + [jsassert("RESTORED: the field is empty again",
                VAL + "return v === '';", always=True, timeout=30)],
    tags=["Mobile", "env:dev", "CRUD", "field-edit", "Work Orders"],
))
print("wrote MOB.134 (fill out an inserted form)")
