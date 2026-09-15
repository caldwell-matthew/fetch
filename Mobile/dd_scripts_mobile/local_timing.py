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
SUITES = ["MOB.990", "MOB.992", "MOB.995", "MOB.996", "MOB.985", "MOB.984",
          "MOB.991", "MOB.988", "MOB.986", "MOB.989", "MOB.993", "MOB.983",
          "MOB.994", "MOB.987", "MOB.998", "MOB.997"]

# Last known Datadog runtimes (testing_checklist.md RUN STATUS / Appendix F) - for calibration only.
DATADOG_LAST = {"MOB.985": "546s (9 children)", "MOB.993": "656s (12 children)", "MOB.997": "234s",
                "MOB.984": "138s", "MOB.991": "474s (the old 13-child suite)"}
CEILING_NOTE = "MOB.991 hit Datadog's maximum execution time past 1071s (Appendix F)"

LINE = re.compile(r"^(ok|ERR soft|ERR opt|ERR)\s+([\d.]+)s (MOB\.\d+_\S+)")
TOTAL = re.compile(r"(\d+)s locally")


def time_suite(ref):
    details = find_test(ref)
    children = [s["name"] for s in details["steps"] if s["type"] == "playSubTest"]
    log_path = os.path.join(OUT, f"{details['name']}.log")
    t0 = time.time()
    with open(log_path, "w") as log:
        subprocess.run([PY, os.path.join(HERE, "local_run.py"), ref, "--continue"],
                       stdout=log, stderr=subprocess.STDOUT, check=False)
    wall = time.time() - t0
    rows, verdict = {}, "?"
    for line in open(log_path):
        m = LINE.match(line)                                  # depth-0 lines only (no indent)
        if m and m.group(3) in children:
            rows[m.group(3)] = (float(m.group(2)), "✅" if m.group(1) == "ok" else "❌ " + m.group(1))
        if " locally " in line and ("PASS" in line or "FAIL" in line):
            verdict = "✅ PASS" if line.startswith("PASS") else "❌ FAIL"
    child_sum = sum(r[0] for r in rows.values())
    return details["name"], children, rows, wall, child_sum, verdict


def main():
    os.makedirs(OUT, exist_ok=True)
    refs = sys.argv[1:] or SUITES
    results = []
    for ref in refs:
        print(f"timing {ref} ...", flush=True)
        r = time_suite(ref)
        results.append(r)
        print(f"  {r[0]}: {r[3]:.0f}s wall · children {r[4]:.0f}s · {r[5]}", flush=True)
        write_summary(results)
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
