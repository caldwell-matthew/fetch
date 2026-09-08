"""Build MOB.620_Collector_Photo_Picker - the PhotoCarousel's add-photo picker.

WHY THIS EXISTS
  `PhotoCarousel` had ZERO coverage. The only trace of it anywhere in the suite was `MOB.520`
  asserting that a tab NAMED "Photos" exists — nothing had ever opened the component.

  ⚠️ AND THE REASON IT HAD NONE WAS A MISCLASSIFICATION. A label sweep filed the whole component
  under "attachment-gated -> HARNESS". That is too coarse: the harness blocker (trap 12's
  ungeneratable `uploadFiles`, and the server rollback in bugs_found 14) only bites when a file
  is ACTUALLY ATTACHED. Opening the picker and reading it is an ordinary read-only test. The
  component actually splits three ways:

      reachable read-only   the Add-Photo button, the "Select Photo Source" modal, its three
                            capture options, the tag selector      <- THIS TEST
      fixture-blocked       the carousel, PhotoMenu, fullscreen, tags on a photo
                            (needs an asset that HAS photos - see below)
      harness-blocked       actually attaching a photo or video

🛑 NEVER CLICK THE THREE CAPTURE BUTTONS. In a browser (`!window.ReactNativeWebView`, which is
  always true here) each one opens a NATIVE FILE DIALOG via `useFileDialog`:
      Take Photo    -> cameraDialog.open()
      Take Video    -> cameraDialog.open()
      Photo Gallery -> galleryDialog.open()
  A native picker is outside the page; Datadog cannot dismiss one, so a click risks hanging the
  run. Same standing rule as `Mark as ...` in MOB.347 and `Delete Item` in MOB.397: prove the
  control renders, never actuate it.

⭐ IT ALSO PINS TWO BRANCHES NOTHING ELSE ASSERTS

  1. **The button's label is derived**: `buttonText={attachments.length ? 'Add More Photos'
     : 'Add Asset Photo'}` (`AssetCollector/Form/index.tsx:168`). A fresh form has no
     attachments, so it must read **`Add Asset Photo`** - not the component default `Add Photo`,
     which is what a label sweep of the shared component reports. Asserting the derived label
     proves the call site's branch, not just that some button exists.

  2. **THE CAROUSEL HAS NO EMPTY STATE**: `{photos.length > 0 && <Carousel>}`
     (`PhotoCarousel/index.tsx:118`). With zero photos it renders NOTHING - not a placeholder.
     That is worth an explicit assertion, because "no carousel" is otherwise indistinguishable
     from "the component failed to mount", and a future empty state would silently change it.

WHY THE COLLECTOR FORM AND NOT THE WORK INSERT FORM
  Both render the picker (`AssetCollector/Form:159`, `InsertForm:180`). The collector's
  new-asset form is reached by `MOB.600`'s proven affixed-`+` path and cancels cleanly, and
  `canAddPhotos={assetPerms}` is on for the Admin role.

🛑 STRICTLY READ-ONLY. The form is opened and escaped; nothing is typed and nothing is
  submitted, so unlike `MOB.600` this leaves no asset behind. It is wired into `MOB.994` before
  `MOB.600` so it runs against a genuinely empty form (attachments.length === 0), which is what
  the `Add Asset Photo` branch depends on.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

COLLECTOR_URL = BASE + "/asset-collector"

AFFIX_PLUS = ('//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]'
              '//button')
FORM_SUBMIT = '//button[@form="asset-collector"]'
ADD_PHOTO = '//button[normalize-space(.)="Add Asset Photo"]'
# ⚠️ THERE ARE TWO MODALS ON THIS SCREEN — measured, and the first run failed on it.
# The new-asset FORM is itself a Mantine `Modal` (title "Get New Asset",
# `AssetCollector/index.tsx:253`), so when the picker opens there are two
# `.mantine-Modal-content` nodes and `querySelector` returns the FORM, which has no capture
# buttons. Every locator below selects the modal BY ITS TITLE TEXT (trap 3).
def modal_containing(text):
    return ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
            f'[contains(., "{text}")]')

PICKER = modal_containing("Select Photo Source")
FORM_MODAL = modal_containing("Get New Asset")
# 🛑 ESCAPE DOES NOT CLOSE THE PICKER — recorded in dd_reference/MOB.600_with_upload_steps.json
# as "its own X, NOT Escape". Both modals are dismissed with their own close button.
CLOSE_X = '//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]'
# Pick the right modal in JS the same way the XPaths do.
PICK_MODAL_JS = ("const m = [...document.querySelectorAll('.mantine-Modal-content')]\n"
                 "  .find(x => (x.textContent || '').includes('Select Photo Source'));\n"
                 "if (!m) return false;\n")

steps = [
    go(COLLECTOR_URL, "the asset collector"),
    step("wait", "Wait for the collector to load its lookup cache", {"value": 15}),
    step("assertElementPresent", "The collector page rendered",
         {"element": xpath_el(COLLECTOR_URL, '//*[@id="page-title"]//h4')}, timeout=30),

    step("click", "Open the new-asset form (affixed + button)",
         {"element": xpath_el(COLLECTOR_URL, AFFIX_PLUS)}, timeout=30),
    step("assertElementPresent", "The new-asset form opened",
         {"element": xpath_el(COLLECTOR_URL, FORM_SUBMIT)}, timeout=30),

    # ---- the two derived branches --------------------------------------------------------------
    # A fresh form has no attachments, so the DERIVED label must be `Add Asset Photo`. Asserting
    # the component's default (`Add Photo`) would pass on a call site that had stopped deriving.
    step("assertElementPresent",
         'The add-photo button reads "Add Asset Photo" — the no-attachments branch',
         {"element": xpath_el(COLLECTOR_URL, ADD_PHOTO)}, timeout=30),
    # ⭐ `{photos.length > 0 && <Carousel>}` — there is NO empty state. Asserting the absence
    # explicitly is what separates "correctly showing nothing" from "failed to mount", and it
    # pins the behaviour so a future empty state cannot slip in unnoticed.
    jsassert("⭐ NO EMPTY STATE: with zero photos the carousel renders nothing at all",
             "const form = document.getElementById('asset-collector');\n"
             "if (!form) return false;\n"
             "// the form itself IS present — so 'no carousel' is a real branch, not a\n"
             "// component that failed to render (trap 5)\n"
             "return form.querySelectorAll("
             "'.mantine-Carousel-root, [class*=\"mantine-Carousel\"]').length === 0;",
             timeout=30),

    # ---- the picker -----------------------------------------------------------------------------
    step("click", 'Open the picker ("Add Asset Photo")',
         {"element": xpath_el(COLLECTOR_URL, ADD_PHOTO)}, timeout=30),
    step("assertPageContains", 'The picker opened — "Select Photo Source"',
         {"value": "Select Photo Source"}, timeout=30),

    # 🛑 ASSERTED, NEVER CLICKED — each opens a native file dialog Datadog cannot dismiss.
    jsassert("🛑 All THREE capture options render (asserted, never clicked)",
             PICK_MODAL_JS +
             "const t = [...m.querySelectorAll('button')]"
             ".map(b => (b.textContent || '').trim());\n"
             "return t.includes('Take Photo')\n"
             "  && t.includes('Take Video')\n"
             "  && t.includes('Photo Gallery');", timeout=30),
    # `MiniTagSelector` runs its own GET_TAGS_TABLE query, so this control appearing also proves
    # that query resolved rather than erroring silently.
    # ⚠️ ITS PLACEHOLDER IS `Auto-apply tags?` (`Tags/index.tsx:244`), NOT `Search tags...`.
    # The first version used the latter, which belongs to the FULL `TagSelector` (`:136`) — a
    # different component. Because the step was `optional` it went amber rather than red, so a
    # locator naming the wrong component looked like a pass. It is CRITICAL now: this control is
    # always present when the picker is open, so an amber here would hide a real regression.
    step("assertElementPresent", "The auto-tag selector rendered (its own tags query resolved)",
         {"element": xpath_el(COLLECTOR_URL,
                              f'{PICKER}//input[@placeholder="Auto-apply tags?"]')},
         timeout=30),

    # ---- dismiss, submit nothing ----------------------------------------------------------------
    step("click", "Close the picker with its own X (Escape does NOT close it)",
         {"element": xpath_el(COLLECTOR_URL, f'{PICKER}{CLOSE_X}')}, always=True, timeout=30),
    step("wait", "Let the picker close", {"value": 2}, always=True),
    step("assertPageLacks", "The picker is gone",
         {"value": "Select Photo Source"}, always=True, timeout=30),

    # The form modal sets `closeOnClickOutside={false}`, so its X is the only dismissal.
    step("click", "Close the new-asset form with its X — WITHOUT submitting",
         {"element": xpath_el(COLLECTOR_URL, f'{FORM_MODAL}{CLOSE_X}')},
         always=True, timeout=30),
    step("wait", "Let the form close", {"value": 2}, always=True),
    # 🛑 The proof that this test leaves no residue: the form is gone and the affixed + is back,
    # which is the same durable signal MOB.600 uses for the opposite outcome.
    jsassert("RESTORED: the form closed and nothing was collected",
             "return !document.getElementById('asset-collector');",
             always=True, timeout=30),
]

write(test(
    "MOB.620_Collector_Photo_Picker",
    "`MOB.620` **The `PhotoCarousel` add-photo picker** — the first coverage this component has\n"
    "had at all.\n"
    "- ⚠️ **It was previously misfiled as harness-blocked.** The blocker (trap 12 + `bugs_found`\n"
    "  §14) only bites when a file is **actually attached**; opening the picker and reading it is\n"
    "  an ordinary read-only test.\n"
    "- 🛑 **The three capture buttons are asserted and NEVER clicked.** In a browser each opens a\n"
    "  **native file dialog** (`useFileDialog`) that Datadog cannot dismiss, so a click risks\n"
    "  hanging the run — same standing rule as `Mark as ...` (`MOB.347`) and `Delete Item`\n"
    "  (`MOB.397`).\n"
    "- ⭐ **Pins two branches nothing else asserts**: the button's label is *derived*\n"
    "  (`attachments.length ? 'Add More Photos' : 'Add Asset Photo'`), so a fresh form must read\n"
    "  **`Add Asset Photo`** — not the component default a label sweep reports; and the carousel\n"
    "  has **no empty state** (`{photos.length > 0 && …}`), asserted explicitly so \"correctly\n"
    "  showing nothing\" is distinguishable from \"failed to mount\".\n"
    "- 🛑 **READ-ONLY** — the form is escaped, nothing typed, nothing submitted, so unlike\n"
    "  `MOB.600` it leaves no asset. Wired **before** `MOB.600` so it meets an empty form.\n"
    "- **Still uncovered here** (fixture-blocked, not harness-blocked): the carousel itself,\n"
    "  `PhotoMenu`, fullscreen, and photo tags — all need an asset that already HAS photos.",
    steps,
    tags=["Mobile", "env:dev", "Asset Collector", "Photos", "read-only"],
))
print("wrote MOB.620 (collector photo picker)")
