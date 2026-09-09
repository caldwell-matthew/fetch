"""Build MOB.865_MaterialLookup_Item_Attachments - the storeroom item modal's `Photos` / `Docs`
tabs and the row avatar image modal (checklist 🟢 #9).

WHAT SHIPPED WITHOUT A TEST
  `StockAdjustments.tsx` grew two segments beyond the ones `MOB.860`/`870` use:
      '1' Quantity Adjustment   '2' Stock Item   '3' Photos   '4' Docs
  `Photos` renders `PhotoAttachments` (modelType `MaterialItem` - its FIRST use on this model) and
  `Docs` renders `FileAttachments`; the attachment query (`MOBILE_MATERIAL_ITEM_ATTACHMENTS`) is
  `skip`ped until one of those two segments is selected. And `MaterialLookup/index.tsx` gives a
  row with an avatar an image button (`aria-label="View <name> image"`) that opens the SAME modal
  in its `image` view. None of that had a test.

⭐ PHOTOS vs DOCS IS A BICONDITIONAL - `MOB.741`'s shape, third parent type
  `Attachments.tsx` mounts the carousel only when `onPhotosAdded` is passed (`PhotoAttachments`)
  and the file table only when `onFilesAdded` is (`FileAttachments`). So the Photos segment must
  offer `Add Photo` (`asset.update`) and NO `Add File`, and the Docs segment must offer `Add File`
  (`asset.create`) and NO `Add Photo` and NO carousel. Both read within the modal, opposite
  verdicts. 🛑 Neither button is clicked: `FileAttachments.addFiles` has NO image filter, so an
  upload here lands for real.

  Whether the fixture item HAS photos is reported (📊, optional) rather than asserted - asserting
  rows would make this a fixture test, and an empty carousel is not an empty state (`PhotoCarousel`
  renders nothing at zero photos).

THE SEGMENT SET IS PINNED, BY VALUE
  Exactly `['1','2','3','4']` read from the radio inputs (Mantine `SegmentedControl` - structure
  verified on the bench for `MOB.351`), and the four labels in order. Fails on any add, remove,
  rename or reorder. Segments are switched by clicking the radio INPUT by value, never by label
  text (bugs §22).

THE AVATAR MODAL IS AN EXCLUSIVE-OR
  The image button exists only when `materialItemId.avatar.imageUrl` is set. So EITHER the
  fixture row has no image button (a plain `Avatar` placeholder), OR clicking it opens the modal
  with `img.file-image`. Neither, or both, is a fail. The branch taken is recorded so the report
  says which - both branches are legitimate for this fixture.

⚠️ ONE MODAL, TWO VIEWS. `image` and `adjust` are the same `<Modal>` with a `view` flag, so the
  avatar view is closed (Escape -> `onClose` -> `setModal(null)`) before the adjust view is
  opened through the row's action icon - the locator `MOB.860` already proved.

READ-ONLY. Nothing here submits, uploads or adjusts. The modal is closed on the way out with
`alwaysExecute` so `MOB.998`'s later children start from a clean list.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

MATERIAL_URL = BASE + "/material-lookup"
STOREROOM = "Central Storeroom"
ITEM = "000-000-000 Adamantium"
ITEM_SEARCH = "Adamantium"
BRANCH_KEY = "__dd865_avatar"
SEGMENTS = [("1", "Quantity Adjustment"), ("2", "Stock Item"), ("3", "Photos"), ("4", "Docs")]

PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]'
SEARCH = '//input[@placeholder="Search for material items by name"]'
STOREROOM_SELECT = '//*[@id="storeroomLocationId"]'
ROW = f'//tr[contains(normalize-space(.), "{ITEM}")]'
# The row's action icon - `MOB.860`'s locator (canonical FontAwesome name, trap 14).
ROW_ACTION = (ROW + '//button[.//*[@data-icon="arrow-up-right-from-square"'
              ' or contains(concat(" ", normalize-space(@class), " "),'
              ' " fa-arrow-up-right-from-square ")]]')
MODAL_CLOSE = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
               '//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]')


def option(text):
    return f'//*[@role="option"][contains(normalize-space(.), "{text}")]'


MODAL_JS = ("const m = document.querySelector('.mantine-Modal-content');\n"
            "if (!m) return false;\n")
ROW_JS = ("const row = [...document.querySelectorAll('tr')]\n"
          f"  .find(r => (r.textContent || '').includes('{ITEM}'));\n"
          "if (!row) return false;\n")
BUTTONS = "const t = [...m.querySelectorAll('button')].map(b => (b.textContent || '').trim());\n"
CAROUSEL = "[class*=\"mantine-Carousel\"]"


def switch_segment(value, label):
    return [
        jsassert(f'Switch to the "{label}" segment by VALUE ({value}) — never by text (§22)',
                 MODAL_JS +
                 "const root = m.querySelector('[class*=\"mantine-SegmentedControl-root\"]');\n"
                 "if (!root) return false;\n"
                 f"const el = root.querySelector('input[type=\"radio\"][value=\"{value}\"]');\n"
                 "if (!el) return false;\n"
                 "el.click();\n"
                 "return true;", timeout=30),
        step("wait", f"Let the {label} panel mount (its attachment query fires now)", {"value": 4}),
        jsassert(f'The "{label}" segment is the CHECKED one',
                 MODAL_JS +
                 "const root = m.querySelector('[class*=\"mantine-SegmentedControl-root\"]');\n"
                 "if (!root) return false;\n"
                 "const on = root.querySelector('input[type=\"radio\"]:checked');\n"
                 f"return !!on && on.value === '{value}';", timeout=30),
    ]


steps = [
    go(MATERIAL_URL, "material lookup"),
    step("wait", "Wait for the page to mount", {"value": 6}),
    step("assertElementContent", 'Test the "Material Lookup" page rendered',
         {"check": "contains", "value": "Material Lookup",
          "element": xpath_el(MATERIAL_URL, PAGE_TITLE)}, timeout=30),
    step("click", "Open the storeroom dropdown",
         {"element": xpath_el(MATERIAL_URL, STOREROOM_SELECT)}, timeout=30),
    step("wait", "Wait for storeroom options", {"value": 2}),
    step("click", f"Pick {STOREROOM}",
         {"element": xpath_el(MATERIAL_URL, option(STOREROOM))}, timeout=30),
    step("wait", "Wait for the material list to load", {"value": 8}),
    step("click", "Focus the material search", {"element": xpath_el(MATERIAL_URL, SEARCH)},
         timeout=30),
    step("typeText", f"Search for {ITEM_SEARCH}",
         {"value": ITEM_SEARCH, "element": xpath_el(MATERIAL_URL, SEARCH)}),
    step("wait", "Wait for the search debounce", {"value": 4}),
    step("assertElementPresent", f'FIXTURE GUARD: "{ITEM}" is listed',
         {"element": xpath_el(MATERIAL_URL, ROW)}, timeout=30, soft=True),

    # ---- the row avatar image modal: exclusive-or -------------------------------------------
    jsassert("AVATAR: click the row's image button IF it exists, and record which branch this is",
             ROW_JS +
             "const b = [...row.querySelectorAll('button')]\n"
             "  .find(x => /^View .+ image$/.test(x.getAttribute('aria-label') || ''));\n"
             f"sessionStorage.setItem('{BRANCH_KEY}', b ? 'button' : 'none');\n"
             "if (b) b.click();\n"
             "return true;", timeout=30),
    step("wait", "Let the image modal open, if there was a button", {"value": 2}),
    jsassert("⭐ AVATAR: EXACTLY ONE of — no image button on the row, or an open modal showing "
             "`img.file-image`",
             f"const branch = sessionStorage.getItem('{BRANCH_KEY}');\n"
             "const m = document.querySelector('.mantine-Modal-content');\n"
             "const img = m ? m.querySelector('img.file-image') : null;\n"
             "const opened = !!m && !!img;\n"
             "if (branch === 'none') return !opened;\n"
             "if (branch === 'button') return opened;\n"
             "return false;", timeout=30),
    step("pressKey", "Close the image modal (a no-op when it never opened)", {"value": "Escape"},
         always=True),
    step("wait", "Let it close", {"value": 2}, always=True),
    jsassert("No modal is open before the adjust view is opened",
             "return !document.querySelector('.mantine-Modal-content');", always=True, timeout=30),

    # ---- the adjust modal: segment set, then Photos / Docs -----------------------------------
    step("click", f"Open the item modal for {ITEM} (the row's action icon)",
         {"element": xpath_el(MATERIAL_URL, ROW_ACTION)}, timeout=30),
    step("wait", "Wait for the item modal", {"value": 3}),
    step("assertPageContains", "The modal opened on the Quantity Adjustment view",
         {"value": "Current Quantity"}, timeout=30),
    jsassert("⭐ SEGMENTS: exactly " + " · ".join(l for _, l in SEGMENTS) +
             " — values 1..4, in order",
             MODAL_JS +
             "const root = m.querySelector('[class*=\"mantine-SegmentedControl-root\"]');\n"
             "if (!root) return false;\n"
             "const vals = [...root.querySelectorAll('input[type=\"radio\"]')].map(i => i.value);\n"
             "const labels = [...root.querySelectorAll('label')].map(l => (l.textContent || '').trim());\n"
             f"const wantV = {[v for v, _ in SEGMENTS]!r};\n"
             f"const wantL = {[l for _, l in SEGMENTS]!r};\n"
             "return JSON.stringify(vals) === JSON.stringify(wantV)\n"
             "    && JSON.stringify(labels) === JSON.stringify(wantL);", timeout=30),
]

steps += switch_segment("3", "Photos")
steps += [
    jsassert("⭐ PHOTOS: `Add Photo` is offered and `Add File` is NOT",
             MODAL_JS + BUTTONS + "return t.includes('Add Photo') && !t.includes('Add File');",
             timeout=30),
    jsassert("📊 REPORT: does the fixture item have photos? (a carousel is present) — informational",
             MODAL_JS + f"return !!m.querySelector('{CAROUSEL}');", optional=True, timeout=10),
]
steps += switch_segment("4", "Docs")
steps += [
    jsassert("⭐ DOCS: `Add File` is offered, `Add Photo` is NOT, and there is NO carousel — "
             "the biconditional closes",
             MODAL_JS + BUTTONS +
             f"return t.includes('Add File') && !t.includes('Add Photo') && !m.querySelector('{CAROUSEL}');",
             timeout=30),
    jsassert("📊 REPORT: does the fixture item have documents? (a file table is present) — informational",
             MODAL_JS + "return !!m.querySelector('table');", optional=True, timeout=10),

    # ---- leave it as found ----------------------------------------------------------------
    jsassert(f"CLEANUP: remove this test's scratch key `{BRANCH_KEY}`",
             f"sessionStorage.removeItem('{BRANCH_KEY}');\n"
             f"return !sessionStorage.getItem('{BRANCH_KEY}');", always=True, timeout=30),
    step("click", "Close the item modal with its own X",
         {"element": xpath_el(MATERIAL_URL, MODAL_CLOSE)}, always=True, timeout=30),
    step("wait", "Let the modal close", {"value": 2}, always=True),
    jsassert("RESTORED: no modal is left open for the next subtest",
             "return !document.querySelector('.mantine-Modal-content');", always=True, timeout=30),
]

write(test(
    "MOB.865_MaterialLookup_Item_Attachments",
    "`MOB.865` **The storeroom item modal's `Photos` / `Docs` segments, and the row avatar image "
    "modal.**\n"
    "- READ-ONLY. Nothing is uploaded, adjusted or submitted; the modal is closed on the way out.\n"
    "- ⭐ **The segment set is pinned by VALUE**: `Quantity Adjustment` · `Stock Item` · `Photos` ·\n"
    "  `Docs` (`1`..`4`), switched by clicking the radio input, never by label text (§22).\n"
    "- ⭐ **Photos vs Docs is a biconditional** (`MOB.741`'s shape on a third parent type,\n"
    "  `MaterialItem`): `Add Photo` and no `Add File`, then `Add File`, no `Add Photo`, no carousel.\n"
    "  🛑 Neither button is clicked — `FileAttachments` has no image filter, so an upload lands.\n"
    "- Whether the fixture item has photos/documents is 📊 reported, not asserted.\n"
    "- ⭐ **The avatar modal is an exclusive-or**: either the row has no image button, or clicking\n"
    "  it opens the (same) modal showing `img.file-image`. The branch taken is recorded.\n"
    f"- Fixture: `{ITEM}` in `{STOREROOM}`.",
    steps,
    tags=["Mobile", "env:dev", "Material Lookup", "Photos", "read-only"],
))
print("wrote MOB.865 (material item Photos/Docs segments + avatar modal)")
