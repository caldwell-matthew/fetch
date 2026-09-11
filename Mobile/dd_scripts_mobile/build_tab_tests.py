"""Build the remaining Work Order tab tests: Condition, Failures, Notes.

FIELD IDS COME FROM THE MODELS, VALUES FROM DEV
  Reading a component's customFormFields only tells you which inputs are *customised*.
  The real field list is the model schema, and the ids do not always match their labels:

    Condition  assetId · assetStandardDetailId ("Inspection Group") · inspectionElementId
               conditionFound · conditionScore ("Condition Left") · stressScore
               ALL SIX are record lookups - the three score fields are type:'record'
               backed by filterScores(), not numeric inputs, so they must be PICKED.
    Failures   assetId · failureTypeId · repairTypeId · rootCauseTypeId

  The asset lookup lists only assets ATTACHED TO THE WORK STAGE (props.assets), so the
  fixture must have the asset attached on its Assets tab or the list is empty.
    Notes      desc ("Instructions") only - name and noteType are REQUIRED but Notes.tsx
               supplies them via defaultValues, so the form prefills them.

  Note "Condition Left" is `conditionScore`, not `conditionLeft`, and "Inspection Group"
  is `assetStandardDetailId` - neither is guessable from the label.

CASCADES
  Condition: asset -> inspection group -> inspection element. The group options come from
  the selected asset's conditionAssessment.inspectionGroups, and the element options from
  the selected group, so the order below is load-bearing.

PICK BY TEXT, NEVER BY INDEX
  A bare (//*[@role="option"])[1] matches any option on the page, including hidden
  leftovers from a dropdown that has already closed. That failed as "Element located but
  it's invisible" in MOB.360. Every pick here is by text.

MUTATES: each run adds a permanent condition / failure / note to the fixture. Mobile has
no delete, so these accumulate and need desktop cleanup.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write  # noqa: E402

FIXTURE_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
STAGE_URL = f"{BASE}/work/{FIXTURE_ID}"
WORK_URL = BASE + "/work"
ADD_BTN = '//button[normalize-space(.)="Add"]'

# EACH TAB'S FORM HAS ITS OWN id - there is no shared submit button.
#   Notes      NewItemForm -> ui/Form.tsx        id="work-collection-form"  toasts 'Item added'
#   Condition  Conditions/Form.tsx               id="work-condition-form"   NO TOAST
#   Failures   Failures/Form.tsx                 id="work-failure-form"     NO TOAST
#   Forms      Forms/AdHocForm.tsx               id="adhoc-form"            toasts 'Form added'
# Condition and Failure call addToCollection() directly with done: closeModal - and
# addToCollection never toasts. Only NewItemForm's own onSubmit calls toast.success. So
# asserting a toast on those two could never have passed, no matter how correct the rest
# of the test was. Their success signal is the modal closing, nothing else.
SUBMIT = '//button[@form="work-collection-form"]'
SUBMIT_CONDITION = '//button[@form="work-condition-form"]'
SUBMIT_FAILURE = '//button[@form="work-failure-form"]'
SUBMIT_ADHOC = '//button[@form="adhoc-form"]'
TAGS = ["Mobile", "env:dev", "Work Order", "CRUD"]

# Known-good dev values
ASSET = "Pump 0102"
INSPECTION_GROUP = "Structural"
INSPECTION_ELEMENT = "Mounting/Support"
CONDITION_FOUND = "1"
CONDITION_LEFT = "2"
STRESS_SCORE = "3"
FAILURE_TYPE = "BELT (R-L1)"
REPAIR_TYPE = "MISSED"   # not "INSPECT" - that value is not in this failure type's list
ROOT_CAUSE_TYPE = "TIME"
NOTE_TEXT = "This is a note - DD SYNTHETIC MOBILE"
FORM_NAME = "Inspection"


def tab(label):
    return f'//*[@role="tab"][contains(normalize-space(.), "{label}")]'


def open_fixture():
    """/work first warms the cache-only lookups (prefetchWorkData runs off the crew's own
    work list); the wait after the second navigation avoids asserting into a lagging
    detail view."""
    return [
        go(WORK_URL, "/work to warm the lookup cache"),
        step("wait", "Wait for the work list and lookup prefetch", {"value": 20}),
        go(STAGE_URL, "the fixture work order"),
        # Appendix F: 5s -> 2s settle floor, and the assertion POLLS (timeout=30) instead.
        # Datadog steps poll until their timeout - measured 58.2s against a 60s limit - so a
        # gate returns as soon as it is satisfied. The 20s /work wait above is NOT convertible:
        # it warms the lookup cache and its only readiness signals are negative (a `lacks` on a
        # loading label is true before loading starts too) or a colour, which is not assertable.
        step("wait", "Let the detail view begin rendering", {"value": 2}),
        step("assertPageContains", "Test work order detail rendered", {"value": "Status:"},
             timeout=30),
    ]


def option_xpath(pick, exact=False):
    """Locator for one dropdown option. See lookup() for why each form is shaped this way."""
    if exact:
        return (f'(//*[@role="option"][.//*[contains(@class,"option-title")]'
                f'[normalize-space(.)="{pick}"]])[last()]')
    return f'//*[@role="option"][contains(normalize-space(.), "{pick}")]'


def lookup(field_id, label, pick, search=None, exact=False):
    """exact=True matches the option's TITLE div exactly, instead of the option's whole text.

    ListFilter renders each option as two sibling divs (ListFilter/index.tsx):

        <div role="option" class="option">
          <div class="option-title">1</div>
          <div class="option-description">New Condition ...</div>
        </div>

    So normalize-space(.) on the option is "1New Condition ..." - the two divs concatenate
    with NO separating space. That breaks both naive forms for the score fields:
      [normalize-space(.)="1"]            never matches - the desc is in there too
      [contains(normalize-space(.), "1")] matches 1, 10, 11, 12 -> "Multiple elements found"
    Matching option-title sidesteps both. Only needed where the visible label is a short
    numeric prefix of other labels; the text lookups are unambiguous on full option text.

    ...AND THEN [last()], because option-title alone is still not unique. Mantine Combobox
    defaults to keepMounted, so a dropdown's options stay in the DOM (portaled onto <body>)
    after it closes. conditionFound and conditionScore are both filterScores('conditionScores')
    - the SAME list - so once conditionFound has been opened, "2" matches its leftover option
    as well as the live one, and Datadog errors rather than choosing. Nothing textual can
    separate two identical lists, and the dropdown is portaled out of the field's wrapper so
    an ancestor scope cannot reach it either.

    [last()] is correct here rather than merely convenient: the leftovers appear in field
    order, and these fields are filled in field order, so the live dropdown is always the
    last one carrying options. Filling them out of order would break that assumption.
    """
    steps = [step("click", f"Focus the {label} lookup",
                  {"element": xpath_el(STAGE_URL, f'//*[@id="{field_id}"]')})]
    if search is not None:
        steps.append(step("typeText", f"Search the {label} lookup",
                          {"value": search,
                           "element": xpath_el(STAGE_URL, f'//*[@id="{field_id}"]')}))
    steps += [
        step("wait", f"Wait for {label} options", {"value": 2}),
        step("click", f"Pick {pick}",
             {"element": xpath_el(STAGE_URL, option_xpath(pick, exact))}),
    ]
    return steps


def number(field_id, label, value):
    return step("typeText", f"Enter {label}",
                {"value": value, "element": xpath_el(STAGE_URL, f'//*[@id="{field_id}"]')})


def submit_and_assert(submit_xpath=None, toast="Item added"):
    """Assert the MODAL CLOSED, not the toast.

    The toast is transient (autoClose) and races the assertion - confirmed by a run where
    the record was created but 'Item added' had already gone. Worse, a missing toast is
    ambiguous: SubmitButton is `type={isValid ? 'submit' : 'button'}`, so an invalid form
    makes the click a SILENT no-op - no submit, no error, no toast. "Clicked, no toast"
    therefore meant either "worked, toast missed" or "form invalid, nothing happened", and
    the test could not tell you which. That ambiguity caused several wrong diagnoses.

    Splitting it resolves both:
      critical  modal closed  -> proves the mutation ran (NewItemForm closes on .then())
      optional  toast         -> nice to have, never fails the run on timing

    'Submit' is the collection forms' default SubmitButton label and the form is unmounted
    with the modal (`{opened && Form(...)}`), so its absence is a true closed signal. Other
    buttons on the page read 'SUBMIT' or 'Create Work Order', so there is no collision.
    """
    steps = [
        step("click", "Submit the form",
             {"element": xpath_el(STAGE_URL, submit_xpath or SUBMIT)}),
        step("wait", "Wait for the add mutation", {"value": 3}),
        step("assertPageLacks", "Test the form modal closed (durable success signal)",
             {"value": "Submit"}),
    ]
    if toast:
        steps.append(step("assertPageContains", f"Test the {toast!r} toast (optional: transient)",
                          {"value": toast}, optional=True))
    return steps


# ---------------------------------------------------------------- condition
write(test(
    "MOB.390_Work_Add_Condition",
    "`MOB.390` Add a condition score to the fixture work order.\n"
    "- Cascading lookups: asset -> inspection group -> inspection element. Group options\n"
    "  come from the asset's conditionAssessment, element options from the group, so the\n"
    "  order is load-bearing.\n"
    "- Field ids do not match their labels: \"Inspection Group\" is assetStandardDetailId\n"
    "  and \"Condition Left\" is conditionScore.\n"
    f"- MUTATES: adds a permanent condition to {FIXTURE_ID} on every run.",
    open_fixture() + [
        step("click", "Open the Condition tab", {"element": xpath_el(STAGE_URL, tab("Condition"))}),
        step("click", "Open the add form", {"element": xpath_el(STAGE_URL, ADD_BTN)}),
        # No search term: an empty query lists every asset ATTACHED TO THIS WORK STAGE
        # (options come from props.assets, not a global list). Typing is safe since
        # `cad415620c` fixed the case-sensitive filter (bugs §1) - MOB.389 guards that.
        *lookup("assetId", "asset", ASSET),
        *lookup("assetStandardDetailId", "inspection group", INSPECTION_GROUP),
        *lookup("inspectionElementId", "inspection element", INSPECTION_ELEMENT),
        # conditionFound / conditionScore / stressScore are type:'record' lookups backed by
        # filterScores(), NOT numeric inputs - typing into them does nothing. Pick the
        # score from the dropdown by its text.
        *lookup("conditionFound", "condition found", CONDITION_FOUND, exact=True),
        *lookup("conditionScore", "condition left", CONDITION_LEFT, exact=True),
        *lookup("stressScore", "stress score", STRESS_SCORE, exact=True),
    ] + submit_and_assert(SUBMIT_CONDITION, toast=None),
    TAGS + ["Condition"],
))

# ---------------------------------------------------------------- failures
write(test(
    "MOB.391_Work_Add_Failure",
    "`MOB.391` Add a failure to the fixture work order.\n"
    "- Four required lookups: asset, failure type, repair type, root cause type.\n"
    "  componentTypeId and discoveryCodeId exist but are optional, so they are skipped.\n"
    f"- MUTATES: adds a permanent failure to {FIXTURE_ID} on every run.",
    open_fixture() + [
        step("click", "Open the Failures tab", {"element": xpath_el(STAGE_URL, tab("Failure"))}),
        step("click", "Open the add form", {"element": xpath_el(STAGE_URL, ADD_BTN)}),
        # No search term: an empty query lists every asset ATTACHED TO THIS WORK STAGE
        # (options come from props.assets, not a global list). Typing is safe since
        # `cad415620c` fixed the case-sensitive filter (bugs §1) - MOB.389 guards that.
        *lookup("assetId", "asset", ASSET),
        *lookup("failureTypeId", "failure type", FAILURE_TYPE),
        *lookup("repairTypeId", "repair type", REPAIR_TYPE),
        *lookup("rootCauseTypeId", "root cause type", ROOT_CAUSE_TYPE),
    ] + submit_and_assert(SUBMIT_FAILURE, toast=None),
    TAGS + ["Failures"],
))

# ---------------------------------------------------------------- notes
write(test(
    "MOB.392_Work_Add_Note",
    "`MOB.392` Add a job note to the fixture work order.\n"
    "- Only Instructions (`desc`) is filled. `name` and `noteType` are required by the\n"
    "  WorkStageJobNote schema but Notes.tsx prefills them through defaultValues, so the\n"
    "  form arrives already valid for those two.\n"
    f"- MUTATES: adds a permanent note to {FIXTURE_ID} on every run.",
    open_fixture() + [
        step("click", "Open the Notes tab", {"element": xpath_el(STAGE_URL, tab("Notes"))}),
        step("click", "Open the add form", {"element": xpath_el(STAGE_URL, ADD_BTN)}),
        # Instructions is a tiptap RICH TEXT editor (MantineRichTextEditor.Content), not a
        # plain input - there is no #desc field to type into. The editable surface is the
        # contenteditable div, so focus it first and type there.
        step("click", "Focus the rich text editor",
             {"element": xpath_el(STAGE_URL, '//div[@contenteditable="true"]')}),
        step("typeText", "Enter the note instructions",
             {"value": NOTE_TEXT,
              "element": xpath_el(STAGE_URL, '//div[@contenteditable="true"]')}),
    ] + submit_and_assert(),
    TAGS + ["Notes"],
))

# ---------------------------------------------------------------- forms
# MOB.393 WAS MUTATING AND IS NOW NOT - DO NOT PUT IT BACK.
#   It used to add the `Inspection` form for real. AdHocForm's picker hides forms already
#   attached (`!currentForms.has(name)`), so it passed exactly ONCE and then failed on every
#   later run at "Pick Inspection" - trap 10, the test eating its own fixture. That kept the
#   whole 13-child MOB.991 suite permanently red, which is worse than a missing test: a suite
#   nobody expects to be green stops being read, and the other 12 results go unnoticed.
#
#   The repo owner chose the repeatable variant 2026-08-13: open the modal, prove the picker
#   renders, cancel. It does NOT prove a form persists - but that proof only ever worked once,
#   and the fixture still carries the `Inspection` form from that run, which MOB.134 now uses
#   to cover the far more valuable fill-out flow.
write(test(
    "MOB.393_Work_Add_Form",
    "`MOB.393` The **add-form** modal opens and offers its picker.\n"
    "- **READ-ONLY BY DESIGN — do not make it submit again.** It used to add the `Inspection`\n"
    "  form for real, and AdHocForm hides forms already attached, so it passed once and then\n"
    "  failed forever at *Pick Inspection* (trap 10), keeping all of `MOB.991` red.\n"
    "- What it proves: the Forms tab opens, the add modal opens, and the form picker renders\n"
    "  with options. What it does NOT prove: that adding one persists.\n"
    "- The fill-out flow — which is the valuable half — is covered by **MOB.134**, using the\n"
    "  `Inspection` form this test attached on its single successful run.",
    open_fixture() + [
        step("click", "Open the Forms tab", {"element": xpath_el(STAGE_URL, tab("Form"))},
             timeout=30),
        step("click", "Open the add form", {"element": xpath_el(STAGE_URL, ADD_BTN)},
             timeout=30),
        step("wait", "Wait for the modal", {"value": 2}),
        step("assertElementPresent", "PROOF: the form picker rendered",
             {"element": xpath_el(STAGE_URL, '//*[@id="formId"]')}, timeout=30),
        step("click", "Open the picker",
             {"element": xpath_el(STAGE_URL, '//*[@id="formId"]')}, timeout=30),
        step("wait", "Wait for options", {"value": 2}),
        step("assertElementPresent", "PROOF: the picker offers at least one form",
             {"element": xpath_el(STAGE_URL, '(//*[@role="option"])[1]')}, timeout=30),
        step("pressKey", "Cancel without adding", {"value": "Escape"}, always=True),
        step("wait", "Let the modal close", {"value": 2}, always=True),
        step("pressKey", "Close the add modal", {"value": "Escape"}, always=True),
    ],
    TAGS + ["Forms", "read-only"],
))

print("wrote MOB.390 (condition), MOB.391 (failure), MOB.392 (note), MOB.393 (form)")
