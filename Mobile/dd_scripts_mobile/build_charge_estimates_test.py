"""Build MOB.351_Work_Charge_Estimates - the ESTIMATES half of all four charge tabs.

WHY THIS EXISTS - the largest surface in the plan that had never been named.
  Every charge tab is a TWO-WAY control, and every existing test only ever saw one side:

      ui/WorkChargeLayout.tsx:17   <SegmentedControl data={['CHARGES', 'ESTIMATES']} />
      MaterialCharges.tsx:113      its own copy of the same control

  `MOB.350`/`360`/`370`/`380` add a charge; `MOB.356` proves an invalid charge form is inert.
  All five open the tab, act on the CHARGES side, and leave. Nothing had ever clicked
  ESTIMATES - it appeared in no test, no generator and no doc until the 2026-09-08 audit, and
  it was found by sweeping RENDERED STRINGS rather than attributes (the label sweep greps
  `placeholder=`/`aria-label=` and is structurally blind to a JSX text child).

  The other side is not cosmetic. It renders a different list from a different field:

      Equipment  equipmentEstimates     equipmentId.name    + estimatedQuantity
      Labor      laborEstimates         craftId.name        + estimatedHours
      Other      otherChargeEstimates   chargeId.name       + quantity + money pill
      Material   materialEstimates      GROUPED BY STOREROOM (groupByStoreroom) - a code path
                                        with no counterpart anywhere on the charges side

WHAT THIS ASSERTS, AND WHY IT CANNOT GO VACUOUS
  🛑 The fixture's estimate data is NOT a dependency. Asserting "an estimate row rendered"
  would make this a fixture test: the work order may legitimately have no estimates, and a
  test that fails for that reason teaches nothing. Worse, asserting rows are ABSENT would pass
  on a dead screen (trap 5).

  ⭐ So the proof is the CONDITIONAL, read in both states and required to DISAGREE:

      {section === 'CHARGES' && InsertForm}          WorkChargeLayout.tsx:18

  The `Add` button exists on the CHARGES side and MUST NOT exist on the ESTIMATES side. That
  is true whatever the data does, so it is a real biconditional rather than a presence check -
  the shape coverage.md rates strongest. Asserting only that ESTIMATES "appears" would pass on
  a control that never switched.

  Each tab therefore runs: Add present -> click ESTIMATES -> Add ABSENT -> click back ->
  Add present again. The final leg is not decoration: it proves the toggle is two-way and
  leaves the tab as it was found, which matters because a suite shares one session.

  📊 Whether the fixture HAS estimates is reported through `optional` steps instead of being
  asserted. That is the MOB.974 pattern: one run answers the question without the answer
  deciding pass/fail. ⚠️ Read those rows before believing anything about the data - an
  `optional` step is exactly what let MOB.976 report PASS while answering nothing.

MEASURED, NOT ASSUMED
  - `keepMounted={false}` (InfiniteTabs.tsx:81) means only the ACTIVE tab PANEL is mounted, so
    at most one `Add` button exists at a time. That is what makes an unscoped
    `//button[normalize-space(.)="Add"]` unambiguous here. If keepMounted ever becomes true,
    every locator below needs scoping to the active panel.
    🛑 It does NOT mean one SegmentedControl. `NavFooter.tsx:45` renders a second one - the
    bottom nav - permanently, outside the tab system. Anything that counts controls or labels
    PAGE-WIDE is wrong for that reason alone. See SEG_GROUP_JS below.
  - Mantine renders SegmentedControl options as `<label>` elements - the same shape MOB.870
    already clicks for `Stock Item`, reused rather than re-derived.
  - ⭐ The option set is read from the RADIO GROUP, and the structure was taken from
    @mantine/core 8.3.18's own source rather than inferred from a run. Reading it cost
    nothing and settled in one pass what two Datadog runs had failed to settle - the note on
    SEG_GROUP_JS records both wrong turns so neither gets tried a third time.
    ⚠️ The node_modules read is the authority ONLY while the pinned version holds. If Mantine
    is upgraded and this test starts failing on the option count, re-read that file first.
  - `normalize-space(.)="Add"` is EXACT, so it cannot be satisfied by `Add Signature` or
    `Add Work Order Photo` elsewhere in the module (trap 11).

🛑 READ-ONLY. It opens no form, types nothing, submits nothing. Safe beside the four write
tests in a shared session, and it cannot consume fixture data.

⚠️ Belongs in MOB.985_WorkDetail, NOT MOB.991 - that suite is at Datadog's execution-time
ceiling (Appendix F0, died at 1071s once). New work-order coverage goes to 985/986.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, test, write, jsassert, work_cache_warm  # noqa: E402

WORK_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"          # the fixture work order MOB.350-380 all use
WORK_URL = f"{BASE}/work/{WORK_ID}"

TABS = ["Equipment", "Labor", "Material", "Other"]
ADD_BTN = '//button[normalize-space(.)="Add"]'


def tab_el(name):
    return xpath_el(WORK_URL, f'//*[@role="tab"][contains(normalize-space(.), "{name}")]')


def seg(label):
    """A Mantine SegmentedControl option. Rendered as a <label> - proven by MOB.870."""
    return xpath_el(WORK_URL, f'//label[normalize-space(.)="{label}"]')


# ⭐ Resolves THIS control's option set by RADIO GROUP. Every line below is quoted from
# @mantine/core 8.3.18 esm/components/SegmentedControl/SegmentedControl.mjs, not guessed:
#
#     const uuid = useId(name);                       // name prop is unset here, so useId
#                                                     // returns randomId() -> "mantine-xxxx",
#                                                     // unique per mounted control, never ""
#     <input type="radio" name={uuid} value={item.value} id={`${uuid}-${item.value}`}>
#     <Box component="label" htmlFor={`${uuid}-${item.value}`}><span>{item.label}</span></Box>
#
# So: the input is a SIBLING of the label (never a child - reach it through `for`/`id`), its
# `value` IS the data string, and every option of one control shares a `name` that no other
# control shares. Grouping by that name is immune to class names, nesting depth and wrapper
# text - the three things that broke the two earlier attempts.
#
# 🛑 WHY IT HAD TO BE THE RADIO GROUP - two runs, ONE root cause:
#   run 1  `label.parentElement`                     -> the `control` div wrapping ONE option,
#          so `querySelectorAll('label')` inside it found 1, never 2.
#   run 2  `label.closest('[class*="SegmentedControl"]')` -> ⭐ THE LABEL ITSELF. `closest`
#          starts at the element it is called on, and Mantine's static class for the option
#          label is `mantine-SegmentedControl-label` - it matches on step zero and never walks
#          anywhere. That found 0 nested labels. So run 2 was not a worse ancestor than run 1;
#          it was no ancestor at all, and the "fix" moved further from the root, not closer.
#   ⚠️ `[class*="<Component>"]` is NEVER a root selector in Mantine: root, wrapper and label
#   all carry the same `mantine-<Component>-*` prefix. `[class*="SegmentedControl-root"]`
#   would have worked; `role="radiogroup"` is better still, being semantic and unconditional.
#   Neither run was needed: the component's source is in node_modules and answers it for free.
#   Both wrong turns are pinned by the regression guard in the jsdom check, so that a future
#   "simplification" back to either one fails on the bench instead of on Datadog.
#
# ⚠️ AND PAGE-LEVEL COUNTING WOULD ALSO HAVE BEEN WRONG. `NavFooter.tsx:45` renders a second
# SegmentedControl (the bottom nav) that is mounted at the same time, outside the tab system -
# `keepMounted={false}` says nothing about it. "Exactly two <label>s on the page" would have
# been false for a reason having nothing to do with charges.
SEG_GROUP_JS = (
    "const lbl = [...document.querySelectorAll('label')]"
    ".find(e => (e.textContent || '').trim() === 'CHARGES');\n"
    "if (!lbl) return false;\n"
    "const anchor = document.getElementById(lbl.getAttribute('for') || '');\n"
    "if (!anchor || anchor.type !== 'radio' || !anchor.name) return false;\n"
    # Filtered in JS rather than through an attribute selector on purpose: the generated name
    # is not guaranteed to be CSS-selector-safe, and this needs no escaping to be correct.
    "const group = [...document.querySelectorAll('input[type=\"radio\"]')]"
    ".filter(i => i.name === anchor.name);\n"
)


# Counts the estimate cards in the active panel. `mantine-Paper-root` is a STATIC class and is
# safe to select on: `withStaticClasses` defaults to true and neither MantineProvider in this
# app (client/mobile/index.tsx:24, client/src/index.tsx:74) turns it off - checked, not assumed.
# ⚠️ The hashed CSS-module class that sits BESIDE it is the one to never select on (the note in
# build_scheduled_work_test.py). Scoping to the panel matters more than the class here: with
# `keepMounted={false}` exactly one tabpanel is mounted, so this cannot count another tab's.
ESTIMATE_CARDS_JS = (
    "const panel = document.querySelector('[role=tabpanel]:not([hidden])')"
    " || document.body;\n"
    "const cards = [...panel.querySelectorAll('.mantine-Paper-root')];\n"
)


def legs(name):
    """The seven steps that pin one tab's CHARGES/ESTIMATES conditional in both directions."""
    return [
        step("click", f"{name}: open the tab", {"element": tab_el(name)},
             always=True, timeout=30),

        # GATE on the control this test is about, rather than a blind wait (trap 13/21).
        step("assertElementPresent",
             f"{name}: GATE — the CHARGES/ESTIMATES segmented control mounted",
             {"element": seg("ESTIMATES")}, always=True, timeout=30),
        # ⚠️ Counts the control's OWN options — the whole radio group — rather than filtering
        # the page for the two names we expect. Filtering first is self-fulfilling: a THIRD
        # section would be filtered out and the assertion would still say "exactly two".
        # Caught by the jsdom check before this ever ran, which is the point of running it.
        jsassert(f"{name}: the control offers EXACTLY `CHARGES` and `ESTIMATES` — counted from "
                 f"the control's own radio group, so a third section cannot slip in unnoticed",
                 SEG_GROUP_JS +
                 # `value` is `item.value` straight from `data={['CHARGES','ESTIMATES']}`, so
                 # this reads the control's contract rather than its rendered text.
                 "const vals = group.map(i => i.value).sort();\n"
                 "return vals.length === 2 && vals[0] === 'CHARGES' "
                 "&& vals[1] === 'ESTIMATES';",
                 always=True, timeout=30),

        # ---- state 1: CHARGES (the default) ----------------------------------------------
        step("assertElementPresent",
             f"{name}: on CHARGES the `Add` button is PRESENT — half of the biconditional",
             {"element": xpath_el(WORK_URL, ADD_BTN)}, always=True, timeout=30),

        # ---- state 2: ESTIMATES ----------------------------------------------------------
        step("click", f"{name}: switch to ESTIMATES", {"element": seg("ESTIMATES")},
             always=True, timeout=30),
        # Poll for the state change on a POSITIVE signal before reading the absence below,
        # so the absence cannot pass merely because the click had not landed yet (trap 21).
        # ⚠️ Reads the CHECKED member of the group, not "is ESTIMATES checked" — so it is also
        # a statement that CHARGES is no longer checked. The old form reached the input with
        # `label.querySelector('input') || getElementById(for)`; the first branch was dead
        # code (the input is a sibling, never a child) that implied a DOM which does not
        # exist. It happened to work through the fallback, which is not the same as being right.
        jsassert(f"{name}: GATE — ESTIMATES is now the CHECKED option of the group",
                 SEG_GROUP_JS +
                 "const on = group.find(i => i.checked);\n"
                 "return !!on && on.value === 'ESTIMATES';",
                 always=True, timeout=30),
        jsassert(f"{name}: ⭐ on ESTIMATES the `Add` button is GONE — "
                 f"`{{section === 'CHARGES' && InsertForm}}` pinned in the other direction. "
                 f"Its positive control is the assertion two steps above, on the same button",
                 "return ![...document.querySelectorAll('button')]"
                 ".some(b => (b.textContent || '').trim() === 'Add');",
                 always=True, timeout=30),

        # ---- 📊 REPORT ONLY. Fixture-dependent, so it never decides pass/fail. ------------
        # ⚠️ PHRASED AS A QUESTION, DELIBERATELY. `audit_assertions.py` flags an `optional`
        # step whose NAME reads like an established fact (LOADBEARING-OPT) — an amber step
        # cannot fail a run, so a name that asserts something is a lie waiting to be believed.
        # That is the MOB.976 failure in miniature. A question cannot be misread as a result.
        jsassert(f"📊 REPORT ONLY, never fails — {name}: did the ESTIMATES panel render any "
                 f"cards? (green = yes, red = none present. Neither is a defect)",
                 ESTIMATE_CARDS_JS + "return cards.length > 0;",
                 optional=True, always=True, timeout=15),

        # ---- restore: back to CHARGES, proving the toggle is two-way ----------------------
        step("click", f"{name}: switch back to CHARGES", {"element": seg("CHARGES")},
             always=True, timeout=30),
        step("assertElementPresent",
             f"{name}: RESTORED — `Add` is back, so the toggle is two-way and the tab is as "
             f"it was found",
             {"element": xpath_el(WORK_URL, ADD_BTN)}, always=True, timeout=30),
    ]


steps = work_cache_warm() + [
    step("goToUrl", "Navigate to the fixture work order", {"value": WORK_URL}),
    step("wait", "Let the detail view begin rendering", {"value": 3}),
    step("assertElementPresent", "GATE: the detail data arrived (tab strip)",
         {"element": xpath_el(WORK_URL, '(//*[@role="tab"])[1]')}, timeout=60),
]
for t in TABS:
    steps += legs(t)

write(test(
    "MOB.351_Work_Charge_Estimates",
    "`MOB.351` **The `ESTIMATES` half of all four charge tabs** — the largest surface in the "
    "plan that had never been named.\n"
    "- Every charge tab is a two-way `SegmentedControl data={['CHARGES','ESTIMATES']}` "
    "(`ui/WorkChargeLayout.tsx:17`, and `MaterialCharges.tsx:113` for its own copy). "
    "`MOB.350`/`360`/`370`/`380` and `MOB.356` all act on the CHARGES side and leave; "
    "**nothing had ever clicked ESTIMATES**.\n"
    "- The other side is not cosmetic — it renders a different list from a different field "
    "(`equipmentEstimates` · `laborEstimates` · `otherChargeEstimates` · `materialEstimates`), "
    "and **material estimates are GROUPED BY STOREROOM**, a code path with no counterpart on "
    "the charges side.\n"
    "- ⭐ **The proof is a BICONDITIONAL, not a presence check.** `Add` exists on CHARGES and "
    "must be ABSENT on ESTIMATES — `{section === 'CHARGES' && InsertForm}` read in both states "
    "and required to disagree. Asserting only that ESTIMATES *appears* would pass on a control "
    "that never switched.\n"
    "- 🛑 **The fixture's estimate DATA is deliberately not a dependency.** Whether any "
    "estimate rows exist is reported through `optional` steps, never asserted — the work order "
    "may legitimately have none, and a test that fails for that reason teaches nothing. "
    "⚠️ Read those 📊 rows before believing anything about the data: an `optional` step is "
    "exactly what let `MOB.976` report PASS while answering nothing.\n"
    "- ⚠️ Relies on `keepMounted={false}` (`InfiniteTabs.tsx:81`) — only the active panel is "
    "mounted, so exactly one segmented control and at most one `Add` button exist at a time. "
    "**If that ever becomes true, every locator here needs scoping to the active panel.**\n"
    "- 🛑 **READ-ONLY**: opens no form, types nothing, submits nothing. Safe beside the four "
    "write tests in a shared session, and it cannot consume fixture data.",
    steps,
    tags=["Mobile", "env:dev", "Work Orders", "read-only"],
))
print("wrote MOB.351 (ESTIMATES section x4 charge tabs)")
