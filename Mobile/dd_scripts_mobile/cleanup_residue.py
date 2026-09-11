"""Prune Mobile test residue on dev (cleanup_spec.md §1-§3). DRY RUN BY DEFAULT; `--apply` acts.

A LOCAL script, 0 Datadog runs (cleanup_spec.md §3): a Synthetics API test would bill a run per
cleanup and be triggered by hand either way.

WHAT IT PRUNES (query by marker, delete by id - §3)
  works      work orders CREATED BY THE TEST ACCOUNT whose problemDesc STARTS WITH
             `DD SYNTHETIC MOBILE` (MOB.300/122/396/397),
             newest KEEP_WORKS kept for the work-list tests. `deleteWorkOrders(ids)` ->
             `removeWorkById` removes the work AND all its stages in one transaction (no bottom-up
             walk needed), and REFUSES any work with charges, schedule entries,
             conditions or failures.
  notes      job notes on the fixture work order whose text carries the marker (MOB.392),
             newest KEEP_NOTES kept. `deleteWorkStageJobNotes(ids)`.
  assets     `DD SYNTHETIC MOBILE …` assets (MOB.600), newest KEEP_ASSETS kept - MOB.623 and
             MOB.625 select these rows by the prefix. `deleteAssets(ids)`.
  leftovers  a MOB.390 `Pump Body` condition / MOB.391 `BELT·ADJUST·TIME` failure a failed run
             left behind (their premise refuses to run over one). `deleteWorkStage{Conditions,Failures}`.
REPORTED, NEVER TOUCHED
  charges    §2 - reversal ADDS rows; the fixture gains 4 per run, accepted debt.
  readings   MOB.550's event readings carry no marker, so they cannot be selected safely.

🛑 NEVER-TOUCH (§1) - enforced by ID, twice:
  The MAIN FIXTURE WORK ORDER WAS ITSELF CREATED BY MOB.300: its parent work `20260805-18`
  carries the marker, so a marker query returns it. Every candidate work is checked against
  the fixtures' parent work ids AND against every stage it holds, and the run aborts if a
  never-touch id is anywhere in the plan. The role must be exactly `Admin` (§3).

USAGE
    python3 cleanup_residue.py            # dry run: counts + the exact plan, changes nothing
    python3 cleanup_residue.py --apply    # delete what the dry run listed, then re-read
"""
import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reset_av_fixture import Session, credentials  # noqa: E402

MARKER = "DD SYNTHETIC MOBILE"
KEEP_WORKS, KEEP_NOTES, KEEP_ASSETS = 10, 1, 4
BATCH = 5
FIXTURE_STAGES = {"EYRpYJ9QYdQ1JFF10JtB0Q": "the main fixture work order",
                  "RcdI0xcpc8NBV8VoRNNBYM": "MOB.302's work order"}
NEVER_ASSETS = {"Pump 0102", "Bypass Valve 0001", "⚡ Tank 0000", "A/C Motor 0002"}


def contains(col, limit=1000):
    return {"limit": limit, "query": {"connector": "AND",
                                      "conditions": [{"column": col, "operator": "CONTAINS", "value": MARKER}]}}


def newest_first(rows):
    return sorted(rows, key=lambda r: r.get("createdAt") or "", reverse=True)


def plan(s):
    me = s.graphql("{ session { me { id name role { name } } } }")["session"]["me"]
    role = me["role"]["name"]
    if role != "Admin":
        raise SystemExit(f"REFUSE: role is {role!r}, not exactly 'Admin' (§3)")

    # --- the never-touch set, resolved from the server, not remembered -------------------
    never_works = {}
    for sid, why in FIXTURE_STAGES.items():
        w = s.graphql("query($id: ID!) { workStage(id: $id) { workId { id name } } }", {"id": sid})["workStage"]
        never_works[w["workId"]["id"]] = f"{why} (work {w['workId']['name']})"

    # --- works ------------------------------------------------------------------------------
    works = s.graphql("query($p: TableQuery) { works(params: $p) { edges { id name problemDesc createdAt "
                      "createdBy { id } } } }", {"p": contains("problemDesc")})["works"]["edges"]
    # ONLY DATADOG'S: created by the test account itself AND the problemDesc STARTS with the
    # marker the tests type (a CONTAINS match alone could catch a person's note that quotes it)
    works = [w for w in works if (w.get("createdBy") or {}).get("id") == me["id"]
             and (w.get("problemDesc") or "").strip().startswith(MARKER)]
    stages = s.graphql("query($p: TableQuery) { workStages(params: $p) { edges { id workId { id } } } }",
                       {"p": contains("problemDesc", 2000)})["workStages"]["edges"]
    stages_of = {}
    for st in stages:
        stages_of.setdefault((st.get("workId") or {}).get("id"), set()).add(st["id"])
    protected = [w for w in works if w["id"] in never_works
                 or stages_of.get(w["id"], set()) & set(FIXTURE_STAGES)]
    candidates = [w for w in newest_first(works) if w not in protected]
    del_works = candidates[KEEP_WORKS:]

    # --- notes on the fixture ---------------------------------------------------------------
    notes = s.graphql("query($id: ID!) { workStage(id: $id) { jobNotes { id desc createdAt } } }",
                      {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"})["workStage"]["jobNotes"]
    mine = newest_first([n for n in notes if MARKER in (n.get("desc") or "")])
    del_notes = mine[KEEP_NOTES:]

    # --- assets -----------------------------------------------------------------------------
    assets = s.graphql("query($p: TableQuery) { assets(params: $p) { edges { id name createdAt } } }",
                       {"p": contains("name")})["assets"]["edges"]
    assets = newest_first([a for a in assets if a["name"].startswith(MARKER) and a["name"] not in NEVER_ASSETS])
    del_assets = assets[KEEP_ASSETS:]

    # --- MOB.390/391 leftovers --------------------------------------------------------------
    w = s.graphql("""query($id: ID!) { workStage(id: $id) {
        condition { id inspectionElementId { name } }
        failures { id failureTypeId { name } repairTypeId { name } rootCauseTypeId { name } }
        equipmentCharges { id } laborCharges { id } materialCharges { id } otherCharges { id } } }""",
                  {"id": "EYRpYJ9QYdQ1JFF10JtB0Q"})["workStage"]
    del_cond = [c for c in w["condition"] if c["inspectionElementId"]["name"] == "Pump Body"]
    del_fail = [f for f in w["failures"] if (f["failureTypeId"]["name"], f["repairTypeId"]["name"],
                                              f["rootCauseTypeId"]["name"]) == ("BELT (R-L1)", "ADJUST", "TIME")]
    charges = {k: len(w[k]) for k in ("equipmentCharges", "laborCharges", "materialCharges", "otherCharges")}

    # --- the second, independent never-touch check -------------------------------------------
    doomed_works = {x["id"] for x in del_works}
    if doomed_works & set(never_works) or any(stages_of.get(x, set()) & set(FIXTURE_STAGES) for x in doomed_works):
        raise SystemExit("ABORT: a never-touch work order is in the delete plan")
    if any(a["name"] in NEVER_ASSETS for a in del_assets):
        raise SystemExit("ABORT: a fixture asset is in the delete plan")

    return {
        "never": never_works, "protected": protected,
        "works": (works, del_works), "notes": (mine, del_notes), "assets": (assets, del_assets),
        "cond": del_cond, "fail": del_fail, "charges": charges,
    }


def report(p):
    works, dw = p["works"]; notes, dn = p["notes"]; assets, da = p["assets"]
    print("NEVER TOUCHED (resolved from the server):")
    for wid, why in p["never"].items():
        print(f"   work {wid} — {why}")
    print(f"   matched by the marker but protected: {[x['name'] for x in p['protected']]}\n")
    print(f"  works     {len(works):4} carry the marker · keep newest {KEEP_WORKS} · DELETE {len(dw)}"
          + (f" (oldest {dw[-1]['createdAt'][:10]}, newest {dw[0]['createdAt'][:10]})" if dw else ""))
    print(f"  notes     {len(notes):4} on the fixture · keep newest {KEEP_NOTES} · DELETE {len(dn)}")
    print(f"  assets    {len(assets):4} DD SYNTHETIC assets · keep newest {KEEP_ASSETS} · DELETE {len(da)}")
    print(f"  leftovers DELETE {len(p['cond'])} Pump Body condition(s), {len(p['fail'])} BELT/ADJUST/TIME failure(s)")
    print(f"  charges   {p['charges']} on the fixture — NOT touched (§2)")
    print("  readings  MOB.550's carry no marker — NOT touched")
    for name, rows in (("works", dw), ("notes", dn), ("assets", da)):
        # ⭐ a category that returns ZERO usually means a test stopped writing (§3)
        if name in ("works", "notes") and not (p[name][0]):
            print(f"  ⚠️ {name}: nothing carries the marker — has its writer stopped writing?")


def apply(s, p):
    _, dw = p["works"]; _, dn = p["notes"]; _, da = p["assets"]
    ops = [("deleteWorkOrders", [x["id"] for x in dw]), ("deleteWorkStageJobNotes", [x["id"] for x in dn]),
           ("deleteAssets", [x["id"] for x in da]), ("deleteWorkStageConditions", [x["id"] for x in p["cond"]]),
           ("deleteWorkStageFailures", [x["id"] for x in p["fail"]])]
    # SMALL BATCHES, STOP ON THE FIRST ERROR. Each work delete also clears forms, attachments
    # and logs; 50 in one request hit a 504 at the gateway (nothing was deleted). The plan is
    # recomputed from the server on every run, so re-running after a stop resumes safely.
    for mut, ids in ops:
        if not ids:
            continue
        done = 0
        for i in range(0, len(ids), BATCH):
            chunk = ids[i:i + BATCH]
            try:
                r = s.graphql(f"mutation($ids: [ID!]!) {{ {mut}(ids: $ids) }}", {"ids": chunk})
            except SystemExit as e:
                print(f"  {mut}: STOPPED after {done} — {str(e)[:120]}  (re-run to resume)")
                return
            done += r[mut] or 0
            print(f"  {mut}: {done}/{len(ids)}", end="\r", flush=True)
        print(f"  {mut}: {done}/{len(ids)} deleted")


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--apply", action="store_true", help="delete what the dry run lists")
    args = ap.parse_args()
    s = Session().login(*credentials())
    p = plan(s)
    report(p)
    if not args.apply:
        print("\nDRY RUN — nothing changed. Re-run with --apply to delete exactly the above.")
        return 0
    print("\nAPPLYING…")
    apply(s, p)
    print("\nAFTER:")
    report(plan(s))
    return 0


if __name__ == "__main__":
    sys.exit(main())
