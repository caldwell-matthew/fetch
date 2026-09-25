"""Are the shared fixture records on dev at rest? — the check the pass runs before every data-changing suite.

    .venv/bin/python e2e/tools/fixtures.py               # all four
    .venv/bin/python e2e/tools/fixtures.py work mob302   # just these

Read-only: every check reads over `/graphql` and changes nothing. The suites that write assume these records
are exactly as below when they start; a suite run on a fixture that is not at rest fails on its premise, not on
its own behaviour, so the pass stops instead (docs/cleanup_spec.md).

    av      the Asset Verify fixture job is at rest (reset with `reset_av_fixture.py --apply`)
    work    the fixture work order is Ready, in the crew's list, and has no project
    mob302  Bypass Valve 0001 has no photos, and its work order exactly one
    mob39x  no condition/failure left behind by MOB.390/391; the original condition is still there
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

WO_FIXTURE = "EYRpYJ9QYdQ1JFF10JtB0Q"
MOB302_WO, MOB302_ASSET = "RcdI0xcpc8NBV8VoRNNBYM", "wFRo1MMwoAMkdxA4hVpIhB"


def session():
    from reset_av_fixture import Session, credentials
    return Session().login(*credentials())


def check_av():
    p = subprocess.run([sys.executable, "reset_av_fixture.py", "--check"], cwd=HERE, capture_output=True, text=True)
    out = p.stdout + p.stderr
    tail = " / ".join(l.strip() for l in out.strip().splitlines()[-2:])
    return p.returncode == 0, tail[:200]


def check_work():
    s = session()
    # `project` IS A PRECONDITION, not decoration. General Info resubmits every field it can update, and the
    # server refuses a project whose record has no account - which is every project on dev (bugs §46). While
    # the fixture references one, no General Info save on it can succeed and MOB.395 is red whatever it types.
    w = s.graphql("query($id: ID!) { workStage(id: $id) { status project { id name } } }",
                  {"id": WO_FIXTURE})["workStage"]
    # The whole list, not the default page: its limit is 500, and the crew passed 500 stages with residue on
    # 2026-09-24 — the fixture sat at 501 and read as "not in the list" when it was. A limit of 5000 silently comes
    # back as 500, so 1000 it is, and a longer list stops the check rather than misreading it.
    page = s.graphql("query($crew: String) { workStages(crew: $crew, params: { limit: 1000 }) "
                     "{ edges { id } pageInfo { totalCount } } }", {"crew": "<SESSION>"})["workStages"]
    crew = page["edges"]
    if page["pageInfo"]["totalCount"] > len(crew):
        return False, (f"the crew's list has {page['pageInfo']['totalCount']} stages, more than one read of "
                       f"{len(crew)} — prune the residue (cleanup_residue.py) or page this check")
    listed = any(e["id"] == WO_FIXTURE for e in crew)
    proj = w["project"]
    ok = w["status"] == "Ready" and listed and proj is None
    msg = f"status {w['status']}, {'in' if listed else 'NOT in'} the crew's list, project {proj and proj['name'] or 'none'}"
    if w["status"] != "Ready" or not listed:
        msg += " — MOB.320 ends on Ready; put it back (updateWorkStage status Ready)"
    if proj is not None:
        msg += (" — clear it (updateWorkStage data {project: null}) or every General Info save on this fixture "
                "is rejected (bugs §46)")
    return ok, msg


def check_mob302():
    s = session()
    a = s.graphql("query($id: ID!) { asset(id: $id) { attachments { id } } }", {"id": MOB302_ASSET})["asset"]
    w = s.graphql("query($id: ID!) { workStage(id: $id) { attachments { id } } }", {"id": MOB302_WO})["workStage"]
    ok = len(a["attachments"]) == 0 and len(w["attachments"]) == 1
    return ok, (f"Bypass Valve 0001: {len(a['attachments'])} attachments (want 0) · "
                f"its work order: {len(w['attachments'])} (want 1)")


def check_mob39x():
    s = session()
    w = s.graphql("""query($id: ID!) { workStage(id: $id) {
        condition { inspectionElementId { name } }
        failures { failureTypeId { name } repairTypeId { name } rootCauseTypeId { name } } } }""",
                  {"id": WO_FIXTURE})["workStage"]
    cond = [c for c in w["condition"] if c["inspectionElementId"]["name"] == "Pump Body"]
    fail = [f for f in w["failures"] if (f["failureTypeId"]["name"], f["repairTypeId"]["name"],
                                          f["rootCauseTypeId"]["name"]) == ("BELT (R-L1)", "ADJUST", "TIME")]
    orig_c = [c for c in w["condition"] if c["inspectionElementId"]["name"] == "Mounting/Support"]
    ok = not cond and not fail and len(orig_c) == 1
    return ok, (f"leftovers: {len(cond)} Pump Body condition(s), {len(fail)} BELT/ADJUST/TIME failure(s) "
                f"(want 0 — clean from desktop) · original condition: {len(orig_c)} (want 1)")


CHECKS = {"av": check_av, "work": check_work, "mob302": check_mob302, "mob39x": check_mob39x}


def main(names):
    bad = 0
    for name in names or CHECKS:
        try:
            ok, msg = CHECKS[name]()
        except Exception as e:                      # a check that cannot run is a failure, not a pass
            ok, msg = False, f"ERROR {type(e).__name__}: {str(e)[:160]}"
        bad += not ok
        print(f"  [{'ok  ' if ok else 'FAIL'}] {name:7} {msg}")
    print("\nFIXTURES " + ("AT REST" if not bad else f"— {bad} not at rest"))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
