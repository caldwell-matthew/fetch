"""Build MOB.356_Work_Charge_Form_Validity - trap 8 across ALL FOUR charge forms, in one test.

THE GAP THIS CLOSES
  `MOB.350`/`360`/`370`/`380` each add a charge with valid input. Four happy paths. None of them
  proves what happens when the form is NOT valid - which is the case that actually bites, because
  of trap 8:

      SubmitButton.tsx:14   type={isValid ? 'submit' : 'button'}

  An invalid form's Submit is a plain `<button>` with no handler. Pressing it does NOTHING: no
  error, no toast, no validation message. That ambiguity is why `MOB.380` was once misdiagnosed
  for runs - "clicked, no toast" reads identically to "worked, toast missed".

ONE TEST, FOUR FORMS - because they are ONE COMPONENT
  Equipment / Labor / Material / Other all render through `WorkCollectionForm`
  (`ui/Form.tsx:80`), which emits a single `<form id="work-collection-form">` and one
  `SubmitButton form="work-collection-form"`. Four near-identical tests would be four things to
  maintain and would not cover a single extra branch. The loop below is over TAB NAMES only.

PROVEN TWO INDEPENDENT WAYS, which is the point
  `SubmitButton` expresses invalidity twice over:
      type={isValid ? 'submit' : 'button'}     <- semantics
      opacity={!isValid ? 0.5 : 1}             <- appearance
  Asserting only the attribute would pass if the button were merely mislabelled; asserting only
  the opacity would pass on any dimmed element. Together they pin the actual `isValid` state.
  The opacity read is a `getComputedStyle` assertion, the same technique `MOB.342` uses for
  status colour - Datadog cannot see colour, but JS can.

⚠️ VALIDITY MEANS DIFFERENT THINGS IN THE TWO MODES - do not "simplify" this away
      CREATE:  isValid
      UPDATE:  isValid && isDirty
  So an inert Submit on an EXISTING charge proves only that nothing was edited - dirtiness, not
  validity. This test therefore only ever opens the **Add** (CREATE) form, where an inert Submit
  unambiguously means invalid. A future UPDATE leg must assert something different, and must say
  so.

🛑 READ-ONLY, AND STRICTLY SO. Nothing is typed and nothing is submitted. The form is opened,
read, and escaped. That is deliberate: `MOB.350`-`380` already cover the write path, and this
test has to be safe to run beside them in a suite that shares one browser session. It also means
it cannot consume fixture data the way a self-degrading picker does (trap 10).
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert, work_cache_warm  # noqa: E402

WORK_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"          # the fixture work order MOB.350-380 all use
WORK_URL = f"{BASE}/work/{WORK_ID}"
FORM_ID = "work-collection-form"

# Equipment first because MOB.350 proves that tab reachable; the rest follow its shape.
TABS = ["Equipment", "Labor", "Material", "Other"]

# `SubmitButton` renders with form="work-collection-form" (Form.tsx:98). Find it by that
# association rather than by text - the same shape MOB.347 uses for asset-status-form.
FIND_SUBMIT = (
    "const b = [...document.querySelectorAll('button')]"
    f".find(x => x.getAttribute('form') === '{FORM_ID}');\n"
)


def tab_el(name):
    return xpath_el(WORK_URL, f'//*[@role="tab"][contains(normalize-space(.), "{name}")]')


def legs(name):
    """The six steps that interrogate one charge form. Identical for all four by design."""
    return [
        step("click", f"{name}: open the tab", {"element": tab_el(name)},
             always=True, timeout=30),
        step("click", f"{name}: open the Add form",
             {"element": xpath_el(WORK_URL, '//button[normalize-space(.)="Add"]')},
             always=True, timeout=30),
        # GATE, polling. Without it the two assertions below could both pass vacuously on a
        # page where the form never opened (trap 5) - `find(...)` would return undefined and a
        # naive `!b.type` style check would be truthy.
        step("assertElementPresent", f"{name}: GATE — poll until the form itself exists",
             {"element": xpath_el(WORK_URL, f'//form[@id="{FORM_ID}"]')},
             always=True, timeout=30),

        # ---- trap 8, proof #1: semantics -------------------------------------------------
        jsassert(f"{name}: ⭐ TRAP 8 — Submit is type=\"button\" (INERT) on the untouched form",
                 FIND_SUBMIT + "if (!b) return false;\n"
                 "return b.getAttribute('type') === 'button';",
                 always=True, timeout=30),
        # ---- trap 8, proof #2: appearance, independent of the attribute ------------------
        jsassert(f"{name}: the button is also DIMMED (opacity 0.5) — a second, independent "
                 f"read of the same `isValid` state",
                 FIND_SUBMIT + "if (!b) return false;\n"
                 "const o = parseFloat(getComputedStyle(b).opacity);\n"
                 "return !isNaN(o) && o < 0.9;",
                 always=True, timeout=30),

        # 🛑 Escape, never submit. Read-only is what makes this safe beside MOB.350-380.
        step("pressKey", f"{name}: close the form WITHOUT submitting", {"value": "Escape"},
             always=True),
        step("wait", f"{name}: let the modal close", {"value": 2}, always=True),
        # ⚠️ NAME CORRECTED + PAIRED WITH A LIVENESS ANCHOR — `audit_assertions.py`
        # (VACUOUS-ABSENCE). This used to be named "nothing was submitted", which it does not
        # prove: the form is gone because the Escape above dismissed it, and a bare absence is
        # equally true on a blank page, a crashed render or a login redirect.
        # ⭐ **The real no-submit proof is the TRAP 8 step above** — a `type="button"` submit is
        # inert and cannot post. This step only closes the loop on the dismissal, and now says so.
        # The tab strip is asserted alongside it so the absence means "the form went" rather than
        # "the page went".
        jsassert(f"{name}: the form was DISMISSED (page still alive — the no-submit proof is "
                 f"the trap-8 step above, not this one)",
                 "if (!document.querySelectorAll('[role=tab]').length) return false;  // alive\n"
                 f"return !document.getElementById('{FORM_ID}');",
                 always=True, timeout=30),
    ]


steps = [
    # The charge forms' lookups read from the Apollo cache, so /work must be visited first or
    # the options never load. Same reason MOB.350 opens with it.
    *work_cache_warm(),
    go(WORK_URL, "the fixture work order"),
    step("wait", "Let the detail view begin rendering", {"value": 3}),
    step("assertPageContains", "GATE: the work order detail rendered", {"value": "Status:"},
         timeout=60),
]
for t in TABS:
    steps += legs(t)

write(test(
    "MOB.356_Work_Charge_Form_Validity",
    "`MOB.356` **Trap 8 across all four charge forms** — the negative case `MOB.350`–`MOB.380`\n"
    "never covered.\n"
    "- **The gap**: those four each add a charge with *valid* input. Four happy paths. None\n"
    "  proves what an INVALID form does — and `SubmitButton.tsx:14` is\n"
    "  `type={isValid ? 'submit' : 'button'}`, so pressing an invalid Submit does **nothing**:\n"
    "  no error, no toast. *\"Clicked, no toast\"* is indistinguishable from *\"worked, toast\n"
    "  missed\"*, which is what once cost `MOB.380` several runs of misdiagnosis.\n"
    "- **One test, four forms — because they are ONE component.** All four render through\n"
    "  `WorkCollectionForm` (`ui/Form.tsx:80`), emitting a single `<form\n"
    "  id=\"work-collection-form\">`. Four separate tests would cover no extra branch.\n"
    "- ⭐ **Proven two independent ways.** `SubmitButton` expresses invalidity twice — the\n"
    "  `type` attribute (semantics) and `opacity: 0.5` (appearance, read via\n"
    "  `getComputedStyle`, the `MOB.342` technique). The attribute alone would pass on a\n"
    "  mislabelled button; the opacity alone on any dimmed element. Together they pin\n"
    "  `isValid`.\n"
    "- ⚠️ **Only the ADD (CREATE) form is opened.** Validity differs by mode: CREATE is\n"
    "  `isValid`, UPDATE is `isValid && isDirty` — so an inert Submit on an *existing* charge\n"
    "  would prove **dirtiness**, not validity. A future UPDATE leg must assert something\n"
    "  different and say so.\n"
    "- 🛑 **Strictly read-only**: nothing typed, nothing submitted, every form escaped. Safe\n"
    "  beside the four write tests in a shared session, and it cannot eat fixture data.",
    steps,
    tags=["Mobile", "env:dev", "Work Orders", "read-only"],
))
print("wrote MOB.356 (charge form validity — trap 8 x4)")
