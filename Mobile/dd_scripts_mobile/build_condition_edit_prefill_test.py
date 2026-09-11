"""Build MOB.387_Work_Condition_Edit_Prefill - `Edit Item` opens the form FILLED from its card
(checklist 🟢 #19).

WHAT THE SOURCE SAYS (origin/development)
  Each condition card's gear is `WorkCollectionMenu` (`WorkOrders/components/ui/Menu.tsx`) with
  `defaultValues={condition}`; `Edit Item` renders `ConditionForm` with `condition={condition}`,
  whose `defaultValues` (`Conditions/Form.tsx:55-86`) resolve the card's record against the stage's
  assets: asset, inspection group, element, and the three scores as ListFilter options named
  `score + ''` (`formatScoreOptions`). So the form should open showing exactly the card's values.
  Nothing tested `Edit Item` on any card (the sweep found it in no test).

FIXTURE: the fixture work order's ONE permanent condition - `Pump 0102 · Structural ·
Mounting/Support`, scores 1 / 2 / 3 (read over the API; MOB.390's own key is `Pump Body`).

🛑 READ-ONLY. The form is closed with Escape and never submitted; a reload then proves the card
is unchanged.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

FIXTURE_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
STAGE_URL = f"{BASE}/work/{FIXTURE_ID}"
EXPECT = {"assetId": "Pump 0102", "assetStandardDetailId": "Structural",
          "inspectionElementId": "Mounting/Support", "conditionFound": "1", "conditionScore": "2",
          "stressScore": "3"}
EDIT_ITEM = ('(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")]'
             '[normalize-space(.)="Edit Item"])[1]')


def tab(label):
    return f'//*[@role="tab"][contains(normalize-space(.), "{label}")]'


NORM = "const norm = t => (t || '').replace(/\\s+/g, ' ').trim();\n"
# The card: CollapsableSection Paper (toggle button = element name, Pill = group, gear) under an
# asset Paper whose first Text is the asset name (ConditionDetails.tsx / Conditions/index.tsx).
CARD_JS = (NORM +
           "const cards = [...new Set([...document.querySelectorAll('li')]\n"
           "  .filter(li => norm(li.textContent).indexOf('Condition Found:') === 0)\n"
           "  .map(li => li.closest('[class*=\"mantine-Paper-root\"]')))].filter(Boolean);\n"
           "const orig = cards.filter(c => {\n"
           "  const grp = c.parentElement && c.parentElement.closest('[class*=\"mantine-Paper-root\"]');\n"
           "  const a = grp && grp.querySelector('[class*=\"mantine-Text-root\"]');\n"
           "  const b = c.querySelector('button');\n"
           "  return a && norm(a.textContent) === 'Pump 0102' && b && norm(b.textContent) === 'Mounting/Support';\n"
           "});\n")
ORIG_VALUES = ("const lis = orig.length === 1 ? [...orig[0].querySelectorAll('li')].map(li => norm(li.textContent)) : [];\n"
               "const same = ['Condition Found: 1', 'Condition Score: 2', 'Stress Score: 3'].every(v => lis.includes(v));\n")

steps = [
    go(STAGE_URL, "the fixture work order"),
    step("wait", "Let the detail view begin rendering", {"value": 2}),
    step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}, timeout=30),
    step("click", "Open the Condition tab", {"element": xpath_el(STAGE_URL, tab("Condition"))}, timeout=30),
    step("wait", "Let the condition cards render", {"value": 2}),
    jsassert("PREMISE: exactly one `Pump 0102 · Mounting/Support` card, reading 1 / 2 / 3",
             CARD_JS + ORIG_VALUES + "return orig.length === 1 && same;", timeout=30),
    jsassert("Open that card's gear",
             CARD_JS + "if (orig.length !== 1) return false;\n"
             "const g = orig[0].querySelector('[aria-label=\"Menu\"]');\n"
             "if (!g) return false;\ng.click();\nreturn true;", timeout=30),
    step("wait", "Let the menu open", {"value": 1}),
    step("click", "Click `Edit Item`", {"element": xpath_el(STAGE_URL, EDIT_ITEM)}, timeout=30),
    step("wait", "Let the edit form mount (it loads the WorkStageCondition schema)", {"value": 3}),
    step("assertElementPresent", "The condition form opened",
         {"element": xpath_el(STAGE_URL, '//form[@id="work-condition-form"]')}, timeout=30),
    jsassert("⭐ PREFILLED from the card: asset, group, element and the three scores",
             "const want = " + repr(EXPECT).replace("'", '"') + ";\n"
             "const got = {};\n"
             "for (const k of Object.keys(want)) { const el = document.getElementById(k); got[k] = el ? (el.value || '').trim() : null; }\n"
             "return Object.keys(want).every(k => got[k] === want[k]);", timeout=30),
    step("pressKey", "Close the form with Escape — NEVER submitted", {"value": "Escape"}, always=True),
    step("wait", "Let the modal close", {"value": 2}, always=True),
    jsassert("The edit form is gone", "return !document.getElementById('work-condition-form');",
             always=True, timeout=20),
    go(STAGE_URL, "the fixture work order (reload)"),
    step("wait", "Let the detail view begin rendering", {"value": 2}),
    step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}, timeout=30),
    step("click", "Reopen the Condition tab", {"element": xpath_el(STAGE_URL, tab("Condition"))}, timeout=30),
    step("wait", "Let the condition cards render", {"value": 2}),
    jsassert("UNCHANGED after a reload: the card still reads 1 / 2 / 3",
             CARD_JS + ORIG_VALUES + "return orig.length === 1 && same;", timeout=30),
]

write(test(
    "MOB.387_Work_Condition_Edit_Prefill",
    "`MOB.387` **`Edit Item` opens the condition form filled from its own card.**\n"
    "- The fixture's permanent condition (`Pump 0102 · Structural · Mounting/Support`, 1/2/3):\n"
    "  gear → `Edit Item` → `#assetId` / `#assetStandardDetailId` / `#inspectionElementId` /\n"
    "  `#conditionFound` / `#conditionScore` / `#stressScore` hold exactly the card's values\n"
    "  (`ConditionForm`'s `defaultValues`).\n"
    "- 🛑 **READ-ONLY**: closed with Escape, never submitted; a reload proves the card unchanged.",
    steps,
    ["Mobile", "env:dev", "Work Order", "Condition", "read-only"],
))
print("wrote MOB.387 (condition edit prefill)")
