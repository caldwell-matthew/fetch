"""Build the Asset Verification core: read a job, then verify/unverify one asset.

FIXTURE  Z0EVwQcdJZhMURcBFkp0E0 - crew Admin, status IN_PROGRESS, exactly 2 assets,
         neither verified at rest.

WHY THAT EXACT SHAPE MATTERS - it is what makes these tests repeatable.
  VerificationCheckbox's update() runs on BOTH verify and unverify, and can only move the
  job status FORWARD (bugs_found.md #10):

      if (assetsVerified === assets.length && status !== 'COMPLETED') -> COMPLETED
      if (assetsVerified && status === 'READY')                       -> IN_PROGRESS

  Nothing produces READY; nothing reverses COMPLETED. So verifying every asset would
  complete the fixture permanently, and no later run could put it back.

  With 2 assets, already IN_PROGRESS, verifying exactly ONE makes both branches
  unreachable: 1 === 2 is false, and status === 'READY' is false. The run therefore
  mutates nothing but the single asset flag it restores.
  => Do not verify both assets here, and do not point these at a READY job.

THE JOB DETAIL PAGE IS cache-only
  Job.tsx queries MOBILE_JOB_DETAILS with fetchPolicy:'cache-only' and bails out with
  `if (!job || !schemaQuery) return null`. A cold deep-link renders a BLANK PAGE - there
  is no network fallback. The cache is filled by index.tsx, which batch-downloads job
  details (3 at a time) and runs fetchDropdownItems/prefetchAssetAttributeLookups off the
  job list. So visiting /asset-verify first is REQUIRED, not merely an optimisation.

DO NOT ASSERT THE TOAST
  VerificationCheckbox calls toast.success BEFORE client.mutate and never awaits it
  (bugs_found.md #11), so the toast proves only that the handler ran - not that anything
  persisted. The counter text and the Verified-filter contents are the real signals.

FILTER STATE LEAKS BETWEEN SUBTESTS
  The Verified/Unverified/All filter persists in sessionStorage (FILTER_KEY), and a suite
  runs every subtest in ONE browser session. So a subtest must never assume it starts on
  'All' - each one sets the filter it needs, and leaves it on 'All'.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write  # noqa: E402

FIXTURE_ID = "Z0EVwQcdJZhMURcBFkp0E0"
FIXTURE_NAME = "DATADOG MOBILE JOB"
JOBS_URL = BASE + "/asset-verify"
JOB_URL = f"{JOBS_URL}/{FIXTURE_ID}"
TAGS = ["Mobile", "env:dev", "Asset Verification"]

TOTAL = 2
BASELINE = f"0 out of {TOTAL} Assets Verified"
ONE_DONE = f"1 out of {TOTAL} Assets Verified"
EMPTY = "No assets found."

# SegmentedControlWithIcons -> Mantine SegmentedControl: one <label> per option wrapping a
# radio input and a <span> with the text. Match the span EXACTLY: "Verified" is a substring
# of "Unverified", so contains() would hit both and Datadog errors on multiple matches.
def filt(label):
    return f'//label[.//span[normalize-space(.)="{label}"]]'


PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]'
SEARCH_INPUT = '//input[@placeholder="Find Mobile Job(s)"]'
CHECKBOX = '//input[@type="checkbox"]'
FIRST_CHECKBOX = '(//input[@type="checkbox"])[1]'


def open_job():
    """/asset-verify first is MANDATORY - the detail query is cache-only (see module docs).

    This is a READINESS GATE, not a fixed sleep. index.tsx exposes exactly the signals we
    need, so each stage is asserted instead of guessed at:

        "Find Mobile Job(s)"          search box - the job list itself has rendered
        "Fetching data for lookups"   dropdown prefetch in progress
        "Fetching mobile job details" batched MOBILE_JOB_DETAILS downloads in progress

    Asserting the two loading labels are GONE proves the cache is warm. A blind wait cannot,
    and the first version of this test used one: it waited 30s, moved on, and failed on a
    blank detail page with nothing to say about why.

    The staged asserts also localise the failure, which matters because the job list is
    filtered by BOTH crew and app (`mobileJobsForCrew(app: ASSET_VERIFICATION)`). A job on
    another crew, or an ASSET_COLLECTOR job, is silently absent here - and the only symptom
    downstream is a blank page from the cache-only detail query.
    """
    return [
        go(JOBS_URL, "the asset verification job list"),
        step("wait", "Wait for the page to mount", {"value": 10}),
        step("assertElementContent", 'Test the "Mobile Jobs" page mounted',
             {"check": "contains", "value": "Mobile Jobs",
              "element": xpath_el(JOBS_URL, PAGE_TITLE)}),
        step("wait", "Wait for the lookup prefetch and batched detail downloads",
             {"value": 25}),
        # The search box only renders once `data?.mobileJobs && sortedFilteredList` is
        # truthy, so its presence IS the "list has rendered" signal.
        # NB: placeholder is an ATTRIBUTE, not page text - assertPageContains can never
        # match it. The first version of this gate used assertPageContains("Find Mobile
        # Job(s)") and failed on a fully healthy page. MOB.140 already had this right.
        step("assertElementPresent", "Test the job list rendered",
             {"element": xpath_el(JOBS_URL, SEARCH_INPUT)}),
        step("assertPageLacks", "Test the lookup prefetch finished",
             {"value": "Fetching data for lookups"}),
        step("assertPageLacks", "Test the batched job-detail downloads finished",
             {"value": "Fetching mobile job details"}),
        # Prove the fixture is actually IN this crew's ASSET_VERIFICATION list before
        # deep-linking. Without this, a job on the wrong crew or with app=ASSET_COLLECTOR
        # fails three steps later as an unexplained blank page.
        step("assertPageContains", f'FIXTURE GUARD: "{FIXTURE_NAME}" is in this crew\'s list',
             {"value": FIXTURE_NAME}),
        go(JOB_URL, "the fixture verification job"),
        step("wait", "Wait for the job detail to render", {"value": 5}),
    ]


def set_filter(label):
    return [
        step("click", f'Switch to the "{label}" filter',
             {"element": xpath_el(JOB_URL, filt(label))}),
        step("wait", f"Wait for the {label} list to re-render", {"value": 2}),
    ]


# ---------------------------------------------------------------- read
write(test(
    "MOB.500_AssetVerify_Job_Read",
    "`MOB.500` Read the fixture verification job.\n"
    f"- Deep-links to `/asset-verify/{FIXTURE_ID}` after warming the cache from the job\n"
    "  list. The detail query is `cache-only` and returns `null` without that warm-up, so\n"
    "  the list visit is required, not an optimisation.\n"
    f"- Asserts the resting state `{BASELINE}`, which doubles as a FIXTURE GUARD: if a\n"
    "  previous run died between verify and unverify, this fails immediately with a clear\n"
    "  message instead of letting the drift propagate.\n"
    "- Leaves the filter on All, because filter state persists in sessionStorage and the\n"
    "  suite shares one browser session.",
    open_job() + [
        step("assertPageContains", "Test the verification progress counter renders",
             {"value": "Assets Verified"}),
        step("assertPageContains", f'FIXTURE GUARD: job is at rest ("{BASELINE}")',
             {"value": BASELINE}),
        step("assertElementPresent", "Test the All/Unverified/Verified filter renders",
             {"element": xpath_el(JOB_URL, filt("Unverified"))}),
    ] + set_filter("Verified") + [
        step("assertPageContains", "Test the Verified tab is empty at rest", {"value": EMPTY}),
    ] + set_filter("Unverified") + [
        step("assertPageLacks", "Test the Unverified tab is NOT empty at rest",
             {"value": EMPTY}),
    ] + set_filter("All"),
    TAGS + ["read-only"],
))

# ---------------------------------------------------------------- verify / unverify
write(test(
    "MOB.510_AssetVerify_Verify_Unverify",
    "`MOB.510` Verify one asset, prove it moved tabs, then put it back.\n"
    "- SELF-RESTORING: verifies exactly ONE of the two assets and unverifies the same one,\n"
    f"  so `{FIXTURE_ID}` ends every run exactly as it started.\n"
    "- Deliberately does NOT verify both. Verifying every asset would flip the job to\n"
    "  COMPLETED, and `VerificationCheckbox` can never move a status back - unverifying\n"
    "  afterwards would leave a COMPLETED job holding unverified assets (bugs_found #10).\n"
    "- The unverify click targets the Verified tab, where exactly one row exists, so the\n"
    "  locator is unambiguous without needing to know the asset's name.\n"
    "- Asserts the counter and the tab contents, NOT the toast: the toast fires before the\n"
    "  mutation is sent and is never awaited (bugs_found #11).",
    open_job() + set_filter("All") + [
        step("assertPageContains", f'FIXTURE GUARD: job is at rest ("{BASELINE}")',
             {"value": BASELINE}),
        # Either asset will do - the test never depends on WHICH one, only that the same
        # one is put back, which the Verified tab guarantees.
        step("click", "Verify the first asset",
             {"element": xpath_el(JOB_URL, FIRST_CHECKBOX)}),
        step("wait", "Wait for the verify mutation", {"value": 3}),
        step("assertPageContains", f'Test the counter incremented ("{ONE_DONE}")',
             {"value": ONE_DONE}),
    ] + set_filter("Verified") + [
        step("assertPageLacks", "Test the verified asset now appears on the Verified tab",
             {"value": EMPTY}),
        # Exactly one row here, so a bare checkbox locator is unique - this is what lets the
        # test restore the SAME asset it verified without knowing its name.
        step("click", "Unverify that asset from the Verified tab",
             {"element": xpath_el(JOB_URL, CHECKBOX)}),
        step("wait", "Wait for the unverify mutation", {"value": 3}),
        step("assertPageContains", "Test the Verified tab is empty again", {"value": EMPTY}),
    ] + set_filter("All") + [
        step("assertPageContains", f'RESTORED: job is back at rest ("{BASELINE}")',
             {"value": BASELINE}),
    ],
    TAGS + ["CRUD"],
))

# ---------------------------------------------------------------- asset data tabs
# THESE TABS ARE HARDCODED, NOT TEMPLATE-DRIVEN - so they can be asserted BY NAME.
#
# There are two different tab systems in this area and they are easy to confuse:
#   /asset-verify/:jobId/asset/:id  (AssetDetails.tsx)   -> template-driven sections
#   asset row expanded on the job page (AssetLookupDetails) -> the five below, hardcoded
#     AssetLookupDetails/index.tsx:81 builds a synthetic template with exactly:
#       General Info · Attributes · Photos · Docs · Work History
# "Work History" is not a MobileJobTemplateSectionType value at all, which is the tell that
# these cannot be coming from a template. Job.tsx renders AssetLookupDetails inside each
# Accordion.Panel, so expanding an asset row is what surfaces them.
#
# Asserting the tab STRIP and switching, not panel contents: what each panel shows depends
# on that asset having attributes / photos / work history, none of which the fixture
# guarantees. Tab switching is the part that is data-independent and always meaningful.
ASSET_TABS = ["General Info", "Attributes", "Photos", "Docs", "Work History"]
FIRST_ITEM = '(//*[contains(@class,"mantine-Accordion-item")])[1]'
ACCORDION = FIRST_ITEM + '//*[contains(@class,"mantine-Accordion-control")]'


def tab(label, active=False):
    """Scope the tab to the accordion ITEM we expanded, not the whole page.

    Mantine's Accordion.Panel defaults to keepMounted, so EVERY asset row's panel is in the
    DOM whether or not it is open - and each one renders its own AssetLookupDetails with its
    own full tab strip. With two assets that is two "General Info" tabs, and Datadog errors
    with "Multiple elements found" rather than picking the visible one. Exactly the trap
    that MOB.390's score dropdowns hit, from the same Mantine keepMounted default.

    Anchoring to `(mantine-Accordion-item)[1]` ties the locator to the row the test actually
    expanded, so it stays correct no matter how many assets the job has. Preferred over
    indexing the global tab list, which would silently point at the wrong row if the
    expanded row were ever not the first.
    """
    return (f'{FIRST_ITEM}//*[@role="tab"][normalize-space(.)="{label}"]'
            + ("[@data-active]" if active else ""))


tab_steps = []
for label in ASSET_TABS:
    tab_steps += [
        step("click", f'Switch to the "{label}" tab',
             {"element": xpath_el(JOB_URL, tab(label))}),
        step("wait", "Wait for the panel to mount", {"value": 2}),
        step("assertElementPresent", f'Test the "{label}" tab is active',
             {"element": xpath_el(JOB_URL, tab(label, active=True))}),
    ]

write(test(
    "MOB.520_AssetVerify_Asset_Tabs",
    "`MOB.520` Expand an asset on the fixture job and step through all five data tabs.\n"
    "- READ-ONLY. Expanding an accordion row and switching tabs mutates nothing.\n"
    "- The tabs come from `AssetLookupDetails`, which HARDCODES them "
    "(`General Info · Attributes · Photos · Docs · Work History`) - they are NOT the\n"
    "  template-driven sections used by the `/asset/:id` detail route. `Work History` is\n"
    "  not even a `MobileJobTemplateSectionType`, which is how you can tell the two apart.\n"
    "- Asserts the tab strip and the active state on each tab, not panel contents: what a\n"
    "  panel renders depends on the asset having attributes / photos / work history, which\n"
    "  the fixture does not guarantee. Switching is the data-independent part.\n"
    "- Only one accordion row opens at a time (`Job.tsx` leaves Mantine's `multiple` off),\n"
    "  so exactly one tab strip exists and the by-name locators stay unique.",
    open_job() + set_filter("All") + [
        step("click", "Expand the first asset row",
             {"element": xpath_el(JOB_URL, ACCORDION)}),
        step("wait", "Wait for the asset detail panel to mount", {"value": 3}),
        step("assertElementPresent", "Test a tab strip is rendered",
             {"element": xpath_el(JOB_URL, f'({FIRST_ITEM}//*[@role="tab"])[1]')}),
    ] + tab_steps,
    TAGS + ["read-only"],
))

print("wrote MOB.500 (job read), MOB.510 (verify/unverify), MOB.520 (asset tabs)")


# ---------------------------------------------------------------- search / filter / sort
# THE SB BLOCK, BUILT WHERE IT CAN ACTUALLY BE PROVEN.
#   The shared "SB" checklist block wants "type a term, verify results". MOB.340 types into
#   the work list but cannot verify anything, because no work order in the crew's list is
#   known-stable. Here we DO have a known record - the fixture job - so filtering can be
#   proven with a NEGATIVE assertion: search something that cannot match and assert the job
#   is gone. Without that leg, a search test only proves the input accepts text.
#
# NO CLEARING NEEDED
#   Datadog's typeText appends, so instead of clearing the box the test types a matching
#   term, asserts, then appends junk to make the SAME query non-matching. Avoids relying on
#   a clear/select-all that Datadog does not express cleanly.
#   The search box is component state (useDebouncedState), NOT sessionStorage, so navigating
#   away resets it - unlike the sort, which persists (see below).
#
# STATUS FILTER
#   JobStatusSummary renders one <li> per status with the text "In Progress: 3". Clicking
#   toggles (`setSelectedStatus(c => c === status ? '' : status)`), so every click here is
#   paired with a second click that restores the unfiltered list.
#   The fixture job is IN_PROGRESS, so selecting READY must HIDE it - that negative is the
#   assertion that proves the filter filters.
#
# SORT: OPENS ONLY, DELIBERATELY
#   Two reasons not to select an option. (1) The labels are built from the schema as
#   `${column.label} ▲/▼`, so hardcoding one is a guess. (2) Proving a sort ORDER needs at
#   least two known records in a known order, and only one job in this list is known.
#   Selecting would also persist to sessionStorage (`mobile-MobileJob-sort`) and leak into
#   later subtests. Verifying real ordering is tracked in Appendix B, pending the two
#   fixture asset names.
SEARCH_JOBS = '//input[@placeholder="Find Mobile Job(s)"]'
# FontAwesome 6 renders `faSortAlt` under its CANONICAL name, `arrow-down-arrow-up` -
# "sort-alt" is only an alias. Match every variant, exactly as MOB.340 does; a locator
# naming just one of them fails on a perfectly healthy page.
SORT_BTN = ('//button[.//*[@data-icon="sort-alt"'
            ' or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ")'
            ' or @data-icon="arrow-down-arrow-up"'
            ' or contains(concat(" ", normalize-space(@class), " "),'
            ' " fa-arrow-down-arrow-up ")]]')
NO_MATCH = "ZZZZ-NO-SUCH-JOB"


def legend(status):
    """One <li> per status, text like "In Progress: 3". The colon keeps it from matching a
    status badge elsewhere on the page."""
    return f'//li[contains(normalize-space(.), "{status}:")]'


write(test(
    "MOB.530_AssetVerify_Search_Filter_Sort",
    "`MOB.530` Search, status filter and sort on the mobile job list.\n"
    "- READ-ONLY. Nothing here mutates, so the suite stays self-restoring.\n"
    "- This is the **SB** block built where it can be proven: the fixture job is a known\n"
    "  record, so a non-matching search asserts it DISAPPEARS. MOB.340 can only prove the\n"
    "  work-list search box accepts text - no work order there is known-stable.\n"
    "- The status filter is proven the same way: the fixture is `IN_PROGRESS`, so selecting\n"
    "  `Ready` must hide it. Every filter click is paired with a second click to untoggle.\n"
    "- Sort is opened and dismissed but NOT applied: its labels are schema-derived, proving\n"
    "  an order needs two known records, and a selection would persist in sessionStorage\n"
    "  into later subtests.",
    open_job()[:-2] + [        # job list only - drop the deep-link into the fixture job
        step("assertPageContains", "Baseline: the fixture job is listed",
             {"value": FIXTURE_NAME}),

        # -------- status filter
        step("click", 'Filter by "Ready"',
             {"element": xpath_el(JOBS_URL, legend("Ready"))}),
        step("wait", "Wait for the list to re-filter", {"value": 2}),
        step("assertPageLacks", "PROOF: an IN_PROGRESS job is hidden by the Ready filter",
             {"value": FIXTURE_NAME}),
        step("click", 'Untoggle "Ready"',
             {"element": xpath_el(JOBS_URL, legend("Ready"))}),
        step("wait", "Wait for the list to restore", {"value": 2}),
        step("assertPageContains", "The fixture job is back", {"value": FIXTURE_NAME}),
        step("click", 'Filter by "In Progress"',
             {"element": xpath_el(JOBS_URL, legend("In Progress"))}),
        step("wait", "Wait for the list to re-filter", {"value": 2}),
        step("assertPageContains", "PROOF: the In Progress filter keeps the fixture job",
             {"value": FIXTURE_NAME}),
        step("click", 'Untoggle "In Progress"',
             {"element": xpath_el(JOBS_URL, legend("In Progress"))}),
        step("wait", "Wait for the list to restore", {"value": 2}),

        # -------- search
        step("click", "Focus the job search box",
             {"element": xpath_el(JOBS_URL, SEARCH_JOBS)}),
        step("typeText", "Search for the fixture job",
             {"value": FIXTURE_NAME, "element": xpath_el(JOBS_URL, SEARCH_JOBS)}),
        step("wait", "Wait for the 300ms search debounce", {"value": 2}),
        step("assertPageContains", "The fixture job matches its own name",
             {"value": FIXTURE_NAME}),
        # typeText APPENDS, so this makes the existing query non-matching without needing a
        # clear step - and proves the search actually filters rather than just accepting text.
        step("typeText", "Append junk so the query cannot match",
             {"value": NO_MATCH, "element": xpath_el(JOBS_URL, SEARCH_JOBS)}),
        step("wait", "Wait for the 300ms search debounce", {"value": 2}),
        step("assertPageLacks", "PROOF: a non-matching search hides the fixture job",
             {"value": FIXTURE_NAME}),

        # -------- sort (open/close only)
        step("click", "Open the sort dropdown",
             {"element": xpath_el(JOBS_URL, SORT_BTN)}),
        step("wait", "Wait for the sort modal", {"value": 2}),
        step("assertPageContains", "The Sort Criteria modal opened", {"value": "Sort Criteria"}),
        step("pressKey", "Dismiss the sort modal", {"value": "Escape"}),
        step("wait", "Wait for the modal to close", {"value": 2}),
        step("assertPageLacks", "The sort modal closed", {"value": "Sort Criteria"}),
    ],
    TAGS + ["read-only", "SB"],
))

print("wrote MOB.530 (search / filter / sort)")
