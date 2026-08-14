"""Build MOB.993_AssetVerify_Suite.

Kept out of build_suites.py on purpose: that script rewrites MOB.990/991/992, and their
subtestPublicId values are wired in after the fact by wire_suite.py. Regenerating them just
to add a fourth suite would reset three working suites to PENDING-WIRE-UP for no reason.

Order of operations, same as the other suites:
    push                -> creates MOB.500/510/993, assigns public ids
    wire_suite.py       -> fills in this suite's subtestPublicId values
    push                -> uploads the wired suite

Login steps are copied from MOB.000 rather than rebuilt, so the SSO flow and the
"role is exactly Admin" guard stay in one place.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import step, test, write, HERE  # noqa: E402

login_steps = json.load(open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]
CREDS = ("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD")
# keep COMPLETE - a child missing here is silently dropped on the next DD_FORCE rebuild
# and the suite then passes with the test ABSENT (trap 12). This list had drifted:
# MOB.520 and MOB.560 were live in the JSON but missing here.
CHILDREN = ["MOB.500_AssetVerify_Job_Read",
            "MOB.510_AssetVerify_Verify_Unverify",
            "MOB.520_AssetVerify_Asset_Tabs",
            "MOB.560_AssetVerify_Counts_Badges",
            "MOB.580_AssetVerify_Sort_Ordering",
            "MOB.590_AssetVerify_Unverified_Tab"]

write(test(
    "MOB.993_AssetVerify_Suite",
    "Asset Verification against the fixture mobile job `Z0EVwQcdJZhMURcBFkp0E0`.\n"
    "- Logs in once, then chains its subtests in the same browser session.\n"
    "- MUTATES dev, but self-restores: MOB.510 verifies exactly one of the job's two\n"
    "  assets and unverifies the same one. It must never verify both - that would flip the\n"
    "  job to COMPLETED, and the status can never be moved back (bugs_found #10).\n"
    "- Order matters. MOB.500 asserts the resting state and doubles as a fixture guard, so\n"
    "  it runs first and fails fast if a previous run left the job dirty.\n"
    "- subtestPublicId values stay PENDING-WIRE-UP until the children exist on Datadog;\n"
    "  run wire_suite.py after pushing them.",
    login_steps + [step("playSubTest", c,
                        {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1})
                   for c in CHILDREN],
    ["Mobile", "env:dev", "Asset Verification", "suite"],
    extra_globals=CREDS,
))

print("wrote MOB.993_AssetVerify_Suite")
