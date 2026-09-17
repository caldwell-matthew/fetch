"""Build the module suites from `suite_plan.py` — MOB.953–MOB.975.

Each suite logs in once (MOB.000's steps) and chains its children in the plan's run order. The
children's subtestPublicId values start as PENDING-WIRE-UP; `wire_suite.py` fills them from Datadog
once the children exist there, then the suites are pushed by name.

Suite tags: `Mobile`, `env:dev`, `Suite`, `module:<slug>` (added by `dd_tools.test()`), `class:read-only`
or `class:writes`, plus `run:alone` for Session and `device:phone` for Phone (`set_device.py` pins the
device from `_Phone_` in the name).

"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import step, test, write, HERE  # noqa: E402
from suite_plan import SUITES, suite_name, leaf_names, assert_complete  # noqa: E402

login_steps = json.load(open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]
CREDS = ("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD")

leaves = leaf_names()
assert_complete(leaves)


def sub(name):
    return step("playSubTest", name, {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1})


for sid, module, part, cls, blurb, children in SUITES:
    name = suite_name(sid, module, part)
    tags = ["Mobile", "env:dev", "Suite", f"class:{cls}"]
    if module == "session":
        tags.append("run:alone")
    if module == "phone":
        tags.append("device:phone")
    message = (f"`MOB.{sid}` {blurb}\n"
               "- Logs in once, then chains its subtests in the same browser session, in this order.\n"
               "- Children are listed in `suite_plan.py`, the only place suite membership is kept.")
    write(test(name, message, login_steps + [sub(leaves[c]) for c in children], tags, extra_globals=CREDS))
