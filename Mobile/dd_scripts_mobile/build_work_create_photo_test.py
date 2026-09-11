"""Build MOB.301 - a photo reaches the NEW WORK ORDER form's carousel, without submitting
(checklist 🟢 #2).

WHAT SHIPPED WITHOUT A TEST
  `WorkOrders/components/InsertForm/index.tsx:180-225` puts a `PhotoCarousel` at the top of the
  create-work-order form, with the third of its derived labels - `Add Work Order Photo`
  (`MOB.620`/`621` cover the collector's `Add Asset Photo` / `Add More Photos`). `MOB.300`
  creates a work order and never touches it.

🛑 READ-ONLY, MEASURED FROM THE SOURCE
  `addImages` is `setPhotos(prev => [...prev, ...newPhotos])` - component state. The files are
  only sent by `uploadManager.enqueue({ modelType: 'Work', parentId })` AFTER the create
  mutation returns a work id (`:156-161`). This test never submits, so no work order and no
  attachment are written; closing the modal unmounts the form (`NewItemForm.tsx:
  {opened && Form(...)}`) and the photo with it.

⭐ THREE PROOFS
  1. BASELINE: the form has no carousel (`PhotoCarousel` renders nothing at zero photos -
     `{photos.length > 0 && …}`) and offers `Add Work Order Photo`, which only renders when
     `canAddPhotos` - the session role's `work.update` (`:176-181`).
  2. AFTER UPLOAD: exactly ONE slide inside `#workorder-insert-form`, and the button is still
     `Add Work Order Photo` (this call site passes a fixed label - unlike the collector's, it
     does not flip; asserting that stops a future "fix" from copying the collector blindly).
  3. ⭐ THE SLIDE'S IMAGE IS A `blob:` URL - `formatAsAttachment` gives a browser file
     `reportLinkPreview: URL.createObjectURL(file)` (`AssetCollector/Form/utils.ts:36`). A
     `blob:` source is the photo being held locally, on screen; a server URL would mean it had
     been uploaded, which must not happen before submit.

The upload is `dd_tools.upload_steps` - `MOB.600`'s hand-authored bucketKey, copied (trap 12).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      upload_steps)

WORK_URL = BASE + "/work"
PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Work Orders")]'
AFFIX_PLUS = ('//div[contains(concat(" ", normalize-space(@class), " "), " mantine-Affix-root ")]'
              '//button')                                            # = MOB.300
FORM = '//form[@id="workorder-insert-form"]'
ADD_PHOTO = '//button[normalize-space(.)="Add Work Order Photo"]'
FORM_MODAL = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
              '[.//form[@id="workorder-insert-form"]]')
CLOSE_X = '//button[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-close ")]'

FORM_JS = ("const f = document.getElementById('workorder-insert-form');\n"
           "if (!f) return false;\n"
           "const slides = f.querySelectorAll('[class*=\"mantine-Carousel-slide\"]');\n"
           "const carousels = f.querySelectorAll('[class*=\"mantine-Carousel-root\"]');\n"
           "const labels = [...document.querySelectorAll('button')].map(b => (b.textContent || '').trim());\n")

reveal, upload = upload_steps(
    WORK_URL,
    reveal_name="Reveal the hidden gallery file input (useFileDialog appends it to <body>)",
    upload_name="Upload a photo — MOB.600's bucketKey, copied (trap 12)")

steps = [
    go(WORK_URL, "/work"),
    step("wait", "Let the work list and lookups load", {"value": 10}),
    step("assertElementContent", 'Test the "Work Orders" page rendered',
         {"check": "contains", "value": "Work Orders", "element": xpath_el(WORK_URL, PAGE_TITLE)},
         timeout=30),
    step("click", "Open the create-work-order form (affixed + button)",
         {"element": xpath_el(WORK_URL, AFFIX_PLUS)}, timeout=30),
    step("wait", "Let the form mount", {"value": 3}),
    step("assertElementPresent", "The create form rendered", {"element": xpath_el(WORK_URL, FORM)},
         timeout=30),

    # ---- baseline --------------------------------------------------------------------------
    jsassert("BASELINE: no carousel yet, and `Add Work Order Photo` is offered (the role has "
             "`work.update`)",
             FORM_JS + "return carousels.length === 0 && slides.length === 0\n"
             "  && labels.includes('Add Work Order Photo');", timeout=30),

    # ---- upload ----------------------------------------------------------------------------
    step("click", "Open the photo picker (`Add Work Order Photo`)",
         {"element": xpath_el(WORK_URL, ADD_PHOTO)}, timeout=30),
    step("assertPageContains", 'The picker opened — "Select Photo Source"',
         {"value": "Select Photo Source"}, timeout=30),
    reveal,
    upload,
    step("assertPageLacks", "The picker closed itself once the file arrived (`onDialogChange` — "
         "MOB.621)", {"value": "Select Photo Source"}, timeout=30),
    step("wait", "Let the form take the photo and the carousel mount", {"value": 4}),

    # ---- proofs ----------------------------------------------------------------------------
    jsassert("⭐ ONE photo in the form's carousel — `addImages` took it",
             FORM_JS + "return carousels.length >= 1 && slides.length === 1;", timeout=30),
    jsassert("⭐ …held LOCALLY: the slide's image is a `blob:` URL (`URL.createObjectURL`), "
             "not a server link — nothing is uploaded before submit",
             "const f = document.getElementById('workorder-insert-form');\n"
             "if (!f) return false;\n"
             "const imgs = [...f.querySelectorAll('[class*=\"mantine-Carousel-slide\"] img')];\n"
             "return imgs.length >= 1 && imgs.every(i => (i.getAttribute('src') || '').indexOf('blob:') === 0);",
             timeout=30),
    jsassert("…and the button still reads `Add Work Order Photo` — this call site passes a "
             "fixed label; it does not flip like the collector's",
             FORM_JS + "return labels.includes('Add Work Order Photo')\n"
             "  && !labels.includes('Add More Photos');", timeout=30),

    # ---- discard ---------------------------------------------------------------------------
    step("click", "Close the form with its X — DISCARDING the photo, never submitting",
         {"element": xpath_el(WORK_URL, f'{FORM_MODAL}{CLOSE_X}')}, always=True, timeout=30),
    step("wait", "Let the form close", {"value": 2}, always=True),
    jsassert("RESTORED: the form is unmounted, so the photo was discarded unsent",
             "return !document.getElementById('workorder-insert-form');", always=True,
             timeout=30),
]

write(test(
    "MOB.301_Work_Create_Photo",
    "`MOB.301` **A photo reaches the new-work-order form's carousel — without submitting.**\n"
    "- Baseline: no carousel (`PhotoCarousel` has no empty state) and `Add Work Order Photo`\n"
    "  offered (gated on the role's `work.update`).\n"
    "- After an upload (MOB.600's bucketKey, copied): exactly one slide in\n"
    "  `#workorder-insert-form`, its image a **`blob:` URL** — held locally, not uploaded — and\n"
    "  the label unchanged (this call site's label is fixed; the collector's flips).\n"
    "- 🛑 **READ-ONLY**: `addImages` is component state; files are enqueued only after the\n"
    "  create mutation returns a work id. This test never submits and closes the form with its X.",
    steps,
    ["Mobile", "env:dev", "Work Order", "Photos", "read-only"],
))
print("wrote MOB.301 (work-order create form photo)")
