"""Build MOB.551_AssetVerify_Reading_History - `AssetReadingTimeline`'s popover: its three fetch
states, the timeline/chart toggle, and the offline branch (checklist 🟢 #8).

WHAT SHIPPED WITHOUT A TEST
  `EventReadings/Timeline.tsx` fetches an asset's reading history ON OPEN (`skip: !opened`) and
  renders one of: `Loading history...` -> then EITHER `No readings recorded.` OR `Timeline.Item`s;
  and, offline, `OFFLINE_FEATURE_MESSAGE` instead of fetching. An ActionIcon flips the view
  between the Mantine `Timeline` and a recharts `LineChart`. Nothing had opened it anywhere.

THE FIXTURE IS `MOB.550`'S RESIDUE, AND THAT IS WHY THIS LIVES IN `MOB.987`
  The history icon renders only beside a reading type that HAS a previous entry
  (`FormField.tsx`: `{previousEntry && ... {historyIcon}}`). `MOB.550` writes readings to
  `Tank 0000` in the fixture job every run and the server keeps them, so on the AV job's
  accordion `Tank 0000` -> `Readings` always has at least one icon. Run after `MOB.550`.
  The icon is `faHistory`, whose canonical FontAwesome name is `clock-rotate-left` (trap 14).

  ⚠️ This is the ACCORDION's `AssetLookupDetails` -> `AssetLookup/.../EventReadings.tsx`, the
  component `MOB.720` covers on Asset Lookup - not the full-page `AssetVerification/EventReadings`
  that `MOB.550` drives. The accordion is expanded by its CHEVRON: the asset NAME inside the
  control navigates to the full page (`JobAccordianControl`), which is a different screen.

WHAT IS ASSERTED, AND WHY NONE OF IT CAN GO VACUOUS
  - OPEN: exactly one `.mantine-Popover-dropdown` (portaled) naming the reading type, and once
    `Loading history...` has resolved, EXACTLY ONE of `No readings recorded.` or >= 1
    `.mantine-Timeline-item`. Polled: while loading, neither holds, so the assertion waits.
  - TOGGLE: a biconditional. Timeline items present and no `.recharts-responsive-container`,
    then after the ActionIcon the exact opposite, then back. (Only meaningful when readings
    exist - if the fixture ever empties, the toggle legs are skipped by construction: the
    chart branch renders an empty chart and the timeline branch an empty timeline, so the
    biconditional is asserted on the CONTAINERS, not the items.)
  - OFFLINE: `MOB.910`'s technique - dispatch `offline` on `window`, `useNetwork` flips, and the
    dropdown must show `OFFLINE_FEATURE_MESSAGE`; dispatch `online` and it must be gone. Both
    halves asserted, restore leg `alwaysExecute`.
  The popover is closed on the way out by clicking its icon again (`onClick={() => setOpened(o
  => !o)}`) and the row collapsed, so `MOB.987`'s session ends where it started.

READ-ONLY. The history query is a read; toggling the view and going offline write nothing.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import step, xpath_el, go, test, write, jsassert, av_job_gate, AV_JOBS_URL  # noqa: E402

JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
ASSET = "Tank 0000"
OFFLINE_MSG = "This feature requires an internet connection."   # constants.ts, verbatim — the scan passed a wrong paraphrase (every word exists elsewhere)


def tok(cls):
    return f'contains(concat(" ", normalize-space(@class), " "), " {cls} ")'


ITEM = (f'(//*[{tok("mantine-Accordion-item")}]'
        f'[.//*[{tok("mantine-Accordion-control")}][contains(., "{ASSET}")]])[1]')
CHEVRON = f'{ITEM}//*[{tok("mantine-Accordion-chevron")}]'
READINGS_TAB = f'{ITEM}//*[@role="tab"][normalize-space(.)="Readings"]'
HISTORY_ICON = (f'({ITEM}//*[@data-icon="clock-rotate-left" or {tok("fa-clock-rotate-left")}'
                f' or @data-icon="history" or {tok("fa-history")}])[1]')
URL = f"{AV_JOBS_URL}/{JOB_ID}"

DROPDOWN = ("const dds = document.querySelectorAll('.mantine-Popover-dropdown');\n"
            "if (dds.length !== 1) return false;\n"
            "const d = dds[0];\n"
            "const txt = d.textContent || '';\n")
ITEMS = "const items = d.querySelectorAll('[class*=\"mantine-Timeline-item\"]').length;\n"
CHART = "const chart = !!d.querySelector('.recharts-responsive-container, .recharts-wrapper');\n"
TIMELINE = "const timeline = !!d.querySelector('[class*=\"mantine-Timeline-root\"]');\n"

steps = av_job_gate(JOB_ID) + [
    step("click", f'Expand the "{ASSET}" row by its CHEVRON (the name navigates away)',
         {"element": xpath_el(URL, CHEVRON)}, timeout=30),
    step("wait", "Let the detail panel mount", {"value": 3}),
    step("click", 'Open the "Readings" tab', {"element": xpath_el(URL, READINGS_TAB)}, timeout=30),
    step("wait", "Let the readings panel mount", {"value": 3}),
    step("assertElementPresent", 'The "Readings" tab is active',
         {"element": xpath_el(URL, READINGS_TAB + "[@data-active]")}, timeout=30),
    step("assertElementPresent",
         f'FIXTURE GUARD: "{ASSET}" has a reading with a history icon (MOB.550 residue)',
         {"element": xpath_el(URL, HISTORY_ICON)}, timeout=30, soft=True),
    jsassert("BASELINE: no popover dropdown is open",
             "return document.querySelectorAll('.mantine-Popover-dropdown').length === 0;",
             timeout=30),
    step("click", "Open the reading history popover (the clock icon)",
         {"element": xpath_el(URL, HISTORY_ICON)}, timeout=30),
    step("wait", "Let the popover mount and its history query fire", {"value": 2}),
    jsassert("⭐ OPEN: exactly one dropdown, and it names a reading type (its bold heading)",
             DROPDOWN +
             "const head = d.querySelector('p, span, div');\n"
             "return !!head && (head.textContent || '').trim().length > 0;", timeout=30),
    jsassert("⭐ RESOLVED: EXACTLY ONE of `No readings recorded.` or >= 1 timeline item — "
             "`Loading history...` is neither, so this polls until the fetch lands",
             DROPDOWN + ITEMS +
             "if (/Loading history\\.\\.\\./.test(txt)) return false;\n"
             "const empty = txt.includes('No readings recorded.');\n"
             "return empty !== (items > 0);", timeout=45),

    # ---- timeline <-> chart: the containers must swap ------------------------------------------
    jsassert("VIEW 1: the Timeline container is present and the chart is NOT",
             DROPDOWN + CHART + TIMELINE + "return timeline && !chart;", timeout=30),
    jsassert("Toggle to the chart (the dropdown's ActionIcon)",
             DROPDOWN +
             "const b = d.querySelector('button');\n"
             "if (!b) return false;\n"
             "b.click();\n"
             "return true;", timeout=30),
    step("wait", "Let the chart render", {"value": 2}),
    jsassert("⭐ VIEW 2: the chart container is present and the Timeline is NOT — the "
             "biconditional closes",
             DROPDOWN + CHART + TIMELINE + "return chart && !timeline;", timeout=30),
    jsassert("Toggle back to the timeline", DROPDOWN +
             "const b = d.querySelector('button');\n"
             "if (!b) return false;\n"
             "b.click();\n"
             "return true;", always=True, timeout=30),
    step("wait", "Let the timeline render", {"value": 2}, always=True),
    jsassert("RESTORED: Timeline back, chart gone",
             DROPDOWN + CHART + TIMELINE + "return timeline && !chart;", always=True, timeout=30),

    # ---- offline: the third state --------------------------------------------------------------
    jsassert("BASELINE: the offline message is NOT in the dropdown while online",
             DROPDOWN + f"return !txt.includes('{OFFLINE_MSG}');", timeout=30),
    jsassert("Dispatch a window 'offline' event (MOB.910's technique — `useNetwork` flips)",
             "window.dispatchEvent(new Event('offline')); return true;"),
    step("wait", "Let React re-render", {"value": 2}),
    jsassert("⭐ OFFLINE: the dropdown shows the offline message",
             DROPDOWN + f"return txt.includes('{OFFLINE_MSG}');", timeout=30),
    jsassert("Dispatch a window 'online' event",
             "window.dispatchEvent(new Event('online')); return true;", always=True),
    step("wait", "Let React re-render", {"value": 2}, always=True),
    jsassert("RESTORED: the offline message is gone again",
             DROPDOWN + f"return !txt.includes('{OFFLINE_MSG}');", always=True, timeout=30),

    # ---- leave it as found ---------------------------------------------------------------------
    step("click", "Close the popover by clicking its icon again",
         {"element": xpath_el(URL, HISTORY_ICON)}, always=True, timeout=30),
    step("wait", "Let it close", {"value": 1}, always=True),
    jsassert("RESTORED: no popover dropdown is open",
             "return document.querySelectorAll('.mantine-Popover-dropdown').length === 0;",
             always=True, timeout=30),
    step("click", "Collapse the row again", {"element": xpath_el(URL, CHEVRON)}, always=True,
         timeout=30),
    step("wait", "Let the panel close", {"value": 2}, always=True),
]

write(test(
    "MOB.551_AssetVerify_Reading_History",
    "`MOB.551` **The reading-history popover: its fetch states, the timeline/chart toggle, and "
    "the offline branch.**\n"
    "- READ-ONLY. Fixture is `MOB.550`'s residue on `Tank 0000` — the history icon renders only\n"
    "  beside a reading type with a previous entry, so this runs after `MOB.550` in `MOB.987`.\n"
    "- ⭐ **RESOLVED is an exclusive-or**: `No readings recorded.` or >= 1 timeline item, polled\n"
    "  past `Loading history...`, which satisfies neither.\n"
    "- ⭐ **Timeline vs chart is a biconditional** on the two containers, flipped and flipped back.\n"
    "- ⭐ **Offline** via a dispatched `offline` event (`MOB.910`): the message appears, then\n"
    "  disappears on `online`. Restore legs are `alwaysExecute`.\n"
    "- The row is expanded by its chevron (the name navigates to the full-page detail) and the\n"
    "  popover closed and row collapsed on the way out.",
    steps,
    tags=["Mobile", "env:dev", "Asset Verification", "Readings", "read-only"],
))
print("wrote MOB.551 (reading history popover)")
