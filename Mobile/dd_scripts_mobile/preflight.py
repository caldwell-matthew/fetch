"""ONE command before spending runs: every standing check that costs 0 Datadog runs.

WHY
  The maintenance checks lived as ten separate commands and habits, and the ones nobody ran were
  the ones that cost runs: a renamed fixture asset (`⚡ Tank 0000`) took MOB.993 red for three
  runs; the fixture work order sat `Canceled` for two days and fell out of the crew's list; a
  suite was left `PENDING-WIRE-UP` and every push 400'd. Each was readable for free beforehand.

WHAT IT RUNS (testing_checklist.md 🔧 MAINTENANCE)
  wiring    no suite child is still `PENDING-WIRE-UP`                          (check 2's cause)
  sync      every local test's STEPS and subtest ids equal Datadog's, and Datadog holds no
            MOB.* test that is not local                                         (check 2)
  drift     check_drift.py - generator vs JSON                                  (check 1)
  literals  check_literals.py - no asserted literal missing from the app         (check 5)
  bench     node check_js_assertions.js - every assertFromJavascript body       (check 7)
  av        reset_av_fixture.py --check - the AV job at rest                     (check 9)
  work      the fixture work order is `Ready` and in the crew's mobile list      (check 10)
  mob302    `Bypass Valve 0001` holds 0 attachments; its work order holds its one photo
  mob39x    no leftover MOB.390/391 key on the fixture (a failed delete stops their premise)

  🛑 `drift` WRITES into dd_tests_mobile/ while it runs (and restores it). It is SKIPPED if a
  verify.py / dd_tools run is in flight - running it then could corrupt the run's scratch.

USAGE
    python3 preflight.py            # everything
    python3 preflight.py av work    # just those
  Exit 0 = all green. Exit 1 = something to fix before a run.
"""
import glob
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TESTS = os.path.join(HERE, "..", "dd_tests_mobile")
sys.path.insert(0, HERE)

WO_FIXTURE = "EYRpYJ9QYdQ1JFF10JtB0Q"
MOB302_WO, MOB302_ASSET = "RcdI0xcpc8NBV8VoRNNBYM", "wFRo1MMwoAMkdxA4hVpIhB"


def steps_of(d):
    return (d.get("details") or d).get("steps") or d.get("steps") or []


def local_tests():
    out = {}
    for f in sorted(glob.glob(os.path.join(TESTS, "MOB.*.json"))):
        d = json.load(open(f))
        name = (d.get("details") or d).get("name") or os.path.basename(f)[:-5]
        out[name] = d
    return out


def run(cmd):
    p = subprocess.run(cmd, cwd=HERE, capture_output=True, text=True)
    return p.returncode, (p.stdout + p.stderr)


def busy():
    p = subprocess.run(["pgrep", "-f", "verify.py MOB|dd_tools.py run"], capture_output=True, text=True)
    return bool(p.stdout.strip())


# ------------------------------------------------------------------------------------- checks
def check_wiring():
    bad = [(n, s["name"]) for n, d in local_tests().items() for s in steps_of(d)
           if (s.get("params") or {}).get("subtestPublicId") == "PENDING-WIRE-UP"]
    return (not bad, "all suite children wired" if not bad
            else f"{len(bad)} unwired: {bad[:4]} — run wire_suite.py, then push")


def check_sync():
    from dd_tools import ApiClient, SyntheticsApi, _conf, remote_ids
    local = local_tests()
    diffs, extra = [], []
    with ApiClient(_conf()) as c:
        api = SyntheticsApi(c)
        ids = remote_ids(api)
        for name, d in local.items():
            if name not in ids:
                diffs.append(f"{name}: not on Datadog")
                continue
            remote = api.get_browser_test(ids[name]).to_dict()
            sig = lambda st: [(s.get("name"), (s.get("params") or {}).get("subtestPublicId") or
                               (s.get("params") or {}).get("subtest_public_id")) for s in st]
            if sig(steps_of(d)) != sig(remote.get("steps") or []):
                diffs.append(f"{name}: steps differ ({len(steps_of(d))} local vs {len(remote.get('steps') or [])})")
        extra = [n for n in ids if n.startswith("MOB.") and n not in local]
    ok = not diffs and not extra
    msg = f"{len(local)} local tests match Datadog by content" if ok else "; ".join(
        diffs[:5] + ([f"on Datadog only: {extra}"] if extra else []))
    return ok, msg


def check_drift():
    if busy():
        return None, "SKIPPED — a verify/run is in flight (drift writes into dd_tests_mobile/)"
    code, out = run([sys.executable, "check_drift.py"])
    lines = [l.strip() for l in out.splitlines() if "->" in l and ".json" in l]
    known = [l for l in lines if l.startswith("MOB.200_Crew_Switch.json")]
    other = [l for l in lines if l not in known]
    loses = "would LOSE" in out and "0 would LOSE" not in out
    ok = not other and not loses
    return ok, ("clean except the known MOB.200 role guard" if ok and known
                else "clean" if ok else "; ".join(other[:4]) + (" — A LOSS" if loses else ""))


def check_literals():
    code, out = run([sys.executable, "check_literals.py"])
    line = next((l.strip() for l in out.splitlines() if "MISSING ·" in l), out.strip()[-200:])
    return line.startswith("0 MISSING"), line


def check_bench():
    code, out = run(["node", "check_js_assertions.js"])
    tail = out.strip().splitlines()[-1] if out.strip() else "no output"
    return code == 0 and tail == "ALL PASS", tail


def check_av():
    code, out = run([sys.executable, "reset_av_fixture.py", "--check"])
    tail = " / ".join(l.strip() for l in out.strip().splitlines()[-2:])
    return code == 0, tail[:200]


def session():
    from reset_av_fixture import Session, credentials
    return Session().login(*credentials())


def check_work():
    s = session()
    w = s.graphql("query($id: ID!) { workStage(id: $id) { status } }", {"id": WO_FIXTURE})["workStage"]
    crew = s.graphql("query($crew: String) { workStages(crew: $crew) { edges { id } } }",
                     {"crew": "<SESSION>"})["workStages"]["edges"]
    listed = any(e["id"] == WO_FIXTURE for e in crew)
    ok = w["status"] == "Ready" and listed
    return ok, f"status {w['status']}, {'in' if listed else 'NOT in'} the crew's list" + (
        "" if ok else " — MOB.320 ends on Ready; put it back (updateWorkStage status Ready)")


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


CHECKS = {"wiring": check_wiring, "sync": check_sync, "drift": check_drift, "literals": check_literals,
          "bench": check_bench, "av": check_av, "work": check_work, "mob302": check_mob302,
          "mob39x": check_mob39x}


def main(names):
    bad = 0
    for name in names or CHECKS:
        try:
            ok, msg = CHECKS[name]()
        except Exception as e:  # a check that cannot run is a failure, not a pass
            ok, msg = False, f"ERROR {type(e).__name__}: {str(e)[:160]}"
        mark = "SKIP" if ok is None else ("ok  " if ok else "FAIL")
        bad += ok is False
        print(f"  [{mark}] {name:9} {msg}")
    print("\nPREFLIGHT " + ("CLEAN" if not bad else f"— {bad} to fix before spending runs"))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
