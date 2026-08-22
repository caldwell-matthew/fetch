"""Build MOB.122_Map_Create_Work - create a work order from the map (T2.6 + T2.1 entry point).

THE LAST UNCOVERED CREATE ENTRY POINT. The four are Mobile Map · Mobile Job asset ·
Asset Lookup · Work Orders; the other three are covered (MOB.396, Appendix A, MOB.300).

HOW THE POPUP IS REACHED - IT IS NOT A BUTTON ON THE MAP
  `MobileGeocoderPopup` only exists after a geocoder RESULT is chosen. So the path is:
  type an address -> pick a suggestion -> the map flies there and the popup opens -> Add Work.
  That is a real user interaction chain, not a shortcut, and each link is asserted.

TWO THINGS THE GEOCODER CONFIG DICTATES (src/.../geocoder/index.ts)
  minLength: 5   fewer than 5 characters and it never queries at all - a 3-letter search
                 term would look like "the geocoder is broken"
  limit: 2       at most two suggestions, so picking "the first" is safe
  placeholder    "Search by address" - the input's handle

DEPENDS ON AN EXTERNAL SERVICE
  Suggestions come from Mapbox's geocoding API over the network. That makes this the only
  mobile test with a third-party dependency: a Mapbox outage or a rate limit fails it for
  reasons that have nothing to do with MentorTwo. If it becomes flaky, that is WHY - do not
  chase it as an app bug, and consider whether the entry point is worth the coupling.

RESIDUE: creates a real work order per run, undeletable from mobile, tagged
`DD SYNTHETIC MOBILE`. Same standing terms as MOB.300/396/397.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write, localvar  # noqa: E402

MAP_URL = BASE + "/map"
WORKFLOW = "Datadog Test"
MARKER = "DD SYNTHETIC MOBILE {{ RUNID }}"
RUNID = localvar("RUNID", "{{ numeric(8) }}", "48120735")
# >= 5 chars or the geocoder never queries (minLength: 5). A well-known address keeps the
# result stable across runs.
QUERY = "1600 Pennsylvania Ave"

CANVAS = '//canvas[contains(@class,"mapboxgl-canvas")]'
GEOCODER = '//input[@placeholder="Search by address"]'
SUGGESTION = ('(//ul[contains(concat(" ", normalize-space(@class), " "), " suggestions ")]'
              '//li)[1]')
ADD_WORK = '//button[contains(normalize-space(.), "Add Work")]'
CREATE_BTN = '//button[normalize-space(.)="Create Work Order"]'

write(test(
    "MOB.122_Map_Create_Work",
    "`MOB.122` Create a work order from the **Mobile Map** — the last uncovered create entry\n"
    "point.\n"
    "- ⚠️ **LEAVES RESIDUE**: a real work order per run, tagged `DD SYNTHETIC MOBILE`.\n"
    "- ⚠️ **The only mobile test with a third-party dependency.** Suggestions come from\n"
    "  Mapbox's geocoding API, so an outage or rate limit fails this for reasons unrelated to\n"
    "  MentorTwo. If it flaps, that is why — do not chase it as an app bug.\n"
    "- The popup is **not a button on the map**: it only exists once a geocoder result is\n"
    "  chosen. Type → pick a suggestion → the map flies there → `Add Work`. Every link in\n"
    "  that chain is asserted, so a failure names which one broke.\n"
    f"- The query is ≥5 characters on purpose — the geocoder's `minLength: 5` means a shorter\n"
    f"  term never queries at all and would look like a broken control. `limit: 2`, so\n"
    "  picking the first suggestion is safe.\n"
    "- No `defaultAsset` here, so the workflow list is not asset-filtered and `Datadog Test`\n"
    "  is findable by typing (unlike MOB.397 — see T2.1's note).",
    [
        go(MAP_URL, "the mobile map"),
        step("wait", "Let the map begin initialising", {"value": 5}),
        step("assertElementPresent", "The Mapbox canvas rendered",
             {"element": xpath_el(MAP_URL, CANVAS)}, timeout=60),

        # -------- geocoder search
        step("assertElementPresent", "The geocoder search control rendered",
             {"element": xpath_el(MAP_URL, GEOCODER)}, timeout=30),
        step("click", "Focus the geocoder", {"element": xpath_el(MAP_URL, GEOCODER)},
             timeout=30),
        step("typeText", f'Search for "{QUERY}" (>=5 chars, or it never queries)',
             {"value": QUERY, "element": xpath_el(MAP_URL, GEOCODER)}),
        step("wait", "Wait for the Mapbox geocoding response", {"value": 5}),
        step("assertElementPresent", "PROOF: the geocoder returned suggestions",
             {"element": xpath_el(MAP_URL, SUGGESTION)}, timeout=30),
        step("click", "Pick the first suggestion",
             {"element": xpath_el(MAP_URL, SUGGESTION)}, timeout=30),
        step("wait", "Let the map fly to the result and open its popup", {"value": 6}),

        # -------- the popup
        step("assertPageContains", "PROOF: the geocoder popup opened (it shows coordinates)",
             {"value": "Latitude"}),
        step("assertElementPresent", 'The popup offers "Add Work"',
             {"element": xpath_el(MAP_URL, ADD_WORK)}, timeout=30),
        step("click", 'Click "Add Work"', {"element": xpath_el(MAP_URL, ADD_WORK)},
             timeout=30),
        step("wait", "Wait for the create modal", {"value": 3}),
        step("assertPageContains", "The create modal opened FROM THE MAP",
             {"value": "Creating New Work Order"}),

        # -------- the form (same as MOB.300; no defaultAsset, so no asset filtering)
        step("click", "Focus the Workflow lookup",
             {"element": xpath_el(MAP_URL, '//*[@id="workflowTitleId"]')}, timeout=30),
        step("typeText", f"Search for the {WORKFLOW} workflow",
             {"value": WORKFLOW, "element": xpath_el(MAP_URL, '//*[@id="workflowTitleId"]')}),
        step("wait", "Wait for workflow options", {"value": 3}),
        step("click", f'Pick the "{WORKFLOW}" workflow',
             {"element": xpath_el(
                 MAP_URL,
                 f'//*[@role="option"][contains(normalize-space(.), "{WORKFLOW}")]')},
             timeout=30),
        step("typeText", "Type the synthetic marker into Problem Description",
             {"value": MARKER, "element": xpath_el(MAP_URL, '//*[@id="problemDesc"]')}),
        step("click", 'Click "Create Work Order"',
             {"element": xpath_el(MAP_URL, CREATE_BTN)}, timeout=30),
        step("wait", "Brief wait for the toast", {"value": 2}),
        step("assertPageContains", "Success toast (optional: transient, autoClose 5000)",
             {"value": "Work order successfully created!"}, optional=True),
        step("wait", "Wait for the create mutation to resolve", {"value": 5}),
        step("assertPageLacks", "PROOF: the modal closed inside Apollo's update()",
             {"value": "Creating New Work Order"}),
    ],
    ["Mobile", "env:dev", "Map", "Work Order", "CRUD", "residue"],
    local_vars=(RUNID,),
))

# ---------------------------------------------------------------- wire into MOB.986
suite_path = os.path.join(HERE, "MOB.986_WorkOrders_Extra_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
CHILD = "MOB.122_Map_Create_Work"
if CHILD not in [s.get("name") for s in steps]:
    steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                  "isCritical": True, "name": CHILD, "noScreenshot": False,
                  "type": "playSubTest",
                  "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"added {CHILD} to MOB.986_WorkOrders_Extra_Suite")
    print("REMINDER: add it to CHILDREN in build_work_finish_tests.py (trap 12)")

print("wrote MOB.122 (create work order from the map)")
