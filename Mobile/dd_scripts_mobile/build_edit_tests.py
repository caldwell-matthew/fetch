"""Build the "edit an existing field" tests - MOB.395, MOB.710 and MOB.989_FieldEdit_Suite.

THE PLAN SAID SEVEN TESTS. THERE ARE NOT SEVEN SURFACES.
  "Asset data tabs x5 + collector edit fields + WO General Info" counted SCREENS. Reading the
  components, the same three forms are reused everywhere:

    EditForm (per-field modal)   AssetLookupDetails -> reached from Asset Lookup, from the
                                 Collector's asset details (Details.tsx renders
                                 AssetLookupDetails), AND from the asset rows inside an
                                 Asset Verification job. ONE component, ONE mutation.
    GeneralInfo (bulk form)      DetailPage/GeneralInfo -> the Work Order General Info tab
                                 (UPDATE_WORK_STAGE) and the full-page Asset Verification
                                 asset detail (UPDATE_ASSET). One component, two mutations.
    Attributes (bulk form)       DetailPage/Attributes -> WO Attributes tab and AV asset
                                 attributes. Not built yet: which attributes exist on the
                                 fixtures is DB data, not source.

  Photos/Docs are attachments and Work History is read-only, so they are not edit surfaces at
  all. Recorded because "5 tabs" implied five tests and would have produced four near-duplicates
  of MOB.710.
  (This used to add "backend-blocked, bugs_found.md 14". **§14 is fixed** - MOB.600 runs green
  with a real uploadFiles step, and MOB.621/622/741 cover the attachment surfaces. It changes
  nothing above: they are still not EDIT surfaces.)

WHY BOTH TESTS ARE TWO-LEGGED, AND WHY THAT IS NOT DECORATION
  Leg 1 writes `DD SYNTHETIC EDIT {{ RUNID }}`; leg 2 writes the fixed BASELINE back. Three
  separate problems are solved by that shape at once:

    dirtiness   SubmitButton is `type={isValid ? 'submit' : 'button'}` and GeneralInfo also
                requires `isDirty` - so re-typing the value a field ALREADY holds produces a
                button that does nothing, silently (trap 8). RUNID differs every run, so leg
                1 is always a genuine change; leg 2 is always a change because leg 1 just
                wrote something else.
    self-heal   A run that dies after leg 1 leaves a marker, not a broken fixture. The next
                run's leg 1 still changes the value (new RUNID) and leg 2 still restores.
                There is no state this pair cannot recover from.
    no vacuity  Leg 1 asserts the value is NOT the baseline; leg 2 asserts it IS exactly the
                baseline. Neither can pass while the write silently did nothing, because the
                other leg guarantees what the starting value was.

  Do NOT "simplify" this into a single write. A one-leg version passes on a page where
  nothing happened.

  ONE HONEST CAVEAT ABOUT THE VERY FIRST RUN. Leg 1 asserts "the value is NOT the baseline",
  which is vacuously true on a fixture that never held the baseline to begin with - so the
  first run proved only leg 2 (a positive read-back of an exact value, which IS sound). From
  the second run on, leg 2 has left the field at the baseline, so leg 1 starts from a known
  value and becomes a real check. Both runs passed; the second one is the meaningful one.
  If this fixture is ever reset by hand, the same one-run blind spot returns.

RUNID STAYS OUT OF THE JAVASCRIPT
  `{{ RUNID }}` is interpolated into TYPED TEXT, which is proven (MOB.600 does it). Whether
  Datadog interpolates variables inside an `assertFromJavascript` code body is NOT proven, so
  no assertion here depends on it - leg 1 compares against the baseline literal by inequality
  instead. If that interpolation is ever confirmed, leg 1 could assert the exact marker.

TYPING REPLACES, IT DOES NOT OVERWRITE
  Datadog's typeText APPENDS. Every write here is therefore click -> Control+A -> type, so
  the field ends up holding exactly the intended value rather than the old value with the new
  one stuck on the end. Without the select-all, leg 2 would never restore the baseline - it
  would grow the string every run.

PROOF IS A RELOAD, NOT A TOAST AND NOT A CLOSED MODAL
  Both surfaces fail trap 6 in different ways, so neither UI signal is trusted:
    GeneralInfo  has an `optimisticResponse`, so its "Record Updated" toast fires from the
                 optimistic write - before the server has said anything.
    EditForm     calls `modal.close()` OUTSIDE the mutation's update(), immediately after a
                 non-awaited `client.mutate` (AssetLookupDetails/index.tsx:147-167) - so the
                 modal closes whether or not the write ever lands.
  Both tests therefore RELOAD the page and read the value back from a fresh query.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, HERE, step, xpath_el, go, test, write, localvar, jsassert,
                      av_job_gate)  # noqa: E402

WORK_URL = BASE + "/work"
WORK_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
WORK_DETAIL = f"{WORK_URL}/{WORK_ID}"
LOOKUP_URL = BASE + "/asset-lookup"
ASSET = "Pump 0102"

BASELINE = "DATADOG FIXTURE"
MARKER = "DD SYNTHETIC EDIT {{ RUNID }}"
RUNID = localvar("RUNID", "{{ numeric(8) }}", "48120735")

TAGS = ["Mobile", "env:dev", "CRUD", "field-edit"]

# The first result row in a Mantine Accordion. Closed panels stay mounted (trap 3), so every
# locator inside the detail panel is scoped to this.
ROW = '(//*[contains(@class,"mantine-Accordion-item")])[1]'
SEARCH = '//input[@name="asset-search"]'


def set_text(field_xpath, value, label, url):
    """Click, select-all, type. The select-all is load-bearing - typeText appends."""
    return [
        step("click", f"Focus the {label} field", {"element": xpath_el(url, field_xpath)}),
        # Chrome on Datadog's Linux runners: Control, not Meta.
        step("pressKey", "Select the existing text (typeText APPENDS without this)",
             {"value": "a", "modifiers": ["Control"]}),
        step("typeText", f"Type the {label} value",
             {"value": value, "element": xpath_el(url, field_xpath)}),
    ]


# ---------------------------------------------------------------- WO General Info
# The submit button is matched by @form, not by its label. SubmitButton renders `{buttonText}`
# (default "Submit") as an explicit JSX child, so a caller passing children does NOT
# necessarily change the visible text - the same ambiguity that made MOB.600 assert a button
# that read "Create Asset". @form="mobile-genInfo" is unambiguous and label-independent.
GENINFO_SUBMIT = '//button[@form="mobile-genInfo"]'
GENINFO_TAB = '//*[@role="tab"][contains(normalize-space(.), "General Info")]'
DESC = '//*[@id="desc"]'

def desc_value_js(op, value):
    return ("const el = document.querySelector('#desc');\n"
            "if (!el) return false;\n"
            f"return el.value.trim() {op} '{value}';")


def open_work_geninfo():
    return [
        go(WORK_URL, "/work to warm the lookup cache"),
        step("wait", "Wait for the work list and lookup prefetch", {"value": 20}),
        go(WORK_DETAIL, "the fixture work order"),
        # Appendix F: 5s -> 2s settle floor, and the assertion POLLS (timeout=30) instead.
        # Datadog steps poll until their timeout - measured 58.2s against a 60s limit - so a
        # gate returns as soon as it is satisfied. The 20s /work wait above is NOT convertible:
        # it warms the lookup cache and its only readiness signals are negative (a `lacks` on a
        # loading label is true before loading starts too) or a colour, which is not assertable.
        step("wait", "Let the detail view begin rendering", {"value": 2}),
        step("assertPageContains", "Test work order detail rendered", {"value": "Status:"},
             timeout=30),
        step("click", "Open the General Info tab",
             {"element": xpath_el(WORK_DETAIL, GENINFO_TAB)}),
        step("wait", "Wait for the General Info panel to mount", {"value": 3}),
        # Fails loudly and specifically if the template does not expose `desc`, instead of
        # letting the click step report a confusing "no element found" later on.
        step("assertElementPresent", "FIELD GUARD: the Description input is on this tab",
             {"element": xpath_el(WORK_DETAIL, DESC)}),
    ]


write(test(
    "MOB.395_Work_GenInfo_Edit",
    "`MOB.395` Edit a field on the Work Order **General Info** tab and prove it persisted.\n"
    "- **SELF-RESTORING**: leg 1 writes `DD SYNTHETIC EDIT <runid>`, leg 2 writes\n"
    f"  `{BASELINE}` back, so the fixture ends every run in the same known state.\n"
    "- Proof is a **reload**, not the toast. `GeneralInfo` passes an `optimisticResponse`,\n"
    "  so `Record Updated` fires from the optimistic write before the server replies\n"
    "  (trap 6). Each leg re-navigates and reads `#desc.value` from a fresh query.\n"
    "- The value is read with a **JS assertion** — an input's value is a property, not page\n"
    "  text, so `assertPageContains` cannot see it (trap 16).\n"
    "- Every write is click → **Control+A** → type, because Datadog's `typeText` APPENDS.\n"
    "  Without the select-all the description would grow by one marker every run.\n"
    "- `isValid && isDirty` gates the submit button, so writing the value the field already\n"
    "  holds produces a silent no-op (trap 8). `{{ RUNID }}` guarantees leg 1 is a real\n"
    "  change; leg 1 guarantees leg 2 is.",
    open_work_geninfo()
    + set_text(DESC, MARKER, "Description", WORK_DETAIL)
    + [
        step("click", "Submit the General Info form",
             {"element": xpath_el(WORK_DETAIL, GENINFO_SUBMIT)}),
        # LOOK FOR THE TOAST BEFORE IT EXPIRES. react-toastify autoCloses at 5000ms, so the
        # original `wait 6` then assert could never pass - it was a step that could only ever
        # report ERR, the same "assertion that cannot do its job" as trap 5. Assert early,
        # then finish waiting for the mutation.
        step("wait", "Brief wait for the toast to appear", {"value": 2}),
        step("assertPageContains", "Record Updated toast (optional: fires optimistically)",
             {"value": "Record Updated"}, optional=True),
        step("wait", "Wait for the update mutation to reach the server", {"value": 5}),
    ]
    + open_work_geninfo()
    + [
        jsassert("PROOF: after a reload the description is no longer the baseline",
                 desc_value_js("!==", BASELINE)),
    ]
    + set_text(DESC, BASELINE, "Description", WORK_DETAIL)
    + [
        step("click", "Submit the restore", {"element": xpath_el(WORK_DETAIL, GENINFO_SUBMIT)}),
        step("wait", "Wait for the restore mutation", {"value": 6}),
    ]
    + open_work_geninfo()
    + [
        jsassert(f'RESTORED: the description is exactly "{BASELINE}" again',
                 desc_value_js("===", BASELINE)),
    ],
    TAGS + ["Work Orders"],
    local_vars=(RUNID,),
))

# ---------------------------------------------------------------- Asset Lookup field edit
# faEdit -> "pen-to-square" (looked up with node, not guessed - trap 14). The button has no
# accessible name, so the icon is the locator; it is scoped to the row whose label cell reads
# "Description" so it cannot land on another field's pencil.
EDIT_PENCIL = (f'{ROW}//tr[.//b[normalize-space(.)="Description"]]'
               '//button[.//*[@data-icon="pen-to-square"'
               ' or contains(concat(" ", normalize-space(@class), " "),'
               ' " fa-pen-to-square ")]]')
MODAL = '//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
MODAL_DESC = f'{MODAL}//*[@id="desc"]'
# Matches whichever label actually renders. SubmitButton puts `{buttonText}` ("Submit") in the
# JSX child position while EditForm also passes "Update Asset" as children - JSX children win,
# but that is a React detail to depend on, not a fact to assert. Scoped to the modal so the
# `or` cannot match two buttons.
MODAL_SUBMIT = (f'{MODAL}//button[normalize-space(.)="Submit"'
                ' or normalize-space(.)="Update Asset"]')

# Read the rendered Description cell rather than the page text: the asset's desc also appears
# in the accordion header, so a page-level assertion would be satisfied by chrome (trap 5b).
def row_desc_js(op, value):
    """Built by concatenation, not str.format - the arrow function's braces collide with
    format placeholders, which is exactly how this first failed to build."""
    return ("const row = [...document.querySelectorAll('tr')].find(t => {\n"
            "  const b = t.querySelector('b');\n"
            "  return b && b.textContent.trim() === 'Description';\n"
            "});\n"
            "if (!row || row.cells.length < 2) return false;\n"
            f"return row.cells[1].textContent.trim() {op} '{value}';")


def open_asset_detail():
    return [
        go(LOOKUP_URL, "asset lookup"),
        step("wait", "Wait for the page to mount", {"value": 5}),
        step("click", "Focus the search input", {"element": xpath_el(LOOKUP_URL, SEARCH)}),
        step("typeText", f"Search for {ASSET}",
             {"value": ASSET, "element": xpath_el(LOOKUP_URL, SEARCH)}),
        step("pressKey", "Submit the search (Enter - there is no search button)",
             {"value": "Enter"}),
        step("wait", "Wait for the search results", {"value": 8}),
        step("assertPageContains", f"Test {ASSET} is in the results", {"value": ASSET}),
        step("click", "Expand the first result",
             {"element": xpath_el(LOOKUP_URL,
                                  f'{ROW}//*[contains(@class,"mantine-Accordion-control")]')}),
        step("wait", "Wait for the detail panel to mount", {"value": 3}),
    ]


def edit_desc(value, label):
    return [
        step("click", f"Open the Description edit form ({label})",
             {"element": xpath_el(LOOKUP_URL, EDIT_PENCIL)}),
        step("wait", "Wait for the edit modal", {"value": 2}),
        step("assertElementPresent", "The edit modal opened on the Description field",
             {"element": xpath_el(LOOKUP_URL, MODAL_DESC)}),
    ] + set_text(MODAL_DESC, value, "Description", LOOKUP_URL) + [
        step("click", "Submit the edit", {"element": xpath_el(LOOKUP_URL, MODAL_SUBMIT)}),
        # Assert before the 5000ms autoClose - see the note in MOB.395.
        step("wait", "Brief wait for the toast to appear", {"value": 2}),
        step("assertPageContains", "Description updated toast (optional: transient)",
             {"value": "updated"}, optional=True),
        step("wait", "Wait for the update mutation", {"value": 5}),
    ]


write(test(
    "MOB.710_AssetLookup_Field_Edit",
    "`MOB.710` Edit a single field through the per-field pencil on Asset Lookup.\n"
    f"- **SELF-RESTORING**: leg 1 writes `DD SYNTHETIC EDIT <runid>` to `{ASSET}`'s\n"
    f"  description, leg 2 writes `{BASELINE}` back.\n"
    "- **This is the most reused edit surface in the app.** `AssetLookupDetails` is rendered\n"
    "  by Asset Lookup, by the Collector's asset details (`Details.tsx`), and by the asset\n"
    "  rows inside an Asset Verification job — so one test covers all three entry points.\n"
    "- **The closing modal proves nothing here.** `modal.close()` is called immediately after\n"
    "  a non-awaited `client.mutate`, outside `update()`\n"
    "  (`AssetLookupDetails/index.tsx:147-167`) — the untrustworthy half of trap 6. Each leg\n"
    "  re-navigates and reads the value back from a fresh query.\n"
    "- The read-back targets the **Description table cell**, not the page: the asset's\n"
    "  description is also rendered in the accordion header, so a page-level assertion would\n"
    "  be satisfied by chrome (trap 5b).\n"
    "- Only `name`, `desc`, `typeId` and `tagId` are visible by default — `RecordInfoTable`\n"
    "  persists the column selection in `localStorage`, and `typeId` is forced\n"
    "  `allowUpdate: false`, so `desc` is the natural editable target.\n"
    "- The pencil is icon-only: `faEdit` → `pen-to-square`, looked up rather than guessed\n"
    "  (trap 14), and scoped to the row whose label reads `Description`.",
    open_asset_detail()
    + edit_desc(MARKER, "leg 1")
    + open_asset_detail()
    + [
        jsassert("PROOF: after a reload the description is no longer the baseline",
                 row_desc_js("!==", BASELINE)),
    ]
    + edit_desc(BASELINE, "restore")
    + open_asset_detail()
    + [
        jsassert(f'RESTORED: the description cell reads exactly "{BASELINE}"',
                 row_desc_js("===", BASELINE)),
    ],
    TAGS + ["Asset Lookup"],
    local_vars=(RUNID,),
))

# ---------------------------------------------------------------- AV asset attributes
# "I'm pretty sure you can't modify asset attributes" - correct for the screen most people
# look at, and worth writing down because it sent this test to the right place:
#
#   expanded asset ROW -> Attributes tab   RecordAttributeTable  READ-ONLY. Plain <Table.Td>
#                                          text, no inputs, no submit, no edit button.
#   full-page asset detail -> Attributes   DetailPage/Attributes EDITABLE, via
#                                          UPDATE_ASSET_ATTRIBUTE.
#
# Same tab name, two different components. The editable one is reached by tapping the asset
# NAME in a job's asset row (JobAccordianControl.tsx:37 -> navigate(`asset/${id}`)).
JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
JOB_URL = BASE + "/asset-verify"
JOB_DETAIL = f"{JOB_URL}/{JOB_ID}"
ATTRIBUTE = "Year Of Manufacture"
# It reads like a date but it is a STRING attribute holding values like "DECEMBER 2002"
# (confirmed by the repo owner), so the normal text marker is valid here and no numeric or
# date handling is needed. `attributetype.type` can be any of
# string|date|datetime|integer|float|boolean|money|image, and the wrong assumption would have
# been sanitised away silently rather than erroring - worth checking rather than inferring
# from the field's NAME.
#
# The restore value is a realistic one rather than a synthetic marker: this leg overwrites a
# real attribute on a real asset, so what it leaves behind should look like data, not litter.
ATTR_BASELINE = "DECEMBER 2002"

# The asset name is a Highlight span carrying an inline underline style. It is matched
# positionally because the fixture job's asset NAMES are still unknown (Appendix D, Q7) - the
# same gap that blocks verifying sort ordering.
# By NAME, not by an inline style - the style-based locator was inferred from Highlight's
# `textDecoration` and does not reliably match. `contains` because the rendered name carries an
# emoji prefix; `[last()]` takes the innermost span (TruncateText wraps Highlight, so both
# match and Datadog errors on multiples - trap 3).
FIXTURE_ASSET = "Tank 0000"        # the other fixture asset is "A/C Motor 0002"
ASSET_LINK = f'(//span[contains(normalize-space(.), "{FIXTURE_ASSET}")])[last()]'
ATTRIB_TAB = '//*[@role="tab"][contains(normalize-space(.), "Attributes")]'
# Attribute inputs are keyed by the attribute RECORD's uuid, so the id is useless as a
# locator. The label is the only stable handle: <div class="form-group"><label>...
ATTRIB_FIELD = ('//div[contains(concat(" ", normalize-space(@class), " "), " form-group ")]'
                f'[./label[contains(normalize-space(.), "{ATTRIBUTE}")]]//input')
ATTRIB_SUBMIT = '//button[@form="mobile-attrib"]'


def attrib_value_js(op, value):
    return ("const g = [...document.querySelectorAll('div.form-group')].find(d => {\n"
            "  const l = d.querySelector('label');\n"
            f"  return l && l.textContent.trim().indexOf('{ATTRIBUTE}') === 0;\n"
            "});\n"
            "if (!g) return false;\n"
            "const el = g.querySelector('input');\n"
            "if (!el) return false;\n"
            f"return el.value.trim() {op} '{value}';")


JOBS_PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]'
JOBS_SEARCH = '//input[@placeholder="Find Mobile Job(s)"]'


def open_asset_attributes():
    """Uses the shared `av_job_gate` - the local copy of this gate is gone on purpose.

    It used to deep-link (`go(JOB_DETAIL)`) and then click an "All" filter. Both were wrong:
      - the deep link is a FULL PAGE LOAD onto a `cache-only` route and can render the job
        with an EMPTY asset list (MOB.396, 2026-08-12). Click the job row like a user.
      - the "All" click was a no-op - All is the default the page lands on - and the control
        is a Mantine SegmentedControl presenting as a button, so it could only ever fail.
    This test passed on timing luck, not correctness.
    """
    return av_job_gate(JOB_ID) + [
        step("click", f"Open {FIXTURE_ASSET}'s full-page detail",
             {"element": xpath_el(JOB_DETAIL, ASSET_LINK)}, timeout=30),
        step("wait", "Wait for the asset detail route", {"value": 6}),
        step("assertPageContains", "The full-page asset detail rendered",
             {"value": "Asset Type:"}),
        step("click", "Open the Attributes tab",
             {"element": xpath_el(JOB_DETAIL, ATTRIB_TAB)}),
        step("wait", "Wait for the Attributes panel", {"value": 3}),
        # Fails loudly if this asset has no Catalog Number, instead of a later click reporting
        # a confusing "no element found". `Attributes` renders "No asset attributes found."
        # when the list is empty, which this guard also catches.
        step("assertElementPresent",
             f'FIELD GUARD: the "{ATTRIBUTE}" attribute input is on this asset',
             {"element": xpath_el(JOB_DETAIL, ATTRIB_FIELD)}),
    ]


write(test(
    "MOB.545_AssetVerify_Attribute_Edit",
    f"`MOB.545` Edit the `{ATTRIBUTE}` attribute on an asset and prove it persisted.\n"
    "- **SELF-RESTORING**: leg 1 writes `DD SYNTHETIC EDIT <runid>`, leg 2 writes\n"
    f"  `{ATTR_BASELINE}` back — a realistic value, not a synthetic one, because this\n"
    "  overwrites a real attribute on a real asset.\n"
    f"- `{ATTRIBUTE}` reads like a date but is a **string** attribute (values like\n"
    f"  `{ATTR_BASELINE}`), so the text marker is valid. An integer or date column would\n"
    "  have sanitised it away silently.\n"
    "- **Attributes are read-only on the tab most people look at.** The Attributes tab of an\n"
    "  *expanded asset row* is `RecordAttributeTable` — plain text cells, no inputs. The\n"
    "  editable form lives on the **full-page** asset detail, reached by tapping the asset\n"
    "  name in a job row (`JobAccordianControl.tsx:37`). Same tab name, different component.\n"
    "- A genuinely different write path from MOB.395/710: `Attributes` fires **one mutation\n"
    "  per dirty field**, not one for the form, and has **no `optimisticResponse`** — so its\n"
    "  toast is server-confirmed, unlike `GeneralInfo`'s. It is still transient, so the proof\n"
    "  is a reload and a JS read of the input's value (trap 16).\n"
    "- Attribute inputs are keyed by the attribute record's **uuid**, so every locator here\n"
    "  matches on the **label** instead.\n"
    "- The asset is selected **positionally** — the fixture job's asset names are still\n"
    "  unknown (Appendix D, Q7).",
    open_asset_attributes()
    + set_text(ATTRIB_FIELD, MARKER, ATTRIBUTE, JOB_DETAIL)
    + [
        step("click", "Submit the attributes form",
             {"element": xpath_el(JOB_DETAIL, ATTRIB_SUBMIT)}),
        # Worth catching here specifically: `Attributes` has NO optimisticResponse, so this
        # toast fires from the mutation's update() and is genuinely server-confirmed - the one
        # toast in these three tests that means something. Assert before the 5000ms autoClose.
        step("wait", "Brief wait for the toast to appear", {"value": 2}),
        step("assertPageContains", "Attributes updated toast (optional: transient)",
             {"value": "Attributes updated successfully!"}, optional=True),
        step("wait", "Wait for the attribute mutation", {"value": 5}),
    ]
    + open_asset_attributes()
    + [
        jsassert(f'PROOF: after a reload "{ATTRIBUTE}" is no longer the baseline',
                 attrib_value_js("!==", ATTR_BASELINE)),
    ]
    + set_text(ATTRIB_FIELD, ATTR_BASELINE, ATTRIBUTE, JOB_DETAIL)
    + [
        step("click", "Submit the restore",
             {"element": xpath_el(JOB_DETAIL, ATTRIB_SUBMIT)}),
        step("wait", "Wait for the restore mutation", {"value": 6}),
    ]
    + open_asset_attributes()
    + [
        jsassert(f'RESTORED: "{ATTRIBUTE}" is exactly "{ATTR_BASELINE}" again',
                 attrib_value_js("===", ATTR_BASELINE)),
    ],
    TAGS + ["Asset Verification"],
    local_vars=(RUNID,),
))

# ---------------------------------------------------------------- suite
login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]
# Keep COMPLETE - a child missing here is silently dropped on the next DD_FORCE rebuild and
# the suite then passes with the test absent (trap 12).
CHILDREN = ["MOB.395_Work_GenInfo_Edit", "MOB.710_AssetLookup_Field_Edit",
            "MOB.545_AssetVerify_Attribute_Edit"]

write(test(
    "MOB.989_FieldEdit_Suite",
    "Editing existing records — the write path every module has and none of the read-only\n"
    "suites cover.\n"
    "- Both children MUTATE but are **self-restoring**: each writes a run-unique marker and\n"
    f"  then restores `{BASELINE}`.\n"
    "- Kept OUT of `MOB.995_AssetLookup_Suite` on purpose — that suite is documented as\n"
    "  read-only and safe to schedule, and quietly adding a mutating child to it would make\n"
    "  that promise false.\n"
    "- subtestPublicId values stay PENDING-WIRE-UP until the children exist on Datadog;\n"
    "  run wire_suite.py after pushing them.",
    login_steps + [step("playSubTest", c,
                        {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1})
                   for c in CHILDREN],
    ["Mobile", "env:dev", "field-edit", "suite"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))

print("wrote MOB.395 (WO General Info edit), MOB.545 (asset attribute edit), "
      "MOB.710 (Asset Lookup field edit), MOB.989 (suite)")
