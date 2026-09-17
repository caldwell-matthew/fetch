"""ONE command before spending runs: every standing check that costs 0 Datadog runs.

WHY
  The maintenance checks lived as ten separate commands and habits, and the ones nobody ran were
  the ones that cost runs: a renamed fixture asset (`⚡ Tank 0000`) took an Asset Verify suite red for three
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
  docs      the docs agree with themselves and the JSON: no finished row in ▶ OPEN WORK, no `#N`
            citing a checklist row that does not exist, the Rows line and test counts current (check 11)

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


# Datadog tests with no local JSON on purpose. `MOB.PDF_Upload_Recording` holds the owner-recorded PDF that
# MOB.628 and MOB.866 upload (trap 12) - paused, never pushed from here, never deleted.
REMOTE_ONLY = {"MOB.PDF_Upload_Recording"}


def check_sync():
    """Local JSON vs Datadog, by content - plus DUPLICATE NAMES, which `remote_ids` hides.

    🛑 `remote_ids()` is a dict keyed by NAME, so two Datadog tests sharing one name collapse to
    whichever the API listed last. `push` then updates that one and leaves the other behind, and
    `wire_suite` chains whichever it happened to resolve - so a suite can silently run a stale
    copy, and which copy is arbitrary. Found 2026-09-15: MOB.551 and MOB.624 each existed twice
    (the strays 19 steps behind in MOB.624's case). Nothing chained the strays, but nothing
    would have said so either.
    """
    from dd_tools import ApiClient, SyntheticsApi, _conf, remote_ids
    from collections import Counter
    local = local_tests()
    diffs, extra, dups = [], [], []
    with ApiClient(_conf()) as c:
        api = SyntheticsApi(c)
        every = [t["name"] for t in api.list_tests().to_dict()["tests"] if t["name"].startswith("MOB.")]
        dups = sorted(n for n, k in Counter(every).items() if k > 1)
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
        extra = [n for n in ids if n.startswith("MOB.") and n not in local and n not in REMOTE_ONLY]
    ok = not diffs and not extra and not dups
    msg = f"{len(local)} local tests match Datadog by content" if ok else "; ".join(
        diffs[:5] + ([f"on Datadog only: {extra}"] if extra else [])
        + ([f"DUPLICATE NAMES on Datadog (push/wire pick one at random): {dups}"] if dups else []))
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


def check_locals():
    """No two children of one suite may declare a local variable of the same NAME differently.

    🛑 On Datadog a suite's subtests share local variables BY NAME and the first definition wins.
    Measured 2026-09-16: inside MOB.980, MOB.722's `RUNID` (`numeric(5)`) got MOB.710's 8 digits and
    its guard went red - the test had passed solo. `local_run` shares them the same way, so a local
    replay shows it too, but this catches it for 0 runs before either. Same name AND same pattern is
    allowed (the children then share one value, which none of today's tests mind).
    """
    import glob
    by_name = {}
    for f in glob.glob(os.path.join(HERE, "..", "dd_tests_mobile", "MOB.*.json")):
        d = json.load(open(f))["details"]
        by_name[d["name"]] = d
    clashes = []
    for name, d in by_name.items():
        kids = [s["name"] for s in steps_of(d) if s.get("type") == "playSubTest"]
        if not kids:
            continue
        seen = {}
        for k in kids:
            for v in ((by_name.get(k) or {}).get("config") or {}).get("variables", []):
                if v.get("type") != "text":
                    continue
                first = seen.setdefault(v["name"], (k, v.get("pattern")))
                if first[1] != v.get("pattern"):
                    clashes.append(f"{name[:8]}: {v['name']} is {first[1]} in {first[0][:8]} but "
                                   f"{v.get('pattern')} in {k[:8]}")
    ok = not clashes
    return ok, ("no suite's children declare a local variable two different ways" if ok
                else "; ".join(sorted(set(clashes))[:6]))


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
    # `project` IS A PRECONDITION, not decoration. General Info resubmits every field it can
    # update, and the server refuses a project whose record has no account - which is every
    # project on dev (bugs §46). While the fixture references one, no General Info save on it
    # can succeed and MOB.395 is red no matter what it types.
    w = s.graphql("query($id: ID!) { workStage(id: $id) { status project { id name } } }",
                  {"id": WO_FIXTURE})["workStage"]
    crew = s.graphql("query($crew: String) { workStages(crew: $crew) { edges { id } } }",
                     {"crew": "<SESSION>"})["workStages"]["edges"]
    listed = any(e["id"] == WO_FIXTURE for e in crew)
    proj = w["project"]
    ok = w["status"] == "Ready" and listed and proj is None
    msg = f"status {w['status']}, {'in' if listed else 'NOT in'} the crew's list, project {proj and proj['name'] or 'none'}"
    if w["status"] != "Ready" or not listed:
        msg += " — MOB.320 ends on Ready; put it back (updateWorkStage status Ready)"
    if proj is not None:
        msg += (f" — clear it (updateWorkStage data {{project: null}}) or every General Info save "
                f"on this fixture is rejected (bugs §46)")
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


def check_docs():
    """The drift the docs keep re-growing: a finished row left in OPEN WORK, a citation of a deleted
    checklist row, and counts that no longer match the boxes or the test JSON."""
    import re
    mobile = os.path.join(HERE, "..")
    ck = open(os.path.join(mobile, "testing_checklist.md")).read()
    problems = []
    section = ck[ck.index("## ▶ OPEN WORK"):ck.index("### ⚪ NOT A GAP")]
    rows = set()
    for line in section.splitlines():
        m = re.match(r"\| \*\*#?(\d+)\b", line)
        if not m:
            continue
        rows.add(int(m.group(1)))
        state = line.rstrip().rstrip("|").rsplit("|", 1)[-1].strip()
        if re.search(r"✅|\bbuilt\b|\bfixed\b|\bdone\b", state):
            problems.append(f"OPEN WORK #{m.group(1)} reads as finished ({state[:50]!r}) - delete the row")
    docs = glob.glob(os.path.join(mobile, "*.md")) + [os.path.join(TESTS, "_archive", "README.md")]
    for path in docs:
        for m in re.finditer(r"(?<![\w§/])#(\d{2})(?:\s*[–-]\s*#?(\d{2}))?\b", open(path).read()):
            for n in range(int(m.group(1)), int(m.group(2) or m.group(1)) + 1):
                if n not in rows:
                    problems.append(f"{os.path.basename(path)} cites checklist #{n}, which is not a row")
    for path in glob.glob(os.path.join(HERE, "build_*.py")):
        for i, line in enumerate(open(path).read().split("\n"), 1):
            for m in re.finditer(r"checklist[^#\n]{0,4}#(\d{2})", line):
                if int(m.group(1)) not in rows:
                    problems.append(f"{os.path.basename(path)}:{i} cites checklist #{m.group(1)}, which is not a row")
    boxes = {k: len(re.findall(rf"^- \[{re.escape(k)}\]", ck, re.M)) for k in ("x", "~", " ", "-")}
    want = (f"| Rows | {boxes['x']} `[x]` · {boxes['~']} `[~]` · {boxes[' ']} `[ ]` · {boxes['-']} `[-]` "
            f"— {sum(boxes.values())} rows.")
    if want not in ck:
        problems.append(f"the checklist's Rows line should read: {want}")
    tests = {os.path.basename(p)[:-5]: json.load(open(p)) for p in glob.glob(os.path.join(TESTS, "*.json"))}
    tests = {n: d for n, d in tests.items() if "Verify_Scratch" not in n}
    suites = [n for n, d in tests.items() if any(st["type"] == "playSubTest" for st in steps_of(d))]
    steps = sum(len(steps_of(d)) for d in tests.values())
    slots = sum(1 for n in suites for st in steps_of(tests[n]) if st["type"] == "playSubTest")
    leaves = len(tests) - len(suites)
    for name, want in (("testing_checklist.md", f"**{leaves} leaf tests · {len(suites)} suites** · {steps} steps · {slots} subtest slots"),
                       ("coverage.md", f"**{leaves} leaf tests · {len(suites)} suites · {steps} steps · {slots} subtest slots**")):
        if want not in open(os.path.join(mobile, name)).read():
            problems.append(f"{name}'s test counts should read: {want}")
    problems = list(dict.fromkeys(problems))
    if not problems:
        return True, f"OPEN WORK rows {sorted(rows)} all open · citations resolve · counts current"
    return False, f"{len(problems)} problem(s): " + "; ".join(problems[:4])


CHECKS = {"wiring": check_wiring, "sync": check_sync, "drift": check_drift, "literals": check_literals,
          "bench": check_bench, "locals": check_locals, "av": check_av, "work": check_work, "mob302": check_mob302,
          "mob39x": check_mob39x, "docs": check_docs}


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
