"""Force every MOB.* test onto a single device (chrome.tablet).

WHY
  Datadog runs each entry in device_ids as its own CONCURRENT browser session. Every
  mutating test in this suite drives the SAME fixture work order, so two devices race on
  shared server state. Observed directly: with both devices live, chrome.tablet failed
      MOB.320  Test status is now "Complete"
  because the chrome.mobile_small session was simultaneously walking that same work order
  to a different status. The assertion is correct; the state moved underneath it.

  This hid for several runs because one device kept dying at login, leaving a single
  session to run alone - which looked like a clean pass and made MOB.350-380 appear
  verified across "four consecutive runs" that were really four single-device runs.

  Fixing it per-test is not possible: Datadog cannot serialize devices, and it cannot bind
  a different fixture id per device without duplicating every test.

Idempotent. Run after any build script, since dd_tools.test() also emits tablet-only.
"""
import os, sys, json, glob

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import TESTS  # noqa: E402

DEVICES = ["chrome.tablet"]

changed = 0
for path in sorted(glob.glob(os.path.join(TESTS, "*.json"))):
    doc = json.load(open(path))
    opts = doc["details"].setdefault("options", {})
    if opts.get("device_ids") == DEVICES:
        continue
    print(f"{os.path.basename(path):42} {opts.get('device_ids')} -> {DEVICES}")
    opts["device_ids"] = list(DEVICES)
    with open(path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    changed += 1

print(f"\n{changed} test(s) updated" if changed else "\nall tests already tablet-only")
