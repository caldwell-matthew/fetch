"""Build MOB.741_Work_Attachments_Docs - the work-stage attachment panel, and the image filter.

WHY THIS EXISTS
  `MOB.740` opens the `Attachments` tab and asserts that the tab is ACTIVE. It never reads what
  is inside it. Behind that tab sits `WorkOrders/components/WorkStageAttachments.tsx` -> a
  Photos/Docs segmented control -> `DetailPage/Attachments.tsx`, and none of it had been read.

  This is T1.2 - work-order attachments - and it was filed under HARNESS. That was wrong twice
  over. `MOB.621` proved a `bucketKey` is portable, so an upload can be generated for any
  screen; and the branch this test aims at never reaches the server at all.

⭐ THE SUBJECT: AN UPLOAD THAT IS SUPPOSED TO BE REJECTED, CLIENT-SIDE.
  `Attachments.tsx:33-43` - the Docs tab's `Add File` button drops image files on the floor and
  says so:

      const nonImageFiles = files.filter(f => !isImageFile(f.type));   // /^image\\/.*/
      addFilesProp(nonImageFiles);                                     // called with []
      if (nonImageFiles.length !== files.length)
          toast.info(`${ignoredFiles} image file(s) were ignored.`);

  and the call site is `addFiles={(files) => { if (files.length > 0) onFilesAdded(files); }}`
  (`:179`), so an empty array **never calls `onFilesAdded`** and therefore never calls
  `uploadFile`. Uploading a PNG here is a **genuine upload of a real file that writes nothing**:
  full coverage of a real branch with zero residue on a shared fixture. That combination is rare
  enough to be worth building the test around.

🛑 THE PHOTOS TAB IS READ-ONLY HERE, AND THE DISTINCTION IS THE WHOLE POINT.
  The other tab's `addImages` goes to `handleUpload` -> `uploadPhoto(..., modelType:
  'WorkStage')` and, when the stage has exactly one asset, `copyPhotoToAsset` as well
  (`WorkStageAttachments.tsx:34-43`). That MUTATES, twice, against a fixture other tests read.
  So: the Photos tab is asserted and **never uploaded to**. Do not "extend" this test by
  uploading there - the file filter is what makes the Docs side safe, and it has no counterpart
  on the Photos side.

HOW THE ASSERTION AVOIDS TRAP 5
  "The file did not appear in the table" is true on a screen where nothing happened at all, so
  on its own it proves nothing. The ⭐ assertion below pairs it with two positive controls read
  off the same DOM node in the same step:
      the input really received exactly one file   -> the upload step actually delivered
      that file's type really matches /^image\\//   -> the filter's precondition really held
  Only then is the absence from the table meaningful. If the fixture file were ever swapped for
  a PDF the middle clause fails loudly, instead of the test passing for the wrong reason.

⚠️ NEVER MATCH A SEGMENTED CONTROL BY ITS VISIBLE TEXT - `bugs_found.md` §22, standing rule.
  `SegmentedControlWithIcons` calls `useMediaQuery` inside a `.map()` callback, and with
  `minWidth={375}` the UNSELECTED option renders as a bare icon with no text below that width.
  The label is therefore nondeterministic by construction. The tab switch here is done in JS
  against the option's `value` (trap 28 - these inputs are visually hidden, so `element.click()`
  is the only way in), with a structural fallback, and what PROVES the switch worked is the
  assertion after it, not the click.

⚠️ THE ROUTE IS `MOB.740`'S, DUPLICATED ON PURPOSE.
  `WorkLookupDetails` is the only place an `Attachments` tab renders on a read path, and its
  four sections are **hardcoded in the component** (`:22-29`), not driven by template data - so
  unlike `WorkDetails`, the tab is guaranteed to exist for any work order. The prefix below is
  MOB.740's, copied rather than shared: factoring it into `dd_tools` would rewrite MOB.740's
  JSON and force a re-verify of a green, wired test for no behavioural gain.
  **If the route breaks, both files change together.**
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      upload_steps, reveal_file_button)

LOOKUP_URL = BASE + "/asset-lookup"
ASSET = "Pump 0102"

# ---- MOB.740's locators. Change these and MOB.740 together. -----------------------------------
ITEM = '(//*[contains(@class,"mantine-Accordion-item")])[1]'
TAB = f'{ITEM}//*[@role="tab"]'
HISTORY_TAB = f'{TAB}[normalize-space(.)="Work History"]'
MODAL = '//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
MODAL_TAB = f'{MODAL}//*[@role="tab"]'
HISTORY_ROW = (f'{ITEM}//*[contains(concat(" ", normalize-space(@class), " "),'
               f' " mantine-Paper-root ")][contains(., "Description:")]')
ATTACH_TAB = f'{MODAL_TAB}[normalize-space(.)="Attachments"]'

# Scope EVERYTHING to the modal: the asset-lookup accordion behind it keeps its own tab strip
# mounted, and it has a `Photos` tab of its own (trap 3, and MOB.740 paid for this lesson).
IN_MODAL = ("const m = document.querySelector('.mantine-Modal-content');\n"
            "if (!m) return false;\n")

# `PhotoCarousel` takes `buttonText` from its call site; `Attachments` passes none, so this side
# shows the COMPONENT DEFAULT. ⭐ That is the other half of MOB.620's assertion, which pins the
# collector's DERIVED label (`Add Asset Photo`). Two call sites, one conditional, both directions.
ADD_PHOTO = "Add Photo"
ADD_FILE = "Add File"

# Switch the Photos/Docs segmented control by VALUE, never by text (see the header, §22).
# tabOptions is hardcoded [{value:'1',Photos},{value:'2',Docs}] (WorkStageAttachments.tsx:106).
def pick_segment(value):
    return (IN_MODAL +
            "const root = m.querySelector('[class*=\"mantine-SegmentedControl-root\"]');\n"
            "if (!root) return false;\n"
            f"let el = root.querySelector('input[type=\"radio\"][value=\"{value}\"]');\n"
            "if (!el) {\n"
            "  // structural fallback: the options render in the order they are declared\n"
            "  const c = [...root.querySelectorAll("
            "'label, button, [class*=\"SegmentedControl-control\"]')];\n"
            f"  el = c[{int(value) - 1}];\n"
            "}\n"
            "if (!el) return false;\n"
            "el.click();\n"
            "return true;\n")


# The two Add buttons are MUTUALLY EXCLUSIVE by construction: `Attachments` renders the carousel
# only when given `onPhotosAdded` and the table only when given `onFilesAdded`, and
# `WorkStageAttachments` passes exactly one of them per tab (:129-144). So "exactly one of the
# two is present, and it is the right one" is a real invariant of the tab switch rather than a
# restatement of the click - it can fail in both directions.
def only_button(want, other):
    return (IN_MODAL +
            "const t = [...m.querySelectorAll('button')]"
            ".map(b => (b.textContent || '').trim());\n"
            f"const want = t.includes('{want}'), other = t.includes('{other}');\n"
            "return want && !other;\n")


steps = [
    go(LOOKUP_URL, "asset lookup"),
    step("wait", "Wait for the page to mount", {"value": 3}),
    step("assertElementContent", 'Test the "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup",
          "element": xpath_el(LOOKUP_URL,
                              '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                              ' "Asset Lookup")]')}, timeout=30),

    # ---- reach the asset (MOB.740's prefix) ---------------------------------------------------
    step("click", "Focus the search input",
         {"element": xpath_el(LOOKUP_URL, '//input[@name="asset-search"]')}, timeout=30),
    # `asset_lookup_query` persists to sessionStorage and a suite shares one browser session, so
    # the box arrives holding whatever searched before. typeText APPENDS (trap 17).
    step("pressKey", "Select any persisted query first (typeText APPENDS — trap 17)",
         {"value": "a", "modifiers": ["Control"]}),
    step("typeText", f"Search for {ASSET}",
         {"value": ASSET, "element": xpath_el(LOOKUP_URL, '//input[@name="asset-search"]')}),
    step("pressKey", "Submit the search (Enter — there is no search button)", {"value": "Enter"}),
    step("wait", "Wait for the search results", {"value": 5}),
    step("assertElementPresent", f"RESULT GUARD: a result row for {ASSET} rendered",
         {"element": xpath_el(LOOKUP_URL, f'{ITEM}[contains(., "{ASSET}")]')}, timeout=60),

    step("click", "Expand the first result",
         {"element": xpath_el(LOOKUP_URL,
                              f'{ITEM}//*[contains(@class,"mantine-Accordion-control")]')},
         timeout=30),
    step("wait", "Wait for the detail panel to mount", {"value": 3}),

    step("click", 'Open the "Work History" tab',
         {"element": xpath_el(LOOKUP_URL, HISTORY_TAB)}, timeout=60),
    step("wait", "Let the work history query resolve", {"value": 5}),
    # FIXTURE GUARD, critical on purpose: a run that saw `No History Found` has proven nothing
    # about the attachment panel. A failure here means the fixture lost its history.
    step("assertElementPresent", f"FIXTURE GUARD: {ASSET} has at least one work history row",
         {"element": xpath_el(LOOKUP_URL, f'({HISTORY_ROW})[1]')}, timeout=60),

    step("click", "Open the first work history record (opens a modal, not a route)",
         {"element": xpath_el(LOOKUP_URL, f'({HISTORY_ROW})[1]')}, timeout=30),
    step("wait", "Let MOBILE_WORK_ORDER_DETAILS resolve and the panel mount", {"value": 6}),
    step("assertElementPresent", "The work history modal opened",
         {"element": xpath_el(LOOKUP_URL, MODAL)}, timeout=60),

    # ---- open Attachments — where MOB.740 stops ------------------------------------------------
    step("click", 'Open the "Attachments" tab',
         {"element": xpath_el(LOOKUP_URL, ATTACH_TAB)}, timeout=30),
    step("wait", "Let WorkStageAttachments mount", {"value": 3}),
    step("assertElementPresent", '"Attachments" is the active tab',
         {"element": xpath_el(LOOKUP_URL, f'{ATTACH_TAB}[@data-active="true"]')}, timeout=30),

    # ---- the Photos/Docs control ----------------------------------------------------------------
    # Counted rather than spot-checked, and read off the radio VALUES rather than the labels,
    # which §22 makes nondeterministic below 375px.
    jsassert("The panel offers EXACTLY TWO segments (Photos / Docs), read by value not label",
             IN_MODAL +
             "const root = m.querySelector('[class*=\"mantine-SegmentedControl-root\"]');\n"
             "if (!root) return false;\n"
             "const vals = [...root.querySelectorAll('input[type=radio]')]"
             ".map(i => i.value);\n"
             "if (vals.length) return JSON.stringify(vals) === JSON.stringify(['1','2']);\n"
             "// no radios in this Mantine build — fall back to counting the controls\n"
             "return root.querySelectorAll('[class*=\"SegmentedControl-control\"]').length === 2;",
             timeout=30),

    # ---- PHOTOS (default tab) — asserted, NEVER uploaded to -------------------------------------
    # 🛑 Uploading here calls uploadPhoto + copyPhotoToAsset. Both write. See the header.
    jsassert("🛑 PHOTOS tab: the add button is present and reads the COMPONENT DEFAULT "
             f'"{ADD_PHOTO}" — and no "{ADD_FILE}" (asserted, never uploaded to)',
             only_button(ADD_PHOTO, ADD_FILE), timeout=30),

    # ---- switch to DOCS --------------------------------------------------------------------------
    jsassert("Switch to the Docs segment by VALUE (never by text — §22)", pick_segment("2"),
             timeout=30),
    step("wait", "Let the Docs panel render", {"value": 2}),
    # This is what proves the switch happened; the click above only proves an element was hit.
    jsassert(f'DOCS tab: "{ADD_FILE}" is present and the carousel button is GONE '
             "— the two are mutually exclusive by construction",
             only_button(ADD_FILE, ADD_PHOTO), timeout=30),
]

# ---- ⭐ the real upload that is supposed to be rejected -----------------------------------------
# The reveal targets `accept="*/*"`, which is what tells this input apart from every other file
# input in the app: `useFileDialog`'s gallery and camera inputs are all `accept="image/*"`
# (AddPhotoOptions.tsx:52-53), and this one is Mantine `FileButton`'s (Attachments.tsx:125).
# Position and the `capture` flag would BOTH be wrong here; `accept` is the discriminator.
#
# 🛑 AND IT IS SCOPED TO THE MODAL, WHICH IS A SAFETY PROPERTY RATHER THAN TIDINESS.
# `AttachmentTable` is rendered on BOTH sides of this screen - by `WorkStageAttachments` inside
# the modal, and by `FileAttachments` on the asset-lookup panel behind it - so two `accept="*/*"`
# inputs can be mounted at once. `FileAttachments.addFiles` calls `uploadFile` with **no image
# filter** (`FileAttachments.tsx:21-27`), so revealing the wrong one would write a real
# attachment to an ASSET record. `reveal_file_button` also fails closed on an ambiguous match,
# so the worst case is a red test rather than a silent write.
steps += upload_steps(
    LOOKUP_URL,
    picker=reveal_file_button(scope=".mantine-Modal-content"),
    reveal_name='Reveal the hidden "Add File" input (Mantine FileButton, accept="*/*")',
    upload_name="⭐ Upload an IMAGE through the FILE button — the branch that must reject it")

steps += [
    # FIRST, because `ToastContainer` is `autoClose={5000}` (Layout/index.tsx:48) and this is the
    # only proof that the component's handler actually RAN. Nothing is allowed between the upload
    # and this step.
    jsassert("⭐ The rejection toast fired — the filter ran and counted the image",
             "return /image file\\(s\\) were ignored/.test(document.body.textContent || '');",
             timeout=30),

    # ⭐ THE LOAD-BEARING ASSERTION. Absence alone is trap 5, so the two positive controls are
    # read from the same DOM node in the same step - see the header.
    jsassert("⭐ The image really landed on the input, really was an image, and really did NOT "
             "reach the attachment table",
             "const el = document.querySelector('input[data-dd-upload=\"1\"]');\n"
             "if (!el || !el.files || el.files.length !== 1) return false;   // it arrived\n"
             "const f = el.files[0];\n"
             "if (!/^image\\//.test(f.type)) return false;                    // it is an image\n"
             + IN_MODAL +
             "const tbl = m.querySelector('table');\n"
             "const shown = tbl ? (tbl.textContent || '') : '';\n"
             "return !shown.includes(f.name.slice(0, 20));                   // it was rejected\n",
             timeout=30),

    # The panel survived the rejection rather than blanking - a filter that threw would also
    # leave no row.
    jsassert(f'…and the panel is still usable — "{ADD_FILE}" is still there',
             only_button(ADD_FILE, ADD_PHOTO), timeout=30),

    # ---- close ------------------------------------------------------------------------------------
    # 🛑 `onClose` is `() => {}` with `withCloseButton={false}` (WorkHistory.tsx:198-200), so
    # Escape and the overlay do NOTHING here. The inner CloseButton is the only dismissal, and it
    # is alwaysExecute - a modal left open would sit over every later subtest in the session.
    step("click", "Close the modal (its CloseButton — Escape and the overlay are no-ops here)",
         {"element": xpath_el(
             LOOKUP_URL,
             f'{MODAL}//button[contains(concat(" ", normalize-space(@class), " "),'
             f' " mantine-CloseButton-root ")]')},
         always=True, timeout=30),
    step("wait", "Let the modal close", {"value": 2}, always=True),
    jsassert("RESTORED: no modal is left open, and nothing was attached",
             "return !document.querySelector('.mantine-Modal-content');",
             always=True, timeout=30),
]

write(test(
    "MOB.741_Work_Attachments_Docs",
    "`MOB.741` **The work-stage attachment panel — and the image filter on `Add File`.**\n"
    "- `MOB.740` opens the `Attachments` tab and asserts it is *active*; **nothing had ever read\n"
    "  what is inside it**. This is T1.2, and it was filed under 🔴 HARNESS — wrong twice over:\n"
    "  `MOB.621` proved a `bucketKey` is portable, and the branch below never reaches the server.\n"
    "- ⭐ **A genuine upload of a real file that writes nothing.** The Docs tab's `Add File`\n"
    "  filters images out client-side (`Attachments.tsx:33-43`) and calls `onFilesAdded` only\n"
    "  when something survives (`:179`), so an image never reaches `uploadFile`. Full coverage of\n"
    "  a real branch with **zero residue** on a shared fixture.\n"
    "- ⭐ **The assertion is built against trap 5.** \"The file did not appear\" is true of a dead\n"
    "  screen too, so it is paired with two positive controls read off the same node: the input\n"
    "  really received **exactly one** file, and that file's type really matches `/^image\\//`.\n"
    "  Swap the fixture for a PDF and the test fails loudly instead of passing for the wrong\n"
    "  reason.\n"
    "- 🛑 **The Photos tab is asserted and NEVER uploaded to.** Its `addImages` calls\n"
    "  `uploadPhoto` **and** `copyPhotoToAsset` (`WorkStageAttachments.tsx:34-43`) — two writes\n"
    "  against a fixture other tests read. The file filter is what makes the Docs side safe and\n"
    "  it has **no counterpart** on the Photos side.\n"
    "- ⭐ Pins the other half of `MOB.620`'s conditional: this call site passes **no**\n"
    "  `buttonText`, so it must show the component default **`Add Photo`** where the collector\n"
    "  shows its derived `Add Asset Photo`. The two Add buttons are **mutually exclusive** by\n"
    "  construction, which is what makes the tab switch checkable rather than assumed.\n"
    "- ⚠️ **The segmented control is switched by VALUE, never by text** (`bugs_found.md` §22 —\n"
    "  `useMediaQuery` inside a `.map()` makes the label nondeterministic under 375px).\n"
    "- ⚠️ The route is `MOB.740`'s, **duplicated on purpose** — `WorkLookupDetails` hardcodes its\n"
    "  four sections, so the tab is guaranteed there, and sharing the prefix would rewrite a\n"
    "  green wired test. **If the route breaks, both files change together.**",
    steps,
    tags=["Mobile", "env:dev", "Work Orders", "Attachments", "read-only"],
))
print("wrote MOB.741 (work stage attachments / Add File image filter)")
