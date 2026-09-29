"""Make the SECOND fixture work order on dev: In Progress, with a form that has a required field. 0 Datadog runs.

    .venv/bin/python e2e/mobile/tools/setup_second_fixture.py            # dry run: what exists, what would be made
    .venv/bin/python e2e/mobile/tools/setup_second_fixture.py --apply    # make what is missing

WHY (owner, 2026-09-29 — "fixture changes allowed")
  MOB.342  the work list's status legend filters by status; with every stage in the crew's list `Ready`, selecting
           Ready could not show anything being LEFT OUT. This stage is `In Progress`: a second status in the list.
  MOB.357  every form card on the fixture read `Required Fields Completed: 0 of 0` — no form had a required field. This
           stage holds a form whose one field is required, unfilled, so its card reads `0 of 1`.
  It is not the main fixture (`20260805-18-001`), which many tests need `Ready` and unchanged.

WHAT
  1  work order   a `☢️ Datadog Test` work order (the workflow MOB.300 uses — its crews include `Admin`, so it is in
                  the crew's list) described `DATADOG FIXTURE 2 …` — NOT the `DD SYNTHETIC MOBILE` marker, so
                  `cleanup_residue.py` never selects it — then `In Progress` (`UPDATE_WORK_STAGE`, as the status menu
                  does). The Admin department notifies only on `Complete`, to an empty role (trap 51).
  2  form         template `DATADOG FIXTURE REQUIRED FORM` (mobile ad hoc), one integer field `🔢1`, required
  3  attached     to (1), and never filled — a test that fills it must clear it again

SAFETY: one org only (SMCT2, checked first); found by its description / name before anything is made; nothing deleted.
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from fixtures import session  # noqa: E402

DESC = "DATADOG FIXTURE 2 - In Progress, a required form field (MOB.342, MOB.357). Do not change."
FORM = "DATADOG FIXTURE REQUIRED FORM"
DATADOG_TEST_TITLE = "IQU5x1VsQho4BZoEYwx9E4"
ADMIN_DEPARTMENT = "J08RJwghlBIxU0xptdg1oY"
INTEGER_TYPE = "11UIw88AkYlYsFlkUkBwtc"   # `🔢1`, an integer attribute type the Inspection form uses


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args()
    s = session()
    g = s.graphql
    me = g("{ session { me { org { name } role { id } } } }")["session"]["me"]
    if me["org"]["name"] != "SMCT W Plant 0":
        sys.exit(f"🛑 the session's org is {me['org']['name']!r}, not SMCT2 — refusing")
    print(f"{'APPLYING' if a.apply else 'DRY RUN'} — the second fixture")

    def say(step, what):
        print(f"  {step:<14} {what}")

    # 1 · the work order, In Progress
    def find_stage():
        edges = g('{ workStages(crew: "<SESSION>", params: { limit: 2000 }) { edges { id _workSequence status workId { problemDesc } } } }')["workStages"]["edges"]
        hits = [e for e in edges if (e["workId"] or {}).get("problemDesc") == DESC]
        if len(hits) > 1:
            sys.exit(f"🛑 {len(hits)} stages carry the description — resolve by hand")
        return hits[0] if hits else None
    stage = find_stage()
    if not stage and a.apply:
        work = g("mutation($d: CreateWorkInput!) { createWork(data: $d) { id stages { id } } }",
                 {"d": {"workflowTitleId": DATADOG_TEST_TITLE, "problemDesc": DESC, "roleId": me["role"]["id"]}})["createWork"]
        say("created", json.dumps(work))
        stage = find_stage()
    if stage and stage["status"] not in ("In Progress", "InProgress") and a.apply:   # the API answers the enum value
        g("mutation($id: ID!, $d: UpdateWorkStageInput!) { updateWorkStage(id: $id, data: $d) { id status } }",
          {"id": stage["id"], "d": {"status": "InProgress"}})
        stage = find_stage()
    say("work order", json.dumps(stage) if stage else "MISSING — would create, then set In Progress")

    # 2 · the form template, one required integer field
    form = next((e for e in g("{ workflowForms(params: { limit: 500 }) { edges { id name } } }")["workflowForms"]["edges"] if e["name"] == FORM), None)
    if not form and a.apply:
        form = g("mutation($d: CreateWorkflowFormInput!) { createWorkflowForm(data: $d) { id name } }",
                 {"d": {"name": FORM, "desc": "Mobile tests: one required field (MOB.357). Do not change.", "mobileAdHocForm": True, "departmentId": ADMIN_DEPARTMENT}})["createWorkflowForm"]
    fields = g("query($p: ChildTableQuery!) { workflowFormFields(params: $p) { edges { id required attributeTypeId { name } } } }",
               {"p": {"parentId": form["id"], "limit": 20}})["workflowFormFields"]["edges"] if form else []
    if form and not fields and a.apply:
        field = g("mutation($p: ID!, $d: AddFieldToWorkflowFormInput!) { addFieldToWorkflowForm(parentId: $p, data: $d) { id } }",
                  {"p": form["id"], "d": {"attributeTypeId": INTEGER_TYPE}})["addFieldToWorkflowForm"]
        g("mutation($id: ID!, $d: UpdateWorkflowFormFieldInput!) { updateWorkflowFormField(id: $id, data: $d) { id required } }",
          {"id": field["id"], "d": {"required": True}})
        fields = g("query($p: ChildTableQuery!) { workflowFormFields(params: $p) { edges { id required attributeTypeId { name } } } }",
                   {"p": {"parentId": form["id"], "limit": 20}})["workflowFormFields"]["edges"]
    say("form", json.dumps(form) if form else "MISSING — would create")
    say("  its fields", json.dumps(fields))

    # 3 · attached to the work order
    attached = []
    if stage:
        attached = [f for f in g("query($id: ID!) { workStage(id: $id) { forms { id name status } } }", {"id": stage["id"]})["workStage"]["forms"] if f["name"] == FORM]
        if not attached and form and a.apply:
            g("mutation($s: ID!, $f: ID!) { addFormToWorkStage(workStageId: $s, workflowFormId: $f) { id } }", {"s": stage["id"], "f": form["id"]})
            attached = [f for f in g("query($id: ID!) { workStage(id: $id) { forms { id name status } } }", {"id": stage["id"]})["workStage"]["forms"] if f["name"] == FORM]
    say("attached", json.dumps(attached) if attached else "NO — would attach")
    ok = bool(stage and stage["status"] in ("In Progress", "InProgress") and len(fields) == 1 and fields[0]["required"] and len(attached) == 1)
    print("✅ the second fixture is in place" if ok else ("🛑 not complete" if a.apply else "(dry run)"))
    return 0 if ok or not a.apply else 1


if __name__ == "__main__":
    sys.exit(main())
