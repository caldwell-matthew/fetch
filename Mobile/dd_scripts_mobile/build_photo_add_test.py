"""Build MOB.621_Collector_Photo_Add - a photo really reaches the carousel, WITHOUT submitting.

WHAT THIS SETTLES, AND WHY IT IS WORTH A TEST OF ITS OWN

  1. ⭐ **IS A `bucketKey` PORTABLE BETWEEN TESTS? ✅ ANSWERED: YES — this test measured it.**
     `dd_reference/README.md` used to assert it is not: *"the bucketKey is namespaced to
     MOB.600's public id, so these steps can be put back into THAT test and cannot be copied
     into another."* That was an **inference from the path shape**
     (`browser-upload-file-step/<public_id>/<timestamp>.json`), never a measurement.
     This test reuses MOB.600's key from a DIFFERENT test **and runs green**: Datadog
     **re-namespaces the key to the receiving test on push** (`4ty-vhq-3aa` -> `uv3-88w-i8i`).
     ➡️ That is what turned upload coverage from "a human must author a step per test in the
     Datadog UI" into "generatable for any screen" — see `dd_tools.upload_steps()`, which this
     generator now uses. ⚠️ Trap 12 still applies **per FILE**: no API mints a bucketKey, so a
     new file TYPE still needs one hand-authored step before it can be copied.
     🛑 If this ever fails at the upload step, the old README claim was right after all —
     record that and stop copying keys.

  2. **Two branches that were fixture-blocked until uploads started working.** With zero photos
     `PhotoCarousel` renders NOTHING (`{photos.length > 0 && …}`, no empty state), so neither
     could be reached before:
         the carousel itself appears once a photo exists
         the add button's label flips `Add Asset Photo` -> **`Add More Photos`**
     `MOB.620` proves the zero-photo side of both; this proves the other side. Together they
     pin a real conditional rather than one state of it.

🛑 READ-ONLY, AND THAT IS A MEASURED CLAIM NOT A HOPEFUL ONE.
  `AssetCollector/Form/index.tsx:162-165` dispatches `ADD_PHOTO` to a **local reducer** only;
  the attachment is created server-side by `createAsset` on SUBMIT. So uploading and then
  cancelling writes nothing — no asset, no attachment. This test never submits.
  ⚠️ Contrast `MOB.600`, which DOES submit and therefore leaves a permanent asset **and** a
  permanent attachment every run. Do not "improve" this test by making it submit; that is
  MOB.600's job and its residue is already accounted for.

WHERE THE UPLOAD STEPS COME FROM
  `uploadFiles` cannot be generated (trap 12) — no API mints a `bucketKey`. So this generator
  **reads the two upload steps out of `MOB.600`'s JSON** rather than inventing them, which keeps
  one copy of the only working recipe. If MOB.600 ever loses them the build fails loudly here
  instead of producing a test with a hole in it.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      upload_steps)

COLLECTOR_URL = BASE + "/asset-collector"

AFFIX_PLUS = ('//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]'
              '//button')
FORM_SUBMIT = '//button[@form="asset-collector"]'
ADD_PHOTO = '//button[normalize-space(.)="Add Asset Photo"]'
ADD_MORE = '//button[normalize-space(.)="Add More Photos"]'


def modal_containing(text):
    return ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
            f'[contains(., "{text}")]')


PICKER = modal_containing("Select Photo Source")
FORM_MODAL = modal_containing("Get New Asset")
CLOSE_X = '//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]'

# ---- the ungeneratable upload steps, read out of MOB.600 at build time ------------------------
# `dd_tools.upload_steps` is where that borrowing now lives, so every upload test in the suite
# shares one copy of the recipe instead of each pasting its own.
reveal, upload = upload_steps(
    COLLECTOR_URL,
    reveal_name="Reveal the hidden gallery file input (useFileDialog appends it to <body>)",
    upload_name="⭐ Upload a photo — REUSING MOB.600's bucketKey from a different test")

steps = [
    go(COLLECTOR_URL, "the asset collector"),
    step("wait", "Wait for the collector to load its lookup cache", {"value": 15}),
    step("assertElementPresent", "The collector page rendered",
         {"element": xpath_el(COLLECTOR_URL, '//*[@id="page-title"]//h4')}, timeout=30),

    step("click", "Open the new-asset form (affixed + button)",
         {"element": xpath_el(COLLECTOR_URL, AFFIX_PLUS)}, timeout=30),
    step("assertElementPresent", "The new-asset form opened",
         {"element": xpath_el(COLLECTOR_URL, FORM_SUBMIT)}, timeout=30),

    # ---- baseline: the zero-photo state ---------------------------------------------------------
    step("assertElementPresent", 'BASELINE: the button reads "Add Asset Photo" (no attachments)',
         {"element": xpath_el(COLLECTOR_URL, ADD_PHOTO)}, timeout=30),
    jsassert("BASELINE: no carousel yet — `{photos.length > 0 && …}` has no empty state",
             "const f = document.getElementById('asset-collector');\n"
             "if (!f) return false;\n"
             "return f.querySelectorAll("
             "'.mantine-Carousel-root, [class*=\"mantine-Carousel\"]').length === 0;",
             timeout=30),

    # ---- upload ----------------------------------------------------------------------------------
    step("click", 'Open the photo picker ("Add Asset Photo")',
         {"element": xpath_el(COLLECTOR_URL, ADD_PHOTO)}, timeout=30),
    step("assertPageContains", 'The picker opened — "Select Photo Source"',
         {"value": "Select Photo Source"}, timeout=30),
    reveal,
    upload,
    # ⭐ THE APP CLOSES THIS PICKER ITSELF, and asserting that is stronger than clicking.
    # Until 2026-09 `addFromGallery()` called `close()` the instant it opened the file
    # dialog, so the modal was already gone and these tests clicked an X that happened to
    # still be there in the brief overlap. That was a BUG - the source now says so:
    #   "closing this modal unmounts the component, and useFileDialog's cleanup removes the
    #    <input> it clicked. Close only once files are back, never while the picker is open."
    # `close()` moved into `onDialogChange`, so the picker now closes when the FILES ARRIVE.
    # Clicking the X therefore finds nothing and the step fails - which is what took
    # MOB.994 down. Asserting the disappearance instead proves the fixed behaviour and
    # cannot rot the same way.
    step("assertPageLacks",
         "⭐ THE PICKER CLOSED ITSELF once the file arrived — `onDialogChange` calls `close()`; "
         "nothing clicks an X. Paired with the carousel assertions below, which are the "
         "positive control that the page is alive",
         {"value": "Select Photo Source"}, timeout=30),
    step("wait", "Let the reducer take the photo and the carousel mount", {"value": 4}),

    # ---- ⭐ the two branches MOB.620 cannot reach --------------------------------------------------
    jsassert("⭐ THE CAROUSEL NOW EXISTS — the `photos.length > 0` branch",
             "const f = document.getElementById('asset-collector');\n"
             "if (!f) return false;\n"
             "return f.querySelectorAll("
             "'.mantine-Carousel-root, [class*=\"mantine-Carousel\"]').length >= 1;",
             timeout=30),
    # The label is derived from `attachments.length`, so this is a second, independent read of
    # "the reducer actually took the file" — the carousel could in principle render off
    # something else, but the label cannot.
    step("assertElementPresent",
         '⭐ The button flipped to "Add More Photos" — attachments.length is now non-zero',
         {"element": xpath_el(COLLECTOR_URL, ADD_MORE)}, timeout=30),
    jsassert("…and the old zero-photo label is GONE (a swap, not an addition)",
             "const t = [...document.querySelectorAll('button')]"
             ".map(b => (b.textContent || '').trim());\n"
             "return t.includes('Add More Photos') && !t.includes('Add Asset Photo');",
             timeout=30),

    # ---- discard ---------------------------------------------------------------------------------
    # 🛑 NEVER SUBMIT. The photo lives in the reducer; closing the form discards it and nothing
    # reaches the server. `closeOnClickOutside={false}`, so the X is the only dismissal.
    step("click", "Close the form with its X — DISCARDING the photo, never submitting",
         {"element": xpath_el(COLLECTOR_URL, f'{FORM_MODAL}{CLOSE_X}')},
         always=True, timeout=30),
    step("wait", "Let the form close", {"value": 2}, always=True),
    jsassert("RESTORED: the form is gone, so the photo was discarded unsent",
             "return !document.getElementById('asset-collector');",
             always=True, timeout=30),
]

write(test(
    "MOB.621_Collector_Photo_Add",
    "`MOB.621` **A photo really reaches the carousel — without submitting.**\n"
    "- ⭐ **Settles whether a `bucketKey` is PORTABLE between tests.** `dd_reference/README.md`\n"
    "  says it is not, but that is an inference from the path shape, never measured — and it\n"
    "  decides whether upload coverage can be written for any screen or whether every upload\n"
    "  test needs a hand-authored step (trap 12). This reuses `MOB.600`'s key from a **different\n"
    "  test**. If it fails at the upload step, the README was right.\n"
    "- ⭐ **Covers the two branches `MOB.620` cannot reach**: the carousel only exists once a\n"
    "  photo does (`{photos.length > 0 && …}` — there is no empty state), and the button flips\n"
    "  `Add Asset Photo` → **`Add More Photos`**. `MOB.620` proves the zero side; together they\n"
    "  pin the conditional rather than one state of it.\n"
    "- 🛑 **READ-ONLY, measured not assumed**: `ADD_PHOTO` dispatches to a **local reducer**\n"
    "  (`Form/index.tsx:162-165`); the attachment is created by `createAsset` on **submit**. This\n"
    "  test never submits, so no asset and no attachment are written. **Do not make it submit** —\n"
    "  that is `MOB.600`'s job, and its residue is already accounted for.\n"
    "- The upload steps are **read out of `MOB.600`'s JSON at build time**, so there is one copy\n"
    "  of the only working recipe; if MOB.600 loses them this build fails loudly.",
    steps,
    tags=["Mobile", "env:dev", "Asset Collector", "Photos", "read-only"],
))
print("wrote MOB.621 (photo reaches the carousel; bucketKey portability probe)")
