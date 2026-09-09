"""Build MOB.998_MaterialLookup_Suite - the last wholly-untested module.

WHAT THIS SCREEN ACTUALLY DOES - the inherited checklist was wrong about it
  The inherited list named six things. Only three exist here:

    Storeroom dropdown        real - FormFieldContainer id="storeroomLocationId"
    Cycle count               real - the quantity ADJUSTMENT form (adjustment + reason +
                                     countDate) -> toast "Storeroom item quantity adjusted"
    (stocking)                real - a second form, quantity only -> "Storeroom item stocked"
    Material issue / return   NOT HERE. Those are work-order material charges and MOB.370
                              already covers them. This screen adjusts and stocks.
    Transfers                 DOES NOT EXIST - zero matches across all of client/mobile
    Reorder notifications     DOES NOT EXIST - zero matches across all of client/mobile

  Same category as "Switch Crews - Close button": inherited items for controls the app does
  not have. Recorded rather than left implying missing coverage.

SELF-RESTORING BY ARITHMETIC
  The adjustment form takes a signed amount, so +1 then -1 returns the item to its starting
  quantity. That makes this the third self-restoring suite. Do NOT change it to only add:
  the point is that the fixture item's stock does not drift.

WHY MODAL-CLOSE IS REAL PROOF HERE
  `close()` is called inside the mutation's `update()` callback and there is no
  optimisticResponse (StockAdjustments.tsx:26-43), so it only runs on a confirmed server
  response - trap 6's trustworthy case, the same shape as MOB.300. The toast is transient
  and stays optional.

PERMISSIONS
  Both stock forms are gated on `storeRoom?.permissions?.canAdjust`. That IS a real field
  (`StoreroomItemPermission { canIssue, canAdjust }`) - unlike `wPerms.canDelete` in
  bugs_found.md 4b, this one is not a typo. Checked before assuming.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, go, test, write  # noqa: E402

MATERIAL_URL = BASE + "/material-lookup"
STOREROOM = "Central Storeroom"
ITEM = "000-000-000 Adamantium"
ITEM_SEARCH = "Adamantium"
NO_MATCH = "ZZZZ-NO-SUCH-ITEM"
REASON = "Error Correction"
TAGS = ["Mobile", "env:dev", "Material Lookup"]

PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]'
SEARCH = '//input[@placeholder="Search for material items by name"]'
STOREROOM_SELECT = '//*[@id="storeroomLocationId"]'
SUBMIT = '//button[normalize-space(.)="Submit"]'
ROW_ACTION = (f'//tr[contains(normalize-space(.), "{ITEM}")]'
              '//button[.//*[@data-icon="arrow-up-right-from-square"'
              ' or contains(concat(" ", normalize-space(@class), " "),'
              ' " fa-arrow-up-right-from-square ")]]')


def option(text):
    return f'//*[@role="option"][contains(normalize-space(.), "{text}")]'


def pick_storeroom():
    return [
        step("click", "Open the storeroom dropdown",
             {"element": xpath_el(MATERIAL_URL, STOREROOM_SELECT)}),
        step("wait", "Wait for storeroom options", {"value": 2}),
        step("click", f"Pick {STOREROOM}",
             {"element": xpath_el(MATERIAL_URL, option(STOREROOM))}),
        step("wait", "Wait for the material list to load", {"value": 8}),
    ]


# ---------------------------------------------------------------- read
write(test(
    "MOB.850_MaterialLookup_Read",
    "`MOB.850` Storeroom dropdown and material search.\n"
    "- READ-ONLY. Selecting a storeroom and searching moves no stock.\n"
    f"- Proves search with a matched pair: `{ITEM_SEARCH}` must SHOW the fixture item, and a\n"
    "  non-matching term must HIDE it. The negative leg is what proves the search filters\n"
    "  rather than merely accepting text.\n"
    "- Typing APPENDS in Datadog, so the junk term is appended to the matching one instead\n"
    "  of needing a clear step.",
    [
        go(MATERIAL_URL, "material lookup"),
        step("wait", "Wait for the page to mount", {"value": 6}),
        step("assertElementContent", 'Test the "Material Lookup" page rendered',
             {"check": "contains", "value": "Material Lookup",
              "element": xpath_el(MATERIAL_URL, PAGE_TITLE)}),
        step("assertElementPresent", "Test the storeroom dropdown renders",
             {"element": xpath_el(MATERIAL_URL, STOREROOM_SELECT)}),
    ] + pick_storeroom() + [
        step("click", "Focus the material search",
             {"element": xpath_el(MATERIAL_URL, SEARCH)}),
        step("typeText", f"Search for {ITEM_SEARCH}",
             {"value": ITEM_SEARCH, "element": xpath_el(MATERIAL_URL, SEARCH)}),
        step("wait", "Wait for the search debounce", {"value": 4}),
        step("assertPageContains", f"PROOF: the search finds {ITEM}", {"value": ITEM}),
        step("typeText", "Append junk so the query cannot match",
             {"value": NO_MATCH, "element": xpath_el(MATERIAL_URL, SEARCH)}),
        step("wait", "Wait for the search debounce", {"value": 4}),
        step("assertPageLacks", f"PROOF: a non-matching search hides {ITEM}", {"value": ITEM}),
    ],
    TAGS + ["read-only"],
))

# ---------------------------------------------------------------- cycle count
def adjust(amount, label):
    return [
        # The row TEXT is not clickable. Each row carries an ActionIcon (gated on
        # `canAdjust`) whose icon is faArrowUpRightFromSquare -> canonical name
        # "arrow-up-right-from-square" (looked up, not guessed - trap 14). Scope it to the
        # <tr> holding the fixture item so it cannot hit another row's button.
        step("click", f"Open the stock adjustment for {ITEM}",
             {"element": xpath_el(MATERIAL_URL, ROW_ACTION)}),
        step("wait", "Wait for the stock adjustment modal", {"value": 3}),
        step("assertPageContains", "The adjustment modal opened", {"value": "Current Quantity"}),
        step("typeText", f"Enter the {label} adjustment",
             {"value": amount, "element": xpath_el(MATERIAL_URL, '//*[@id="adjustment"]')}),
        step("click", "Open the reason lookup",
             {"element": xpath_el(MATERIAL_URL, '//*[@id="reason"]')}),
        step("wait", "Wait for reason options", {"value": 2}),
        step("click", f'Pick reason "{REASON}"',
             {"element": xpath_el(MATERIAL_URL, option(REASON))}),
        step("click", "Submit the adjustment", {"element": xpath_el(MATERIAL_URL, SUBMIT)}),
        step("wait", "Wait for the adjust mutation", {"value": 5}),
        # close() runs inside the mutation's update() with no optimisticResponse, so the
        # modal closing is server-confirmed proof (trap 6), not a UI-state guess.
        step("assertPageLacks", f"PROOF: the {label} adjustment was accepted (modal closed)",
             {"value": "Current Quantity"}),
        step("assertPageContains", "Adjustment toast (optional: transient)",
             {"value": "Storeroom item quantity adjusted"}, optional=True),
    ]


write(test(
    "MOB.860_MaterialLookup_Cycle_Count",
    "`MOB.860` Cycle count: adjust the fixture item's quantity and put it back.\n"
    "- **SELF-RESTORING BY ARITHMETIC**: `+1` then `-1` returns the item to its starting\n"
    "  quantity, so stock does not drift. Do not change this to only add.\n"
    f"- Fixture `{ITEM}` in `{STOREROOM}`, reason `{REASON}`.\n"
    "- The modal closing is genuine proof: `close()` sits inside the mutation's `update()`\n"
    "  with no optimisticResponse, so it only fires on a confirmed server response. The\n"
    "  toast is transient and therefore optional.\n"
    "- This is the checklist's **Cycle count** item. `Material issue`/`Material return` are\n"
    "  NOT on this screen — they are work-order charges, covered by MOB.370.",
    [
        go(MATERIAL_URL, "material lookup"),
        step("wait", "Wait for the page to mount", {"value": 6}),
    ] + pick_storeroom() + [
        step("click", "Focus the material search",
             {"element": xpath_el(MATERIAL_URL, SEARCH)}),
        step("typeText", f"Search for {ITEM_SEARCH}",
             {"value": ITEM_SEARCH, "element": xpath_el(MATERIAL_URL, SEARCH)}),
        step("wait", "Wait for the search debounce", {"value": 4}),
        step("assertPageContains", f"The fixture item is listed", {"value": ITEM}),
    ] + adjust("1", "+1") + adjust("-1", "-1 (restore)"),
    TAGS + ["CRUD"],
))

# ---------------------------------------------------------------- suite
login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]
# Keep COMPLETE - a child missing from this list is silently dropped on the next DD_FORCE
# rebuild, and the suite then passes with the test absent (trap 12).
# MOB.855 (sort) and MOB.865 (item modal) are read-only and run AFTER the two mutating tests, so
# a failure in either cannot abort the +1/-1 pair or the stocking leg mid-way. Both put the
# screen back as found (default sort restored; modal closed).
CHILDREN = ["MOB.850_MaterialLookup_Read", "MOB.860_MaterialLookup_Cycle_Count",
            "MOB.870_MaterialLookup_Stocking", "MOB.855_MaterialLookup_Column_Sort",
            "MOB.865_MaterialLookup_Item_Attachments"]

write(test(
    "MOB.998_MaterialLookup_Suite",
    "Material Lookup — storeroom, search and cycle count.\n"
    "- MOB.860 mutates stock but is **self-restoring**: +1 then -1 nets to zero.\n"
    "- Transfers and Reorder notifications are NOT in the app; see the checklist.\n"
    "- subtestPublicId values stay PENDING-WIRE-UP until the children exist on Datadog;\n"
    "  run wire_suite.py after pushing them.",
    login_steps + [step("playSubTest", c,
                        {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1})
                   for c in CHILDREN],
    ["Mobile", "env:dev", "Material Lookup", "suite"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))

print("wrote MOB.850 (read), MOB.860 (cycle count), MOB.998 (suite)")
