"""Run every scheduled suite on Datadog once, in a safe order — a manual full pass.

    ../../.venv/bin/python full_pass.py --dry-run          # the plan and its cost; bills nothing
    ../../.venv/bin/python full_pass.py                    # the pass (≈158 runs, ≈2h)
    ../../.venv/bin/python full_pass.py --from MOB.963     # resume stage 2 at a suite
    ../../.venv/bin/python full_pass.py --stage 1          # only the read-only stage (or --stage 2)

WHEN
  The weekly schedule (suite_plan.SLOTS) runs the suites on its own. A manual pass is for measuring after big
  changes, or before switching the schedule on. 🛑 It bills ≈158 runs: get the owner's go-ahead first (CLAUDE.md).

THE ORDER IS THE SCHEDULE'S, AND FOR THE SAME REASON (trap 1)
  Stage 1  the READ-ONLY suites, in their schedule slots' batches (≤ READ_ONLY_BATCH together; each batch
           settles, retries included, before the next starts). Not all ten at once: on 2026-09-18 ten
           simultaneous logins left five suites without the app shell, and their retries, five at a time, passed.
           With the on-demand concurrency cap at 1 (parallel slots bill monthly — trap 1) a batch queues and runs
           one suite at a time anyway.
  Stage 2  the DATA-CHANGING suites, ONE AT A TIME, in slot order — Session (MOB.973) last. Before each one the
           fixture checks run (`preflight.py av work mob302 mob39x`); a fixture not at rest stops the pass,
           because every suite after it would fail on its premise rather than on its own behaviour.
  MOB.967 is not run: it has no slot (bugs §34).

🛑 A RED SUITE IS NOT FINISHED WHEN ITS RESULT ARRIVES
  Every suite has `retry.count = 1`, and Datadog retries a failed run AUTOMATICALLY, straight away. That retry
  is a second full run still editing the fixtures after the first result is in (seen 2026-09-17: MOB.963 red at
  16:22, its retry red at 16:29). So after a red, this waits for the retry's result before anything else starts
  — and reports both. Stage 2 then STOPS (unless --keep-going): the first red is the one worth reading, and the
  runs after it would mostly measure its damage.

Before anything bills, the whole `preflight.py` must be clean. The summary is printed and saved to
`Mobile/local_runs/passes/<time>.md` (git-ignored).
"""
import argparse
import datetime
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import dd_tools  # noqa: E402
from suite_plan import SUITES, SLOTS, READ_ONLY_SLOTS, WEEKDAYS, suite_name  # noqa: E402

CEILING = 1071            # Datadog stops a suite past ~this many seconds (Appendix F)
FIXTURE_CHECKS = ["av", "work", "mob302", "mob39x"]
OUT = os.path.join(HERE, "..", "local_runs", "passes")


def plan():
    """(stage 1 batches — one list of names per read-only slot, stage 2 names in slot order, runs billed)."""
    how = lambda slot: WEEKDAYS.index(slot[0]) * 24 + slot[1]
    base = how(READ_ONLY_SLOTS[0])
    s1, s2, runs = [[] for _ in READ_ONLY_SLOTS], [], 0
    for sid, module, part, cls, _b, children in SUITES:
        if sid not in SLOTS:
            continue                                   # MOB.967 — held
        name = suite_name(sid, module, part)
        runs += 1 + len(children)
        if cls.startswith("read-only"):
            s1[READ_ONLY_SLOTS.index(SLOTS[sid])].append(name)
        else:
            s2.append(((how(SLOTS[sid]) - base) % 168, name))
    return s1, [n for _k, n in sorted(s2)], runs


def preflight(*checks):
    return subprocess.run([sys.executable, "preflight.py", *checks], cwd=HERE).returncode == 0


def results_since(api, pid, since_ms):
    rs = api.get_browser_test_latest_results(pid).to_dict().get("results") or []
    return sorted((r for r in rs if r.get("check_time", 0) >= since_ms), key=lambda r: r["check_time"])


def settle(api, pid, since_ms):
    """Every result for this test since `since_ms`, waiting out Datadog's automatic retry after a red."""
    first_seen, deadline, give_up = None, None, time.time() + 600
    while True:
        rs = results_since(api, pid, since_ms)
        if not rs and time.time() > give_up:
            print("   … Datadog listed no result for it in 10 min", flush=True)
            return rs
        passed = [bool((r.get("result") or {}).get("passed")) for r in rs]
        if rs and (passed[-1] or len(rs) >= 2):
            return rs                                  # green, or red and already retried
        if rs and first_seen is None:
            first_seen = time.time()
            dur = ((rs[0].get("result") or {}).get("duration") or 600_000) / 1000
            deadline = first_seen + dur + 300          # the retry runs as long as the first, plus slack
            print(f"   … red — waiting for Datadog's automatic retry (up to {int((deadline - first_seen) / 60)} min)",
                  flush=True)
        if deadline and time.time() > deadline:
            print("   … no retry appeared; going on with the one result", flush=True)
            return rs
        time.sleep(20)


def describe(rs):
    if not rs:
        return "NO RESULT", None
    first = rs[0].get("result") or {}
    secs = round((first.get("duration") or 0) / 1000)
    verdicts = ["PASS" if (r.get("result") or {}).get("passed") else "FAIL" for r in rs]
    return (" → retry ".join(verdicts)), secs


def run_group(api, ids, names):
    """Trigger `names` together via dd_tools.run (its stale-JSON guard included), then settle each."""
    since = int(time.time() * 1000) - 5000
    dd_tools.run(*names)
    rows = []
    for n in names:
        verdict, secs = describe(settle(api, ids[n], since))
        rows.append((n, verdict, secs))
    return rows


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true", help="print the plan and its cost; bill nothing")
    ap.add_argument("--stage", choices=["1", "2"], help="run only one stage")
    ap.add_argument("--from", dest="start", help="resume stage 2 at this suite (MOB.9xx or its full name)")
    ap.add_argument("--keep-going", action="store_true", help="do not stop stage 2 at the first red")
    a = ap.parse_args()

    s1, s2, _ = plan()
    if a.start:
        match = [i for i, n in enumerate(s2) if n == a.start or n.startswith(a.start + "_")]
        if not match:
            sys.exit(f"--from {a.start}: not a stage-2 suite ({', '.join(n.split('_')[0] for n in s2)})")
        s2 = s2[match[0]:]
    if a.stage == "1":
        s2 = []
    if a.stage == "2":
        s1 = []
    s1 = [b for b in s1 if b]
    names = [n for b in s1 for n in b] + s2
    cost = sum(1 + len(c) for sid, m, p, _cl, _b, c in SUITES if suite_name(sid, m, p) in names)

    batches = " | ".join(" ".join(n.split("_")[0] for n in b) for b in s1)
    print(f"Stage 1 — read-only, {len(s1)} batch(es) ({sum(map(len, s1))}): {batches or '—'}")
    print(f"Stage 2 — data-changing, one at a time ({len(s2)}): {' → '.join(n.split('_')[0] for n in s2) or '—'}")
    print(f"Bills {cost} runs, plus one suite's worth again for each that fails and is retried.")
    if a.dry_run:
        return 0

    print("\nPreflight (must be clean before anything bills) …", flush=True)
    if not preflight():
        print("🛑 PREFLIGHT NOT CLEAN — nothing was run.")
        return 1

    rows, stopped = [], None
    started = datetime.datetime.now()
    with dd_tools.ApiClient(dd_tools._conf()) as c:
        api = dd_tools.SyntheticsApi(c)
        ids = dd_tools.remote_ids(api)
        for i, batch in enumerate(s1, 1):
            print(f"\n=== Stage 1, batch {i}/{len(s1)}: {len(batch)} read-only suites together ===", flush=True)
            rows += [(*r, 1) for r in run_group(api, ids, batch)]
        for n in s2:
            print(f"\n=== Stage 2: {n} ===", flush=True)
            if not preflight(*FIXTURE_CHECKS):
                stopped = f"a fixture was not at rest before {n}"
                break
            name, verdict, secs = run_group(api, ids, [n])[0]
            rows.append((name, verdict, secs, 2))
            if verdict != "PASS" and not a.keep_going:
                stopped = f"{n} was red"
                break
        if not stopped:
            print("\nFinal fixture check …", flush=True)
            if not preflight(*FIXTURE_CHECKS):
                stopped = "a fixture was not at rest after the last suite"

    lines = [f"# Full pass — {started:%Y-%m-%d %H:%M}", "",
             "| Stage | Suite | Result | First run | vs ~1,071s ceiling |", "|---|---|---|---|---|"]
    for name, verdict, secs, stage in rows:
        head = f"{CEILING - secs}s spare" if secs else "—"
        flag = " ⚠️" if secs and secs > CEILING * 0.85 else ""
        lines.append(f"| {stage} | `{name}` | {verdict} | {secs or '—'}s | {head}{flag} |")
    lines += ["", f"**{sum(1 for r in rows if r[1] == 'PASS')} of {len(rows)} green.** "
              + (f"🛑 Stopped: {stopped}." if stopped else "Completed; fixtures at rest.")]
    text = "\n".join(lines)
    print("\n" + text)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{started:%Y-%m-%d_%H%M}.md")
    open(path, "w").write(text + "\n")
    print(f"\nsaved: {os.path.relpath(path, os.path.join(HERE, '..', '..'))}")
    return 0 if not stopped and all(r[1] == "PASS" for r in rows) else 1


if __name__ == "__main__":
    sys.exit(main())
