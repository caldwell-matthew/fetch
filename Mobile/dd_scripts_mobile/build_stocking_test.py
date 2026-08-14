"""Build MOB.870 - the Material Lookup STOCKING form (the second tab of the adjust modal).

WHY THIS IS A SEPARATE TEST FROM MOB.860 AND NOT AN EXTRA LEG
  Both forms live in the same modal, behind a SegmentedControl:

      Quantity Adjustment  (tab 1, default)  -> MOB.860, signed amount + reason
      Stock Item           (tab 2)           -> THIS TEST, quantity + unitPrice

  They are different mutations (`adjustStoreroomItemQuantity` vs `STOCK_STOREROOM_ITEM`) with
  different required fields, so folding stocking into MOB.860 would make one test's failure
  ambiguous between two code paths.

ONE-WAY, AND THAT IS ACCEPTED
  Stocking only ADDS. There is no negative quantity to net it back with, so unlike MOB.860
  this test is NOT self-restoring: every run permanently increases the fixture item's stock
  by 1. The repo owner accepted that trade-off explicitly (2026-08-12), same standing
  decision as MOB.600 / MOB.991 / MOB.987. The amount is kept at 1 to keep the drift slow.

BOTH FIELDS ARE REQUIRED - FILLING ONLY THE OBVIOUS ONE WOULD SILENTLY DO NOTHING
  `stockingFormSchema` marks BOTH `quantity` ("Stocked Quantity") and `unitPrice`
  ("Unit Price") as required, and SubmitButton is `type={isValid ? 'submit' : 'button'}`.
  Filling only the quantity produces a button that does nothing, with no error and no toast
  (trap 8) - exactly how `unitPrice` broke MOB.380 once already. Checked the schema rather
  than assuming a stocking form only needs a quantity.

THE MODAL CLOSING IS REAL PROOF HERE
  `close()` runs inside the mutation's `update()` and there is no `optimisticResponse`
  (StockAdjustments.tsx:74-91), so it only fires on a confirmed server response - trap 6's
  trustworthy case, the same shape as MOB.300 and MOB.860. The `cache.modify` in that
  callback also writes the SERVER's returned `inventoryQuantity` back, so the quantity shown
  afterwards is the server's number, not a guess.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write  # noqa: E402

MATERIAL_URL = BASE + "/material-lookup"
STOREROOM = "Central Storeroom"
ITEM = "000-000-000 Adamantium"
ITEM_SEARCH = "Adamantium"
TAGS = ["Mobile", "env:dev", "Material Lookup", "CRUD", "residue"]

PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]'
SEARCH = '//input[@placeholder="Search for material items by name"]'
STOREROOM_SELECT = '//*[@id="storeroomLocationId"]'
SUBMIT = '//button[normalize-space(.)="Submit"]'
STOCK_TAB = '//label[normalize-space(.)="Stock Item"]'
QUANTITY = '//*[@id="quantity"]'
UNIT_PRICE = '//*[@id="unitPrice"]'
# faArrowUpRightFromSquare -> "arrow-up-right-from-square" (looked up, trap 14). Scoped to the
# fixture item's row so it cannot hit another row's button.
ROW_ACTION = (f'//tr[contains(normalize-space(.), "{ITEM}")]'
              '//button[.//*[@data-icon="arrow-up-right-from-square"'
              ' or contains(concat(" ", normalize-space(@class), " "),'
              ' " fa-arrow-up-right-from-square ")]]')


def option(text):
    return f'//*[@role="option"][contains(normalize-space(.), "{text}")]'


write(test(
    "MOB.870_MaterialLookup_Stocking",
    "`MOB.870` Stock the fixture item through the **Stock Item** tab of the adjust modal.\n"
    "- ⚠️ **LEAVES RESIDUE — NOT self-restoring.** Stocking only adds; there is no negative to\n"
    f"  net it back. Every run raises `{ITEM}`'s quantity by **1**, permanently. Accepted by\n"
    "  the repo owner 2026-08-12, same standing trade-off as MOB.600 / MOB.991 / MOB.987.\n"
    "  Kept at 1 so the drift stays slow. **Do not increase the amount.**\n"
    "- Distinct from **MOB.860**: same modal, different tab, different mutation\n"
    "  (`STOCK_STOREROOM_ITEM` vs the quantity adjustment) and different required fields.\n"
    "  Folding them together would make a failure ambiguous between two code paths.\n"
    "- **Both `Stocked Quantity` and `Unit Price` are required.** Filling only the quantity\n"
    "  leaves `SubmitButton` as `type=\"button\"` — a silent no-op with no error and no toast\n"
    "  (trap 8), which is exactly how `unitPrice` broke MOB.380. Read from\n"
    "  `stockingFormSchema` rather than assumed.\n"
    "- The modal closing is genuine proof: `close()` is inside the mutation's `update()` with\n"
    "  no `optimisticResponse` (`StockAdjustments.tsx:74-91`), so it only fires on a confirmed\n"
    "  server response (trap 6). That callback also writes the server's returned\n"
    "  `inventoryQuantity` back into the cache.",
    [
        go(MATERIAL_URL, "material lookup"),
        step("wait", "Wait for the page to mount", {"value": 6}),
        step("assertElementContent", 'Test the "Material Lookup" page rendered',
             {"check": "contains", "value": "Material Lookup",
              "element": xpath_el(MATERIAL_URL, PAGE_TITLE)}),
        step("click", "Open the storeroom dropdown",
             {"element": xpath_el(MATERIAL_URL, STOREROOM_SELECT)}),
        step("wait", "Wait for storeroom options", {"value": 2}),
        step("click", f"Pick {STOREROOM}",
             {"element": xpath_el(MATERIAL_URL, option(STOREROOM))}),
        step("wait", "Wait for the material list to load", {"value": 8}),
        step("click", "Focus the material search",
             {"element": xpath_el(MATERIAL_URL, SEARCH)}),
        step("typeText", f"Search for {ITEM_SEARCH}",
             {"value": ITEM_SEARCH, "element": xpath_el(MATERIAL_URL, SEARCH)}),
        step("wait", "Wait for the search debounce", {"value": 4}),
        step("assertPageContains", "The fixture item is listed", {"value": ITEM}),

        # -------- open the modal and switch to the stocking tab
        step("click", f"Open the stock modal for {ITEM}",
             {"element": xpath_el(MATERIAL_URL, ROW_ACTION)}),
        step("wait", "Wait for the modal", {"value": 3}),
        step("assertPageContains", "The modal opened on the adjustment tab",
             {"value": "Current Quantity"}),
        step("click", 'Switch to the "Stock Item" tab',
             {"element": xpath_el(MATERIAL_URL, STOCK_TAB)}),
        step("wait", "Wait for the stocking form", {"value": 2}),
        step("assertElementPresent", "FIELD GUARD: the Stocked Quantity input rendered",
             {"element": xpath_el(MATERIAL_URL, QUANTITY)}),
        step("assertElementPresent", "FIELD GUARD: the Unit Price input rendered (REQUIRED — "
             "leaving it empty makes Submit a silent no-op)",
             {"element": xpath_el(MATERIAL_URL, UNIT_PRICE)}),

        # -------- both required fields, then submit
        step("click", "Focus Stocked Quantity",
             {"element": xpath_el(MATERIAL_URL, QUANTITY)}),
        step("typeText", "Stock a quantity of 1 (kept small — this is permanent)",
             {"value": "1", "element": xpath_el(MATERIAL_URL, QUANTITY)}),
        step("click", "Focus Unit Price", {"element": xpath_el(MATERIAL_URL, UNIT_PRICE)}),
        step("typeText", "Enter a unit price of 1",
             {"value": "1", "element": xpath_el(MATERIAL_URL, UNIT_PRICE)}),
        step("click", "Submit the stocking form",
             {"element": xpath_el(MATERIAL_URL, SUBMIT)}),

        # Toast first: react-toastify autoCloses at 5000ms, so asserting it after a long wait
        # is a step that can never pass (trap 16b).
        step("wait", "Brief wait for the toast", {"value": 2}),
        step("assertPageContains", "Stocked toast (optional: transient)",
             {"value": "Storeroom item stocked"}, optional=True),
        step("wait", "Wait for the stock mutation to settle", {"value": 5}),
        step("assertPageLacks",
             "PROOF: the stocking was accepted — the modal closed, which only happens inside "
             "the mutation's update() with no optimisticResponse",
             {"value": "Current Quantity"}),
    ],
    TAGS,
))

# ---------------------------------------------------------------- wire into MOB.998
suite_path = os.path.join(HERE, "MOB.998_MaterialLookup_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
CHILD = "MOB.870_MaterialLookup_Stocking"
if CHILD not in [s.get("name") for s in steps]:
    steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                  "isCritical": True, "name": CHILD, "noScreenshot": False,
                  "type": "playSubTest",
                  "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"added {CHILD} to MOB.998")
    print("NB: MOB.998 was documented as fully self-restoring - it is NOT any more. "
          "Update the checklist's Coverage table.")

print("wrote MOB.870 (stocking)")
