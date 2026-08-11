"""Patch MOB.600 in place: close the photo modal, and stop trusting a negative assertion.

WHY THIS IS A PATCH AND NOT A GENERATOR CHANGE
  MOB.600 now carries two steps that can only be authored in the Datadog UI - the
  `uploadFiles` step (its bucketKey lives in Datadog's storage; no API mints one) and the
  `assertFromJavascript` step beside it. Re-running build_collector_tests.py would rebuild
  the test without them. The JSON in dd_tests_mobile/ is the source of truth from here on,
  so changes are applied to it directly. Idempotent.

THE BUG THIS FIXES - AN ASSERTION THAT COULD NOT FAIL
  The test reported PASS while the asset was never created. Every step went green,
  including `assertPageLacks "Submit"` - the step whose whole job was to prove the form
  closed. The screenshot showed the form still open.

  Cause: this form's submit button is labelled **"Create Asset"**, not "Submit"
  (`Form/index.tsx:241` - `buttonText={... : 'Create Asset'}`). The word "Submit" never
  appears on this page at all, so the assertion was VACUOUSLY TRUE on every run. It could
  not have failed. The pattern was copied from the work-order forms, whose SubmitButton
  does use the default "Submit" label - the copy was never re-checked against this form.

  Audited the rest: ui/Form.tsx, Conditions/Form.tsx, Failures/Form.tsx and AdHocForm.tsx
  have no buttonText override, so MOB.350-393's identical assertions are sound. MOB.600 was
  the only affected test.

  The lesson is bigger than the label: **an assertion that cannot fail is indistinguishable
  from a passing test.** A text-absence check silently degrades into a no-op the moment the
  text it names is not on the page. Pair it with a POSITIVE assertion, which fails loudly
  when the thing it names is missing.

WHAT CHANGES
  1. The text-absence check now names the real label, "Create Asset".
  2. pressKey Escape after the upload, closing the "Select Photo Source" modal so its
     overlay cannot swallow the Submit click. Mantine modals honour Escape; the close
     button has no reliable accessible name.
  3. A positive durable assertion: the affixed "+" button is rendered again. It is
     `mounted={!showForm}`, so its presence proves the form actually closed - something no
     text-absence check can establish, however it is worded.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import HERE, step, xpath_el, BASE  # noqa: E402

PATH = os.path.join(HERE, "MOB.600_Collector_Create_Asset.json")
COLLECTOR_URL = BASE + "/asset-collector"
ADD_BTN = '//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button'

ESCAPE_NAME = "Close the photo-source modal"
LACKS_NAME = "Test the form closed (durable success signal)"
POSITIVE_NAME = "Test the form closed (affixed + button is back)"

doc = json.load(open(PATH))
steps = doc["details"]["steps"]
names = [s.get("name") for s in steps]

changed = False

# 1. Fix the vacuous assertion: this form's button says "Create Asset", never "Submit".
for s_ in steps:
    if s_.get("type") == "assertPageLacks" and s_["params"].get("value") == "Submit":
        s_["params"]["value"] = "Create Asset"
        changed = True
        print('assertPageLacks value: "Submit" -> "Create Asset"')

# 2. Escape immediately after the upload, before Submit.
if ESCAPE_NAME not in names:
    idx = next(i for i, s in enumerate(steps) if s.get("type") == "uploadFiles")
    steps.insert(idx + 1, step("pressKey", ESCAPE_NAME, {"value": "Escape"}))
    steps.insert(idx + 2, step("wait", "Wait for the modal to close", {"value": 2}))
    changed = True
    print(f"inserted Escape + wait after step {idx + 1} (uploadFiles)")

# 3. Positive proof the form closed, alongside the existing text-absence check.
names = [s.get("name") for s in steps]
if POSITIVE_NAME not in names:
    idx = next(i for i, s in enumerate(steps) if s.get("type") == "assertPageLacks")
    steps.insert(idx + 1, step("assertElementPresent", POSITIVE_NAME,
                               {"element": xpath_el(COLLECTOR_URL, ADD_BTN)}))
    changed = True
    print(f"inserted positive assertion after step {idx + 1} (assertPageLacks)")

if changed:
    with open(PATH, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"\nMOB.600 now has {len(steps)} steps")
else:
    print("already patched")
