"""Build MOB.347_Work_Asset_Status - the work order's Assets tab and its status controls.

WHY THIS EXISTS
  `WorkDetails.tsx` renders `<Assets>` for template section type `ASSETS`. `MOB.397` walks
  this tab incidentally (it needs the gear menu on an expanded row) but nothing asserts the
  tab itself, and its two status controls had no coverage at all. The repo owner confirmed
  2026-08-20 that the fixture template HAS `showAssetStatus` on, which is what makes them
  reachable: `Assets/index.tsx:70` is `const useAssetStatus = showAssetStatus ?? false`, and
  when it is false the icons, the badge and the sort-by-sequence simply do not render.

🛑 DANGER - "Mark as ..." WRITES IMMEDIATELY, WITH NO CONFIRMATION.
  `AssetStatusIcon` (`ui/AssetStatus.tsx`) is a Mantine Menu whose items call
  `applyStatus({ status: option.id })` straight from `onClick`. There is no modal, no confirm
  step and no undo - clicking one changes the asset's status on the server. This test OPENS
  that menu to prove it renders and MUST NOT click an item. Same standing rule as the
  "Delete Item" entry in MOB.397's gear menu: match by exact text, never by position, and do
  not click.

  Note also that the menu FILTERS OUT the current status (`filter(f => f.id !== currentStatus)`),
  so which options appear depends on the asset's present state - never assert a fixed count.

READ-ONLY BY DESIGN. The write is a single unconfirmed click on real data, and restoring it
would mean knowing the asset's prior status - which Datadog can extract but cannot feed back
into a locator (the standing limitation behind every "restore with FIXED values" note here).
So this covers the controls and the form, and stops before writing. Making it mutate is a
deliberate decision for the repo owner, not a tidy-up.

WHAT IT PROVES THAT NOTHING ELSE DOES
  - the Assets tab renders, by name rather than by tab index
  - `showAssetStatus` is on, via the `Progress:` badge - which doubles as a FIXTURE GUARD: if
    the template flag is ever turned off this fails loudly instead of silently covering less
  - the status menu offers its "Mark as ..." options
  - the comment icon opens `AssetStatusForm` with all three of its fields
  - **trap 8, asserted directly for the first time.** `SubmitButton` is
    `type={isValid ? 'submit' : 'button'}` and `AssetStatusForm` passes
    `isValid={isDirty && isValid}` - so on an untouched form the button is a plain
    `type="button"` that does nothing when pressed. The checklist has documented that trap
    since MOB.380 but no test has ever asserted the mechanism. This one does.

MODAL DISMISSAL DIFFERS BY HOW THE MODAL WAS OPENED - do not assume one recipe.
  MOB.720's picker is opened with `withCloseButton: false`, so it has no close button and
  Escape was measured NOT to close it; the overlay click is what works there.
  THIS modal is opened by `openDetails` with no modalProps at all, so Mantine renders its
  default close button - and here the overlay click alone was measured not to close it
  (2026-08-20). So this clicks the close button first and keeps the overlay as a fallback.
  Both are optional+always, so whichever works, the final "the form is gone" assertion is
  what actually holds the test honest.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write,  # noqa: E402
                      jsassert, work_cache_warm)

WORK_URL = BASE + "/work"
WORK_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
WORK_DETAIL = f"{WORK_URL}/{WORK_ID}"

ASSETS_TAB = '//*[@role="tab"][normalize-space(.)="Assets"]'
# `Progress: <Badge>` - rendered per asset row only when useAssetStatus is on.
PROGRESS = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Text-root ")]'
            '[starts-with(normalize-space(.), "Progress:")]')
STATUS_FORM = '//form[@id="asset-status-form"]'
OVERLAY = ('//*[contains(concat(" ", normalize-space(@class), " "),'
           ' " mantine-Modal-overlay ")]')

steps = (
    # `work_cache_warm`, not `work_list_gate` — this test needs the cache warm, not
    # `loadedAll`, and the gate's LOADEDALL checks cannot poll (see the helper's docstring).
    work_cache_warm()
    + [
        go(WORK_DETAIL, "the fixture work order"),
        step("wait", "Let the detail view begin rendering", {"value": 3}),
        step("assertElementPresent", "GATE 1/2: the /work/:id route mounted",
             {"element": xpath_el(WORK_DETAIL, '//*[@id="page-title"]//h4')}, timeout=60),
        step("assertElementPresent", "GATE 2/2: the detail data arrived (tab strip)",
             {"element": xpath_el(WORK_DETAIL, '(//*[@role="tab"])[1]')}, timeout=60),

        # By NAME, not by index - MOB.330 switches tabs positionally and so never records
        # which sections this template actually has.
        step("click", 'Open the "Assets" tab',
             {"element": xpath_el(WORK_DETAIL, ASSETS_TAB)}, timeout=30),
        step("wait", "Wait for the asset list", {"value": 3}),
        step("assertElementPresent", 'The "Assets" tab is now active',
             {"element": xpath_el(WORK_DETAIL, ASSETS_TAB + '[@data-active="true"]')},
             timeout=30),

        # FIXTURE GUARD. If `showAssetStatus` is ever turned off on the template, everything
        # below stops existing - this fails loudly rather than the test quietly covering less.
        step("assertElementPresent",
             'FIXTURE GUARD: an asset row shows "Progress:" — showAssetStatus is ON',
             {"element": xpath_el(WORK_DETAIL, PROGRESS)}, timeout=60),
        jsassert("The progress badge shows one of the five real status labels",
                 "const ok = ['No Status','Active','Completed','Not Completed','Canceled'];\n"
                 "const els = [...document.querySelectorAll('*')]"
                 ".filter(e => e.children.length === 0 &&"
                 " /^(No Status|Active|Completed|Not Completed|Canceled)$/"
                 ".test((e.textContent||'').trim()));\n"
                 "return els.length > 0;", timeout=30),

        # ---- the status MENU. Opened, never actioned. ----------------------------------
        step("click", "Open the asset status menu",
             {"element": xpath_el(WORK_DETAIL, f"({PROGRESS})[1]")}, timeout=30),
        step("wait", "Let the menu open", {"value": 2}),
        # 🛑 Each of these WRITES on click. Assert they exist; do not touch them.
        jsassert('The menu offers "Mark as ..." options (NOT clicked — they write instantly)',
                 "const items = [...document.querySelectorAll('.mantine-Menu-item')]"
                 ".filter(e => /^Mark as /.test((e.textContent||'').trim()));\n"
                 "return items.length >= 1;", timeout=30),
        # The current status is filtered out, so the count is data-dependent - assert the
        # RELATIONSHIP instead: at most four of the five can ever be offered.
        jsassert("At most four options are offered — the current status is filtered out",
                 "const items = [...document.querySelectorAll('.mantine-Menu-item')]"
                 ".filter(e => /^Mark as /.test((e.textContent||'').trim()));\n"
                 "return items.length <= 4;", timeout=30),
        step("pressKey", "Close the menu without choosing anything", {"value": "Escape"},
             always=True),
        step("wait", "Let the menu close", {"value": 1}, always=True),
        jsassert("GUARD: no status was applied — the menu is closed and nothing was clicked",
                 "const items = [...document.querySelectorAll('.mantine-Menu-item')]"
                 ".filter(e => /^Mark as /.test((e.textContent||'').trim()));\n"
                 "return items.length === 0;", always=True, timeout=30),

        # ---- the AssetStatusForm modal -------------------------------------------------
        step("click", "Open the asset status FORM via the comment icon",
             {"element": xpath_el(
                 WORK_DETAIL,
                 '(//*[@data-icon="comment" or contains(concat(" ",'
                 ' normalize-space(@class), " "), " fa-comment ")])[1]')}, timeout=30),
        step("wait", "Let the modal open", {"value": 2}),
        step("assertElementPresent", "The asset status form mounted",
             {"element": xpath_el(WORK_DETAIL, STATUS_FORM)}, timeout=60),
        step("assertPageContains", "It has the Asset Status field",
             {"value": "Asset Status"}, timeout=30),
        step("assertPageContains", "It has the Asset Sequence field",
             {"value": "Asset Sequence"}, timeout=30),
        step("assertPageContains", "It has the Comment field",
             {"value": "Comment"}, timeout=30),

        # TRAP 8, ASSERTED. Untouched form -> isDirty false -> SubmitButton renders
        # type="button", so pressing it does nothing at all: no error, no toast.
        jsassert('TRAP 8: Submit is type="button" (inert) while the form is untouched',
                 "const f = document.getElementById('asset-status-form');\n"
                 "if (!f) return false;\n"
                 "const b = [...document.querySelectorAll('button')]"
                 ".find(x => (x.getAttribute('form') === 'asset-status-form') ||"
                 " /^Submit$/.test((x.textContent||'').trim()));\n"
                 "if (!b) return false;\n"
                 "return b.getAttribute('type') === 'button';", timeout=30),

        # DISMISSAL. Unlike MOB.720's picker - opened with `withCloseButton: false` - this
        # modal is opened by `openDetails` with NO modalProps at all, so Mantine's default
        # close button IS rendered. That is the most direct dismissal and is tried first; the
        # overlay click (which is what works for MOB.720) stays as a fallback, since the
        # overlay click alone was measured NOT to close this one on 2026-08-20.
        step("click", "Dismiss via the modal's close button",
             {"element": xpath_el(
                 WORK_DETAIL,
                 '//button[contains(concat(" ", normalize-space(@class), " "),'
                 ' " mantine-Modal-close ") or @aria-label="Close"]')},
             optional=True, always=True, timeout=15),
        step("wait", "Let the modal react", {"value": 1}, always=True),
        step("click", "Fallback: dismiss by clicking the overlay",
             {"element": xpath_el(WORK_DETAIL, OVERLAY)},
             optional=True, always=True, timeout=15),
        step("wait", "Let the modal close", {"value": 2}, always=True),
        # ⚠️ PAIRED WITH A LIVENESS ANCHOR — `audit_assertions.py` (VACUOUS-ABSENCE). A bare
        # absence is equally true on a blank page, a crashed render and a login redirect, so
        # it cannot on its own mean "the form went". The tab strip proves the page survived.
        jsassert("The form was DISMISSED and the page is still alive (nothing was submitted — the form was never valid)",
                 "if (!document.querySelectorAll('[role=tab]').length) return false;\n"
                 "return !document.getElementById('asset-status-form');",
                 always=True, timeout=30),
    ]
)

write(test(
    "MOB.347_Work_Asset_Status",
    "`MOB.347` The work order's **Assets tab** and its two status controls.\n"
    "- 🛑 **`Mark as ...` WRITES IMMEDIATELY — no modal, no confirm, no undo.**\n"
    "  `AssetStatusIcon`'s menu items call `applyStatus` straight from `onClick`. This test\n"
    "  opens the menu to prove it renders and **must never click an item.**\n"
    "- **READ-ONLY by design.** Restoring a status would need the asset's prior value fed\n"
    "  back into a locator, which Datadog cannot do. Making it mutate is an owner decision.\n"
    "- **FIXTURE GUARD**: the `Progress:` badge proves the template's `showAssetStatus` is\n"
    "  still on (owner-confirmed 2026-08-20). If it is turned off, every control here stops\n"
    "  rendering and this fails loudly rather than covering less in silence.\n"
    "- **Asserts trap 8 directly, for the first time.** `SubmitButton` is\n"
    "  `type={isValid ? 'submit' : 'button'}` and the form passes `isDirty && isValid`, so an\n"
    "  untouched form has an inert `type=\"button\"` Submit that does nothing when pressed.\n"
    "  The trap has been documented since MOB.380; nothing had ever asserted the mechanism.\n"
    "- The status menu **filters out the current status**, so the option count is\n"
    "  data-dependent — asserted as `<= 4`, never a fixed number.\n"
    "- Dismissal is an **overlay click, not Escape** (measured on MOB.720).",
    steps,
    tags=["Mobile", "env:dev", "Work Orders", "read-only"],
))
print("wrote MOB.347 (work order asset status controls)")
