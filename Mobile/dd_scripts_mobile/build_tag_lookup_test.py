"""Build MOB.750 - Asset Lookup's `Tag Lookup` menu (checklist 🟢 #16).

WHAT IT IS
  `AssetLookup/TagLookup/index.tsx` renders a `Tag Lookup` button whose Mantine `Menu` offers
  two ways to read an asset tag:

      Scan Barcode   `launchScanner()` -> `callNative({ type: 'LAUNCH_CAMERA' })`, always
      Alphanumeric   native shell -> `getNativePhotos('TAKE_PHOTO')`
                     browser      -> `useFileDialog({ capture: 'environment',
                                                      accept: 'image/*', multiple: false })`
                     and `closeMenuOnClick={false}`, so the menu stays open

⭐ THE BROWSER BRANCH OF `Alphanumeric` IS PROVABLE WITHOUT A FILE CHOOSER
  `useFileDialog.open()` (`@mantine/hooks use-file-dialog.mjs`) rebuilds its hidden
  `<input type=file>` from the options and calls `.click()` on it. The test swaps
  `HTMLInputElement.prototype.click` for a recorder that captures file inputs and swallows the
  click - MOB.358's stub-and-restore discipline, applied to one method - then clicks
  `Alphanumeric` for real. The recorder must see exactly ONE file dialog requested, asking for
  the REAR CAMERA (`capture=environment`), images only, one file; and the menu must still be
  open. Nothing is uploaded, and nothing reaches `/api/upload/ai` (an AI call per upload).

🟡 `Scan Barcode` HAS NO BROWSER BRANCH (bugs §37)
  It calls `callNative` unconditionally; outside the shell that posts to an absent
  `window.ReactNativeWebView?` and returns a promise nothing will ever settle (the §34
  mechanism). The menu closes and nothing else happens. An OPTIONAL sentinel records that, so a
  fix (a toast, a hidden item, a web scanner) turns it red without failing the test.

READ-ONLY. Restores the prototype `always`, and asserts it was restored.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

LOOKUP_URL = BASE + "/asset-lookup"
PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]'
TAG_BTN = '//button[normalize-space(.)="Tag Lookup"]'
ITEMS = ["Scan Barcode", "Alphanumeric"]


def item(label):
    return f'//*[@role="menuitem"][normalize-space(.)="{label}"]'


MENU_JS = ("const menu = document.querySelector('[role=\"menu\"]');\n"
           "const items = menu ? [...menu.querySelectorAll('[role=\"menuitem\"]')]\n"
           "  .map(i => (i.textContent || '').trim()) : [];\n")

steps = [
    go(LOOKUP_URL, "asset lookup"),
    step("wait", "Let the page render", {"value": 3}),
    step("assertElementContent", 'Test the "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup", "element": xpath_el(LOOKUP_URL, PAGE_TITLE)},
         timeout=30),
    step("assertElementPresent", "The `Tag Lookup` button renders",
         {"element": xpath_el(LOOKUP_URL, TAG_BTN)}, timeout=30),
    jsassert("PRECONDITION: this is a browser, not the native shell — `Alphanumeric` takes its "
             "file-dialog branch",
             "return !window.ReactNativeWebView;", timeout=30),

    # ---- the recorder ----------------------------------------------------------------------
    # `click` is inherited from HTMLElement.prototype, so assigning it on HTMLInputElement's
    # prototype creates a SHADOWING own property - and the restore must delete that property,
    # not reassign the original. Globals go through `window.` so the bench runs this verbatim.
    jsassert("STUB: record file-input clicks instead of opening a file chooser",
             "const proto = window.HTMLInputElement.prototype;\n"
             "if (!proto.click.__dd) {\n"
             "  window.__ddHadOwnClick = Object.prototype.hasOwnProperty.call(proto, 'click');\n"
             "  window.__ddOrigClick = proto.click;\n"
             "  window.__ddFileClicks = [];\n"
             "  const rec = function () {\n"
             "    if (this.type === 'file') {\n"
             "      window.__ddFileClicks.push({ capture: this.capture || this.getAttribute('capture'),\n"
             "        accept: this.accept, multiple: this.multiple,\n"
             "        attached: window.document.body.contains(this) });\n"
             "      return;\n"
             "    }\n"
             "    return window.__ddOrigClick.call(this);\n"
             "  };\n"
             "  rec.__dd = true;\n"
             "  proto.click = rec;\n"
             "}\n"
             "return proto.click.__dd === true\n"
             "  && Array.isArray(window.__ddFileClicks) && window.__ddFileClicks.length === 0;",
             timeout=30),

    # ---- the menu --------------------------------------------------------------------------
    step("click", "Open the `Tag Lookup` menu", {"element": xpath_el(LOOKUP_URL, TAG_BTN)},
         timeout=30),
    step("wait", "Let the menu open", {"value": 1}),
    jsassert("⭐ MENU: exactly `Scan Barcode` then `Alphanumeric`",
             MENU_JS + f"return JSON.stringify(items) === {json.dumps(json.dumps(ITEMS, separators=(',', ':')))};",
             timeout=30),
    step("click", "Click `Alphanumeric`", {"element": xpath_el(LOOKUP_URL, item("Alphanumeric"))},
         timeout=30),
    step("wait", "Let the click handler run", {"value": 1}),
    # SPLIT, and `soft`: each claim is its own step and a red one does not stop the others, so a
    # failure names its cause. The first run of this test failed ONE combined assertion with the
    # menu visibly open - the cause was `capture`: useFileDialog sets it as a PROPERTY
    # (`input.capture = ...`), which Chrome need not reflect to an attribute, and the recorder
    # read the attribute. It reads the property now.
    jsassert("⭐ ALPHANUMERIC (browser): exactly ONE file dialog was requested",
             "const c = window.__ddFileClicks || [];\n"
             "return c.length === 1 && c[0].attached === true;", soft=True, timeout=30),
    jsassert("⭐ …asking for the REAR camera (`capture=environment`)",
             "const c = window.__ddFileClicks || [];\n"
             "return c.length === 1 && c[0].capture === 'environment';", soft=True, timeout=30),
    jsassert("…for images only, one file",
             "const c = window.__ddFileClicks || [];\n"
             "return c.length === 1 && c[0].accept === 'image/*' && c[0].multiple === false;",
             soft=True, timeout=30),
    jsassert("…and the menu STAYED OPEN (`closeMenuOnClick={false}`)",
             MENU_JS + "return items.includes('Alphanumeric');", soft=True, timeout=30),
    step("pressKey", "Close the menu", {"value": "Escape"}),
    step("wait", "Let the menu close", {"value": 1}),
    jsassert("The menu closed", "return !document.querySelector('[role=\"menu\"]');", timeout=30),

    # ---- Scan Barcode: record the dead end (optional) --------------------------------------
    step("click", "Reopen the `Tag Lookup` menu", {"element": xpath_el(LOOKUP_URL, TAG_BTN)},
         optional=True, timeout=30),
    step("wait", "Let the menu open", {"value": 1}, optional=True),
    step("click", "Click `Scan Barcode`", {"element": xpath_el(LOOKUP_URL, item("Scan Barcode"))},
         optional=True, timeout=30),
    step("wait", "Give it time to show anything at all", {"value": 3}, optional=True),
    jsassert("SENTINEL (bugs §37): `Scan Barcode` in a browser does NOTHING — the menu closed, "
             "no dialog, no toast, no file dialog, still on Asset Lookup. Red here means it "
             "was fixed: rewrite this step",
             "const dialog = document.querySelector('[role=\"dialog\"]');\n"
             "const toast = document.querySelector('.Toastify__toast');\n"
             "return !document.querySelector('[role=\"menu\"]') && !dialog && !toast\n"
             "  && window.location.pathname.endsWith('/asset-lookup')\n"
             "  && (window.__ddFileClicks || []).length === 1;",
             optional=True, timeout=30),

    # ---- restore ---------------------------------------------------------------------------
    jsassert("RESTORE: put `HTMLInputElement.prototype.click` back",
             "const proto = window.HTMLInputElement.prototype;\n"
             "if (proto.click.__dd) {\n"
             "  if (window.__ddHadOwnClick) proto.click = window.__ddOrigClick;\n"
             "  else delete proto.click;\n"
             "}\n"
             "return true;", always=True, timeout=30),
    jsassert("RESTORED: inputs click with the ORIGINAL `click` again — no recorder left for a "
             "later child",
             "const proto = window.HTMLInputElement.prototype;\n"
             "const ok = !proto.click.__dd\n"
             "  && (window.__ddOrigClick ? proto.click === window.__ddOrigClick : true);\n"
             "delete window.__ddOrigClick; delete window.__ddFileClicks; delete window.__ddHadOwnClick;\n"
             "return ok;",
             always=True, timeout=30),
]

write(test(
    "MOB.750_AssetLookup_Tag_Lookup_Menu",
    "`MOB.750` **Asset Lookup's `Tag Lookup` menu** — checklist 🟢 #16.\n"
    "- The menu offers exactly `Scan Barcode` then `Alphanumeric`.\n"
    "- ⭐ **`Alphanumeric`'s browser branch, proved without a file chooser**: the test swaps\n"
    "  `HTMLInputElement.prototype.click` for a recorder, clicks the item for real, and requires\n"
    "  exactly one file dialog asking for the rear camera (`capture=environment`), images only,\n"
    "  one file — with the menu still open (`closeMenuOnClick={false}`). Nothing is uploaded, so\n"
    "  nothing reaches `/api/upload/ai`.\n"
    "- 🟡 **`Scan Barcode` has no browser branch** (bugs §37): it calls `callNative`\n"
    "  unconditionally and nothing happens. An OPTIONAL sentinel records that.\n"
    "- The prototype is restored `always`, and the restore is asserted.",
    steps,
    ["Mobile", "env:dev", "Asset Lookup", "read-only"],
))
print("wrote MOB.750 (Tag Lookup menu)")
