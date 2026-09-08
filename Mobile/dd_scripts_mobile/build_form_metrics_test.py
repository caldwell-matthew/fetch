"""Build MOB.357_Work_Form_Metrics - the form-completion readout on a work order.

WHY THIS EXISTS
  `FormMetrics` is rendered TWICE on the work detail and had no checklist row until the
  2026-08-23 audit:

      WorkDetails.tsx:117   <FormMetrics forms={workStage.forms} type="WORK" />   (above the tabs)
      Forms/index.tsx:55    <FormMetrics forms={[form]}  type="FORMS" />          (inside each card)

  It is worth a test because it is DERIVED STATE, not a fetched string. It walks
  `forms[].fields[]`, counts `__typename === 'WorkStageFormDetail' && field.required`, and
  scores one complete per field with a `value` - OR, for `attributeTypeId.type === 'image'`,
  an `attachmentId` (`FormMetrics.tsx:17-19`). A payload-shape change zeroes it silently and
  nothing else in the suite would notice: `MOB.355` proves the form RENDERS, not that anything
  counted it.

BUILD AGAINST THE `FORMS` INSTANCE, NOT THE `WORK` ONE - this decided the whole test.
  The two branches do not have the same guard:

      type === 'WORK'  && required === 0   ->  return null        (renders NOTHING)
      type === 'FORMS'                     ->  always one metric  (no zero guard)

  So the header instance is fixture-dependent - it vanishes if the fixture's forms happen to
  have no required fields - while the per-card instance renders for every form card that
  exists. `MOB.355` already proves the fixture has at least one form card. The per-card
  readout is therefore the assertable one, and the header instance is covered as an
  exclusive-or (see below) rather than asserted present.

  ⚠️ The header label is `Form:` or `Forms:` - `Form${forms.length !== 1 ? 's' : ''}`
  (`:35`). Singular for exactly one form. Matching only "Forms:" would silently miss the
  one-form case, which is the likeliest state of this fixture. The regex below allows both.

WHY BOTH INSTANCES ARE ON SCREEN AT ONCE, AND WHY THE ASSERTIONS ARE JS
  The header instance sits OUTSIDE `InfiniteTabs`, so it is visible whatever tab is open -
  including the Forms tab, where every card renders the same "Required Fields Completed:"
  string. A page-text assertion cannot tell the two apart (trap 5b). Every assertion here is
  therefore scoped in JS: the header by `.mantine-Tabs-root`'s preceding content, the cards by
  the visible tabpanel.

READ-ONLY, AND IT MUST STAY THAT WAY
  🛑 A form card's `onClick` NAVIGATES to `/work/:id/form/:formId` (`Forms/index.tsx:31`).
  This test reads the cards and never clicks one - clicking is `MOB.355`'s job, and doing it
  here would leave the suite on the form route. Nothing is typed and nothing is submitted.

DEEP-LINKING IS CORRECT HERE, and only here-ish: `WorkStageDetails` reads its id from
  `useParams()` and queries directly (Operational notes), so the fixture is reachable without
  walking the list. The `/work` visit in front of it is `work_cache_warm` - the work lookups
  are `cache-only` and populated by `prefetchWorkData`.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      work_cache_warm)

FIXTURE = "EYRpYJ9QYdQ1JFF10JtB0Q"
WO_URL = f"{BASE}/work/{FIXTURE}"

# Lifted from MOB.355 rather than re-derived - same screen, same tab, already proven green.
TAB_STRIP = '(//*[@role="tab"])[1]'
FORMS_TAB = '//*[@role="tab"][contains(normalize-space(.), "Form")]'
VISIBLE_PANEL = '//*[@role="tabpanel"][not(contains(@style, "display: none"))]'
FORM_CARD = (f'({VISIBLE_PANEL}//*[contains(concat(" ", normalize-space(@class), " "),'
             f' " mantine-Paper-root ")]'
             f'[.//*[contains(concat(" ", normalize-space(@class), " "),'
             f' " mantine-Title-root ")]])')

# Shared by several assertions: the metric text as the component emits it,
# `{label}: {value}` with value `${complete} of ${required}`.
#
# ⚠️ RAW STRING WITH SINGLE BACKSLASHES, deliberately. This is interpolated into JS via an
# f-string, so what is written here reaches the browser verbatim. The first cut was
# r"...\\s*(\\d+)..." - copying the escaping style of the surrounding NON-raw literals, where
# "\\s" correctly yields "\s". In a RAW string "\\s" is two characters, so the emitted regex
# was /\\s*(\\d+)/ - which in JS matches a literal backslash, never whitespace or a digit.
# Every assertion using it would have failed with a locator-shaped error message. Caught by
# reading the generated JSON before pushing, which is the only reason it cost nothing.
#
# BOTH PATTERNS ARE ANCHORED (^...$) AND MATCHED AGAINST LEAF ELEMENTS - see LEAVES below.
METRIC_RE = r"^Required Fields Completed:\s*(\d+)\s+of\s+(\d+)$"
COUNT_RE = r"^Forms?:\s*(\d+)$"

# Collect the LEAF elements under `root` - those with no element children. FormMetrics renders
# each metric as its own `<Text>{label}: {value}</Text>` (:47-50), which has only text nodes
# inside, so one leaf === one metric and its textContent is exactly the string to match.
#
# ⚠️ THIS REPLACED A CONCATENATED-TEXT APPROACH THAT WAS SILENTLY BROKEN. The first cut built
# one string from `el.textContent` and matched /\bForms?:\s*(\d+)/ against it. React inserts no
# separator between sibling elements, so the header reads
#     "…Work Order NameForm: 1Required Fields Completed: 1 of 3"
# and `\b` does NOT match between "Name" and "Form" - both are word characters. The count
# assertion returned null on real markup while passing on every isolated string tested by hand.
# Measured with `node -e` against the concatenation the component actually produces; scanning
# leaves removes the whole class of problem rather than patching the boundary.
LEAVES = ("const leaves = (root) => [...root.querySelectorAll('*')]"
          ".filter(e => !e.children.length)"
          ".map(e => (e.textContent || '').trim());\n")

# Everything rendered ABOVE the tab strip - where the type="WORK" instance lives.
HEAD_LEAVES = (LEAVES +
               "const tabs = document.querySelector('.mantine-Tabs-root');\n"
               "const root = tabs && tabs.parentElement;\n"
               "if (!root) return false;\n"
               "let head = [];\n"
               "for (const el of root.children) {\n"
               "  if (el === tabs) break;\n"
               "  head = head.concat(leaves(el),"
               " el.children.length ? [] : [(el.textContent || '').trim()]);\n"
               "}\n")

# The form cards in the visible tab panel - where the type="FORMS" instances live.
CARDS = ("const p = [...document.querySelectorAll('[role=tabpanel]')]"
         ".find(e => !(e.getAttribute('style') || '').includes('display: none'));\n"
         "if (!p) return false;\n"
         "const cards = [...p.querySelectorAll('.mantine-Paper-root')]"
         ".filter(c => c.querySelector('.mantine-Title-root'));\n")

steps = work_cache_warm() + [
    go(WO_URL, "the fixture work order"),
    step("wait", "Let the detail view begin rendering", {"value": 3}),
    step("assertElementPresent", "GATE: the detail data arrived (tab strip)",
         {"element": xpath_el(WO_URL, TAB_STRIP)}, timeout=60),

    # ---- the header instance (type="WORK") --------------------------------------------------
    # EXCLUSIVE-OR, not a presence check. `type==='WORK' && required===0` renders nothing, and
    # whether this fixture's forms carry required fields is a data question. So: either the
    # readout is there AND well-formed, or it is absent - and if it is present but malformed,
    # neither holds and this fails (trap 5). It cannot rot into a fixture test either way.
    jsassert("HEADER: the WORK-level readout is either well-formed or correctly absent",
             HEAD_LEAVES +
             f"const m = head.map(t => t.match(/{METRIC_RE}/)).find(Boolean);\n"
             f"const c = head.map(t => t.match(/{COUNT_RE}/)).find(Boolean);\n"
             "if (!m && !c) return true;            // required === 0 branch\n"
             "if (!m || !c) return false;           // half-rendered — a real defect\n"
             "return Number(m[1]) <= Number(m[2]);", timeout=30),

    # ---- the per-card instance (type="FORMS") -----------------------------------------------
    step("click", "Open the Forms tab",
         {"element": xpath_el(WO_URL, FORMS_TAB)}, timeout=30),
    step("wait", "Wait for the forms list", {"value": 3}),
    step("assertElementPresent", "FIXTURE GUARD: the work order has at least one form card",
         {"element": xpath_el(WO_URL, f"{FORM_CARD}[1]")}, timeout=60),

    # The `FORMS` branch has no zero-guard, so EVERY card must carry the readout. Asserting
    # "every" rather than "at least one" is what makes this catch a single form whose fields
    # stopped being counted - an `at least one` check would pass on the others.
    jsassert("EVERY form card carries a well-formed 'X of Y' completion readout",
             LEAVES + CARDS +
             "if (!cards.length) return false;\n"
             f"const re = /{METRIC_RE}/;\n"
             "return cards.every(c => {\n"
             "  const m = leaves(c).map(t => t.match(re)).find(Boolean);\n"
             "  if (!m) return false;\n"
             "  const done = Number(m[1]), req = Number(m[2]);\n"
             "  return Number.isInteger(done) && Number.isInteger(req) && done <= req;\n"
             "});", timeout=30),

    # DERIVED-STATE CROSS-CHECK, and the assertion with the most teeth here. The header counts
    # `forms.length`; the panel renders one card per form. They are computed independently from
    # the same payload, so a drift between them means the form list and its metrics disagree -
    # which no single-sided assertion could see. Skipped only when the header is legitimately
    # absent (required === 0), which the first assertion already characterised.
    jsassert("CROSS-CHECK: the header's form COUNT equals the number of form cards",
             HEAD_LEAVES +
             f"const c = head.map(t => t.match(/{COUNT_RE}/)).find(Boolean);\n"
             "if (!c) return true;                  // header absent — required === 0\n" +
             CARDS +
             "return Number(c[1]) === cards.length;", timeout=30),

    # ⭐ THE SECOND CROSS-CHECK, and the one that replaced a fixture guard - see below.
    #
    # The two instances read the SAME `required` count through DIFFERENT branches:
    #     header (type="WORK")  renders  <=>  sum(required) > 0     (:29, the null guard)
    #     cards  (type="FORMS") render   always, showing per-form required
    # so "the header is present" must equal "some card declares a required field". That is a
    # biconditional between two independently computed values, it holds in BOTH fixture states,
    # and it breaks if either branch's counting breaks.
    #
    # 🔁 WHAT THIS REPLACED, AND WHY. The first version asserted `some card has required > 0`
    # as a FIXTURE GUARD - to stop a component that had stopped counting from passing with
    # "0 of 0" everywhere. It went RED on its first run (2026-08-23, MOB.985), and correctly:
    # the fixture work order's forms declare NO required fields, so every card really is
    # "0 of 0" and the header really is absent. The component was right and the assertion was
    # asking the fixture a question.
    # The biconditional asks the COMPONENT a question instead, and is strictly stronger: the
    # old guard could not fail while the fixture had a required field, whereas this one fails
    # the moment the two branches disagree, in either direction.
    # ⚠️ Residual gap, stated rather than hidden: with this fixture, the non-zero counting path
    # (`complete`/`required` actually incrementing) is NEVER exercised. Closing that needs a
    # form template with a required field - a FIXTURE change, now listed under 🟡 BLOCKED.
    jsassert("⭐ CROSS-CHECK 2: the header appears exactly when some card declares a required "
             "field",
             # HEAD_LEAVES already begins with LEAVES — concatenating both emits `const
             # leaves` twice and the step throws "Identifier 'leaves' has already been
             # declared", which Datadog reports as a falsy custom assertion and reads exactly
             # like a real finding. Caught in jsdom, not on Datadog.
             HEAD_LEAVES +
             f"const headerPresent = !!head.map(t => t.match(/{COUNT_RE}/)).find(Boolean);\n" +
             CARDS +
             f"const re = /{METRIC_RE}/;\n"
             "const anyRequired = cards.some(c => {\n"
             "  const m = leaves(c).map(t => t.match(re)).find(Boolean);\n"
             "  return !!m && Number(m[2]) > 0;\n"
             "});\n"
             "return headerPresent === anyRequired;", timeout=30),

    # 🛑 NOTHING IS CLICKED FROM HERE. A card's onClick navigates to /work/:id/form/:formId
    # (Forms/index.tsx:31) — that is MOB.355's job, and doing it here would strand the suite
    # on the form route.
    jsassert("READ-ONLY GUARD: still on the work detail, not the form route",
             "return /\\/work\\/[^/]+$/.test(location.pathname);", timeout=30),
]

write(test(
    "MOB.357_Work_Form_Metrics",
    "`MOB.357` **`FormMetrics` — the form-completion readout on a work order.**\n"
    "- Rendered **twice**: `WorkDetails.tsx:117` (`type=\"WORK\"`, above the tabs) and\n"
    "  `Forms/index.tsx:55` (`type=\"FORMS\"`, inside every form card). Had **no checklist\n"
    "  row** until the 2026-08-23 audit.\n"
    "- **Worth testing because it is DERIVED state**, not a fetched string — it counts\n"
    "  `required` fields with a `value`, or an `attachmentId` for image fields. A payload-shape\n"
    "  change zeroes it silently; `MOB.355` proves the form *renders*, not that anything\n"
    "  counted it.\n"
    "- ⚠️ **The two instances have different guards.** `WORK` renders **nothing** when\n"
    "  `required === 0`; `FORMS` has no such guard. So the per-card readout is asserted\n"
    "  directly, and the header one as an **exclusive-or** — well-formed, or correctly absent.\n"
    "  A half-rendered header fails.\n"
    "- ⭐ **The cross-check has the most teeth**: the header's `Form(s): N` and the number of\n"
    "  form cards are computed independently from the same payload, so a drift between them is\n"
    "  invisible to any one-sided assertion.\n"
    "- ⚠️ The header label is `Form:` **or** `Forms:` (`Form${n !== 1 ? 's' : ''}`) — singular\n"
    "  for one form, which is the likeliest state of this fixture. Both are matched.\n"
    "- 🛑 **READ-ONLY.** A form card's `onClick` navigates to `/work/:id/form/:formId`, so no\n"
    "  card is ever clicked — that is `MOB.355`'s job, and it would strand the suite on the\n"
    "  form route. A closing guard asserts we are still on the work detail.",
    steps,
    tags=["Mobile", "env:dev", "Work Order", "Forms", "read-only"],
))
print("wrote MOB.357 (work order form metrics)")
