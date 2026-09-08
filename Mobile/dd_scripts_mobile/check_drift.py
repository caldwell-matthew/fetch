"""Report where a build_* generator and its JSON DISAGREE. Changes nothing.

WHY THIS EXISTS — trap 19, made detectable instead of discoverable.
  `write()` refuses to overwrite existing JSON without `DD_FORCE=1`, deliberately: the JSON is
  the source of truth, because several tests carry hand-authored steps no generator can produce
  (uploads, patched login steps, wired subtest ids). The cost is that a generator can drift from
  its JSON indefinitely and NOTHING WARNS YOU — until someone runs `DD_FORCE=1` and a suite
  silently loses children while still reporting PASS.

  An audit found six children in that state at once:
      MOB.990  would have lost MOB.171, MOB.180, MOB.346, MOB.910
      MOB.992  would have lost MOB.470
      MOB.994  would have lost MOB.610
  plus MOB.600, whose generator would have deleted its PROOF OF CREATION — leaving a test that
  only checks a form closed, which trap 6 says proves nothing there.

HOW IT WORKS
  Copies the JSON aside, runs every generator with DD_FORCE=1 into the real directory, diffs,
  then RESTORES the originals. Nothing is left changed even if it fails part-way.

  ⚠️ It cannot run safely while something else is writing to dd_tests_mobile/. Run it alone.

USAGE
    ./.venv/bin/python Mobile/dd_scripts_mobile/check_drift.py

  Exit 0 = generators and JSON agree. Exit 1 = drift; the report says exactly what would be
  lost. **A LOSS is the serious case** — an ADD usually means the JSON was patched by hand on
  purpose (MOB.200's role guard is the known example) and is fine to leave, but it should be
  a deliberate decision rather than a surprise.

  Run it before any `DD_FORCE=1`, and after wiring a new child into a suite.
"""
import json, glob, os, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
MOBILE = os.path.dirname(HERE)
REPO = os.path.dirname(MOBILE)
TESTS = os.path.join(MOBILE, "dd_tests_mobile")
PY = os.path.join(REPO, ".venv", "bin", "python")


def step_names(path):
    d = json.load(open(path))["details"]
    return [s["name"] for s in d["steps"]]


def children(path):
    d = json.load(open(path))["details"]
    return [s["name"] for s in d["steps"] if s["type"] == "playSubTest"]


def main():
    backup = tempfile.mkdtemp(prefix="dd_drift_")
    for f in glob.glob(os.path.join(TESTS, "*.json")):
        shutil.copy(f, backup)

    findings, errors = [], []
    try:
        for gen in sorted(glob.glob(os.path.join(HERE, "build_*.py"))):
            r = subprocess.run([PY, gen], env={**os.environ, "DD_FORCE": "1"},
                               capture_output=True, text=True)
            if r.returncode:
                tail = (r.stderr.strip().splitlines() or ["?"])[-1]
                errors.append((os.path.basename(gen), tail[:100]))

        for b in sorted(glob.glob(os.path.join(backup, "*.json"))):
            name = os.path.basename(b)
            now = os.path.join(TESTS, name)
            if not os.path.exists(now):
                findings.append((name, "generator would DELETE this file", [], []))
                continue
            before, after = step_names(b), step_names(now)
            if before == after:
                continue
            lost = [x for x in before if x not in after]
            added = [x for x in after if x not in before]
            kid_loss = [x for x in children(b) if x not in children(now)]
            findings.append((name, f"{len(before)} -> {len(after)} steps", lost, kid_loss))

        # a generator that CREATES a file the repo deliberately archived
        for now in sorted(glob.glob(os.path.join(TESTS, "*.json"))):
            if not os.path.exists(os.path.join(backup, os.path.basename(now))):
                findings.append((os.path.basename(now),
                                 "generator CREATED this file — archived test being resurrected?",
                                 [], []))
    finally:
        for f in glob.glob(os.path.join(TESTS, "*.json")):
            os.remove(f)
        for f in glob.glob(os.path.join(backup, "*.json")):
            shutil.copy(f, TESTS)
        shutil.rmtree(backup, ignore_errors=True)

    if errors:
        print("GENERATORS THAT FAILED TO RUN:")
        for g, e in errors:
            print(f"  {g}: {e}")
        print()

    if not findings:
        print(f"OK - every generator reproduces its JSON ({len(glob.glob(os.path.join(TESTS,'*.json')))} tests).")
        return 0

    serious = [f for f in findings if f[2] or f[3]]
    print(f"DRIFT in {len(findings)} file(s); {len(serious)} would LOSE something:\n")
    for name, what, lost, kid_loss in findings:
        flag = "!! " if (lost or kid_loss) else "   "
        print(f"{flag}{name}: {what}")
        for c in kid_loss:
            print(f"      LOSES CHILD: {c}")
        for s in lost[:6]:
            print(f"      loses step: {s[:72]}")
    print("\nJSON is the source of truth - fix the GENERATOR to match it, not the other way round,")
    print("unless you have decided the generator is right and re-verified the test by running it.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
