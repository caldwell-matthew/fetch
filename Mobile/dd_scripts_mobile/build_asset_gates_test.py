"""Build MOB.575 - Failures and Condition on the ASSET DETAIL (T2.2).

WHAT IS ACTUALLY NEW HERE, AND WHAT IS NOT
  `Failures.tsx` and `ConditionAssessment.tsx` on the asset detail render the SAME forms that
  MOB.391 and MOB.390 already drive from the work order (`WorkOrders/components/Failures/Form`
  and `.../Conditions/Form`). Submitting again would re-prove their mutation and add a second
  permanent record per run for nothing.

  What IS new is the entry point: the asset arrives PRE-BOUND (`assets={asset}`), so there is
  no asset picker, and both tabs sit behind a data gate:

      Failures   `if (!asset.failureProfileId)` -> "A failure profile need to exist on an
                 asset in order to capture failure information"
      Condition  `if (!asset.assetStandardId)`  -> "An asset standard needs to exist on an
                 asset in order to do a condition assessment"

  So this test proves the GATES PASS for the fixture asset and the forms open. It deliberately
  does not submit - the same reasoning as MOB.398, and it keeps the test free of residue.

FIXTURE DEPENDENCY, STATED SO A FAILURE IS LEGIBLE
  `Tank 0000` has both a failure profile and an asset standard (owner, 2026-08-13). If either
  is removed, this test fails on the placeholder text - which is a FIXTURE change, not a code
  regression. The placeholder half of the checklist item cannot be tested at the same time,
  precisely because this asset has both.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, test, write, av_job_gate  # noqa: E402

JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
JOB_URL = f"{BASE}/asset-verify/{JOB_ID}"
ASSET = "Tank 0000"

ADD_BTN = '//button[normalize-space(.)="Add"]'
NO_PROFILE = "A failure profile need to exist"
NO_STANDARD = "An asset standard needs to exist"


def link(name):
    return f'(//span[contains(normalize-space(.), "{name}")])[last()]'


def tab(name):
    return f'//*[@role="tab"][contains(normalize-space(.), "{name}")]'


def open_tab_and_form(name, gate_text, field_id, field_label):
    """Open a tab, prove the data gate PASSED, open the form, prove the field renders, cancel."""
    return [
        step("click", f'Open the "{name}" tab', {"element": xpath_el(JOB_URL, tab(name))},
             timeout=30),
        step("wait", "Wait for the panel", {"value": 3}),
        # The gate's failure mode is a placeholder INSTEAD of the form, so asserting its
        # absence is what proves the gate passed - and it cannot pass vacuously because the
        # Add button is asserted next.
        step("assertPageLacks", f"GATE PASSED: no placeholder on the {name} tab",
             {"value": gate_text}),
        step("assertElementPresent", f'The "{name}" tab offers its Add button',
             {"element": xpath_el(JOB_URL, ADD_BTN)}, timeout=30),
        step("click", f"Open the {name} add form",
             {"element": xpath_el(JOB_URL, ADD_BTN)}, timeout=30),
        step("wait", "Wait for the form", {"value": 3}),
        step("assertElementPresent",
             f"PROOF: the {name} form opened with its {field_label} field",
             {"element": xpath_el(JOB_URL, f'//*[@id="{field_id}"]')}, timeout=30),
        # Cancel rather than submit: MOB.390/391 already prove these forms mutate, and
        # submitting here would add a second permanent record per run for no new information.
        step("pressKey", "Cancel out without submitting", {"value": "Escape"}, always=True),
        step("wait", "Wait for the form to close", {"value": 2}, always=True),
    ]


write(test(
    "MOB.575_AssetVerify_Failure_Condition_Forms",
    "`MOB.575` The **Failures** and **Condition** tabs on the asset detail open their forms.\n"
    "- READ-ONLY, and deliberately so: it opens each form and cancels. `MOB.390`/`MOB.391`\n"
    "  already prove these exact forms mutate from the work-order side — submitting again\n"
    "  would re-prove that and leave a second permanent record per run.\n"
    "- **What is new is the entry point and the data gates.** The asset arrives pre-bound\n"
    "  (`assets={asset}`, so no asset picker), and each tab is gated:\n"
    "  `!asset.failureProfileId` and `!asset.assetStandardId` replace the form with a\n"
    "  placeholder. Asserting the placeholder is ABSENT is what proves the gate passed.\n"
    f"- ⚠️ **Fixture-dependent**: `{ASSET}` has both a failure profile and an asset standard\n"
    "  (owner, 2026-08-13). If either is removed this fails on the placeholder text — a\n"
    "  fixture change, not a code regression.\n"
    "- The *placeholder* half of the checklist item cannot be covered here for the same\n"
    "  reason: this asset has both.",
    av_job_gate(JOB_ID) + [
        step("click", f"Open {ASSET}'s full-page detail",
             {"element": xpath_el(JOB_URL, link(ASSET))}, timeout=30),
        step("wait", "Let the asset detail begin rendering", {"value": 2}),
        step("assertPageContains", "The full-page asset detail rendered",
             {"value": "Asset Type:"}, timeout=30),
    ]
    + open_tab_and_form("Failure", NO_PROFILE, "failureTypeId", "failure type")
    + open_tab_and_form("Condition", NO_STANDARD, "assetStandardDetailId", "inspection group"),
    ["Mobile", "env:dev", "Asset Verification", "read-only"],
))

# ---------------------------------------------------------------- wire into MOB.993
suite_path = os.path.join(HERE, "MOB.993_AssetVerify_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
CHILD = "MOB.575_AssetVerify_Failure_Condition_Forms"
if CHILD not in [s.get("name") for s in steps]:
    steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                  "isCritical": True, "name": CHILD, "noScreenshot": False,
                  "type": "playSubTest",
                  "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"added {CHILD} to MOB.993_AssetVerify_Suite")

print("wrote MOB.575 (failure + condition form gates)")
