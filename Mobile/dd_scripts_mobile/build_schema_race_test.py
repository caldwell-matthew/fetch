"""Build MOB.977_DIAG_Condition_Form_Schema_Race - the one test that REPRODUCES bugs §42.

🛑 THIS TEST ASSERTS A BUG. RED HERE IS GOOD NEWS - READ THIS BEFORE DEBUGGING IT.
  It passes while §42 is open and goes RED when the first Submit starts working. If it fails at
  `⭐ §42 REPRODUCED`, check `Conditions/Form.tsx` / `components/utils/hooks/index.ts` before
  touching this file: if `withDynamicSchema` is being passed now, or the form body waits for
  `GET_SCHEMA`, then §42 is FIXED - delete this test, delete the bug, and drop the `soft`
  sentinels from MOB.385/386/390/391.

WHAT §42 IS
  `ConditionForm` passes `schemaData?._info?.fields ?? []` to `useCustomForm` while
  `GET_SCHEMA('WorkStageCondition')` is still loading. `useFormWithValidation` builds its zod
  schema in a `useMemo` whose deps are `[undefined]` without `withDynamicSchema`, so the schema
  is built ONCE, from `[]`, and never rebuilt when the fields arrive. An empty zod object is
  always valid (Submit arms) and strips every key, so the submit handler receives `{}` and its
  `if (!values.assetId || ...) return;` exits. No request, no error, the modal stays open.

WHY NO OTHER TEST SEES IT
  `/work`'s prefetch loads `WorkStageCondition` and `WorkStageFailure` among its schemas
  (`prefetchData.ts:26-36`). MOB.385/386/390/391 keep `soft` sentinels for it, but they run
  inside MOB.956/957, whose earlier children wait on `work_list_gate` - so by the time those
  forms open, the schema is already cached and they pass with the bug standing. The race needs
  the form to open BEFORE that prefetch: a deep link, or leaving `/work` early.

  ⭐ SO THE WHOLE TEST IS THE ABSENCE OF ONE STEP. It goes straight to `/work/<id>` and never
  visits `/work`. Do not "fix" it by adding a warm-up - that deletes the only thing it tests.

THE PROOF IS A /graphql READ, NOT THE MODAL
  The modal staying open is consistent with §42 AND with a dozen other failures. What separates
  them is that the server never heard anything: the condition still holds its resting score
  after a Submit the UI armed and accepted. Both are asserted, in that order.

THE CONTRAST LEG IS WHAT MAKES IT A RACE REPORT RATHER THAN "THE FORM IS BROKEN"
  After the dead Submit it closes the form, reopens it - `GET_SCHEMA` is cached now - and
  submits the same value, which saves. A form that never saved would fail there, and that is a
  different bug from §42.

⚠️ IT IS A RACE, SO IT CAN FLAKE THE OTHER WAY. Datadog measured the add path failing 2 of 3
and 3 of 3 runs, the edit path 8 of 8 locally and 1 of 1 on Datadog (bugs §42). A run where the
schema arrives in time reads exactly like a fix. That is why this is NOT in a scheduled suite -
it is run deliberately, and a single red run means "read the source", not "the bug is fixed".

FIXTURE: the fixture work order's one permanent condition - `Pump 0102 · Structural ·
Mounting/Support`, Condition Left 2 at rest (`preflight.py mob39x` guards it). Only a score
changes, so the unique key [workStage, asset, group, element] is untouched (bugs §40).
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
    """The ONE VISIBLE ListFilter option titled exactly `pick`."""
    return ("const vis = [...document.querySelectorAll('[role=\"option\"]')].filter(o => {\n"
            "  const t = o.querySelector('[class*=\"option-title\"]');\n"
            f"  return t && (t.textContent || '').trim() === '{pick}' && o.offsetParent !== null;\n"
            "});\n"
            "if (vis.length !== 1) return false;\n"
            "vis[0].click();\nreturn true;")


def open_fixture(label, always=False):
    """🛑 A DEEP LINK, AND NEVER `/work` FIRST — that omission IS the test (bugs §42)."""
    a = dict(always=always)
    return [
        (step("goToUrl", f"Navigate STRAIGHT to the fixture work order ({label}) — never via `/work`, "
              "whose prefetch would load the schema this test is racing", {"value": STAGE_URL}, always=True)
         if always else
         go(STAGE_URL, f"the fixture work order ({label}) — a DEEP LINK: `/work` is never visited, so "
            "its schema prefetch never runs")),
        step("wait", "Let the detail view begin rendering", {"value": 2}, **a),
        step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}, timeout=30, **a),
        step("click", "Open the Condition tab", {"element": xpath_el(STAGE_URL, tab("Condition"))},
             timeout=30, **a),
        step("wait", "Let the condition cards render", {"value": 2}, **a),
    ]


def open_edit(label, always=False):
    a = dict(always=always)
    return [
        jsassert(f"Open the `Pump 0102 · {ELEMENT}` card's gear ({label})",
                 CARD_JS + "if (orig.length !== 1) return false;\n"
                 "const g = orig[0].querySelector('[aria-label=\"Menu\"]');\n"
                 "if (!g) return false;\ng.click();\nreturn true;", timeout=30, **a),
        step("wait", "Let the menu open", {"value": 1}, **a),
        step("click", f"Click `Edit Item` ({label})", {"element": xpath_el(STAGE_URL, EDIT_ITEM)},
             timeout=30, **a),
        step("wait", "Let the edit form mount (it asks for the WorkStageCondition schema)", {"value": 3}, **a),
        step("assertElementPresent", f"The condition form opened ({label})",
             {"element": xpath_el(STAGE_URL, f'//form[@id="{FORM}"]')}, timeout=30, **a),
    ]


def pick_and_submit(to, label, always=False, armed_optional=False):
    a = dict(always=always)
    return [
        step("click", "Focus the Condition Left lookup (`#conditionScore`)",
             {"element": xpath_el(STAGE_URL, '//*[@id="conditionScore"]')}, timeout=30, **a),
        step("wait", "Wait for the score options", {"value": 2}, **a),
        jsassert(f"Pick {to} — the one VISIBLE option titled exactly \"{to}\"",
                 pick_visible_option_js(str(to)), timeout=20, **a),
        jsassert(f"The form now holds Condition Left {to} ({label})",
                 "const el = document.getElementById('conditionScore');\n"
                 f"return !!el && (el.value || '').trim() === '{to}';", timeout=20, **a),
        # ⭐ The empty schema is ALWAYS valid, so Submit arms exactly as it would with a real one.
        # That is the cruel part of §42 and it is asserted, not assumed: the user is looking at an
        # armed button.
        jsassert(f"Submit is ARMED ({label}) — `button[form=\"{FORM}\"]` is `type=\"submit\"`; with §42 "
                 "the EMPTY zod schema is what makes it valid",
                 f"const b = document.querySelector('button[form=\"{FORM}\"]');\n"
                 "return !!b && b.type === 'submit';",
                 timeout=15 if armed_optional else 30, optional=armed_optional, **a),
        step("click", f"Submit ({label})", {"element": xpath_el(STAGE_URL, SUBMIT)}, timeout=30, **a),
        step("wait", "Let anything the form sent reach the server", {"value": 4}, **a),
    ]


steps = open_fixture("cold") + [
    jsassert(f"PREMISE: exactly one `Pump 0102 · {ELEMENT}` card on screen",
             CARD_JS + "return orig.length === 1;", timeout=30),
] + server_assert(
    f"PREMISE (server): the {ELEMENT} condition holds Condition Left {BASE_SCORE}",
    "__dd977_cond", COND_Q, {"id": FIXTURE_ID}, server_score_is(BASE_SCORE)) + open_edit(
    "FIRST open — the schema is still in flight") + pick_and_submit(EDIT_SCORE, "first open") + [

    # ---- the signature, in the order that separates §42 from everything else ----------------
    jsassert("⭐ §42 REPRODUCED (1/2): the modal is STILL OPEN after an armed Submit — "
             "`handleSubmit` got `{}` from the empty schema's resolver and the `!values.assetId` "
             "guard returned. 🛑 RED HERE MEANS §42 IS FIXED (or the race went the other way) — "
             "read this test's docstring before debugging",
             f"return !!document.getElementById('{FORM}');", timeout=20),
] + server_assert(
    f"⭐ §42 REPRODUCED (2/2): the server never heard it — the condition still holds "
    f"{BASE_SCORE}, not the {EDIT_SCORE} the form was showing. 🛑 RED HERE MEANS §42 IS FIXED",
    "__dd977_cond", COND_Q, {"id": FIXTURE_ID}, server_score_is(BASE_SCORE)) + [

    # ---- the contrast: the SAME form, reopened once the schema is cached, saves -------------
    step("click", "Close the dead form — `GET_SCHEMA` has resolved by now, so the next one builds "
         "the full schema", {"element": xpath_el(STAGE_URL, MODAL_CLOSE)}, timeout=30),
    jsassert("The condition form is closed", f"return !document.getElementById('{FORM}');", timeout=20),
] + open_edit("SECOND open — the schema is cached") + pick_and_submit(
    EDIT_SCORE, "second open") + [
    jsassert("The modal CLOSED this time — the same form, the same value, a real schema",
             f"return !document.getElementById('{FORM}');", timeout=20),
] + server_assert(
    f"⭐ CONTRAST: the SECOND open saved — the server holds {EDIT_SCORE}. The form is not broken; "
    "only its first mount after a page load is",
    "__dd977_cond", COND_Q, {"id": FIXTURE_ID}, server_score_is(EDIT_SCORE)) + [

    # ---- restore, `always` -------------------------------------------------------------------
] + open_fixture("restore", always=True) + open_edit(
    "restore — the schema is cached, so this one saves", always=True) + pick_and_submit(
    BASE_SCORE, "restore", always=True, armed_optional=True) + server_assert(
    f"⭐ RESTORED (server): Condition Left is back to {BASE_SCORE}",
    "__dd977_cond", COND_Q, {"id": FIXTURE_ID}, server_score_is(BASE_SCORE), always=True)

write(test(
    "MOB.977_DIAG_Condition_Form_Schema_Race",
    "`MOB.977` **The only test that reproduces bugs §42** — a condition form's first Submit after a "
    "page load does nothing.\n"
    "- 🛑 **It asserts a BUG: red means the bug is gone.** If `⭐ §42 REPRODUCED` fails, read "
    "`Conditions/Form.tsx` and `components/utils/hooks/index.ts` — if the schema is passed with "
    "`withDynamicSchema` now, §42 is fixed: delete this test and the bug, and drop the `soft` "
    "sentinels in MOB.385/386/390/391.\n"
    "- ⭐ **The test is the absence of a step.** It deep-links `/work/<id>` and never visits "
    "`/work`, whose prefetch loads `WorkStageCondition`. Adding a warm-up here deletes the "
    "only thing it tests.\n"
    "- The proof is a `/graphql` read — an armed Submit, an open modal, and a server that still "
    "holds the resting score. Then the SAME form, reopened with the schema cached, saves: that "
    "contrast is what makes it §42 rather than a broken form.\n"
    "- ⚠️ **It is a race** (bugs §42: the add path failed 2 of 3 and 3 of 3 on Datadog). One red run "
    "means read the source, not that the bug is fixed.\n"
    "- 🛑 Not in any scheduled suite, deliberately. Self-restoring (`always`); "
    "`preflight.py mob39x` guards the resting score.",
    steps,
    ["Mobile", "env:dev", "Work Orders", "diagnostic", "self-restoring"],
))

print("wrote MOB.977 (the bugs §42 repro)")
