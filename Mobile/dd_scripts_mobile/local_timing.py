"""Time every suite LOCALLY - 0 Datadog runs - to plan the weekly schedule (checklist #37).

Runs `local_run.py <suite> --continue` for each suite ONE AT A TIME (the mutating suites share
fixtures - trap 1; MOB.997 changes the session crew; MOB.984 is phone-only) and writes
`Mobile/local_runs/timing/summary.md`: per suite and per child, local seconds and verdict.

⚠️ READ THE NUMBERS AS ESTIMATES
  - Local seconds are not Datadog seconds (different machine, network, browser). Compare with the
    last Datadog runtimes in DATADOG_LAST to get a ratio before planning windows.
  - `--continue` keeps a red child from hiding the children after it, but a red step still waits
    out its timeout - a failing child's time is inflated. The verdict column says which.
  - `uploadFiles` cannot replay locally, so photo children (MOB.600/621/623/626/301/741) go red
    after their upload and are timed with that inflation.
  - A local pass leaves the same residue a Datadog pass does (work orders, charges, a note,
    readings, stock +1) and the self-restoring children restore as usual.

USAGE (from dd_scripts_mobile/)
    ../../.venv/bin/python local_timing.py                 # every suite, in order
    ../../.venv/bin/python local_timing.py MOB.985 MOB.988 # just these
"""
import os
import re
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from local_run import find_test  # noqa: E402

OUT = os.path.join(HERE, "..", "local_runs", "timing")
PY = sys.executable

# Order: read-only first, then the mutating ones, MOB.997 (crew switch) last.
# the module suites in run order, from suite_plan.py (the one place suite membership is kept)
from suite_plan import SUITES as _PLAN, suite_name  # noqa: E402
SUITES = [f"MOB.{sid}" for sid, *_rest in _PLAN]

# Last known Datadog runtimes (testing_checklist.md RUN STATUS / Appendix F) - for calibration only.
DATADOG_LAST = {}   # the module suites have not run on Datadog yet
CEILING_NOTE = "MOB.991 hit Datadog's maximum execution time past 1071s (Appendix F)"

LINE = re.compile(r"^(ok|ERR soft|ERR opt|ERR)\s+([\d.]+)s (MOB\.\d+_\S+)")
TOTAL = re.compile(r"(\d+)s locally")


SELFTIME = re.compile(r"^(?:PASS|FAIL)\b.*?\s(\d+)s locally")


def read_log(name, children, log_path, wall):
    """Pull one suite's numbers out of a stored `local_run --continue` log.

    🛑 A SUBPROCESS WALL INCLUDES WAITING FOR THE REPLAY LOCK. `local_run` takes the lock BEFORE
    it starts its own clock (local_run.py:487-488), so its printed time is the run and the
    difference is however long another replay held the lock. Measured 2026-09-15: MOB.981 was
    billed 423s when it ran 313s, because a queued MOB.395 held the lock for 110s of it. The
    child's own number wins; `wall` is only the fallback for a log that never got that far.
    """
    rows, verdict = {}, "?"
    if not os.path.exists(log_path):
        return None
    for line in open(log_path):
        m = SELFTIME.match(line)
        if m:
            wall = float(m.group(1))
        m = LINE.match(line)                                  # depth-0 lines only (no indent)
        if m and m.group(3) in children:
            rows[m.group(3)] = (float(m.group(2)), "✅" if m.group(1) == "ok" else "❌ " + m.group(1))
        if " locally " in line and ("PASS" in line or "FAIL" in line):
            verdict = "✅ PASS" if line.startswith("PASS") else "❌ FAIL"
    return name, children, rows, wall, sum(r[0] for r in rows.values()), verdict


def stored_results():
    """Every suite in the plan that has a stored log, in plan order.

    `write_summary` used to render only the suites of the invocation that called it, so timing
    four suites overwrote the other twenty's rows. The logs persist under `local_runs/timing/`,
    so the table is rebuilt from all of them and a partial run tops up the file instead of
    replacing it.
    """
    out = {}
    for sid, module, part, *_rest in _PLAN:
        name = suite_name(sid, module, part)
        try:
            children = [s["name"] for s in find_test(name)["steps"] if s["type"] == "playSubTest"]
        except SystemExit:
            continue
        got = read_log(name, children, os.path.join(OUT, f"{name}.log"), 0.0)
        if got:
            out[name] = got
    return out


def time_suite(ref):
    details = find_test(ref)
    children = [s["name"] for s in details["steps"] if s["type"] == "playSubTest"]
    log_path = os.path.join(OUT, f"{details['name']}.log")
    t0 = time.time()
    with open(log_path, "w") as log:
        subprocess.run([PY, os.path.join(HERE, "local_run.py"), ref, "--continue"],
                       stdout=log, stderr=subprocess.STDOUT, check=False)
    return read_log(details["name"], children, log_path, time.time() - t0)


def main():
    os.makedirs(OUT, exist_ok=True)
    refs = sys.argv[1:] or SUITES
    results = []
    for ref in refs:
        print(f"timing {ref} ...", flush=True)
        r = time_suite(ref)
        results.append(r)
        print(f"  {r[0]}: {r[3]:.0f}s · children {r[4]:.0f}s · {r[5]}", flush=True)
        merged = stored_results()
        for one in results:                                   # this run wins over its own log
            merged[one[0]] = one
        write_summary([merged[k] for k in merged])
    print(f"\nsummary: {os.path.relpath(os.path.join(OUT, 'summary.md'), HERE)}")


def write_summary(results):
    lines = ["# Local suite timings (0 Datadog runs)", "",
             "*Estimates for planning the weekly schedule (checklist #37). Local ≠ Datadog seconds — "
             "calibrate against the Datadog column. A red child waits out its timeouts, so its time is "
             f"inflated. {CEILING_NOTE}.*", "",
             "| suite | children | local wall | login + overhead | verdict | last Datadog |",
             "|---|---|---|---|---|---|"]
    total = 0
    for name, children, rows, wall, child_sum, verdict in results:
        total += wall
        ref = name.split("_")[0]
        lines.append(f"| `{name}` | {len(children)} | {wall:.0f}s | {max(0, wall - child_sum):.0f}s | {verdict} | "
                     f"{DATADOG_LAST.get(ref, '—')} |")
    lines += ["", f"**All suites back to back: {total / 60:.0f} min locally.**", ""]
    for name, children, rows, wall, child_sum, verdict in results:
        lines += [f"## `{name}` — {wall:.0f}s", "", "| child | local | result |", "|---|---|---|"]
        for c in children:
            secs, res = rows.get(c, (None, "not reached"))
            lines.append(f"| `{c}` | {'' if secs is None else f'{secs:.0f}s'} | {res} |")
        lines.append("")
    open(os.path.join(OUT, "summary.md"), "w").write("\n".join(lines))


if __name__ == "__main__":
    main()
