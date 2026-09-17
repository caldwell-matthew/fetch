"""Build MOB.134_Work_Form_Fill - a work form's field SAVES, proved on the server, then restored.

WHY THE ARCHIVED TEST NEVER PASSED, AND WHY THIS ONE CAN
  The archived `MOB.134` (`dd_tests_mobile/_archive/`) typed `DD FORM EDIT` into its locator's field -
  the fixture form's INTEGER field, a Mantine `NumberInput` (`FormField/index.tsx:230-252`) that
  discards non-numeric keys. Nothing ever landed. A local probe: typed DIGITS land - the input and
  react-hook-form hold them, the focused input is never remounted, and a blur sends
  `UPDATE_WORKSTAGE_FORM_DETAIL`.

WHAT THE SOURCE SAYS (origin/development)
  `FormDetails.tsx:113` renders the desktop `Form` on `chrome.tablet` (`screen.availWidth >= 750`, read
  once). `Form.tsx:148-161`: the `<form>`'s onBlur saves the blurred field when it is dirty and valid ->
  `FormDetails.onBlur` -> `UPDATE_WORKSTAGE_FORM_DETAIL` (no optimisticResponse; the `Field updated`
  toast fires inside `update()`).

THE TARGET, WITHOUT NAMING A FIELD
  Work forms are configurable, and every numeric type renders the same `NumberInput`
  (`inputMode="decimal"`), so markup cannot tell integer from float or money. The GUARD takes the FIRST
  visible `mantine-NumberInput-input` in `#apm-dv-tabpanel` and reads the server: its id must be this
  form's `WorkStageFormDetail` of type `integer`, empty (or holding this test's own `134`). Only then does
  it tag the input `data-dd134="target"` and store its id. Every typing step - the `always` restore
  included - targets that tag, so a changed form types into nothing and clears nothing.

⭐ THE PROOF IS A /graphql READ (`dd_tools.server_assert`) of `workStage.forms[].fields[]`, the form
  picked from the URL
  guard    the first number input is the empty integer field          (soft - trap 25)
  write    type `134`, Tab out -> the server holds 134
  restore  (`always`) clear the input through the native value setter + an `input` event (Datadog's
           `Delete` key left `134` in place, twice, 2026-09-14), Tab out -> the server holds no value
           (a probe measured the cleared field saving `value: null`)
  net      (`always`, after that proof) write the field back to empty over same-origin /graphql, then a
           final read proves it at rest - the fixture ends clean even when the UI clear fails, and the
           UI check above still goes red

SELF-RESTORING. A run that dies between write and restore leaves `134`; the next run's guard accepts it
and its restore clears it.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write,  # noqa: E402
                      jsassert, server_assert, work_cache_warm)

WORK_URL = BASE + "/work"
WORK_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
WORK_DETAIL = f"{WORK_URL}/{WORK_ID}"
MARK = "134"
TAG = "dd134"
FIELD_KEY = "__dd134_field"

CONTAINER = '//*[@id="apm-dv-tabpanel"]'
PANEL = '//*[@role="tabpanel"][not(contains(@style, "display: none"))]'
PAPER = '*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")]'
TITLE = '*[contains(concat(" ", normalize-space(@class), " "), " mantine-Title-root ")]'
FIRST_FORM_CARD = f'({PANEL}//{PAPER}[.//{TITLE}])[1]'
TARGET = f'//input[@data-{TAG}="target"]'

FORMS_Q = ("query($id: ID!) { workStage(id: $id) { forms { id fields { __typename "
           "... on WorkStageFormDetail { id value attributeTypeId { type } } } } } }")

# The form on screen (from the URL) and the stored field - shared by every predicate.
FIELD_OF = ("(() => { const formId = (location.pathname.match(/\\/form\\/([^/?#]+)/) || [])[1];\n"
            "  const form = ((data.workStage && data.workStage.forms) || []).find(f => f && f.id === formId);\n"
            f"  const id = sessionStorage.getItem('{FIELD_KEY}');\n"
            "  return form && id ? (form.fields || []).find(x => x && x.id === id) : null; })()")
EMPTY = "(v => v === null || v === undefined || v === '')"

GUARD = ("(() => {\n"
         "  const formId = (location.pathname.match(/\\/form\\/([^/?#]+)/) || [])[1];\n"
         "  const form = ((data.workStage && data.workStage.forms) || []).find(f => f && f.id === formId);\n"
         "  const el = [...document.querySelectorAll('#apm-dv-tabpanel input.mantine-NumberInput-input')]"
         ".find(e => e.offsetParent !== null);\n"
         "  if (!form || !el || !el.id) return false;\n"
         "  const f = (form.fields || []).find(x => x && x.id === el.id);\n"
         "  if (!f || f.__typename !== 'WorkStageFormDetail' || !f.attributeTypeId || f.attributeTypeId.type !== 'integer') return false;\n"
         f"  if (!({EMPTY}(f.value) || String(f.value) === '{MARK}')) return false;\n"
         f"  el.setAttribute('data-{TAG}', 'target');\n"
         f"  sessionStorage.setItem('{FIELD_KEY}', el.id);\n"
         "  return true;\n"
         "})()")
HOLDS_MARK = f"(f => !!f && String(f.value) === '{MARK}')({FIELD_OF})"
# What React sees as a user's edit: the prototype's value setter (React's value tracker) and a bubbling
# `input` event. `window.`-qualified so the bench's jsdom runs the same body.
CLEAR_JS = (f"const el = document.querySelector('[data-{TAG}=\"target\"]');\n"
            "if (!el) return false;\n"
            "el.focus();\n"
            "Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');\n"
            "el.dispatchEvent(new window.Event('input', { bubbles: true }));\n"
            "return el.value === '';")
UPDATE_M = ("mutation($id: ID!, $data: UpdateWorkStageFormDetailInput!) { "
            "updateWorkStageFormDetail(id: $id, data: $data) { __typename } }")
SAFETY_NET_JS = (f"const id = sessionStorage.getItem('{FIELD_KEY}');\n"
                 "if (!id || sessionStorage.getItem('__dd134_net')) return true;   // nothing tagged, or already sent\n"
                 "sessionStorage.setItem('__dd134_net', '1');\n"
                 "window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',\n"
                 "  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },\n"
                 f"  body: JSON.stringify({{ query: '{UPDATE_M}', variables: {{ id, data: {{ value: null }} }} }}) }});\n"
                 "return true;")
IS_EMPTY = f"(f => !!f && {EMPTY}(f.value))({FIELD_OF})"


def type_and_blur(label, keys, value_check, always=False):
    a = dict(always=always)
    return [
        step("click", f"Focus the tagged integer field ({label})", {"element": xpath_el(WORK_DETAIL, TARGET)},
             timeout=30, **a),
        step("pressKey", "Select any existing value (typeText APPENDS — trap 17)",
             {"value": "a", "modifiers": ["Control"]}, **a),
        *keys,
        jsassert(f"The input holds {value_check!r} BEFORE the blur",
                 f"const el = document.querySelector('[data-{TAG}=\"target\"]');\n"
                 f"return !!el && el.value === '{value_check}';", timeout=15, **a),
        step("pressKey", "Tab out — the form saves the field on BLUR (`Form.tsx:148`)", {"value": "Tab"}, **a),
        step("wait", "Let the update reach the server", {"value": 3}, **a),
    ]


steps = (
    work_cache_warm()
    + [
        go(WORK_DETAIL, "the fixture work order"),
        step("wait", "Let the detail view begin rendering", {"value": 3}),
        step("assertElementPresent", "GATE: the detail data arrived (tab strip)",
             {"element": xpath_el(WORK_DETAIL, '(//*[@role="tab"])[1]')}, timeout=60),
        step("click", "Open the Forms tab",
             {"element": xpath_el(WORK_DETAIL, '//*[@role="tab"][contains(normalize-space(.), "Form")]')},
             timeout=30),
        step("wait", "Wait for the forms list", {"value": 3}),
        step("assertElementPresent", "FIXTURE GUARD: the work order has at least one form card",
             {"element": xpath_el(WORK_DETAIL, FIRST_FORM_CARD)}, timeout=60, soft=True),
        step("click", "Open the first form card", {"element": xpath_el(WORK_DETAIL, FIRST_FORM_CARD)}, timeout=60),
        step("wait", "Let the form page render", {"value": 4}),
        jsassert("ROUTE: we are on /work/<id>/form/<id>",
                 "return /\\/work\\/[^/]+\\/form\\/[^/]+$/.test(location.pathname);", timeout=60),
        step("assertElementPresent", "The desktop form container mounted",
             {"element": xpath_el(WORK_DETAIL, CONTAINER)}, timeout=60),
    ]
    + server_assert("🛑 FIELD GUARD (server): the first number input is this form's INTEGER field, empty (or "
                    f"holding this test's {MARK}) — tags it `data-{TAG}`; nothing types without the tag",
                    "__dd134_server", FORMS_Q, {"id": WORK_ID}, GUARD, soft=True)
    + type_and_blur("write", [
        step("typeText", f"Type {MARK} — digits (a `NumberInput` drops letters: the archived test's blocker)",
             {"value": MARK, "element": xpath_el(WORK_DETAIL, TARGET)}),
    ], MARK)
    + server_assert(f"⭐ SERVER: the field holds {MARK} — asked over /graphql",
                    "__dd134_server", FORMS_Q, {"id": WORK_ID}, HOLDS_MARK)
    + [
        # 🛑 RE-TAG BEFORE THE RESTORE. The blur save re-renders the form and REPLACES the input, so the tag
        # the guard set is gone: on Datadog 2026-09-16 the restore's click found no `data-dd134` twice and
        # only the API safety net put the fixture back. Re-find the SAME field by the id the guard stored -
        # not "the first input" again - and tag it; a changed form still tags nothing.
        jsassert(f"RE-TAG (restore): the stored field's input gets `data-{TAG}` again — the save re-rendered it",
                 f"const id = sessionStorage.getItem('{FIELD_KEY}');\n"
                 "const el = id ? document.getElementById(id) : null;\n"
                 "if (!el || el.offsetParent === null) return false;\n"
                 f"el.setAttribute('data-{TAG}', 'target');\n"
                 "return true;", timeout=30, always=True),
        step("click", "Focus the tagged integer field (restore)", {"element": xpath_el(WORK_DETAIL, TARGET)},
             timeout=30, always=True),
        jsassert("Clear it as React sees a user's edit — the native value setter and an `input` event (Datadog's "
                 "`Delete` key left `134` in place)", CLEAR_JS, timeout=15, always=True),
        jsassert("The input holds '' BEFORE the blur",
                 f"const el = document.querySelector('[data-{TAG}=\"target\"]');\nreturn !!el && el.value === '';",
                 timeout=15, always=True),
        step("pressKey", "Tab out — the form saves the field on BLUR (`Form.tsx:148`)", {"value": "Tab"}, always=True),
        step("wait", "Let the update reach the server", {"value": 3}, always=True),
    ]
    + server_assert("⭐ RESTORED (server): the field holds no value again — saved by the UI clear",
                    "__dd134_server", FORMS_Q, {"id": WORK_ID}, IS_EMPTY, always=True)
    + [
        jsassert("SAFETY NET (always): write the tagged field back to empty over /graphql — a no-op when the UI "
                 "restore above saved", SAFETY_NET_JS, timeout=15, always=True),
        step("wait", "Let the safety-net write land", {"value": 3}, always=True),
    ]
    + server_assert("AT REST (server): the field is empty after the safety net",
                    "__dd134_server", FORMS_Q, {"id": WORK_ID}, IS_EMPTY, always=True)
    + [jsassert("Remove the tag's and the safety net's sessionStorage keys",
                f"['{FIELD_KEY}', '__dd134_net'].forEach(k => sessionStorage.removeItem(k));\nreturn true;",
                timeout=15, always=True)]
)

write(test(
    "MOB.134_Work_Form_Fill",
    "`MOB.134` **A work form's field saves — proved on the server, then restored.**\n"
    "- Opens the fixture work order's first form (`/work/:id/form/:formId`, the desktop `Form` on tablet).\n"
    f"- Types **{MARK}** into the form's integer field and tabs out — the form saves a dirty field on blur\n"
    "  (`UPDATE_WORKSTAGE_FORM_DETAIL`); a `/graphql` read proves it. Then clears it and proves it empty (`always`).\n"
    "- Names no field: a server-read guard confirms the first number input is an empty integer field and tags\n"
    "  it; every typing step targets the tag, so a changed form types into nothing.\n"
    "- The archived version typed letters into that `NumberInput`, which drops them — why it never passed.\n"
    "- 🛑 SELF-RESTORING: a UI clear proved on the server, then a /graphql safety net and a final read, so the\n"
    "  fixture ends empty even when the UI clear fails (which still turns the test red).",
    steps,
    ["Mobile", "env:dev", "Work Orders", "Forms", "CRUD", "self-restoring"],
))
print("wrote MOB.134 (work form field fill)")
