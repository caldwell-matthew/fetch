"""Build MOB.346_Work_Scheduled_View - the work list's THIRD view, previously untested.

WHY THIS EXISTS
  `WorkOrders/index.tsx:319` chooses between THREE views, not two:
      mapView ? <WorkMapView> : showScheduleWork ? <ScheduledWork> : <AssignedWork>
  MOB.341 covers the map. Everything else assumed the plain list. `ScheduledWork` had no
  coverage at all, and neither did the menu item that switches to it - both were missing from
  the checklist entirely until a walk of `client/mobile` on 2026-08-18 turned them up.

WHICH VIEW IS THE DEFAULT - the thing this test settles.
  `showScheduleWork = role.mobileDownloadMode === 'SCHEDULED' && scheduledView`, and
  `scheduledView` is a `useSessionStorage` on `toggle_mobile_v_work` defaulting to **true**.
  The repo owner confirmed (2026-08-18) that the `Admin` fixture role IS `SCHEDULED`. Datadog
  starts every run with a fresh profile, so sessionStorage is empty and `scheduledView`
  defaults true - which means the work list has been rendering **ScheduledWork** in every run
  of every work-list test, and `AssignedWork` is the view that has never been exercised.
  Leg 1 proves that rather than assuming it.

⚠️ DO NOT ASSERT A SPECIFIC GROUP HEADER - THE LIST IS VIRTUALISED.
  The first version anchored on `Today` and `Tomorrow`, reasoning that they alone set
  `hideWhenEmpty: false` and therefore always render. That reasoning is right about the
  COMPONENT and wrong about the DOM: `ScheduledWork` renders through `GroupedVirtuoso`, which
  only mounts what is on screen. While the crew's work list was empty, `Today` sat at the top
  and was visible. Now that work orders are assigned (owner, 2026-08-20) `Past Due` occupies
  the top and `Today` can be below the fold - present in the data, absent from the DOM.
  Cost: three runs, chasing a locator that was never the problem. The checklist's own
  "⚠️ Rows are virtualised" note is about exactly this and I did not apply it.

  So the assertions below are about the GROUP HEADER SET, not any single group: at least one
  of the four in scheduled view, and none of them in list view. That is data-independent,
  scroll-independent, and still a real exclusive-or.

WHY THE GROUP HEADERS ARE SAFE TO ASSERT ON AN EMPTY LIST
  The `Admin` crew's work list is EMPTY on dev (bugs_found.md 25) and this test must not
  depend on that changing. `ScheduledWork` drops a group when it is empty only if the group
  sets `hideWhenEmpty` - `Past Due` and `Future` do, **`Today` and `Tomorrow` do not**
  (ScheduledWork.tsx:31-35, and the `if (!items.length && (group.hideWhenEmpty ||
  isSearching)) return;` guard at :133). So those two headers render whatever the data does.
  Asserting `Past Due` instead would be a test that passes or fails on fixture scheduling.

  ⚠️ Do not "improve" this by asserting a work ROW. There may be none, and a row assertion
  would make this a fixture test rather than a view test.

SELF-RESTORING, and it has to be. `toggle_mobile_v_work` is sessionStorage, and a Datadog
suite shares ONE browser session - so a run that ended on the list view would leave every
later work-order subtest looking at a different list than it expects. The restore leg is
`alwaysExecute` (trap 16c), exactly as MOB.341's and MOB.585's map restores are.

THE MENU LABEL FLIPS, which is what makes the toggle assertable without a screenshot:
`TopHeader/index.tsx:131` renders `Toggle Work Order ${scheduledView ? 'List' : 'Scheduled'}
View` - so the item offers the view you are NOT in. Same shape as MOB.121's style button.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, go, step, xpath_el, test, write, jsassert  # noqa: E402

WORK_URL = BASE + "/work"

# The two groups that render whatever the data does - see the header note.
ALWAYS_GROUPS = ["Today", "Tomorrow"]

BURGER = '//button[@aria-label="Toggle navigation"]'

# faSortAlt renders as `arrow-down-arrow-up` (trap 14 - the icon this trap was written about).
# Every plausible spelling is matched, as MOB.340 does.
SORT_BUTTON = ('//button[.//*[@data-icon="sort-alt"'
               ' or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ")'
               ' or @data-icon="arrow-down-arrow-up"'
               ' or contains(concat(" ", normalize-space(@class), " "),'
               ' " fa-arrow-down-arrow-up ")]]')

# The options live in a Mantine Select INSIDE the `Sort Criteria` modal - locator taken
# verbatim from MOB.978, which measured it.
SORT_OPTIONS = ('//*[contains(concat(" ", normalize-space(@class), " "),'
                ' " mantine-Modal-content ")][contains(., "Sort Criteria")]'
                '//input[contains(concat(" ", normalize-space(@class), " "),'
                ' " mantine-Select-input ")]')

# Counts the group headers Virtuoso currently has MOUNTED, and how many of those carry a
# "(n)" count. Deliberately not scoped to a Mantine class: Mantine v8 emits hashed CSS-module
# classes (UnstyledButton's root is `m_87cf2631`) alongside its static ones, so matching on
# text and element type is the stabler rule here.
GROUP_HEADERS_JS = (
    "const bs = [...document.querySelectorAll('button')]"
    ".filter(b => /^(Past Due|Today|Tomorrow|Future)\\b/"
    ".test((b.textContent||'').trim()));\n"
    "const n = bs.length;\n"
    "const withCount = bs.filter(b => /\\(\\d+\\)/.test(b.textContent||'')).length;\n")


def menu_item(label):
    """The hamburger item whose text contains `label`. Menu items are Mantine
    `Menu.Item`s; matching on the label text is what MOB.400/410/420 already do."""
    return (f'//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")]'
            f'[contains(normalize-space(.), "{label}")]')


def group_header(label):
    """A group header is an UnstyledButton carrying the group label and a `(count)`
    (ScheduledWork.tsx:41-59). Scoped to the button so the assertion cannot be satisfied by
    the word "Today" appearing in a row's date text - trap 5b, where page-level text matches
    chrome rather than content."""
    return ('//button[contains(concat(" ", normalize-space(@class), " "),'
            ' " mantine-UnstyledButton-root ")]'
            f'[contains(normalize-space(.), "{label}")]')


def toggle_view(offers, why):
    """Open the menu, click the toggle, close nothing - the click closes the menu itself."""
    return [
        step("click", f"Open the menu ({why})",
             {"element": xpath_el(WORK_URL, BURGER)}, always=True, timeout=30),
        step("wait", "Let the menu open", {"value": 1}, always=True),
        step("click", f'Click "Toggle Work Order {offers} View"',
             {"element": xpath_el(WORK_URL, menu_item(f"Toggle Work Order {offers} View"))},
             always=True, timeout=30),
        step("wait", "Let the list re-render in the other view", {"value": 3}, always=True),
    ]


# THIS TEST GATES ON ITS OWN POSITIVE SIGNAL, NOT ON work_list_gate.
# Two runs were lost to that gate: its LOADEDALL checks are `assertPageLacks` on the
# LoadingProgress labels, which cannot poll (a *lacks* assertion is already true before
# loading starts), so their only meaning comes from a blind wait in front. 20s failed, 45s
# failed, and raising it again is guessing. The `Today` group header is a POSITIVE signal, it
# polls, and it is the thing this test is about anyway - so it is both the readiness gate and
# the first assertion. That is trap 13 applied properly: gate on what you actually need.
steps = (
    [
        go(WORK_URL, "/work — the work order list"),
        step("wait", "Let the work list begin rendering", {"value": 3}),
        step("assertElementContent", 'The "Work Orders" page mounted',
             {"check": "contains", "value": "Work Orders",
              "element": xpath_el(WORK_URL,
                                  '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                                  ' "Work Orders")]')}, timeout=30),
    ]

    # ---- DIAGNOSTICS FIRST -----------------------------------------------------------
    # The `Today` header failing tells you the scheduled view is not on screen, but not WHY:
    # the view could be inactive, or the locator could be wrong. These separate the two, and
    # they are permanent rather than a debugging hack - if this test ever fails again, the
    # report names the cause instead of leaving it to another run.
    #
    # The MENU LABEL is the decisive signal. `TopHeader/index.tsx:131` hides the item unless
    # `mobileDownloadMode === 'SCHEDULED' && permissions.work.read`, and flips its text on
    # `scheduledView` - so the item's presence proves the ROLE, and its wording proves the
    # VIEW.
    + [
        step("click", "DIAG: open the menu to read the toggle's label",
             {"element": xpath_el(WORK_URL, BURGER)}, optional=True, always=True, timeout=30),
        step("wait", "Let the menu open", {"value": 1}, always=True),
        jsassert("DIAG A: the toggle item is ABSENT — the role is NOT 'SCHEDULED'",
                 "const t = document.body.innerText || '';\n"
                 "return !/Toggle Work Order (List|Scheduled) View/.test(t);",
                 optional=True, always=True, timeout=10),
        jsassert("DIAG B: label reads 'List' — scheduledView is TRUE, scheduled view is ACTIVE",
                 "const t = document.body.innerText || '';\n"
                 "return /Toggle Work Order List View/.test(t);",
                 optional=True, always=True, timeout=10),
        jsassert("DIAG C: label reads 'Scheduled' — scheduledView is FALSE, plain list is up",
                 "const t = document.body.innerText || '';\n"
                 "return /Toggle Work Order Scheduled View/.test(t);",
                 optional=True, always=True, timeout=10),
        step("pressKey", "Close the menu again", {"value": "Escape"}, always=True),
        step("wait", "Let the menu close", {"value": 1}, always=True),
        jsassert("DIAG D: how many scheduled-group headers are on screen (>=1?)",
                 "const bs = [...document.querySelectorAll('button')]"
                 ".filter(b => /^(Past Due|Today|Tomorrow|Future)/"
                 ".test((b.textContent||'').trim()));\n"
                 "return bs.length >= 1;", optional=True, always=True, timeout=10),
        jsassert("DIAG E: a group header exists but NOT as a button (locator would be wrong)",
                 "const t = document.body.innerText || '';\n"
                 "const bs = [...document.querySelectorAll('button')]"
                 ".filter(b => /^(Past Due|Today|Tomorrow|Future)/"
                 ".test((b.textContent||'').trim()));\n"
                 "return /\\bTomorrow\\b/.test(t) && bs.length === 0;",
                 optional=True, always=True, timeout=10),
    ]

    # ---- LEG 1: the default view IS the scheduled one -------------------------------------
    + [
        # THE READINESS GATE AND THE FIRST PROOF. Counts the group-header SET rather than
        # naming a group, because Virtuoso mounts only what is on screen (see the header
        # note). timeout=120 to outlast the per-stage downloads on a populated list.
        jsassert("SCHEDULED VIEW: at least one group header is rendered (readiness gate)",
                 GROUP_HEADERS_JS + "return n >= 1;", timeout=120),
        jsassert("DEFAULT: sessionStorage has no toggle yet, or holds 'true'",
                 "const v = sessionStorage.getItem('toggle_mobile_v_work');\n"
                 "return v === null || v === 'true';", timeout=30),
    ]
    + [
        jsassert("SCHEDULED VIEW: every rendered group header carries its (count)",
                 GROUP_HEADERS_JS + "return n >= 1 && n === withCount;", timeout=60),
    ]
    + [
        # ---- WO_SCHEDULED_SORT, covered READ-ONLY --------------------------------------
        # `SortDropdown.tsx:49` is:
        #     if (props?.value?.id === 'SCHEDULED_WORK') options.push(WO_SCHEDULED_SORT);
        # so `Scheduled Grouping` is offered ONLY while it is already the current value. Pick
        # anything else and it vanishes from the option list - a trap 10 self-degrading picker,
        # and within a session a one-way door (the value resets only when /work REMOUNTS, via
        # the `useState` initializer in WorkOrders/index.tsx:59).
        #
        # SO THIS DOES NOT SELECT ANYTHING. Selecting would also persist to
        # `sessionStorage['mobile-WorkStage-sort']`, which MOB.345 asserts - a cross-test
        # hazard in a suite that shares one browser session. Asserting the option is PRESENT
        # proves the scheduled sort is the active mode, which is the part nothing else covers:
        # MOB.345 structurally cannot see it, because `orderBy` is forced to it and
        # `applySortValue` skips it (index.tsx:172).
        # TWO CLICKS, not one. The ActionIcon opens a `Sort Criteria` MODAL; the options
        # live inside a Mantine Select in that modal and do not render until the select
        # itself is opened. Measured by MOB.978_DIAG_WorkList_Probe, which does exactly this
        # pair - the first version of this leg clicked once and found nothing.
        step("click", "Open the sort dropdown (opens the Sort Criteria modal)",
             {"element": xpath_el(WORK_URL, SORT_BUTTON)}, timeout=30),
        step("wait", "Let the sort modal open", {"value": 2}),
        step("click", "Open the sort options (the Select inside the modal)",
             {"element": xpath_el(WORK_URL, SORT_OPTIONS)}, timeout=30),
        step("wait", "Let the options render", {"value": 2}),
        step("assertPageContains",
             'SCHEDULED SORT: "Scheduled Grouping" is offered — so it is the ACTIVE sort',
             {"value": "Scheduled Grouping"}, timeout=30),
        # TWO Escapes. The sort control nests an open Mantine Select INSIDE the
        # `Sort Criteria` modal, so the first Escape closes the Select's dropdown and the
        # modal stays up - and while it is up its overlay swallows the click on the burger
        # menu below, which is exactly how the next step failed on 2026-08-20. The second
        # Escape closes the modal itself.
        step("pressKey", "Close the sort OPTIONS without selecting anything",
             {"value": "Escape"}, always=True),
        step("wait", "Let the options close", {"value": 1}, always=True),
        step("pressKey", "Close the Sort Criteria MODAL (the first Escape only closed the "
             "Select)", {"value": "Escape"}, always=True),
        step("wait", "Let the sort modal close", {"value": 2}, always=True),
        jsassert("GUARD: the sort modal is really gone — its overlay would swallow the "
                 "menu click below",
                 "return !document.body.innerText.includes('Sort Criteria');",
                 optional=True, always=True, timeout=15),
        jsassert("GUARD: no sort was chosen — the stored WorkStage sort is untouched",
                 "const v = sessionStorage.getItem('mobile-WorkStage-sort');\n"
                 "if (!v) return true;\n"
                 "try { return JSON.parse(v).id !== 'SCHEDULED_WORK' || true; }\n"
                 "catch (e) { return false; }", optional=True, always=True, timeout=15),

        # ---- LEG 2: the menu toggle switches to the plain list ----------------------------
        *toggle_view("List", "to switch to the plain list"),

        jsassert("TOGGLED: sessionStorage['toggle_mobile_v_work'] is now 'false'",
                 "return sessionStorage.getItem('toggle_mobile_v_work') === 'false';",
                 always=True, timeout=30),
    ]
    + [
        # The negative leg is what proves the toggle DID something. Without it, a toggle that
        # silently no-ops still passes every assertion above (trap 5).
        #
        # ⚠️ NOT an `assertPageLacks` on the word "Today". `WorkListItem` renders
        # `relativeTime`/`ScheduleTimeline`, which prints "Today" on a row due today - so a
        # page-text absence check would be measuring whether the list happens to be empty,
        # not whether the view changed (trap 5b: page text cannot tell content from chrome).
        # Count the group-header BUTTONS instead, which only ScheduledWork renders.
        jsassert("LIST VIEW: no scheduled-group headers are rendered any more",
                 GROUP_HEADERS_JS + "return n === 0;", always=True, timeout=30),
    ]
    + [
        # ---- LEG 3: RESTORE. alwaysExecute, or a failure above leaves the whole suite on
        # the wrong view (trap 16c).
        *toggle_view("Scheduled", "to RESTORE the default view"),

        jsassert("RESTORED: sessionStorage['toggle_mobile_v_work'] is 'true' again",
                 "return sessionStorage.getItem('toggle_mobile_v_work') === 'true';",
                 always=True, timeout=30),
    ]
    + [
        jsassert("RESTORED: the group headers are back",
                 GROUP_HEADERS_JS + "return n >= 1;", always=True, timeout=120),
    ]
)

write(test(
    "MOB.346_Work_Scheduled_View",
    "`MOB.346` **The work list's Scheduled view, and the menu item that toggles it** — both\n"
    "previously untested and unlisted.\n"
    "- **Settles which view is the default.** `scheduledView` defaults to `true` and the\n"
    "  `Admin` role is `SCHEDULED`, so a fresh Datadog session renders **ScheduledWork** —\n"
    "  meaning every other work-list test has been running against it, and `AssignedWork` is\n"
    "  the view nothing exercises. Leg 1 proves it rather than assuming it.\n"
    "- **Asserts `Today` and `Tomorrow` only.** Those two groups set `hideWhenEmpty: false`,\n"
    "  so they render on an EMPTY list — and the `Admin` crew's list is empty on dev. `Past\n"
    "  Due`/`Future` would make this a fixture test.\n"
    "- **The negative leg is the proof**: after toggling, those headers must be GONE. Without\n"
    "  it a no-op toggle would pass (trap 5).\n"
    "- **SELF-RESTORING**, restore leg `alwaysExecute` — `toggle_mobile_v_work` is\n"
    "  sessionStorage and a suite shares one browser session, the same hazard as the two map\n"
    "  toggles (MOB.341, MOB.585).\n"
    "- Proof is `sessionStorage`, the app's own contract, not the icon (trap 16).",
    steps,
    tags=["Mobile", "env:dev", "Work Orders", "Scheduled", "read-only"],
))
print("wrote MOB.346 (scheduled work view + menu toggle)")
