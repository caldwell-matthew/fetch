"""Build the Asset Collector tests.

MUTATES AND CANNOT BE UNDONE
  Collecting an asset creates a permanent Asset on dev. Mobile is delete-free, so every run
  leaves one behind - the same accepted trade-off as MOB.300's work order. Names carry the
  DD SYNTHETIC MOBILE marker plus a per-run id so they are trivially findable for cleanup.

WHY A GENERATED NAME
  MOB.300 types a fixed "DD SYNTHETIC MOBILE" into a work order description, which is fine
  because nothing enforces uniqueness there. An Asset name plausibly is constrained, and a
  collision would fail on the SECOND run with a validation error that looks nothing like its
  cause. `{{ RUNID }}` is a Datadog local variable expanded fresh per run, so the name is
  unique by construction. Defensive rather than confirmed - cheap insurance either way.

REQUIRED FIELDS
  The Asset insert input requires `name` and `typeId` only; `desc`, `systemId`, `tagNumber`
  and `notes` are optional. Treat that as a floor, not the truth: the RUNTIME schema
  (GET_SCHEMA `_info.fields`) can mark more fields required than the SDL shows - exactly how
  `unitPrice` broke MOB.380 twice. If submit silently does nothing, suspect a required field
  before suspecting the locator (SubmitButton is `type={isValid ? 'submit' : 'button'}`,
  so an invalid form is a SILENT no-op - bugs_found.md #9).

THE AFFIXED "+" BUTTON HAS NO ACCESSIBLE NAME
  `AffixedInsertButton` renders an icon-only Mantine ActionIcon: no text, no aria-label. It
  can only be located structurally, via the Mantine Affix wrapper. Same locator MOB.300 uses
  for the work-order equivalent, because it is the same component.

ATTACHMENTS CANNOT BE GENERATED FROM HERE
  A Datadog `uploadFiles` step references a `bucketKey` pointing at a file in Datadog's own
  storage. The Synthetics API exposes NO endpoint that creates one (there is nothing
  file-related in SyntheticsApi at all) - the file must be attached through the Datadog UI.

  *** DO NOT RUN THIS SCRIPT WITH DD_FORCE=1 ONCE AN UPLOAD STEP EXISTS ON MOB.600. ***
  Regenerating rebuilds the JSON without that step and the next push silently destroys it.
  This is not hypothetical: MOB.200's login steps were lost exactly this way. After the step
  is added in the UI, pull the test back down so the bucketKey lives in dd_tests_mobile/ and
  the JSON is the source of truth again - then regeneration is safe.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write, localvar  # noqa: E402

COLLECTOR_URL = BASE + "/asset-collector"
TAGS = ["Mobile", "env:dev", "Asset Collector"]

# Dev values. ASSET_TYPE is REQUIRED (typeId) and must exist in dev's Asset Type list.
ASSET_TYPE = "Actuator Tools"
ASSET_NAME = "DD SYNTHETIC MOBILE {{ RUNID }}"
ASSET_DESC = "Created by Datadog Synthetics - safe to delete"

PAGE_TITLE = '//*[@id="page-title"]//h4'
# Icon-only button with no accessible name - structural locator only. Identical to MOB.300.
ADD_BTN = '//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button'
SUBMIT = '//button[@form="asset-collector"]'


def field(field_id):
    return xpath_el(COLLECTOR_URL, f'//*[@id="{field_id}"]')


def lookup(field_id, label, pick):
    """Focus, wait, pick by text.

    No search term: the collector's lookups go through `defaultFilter`, and the
    case-sensitivity bug (bugs_found.md #1) makes typed queries unreliable across this
    codebase. An empty query lists everything, then the option is picked by its text.
    """
    return [
        step("click", f"Focus the {label} lookup", {"element": field(field_id)}),
        step("wait", f"Wait for {label} options", {"value": 2}),
        step("click", f"Pick {pick}",
             {"element": xpath_el(COLLECTOR_URL,
                                  f'//*[@role="option"][contains(normalize-space(.), "{pick}")]')}),
    ]


write(test(
    "MOB.600_Collector_Create_Asset",
    "`MOB.600` Collect a new asset with the minimum required fields.\n"
    "- MUTATES AND CANNOT BE UNDONE: one permanent Asset per run. Mobile is delete-free, so\n"
    "  these accumulate on dev and need desktop cleanup. Named\n"
    f"  `{ASSET_NAME}` so they are easy to find.\n"
    "- `{{ RUNID }}` is a per-run Datadog local variable, so the name is unique by\n"
    "  construction. A fixed marker would collide on the second run if Asset.name is\n"
    "  uniqueness-constrained, and that failure would not look like its cause.\n"
    "- Required fields are `name` and `typeId`. If Submit appears to do nothing, suspect a\n"
    "  required field the runtime schema adds - an invalid form is a SILENT no-op.\n"
    "- Asserts the form closing as the durable signal; the 'Asset collected' toast is\n"
    "  optional because it is transient.",
    [
        go(COLLECTOR_URL, "the asset collector"),
        step("wait", "Wait for the collector to load its lookup cache", {"value": 15}),
        step("assertElementPresent", "Test the collector page rendered",
             {"element": xpath_el(COLLECTOR_URL, PAGE_TITLE)}),
        step("click", "Open the new-asset form (affixed + button)",
             {"element": xpath_el(COLLECTOR_URL, ADD_BTN)}),
        step("wait", "Wait for the form to mount", {"value": 3}),
        step("assertElementPresent", "Test the new-asset form opened",
             {"element": xpath_el(COLLECTOR_URL, SUBMIT)}),
        step("typeText", "Enter the asset name",
             {"value": ASSET_NAME, "element": field("name")}),
        step("typeText", "Enter the asset description",
             {"value": ASSET_DESC, "element": field("desc")}),
    ] + lookup("typeId", "asset type", ASSET_TYPE) + [
        step("click", "Submit the new asset", {"element": xpath_el(COLLECTOR_URL, SUBMIT)}),
        step("wait", "Wait for the collect mutation", {"value": 5}),
        step("assertPageLacks", "Test the form closed (durable success signal)",
             {"value": "Submit"}),
        step("assertPageContains", "Test the 'Asset collected' toast (optional: transient)",
             {"value": "Asset collected"}, optional=True),
    ],
    TAGS + ["CRUD"],
    local_vars=[localvar("RUNID", "{{ numeric(8) }}", "12345678")],
))

# ---------------------------------------------------------------- suite
# MOB.600 carries no login steps of its own, so it can only run as a subtest. A suite (over
# giving it its own login) keeps the login flow and the "role is exactly Admin" guard in one
# place - MOB.000 - and leaves room for more collector subtests without duplicating them.
login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]

write(test(
    "MOB.994_Collector_Suite",
    "Asset Collector.\n"
    "- Logs in once, then chains its subtests in the same browser session.\n"
    "- MUTATES dev and does NOT self-restore: every run collects a permanent asset named\n"
    f"  `{ASSET_NAME}`. Mobile is delete-free, so cleanup is a desktop job. Unlike\n"
    "  MOB.993, this suite cannot be left on a schedule without the asset count growing.\n"
    "- subtestPublicId values stay PENDING-WIRE-UP until the children exist on Datadog;\n"
    "  run wire_suite.py after pushing them.",
    login_steps + [step("playSubTest", "MOB.600_Collector_Create_Asset",
                        {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1})],
    ["Mobile", "env:dev", "Asset Collector", "suite"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))

print("wrote MOB.600 (collect asset), MOB.994 (suite)")
