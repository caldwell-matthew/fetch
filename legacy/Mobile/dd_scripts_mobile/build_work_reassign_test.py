"""Build MOB.365_Work_Reassign_Stage - reassign a work stage and SAVE, proved on the server, restored.

WHY THIS EXISTS
  `MOB.398` opens `Assign Work Stage` and cancels: the repeatable variant, because the
  crew picker hides crews already assigned (`notInCollection: true`) and a test that really assigns
  eats its own fixture (trap 10). This one does assign - and puts the assignment set back to FIXED values
  every run, so the picker offers the same crew next time.

WHAT THE SOURCE SAYS (`WorkOrders/components/InsertForm/ReassignWork.tsx`, origin/development)
  `AssignmentForm` submit, with `Keep local copy of work?` OFF (the default):
      REMOVE_WORK_STAGE_FROM_CREW { crew: <session role id>, workStageIds: [stage] }   fire-and-forget
      ADD_ASSIGNMENT_TO_WORKSTAGE { parentId: stage, data: { roleId: <picked crew> } }  update(): toast + close
  With the toggle ON only the ADD is sent. No `optimisticResponse`: the modal closing is the server's
  answer to the ADD - never to the REMOVE, so the REMOVE is proved over /graphql.
  Server (`removeFromRole`, `addCrewToWorkStage`): the REMOVE deletes that crew's `workstageassignment`
  rows AND its `scheduledevent` rows for the stage; the ADD is an idempotent MERGE.

CAN THE PAGE STILL REACH THE STAGE ONCE IT LEAVES `Admin`? YES - measured from the source, not assumed.
  Nothing evicts it: the REMOVE has no `update`, and `useWorkAssignmentSubscription` returns early for a
  stage already in the cached crew list. `WorkStageDetails` renders the detail query from the cache
  (bugs §25 governs the CREW LIST, which is only re-read by `/work`). So the restore reopens the same
  modal from the same page - after a reload, which renders the persisted cache.

THE RESTORE - WHAT THE UI CAN AND CANNOT DO
  UI    `Assign Work Stage` again, pick `Admin`, toggle `Keep local copy of work?` ON (so no REMOVE is
        sent; with it OFF the REMOVE of `Admin` would race the ADD of `Admin`), SUBMIT. Proved over
        /graphql: `Admin` is back and nothing was removed.
  NET   🛑 The UI can only remove the SESSION's crew (`usersCrew`), so `Account Executive` cannot be
        un-assigned from a browser without switching crews (forbidden: crew-scoped shared state).
        So an `always` step sends the app's own two mutations over same-origin /graphql (MOB.134's
        safety-net shape): `removeWorkStageFromCrew(crew: Account Executive)` and
        `addAssignmentToWorkStage(Admin)` (a no-op MERGE when the UI restore worked). It fires only when
        this run's PREMISE read a state this test produces (rest, or a previous run's leftover), and
        only once. Then a hard `always` read: the stage's crews are EXACTLY the fixed rest set.

FIXTURE (shared with MOB.363 / MOB.364 - see build_work_attach_form_test.py)
  stage `xohY0klBZktB9VBRxc8k4J` (work 20260910-16), `Ready`, 8 crews at rest (below), NO schedule
  entries - the premise requires none, because the REMOVE would delete `Admin`'s and the ADD does not
  recreate them. Target crew `Account Executive` (`thtNo1Nd9th9FRNNoAN5Il`): a seeded job-title role no
  test logs in as, not assigned at rest; it holds the stage for the seconds between save and restore.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      server_assert, work_cache_warm)

FIXTURE_ID = "xohY0klBZktB9VBRxc8k4J"      # work 20260910-16 - shared with MOB.363 / MOB.364
STAGE_URL = f"{BASE}/work/{FIXTURE_ID}"
ADMIN, ADMIN_ID = "Admin", "l4Jlk4ExMY005JZAF8hclQ"
TARGET, TARGET_ID = "Account Executive", "thtNo1Nd9th9FRNNoAN5Il"
# The stage's crews at rest (read over the API 2026-09-15).
REST = {
    "l4Jlk4ExMY005JZAF8hclQ": "Admin", "cc5MgMoo1h9VJBZtB4ZNFR": "Admin (0000)",
    "1ck5xMQ4IMV0BgRx0xsUdk": "Admin (0100)", "5Ylk1wIhslMR8lsg8NAQxA": "Admin (0101)",
    "kkBtBwZoBlpcw84F4F9B8s": "Admin (0110)", "BVM9Bxkpox9BlEYd8sp0NR": "Admin (0111)",
    "cQVVNJU5cFEU9RwIhw0Aps": "Admin (1110)", "kx5sw1dVUFMYFs0UA08Z5M": "Zero Crew",
}
K_SERVER, K_STAMP, K_NET, K_KEEP = "__dd365_server", "__dd365_premise", "__dd365_net", "__dd365_keep"

CREWS_Q = ("query($p: ChildTableQuery!, $x: ChildTableQuery!, $id: ID!) { "
           "a: workStageAssignments(params: $p) { edges { id name } } "
           "x: workStageAssignments(params: $x) { edges { id name } } "
           "workStage(id: $id) { id scheduleDates { id } } }")
CREWS_V = {
    "id": FIXTURE_ID,
    "p": {"parentId": FIXTURE_ID, "limit": 100},
    "x": {"parentId": FIXTURE_ID, "notInCollection": True, "limit": 100,
          "query": {"conditions": [{"column": "name", "operator": "CONTAINS", "value": TARGET}]}},
}

REST_IDS = sorted(REST)
FORWARD_IDS = sorted([i for i in REST if i != ADMIN_ID] + [TARGET_ID])   # Admin removed, target added
KEPT_IDS = sorted(REST_IDS + [TARGET_ID])                                  # UI restore: Admin back, target kept
IDS = "const ids = data.a.edges.map(e => e.id).sort();\nconst same = (want) => JSON.stringify(ids) === JSON.stringify(want);\n"


def is_set(want):
    return f"(() => {{ {IDS} return same({json.dumps(want)}); }})()"


# PREMISE: exactly the rest set, the target offered by the picker under its id, and no schedule entry the
# REMOVE would destroy. It stamps what it saw, so the net only ever restores a state THIS test produces.
PREMISE = ("(() => {\n"
           f"  {json.dumps([K_STAMP, K_NET, K_KEEP])}.forEach(k => sessionStorage.removeItem(k));   // a killed run's keys\n"
           + IDS +
           f"  const x = data.x.edges.filter(e => e.id === '{TARGET_ID}' && e.name === '{TARGET}').length;\n"
           f"  if (same({json.dumps(REST_IDS)})) sessionStorage.setItem('{K_STAMP}', 'rest');\n"
           f"  else if (same({json.dumps(FORWARD_IDS)}) || same({json.dumps(KEPT_IDS)})) sessionStorage.setItem('{K_STAMP}', 'leftover');\n"
           f"  return same({json.dumps(REST_IDS)}) && x === 1 && data.workStage.scheduleDates.length === 0;\n"
           "})()")

REMOVE_M = "mutation($crew: String!, $ids: [ID!]) { removeWorkStageFromCrew(crew: $crew, workStageIds: $ids) }"
ADD_M = "mutation($id: ID!, $data: AddRoleInput!) { addAssignmentToWorkStage(parentId: $id, data: $data) { id } }"
POST = ("const post = (query, variables) => window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',\n"
        "  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },\n"
        "  body: JSON.stringify({ query, variables }) });\n")
NET_JS = (f"if (!sessionStorage.getItem('{K_STAMP}') || sessionStorage.getItem('{K_NET}')) return true;   // not ours, or already sent\n"
          f"sessionStorage.setItem('{K_NET}', '1');\n" + POST +
          f"post({json.dumps(REMOVE_M)}, {{ crew: '{TARGET_ID}', ids: ['{FIXTURE_ID}'] }});\n"
          f"post({json.dumps(ADD_M)}, {{ id: '{FIXTURE_ID}', data: {{ roleId: '{ADMIN_ID}' }} }});\n"
          "return true;")

CREWFORM = '//form[@id="crewform"]'
CREW_INPUT = f'{CREWFORM}//input[@id="crewId"]'
SUBMIT = f'{CREWFORM}//button[normalize-space(.)="SUBMIT"]'
ASSIGN_BTN = '//button[contains(normalize-space(.), "Assign Work Stage")]'


def pick_visible_option_js(pick):
    """The ONE VISIBLE ListFilter option titled exactly `pick` (build_tab_tests.lookup's recipe; copied, not
    imported - importing that builder runs its writes)."""
    return ("const vis = [...document.querySelectorAll('[role=\"option\"]')].filter(o => {\n"
            "  const t = o.querySelector('[class*=\"option-title\"]');\n"
            f"  return t && (t.textContent || '').trim() === '{pick}' && o.offsetParent !== null;\n"
            "});\n"
            "if (vis.length !== 1) return false;\n"
            "vis[0].click();\nreturn true;")


ARMED_JS = ("const b = [...document.querySelectorAll('#crewform button')]\n"
            "  .find(x => (x.textContent || '').trim() === 'SUBMIT');\n"
            "return !!b && b.type === 'submit';")


def assign(crew, label, always=False, keep=False):
    """Open `Assign Work Stage`, pick `crew`, set the keep toggle, SUBMIT, and see the modal close."""
    a = dict(always=always)
    out = [
        step("click", f'Click "Assign Work Stage" ({label})', {"element": xpath_el(STAGE_URL, ASSIGN_BTN)},
             timeout=30, **a),
        step("wait", "Wait for the modal and its auto-opened crew dropdown", {"value": 3}, **a),
        step("assertElementPresent", "The crew form rendered", {"element": xpath_el(STAGE_URL, CREWFORM)},
             timeout=30, **a),
        step("typeText", f'Search the crew picker for "{crew}"',
             {"value": crew, "element": xpath_el(STAGE_URL, CREW_INPUT)}, timeout=30, **a),
        step("wait", "Wait for the crew options (network-only)", {"value": 3}, **a),
        jsassert(f'Pick "{crew}" — the one VISIBLE option titled exactly "{crew}"', pick_visible_option_js(crew),
                 timeout=30, **a),
        jsassert(f'The crew field now holds "{crew}"',
                 f"const el = document.getElementById('crewId');\nreturn !!el && (el.value || '').trim() === '{crew}';",
                 timeout=20, **a),
    ]
    if keep:
        # trap 28: the switch's input is hidden - click it from JS, at most ONCE per run (a re-poll must not
        # toggle it back off), and poll until React reflects it.
        out.append(jsassert('Turn "Keep local copy of work?" ON — so no REMOVE of `Admin` races the ADD',
                            "const el = document.getElementById('keepAssignment');\n"
                            "if (!el) return false;\n"
                            f"if (!el.checked && !sessionStorage.getItem('{K_KEEP}')) {{ sessionStorage.setItem('{K_KEEP}', '1'); el.click(); }}\n"
                            "return el.checked === true;", timeout=20, **a))
    else:
        out.append(jsassert('"Keep local copy of work?" is OFF (the default) — the save sends the REMOVE too',
                            "const el = document.getElementById('keepAssignment');\n"
                            "return !!el && el.checked === false;", timeout=20, **a))
    out += [
        jsassert("SUBMIT is ARMED — `type=\"submit\"` (trap 8)", ARMED_JS, timeout=30, **a),
        step("click", f"SUBMIT — assign to {crew}", {"element": xpath_el(STAGE_URL, SUBMIT)}, timeout=30, **a),
        step("wait", "Let the mutations reach the server", {"value": 2}, **a),
        # The toast is COMPOSED (`'Work stage has been assigned to ' + name`), so the literal is the source's
        # verbatim prefix (check_literals). Optional: transient, and the /graphql reads are the proof.
        step("assertPageContains", f"The `Work stage has been assigned to …` toast for {crew} (optional: transient)",
             {"value": "Work stage has been assigned to"}, optional=True, **a),
        jsassert("The crew modal closed and the detail page's `Assign Work Stage` is back — the modal closes in "
                 "ADD_ASSIGNMENT's update() (no optimistic response), so the server answered the ADD",
                 "if (document.getElementById('crewform')) return false;\n"
                 "return [...document.querySelectorAll('button')].some(b => (b.textContent || '').includes('Assign Work Stage'));",
                 timeout=30, **a),
    ]
    return out


steps = work_cache_warm() + [
    go(STAGE_URL, "the reassign work order (20260910-16)"),
    step("wait", "Let the detail view begin rendering", {"value": 2}),
    step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}, timeout=30),
] + server_assert(f"PREMISE (server): the stage's crews are exactly the 8 at rest (`{ADMIN}` among them), "
                  f"`{TARGET}` is not one of them, and the stage has no schedule entry",
                  K_SERVER, CREWS_Q, CREWS_V, PREMISE, soft=True) \
  + assign(TARGET, "forward") \
  + server_assert(f"⭐ SERVER: SAVED — `{TARGET}` holds the stage and `{ADMIN}` no longer does "
                  "(REMOVE + ADD), the other 7 crews untouched — asked over /graphql",
                  K_SERVER, CREWS_Q, CREWS_V, is_set(FORWARD_IDS), soft=True, timeout=60) + [
    # ---- restore: the UI puts Admin back (reload first: any modal is gone; the page reads the cache) ----
    step("goToUrl", "Navigate to the reassign work order (restore)", {"value": STAGE_URL}, always=True),
    step("wait", "Let the detail view begin rendering", {"value": 2}, always=True),
    step("assertPageContains", "Test work order detail rendered — reachable after leaving the Admin crew",
         {"value": "Status:"}, timeout=30, always=True),
] + assign(ADMIN, "restore", always=True, keep=True) \
  + server_assert(f"⭐ RESTORE (UI, server): `{ADMIN}` holds the stage again and the keep toggle removed "
                  f"nothing (`{TARGET}` is still there until the net)",
                  K_SERVER, CREWS_Q, CREWS_V, is_set(KEPT_IDS), soft=True, always=True, timeout=60) + [
    jsassert(f"🛑 NET (always): over /graphql, un-assign `{TARGET}` (the UI can only remove the session's "
             f"crew) and assign `{ADMIN}` (a no-op when the UI restore worked) — only when this run's premise "
             "read a state this test produces, and only once",
             NET_JS, always=True, timeout=15),
    step("wait", "Let the restore mutations land", {"value": 2}, always=True),
] + server_assert("⭐ RESTORED (server): the stage's crews are EXACTLY the 8 at rest",
                  K_SERVER, CREWS_Q, CREWS_V, is_set(REST_IDS), always=True, timeout=60) + [
    jsassert("Remove this test's sessionStorage keys",
             f"{json.dumps([K_STAMP, K_NET, K_KEEP])}.forEach(k => sessionStorage.removeItem(k));\nreturn true;",
             always=True, timeout=15),
]

write(test(
    "MOB.365_Work_Reassign_Stage",
    "`MOB.365` **Reassign a work stage and SAVE — proved on the server, then restored.**\n"
    f"- On its own Datadog-created work order `{FIXTURE_ID}` (work `20260910-16`).\n"
    f"- `Assign Work Stage` → `{TARGET}`, `Keep local copy` OFF → ⭐ `/graphql`: `{TARGET}` added and\n"
    f"  `{ADMIN}` removed (REMOVE_WORK_STAGE_FROM_CREW + ADD_ASSIGNMENT_TO_WORKSTAGE), the rest untouched.\n"
    f"- Restore (`always`): the same modal, `{ADMIN}` with `Keep local copy` ON → `/graphql` proves it; the UI\n"
    f"  cannot remove a crew other than the session's, so a net un-assigns `{TARGET}` over `/graphql`.\n"
    "  Ends on a hard read: exactly the 8 crews at rest.\n"
    "- `MOB.398` stays the read-only modal check.",
    steps,
    ["Mobile", "env:dev", "Work Order", "Crew", "self-restoring"],
))
print("wrote MOB.365 (reassign a work stage)")
