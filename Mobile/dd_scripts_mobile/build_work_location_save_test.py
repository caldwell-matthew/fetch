"""Build MOB.352_Work_Location_Save - `Edit Location` SAVES, proved over /graphql, restored to fixed values.

WHY THIS EXISTS
  `MOB.348` opens the globe menu's `LocationForm` and closes it; `MOB.911` opens it offline. Neither
  submits, so the one place mobile writes a work stage's `address`/`x`/`y` was never proved to write.
  The owner authorised the write on 2026-09-15 as a SELF-RESTORING test.

WHAT THE SOURCE SAYS (`WorkOrders/components/ui/MapLink/LocationForm.tsx:45-58`)
  `handleOnSubmit` sends `UPDATE_WORK_STAGE { id, data: { address, x, y } }` with NO
  `optimisticResponse`, and closes the modal only in the mutation's `update()`. So the modal closing
  is the server's answer (trap 6, first row) - but the proof is still a `/graphql` read, because a
  closed modal says nothing about WHICH values landed.
  `SubmitButton` is `isValid={formState.isValid || isSubmitting}` (no `isDirty`), so re-typing a value
  is still a submit - the armed gate below reads `type="submit"` anyway (trap 8).
  Server side, `updateWorkStageById` only branches on `status`/`phase`/`account`/`project`/downtime
  (`controllers/work/workStage/update/index.ts`): an address/x/y write touches nothing else but
  `updatedAt`/`updatedBy` and the activity log.

WHAT THE FORM IS, MEASURED (read-only probe, 2026-09-15)
  `#address` a Mantine TextInput, `#x`/`#y` Mantine NumberInputs, `SUBMIT` a `type="submit"` button
  INSIDE `<form id="locationform">`. The detail page behind it has its own `Submit`
  (`form="mobile-genInfo"`), so every locator here is scoped to `#locationform` (trap 3).
  Fields are cleared through the native value setter + an `input` event (trap 17 - a select-all +
  Delete did not clear a Mantine NumberInput on Datadog, MOB.134), then typed.

THE WRITE, AND WHY THESE VALUES
  rest    `230 North Alexander Street, New Orleans, LA 70119` · x -90.1025785 · y 29.9782827
          (read over the API 2026-09-15; the same point as `Pump 0102`'s lat/long)
  marker  `DD MOB.352 LOCATION SAVE` · x -90.0812 · y 29.9511 - a few km away, still New Orleans, so
          a run that dies between write and restore leaves the stage on the same map, not in the sea.
  Who reads the rest values: nothing asserts the work stage's own address/x/y. `MOB.348` asserts
  `View in Map` PRESENT only (`disabled={!x || !y}` is data-dependent), `MOB.911` opens the form, the
  proximity tests (`MOB.730/731`) and `MOB.735` read ASSET coordinates, not the stage's.

RESTORE - three legs, all `alwaysExecute`
  1. the UI: reopen the form, type the FIXED rest values, SUBMIT, prove them over /graphql;
  2. a backstop: ONE step reads the stage over /graphql and, only if it is not at rest, sends
     `updateWorkStage` with the fixed rest values (so a run that died with the modal open, or on a
     broken page, still leaves the fixture as found);
  3. the final server read: address/x/y at rest AND status `Ready`.
  A run whose UI restore fails is still RED (leg 1 is critical) even when the backstop repaired it.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write,  # noqa: E402
                      jsassert, server_assert, work_cache_warm)

FIXTURE_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
WO_URL = f"{BASE}/work/{FIXTURE_ID}"

REST_ADDRESS = "230 North Alexander Street, New Orleans, LA 70119"
REST_X, REST_Y = "-90.1025785", "29.9782827"
MARK_ADDRESS = "DD MOB.352 LOCATION SAVE"
MARK_X, MARK_Y = "-90.0812", "29.9511"

GLOBE = ('//button[.//*[@data-icon="globe"'
         ' or contains(concat(" ", normalize-space(@class), " "), " fa-globe ")]]')
EDIT_LOCATION = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")]'
                 '[normalize-space(.)="Edit Location"]')
FORM = '//form[@id="locationform"]'
SUBMIT = f'{FORM}//button[normalize-space(.)="SUBMIT"]'

LOC_Q = "query($id: ID!) { workStage(id: $id) { id status address x y } }"
UPDATE_M = ("mutation($id: ID!, $data: UpdateWorkStageInput!) { "
            "updateWorkStage(id: $id, data: $data) { id } }")


def at(address, x, y):
    """JS predicate over a `workStage` object `w`: the location equals these values."""
    return (f"(w => !!w && w.address === {address!r} && Math.abs(Number(w.x) - ({x})) < 1e-6"
            f" && Math.abs(Number(w.y) - ({y})) < 1e-6)")


AT_REST = at(REST_ADDRESS, REST_X, REST_Y)
AT_MARK = at(MARK_ADDRESS, MARK_X, MARK_Y)


def form_input(fid):
    return f'{FORM}//input[@id="{fid}"]'


def clear_js(fid):
    return ("const f = document.getElementById('locationform');\n"
            f"const el = f && f.querySelector('input#{fid}');\n"
            "if (!el) return false;\n"
            "el.focus();\n"
            "Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');\n"
            "el.dispatchEvent(new window.Event('input', { bubbles: true }));\n"
            "return el.value === '';")


def holds_js(address, x, y):
    return ("const f = document.getElementById('locationform');\n"
            "if (!f) return false;\n"
            "const v = id => { const el = f.querySelector('input#' + id); return el ? el.value : null; };\n"
            f"return v('address') === {address!r} && v('x') !== '' && Math.abs(Number(v('x')) - ({x})) < 1e-6\n"
            f"  && v('y') !== '' && Math.abs(Number(v('y')) - ({y})) < 1e-6;")


ARMED_JS = ("const b = document.querySelector('#locationform button[type=\"submit\"]');\n"
            "return !!b && (b.textContent || '').trim() === 'SUBMIT';")

CLOSED_JS = ("if (!document.querySelectorAll('[role=tab]').length) return false;\n"
             "return !document.getElementById('locationform');")

NET_KEY = "__dd352_net"
BACKSTOP_JS = (
    f"const K = '{NET_KEY}';\n"
    "const st = sessionStorage.getItem(K);\n"
    "if (st === 'done') return true;\n"
    "if (st === 'asking') return false;\n"
    "sessionStorage.setItem(K, 'asking');\n"
    "const post = body => window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',\n"
    "  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' }, body: JSON.stringify(body) });\n"
    f"post({{ query: {LOC_Q!r}, variables: {{ id: '{FIXTURE_ID}' }} }})\n"
    "  .then(r => r.json())\n"
    "  .then(j => {\n"
    "    const w = j && j.data && j.data.workStage;\n"
    f"    if ({AT_REST}(w)) {{ sessionStorage.setItem(K, 'done'); return; }}\n"
    f"    sessionStorage.setItem(K + ':sent', '1');\n"
    f"    return post({{ query: {UPDATE_M!r}, variables: {{ id: '{FIXTURE_ID}', data: {{ address: {REST_ADDRESS!r}, x: {REST_X}, y: {REST_Y} }} }} }})\n"
    "      .then(() => sessionStorage.setItem(K, 'done'));\n"
    "  })\n"
    "  .catch(() => sessionStorage.setItem(K, 'done'));\n"
    "return false;")


def open_form(label, always=False):
    a = dict(always=always)
    return [
        step("pressKey", "Escape any open menu or modal first", {"value": "Escape"}, **a),
        step("wait", "Let it close", {"value": 1}, **a),
        step("assertElementPresent", f"The globe control renders on the title ({label})",
             {"element": xpath_el(WO_URL, GLOBE)}, timeout=60, **a),
        step("click", f"Open the MapLink menu ({label})",
             {"element": xpath_el(WO_URL, f"({GLOBE})[1]")}, timeout=30, **a),
        step("assertElementPresent", 'The menu offers "Edit Location"',
             {"element": xpath_el(WO_URL, EDIT_LOCATION)}, timeout=30, **a),
        step("click", 'Open the location form via "Edit Location"',
             {"element": xpath_el(WO_URL, EDIT_LOCATION)}, timeout=30, **a),
        step("assertElementPresent", "The location form mounted",
             {"element": xpath_el(WO_URL, FORM)}, timeout=60, **a),
    ]


def fill_and_submit(label, address, x, y, always=False):
    a = dict(always=always)
    out = []
    for fid, value, name in (("address", address, "Address"), ("x", x, "X"), ("y", y, "Y")):
        out += [
            jsassert(f"Clear the form's {name} (native value setter + input event — trap 17)",
                     clear_js(fid), timeout=30, **a),
            step("typeText", f"Type {name}: {value}",
                 {"value": value, "element": xpath_el(WO_URL, form_input(fid))}, timeout=30, **a),
        ]
    return out + [
        jsassert(f"The form now holds the {label} values — address `{address}`, x {x}, y {y}",
                 holds_js(address, x, y), timeout=30, **a),
        jsassert('Submit is ARMED — `type="submit"` inside #locationform (trap 8)', ARMED_JS,
                 timeout=30, **a),
        step("click", f"SUBMIT the {label} location", {"element": xpath_el(WO_URL, SUBMIT)},
             timeout=30, **a),
        step("assertPageContains", "The `Work stage location has been updated` toast (optional: transient)",
             {"value": "Work stage location has been updated"}, optional=True, timeout=10, **a),
        jsassert("The location form is GONE and the page is still alive (the modal closes only once the "
                 "server answers — no optimistic response)", CLOSED_JS, timeout=45, **a),
    ]


steps = work_cache_warm() + [
    go(WO_URL, "the fixture work order"),
    step("wait", "Let the detail view begin rendering", {"value": 3}),
    step("assertElementPresent", "GATE 1/2: the /work/:id route mounted",
         {"element": xpath_el(WO_URL, '//*[@id="page-title"]//h4')}, timeout=60),
    step("assertElementPresent", "GATE 2/2: the detail data arrived (tab strip)",
         {"element": xpath_el(WO_URL, '(//*[@role="tab"])[1]')}, timeout=60),
] + server_assert(
    "PREMISE (server): the stage's address/x/y are the fixed rest values, status `Ready`",
    "__dd352_loc", LOC_Q, {"id": FIXTURE_ID},
    f"data.workStage.status === 'Ready' && {AT_REST}(data.workStage)") + open_form("the write") + [
    jsassert("The form is PREFILLED with the rest values (defaultValues from the work stage)",
             holds_js(REST_ADDRESS, REST_X, REST_Y), timeout=30),
] + fill_and_submit("marker", MARK_ADDRESS, MARK_X, MARK_Y) + server_assert(
    f"⭐ SERVER: the stage now holds `{MARK_ADDRESS}` · x {MARK_X} · y {MARK_Y} — asked over /graphql",
    "__dd352_loc", LOC_Q, {"id": FIXTURE_ID}, f"{AT_MARK}(data.workStage)") + [

    # ---- restore: the UI, with the FIXED rest values --------------------------------------------
] + open_form("the restore", always=True) + fill_and_submit("rest", REST_ADDRESS, REST_X, REST_Y, always=True) + server_assert(
    "⭐ RESTORED (server): the UI wrote the fixed rest address/x/y back",
    "__dd352_loc", LOC_Q, {"id": FIXTURE_ID}, f"{AT_REST}(data.workStage)", always=True) + [
    step("pressKey", "Escape — leave no modal open", {"value": "Escape"}, always=True),
    jsassert("BACKSTOP: if the server is not at rest, send `updateWorkStage` with the FIXED rest values "
             "(reads first; sends nothing when the UI restore landed)", BACKSTOP_JS, always=True, timeout=45),
    jsassert("Remove the backstop's sessionStorage keys",
             f"['{NET_KEY}', '{NET_KEY}:sent'].forEach(k => sessionStorage.removeItem(k));\nreturn true;",
             always=True, timeout=15),
] + server_assert(
    "⭐ AT REST (server): address/x/y are the fixed rest values and the status is still `Ready`",
    "__dd352_loc", LOC_Q, {"id": FIXTURE_ID},
    f"data.workStage.status === 'Ready' && {AT_REST}(data.workStage)", always=True)

write(test(
    "MOB.352_Work_Location_Save",
    "`MOB.352` **`Edit Location` saves** — the globe menu's `LocationForm` writes the work stage's\n"
    "`address`/`x`/`y` (`UPDATE_WORK_STAGE`), proved over `/graphql`, then restored to FIXED values.\n"
    "- `MOB.348`/`MOB.911` only open the form. This one types a marker location, submits, and asks the\n"
    "  server; the modal closing is the mutation's `update()` (no optimisticResponse), not the proof.\n"
    f"- Rest: `{REST_ADDRESS}` · x {REST_X} · y {REST_Y}. Marker: `{MARK_ADDRESS}` · x {MARK_X} ·\n"
    f"  y {MARK_Y} (still New Orleans).\n"
    "- Restore, all `alwaysExecute`: the UI types the rest values back and the server read proves them;\n"
    "  a backstop sends `updateWorkStage` with the rest values only if the server is not at rest; the\n"
    "  last read requires rest + status `Ready`.\n"
    "- Fields are scoped to `#locationform` — the detail page behind has its own `Submit` (trap 3) —\n"
    "  and cleared through the native setter + `input` event (trap 17).",
    steps,
    tags=["Mobile", "env:dev", "Work Order", "Geolocation", "self-restoring"],
))
print("wrote MOB.352 (Edit Location saves, self-restoring)")
