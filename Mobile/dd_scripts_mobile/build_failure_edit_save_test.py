"""Build MOB.385_Work_Failure_Edit_Save - a failure's `Edit Item` SAVES, proved on the server, then restored.

WHAT THE SOURCE SAYS (origin/development)
  Each failure card's gear is `WorkCollectionMenu` (`WorkOrders/components/ui/Menu.tsx`) with an
  `EditForm` - `FailureForm` given `failure={failure}` (`Failures/index.tsx:77-91`). Its submit
  (`Failures/Form.tsx:153-165`) calls `updateCollectionRecord` with `UPDATE_WORKSTAGE_FAILURE` and
  the card's record id: an `optimisticResponse`, and `done()` - which closes the modal - inside
  `update()`. Apollo runs that first on the OPTIMISTIC result, so the modal closes whether or not
  the server accepts (trap 6, bugs §40's shape on the edit path). `MOB.386` saves a condition only.

⭐ THE PROOF IS A /graphql READ (`dd_tools.server_assert`) - not the modal, not a reload
  premise   the server holds exactly ONE failure on the fixture: `Pump 0102 · BELT (R-L1) · MISSED ·
            TIME`, no component, no discovery code (the fixed restore value, read over the API)
  edit      Repair Type MISSED -> **REPAIR** on the FIRST `Edit Item` after the page loads -> the
            server holds that same failure id with REPAIR, everything else unchanged
  restore   `Edit Item` again, REPAIR -> **MISSED**, `always` -> the server holds MISSED, `always`

WHY REPAIR TYPE, AND WHY `REPAIR`
  - The cascades (`Form.tsx:134-151`): changing the asset or component clears the failure type, and
    changing the failure type clears repair / root cause / discovery code. Repair Type clears
    nothing, so the edit is exactly one field.
  - Discovery Code (null at rest) would need a restore to EMPTY, which a ListFilter pick cannot express.
  - `BELT (R-L1)`'s repair types are MISSED · ADJUST · REPLACE · REPAIR · NOT LISTED (read over the
    API). The unique key is [workStage, failureType, repairType, rootCauseType] (bugs §40), and
    `ADJUST` is `MOB.391`'s own key - so the edit uses REPAIR, a key no other test writes, and the
    edit can never be refused as a duplicate.

🛑 RED UNTIL bugs §42 IS FIXED - as MOB.386. `FailureForm` passes `schemaData?._info?.fields ?? []` to
`useCustomForm` (`Failures/Form.tsx:57`) while `GET_SCHEMA('WorkStageFailure')` loads, and
`useFormWithValidation` builds its zod schema once (`useMemo` deps `[undefined]`). An empty schema
is always valid (Submit arms) and strips every value, so `if (!values.assetId) return;`
(`Form.tsx:154`) exits: no request, the modal stays open. The save proof is `soft`: MOB.385 goes red
but still restores, and a suite parent's later children still run.

THE RESTORE WORKS WITH §42 OPEN OR FIXED. It opens and closes `Edit Item` once first, so `GET_SCHEMA`
is cached and the restore form gets the full schema. `FailureForm`'s Submit is `isValid` only (no
`isDirty`), so re-picking MISSED on a form that already holds it submits an unchanged record -
harmless; the hard RESTORED server read (MISSED) is the proof.

⚠️ ARMED BEFORE EVERY SUBMIT (trap 8): the click waits for `button[form="work-failure-form"]` to be
`type="submit"`.

🛑 SELF-RESTORING. Every restore step is `alwaysExecute`; if a run dies mid-way the card reads
REPAIR, the next run's PREMISE goes red, and its restore (or the API) puts it back. While it reads
REPAIR, `MOB.391`'s "original untouched" count and `preflight.py mob39x` are unaffected (they key on
ADJUST), but the fixture's `MISSED` failure is missing - restore before a suite.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert, server_assert  # noqa: E402

FIXTURE_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
STAGE_URL = f"{BASE}/work/{FIXTURE_ID}"
FAILURE_ID = "YxYAgs5xtV5pQJFopUw5xN"   # the fixture's one permanent failure (read over the API)
ASSET = "Pump 0102"
FAILURE_TYPE, ROOT_CAUSE = "BELT (R-L1)", "TIME"
BASE_REPAIR, EDIT_REPAIR = "MISSED", "REPAIR"
FORM = "work-failure-form"
EDIT_ITEM = ('(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")]'
             '[normalize-space(.)="Edit Item"])[1]')
MODAL_CLOSE = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
               '//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]')
SUBMIT = f'//button[@form="{FORM}"]'
FAIL_Q = ("query($id: ID!) { workStage(id: $id) { failures { id assetId { name } componentTypeId { id } "
          "failureTypeId { name } repairTypeId { name } rootCauseTypeId { name } discoveryCodeId { id } } } }")


def tab(label):
    return f'//*[@role="tab"][contains(normalize-space(.), "{label}")]'


def server_repair_is(repair):
    """Exactly one failure on the stage - the fixture's own id - holding `repair`, nothing else changed."""
    return ("data.workStage.failures.length === 1 && ((f) => "
            f"f.id === '{FAILURE_ID}' && !!f.assetId && f.assetId.name === '{ASSET}' && !f.componentTypeId && "
            f"!!f.failureTypeId && f.failureTypeId.name === '{FAILURE_TYPE}' && "
            f"!!f.rootCauseTypeId && f.rootCauseTypeId.name === '{ROOT_CAUSE}' && !f.discoveryCodeId && "
            f"!!f.repairTypeId && f.repairTypeId.name === '{repair}')(data.workStage.failures[0])")


NORM = "const norm = t => (t || '').replace(/\\s+/g, ' ').trim();\n"
# The card (FailureDetails.tsx): a CollapsableSection Paper holding the Table rows [label td, value
# td], grouped (via a component Box) under an asset Paper whose first Text is the asset name
# (Failures/index.tsx). `orig` = the fixture's failure in EITHER repair state, so the restore finds it
# whether or not the edit saved; the edit leg's gear step additionally requires MISSED.
CARD_JS = (NORM +
           "const cards = [...document.querySelectorAll('table')]\n"
           "  .filter(t => /Failure Type/.test(t.textContent || ''))\n"
           "  .map(t => { const c = t.closest('[class*=\"mantine-Paper-root\"]'); if (!c) return null;\n"
           "    const grp = c.parentElement && c.parentElement.closest('[class*=\"mantine-Paper-root\"]');\n"
           "    const a = grp && grp.querySelector('[class*=\"mantine-Text-root\"]');\n"
           "    const row = {}; [...t.querySelectorAll('tr')].forEach(tr => { const td = [...tr.children].map(x => norm(x.textContent)); if (td.length >= 2) row[td[0]] = td[1]; });\n"
           "    return { el: c, asset: a ? norm(a.textContent) : '', row }; }).filter(Boolean);\n"
           f"const orig = cards.filter(c => c.asset === '{ASSET}' && c.row['Failure Type'] === '{FAILURE_TYPE}'\n"
           f"  && c.row['Root Cause'] === '{ROOT_CAUSE}' && ['{BASE_REPAIR}', '{EDIT_REPAIR}'].indexOf(c.row['Repair Type']) !== -1);\n")


def pick_visible_option_js(pick):
    """The ONE VISIBLE ListFilter option titled exactly `pick` (build_tab_tests.lookup's recipe)."""
    return ("const vis = [...document.querySelectorAll('[role=\"option\"]')].filter(o => {\n"
            "  const t = o.querySelector('[class*=\"option-title\"]');\n"
            f"  return t && (t.textContent || '').trim() === '{pick}' && o.offsetParent !== null;\n"
            "});\n"
            "if (vis.length !== 1) return false;\n"
            "vis[0].click();\nreturn true;")


def open_fixture(label, always=False):
    a = dict(always=always)
    return [
        (step("goToUrl", f"Navigate to the fixture work order ({label})", {"value": STAGE_URL}, always=True)
         if always else go(STAGE_URL, f"the fixture work order ({label})")),
        step("wait", "Let the detail view begin rendering", {"value": 2}, **a),
        step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}, timeout=30, **a),
        step("click", "Open the Failure tab", {"element": xpath_el(STAGE_URL, tab("Failure"))}, timeout=30, **a),
        step("wait", "Let the failure cards render", {"value": 2}, **a),
    ]


def open_edit(always=False, require=None):
    a = dict(always=always)
    need = f" reading {require}" if require else ""
    extra = (" || orig[0].row['Repair Type'] !== '" + require + "'") if require else ""
    cond = "if (orig.length !== 1" + extra + ") return false;\n"
    return [
        jsassert(f"Open the `{ASSET} · {FAILURE_TYPE} · {ROOT_CAUSE}` failure card's gear — exactly one such card{need}",
                 CARD_JS + cond +
                 "const g = orig[0].el.querySelector('[aria-label=\"Menu\"]');\n"
                 "if (!g) return false;\ng.click();\nreturn true;", timeout=30, **a),
        step("wait", "Let the menu open", {"value": 1}, **a),
        step("click", "Click `Edit Item`", {"element": xpath_el(STAGE_URL, EDIT_ITEM)}, timeout=30, **a),
        step("wait", "Let the edit form mount (it loads the WorkStageFailure schema)", {"value": 3}, **a),
        step("assertElementPresent", "The failure form opened",
             {"element": xpath_el(STAGE_URL, f'//form[@id="{FORM}"]')}, timeout=30, **a),
    ]


def prime_schema(always=False):
    """Open `Edit Item` and close it unsaved, so `GET_SCHEMA` is cached before the form that saves (bugs §42)."""
    a = dict(always=always)
    return open_edit(always) + [
        step("click", "Close it unsaved — `GET_SCHEMA` is now cached, so the NEXT form builds the full "
             "schema (bugs §42)", {"element": xpath_el(STAGE_URL, MODAL_CLOSE)}, timeout=30, **a),
        jsassert("The failure form is closed", f"return !document.getElementById('{FORM}');", timeout=20, **a),
    ]


def held(field, value):
    return (f"const el = document.getElementById('{field}');\n"
            f"return !!el && (el.value || '').trim() === '{value}';")


def edit_repair(to, always=False, restore=False):
    a = dict(always=always)
    prefill = [] if restore else [
        jsassert(f"The form opened PREFILLED from this card: `#failureTypeId` {FAILURE_TYPE}, "
                 f"`#repairTypeId` {BASE_REPAIR}, `#rootCauseTypeId` {ROOT_CAUSE}",
                 "const v = id => { const el = document.getElementById(id); return el ? (el.value || '').trim() : null; };\n"
                 f"return v('failureTypeId') === '{FAILURE_TYPE}' && v('repairTypeId') === '{BASE_REPAIR}' "
                 f"&& v('rootCauseTypeId') === '{ROOT_CAUSE}';", timeout=30),
    ]
    return open_edit(always, require=None if restore else BASE_REPAIR) + prefill + [
        step("click", "Focus the Repair Type lookup (`#repairTypeId`)",
             {"element": xpath_el(STAGE_URL, '//*[@id="repairTypeId"]')}, timeout=30, **a),
        step("wait", "Wait for the repair type options", {"value": 2}, **a),
        jsassert(f"Pick {to} — the one VISIBLE option titled exactly \"{to}\"", pick_visible_option_js(to),
                 timeout=20, **a),
        jsassert(f"The form now holds Repair Type {to}", held("repairTypeId", to), timeout=20, **a),
        jsassert(f"Failure Type and Root Cause are still {FAILURE_TYPE} / {ROOT_CAUSE} (no cascade cleared them)",
                 "const v = id => { const el = document.getElementById(id); return el ? (el.value || '').trim() : null; };\n"
                 f"return v('failureTypeId') === '{FAILURE_TYPE}' && v('rootCauseTypeId') === '{ROOT_CAUSE}';",
                 timeout=20, **a),
        jsassert(f"Submit is ARMED — `button[form=\"{FORM}\"]` is `type=\"submit\"` (trap 8)",
                 f"const b = document.querySelector('button[form=\"{FORM}\"]');\nreturn !!b && b.type === 'submit';",
                 timeout=30, **a),
        step("click", "Submit the edit", {"element": xpath_el(STAGE_URL, SUBMIT)}, timeout=30, **a),
        step("wait", "Let the update reach the server", {"value": 3}, **a),
    ]


steps = open_fixture("premise") + [
    jsassert(f"PREMISE: exactly one `{ASSET} · {FAILURE_TYPE} · {BASE_REPAIR} · {ROOT_CAUSE}` card on screen",
             CARD_JS + f"return orig.length === 1 && orig[0].row['Repair Type'] === '{BASE_REPAIR}';",
             timeout=30, soft=True),
] + server_assert(f"PREMISE (server): the fixture's one failure is {FAILURE_TYPE} · {BASE_REPAIR} · {ROOT_CAUSE} "
                  "— the fixed restore value",
                  "__dd385_server", FAIL_Q, {"id": FIXTURE_ID}, server_repair_is(BASE_REPAIR), soft=True) \
  + edit_repair(EDIT_REPAIR) \
  + server_assert(f"⭐ SERVER: the FIRST `Edit Item` after the page loads SAVED — the same failure now holds "
                  f"Repair Type {EDIT_REPAIR} (bugs §42: red until fixed; the modal proves nothing here)",
                  "__dd385_server", FAIL_Q, {"id": FIXTURE_ID}, server_repair_is(EDIT_REPAIR), soft=True) \
  + open_fixture("restore", always=True) \
  + prime_schema(always=True) \
  + edit_repair(BASE_REPAIR, always=True, restore=True) \
  + server_assert(f"⭐ RESTORED (server): the failure is back to {FAILURE_TYPE} · {BASE_REPAIR} · {ROOT_CAUSE}",
                  "__dd385_server", FAIL_Q, {"id": FIXTURE_ID}, server_repair_is(BASE_REPAIR), always=True)

write(test(
    "MOB.385_Work_Failure_Edit_Save",
    "`MOB.385` **A failure's `Edit Item` saves — proved on the server, then restored.**\n"
    f"- The fixture's permanent failure (`{ASSET} · {FAILURE_TYPE} · {BASE_REPAIR} · {ROOT_CAUSE}`): the form\n"
    f"  opens prefilled, Repair Type **{BASE_REPAIR} → {EDIT_REPAIR}** on the FIRST `Edit Item` after the page\n"
    "  loads (`UPDATE_WORKSTAGE_FAILURE`), proved by a `/graphql` read of that failure id, then\n"
    f"  **{EDIT_REPAIR} → {BASE_REPAIR}** and proved again (`always`).\n"
    f"- {EDIT_REPAIR}, not ADJUST: `MOB.391` owns the ADJUST key (bugs §40's unique key).\n"
    "- 🛑 **Red whenever bugs §42's race is lost:** that first Submit does nothing (the form's schema is\n"
    "  built before `GET_SCHEMA` loads). The save proof is soft, so the restore still runs.\n"
    "- The restore opens and closes `Edit Item` once first, so it saves with §42 open or fixed.\n"
    "- 🛑 SELF-RESTORING — one field, restored to a fixed value.",
    steps,
    ["Mobile", "env:dev", "Work Order", "Failures", "Edit", "self-restoring"],
))
print("wrote MOB.385 (failure Edit Item save)")
