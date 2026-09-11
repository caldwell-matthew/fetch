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

MUTATES: each run adds a permanent note to the fixture (MOB.392). MOB.390/391 are
SELF-CLEANING - see the block above them.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      stash_record_count, prove_record_count)

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
INSPECTION_ELEMENT = "Pump Body"          # NOT Mounting/Support - see MOB.390's block
ORIGINAL_ELEMENT = "Mounting/Support"     # the fixture's one condition, never touched
CONDITION_FOUND = "1"
CONDITION_LEFT = "2"
STRESS_SCORE = "3"
FAILURE_TYPE = "BELT (R-L1)"
REPAIR_TYPE = "ADJUST"   # NOT "MISSED" - see MOB.391's block ("INSPECT" is not in BELT's list)
ORIGINAL_REPAIR = "MISSED"  # the fixture's one failure, never touched
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


def option_xpath(pick):
    """Locator for one dropdown option by its whole text. See lookup() for the exact form."""
    return f'//*[@role="option"][contains(normalize-space(.), "{pick}")]'


def pick_visible_option_js(pick):
    """Click the ONE VISIBLE option whose title is exactly `pick` (see lookup())."""
    return ("const vis = [...document.querySelectorAll('[role=\"option\"]')].filter(o => {\n"
            "  const t = o.querySelector('[class*=\"option-title\"]');\n"
            f"  return t && (t.textContent || '').trim() === '{pick}' && o.offsetParent !== null;\n"
            "});\n"
            "if (vis.length !== 1) return false;\n"
            "vis[0].click();\nreturn true;")


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

    ...AND ONLY THE VISIBLE ONE, because option-title alone is still not unique: the score
    fields share one list, and Mantine keeps dropdown options in the DOM (portaled onto
    <body>), hidden. So the exact pick is a JS step: the options titled exactly `pick` whose
    `offsetParent` is not null (a `display:none` dropdown has none) - exactly one, clicked.
    ⚠️ Two XPath forms failed here, one run each. `(…)[last()]` ("the live dropdown is the last
    one carrying options") hit a HIDDEN later field's "1" - "Element located but it's
    invisible" - with the live dropdown open on screen. Scoping by `aria-controls` found
    NOTHING on the served build, though the local Mantine source says the open input carries
    it (the working tree's node_modules is not the served build's). Visibility is what the
    screenshot shows, so the step asserts that.
    """
    steps = [step("click", f"Focus the {label} lookup",
                  {"element": xpath_el(STAGE_URL, f'//*[@id="{field_id}"]')})]
    if search is not None:
        steps.append(step("typeText", f"Search the {label} lookup",
                          {"value": search,
                           "element": xpath_el(STAGE_URL, f'//*[@id="{field_id}"]')}))
    steps.append(step("wait", f"Wait for {label} options", {"value": 2}))
    if exact:
        steps.append(jsassert(f"Pick {pick} — the one VISIBLE option titled exactly \"{pick}\"",
                              pick_visible_option_js(pick), timeout=20))
    else:
        steps.append(step("click", f"Pick {pick}",
                          {"element": xpath_el(STAGE_URL, option_xpath(pick))}))
    return steps


def number(field_id, label, value):
    return step("typeText", f"Enter {label}",
                {"value": value, "element": xpath_el(STAGE_URL, f'//*[@id="{field_id}"]')})


def submit_and_assert(submit_xpath=None, toast="Item added"):
    """Assert the MODAL CLOSED, not the toast.

    ⚠️ THE MODAL CLOSING IS NOT A SERVER ANSWER (bugs §40). `addToCollection` passes an
    `optimisticResponse` and calls `done()` inside `update()`, which Apollo runs FIRST with the
    optimistic result - so the modal closes before the server replies, and a refusal is rolled
    back silently. MOB.390/391 were green for a month while every add was refused as a
    duplicate. Only a read after a RELOAD proves a write (MOB.390/391 do that now).

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


# ---------------------------------------------------------------- condition / failure
# MOB.390/391 ADD, PROVE AFTER A RELOAD, THEN DELETE WHAT THEY ADDED (owner-sanctioned, trap 2).
#
#   WHY: the server keeps ONE condition per [workStage, asset, inspection group, element] and ONE
#   failure per [workStage, failureType, repairType, rootCauseType] (`WorkStageCondition.unique`,
#   `WorkStageFailure.unique`). The fixture holds one of each from the first run (2026-08-10 -
#   Mounting/Support, and BELT/MISSED/TIME). Every later run re-submitted that same key, the
#   server refused it as "Duplicate record found", and the optimistic modal-close kept the test
#   green (bugs §40). Trap 10 again: the test ate its own fixture on run 1.
#
#   SO: add a key the fixture does NOT hold (Pump Body; BELT/ADJUST/TIME), prove it after a
#   reload, and delete it again from its own card's menu - the owner named this flow, for these
#   two collections on the fixture work order only. The original record is proven untouched.
#
#   🛑 THE DELETE IS GUARDED IN THE SAME STEP AS THE GEAR CLICK: exactly one card with the run's
#   key, and the PREMISE (0 such cards before the add) proves this run made it. `Delete Item`
#   sends `removeFromCollection` with THAT card's record id (`defaultValues={condition}`).
#   A leftover from a failed cleanup stops the test at the premise - it never deletes a record
#   this run did not create. Clean it from desktop.
K_ORIG = "__dd39x_origCount"
NORM = "const norm = t => (t || '').replace(/\\s+/g, ' ').trim();\n"
PAPER = '[class*="mantine-Paper-root"]'
TXT = '[class*="mantine-Text-root"]'
# ConditionDetails.tsx: CollapsableSection Paper > [toggle button(label = element) · Pill(group) ·
# gear] + Collapse > List > li "Condition Found: <Pill>" … ; grouped under an asset Paper whose
# first Text is the asset name (Conditions/index.tsx).
COND_CARDS = (NORM +
    "const cards = [...new Set([...document.querySelectorAll('li')]\n"
    "  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)\n"
    f"  .map(li => li.closest('{PAPER}')))].filter(Boolean).map(c => {{\n"
    f"    const grp = c.parentElement && c.parentElement.closest('{PAPER}');\n"
    f"    const a = grp && grp.querySelector('{TXT}');\n"
    "    const b = c.querySelector('button');\n"
    "    return { el: c, asset: a ? norm(a.textContent) : '', label: b ? norm(b.textContent) : '',\n"
    "             text: norm(c.textContent), lis: [...c.querySelectorAll('li')].map(li => norm(li.textContent)) };\n"
    "  });\n"
    f"const isKey = (c, el) => c.asset === '{ASSET}' && c.label === el && c.text.indexOf('{INSPECTION_GROUP}') !== -1;\n"
    f"const mine = cards.filter(c => isKey(c, '{INSPECTION_ELEMENT}'));\n"
    f"const orig = cards.filter(c => isKey(c, '{ORIGINAL_ELEMENT}'));\n")
COND_VALUES = (f"['Condition Found: {CONDITION_FOUND}', 'Condition Score: {CONDITION_LEFT}', "
               f"'Stress Score: {STRESS_SCORE}'].every(v => mine[0].lis.includes(v))")
# FailureDetails.tsx: CollapsableSection Paper > Table rows [label td, value td] ; grouped (via a
# component Box) under an asset Paper whose first Text is the asset name (Failures/index.tsx).
FAIL_CARDS = (NORM +
    "const cards = [...document.querySelectorAll('table')]\n"
    "  .filter(t => /Failure Type/.test(t.textContent || ''))\n"
    f"  .map(t => {{ const c = t.closest('{PAPER}'); if (!c) return null;\n"
    f"    const grp = c.parentElement && c.parentElement.closest('{PAPER}');\n"
    f"    const a = grp && grp.querySelector('{TXT}');\n"
    "    const row = {}; [...t.querySelectorAll('tr')].forEach(tr => { const td = [...tr.children].map(x => norm(x.textContent)); if (td.length >= 2) row[td[0]] = td[1]; });\n"
    "    return { el: c, asset: a ? norm(a.textContent) : '', row }; }).filter(Boolean);\n"
    f"const isKey = (c, rep) => c.asset === '{ASSET}' && c.row['Failure Type'] === '{FAILURE_TYPE}'\n"
    f"  && c.row['Repair Type'] === rep && c.row['Root Cause'] === '{ROOT_CAUSE_TYPE}';\n"
    f"const mine = cards.filter(c => isKey(c, '{REPAIR_TYPE}'));\n"
    f"const orig = cards.filter(c => isKey(c, '{ORIGINAL_REPAIR}'));\n")
DELETE_ITEM = '(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")][normalize-space(.)="Delete Item"])[1]'
CONFIRM_YES = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
               '[.//*[contains(normalize-space(.), "Are you sure you want to delete this record?")]]'
               '//button[normalize-space(.)="Yes"]')


def reopen(tab_label, why):
    """A RELOAD, then the tab: the only read that is the server's answer (bugs §40)."""
    return [
        go(STAGE_URL, f"the fixture work order ({why})"),
        step("wait", "Let the detail view begin rendering", {"value": 2}),
        step("assertPageContains", "Test work order detail rendered", {"value": "Status:"},
             timeout=30),
        step("click", f"Open the {tab_label} tab", {"element": xpath_el(STAGE_URL, tab(tab_label))},
             timeout=30),
        step("wait", f"Let the {tab_label} cards render", {"value": 2}),
    ]


def add_prove_delete(what, tab_label, cards_js, key_desc, orig_desc, values_js, add_steps):
    return open_fixture() + [
        step("click", f"Open the {tab_label} tab", {"element": xpath_el(STAGE_URL, tab(tab_label))}),
        step("wait", f"Let the {tab_label} cards render", {"value": 2}),
        jsassert(f"PREMISE: no {what} with the run's key ({key_desc}) exists — so the one found "
                 f"after the add is THIS run's; and COUNT the original ({orig_desc})",
                 cards_js + "if (mine.length !== 0 || !document.evaluate(\"" + ADD_BTN.replace('"', '\\"')
                 + "\", document, null, 9, null).singleNodeValue) return false;\n"
                 f"sessionStorage.setItem('{K_ORIG}', String(orig.length));\nreturn true;",
                 timeout=30),
        step("click", "Open the add form", {"element": xpath_el(STAGE_URL, ADD_BTN)}),
        *add_steps,
    ] + submit_and_assert({"Condition": SUBMIT_CONDITION, "Failure": SUBMIT_FAILURE}[tab_label],
                          toast=None) + [
        step("wait", "Let the server answer before reloading", {"value": 3}),
    ] + reopen(tab_label, "reload: the server's answer") + [
        jsassert(f"⭐ SERVER PROOF: exactly ONE {what} with the run's key after a RELOAD, carrying "
                 "the picked values",
                 cards_js + f"return mine.length === 1 && {values_js};", timeout=30),

        # ---- delete what this run added (owner-sanctioned) --------------------------------
        jsassert(f"🛑 GUARD + open its gear: only if exactly one {what} has the run's key (the "
                 "premise proved it was absent before this run's add)",
                 cards_js + "if (mine.length !== 1) return false;\n"
                 "const g = mine[0].el.querySelector('[aria-label=\"Menu\"]');\n"
                 "if (!g) return false;\ng.click();\nreturn true;", timeout=30),
        step("wait", "Let the menu open", {"value": 1}),
        step("click", "Click `Delete Item` — on THIS card (its own record id)",
             {"element": xpath_el(STAGE_URL, DELETE_ITEM)}, timeout=30),
        step("wait", "Let the confirmation open", {"value": 1}),
        step("click", 'Confirm: "Yes"', {"element": xpath_el(STAGE_URL, CONFIRM_YES)}, timeout=30),
        step("wait", "Wait for the remove mutation", {"value": 3}),
    ] + reopen(tab_label, "reload: after the delete") + [
        jsassert(f"⭐ CLEANED: no {what} with the run's key, and the original ({orig_desc}) is "
                 "untouched — same count as before",
                 cards_js + f"const before = sessionStorage.getItem('{K_ORIG}');\n"
                 "return mine.length === 0 && before !== null && orig.length === Number(before);",
                 timeout=30),
        jsassert("Remove this test's sessionStorage key",
                 f"sessionStorage.removeItem('{K_ORIG}');\nreturn true;", always=True, timeout=15),
    ]


write(test(
    "MOB.390_Work_Add_Condition",
    "`MOB.390` **Add a condition score — proved after a reload — then delete it again.**\n"
    "- Cascading lookups: asset -> inspection group -> inspection element (order is load-bearing);\n"
    "  \"Inspection Group\" is assetStandardDetailId and \"Condition Left\" is conditionScore.\n"
    f"- Key `{ASSET} · {INSPECTION_GROUP} · {INSPECTION_ELEMENT}` — NOT the fixture's own\n"
    f"  `{ORIGINAL_ELEMENT}` condition: the server keeps one per key and refused every repeat\n"
    "  (bugs §40 — the modal still closed, so this test was green while adding nothing).\n"
    "- ⭐ Proof after a RELOAD: exactly one card with the key and 1 / 2 / 3.\n"
    "- 🛑 Self-cleaning with an **owner-sanctioned delete** (trap 2): `Delete Item` on that card\n"
    "  only — guarded in the same step as the gear click — then a reload proves it gone and the\n"
    "  original untouched.",
    add_prove_delete(
        "condition", "Condition", COND_CARDS,
        f"{ASSET} · {INSPECTION_GROUP} · {INSPECTION_ELEMENT}", ORIGINAL_ELEMENT, COND_VALUES, [
            # No search term: an empty query lists every asset ATTACHED TO THIS WORK STAGE
            # (options come from props.assets, not a global list). Typing is safe since
            # `cad415620c` fixed the case-sensitive filter (bugs §1) - MOB.389 guards that.
            *lookup("assetId", "asset", ASSET),
            *lookup("assetStandardDetailId", "inspection group", INSPECTION_GROUP),
            *lookup("inspectionElementId", "inspection element", INSPECTION_ELEMENT),
            # conditionFound / conditionScore / stressScore are enum lookups with numeric
            # options - typing into them does nothing. Pick the score by its title.
            *lookup("conditionFound", "condition found", CONDITION_FOUND, exact=True),
            *lookup("conditionScore", "condition left", CONDITION_LEFT, exact=True),
            *lookup("stressScore", "stress score", STRESS_SCORE, exact=True),
        ]),
    TAGS + ["Condition", "self-cleaning"],
))

write(test(
    "MOB.391_Work_Add_Failure",
    "`MOB.391` **Add a failure — proved after a reload — then delete it again.**\n"
    "- Four required lookups: asset, failure type, repair type, root cause type\n"
    "  (componentTypeId and discoveryCodeId are optional and skipped).\n"
    f"- Key `{FAILURE_TYPE} · {REPAIR_TYPE} · {ROOT_CAUSE_TYPE}` — NOT the fixture's own\n"
    f"  `{ORIGINAL_REPAIR}` failure: the server keeps one per key and refused every repeat (bugs §40).\n"
    "- ⭐ Proof after a RELOAD: exactly one card with the key.\n"
    "- 🛑 Self-cleaning with an **owner-sanctioned delete** (trap 2): `Delete Item` on that card\n"
    "  only — guarded in the same step as the gear click — then a reload proves it gone and the\n"
    "  original untouched.",
    add_prove_delete(
        "failure", "Failure", FAIL_CARDS,
        f"{FAILURE_TYPE} · {REPAIR_TYPE} · {ROOT_CAUSE_TYPE}",
        f"{FAILURE_TYPE} · {ORIGINAL_REPAIR} · {ROOT_CAUSE_TYPE}", "true", [
            # No search term: an empty query lists every asset ATTACHED TO THIS WORK STAGE.
            *lookup("assetId", "asset", ASSET),
            *lookup("failureTypeId", "failure type", FAILURE_TYPE),
            *lookup("repairTypeId", "repair type", REPAIR_TYPE),
            *lookup("rootCauseTypeId", "root cause type", ROOT_CAUSE_TYPE),
        ]),
    TAGS + ["Failures", "self-cleaning"],
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
        step("wait", "Let the note cards render", {"value": 2}),
        # SERVER PROOF (bugs §40): count the notes carrying OUR text, reload after, require +1.
        stash_record_count("__dd392_before", [NOTE_TEXT], "note"),
        step("click", "Open the add form", {"element": xpath_el(STAGE_URL, ADD_BTN)}),
        # Instructions is a tiptap RICH TEXT editor (MantineRichTextEditor.Content), not a
        # plain input - there is no #desc field to type into. The editable surface is the
        # contenteditable div, so focus it first and type there.
        step("click", "Focus the rich text editor",
             {"element": xpath_el(STAGE_URL, '//div[@contenteditable="true"]')}),
        step("typeText", "Enter the note instructions",
             {"value": NOTE_TEXT,
              "element": xpath_el(STAGE_URL, '//div[@contenteditable="true"]')}),
    ] + submit_and_assert() + prove_record_count("__dd392_before", [NOTE_TEXT], "note", STAGE_URL,
                                                 tab("Notes")),
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
