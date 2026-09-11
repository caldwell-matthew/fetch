"""Build MOB.626_Collector_Capture_Options - the tag / description capture menus (checklist 🟢 #28).

WHAT THE SOURCE SAYS (`AssetCollector/Form/CaptureImageOptions.tsx`, origin/development)
  The new-asset form puts a capture icon beside `Tag` (`CaptureTagIcon`, faBarcodeRead) and beside
  `Description` (`CaptureDescriptionIcon`, faMagicWandSparkles). Each opens a Mantine Menu:

      <Menu.Label>Hello, what would you like to do?</Menu.Label>
      isNative ? [menuItems…, Take Photo, Select From Gallery]      // window.ReactNativeWebView
               : Add Asset Photo                                     // the browser branch
      photoList.length > 0 && Use photo selected above

  So in a browser the menu is EXACTLY `Add Asset Photo` until the form holds a photo, then
  `Add Asset Photo` + `Use photo selected above`. The rendered-string sweep found the label and
  `Use photo selected above` in no test.

⚠️ TRAP 14, TWICE OVER: `faMagicWandSparkles` is an ALIAS - it renders `data-icon="wand-magic-sparkles"`.
`faBarcodeRead` renders `barcode-read` (read from node_modules; no alias).

🛑 NOTHING IN THE MENUS IS CLICKED. `Add Asset Photo` opens a native file dialog; `Use photo
selected above` posts the photo to the AI route (`uploadFile` → /api/upload/ai). Each menu is
closed by clicking the form's title - NOT Escape, which discards the whole form (bugs §13). The
one photo is added through the form's own picker (MOB.621's recipe: it lives in the reducer) and
the form is discarded with its X - never submitted.

⚠️ Menu items are read by the EXACT class `.mantine-Menu-item`: `[class*=...]` also matches each
item's `itemLabel` and two `itemSection`s (Mantine 8 `MenuItem.mjs`), so one item counted as three.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert, upload_steps  # noqa: E402

COLLECTOR_URL = BASE + "/asset-collector"
AFFIX_PLUS = ('//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]'
              '//button')
FORM_SUBMIT = '//button[@form="asset-collector"]'
FORM_MODAL = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
              '[contains(., "Get New Asset")]')
CLOSE_X = '//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]'
MODAL_TITLE = '//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-title ")]'
LABEL = "Hello, what would you like to do?"
ICONS = {"tag": "barcode-read", "description": "wand-magic-sparkles"}

# MOB.622's picker for a fresh gallery input (clears stale upload tags first).
PICK_FRESH_GALLERY = (
    "document.querySelectorAll('[data-dd-upload]')\n"
    "  .forEach(n => n.removeAttribute('data-dd-upload'));\n"
    "const inputs = [...document.querySelectorAll('input[type=\"file\"]')];\n"
    "const el = inputs.find(i => !i.capture);\n")

MENU_JS = ("const dd = [...document.querySelectorAll('.mantine-Menu-dropdown')]\n"
           "  .find(d => (d.textContent || '').includes('" + LABEL + "'));\n"
           "const items = dd ? [...dd.querySelectorAll('.mantine-Menu-item')]\n"
           "  .map(i => (i.textContent || '').trim()) : null;\n")


def open_menu(which):
    return [
        jsassert(f"Open the {which} capture menu (its `{ICONS[which]}` icon beside the field)",
                 "const f = document.getElementById('asset-collector');\n"
                 f"const svg = f && f.querySelector('svg[data-icon=\"{ICONS[which]}\"]');\n"
                 "const b = svg && svg.closest('button');\n"
                 "if (!b) return false;\nb.click();\nreturn true;", timeout=30),
        step("wait", "Let the menu open", {"value": 1}),
    ]


def close_menu():
    # 🛑 NOT Escape: the "Get New Asset" modal keeps closeOnEscape, so Escape discards the whole
    # form (bugs §13) — run 1 lost the form this way. A click outside the menu (on the form's own
    # title, inside the modal) closes the uncontrolled Menu and leaves the modal alone.
    return [
        step("click", "Close the menu by clicking the form's title (NOT Escape — bugs §13)",
             {"element": xpath_el(COLLECTOR_URL, f'{FORM_MODAL}{MODAL_TITLE}')}, always=True, timeout=30),
        step("wait", "Let it close", {"value": 1}, always=True),
        jsassert("The capture menu is closed, and the form is still open",
                 MENU_JS + "return !dd && !!document.getElementById('asset-collector');",
                 always=True, timeout=15),
    ]


steps = [
    go(COLLECTOR_URL, "the asset collector"),
    step("wait", "Wait for the collector to load its lookup cache", {"value": 15}),
    step("assertElementPresent", "The collector page rendered",
         {"element": xpath_el(COLLECTOR_URL, '//*[@id="page-title"]//h4')}, timeout=30),
    step("click", "Open the new-asset form (affixed + button)",
         {"element": xpath_el(COLLECTOR_URL, AFFIX_PLUS)}, timeout=30),
    step("assertElementPresent", "The new-asset form opened",
         {"element": xpath_el(COLLECTOR_URL, FORM_SUBMIT)}, timeout=30),
    jsassert("BASELINE: the form holds NO photo yet, and both capture icons are present",
             "const f = document.getElementById('asset-collector');\n"
             "return !!f && f.querySelectorAll('[class*=\"mantine-Carousel-slide\"]').length === 0\n"
             f"  && !!f.querySelector('svg[data-icon=\"{ICONS['tag']}\"]')\n"
             f"  && !!f.querySelector('svg[data-icon=\"{ICONS['description']}\"]');", timeout=30),
] + open_menu("tag") + [
    jsassert(f"⭐ TAG menu, browser branch: `{LABEL}` and EXACTLY `Add Asset Photo` "
             "(no native `Take Photo`/`Select From Gallery`, no `Use photo…` without a photo)",
             MENU_JS + "return !!items && items.length === 1 && items[0] === 'Add Asset Photo';", timeout=20),
] + close_menu() + open_menu("description") + [
    jsassert(f"⭐ DESCRIPTION menu, browser branch: `{LABEL}` and EXACTLY `Add Asset Photo`",
             MENU_JS + "return !!items && items.length === 1 && items[0] === 'Add Asset Photo';", timeout=20),
] + close_menu() + [
    # ---- one photo in the reducer, then the menu grows its second item -----------------------
    step("click", 'Open the form\'s photo picker ("Add Asset Photo" button)',
         # MOB.622's proven locator; every capture menu is closed here, so no Menu.Item can match
         {"element": xpath_el(COLLECTOR_URL, '//button[normalize-space(.)="Add Asset Photo"]')},
         timeout=30),
    step("assertPageContains", "The picker opened", {"value": "Select Photo Source"}, timeout=30),
] + upload_steps(COLLECTOR_URL, picker=PICK_FRESH_GALLERY,
                 reveal_name="Reveal the hidden gallery input (clearing any stale tag)",
                 upload_name="Upload one photo (MOB.600's bucketKey, copied — trap 12)") + [
    step("assertPageLacks", "The picker closed itself once the file arrived",
         {"value": "Select Photo Source"}, timeout=30),
    step("wait", "Let the reducer take the photo", {"value": 4}),
    jsassert("The form now holds ONE photo",
             "const f = document.getElementById('asset-collector');\n"
             "return !!f && f.querySelectorAll('[class*=\"mantine-Carousel-slide\"]').length === 1;",
             timeout=30),
] + open_menu("description") + [
    jsassert("⭐ DESCRIPTION menu with a photo: `Add Asset Photo` + `Use photo selected above` "
             "(`photoList.length > 0`)",
             MENU_JS + "return !!items && items.length === 2 && items[0] === 'Add Asset Photo'\n"
             "  && items[1] === 'Use photo selected above';", timeout=20),
    jsassert("…and `Use photo selected above` is ENABLED for the selected photo (soft)",
             "const it = [...document.querySelectorAll('.mantine-Menu-item')]\n"
             "  .find(i => (i.textContent || '').trim() === 'Use photo selected above');\n"
             "return !!it && !it.hasAttribute('data-disabled') && !it.disabled;", soft=True, timeout=15),
] + close_menu() + [
    # ---- discard -----------------------------------------------------------------------------
    step("click", "Close the form with its X — DISCARDING the photo, never submitting",
         {"element": xpath_el(COLLECTOR_URL, f'{FORM_MODAL}{CLOSE_X}')}, always=True, timeout=30),
    step("wait", "Let the form close", {"value": 2}, always=True),
    jsassert("RESTORED: the form is gone, so the photo was discarded unsent",
             "return !document.getElementById('asset-collector');", always=True, timeout=30),
]

write(test(
    "MOB.626_Collector_Capture_Options",
    "`MOB.626` **The tag / description capture menus — the browser branch, exactly.**\n"
    f"- Each opens `{LABEL}` with EXACTLY `Add Asset Photo` (the native `Take Photo` /\n"
    "  `Select From Gallery` are for the Expo shell). With one photo in the form the description\n"
    "  menu adds `Use photo selected above`.\n"
    "- ⚠️ Icons by their RENDERED names: `barcode-read`, `wand-magic-sparkles` (an alias — trap 14).\n"
    "- 🛑 **READ-ONLY**: no menu item is clicked (the file dialog / the AI route); the photo stays in\n"
    "  the reducer and the form is discarded with its X.",
    steps,
    ["Mobile", "env:dev", "Collector", "Photos", "read-only"],
))
print("wrote MOB.626 (capture option menus)")
