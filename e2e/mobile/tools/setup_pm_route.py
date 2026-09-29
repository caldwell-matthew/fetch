"""Make the PM ROUTE fixture on dev: a work stage a PM created from a workflow that cycles workflow assets. 0 Datadog runs.

    .venv/bin/python e2e/mobile/tools/setup_pm_route.py            # dry run: what exists, what would be made
    .venv/bin/python e2e/mobile/tools/setup_pm_route.py --apply    # make what is missing, fire the trigger once, deactivate it

WHY
  A stage is a PM route (`workStage.pmRoute`) only when a PM trigger creates it from a workflow whose title has
  `cycleWorkflowAssets` (`server/…/work/work/create/index.ts:187-198`): its assets then come from the workflow stage's
  asset list, with their sequence numbers, and mobile shows the Assets tab's status controls and sequence order without
  a template flag (`WorkOrders/WorkDetails.tsx:157`, `Assets/index.tsx:70-78`). Nothing on dev had one. The owner
  (2026-09-29): "You create it" — a DD SYNTHETIC workflow, a one-off PM trigger, fired once, then deactivated.

HOW — a RUNTIME (meter) trigger, so it fires on demand and exactly once
  A reading on an asset fires its strategy's runtime triggers when the asset's status is one of the trigger group's
  statuses and the reading reaches the asset's `nextScheduledReading` (`controllers/asset/event/index.ts:30-75`,
  `utils/handleRuntimeTriggers.js`); the firing clears `nextScheduledReading`, so it cannot fire again. The calendar
  path would need the nightly PM job (or `manuallyInvokeTriggers`, which runs EVERY trigger in the org — never).

  1  workflow title  `DD SYNTHETIC MOBILE PM ROUTE`, cycleWorkflowAssets, forPM, department Admin
  2  its stage       a copy of the `☢️ Datadog Test` stage (its crews come with it, `Admin` among them, so the new
                     stage is in the test account's crew list), added as the title's root node, its mobile template
                     set to one with `showAssetStatus` OFF (the copy's `All Tabs` has it on)
  3  stage assets    Pump 0144 (sequence 1), Pump 0066 (sequence 2), Pump 0101 (none) — sequence order differs from
                     name order, so the Assets tab's order shows which one it used
  4  strategy        `DD SYNTHETIC MOBILE PM ROUTE`, with a trigger group for status `In Service`
  5  runtime trigger reading type `Test 1`, every 10, workflow (1)
  6  trigger asset   `DD SYNTHETIC PM ROUTE TRIGGER` (not `… MOBILE …`, so `cleanup_residue.py` keeps it: it is the
                     work order's default asset), type Pump, strategy (4), then status `In Service` — which seeds its
                     runtime trigger at its current reading + 10
  7  fire            one `Test 1` reading of 10 on (6) → the PM work order
  8  deactivate      the runtime trigger `active: false`

SAFETY: one org only (SMCT2, checked first); every record is found by its DD SYNTHETIC name before anything is made;
nothing is deleted. Re-running after (7) makes nothing and fires nothing.
"""
import argparse
import datetime
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from fixtures import session  # noqa: E402

NAME = "DD SYNTHETIC MOBILE PM ROUTE"
TRIGGER_ASSET = "DD SYNTHETIC PM ROUTE TRIGGER"
DATADOG_TEST_STAGE = "AgtI98NQBYdsBNFUBkZJYV"     # the "☢️ Datadog Test" workflow's one stage
ADMIN_DEPARTMENT = "J08RJwghlBIxU0xptdg1oY"
IN_SERVICE = "Ydh89EwB908lMl49hcxVBk"
TEST_1 = "k5ZQcwAkQ5BIhJ8MFQgBYl"                 # reading type `Test 1`
PUMP_0066 = "h4MMAAMUNJNEYJtcdlIp8o"
NO_STATUS_TEMPLATE = "xsNUpFVZ0sswgNRMNNU4ZI"   # "All Work Tabs (Jul 30 …)", a work template with showAssetStatus false
ROUTE = [("Pump 0144", 1), ("Pump 0066", 2), ("Pump 0101", None)]
DURATION = 10


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args()
    s = session()
    g = s.graphql
    org = g("{ session { me { org { name } } } }")["session"]["me"]["org"]["name"]
    if org != "SMCT W Plant 0":
        sys.exit(f"🛑 the session's org is {org!r}, not SMCT2 — refusing")

    def say(step, what):
        print(f"  {step:<16} {what}")

    def named(query, key, name, variables=None):
        edges = g(query, variables or {})[key]["edges"]
        hits = [e for e in edges if e["name"] == name]
        if len(hits) > 1:
            sys.exit(f"🛑 {len(hits)} records named {name!r} in {key} — resolve by hand")
        return hits[0] if hits else None

    def asset_id(name):
        edges = g('query($p: TableQuery) { assets(params: $p) { edges { id name } } }',
                  {"p": {"limit": 5, "query": {"connector": "AND", "conditions": [{"column": "name", "operator": "CONTAINS", "value": name}]}}})["assets"]["edges"]
        hits = [e["id"] for e in edges if e["name"] == name]
        return hits[0] if len(hits) == 1 else None

    print(f"{'APPLYING' if a.apply else 'DRY RUN'} — {NAME}")

    # 1 · the workflow title
    title = named("{ workflowTitles(params: { limit: 1000 }) { edges { id name cycleWorkflowAssets active } } }", "workflowTitles", NAME)
    if not title and a.apply:
        title = g("mutation($d: CreateWorkflowTitleInput!) { createWorkflowTitle(data: $d) { id name cycleWorkflowAssets active } }",
                  {"d": {"name": NAME, "desc": "Mobile tests: a PM route (cycles workflow assets). Safe to delete.", "forPM": True,
                         "cycleWorkflowAssets": True, "departmentId": ADMIN_DEPARTMENT, "active": True}})["createWorkflowTitle"]
    say("workflow title", json.dumps(title) if title else "MISSING — would create")

    # 2 · its stage — a copy of the Datadog Test stage, as the title's root node
    stages = g("query($p: ChildTableQuery!) { workflowStagesForTitle(params: $p) { edges { id name } } }",
               {"p": {"parentId": title["id"], "limit": 10}})["workflowStagesForTitle"]["edges"] if title else []
    if not stages and title and a.apply:
        stage = {"id": g("mutation($n: String!, $w: ID!) { copyWorkflowStage(name: $n, workflowStageId: $w) }",  # returns the new id
                         {"n": NAME, "w": DATADOG_TEST_STAGE})["copyWorkflowStage"], "name": NAME}
        g("mutation($t: ID!, $w: ID!) { addStageToWorkflow(targetId: $t, workflowStageId: $w) { id } }", {"t": title["id"], "w": stage["id"]})
        stages = [stage]
    stage = stages[0] if stages else None
    say("stage", json.dumps(stage) if stage else "MISSING — would copy the Datadog Test stage")
    if stage:
        crews = [e["name"] for e in g("query($p: ChildTableQuery!) { workflowAssignments(params: $p) { edges { name } } }",
                                        {"p": {"parentId": stage["id"], "limit": 50}})["workflowAssignments"]["edges"]]
        say("  its crews", crews)
        # A stage's mobile template resolves LIVE from its workflow stage (`resolver/workStage.ts:156-161`), and the copy
        # kept Datadog Test's `All Tabs`, which turns the asset status controls on by itself. Point it at one with the flag
        # off, so on the route stage they come from `pmRoute` alone.
        tpl = g("query($id: ID!) { workflow(id: $id) { mobileTemplateId { id name showAssetStatus } } }", {"id": stage["id"]})["workflow"]["mobileTemplateId"]
        if (tpl or {}).get("id") != NO_STATUS_TEMPLATE and a.apply:
            g("mutation($id: ID!, $d: UpdateWorkflowStageInput!) { updateWorkflow(id: $id, data: $d) { id } }",
              {"id": stage["id"], "d": {"mobileTemplateId": NO_STATUS_TEMPLATE}})
            tpl = g("query($id: ID!) { workflow(id: $id) { mobileTemplateId { id name showAssetStatus } } }", {"id": stage["id"]})["workflow"]["mobileTemplateId"]
        say("  its template", json.dumps(tpl))

    # 3 · the stage's asset list
    listed = g("query($p: ChildTableQuery!) { workflowStageAssets(params: $p) { edges { id sequence assetId { name } } } }",
               {"p": {"parentId": stage["id"], "limit": 50}})["workflowStageAssets"]["edges"] if stage else []
    have = {e["assetId"]["name"] for e in listed}
    for name, seq in ROUTE:
        if name in have:
            continue
        if a.apply and stage:
            aid = asset_id(name)
            if not aid:
                sys.exit(f"🛑 {name} not found (or not unique)")
            data = {"assetId": aid, **({"sequence": seq} if seq is not None else {})}
            g("mutation($p: ID!, $d: CreateWorkflowStageAssetInput!) { createWorkflowStageAsset(parentId: $p, data: $d) { id } }",
              {"p": stage["id"], "d": data})
        else:
            say("  stage asset", f"{name} (sequence {seq}) MISSING — would add")
    if stage:
        listed = g("query($p: ChildTableQuery!) { workflowStageAssets(params: $p) { edges { id sequence assetId { name } } } }",
                   {"p": {"parentId": stage["id"], "limit": 50}})["workflowStageAssets"]["edges"]
        say("stage assets", [(e["assetId"]["name"], e["sequence"]) for e in listed])

    # 4 · the strategy and its trigger group ; 5 · the runtime trigger
    strategy = named("{ maintenanceStrategies(params: { limit: 1000 }) { edges { id name } } }", "maintenanceStrategies", NAME)
    if not strategy and a.apply:
        strategy = g("mutation($d: CreateMaintenanceStrategyInput!) { createMaintenanceStrategy(data: $d) { id name } }",
                     {"d": {"name": NAME, "desc": "Mobile tests: fires the PM route once. Safe to delete.", "departmentId": ADMIN_DEPARTMENT}})["createMaintenanceStrategy"]
    say("strategy", json.dumps(strategy) if strategy else "MISSING — would create")
    triggers = g("query($p: ChildTableQuery!) { runtimeTriggersForStrategy(params: $p) { edges { id active duration triggergroupId { id } } } }",
                 {"p": {"parentId": strategy["id"], "limit": 10}})["runtimeTriggersForStrategy"]["edges"] if strategy else []
    if not triggers and strategy and a.apply and title:
        # Two steps: `createTriggerGroupForStatuses` fails on dev ("Required field maintenanceStrategyId missing", 2026-09-29).
        # A group a failed run left behind is reused (names are unique per strategy).
        group = next((e for e in g("query($p: ChildTableQuery!) { triggerGroups(params: $p) { edges { id name } } }",
                                   {"p": {"parentId": strategy["id"], "limit": 20}})["triggerGroups"]["edges"] if e["name"] == NAME), None) \
            or g("mutation($p: ID!, $d: StandardInsertInput!) { createMaintenanceStrategyTriggerGroup(parentId: $p, data: $d) { id } }",
                 {"p": strategy["id"], "d": {"name": NAME}})["createMaintenanceStrategyTriggerGroup"]
        g("mutation($d: AddTriggerGroupToStatusInput!) { addTriggerGroupToStatus(data: $d) { id } }",
          {"d": {"assetStatusId": IN_SERVICE, "triggergroupId": group["id"]}})
        g("mutation($p: ID!, $d: CreateRuntimeTriggerInput!) { createRuntimeTrigger(parentId: $p, data: $d) { id } }",
          {"p": strategy["id"], "d": {"duration": DURATION, "interval": TEST_1, "active": True, "triggergroupId": group["id"], "workflowId": title["id"]}})
        triggers = g("query($p: ChildTableQuery!) { runtimeTriggersForStrategy(params: $p) { edges { id active duration triggergroupId { id } } } }",
                     {"p": {"parentId": strategy["id"], "limit": 10}})["runtimeTriggersForStrategy"]["edges"]
    trigger = triggers[0] if triggers else None
    say("runtime trigger", json.dumps(trigger) if trigger else "MISSING — would create (Test 1, every 10)")

    # has it fired already? A PM route stage of this workflow in the crew's list. (Not the trigger asset's schedule: its
    # `lastWorkOrder` goes when the trigger is deactivated; not `works(params)`: dev ignores its conditions.)
    def fired_work():
        edges = g('{ workStages(crew: "<SESSION>", params: { limit: 2000 }) { edges { id name _workSequence status pmRoute } } }')["workStages"]["edges"]
        return [e for e in edges if e.get("pmRoute") and e["name"] == NAME]
    works = fired_work()
    if works:
        say("fired", json.dumps(works))

    # 6 · the trigger asset ; 7 · fire
    if not works and a.apply and trigger and trigger["active"]:   # an inactive trigger has fired: never again
        aid = asset_id(TRIGGER_ASSET)
        if not aid:
            type_id = g("query($id: ID!) { asset(id: $id) { typeId { id } } }", {"id": PUMP_0066})["asset"]["typeId"]["id"]
            aid = g("mutation($d: CreateAssetInput!) { createAsset(data: $d) { id } }",
                    {"d": {"name": TRIGGER_ASSET, "typeId": type_id, "desc": "Mobile tests: fires the PM route. Safe to delete."}})["createAsset"]["id"]
        g("mutation($id: ID!, $d: UpdateAssetInput!) { updateAsset(id: $id, data: $d) { id } }", {"id": aid, "d": {"maintenanceStrategyId": strategy["id"]}})
        g("mutation($id: ID!, $d: UpdateAssetInput!) { updateAsset(id: $id, data: $d) { id } }", {"id": aid, "d": {"assetStatusId": IN_SERVICE}})
        say("trigger asset", f"{TRIGGER_ASSET} {aid}: strategy set, status In Service")
        g("mutation($d: CreateEventInput!) { createEvent(data: $d) { id } }",
          {"d": {"assetId": aid, "readingType": TEST_1, "reading": DURATION, "readingDate": datetime.datetime.now(datetime.timezone.utc).isoformat()}})
        works = fired_work()
        say("fired", json.dumps(works) if works else "🛑 the reading made NO work order")

    # 8 · deactivate
    if trigger and trigger["active"] and works and a.apply:
        g("mutation($id: ID!, $d: UpdateRuntimeTriggerInput!) { updateRuntimeTrigger(id: $id, data: $d) { id active } }", {"id": trigger["id"], "d": {"active": False}})
        trigger["active"] = False
        say("deactivated", trigger["id"])
    if trigger:
        say("trigger active", trigger["active"])
    return 0 if (works or not a.apply) else 1


if __name__ == "__main__":
    sys.exit(main())
