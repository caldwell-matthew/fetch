"""Insert a boot crash guard into every test that logs in (checklist 🟢 #4).

WHY
  `ErrorBoundary` (`mobile/index.tsx:30`, `Layout/ErrorBoundary.tsx:36-37`) wraps the whole
  app and, on a render crash, replaces the screen with "Something went wrong." and a
  "Reload page" button. When that happens at boot, the first thing the login prefix does is
  look for the shell - and fail on a locator that is simply not there, which reads as a
  locator bug or a slow login. Every suite, every DIAG and the verify scratch share that
  prefix, so one crash looks like fourteen unrelated reds.

  `MOB.900` already carries this guard, but only inside `MOB.990` and only on the home
  screen. This puts it where a crash at boot would actually be met.

WHERE IT GOES - BEFORE the shell assertion, not after
  Placed after "authenticated mobile shell rendered", a boot crash fails that step first and
  the guard never runs - it would be decoration. Placed before it, the guard names the crash,
  and the shell assertion that follows is the positive anchor that stops the absence from
  being vacuous (trap 5): the pair reads "no crash screen, AND the shell is there".

  On dev the boundary also prints the error message and stack in a <pre>, so the failing
  step's screenshot carries the actual crash.

Same shape as `add_role_guard.py`: idempotent (keyed on MARKER), JSON is the source of truth,
and every suite builder copies its login prefix from `MOB.000_Login_(Dev).json` at build
time - so patching MOB.000 is what keeps regenerated suites guarded.
"""
import json, glob, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import step, HERE  # noqa: E402

MARKER = "CRASH GUARD (boot)"
CRASH_TEXT = "Something went wrong."     # ErrorBoundary.tsx:36


def guard_step():
    return step("assertPageLacks",
                f'{MARKER}: the ErrorBoundary has NOT replaced the app — no "{CRASH_TEXT}"',
                {"value": CRASH_TEXT})


def has_login(steps):
    return any(s["type"] == "typeText" and "email" in s["name"].lower() for s in steps)


if __name__ == "__main__":
    changed = []
    for f in sorted(glob.glob(os.path.join(HERE, "*.json"))):
        d = json.load(open(f))
        steps = d["details"]["steps"]
        if not has_login(steps):
            continue
        if any(MARKER in s["name"] for s in steps):
            continue
        idx = next((i for i, s in enumerate(steps)
                    if "authenticated mobile shell" in s["name"]), None)
        if idx is None:
            print(f"SKIP  {d['details']['name']} - no shell assertion to anchor before")
            continue
        steps.insert(idx, guard_step())
        # keep the file's own indent, so the diff is the one inserted step
        second = open(f).read().split("\n", 2)[1]
        indent = len(second) - len(second.lstrip(" ")) or 4
        with open(f, "w") as fh:
            fh.write(json.dumps(d, indent=indent))
        changed.append(d["details"]["name"])

    print(f"added the boot crash guard to {len(changed)} test(s):")
    for n in changed:
        print("   ", n)
