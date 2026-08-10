"""Insert a wait between the app navigation and the first login keystroke.

WHY
  A whole suite run aborted with:
      Type email -> No element found using locator: //input[@name="email"].
  Not a locator problem - the locator is right and the same run's later login steps all
  passed. The SSO page is a React app, so on a cold/slow load the input simply is not in
  the DOM yet when the very first typeText fires. Every login-bearing test inherits the
  same steps, so one flake here costs an entire suite (~150 steps) and reads as a Work
  Orders failure, which is actively misleading when triaging.

  goToUrl resolves on navigation, not on hydration, so nothing in the existing sequence
  waits for the form. Everything after the login already has waits; this was the one gap.

Idempotent: skips a file that already has the wait. Patches the JSON directly because the
login steps live in the JSON, not in a generator (see dd_tools.write's docstring).
"""
import os, sys, json, glob

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import TESTS, step  # noqa: E402

WAIT_NAME = "Wait for the SSO login form to hydrate"

for path in sorted(glob.glob(os.path.join(TESTS, "*.json"))):
    doc = json.load(open(path))
    steps = doc["details"]["steps"]
    names = [s.get("name") for s in steps]
    if "Type email" not in names or WAIT_NAME in names:
        continue
    steps.insert(names.index("Type email"), step("wait", WAIT_NAME, {"value": 5}))
    with open(path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"patched {os.path.basename(path)}")
