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
  so an invalid form is a SILENT no-op - bugs §9).

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

    No search term: an empty query lists everything, then the option is picked by its text.
    (Written when lookups were case-sensitive - bugs §1, fixed in `cad415620c`. Still the
    simplest correct shape; a search term would now be safe.)
    """
    return [
        step("click", f"Focus the {label} lookup", {"element": field(field_id)}),
        step("wait", f"Wait for {label} options", {"value": 2}),
        step("click", f"Pick {pick}",
             {"element": xpath_el(COLLECTOR_URL,
                                  f'//*[@role="option"][contains(normalize-space(.), "{pick}")]')}),
    ]


# 🛑 HARD GUARD — this comment used to say "DO NOT RUN WITH DD_FORCE=1 once an upload step
# exists on MOB.600", and a comment cannot stop anything. MOB.600's `uploadFiles` step and the
# JS step that reveals the hidden file input can ONLY be authored in the Datadog UI (their
# bucketKey lives in Datadog's storage; no API mints one — trap 12), so regenerating would
# delete them permanently. If they are present in the JSON, refuse to touch the file.
_mob600 = os.path.join(HERE, "MOB.600_Collector_Create_Asset.json")
if os.path.exists(_mob600):
    _existing = json.load(open(_mob600))["details"]["steps"]
    if any(s["type"] == "uploadFiles" for s in _existing):
        print("SKIP  MOB.600 — it carries an ungeneratable uploadFiles step; refusing to "
              "overwrite. Edit the JSON directly (see dd_reference/README.md).")
        _skip600 = True
    else:
        _skip600 = False
else:
    _skip600 = False

if not _skip600:
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
          # ⚠️ THESE THREE WERE MISSING FROM THIS GENERATOR AND EXISTED ONLY IN THE JSON —
          # a DD_FORCE rebuild would have deleted MOB.600's PROOF OF CREATION and left a test
          # that only checks a form closed, which trap 6 says proves nothing here
          # (`createAsset` resolves optimistically). Restored from the JSON.
          step("assertElementPresent", "Test the form closed (affixed + button is back)",
               {"element": xpath_el(COLLECTOR_URL, '//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]//button')}),
          step("wait", "Wait for the collected list to refresh", {"value": 5}),
          step("assertPageContains", "PROOF OF CREATION: this run's asset is in the collected list",
               {"value": 'DD SYNTHETIC MOBILE {{ RUNID }}'}),
          step("assertPageContains", "Test the 'Asset collected' toast (optional: transient)",
               {"value": "Asset collected"}, optional=True),
          # ⭐ SERVER PROOF — added 2026-09-09 (bugs §34). "PROOF OF CREATION" above reads a row that
          # `prependTableResults` writes into the CLIENT cache, so it is green whether or not the
          # server ever received the asset — and from Aug 24 to Sep 9 it did not: collecting WITH a
          # photo sends the mutation with a `thumbnails` context that `UploadLink` hands to the
          # native bridge, which never resolves in a browser. Asset Lookup's search is a
          # `network-only` query, so a result row here is a server fact. Expect RED until fixed.
          go(BASE + "/asset-lookup", "SERVER PROOF: Asset Lookup (network-only search)"),
          step("wait", "Wait for the page to mount", {"value": 5}),
          step("click", "Focus the search input",
               {"element": xpath_el(BASE + "/asset-lookup", '//input[@name="asset-search"]')}, timeout=30),
          step("pressKey", "Select any persisted query first (typeText APPENDS — trap 17)",
               {"value": "a", "modifiers": ["Control"]}),
          step("typeText", "Search for this run's asset by its exact name",
               {"value": ASSET_NAME,
                "element": xpath_el(BASE + "/asset-lookup", '//input[@name="asset-search"]')}),
          step("pressKey", "Submit the search (Enter — there is no search button)", {"value": "Enter"}),
          step("wait", "Wait for the search results", {"value": 5}),
          step("assertElementPresent", "⭐ SERVER PROOF: the asset comes back from the SERVER — a "
               "result row carries this run's name (bugs §34: the collected list's row is "
               "client-prepended and proves nothing)",
               {"element": xpath_el(BASE + "/asset-lookup",
                                    '(//*[contains(concat(" ", normalize-space(@class), " "), '
                                    f'" mantine-Accordion-item ")])[1][contains(., "{ASSET_NAME}")]')},
               # `soft`, NOT optional: MOB.600 stays RED while §34 is open - but a critical
               # non-allowFailure red here ABORTS MOB.967 and its later children (MOB.623,
               # 627, 628) report red without ever running (the MOB.346 lesson).
               timeout=30, soft=True),
      ],
      TAGS + ["CRUD"],
      local_vars=[localvar("RUNID", "{{ numeric(8) }}", "12345678")],
  ))


print("wrote MOB.600 (collect asset)")
