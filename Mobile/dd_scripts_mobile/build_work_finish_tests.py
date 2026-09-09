"""Finish T2.1 Work Orders - MOB.396/397/398/399 + MOB.986_WorkOrders_Extra.

  MOB.394  Permits tab                      READ-ONLY
  MOB.396  Create from a Mobile Job asset   RESIDUE - a real work order per run
  MOB.397  Assign Follow-up Work            RESIDUE - a real work order per run
  MOB.398  Assign Work Stage                READ-ONLY by design (see below)
  MOB.399  Warranties tab                   READ-ONLY

The two residue tests were approved by the repo owner 2026-08-12, on the same standing terms
as MOB.300: undeletable from mobile, tagged for desktop cleanup. The fixture work order has
the Assets and Warranties tabs (owner-confirmed), so those are asserted by NAME - MOB.330
only ever switched tabs positionally and never recorded which sections exist.

MOB.398 IS DELIBERATELY NON-MUTATING - DO NOT "COMPLETE" IT
  `ReassignWorkButton`'s crew lookup uses `notInCollection: true`, so it hides crews already
  assigned. A test that actually assigns passes once and then fails forever with
  "No element found" - the test having eaten its own fixture (trap 10), exactly like MOB.393
  does today. The repo owner chose the repeatable variant: open the modal, prove the crew
  form and its options render, cancel. It does NOT prove the assignment persists, and the
  checklist says so rather than implying full coverage.

DANGER - THE GEAR MENU IN MOB.397 CONTAINS "Delete Item"
  `WorkOrders/components/ui/Menu.tsx` renders Edit / Assign Follow-up Work / **Delete Item**
  in one dropdown. Mobile is delete-free (trap 2) and nothing here may click that entry, so
  the menu item is matched by EXACT text, never by position or a substring. Keep it that way.

  (That same file is where `wPerms.canDelete` - a field that does not exist - gates the whole
  menu, `bugs_found.md` §4b.)
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, HERE, step, xpath_el, go, test, write, localvar, jsassert,
                      av_job_gate)  # noqa: E402

WORK_URL = BASE + "/work"
WORK_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
WORK_DETAIL = f"{WORK_URL}/{WORK_ID}"
JOB_URL = BASE + "/asset-verify"
JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
JOB_DETAIL = f"{JOB_URL}/{JOB_ID}"
WORKFLOW = "Datadog Test"
MARKER = "DD SYNTHETIC MOBILE {{ RUNID }}"
RUNID = localvar("RUNID", "{{ numeric(8) }}", "48120735")

ROW = '(//*[contains(@class,"mantine-Accordion-item")])[1]'
JOBS_PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]'
JOBS_SEARCH = '//input[@placeholder="Find Mobile Job(s)"]'
# MATCH THE ASSET BY NAME, not by an inline style. The first version used
# `//span[contains(@style,"underline")]`, inferred from the Highlight component's inline
# `textDecoration: 'underline'` - and it did not match. Now that the fixture's asset names are
# known (owner, 2026-08-12) the link can be identified by the thing that actually identifies
# it. This also makes the test deterministic about WHICH asset it opens, rather than
# depending on list order.
FIXTURE_ASSET = "Tank 0000"        # the other is "A/C Motor 0002"
# CONTAINS, NOT AN EXACT MATCH. The rendered asset name carries a prefix (an emoji/icon), so
# `normalize-space(.)="Tank 0000"` matched nothing even though the name is right there.
# `[last()]` takes the INNERMOST matching span: TruncateText wraps the Highlight, so both
# spans contain the text and Datadog errors on multiple matches rather than choosing (trap 3).
# The innermost one is the Highlight, which is the element carrying the onClick.
ASSET_LINK = f'(//span[contains(normalize-space(.), "{FIXTURE_ASSET}")])[last()]'
CREATE_BTN = '//button[normalize-space(.)="Create Work Order"]'


def tab(name):
    return f'//*[@role="tab"][normalize-space(.)="{name}"]'


def open_work_detail():
    return [
        go(WORK_URL, "/work to warm the lookup cache"),
        step("wait", "Wait for the work list and lookup prefetch", {"value": 20}),
        go(WORK_DETAIL, "the fixture work order"),
        # Appendix F: 5s -> 2s settle floor, and the assertion POLLS (timeout=30) instead.
        # Datadog steps poll until their timeout - measured 58.2s against a 60s limit - so a
        # gate returns as soon as it is satisfied. The 20s /work wait above is NOT convertible:
        # it warms the lookup cache and its only readiness signals are negative (a `lacks` on a
        # loading label is true before loading starts too) or a colour, which is not assertable.
        step("wait", "Let the detail view begin rendering", {"value": 2}),
        step("assertPageContains", "Test work order detail rendered", {"value": "Status:"},
             timeout=30),
    ]


# Both workflow filters default ON, so a form opened WITH a defaultAsset shows a doubly
# filtered list and `Datadog Test` is not in it:
#   filterWorkflowByPMField  "Exclude PM Workflows"    - true from defaultValues (index.tsx:39)
#   filterWorkflowByAsset    "Filter Workflows By Asset" - auto-set true by the useEffect at
#                            index.tsx:51-65 WHEN the default asset actually has workflows
# That is why MOB.300 (no defaultAsset) finds the workflow while MOB.397's asset has
# workflows and hides it. Owner-confirmed 2026-08-12: turn both off and it appears.
# MOB.396 used to find it too because Tank 0000 had no workflows; on 2026-09-09 it did
# (`_workflows` for the asset came back non-empty, the effect set the toggle ON, and the
# option list read "No results found"). Fixture data on the shared dev box moves, so
# MOB.396 no longer assumes a starting state - see unfilter_workflows_any_state.
UNFILTER = [
    ('filterWorkflowByAsset', 'Filter Workflows By Asset'),
    ('filterWorkflowByPMField', 'Exclude PM Workflows'),
]

# Clicking a toggle is only correct if its starting state is known - a blind click on an
# already-off switch turns it ON. Both start ON here, so one click each turns them off, and
# this assertion proves that rather than assuming it. If the defaults ever change, this fails
# loudly instead of silently re-filtering the list.
BOTH_FILTERS_OFF = """
const ids = ['filterWorkflowByAsset', 'filterWorkflowByPMField'];
return ids.every(id => {
  const el = document.getElementById(id);
  return el && el.checked === false;
});
"""


def unfilter_workflows(url):
    out = []
    for fid, label in UNFILTER:
        # CLICK THE LABEL, NOT THE INPUT. Mantine visually hides the real checkbox and
        # renders a styled proxy, so targeting the input gives "Element located but it's
        # invisible" - it exists in the DOM and cannot be clicked. The <label for=...> is the
        # clickable surface. The JS check below still reads the INPUT's `checked`, because
        # that is the actual state.
        out.append(step("click", f'Turn OFF "{label}" (both default ON and hide the workflow)',
                        {"element": xpath_el(url, f'//label[@for="{fid}"]')}, timeout=30))
    out.append(step("wait", "Let the workflow list re-query unfiltered", {"value": 3}))
    out.append(jsassert("Both workflow filters are now OFF", BOTH_FILTERS_OFF))
    return out


# State-aware version. Reads each INPUT's `checked` and clicks its LABEL only when ON, so it
# is correct whichever way the auto-set effect (InsertForm/index.tsx:51-65) went this run.
# Not a poll: a click inside a polled body could fire again before React lands the flip and
# toggle it straight back. So: settle -> one click pass -> settle -> prove both OFF.
UNFILTER_ANY_STATE = """
const ids = ['filterWorkflowByAsset', 'filterWorkflowByPMField'];
let seen = 0;
for (const id of ids) {
  const el = document.getElementById(id);
  const lab = document.querySelector('label[for="' + id + '"]');
  if (!el || !lab) continue;
  seen += 1;
  if (el.checked) lab.click();
}
return seen === ids.length;
"""


def unfilter_workflows_any_state(url):
    return [
        # The effect queries the asset's workflows over the network and sets the toggle ON
        # when any come back. Click before that resolves and the `.then` overrides the click.
        step("wait", "Let the auto-filter effect settle (it queries the asset's workflows)",
             {"value": 3}),
        jsassert("Turn OFF whichever workflow filters are ON (reads the input, clicks the label)",
                 UNFILTER_ANY_STATE),
        step("wait", "Let the workflow list re-query unfiltered", {"value": 3}),
        jsassert("Both workflow filters are now OFF", BOTH_FILTERS_OFF, timeout=30),
    ]


def fill_work_form(url):
    """The insert form, as proven by MOB.300: workflow lookup then Problem Description."""
    return [
        step("click", "Focus the Workflow lookup",
             {"element": xpath_el(url, '//*[@id="workflowTitleId"]')}),
        step("typeText", f"Search for the {WORKFLOW} workflow",
             {"value": WORKFLOW, "element": xpath_el(url, '//*[@id="workflowTitleId"]')}),
        step("wait", "Wait for workflow options", {"value": 3}),
        step("click", f'Pick the "{WORKFLOW}" workflow',
             {"element": xpath_el(
                 url, f'//*[@role="option"][contains(normalize-space(.), "{WORKFLOW}")]')},
             timeout=30),
        step("typeText", "Type the synthetic marker into Problem Description",
             {"value": MARKER, "element": xpath_el(url, '//*[@id="problemDesc"]')}),
    ]


# ---------------------------------------------------------------- 396: create from an asset
write(test(
    "MOB.396_Work_Create_From_Asset",
    "`MOB.396` Create a work order from a **Mobile Job asset** — the `Add Work` button on the\n"
    "full-page asset detail (`AssetDetails.tsx:78`, `AddWorkButton defaultAsset={asset}`).\n"
    "- ⚠️ **LEAVES RESIDUE**: a real work order per run, undeletable from mobile, tagged\n"
    "  `DD SYNTHETIC MOBILE`. Approved by the repo owner 2026-08-12.\n"
    "- One of the **four** real create entry points (Mobile Map · Mobile Job asset · Asset\n"
    "  Lookup · Work Orders). The inherited *Asset Register* and *Hierarchy* entries do not\n"
    "  exist in mobile.\n"
    "- What is NEW versus MOB.300 is only the entry point and the pre-bound asset — same form,\n"
    "  same mutation — so this stays deliberately thin rather than re-testing the form.\n"
    "- Modal-close is genuine proof (trap 6): the insert form closes inside Apollo's\n"
    "  `update()` with no `optimisticResponse`, the same shape MOB.300 relies on.",
    # THE SHARED GATE, not a hand-rolled one. Trimming it is what made the first run of this
    # test fail at the "All" filter - see av_job_gate's docstring.
    av_job_gate(JOB_ID) + [
        step("click", f"Open {FIXTURE_ASSET}'s full-page detail",
             {"element": xpath_el(JOB_DETAIL, ASSET_LINK)}),
        step("wait", "Let the asset detail route begin rendering", {"value": 2}),
        step("assertPageContains", "The full-page asset detail rendered",
             {"value": "Asset Type:"}, timeout=30),
        step("click", 'Click "Add Work"',
             {"element": xpath_el(
                 JOB_DETAIL, '//button[contains(normalize-space(.), "Add Work")]')}),
        step("wait", "Wait for the create modal", {"value": 3}),
        step("assertPageContains", "The create modal opened from the ASSET entry point",
             {"value": "Creating New Work Order"}),
    ] + unfilter_workflows_any_state(JOB_DETAIL) + fill_work_form(JOB_DETAIL) + [
        step("click", 'Click "Create Work Order"',
             {"element": xpath_el(JOB_DETAIL, CREATE_BTN)}),
        step("wait", "Brief wait for the toast", {"value": 2}),
        step("assertPageContains", "Success toast (optional: transient, autoClose 5000)",
             {"value": "Work order successfully created!"}, optional=True),
        step("wait", "Wait for the create mutation to resolve", {"value": 5}),
        step("assertPageLacks", "PROOF: the modal closed inside Apollo's update()",
             {"value": "Creating New Work Order"}),
    ],
    ["Mobile", "env:dev", "Work Order", "CRUD", "residue"],
    local_vars=(RUNID,),
))

# ---------------------------------------------------------------- 397: assign follow-up work
# EXACT text match, never a substring: the same dropdown holds "Delete Item" and mobile is
# delete-free (trap 2). A contains() match here would be one typo away from a delete.
# Scoped to the Menu.item BUTTON, and still an EXACT text match. Both halves matter:
#   - `//*[normalize-space(.)="..."]` matched the item AND its inner wrapper -> Datadog errors
#     on multiple matches rather than choosing (trap 3).
#   - the exact match stays because this same dropdown holds "Delete Item" and mobile is
#     delete-free (trap 2). Do not relax this to contains() to fix a multiple-match error.
FOLLOWUP_ITEM = ('//button[contains(concat(" ", normalize-space(@class), " "),'
                 ' " mantine-Menu-item ")][normalize-space(.)="Assign Follow-up Work"]')
GEAR = '//button[@aria-label="Menu"]'

write(test(
    "MOB.397_Work_Assign_Followup",
    "`MOB.397` **Assign Follow-up Work** from a work-order collection item's gear menu.\n"
    "- ⚠️ **LEAVES RESIDUE**: creates a real work order per run. Approved 2026-08-12.\n"
    "- ⚠️ **The same gear menu contains `Delete Item`.** Mobile is delete-free (trap 2), so\n"
    "  the entry is matched by **exact text**, never by position or `contains()`. Keep it\n"
    "  that way if this test is ever edited.\n"
    "- Uses the **Assets** tab: `hideFollowUpWork` suppresses the action on `jobNotes`,\n"
    "  `condition` and `failures`, so those tabs cannot exercise it.\n"
    "- Tabs are asserted by NAME here — MOB.330 only ever switched them positionally, so this\n"
    "  is also the first test to pin that the fixture has an `Assets` tab.",
    open_work_detail() + [
        step("click", 'Open the "Assets" tab',
             {"element": xpath_el(WORK_DETAIL, tab("Assets"))}),
        step("wait", "Wait for the panel", {"value": 3}),
        step("assertElementPresent", 'The "Assets" tab is active',
             {"element": xpath_el(WORK_DETAIL, tab("Assets") + "[@data-active]")}),
        # EXPAND THE ROW FIRST - the gear menu is inside <Accordion.Panel> and only renders
        # when `opened.includes(asset.id)` (Assets/index.tsx:200). A user clicks the row, then
        # the gear. Jumping straight to the gear is the same force-the-shortcut mistake as
        # deep-linking: it targets a state the UI has not been driven into.
        step("click", "Expand the first asset row (the gear menu lives in the panel)",
             {"element": xpath_el(
                 WORK_DETAIL,
                 '(//*[contains(@class,"mantine-Accordion-item")])[1]'
                 '//*[contains(@class,"mantine-Accordion-control")]')}, timeout=30),
        step("wait", "Wait for the panel to expand", {"value": 3}),
        step("assertElementPresent", "A collection item with a gear menu exists",
             {"element": xpath_el(WORK_DETAIL, GEAR)}, timeout=30),
        step("click", "Open the first item's gear menu",
             {"element": xpath_el(WORK_DETAIL, f"({GEAR})[1]")}),
        step("wait", "Wait for the dropdown", {"value": 2}),
        step("click", 'Click "Assign Follow-up Work" (EXACT text — this menu also has '
                      '"Delete Item")',
             {"element": xpath_el(WORK_DETAIL, FOLLOWUP_ITEM)}),
        step("wait", "Wait for the follow-up modal", {"value": 3}),
        step("assertPageContains", "The follow-up modal opened",
             {"value": "Create Follow-up Work"}),
    ] + unfilter_workflows(WORK_DETAIL) + fill_work_form(WORK_DETAIL) + [
        step("click", 'Click "Create Work Order"',
             {"element": xpath_el(WORK_DETAIL, CREATE_BTN)}),
        step("wait", "Brief wait for the toast", {"value": 2}),
        step("assertPageContains", "Success toast (optional: transient)",
             {"value": "Work order successfully created!"}, optional=True),
        step("wait", "Wait for the create mutation", {"value": 5}),
        step("assertPageLacks", "PROOF: the follow-up modal closed",
             {"value": "Create Follow-up Work"}),
    ],
    ["Mobile", "env:dev", "Work Order", "CRUD", "residue"],
    local_vars=(RUNID,),
))

# ---------------------------------------------------------------- 398: assign work stage
write(test(
    "MOB.398_Work_Assign_Stage_Modal",
    "`MOB.398` **Assign Work Stage** — the crew-assignment modal opens and renders its form.\n"
    "- **READ-ONLY BY DESIGN, and deliberately incomplete.** It opens the modal, proves the\n"
    "  crew form renders, and cancels. It does **not** prove an assignment persists.\n"
    "- Why: the crew lookup uses `notInCollection: true`, so it hides crews already assigned.\n"
    "  A test that really assigns passes **once** and then fails forever with `No element\n"
    "  found` — the test having consumed its own fixture (trap 10), exactly like MOB.393.\n"
    "  The repo owner chose the repeatable variant 2026-08-12. **Do not 'finish' this test**\n"
    "  by making it submit; that trades a permanent green for a permanent red.\n"
    "- The button only renders when online **and** the role has both `work.create` and\n"
    "  `crewassignment.create` — so its absence is a permissions signal, not a missing\n"
    "  control.\n"
    "- `AssignmentForm` auto-clicks the Crew label ~100ms after mount to force the dropdown\n"
    "  open, so the options may already be showing when the modal appears.",
    open_work_detail() + [
        step("assertElementPresent", 'The "Assign Work Stage" button renders',
             {"element": xpath_el(
                 WORK_DETAIL, '//button[contains(normalize-space(.), "Assign Work Stage")]')}),
        step("click", 'Click "Assign Work Stage"',
             {"element": xpath_el(
                 WORK_DETAIL, '//button[contains(normalize-space(.), "Assign Work Stage")]')}),
        step("wait", "Wait for the modal and its auto-opened crew dropdown", {"value": 3}),
        step("assertElementPresent", "PROOF: the crew form rendered",
             {"element": xpath_el(WORK_DETAIL, '//*[@id="crewform"]')}),
        step("assertPageContains", 'The "Keep local copy of work?" option renders',
             {"value": "Keep local copy of work"}),
        # Cancel out. Only one modal is open, so Escape cannot cascade the way it did in
        # bugs_found.md 13 - and nothing has been submitted, so there is nothing to discard.
        step("pressKey", "Cancel — close the modal without assigning", {"value": "Escape"},
             always=True),
        step("wait", "Wait for the modal to close", {"value": 2}, always=True),
        step("assertPageLacks", "RESTORED: the modal closed and nothing was assigned",
             {"value": "Keep local copy of work"}, always=True),
    ],
    ["Mobile", "env:dev", "Work Order", "read-only"],
))

# ---------------------------------------------------------------- 399: warranties
# The repo owner added a real warranty to the fixture on 2026-08-12, so the empty state is
# NO LONGER an acceptable pass. Keeping `No Warranties Found` in this disjunction would have
# left an escape hatch that passes on a tab showing nothing - the trap 5 shape. A Time
# warranty renders "Expiration Date", a reading-based one renders "Exp. Reading"; both are
# real content, and which one this fixture uses is not something the test should care about.
# textContent, NOT innerText: innerText omits text the browser treats as not-rendered, and
# the warranty details sit inside a Mantine <Collapse> (open by default, children stay
# mounted). Also accepts every label WarrantyDetails can emit - a Time warranty renders
# "Expiration Date"/"Remaining Days", a reading-based one "Current Reading"/"Exp. Reading" -
# because which type the fixture carries is not this test's business.
# UNVERIFIED as of 2026-08-12: built and pushed, not yet run green.
WARRANTY_CONTENT = """
const t = (document.body.textContent || '');
return ['Expiration Date', 'Remaining Days', 'Current Reading', 'Exp. Reading']
  .some(k => t.indexOf(k) !== -1);
"""

# THE BANNER IS NOT THE TAB, and asserting it bare would be a time bomb.
# `WorkDetails.tsx:80` shows the red Alert when `hasActiveWarranties(workStage)` holds, which
# needs a warranty that is still live - `expirationDate > now` for a time warranty, or
# `currentReading < expirationReading` for a reading-based one. The Warranties TAB, by
# contrast, lists warranties whether or not they have expired.
#
# So "the banner is present" is not a safe assertion: the day the fixture's warranty expires
# it would fail, and the failure would say nothing about the code. Assert the CONSISTENCY of
# the two instead - whichever way the fixture falls, one of the branches must hold, and a
# banner that appears with no warranty (or vanishes with a live one) fails either way. This
# is the same exclusive-or shape MOB.720 uses, and it cannot rot.
#
# `Remaining Days` is rendered per warranty by WarrentyList; a positive value means live.
# The parse is deliberately forgiving - if no number can be read, the check falls back to
# asserting only that the banner does not appear on a tab with NO warranties at all, which is
# still a real (if weaker) statement rather than a vacuous one.
WARRANTY_BANNER = """
const BANNER = 'Assets Related to the Work Order are under Warranty';
const t = document.body.innerText || '';
const banner = t.indexOf(BANNER) !== -1;
const hasAnyWarranty = ['Expiration Date', 'Exp. Reading', 'Remaining Days']
    .some(k => t.indexOf(k) !== -1);
if (!hasAnyWarranty) return !banner;          // no warranties at all -> no banner
const days = [...t.matchAll(/Remaining Days:?\\s*(-?[0-9]+)/g)].map(m => parseInt(m[1], 10));
if (!days.length) return true;                 // reading-based only: nothing parseable here
const anyLive = days.some(d => d > 0);
return banner === anyLive;
"""


write(test(
    "MOB.399_Work_Warranties",
    "`MOB.399` The **Warranties** tab renders its real content.\n"
    "- READ-ONLY. `WarrentyList` displays only; there is no form.\n"
    "- The fixture carries a **real warranty** (added by the repo owner 2026-08-12), so this\n"
    "  asserts actual content: `Expiration Date` for a Time warranty or `Exp. Reading` for a\n"
    "  reading-based one. **The `No Warranties Found...` empty state is deliberately NOT\n"
    "  accepted** — allowing it would leave an escape hatch that passes on a tab rendering\n"
    "  nothing (trap 5).\n"
    "- **Also covers the red `Assets Related to the Work Order are under Warranty` banner**\n"
    "  (added 2026-08-20). It is driven by `hasActiveWarranties`, NOT by the tab, so the two\n"
    "  can legitimately disagree: the tab lists every warranty, the banner appears only while\n"
    "  one is still ACTIVE. The assertion is therefore a **consistency** check, not a\n"
    "  presence check — see the note in the generator.",
    open_work_detail() + [
        step("click", 'Open the "Warranties" tab',
             {"element": xpath_el(WORK_DETAIL, tab("Warranties"))}),
        step("wait", "Wait for the panel", {"value": 3}),
        step("assertElementPresent", 'The "Warranties" tab is active',
             {"element": xpath_el(WORK_DETAIL, tab("Warranties") + "[@data-active]")}),
        jsassert("PROOF: the panel rendered warranty content or its empty state, "
                 "not a blank tab", WARRANTY_CONTENT),
        jsassert("BANNER: its presence agrees with whether a warranty is still active",
                 WARRANTY_BANNER),
    ],
    ["Mobile", "env:dev", "Work Order", "read-only"],
))

# ---------------------------------------------------------------- 394: permits
# PermitsStats has NO empty state - with no permits it renders an empty fragment, i.e. a
# blank panel. So this test is only meaningful because the repo owner added a real permit to
# the fixture on 2026-08-12; before that there was nothing to assert but the tab itself.
PERMIT_CONTENT = """
const t = document.body.innerText || '';
return t.indexOf('Status:') !== -1
    && t.indexOf('Expiration Date:') !== -1
    && t.indexOf('Approved By:') !== -1;
"""

write(test(
    "MOB.394_Work_Permits",
    "`MOB.394` The **Permits** tab renders its real permit content.\n"
    "- READ-ONLY. Permits are read-only data in mobile (repo owner, 2026-08-12) — the tab\n"
    "  displays them; approving happens elsewhere.\n"
    "- **Unlike Warranties, `PermitsStats` has no empty state.** With no permits it renders an\n"
    "  empty fragment — a blank panel with nothing to assert. This test is only meaningful\n"
    "  because the fixture now carries a real permit; if that is ever removed, this fails and\n"
    "  the cause is fixture data, not code.\n"
    "- Requires **all three** labels (`Status:`, `Expiration Date:`, `Approved By:`) rather\n"
    "  than any one of them, so a partially-rendered card cannot pass.",
    open_work_detail() + [
        step("click", 'Open the "Permits" tab',
             {"element": xpath_el(WORK_DETAIL, tab("Permits"))}),
        step("wait", "Wait for the panel", {"value": 3}),
        step("assertElementPresent", 'The "Permits" tab is active',
             {"element": xpath_el(WORK_DETAIL, tab("Permits") + "[@data-active]")}),
        jsassert("PROOF: a permit card rendered with its status, expiration and approver",
                 PERMIT_CONTENT),
    ],
    ["Mobile", "env:dev", "Work Order", "read-only"],
))

# ---------------------------------------------------------------- suite
login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]
# keep COMPLETE - trap 12
# ORDER IS LOAD-BEARING - MOB.396 RUNS FIRST, DELIBERATELY.
# It is the only child that needs the Asset Verification cache, and every other child visits
# /work first, where `WorkOrders/utils/prefetchData.clearCache` runs. MOB.396 failed at the
# job's filter control twice while running second; MOB.545 does the identical thing and
# passes when nothing has visited /work before it. Running it first is the experiment AND,
# if it works, the fix. Do not reorder this list for tidiness.
#
# ⚠️ KEEP THIS LIST IN SYNC WITH THE JSON. On 2026-08-20 regenerating this script SILENTLY
# DROPPED FIVE CHILDREN - MOB.341/342/343/344/345 - because they had been wired into
# MOB.986's JSON directly and never back-ported here. Nothing warned; the suite simply came
# out five subtests shorter, and only a diff against a backup caught it. That is trap 19 in
# the direction people do not expect: the JSON ahead of the generator, not behind it.
# Before regenerating ANY suite, diff its children against the JSON:
#     python3 -c "import json;d=json.load(open('MOB.986_WorkOrders_Extra_Suite.json'))\
#       ['details'];print([s['name'] for s in d['steps'] if 'subtestPublicId' in (s.get('params') or {})])"
CHILDREN = ["MOB.396_Work_Create_From_Asset", "MOB.394_Work_Permits",
            "MOB.397_Work_Assign_Followup", "MOB.398_Work_Assign_Stage_Modal",
            "MOB.399_Work_Warranties", "MOB.122_Map_Create_Work",
            # the work LIST tests, added to the JSON 2026-08-18 and back-ported here 08-20
            "MOB.341_Work_Map_Toggle", "MOB.343_Work_List_Search_Filter",
            "MOB.344_Work_List_Row_Navigate", "MOB.342_Work_Status_Ring",
            "MOB.345_Work_Sort_Persist"]

write(test(
    "MOB.986_WorkOrders_Extra_Suite",
    "Work Order entry points, follow-up work, crew assignment and warranties.\n"
    "- ⚠️ **LEAVES RESIDUE**: MOB.396 and MOB.397 each create a real work order per run.\n"
    "  MOB.398 and MOB.399 are read-only.\n"
    "- Kept separate from `MOB.991_WorkOrders_Suite` so a slow, residue-heavy set can be run\n"
    "  on its own — and because 991 is at Datadog's execution ceiling (Appendix F0).\n"
    "- subtestPublicId values stay PENDING-WIRE-UP until the children exist on Datadog;\n"
    "  run wire_suite.py after pushing them.",
    login_steps + [step("playSubTest", c,
                        {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1})
                   for c in CHILDREN],
    ["Mobile", "env:dev", "Work Order", "suite"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))

print("wrote MOB.396 (create from asset), MOB.397 (follow-up work), "
      "MOB.398 (assign stage modal), MOB.399 (warranties), MOB.986 (suite)")
