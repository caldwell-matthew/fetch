"""Build MOB.386_Work_Condition_Edit_Save - `Edit Item` SAVES, proved on the server, then restored.

WHAT THE SOURCE SAYS (origin/development)
  A condition card's gear -> `Edit Item` opens `ConditionForm` filled from the card (MOB.387 proves the
  prefill). Submitting calls `updateCollectionRecord` (`WorkOrders/utils/updateCollectionRecord.ts`):
  an `optimisticResponse`, and `done()` - which closes the modal - inside `update()`. Apollo runs that
  first on the OPTIMISTIC result, so the modal closes whether or not the server accepts (bugs §40's
  shape, on the edit path).

⭐ THE PROOF IS A /graphql READ (`dd_tools.server_assert`) - not the modal, not a reload
  premise   the server holds the fixture condition at Condition Left **2**   (the fixed restore value)
  edit      Condition Left 2 -> **4** on the FIRST `Edit Item` after the page loads -> the server holds **4**
  restore   `Edit Item` again, 4 -> **2**, `always` -> the server holds **2**, `always`

🛑 RED UNTIL bugs §42 IS FIXED - the owner's call: assert the user's real path, the first open. A
`ConditionForm` mounted before `GET_SCHEMA('WorkStageCondition')` is cached builds an EMPTY zod schema,
once (`useFormWithValidation`'s `useMemo` deps are `[undefined]` without `withDynamicSchema`); the
resolver strips every value and the submit handler's `!values.assetId` guard returns - no request, the
modal stays open. The save proof is `soft`: MOB.386 goes red but still restores, and a suite parent's
later children still run (the MOB.346 lesson, `dd_tools.step`).

THE RESTORE WORKS WITH §42 OPEN OR FIXED. It opens and closes `Edit Item` once first, so `GET_SCHEMA` is
cached and the restore form gets the full schema. If the edit never saved, the form is not dirty at 2,
so its ARMED gate is `optional`; the hard RESTORED server read (Condition Left 2) is the proof.

FIXTURE: the fixture work order's one permanent condition - `Pump 0102 · Structural ·
Mounting/Support`, found 1 / Condition Left 2 / stress 3 (read over the API). `Mounting/Support`'s
condition scores are 1..5, so 4 is valid. The unique key [workStage, asset, group, element] is not
touched - only a score changes - so no duplicate refusal is possible (bugs §40).

⚠️ ARMED BEFORE EVERY SUBMIT. `SubmitButton` is `type={isValid && isDirty ? 'submit' : 'button'}` here;
MOB.390's Datadog run 1 clicked it while it was still the inert `type="button"` (trap 8). The click waits
for `button[form="work-condition-form"]` to be `type="submit"`.

🛑 SELF-RESTORING. Every restore step is `alwaysExecute`; if a run dies mid-way the card reads 4, the
next run's PREMISE goes red, and its restore (or `preflight.py` / the API) puts it back.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert, server_assert  # noqa: E402

FIXTURE_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
STAGE_URL = f"{BASE}/work/{FIXTURE_ID}"
ELEMENT = "Mounting/Support"
BASE_SCORE, EDIT_SCORE = 2, 4
FORM = "work-condition-form"
EDIT_ITEM = ('(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")]'
             '[normalize-space(.)="Edit Item"])[1]')
MODAL_CLOSE = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
               '//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]')
SUBMIT = f'//button[@form="{FORM}"]'
COND_Q = ("query($id: ID!) { workStage(id: $id) { condition { conditionScore "
          "inspectionElementId { name } } } }")


def tab(label):
    return f'//*[@role="tab"][contains(normalize-space(.), "{label}")]'


def server_score_is(score):
    return (f"data.workStage.condition.filter(c => c.inspectionElementId && c.inspectionElementId.name === "
            f"'{ELEMENT}').length === 1 && data.workStage.condition.find(c => c.inspectionElementId && "
            f"c.inspectionElementId.name === '{ELEMENT}').conditionScore === {score}")


NORM = "const norm = t => (t || '').replace(/\\s+/g, ' ').trim();\n"
# The card: an inner Paper whose toggle button reads the element, under a Paper naming the asset.
CARD_JS = (NORM +
           "const cards = [...new Set([...document.querySelectorAll('li')]\n"
           "  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)\n"
           "  .map(li => li.closest('[class*=\"mantine-Paper-root\"]')))].filter(Boolean);\n"
           "const orig = cards.filter(c => {\n"
           "  const grp = c.parentElement && c.parentElement.closest('[class*=\"mantine-Paper-root\"]');\n"
           "  const a = grp && grp.querySelector('[class*=\"mantine-Text-root\"]');\n"
           "  const b = c.querySelector('button');\n"
           f"  return a && norm(a.textContent) === 'Pump 0102' && b && norm(b.textContent) === '{ELEMENT}';\n"
           "});\n")


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
        step("click", "Open the Condition tab", {"element": xpath_el(STAGE_URL, tab("Condition"))}, timeout=30, **a),
        step("wait", "Let the condition cards render", {"value": 2}, **a),
    ]


def open_edit(always=False):
    a = dict(always=always)
    return [
        jsassert(f"Open the `Pump 0102 · {ELEMENT}` card's gear",
                 CARD_JS + "if (orig.length !== 1) return false;\n"
                 "const g = orig[0].querySelector('[aria-label=\"Menu\"]');\n"
                 "if (!g) return false;\ng.click();\nreturn true;", timeout=30, **a),
        step("wait", "Let the menu open", {"value": 1}, **a),
        step("click", "Click `Edit Item`", {"element": xpath_el(STAGE_URL, EDIT_ITEM)}, timeout=30, **a),
        step("wait", "Let the edit form mount (it loads the WorkStageCondition schema)", {"value": 3}, **a),
        step("assertElementPresent", "The condition form opened",
             {"element": xpath_el(STAGE_URL, f'//form[@id="{FORM}"]')}, timeout=30, **a),
    ]


def prime_schema(always=False):
    """Open `Edit Item` and close it unsaved, so `GET_SCHEMA` is cached before the form that saves (bugs §42)."""
    a = dict(always=always)
    return open_edit(always) + [
        step("click", "Close it unsaved — `GET_SCHEMA` is now cached, so the NEXT form builds the full "
             "schema (bugs §42)", {"element": xpath_el(STAGE_URL, MODAL_CLOSE)}, timeout=30, **a),
        jsassert("The condition form is closed", f"return !document.getElementById('{FORM}');", timeout=20, **a),
    ]


def edit_score(to, always=False, restore=False):
    a = dict(always=always)
    armed = f"Submit is ARMED — `button[form=\"{FORM}\"]` is `type=\"submit\"` (valid AND dirty; trap 8)"
    if restore:
        armed += " — optional: the form is not dirty when the edit never saved"
    return open_edit(always) + [
        step("click", "Focus the Condition Left lookup (`#conditionScore`)",
             {"element": xpath_el(STAGE_URL, '//*[@id="conditionScore"]')}, timeout=30, **a),
        step("wait", "Wait for the score options", {"value": 2}, **a),
        jsassert(f"Pick {to} — the one VISIBLE option titled exactly \"{to}\"", pick_visible_option_js(str(to)),
                 timeout=20, **a),
        jsassert(f"The form now holds Condition Left {to}",
                 f"const el = document.getElementById('conditionScore');\nreturn !!el && (el.value || '').trim() === '{to}';",
                 timeout=20, **a),
        jsassert(armed, f"const b = document.querySelector('button[form=\"{FORM}\"]');\nreturn !!b && b.type === 'submit';",
                 timeout=15 if restore else 30, optional=restore, **a),
        step("click", "Submit the edit", {"element": xpath_el(STAGE_URL, SUBMIT)}, timeout=30, **a),
        step("wait", "Let the update reach the server", {"value": 3}, **a),
    ]


steps = open_fixture("premise") + [
    jsassert(f"PREMISE: exactly one `Pump 0102 · {ELEMENT}` card on screen", CARD_JS + "return orig.length === 1;",
             timeout=30, soft=True),
] + server_assert(f"PREMISE (server): the {ELEMENT} condition holds Condition Left {BASE_SCORE} — the fixed restore value",
                  "__dd386_server", COND_Q, {"id": FIXTURE_ID}, server_score_is(BASE_SCORE), soft=True) \
  + edit_score(EDIT_SCORE) \
  + server_assert(f"⭐ SERVER: the FIRST `Edit Item` after the page loads SAVED — Condition Left is {EDIT_SCORE} "
                  "(bugs §42: red until fixed; the modal proves nothing here)",
                  "__dd386_server", COND_Q, {"id": FIXTURE_ID}, server_score_is(EDIT_SCORE), soft=True) \
  + open_fixture("restore", always=True) \
  + prime_schema(always=True) \
  + edit_score(BASE_SCORE, always=True, restore=True) \
  + server_assert(f"⭐ RESTORED (server): Condition Left is back to {BASE_SCORE}",
                  "__dd386_server", COND_Q, {"id": FIXTURE_ID}, server_score_is(BASE_SCORE), always=True)

write(test(
    "MOB.386_Work_Condition_Edit_Save",
    "`MOB.386` **`Edit Item` saves — proved on the server, then restored.**\n"
    f"- The fixture's permanent condition (`Pump 0102 · Structural · {ELEMENT}`): Condition Left\n"
    f"  **{BASE_SCORE} → {EDIT_SCORE}** on the FIRST `Edit Item` after the page loads (`updateCollectionRecord`),\n"
    f"  proved by a `/graphql` read, then **{EDIT_SCORE} → {BASE_SCORE}** and proved again (`always`).\n"
    "- 🛑 **Red until bugs §42 is fixed:** that first Submit does nothing (the form's schema is built\n"
    "  before `GET_SCHEMA` loads). The save proof is soft, so the restore still runs.\n"
    "- The restore opens and closes `Edit Item` once first, so it saves with §42 open or fixed.\n"
    "- Submit waits until `SubmitButton` is armed (`type=\"submit\"`, trap 8).\n"
    "- 🛑 SELF-RESTORING — only a score changes; the unique key is untouched.",
    steps,
    ["Mobile", "env:dev", "Work Order", "Condition", "Edit", "self-restoring"],
))
print("wrote MOB.386 (condition Edit Item save)")
