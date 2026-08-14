"""Build the remaining Tier 3 chrome tests: back arrow and module-level resync.

Both READ-ONLY, both added to MOB.992_Menu_Suite.

FONTAWESOME ALIASES (trap 14)
  Neither control has an accessible name, so the icon IS the locator - and FA6 renders icons
  under their CANONICAL name, not the alias the code imports:
      faChevronDoubleLeft -> data-icon="chevrons-left"
      faSync              -> data-icon="arrows-rotate"
      faSortAlt           -> data-icon="arrow-down-arrow-up"
  Matching only the imported name fails on a perfectly healthy page.

  DO NOT GUESS THESE - look them up. Guessing cost three runs across this project
  ("chevron-double-left", then "angles-left", both wrong for faChevronDoubleLeft):

      node -e "console.log(require('@fortawesome/pro-regular-svg-icons').faSync.iconName)"

THE BACK ARROW IS NOT A BUTTON
  PageTitle.tsx:65 puts onClick directly on the <FontAwesomeIcon>, so the clickable element
  is an <svg> inside #page-title - there is no <button> to find.

RESYNC HAS NO DURABLE EFFECT TO ASSERT - BE HONEST ABOUT THAT
  Three loading labels exist on this page, and only one of them actually fires on resync:

    "Fetching data for lookups"    fetchingDropdownStuff - cleared as soon as
                                   fetchDropdownItems resolves, which on a warm cache is a
                                   microtask. FAILED in a real run for exactly this reason.
    "Fetching mobile job list"     (loading || !data?.mobileJobs). clearCache does NOT evict
                                   the list query, and useQuery has no
                                   notifyOnNetworkStatusChange, so refetch() never flips
                                   `loading`. This label does not appear on resync at all.
    "Fetching mobile job details"  downloadingDetails.size > 0. clearCache rewrites each
                                   job's details with receivedAt: null, so wasFetchedAfter
                                   fails and the batched re-download starts - a real
                                   multi-request window. This is the one to watch.

  Even so it is TRANSIENT, so it is asserted as OPTIONAL. What the test proves critically is
  that the control renders with a timestamp, the click does not break the page, and nothing
  is left hanging. The checklist records this as [~], not [x] - resync leaves no durable
  observable difference, and pretending otherwise would be a green light that means nothing.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write  # noqa: E402

WORK_URL = BASE + "/work"
LOOKUP_URL = BASE + "/asset-lookup"
JOBS_URL = BASE + "/asset-verify"
FIXTURE_JOB = "DATADOG MOBILE JOB"
TAGS = ["Mobile", "env:dev", "Chrome", "read-only"]


def icon(*names):
    """Match an icon by any of its FA names, as data-icon or as a fa- class."""
    parts = []
    for n in names:
        parts.append(f'@data-icon="{n}"')
        parts.append(f'contains(concat(" ", normalize-space(@class), " "), " fa-{n} ")')
    return " or ".join(parts)


BACK_ARROW = f'//*[@id="page-title"]//*[{icon("chevrons-left", "chevron-double-left", "angles-left")}]'
RESYNC = f'//button[.//*[{icon("sync", "arrows-rotate", "rotate")}]]'


def title(text):
    return f'//*[@id="page-title"]//h4[contains(normalize-space(.), "{text}")]'


# ---------------------------------------------------------------- back arrow
write(test(
    "MOB.450_Global_Back_Arrow",
    "`MOB.450` The page-title back arrow returns to the previous route.\n"
    "- READ-ONLY. Pure navigation.\n"
    "- Builds real history first (`/work` → `/asset-lookup`) then goes back, so the\n"
    "  assertion is that we landed on the SPECIFIC previous page, not merely that the app\n"
    "  navigated somewhere.\n"
    "- The arrow is an `<svg>` with `onClick` on it (`PageTitle.tsx:65`), not a button, and\n"
    "  has no accessible name — so the icon is the locator. The Pro package renders\n"
    "  `faChevronDoubleLeft` as `chevrons-left` — looked up, not guessed (trap 14).",
    [
        go(WORK_URL, "/work"),
        step("wait", "Wait for the work list", {"value": 8}),
        step("assertElementContent", 'Start on "Work Orders"',
             {"check": "contains", "value": "Work Orders",
              "element": xpath_el(WORK_URL, title("Work Orders"))}),
        go(LOOKUP_URL, "/asset-lookup"),
        step("wait", "Wait for asset lookup", {"value": 6}),
        step("assertElementContent", 'Now on "Asset Lookup"',
             {"check": "contains", "value": "Asset Lookup",
              "element": xpath_el(LOOKUP_URL, title("Asset Lookup"))}),
        step("click", "Click the back arrow",
             {"element": xpath_el(LOOKUP_URL, BACK_ARROW)}),
        step("wait", "Wait for the previous route", {"value": 6}),
        step("assertElementContent", 'PROOF: back arrow returned to "Work Orders"',
             {"check": "contains", "value": "Work Orders",
              "element": xpath_el(WORK_URL, title("Work Orders"))}),
    ],
    TAGS,
))

# ---------------------------------------------------------------- module resync
write(test(
    "MOB.460_Global_Module_Resync",
    "`MOB.460` The module-level ResyncButton actually triggers a resync.\n"
    "- READ-ONLY. Refetches data; writes nothing.\n"
    "- `ResyncButton` renders `Data synced on <timestamp>` and returns `null` when there is\n"
    "  no `lastFetched`, so the label's presence is also proof the control exists at all.\n"
    "- **Resync leaves no durable observable difference**, so this cannot be an `[x]`. The\n"
    "  only signal is a transient loading label (`Fetching mobile job details`), asserted\n"
    "  as OPTIONAL. `Fetching data for lookups` was tried first and lost the race; \n"
    "  `Fetching mobile job list` never fires here at all — clearCache does not evict the\n"
    "  list query and refetch does not flip `loading`.\n"
    "- What IS proven: the control renders with a timestamp, the click does not break the\n"
    "  page, and nothing is left hanging.\n"
    "- Distinct from MOB.410, which exercises the *menu* ReSync item, not the module one.",
    [
        go(JOBS_URL, "the mobile job list"),
        step("wait", "Wait for the job list and its prefetch", {"value": 30}),
        step("assertPageLacks", "Baseline: the prefetch has settled",
             {"value": "Fetching data for lookups"}),
        step("assertPageContains", "The resync timestamp is rendered",
             {"value": "Data synced on"}),
        step("click", "Click the module resync button",
             {"element": xpath_el(JOBS_URL, RESYNC)}),
        step("wait", "Let the list refetch return and the detail download start",
             {"value": 3}),
        # Transient by nature - optional, and the checklist says [~] because of it.
        step("assertPageContains",
             "Resync fired: job details are re-downloading (optional: transient)",
             {"value": "Fetching mobile job details"}, optional=True),
        step("wait", "Wait for the resync to finish", {"value": 30}),
        step("assertPageLacks", "Nothing left hanging after the resync",
             {"value": "Fetching mobile job details"}),
        step("assertPageContains", "The job list still renders after resync",
             {"value": FIXTURE_JOB}),
    ],
    TAGS,
))

# ---------------------------------------------------------------- wire into MOB.992
suite_path = os.path.join(HERE, "MOB.992_Menu_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
names = [s.get("name") for s in steps]
added = []
for child in ["MOB.450_Global_Back_Arrow", "MOB.460_Global_Module_Resync"]:
    if child not in names:
        steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                      "isCritical": True, "name": child, "noScreenshot": False,
                      "type": "playSubTest",
                      "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
        added.append(child)
if added:
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print("added to MOB.992:", ", ".join(added))

print("wrote MOB.450 (back arrow), MOB.460 (module resync)")
