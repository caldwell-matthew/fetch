#!/usr/bin/env python3
"""DATADOG-ERA. The old entry point onto legacy/Mobile/dd_scripts_mobile/ — the tests themselves are in e2e/ now.

    .venv/bin/python legacy/mobile.py                  # list the commands and what each costs
    .venv/bin/python legacy/mobile.py preflight        # every free check
    .venv/bin/python legacy/mobile.py replay MOB.310   # replay a test locally

It adds nothing but names: every command runs the existing script, from its own folder, with the same
arguments, and exits with its exit code. Anything that bills Datadog runs says so, with the count, before it
starts — see AGENTS.md: a Datadog run needs a go-ahead first.
"""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.join(ROOT, "Mobile", "dd_scripts_mobile")      # ROOT is legacy/ now
PY = sys.executable

# name: (argv prefix, Datadog cost, what it does)
COMMANDS = {
    "preflight": ([PY, "preflight.py"], "0", "every free check; must end in PREFLIGHT CLEAN before any Datadog run"),
    "replay":    ([PY, "local_run.py"], "0", "replay one test in local Chromium (headless); failures leave a "
                                              "screenshot + log in legacy/Mobile/local_runs/<test>/"),
    "timing":    ([PY, "local_timing.py"], "0", "time suites locally (all, or the ones named)"),
    "bench":     (["node", "check_js_assertions.js"], "0", "run every JavaScript assertion against its model pages"),
    "literals":  ([PY, "check_literals.py"], "0", "every string a test asserts vs the app source (needs MentorTwo)"),
    "sweep":     ([PY, "sweep_strings.py"], "0", "app strings no test asserts (needs MentorTwo)"),
    "drift":     ([PY, "check_drift.py"], "0", "do the build_*.py generators still produce the JSON?"),
    "suites":    (None, "0", "rebuild the suites from suite_plan.py, then re-wire their child ids"),
    "reset-av":  ([PY, "reset_av_fixture.py"], "0", "read back (--check) or restore (--apply) the Asset Verify fixture"),
    "push":      ([PY, "dd_tools.py", "push"], "0", "upload the NAMED tests to Datadog (never all by default)"),
    "verify":    ([PY, "verify.py"], "2 (3 if red)", "run ONE test on Datadog through the scratch suite"),
    "run":       ([PY, "dd_tools.py", "run"], "1 + tests", "run a whole suite on Datadog"),
    "pass":      ([PY, "full_pass.py"], "≈158", "a full manual pass in the schedule's safe order (--dry-run to see it)"),
    "probe":     ([PY, "schedule_probe.py"], "~1 a window", "the schedule probe: create | report | pause (bills while live)"),
}


def suite_cost(ref):
    """Billed runs for `run <suite>`: 1 + its tests, from suite_plan (None if `ref` is not a suite)."""
    sys.path.insert(0, SCRIPTS)
    from suite_plan import SUITES, suite_name
    for sid, module, part, _cls, _blurb, children in SUITES:
        if ref in (f"MOB.{sid}", suite_name(sid, module, part)):
            return 1 + len(children)
    return None


def usage():
    print(__doc__.split("\n\n")[0] + "\n")
    w = max(map(len, COMMANDS))
    print(f"  {'command':<{w}}  {'Datadog runs':<13} does")
    for name, (_argv, cost, does) in COMMANDS.items():
        print(f"  {name:<{w}}  {cost:<13} {does}")
    print("\nAnything above 0 needs a go-ahead first (AGENTS.md).")
    return 2


def main(argv):
    if not argv or argv[0] in ("-h", "--help", "help") or argv[0] not in COMMANDS:
        if argv and argv[0] not in ("-h", "--help", "help"):
            print(f"unknown command: {argv[0]}\n")
        return usage()
    name, args = argv[0], argv[1:]
    prefix, cost, _does = COMMANDS[name]

    if name == "suites":
        # The only correct sequence: rebuilding resets every suite's child ids to PENDING-WIRE-UP (hence the
        # override the builder demands), and wire_suite.py fills them back in from Datadog.
        env = dict(os.environ, DD_FORCE="1", DD_FORCE_WIRED="1")
        rc = subprocess.run([PY, "build_module_suites.py"], cwd=SCRIPTS, env=env).returncode
        return rc or subprocess.run([PY, "wire_suite.py"], cwd=SCRIPTS).returncode

    if name == "run":
        costs = [suite_cost(a) for a in args if not a.startswith("-")]
        known = [c for c in costs if c]
        total = f"{sum(known)} runs" if known and len(known) == len(costs) else "1 + its tests, per suite"
        print(f"⚠️  Datadog: this bills {total}.", flush=True)
    elif name == "pass" and "--dry-run" in args:
        pass                                   # the plan only — nothing bills
    elif cost != "0":
        print(f"⚠️  Datadog runs: {cost}.", flush=True)

    return subprocess.run(prefix + args, cwd=SCRIPTS).returncode


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
