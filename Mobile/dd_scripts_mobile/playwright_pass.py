"""Run the converted suites under Playwright, in the schedule's safe order — 0 Datadog runs.

    ../../.venv/bin/python playwright_pass.py --dry-run        # the plan
    ../../.venv/bin/python playwright_pass.py --stage 1        # the read-only suites
    ../../.venv/bin/python playwright_pass.py --stage 2        # the data-changing ones, one at a time
    ../../.venv/bin/python playwright_pass.py --from MOB.963   # resume stage 2 at a suite

WHY THIS EXISTS AND `npx playwright test` IS NOT ENOUGH
  Playwright will happily run every suite back to back. The suites share fixture records on dev, so
  the order and the checks BETWEEN them are the point (trap 1, AGENTS.md):

  Stage 1  the READ-ONLY suites. They may overlap each other, and nothing they do needs checking.
  Stage 2  the DATA-CHANGING suites, ONE AT A TIME, in slot order — Session (MOB.973) last. The
           fixture checks (`preflight.py av work mob302 mob39x`) run before each one: a fixture that
           is not at rest stops the pass, because every suite after it would fail on its premise
           rather than on its own behaviour. They run again at the end, so residue is seen here and
           not three days later.
  MOB.967 is skipped: its MOB.600 cannot run outside Datadog (the photo picker was recorded without
  an xpath) and bugs §34 is still open.

  A red suite STOPS the pass (unless --keep-going): the first failure is the one worth reading, and
  the runs after it mostly measure its damage.

The summary is printed and saved to `Mobile/local_runs/passes/<time>-playwright.md`, and each suite's
screenshots and traces to `<time>-evidence/<suite>/` beside it (git-ignored).
"""
import argparse
import datetime
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
E2E = os.path.join(HERE, "..", "..", "e2e")
OUT = os.path.join(HERE, "..", "local_runs", "passes")
FIXTURE_CHECKS = ["av", "work", "mob302", "mob39x"]

sys.path.insert(0, HERE)
from suite_plan import SUITES, SLOTS, READ_ONLY_SLOTS, WEEKDAYS, suite_name  # noqa: E402

HELD = {"967"}          # MOB.600 cannot run outside Datadog; bugs §34


def plan():
    """(read-only suite names, data-changing names in slot order)."""
    how = lambda slot: WEEKDAYS.index(slot[0]) * 24 + slot[1]
    base = how(READ_ONLY_SLOTS[0])
    read_only, writes = [], []
    for sid, module, part, cls, _blurb, _children in SUITES:
        if sid in HELD or sid not in SLOTS:
            continue
        name = suite_name(sid, module, part)
        if cls.startswith("read-only"):
            read_only.append(name)
        else:
            writes.append(((how(SLOTS[sid]) - base) % 168, name))
    return read_only, [n for _k, n in sorted(writes)]


def fixtures_at_rest():
    return subprocess.run([sys.executable, "preflight.py", *FIXTURE_CHECKS], cwd=HERE).returncode == 0


def run_suites(names, evidence):
    """Run these suite specs and return (counts, failed test names, seconds).

    Each call gets its OWN `--output` folder: Playwright empties its output folder at the start of
    every run, so with one shared folder the next suite wiped the previous one's failure screenshot
    and trace before anyone read them (2026-09-23, MOB.350)."""
    started = datetime.datetime.now()
    args = ["npx", "playwright", "test", *[f"suites/{n}.spec.ts" for n in names], "--reporter=list",
            "--output", evidence]
    proc = subprocess.run(args, cwd=E2E, capture_output=True, text=True)
    out = proc.stdout + proc.stderr
    print(out[-4000:] if len(out) > 4000 else out, flush=True)
    counts = {k: int(m.group(1)) for k in ("passed", "failed", "skipped", "did not run")
              for m in [re.search(rf"(\d+) {k}\b", out)] if m}
    secs = round((datetime.datetime.now() - started).total_seconds())
    failures = re.findall(r"✘\s+\d+\s+suites/\S+ › [^›]+ › (\S+)", out)
    return counts, failures, secs


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true", help="print the plan, run nothing")
    ap.add_argument("--stage", choices=["1", "2"], help="only the read-only (1) or data-changing (2) stage")
    ap.add_argument("--from", dest="start", help="resume stage 2 at this suite (MOB.9xx)")
    ap.add_argument("--keep-going", action="store_true", help="do not stop stage 2 at the first red")
    a = ap.parse_args()

    read_only, writes = plan()
    if a.start:
        match = [i for i, n in enumerate(writes) if n.startswith(a.start)]
        if not match:
            sys.exit(f"--from {a.start}: not a data-changing suite")
        writes = writes[match[0]:]
    if a.stage == "1":
        writes = []
    if a.stage == "2":
        read_only = []

    print(f"Stage 1 — read-only ({len(read_only)}): {' '.join(n.split('_')[0] for n in read_only) or '—'}")
    print(f"Stage 2 — data-changing, one at a time ({len(writes)}): "
          f"{' → '.join(n.split('_')[0] for n in writes) or '—'}")
    print(f"Held: MOB.{', MOB.'.join(sorted(HELD))} (MOB.600 cannot run outside Datadog)")
    if a.dry_run:
        return 0

    rows, stopped = [], None
    started = datetime.datetime.now()
    evidence_root = os.path.join(OUT, f"{started:%Y-%m-%d_%H%M}-evidence")
    evidence = lambda label: os.path.join(evidence_root, label)
    if read_only:
        print(f"\n=== Stage 1: {len(read_only)} read-only suites ===", flush=True)
        counts, failures, secs = run_suites(read_only, evidence("stage1"))
        rows.append(("1", " ".join(n.split("_")[0] for n in read_only), counts, failures, secs))
        if failures and not a.keep_going:
            stopped = f"stage 1 was red: {', '.join(failures)}"

    for name in writes if not stopped else []:
        print(f"\n=== Stage 2: {name} — fixtures first ===", flush=True)
        if not fixtures_at_rest():
            stopped = f"a fixture was not at rest before {name}"
            break
        counts, failures, secs = run_suites([name], evidence(name.split("_")[0]))
        rows.append(("2", name.split("_")[0], counts, failures, secs))
        if failures and not a.keep_going:
            stopped = f"{name} was red: {', '.join(failures)}"
            break

    if not stopped:
        print("\n=== Fixtures, after the last suite ===", flush=True)
        if not fixtures_at_rest():
            stopped = "a fixture was not at rest after the last suite"

    lines = [f"# Playwright pass — {started:%Y-%m-%d %H:%M}", "",
             "| Stage | Suite(s) | Passed | Failed | Time |", "|---|---|---|---|---|"]
    for stage, label, counts, failures, secs in rows:
        lines.append(f"| {stage} | `{label}` | {counts.get('passed', 0)} | "
                     f"{', '.join(failures) if failures else '—'} | {secs}s |")
    total = sum(c.get("passed", 0) for _s, _l, c, _f, _t in rows)
    red = [f for _s, _l, _c, fs, _t in rows for f in fs]
    lines += ["", f"**{total} passed, {len(red)} failed.** " + (f"🛑 Stopped: {stopped}." if stopped
                                                               else "Completed; fixtures at rest.")]
    text = "\n".join(lines)
    print("\n" + text)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{started:%Y-%m-%d_%H%M}-playwright.md")
    open(path, "w").write(text + "\n")
    print(f"\nsaved: {os.path.relpath(path, os.path.join(HERE, '..', '..'))}")
    print(f"evidence (screenshots, traces): {os.path.relpath(evidence_root, os.path.join(HERE, '..', '..'))}")
    return 1 if (stopped or red) else 0


if __name__ == "__main__":
    sys.exit(main())
