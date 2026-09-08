"""Build MOB.622_Collector_Photo_Carousel - the carousel's DISPLAY surface, at one photo and two.

WHY THIS EXISTS, AND WHY IT NEEDS NO FIXTURE
  This whole surface sat in 🟡 BLOCKED behind an owner ask - *"≥2 photos on a named fixture
  asset"* - reasoned from `{photos.length > 0 && <Carousel>}` having no empty state. **That ask
  was withdrawn: it assumed photos can only arrive BEFORE page load.** They can be supplied at
  runtime, read-only:

      `MOB.621` already uploads one photo here and discards it by closing the form
      `ADD_PHOTO` **APPENDS** (`Form/utils.ts:124`, `[...state.photos, ...newPhotos]`)
          -> so uploading TWICE gives two photos, which is all the indicators need
      `addImages` dispatches to a **local reducer**; the attachment is created by `createAsset`
          on SUBMIT, so a test that never submits writes nothing

  ⭐ THE CENTRAL ASSERTION IS A BICONDITIONAL ACROSS THE TWO STATES.
  `withIndicators={photos.length > 1}` and `withControls={photos.length > 1}` (`index.tsx:122`).
  Asserting "indicators exist" after two uploads would pass on a component that always renders
  them. So this test reads the SAME two facts at one photo and at two, and requires them to
  DISAGREE. That is a real conditional pinned in both directions, in one run.

WHAT ELSE IT COVERS - all previously unreachable, none of it needing a fixture
  `PhotoMenu`         the gear (`aria-label="Settings"`), rendered per slide. It needs no SAVED
                      attachment - it reads `photo.tags` and nothing else - which is what makes
                      a locally-added photo enough.
  fullscreen          `View in Fullscreen` -> the fullscreen `Modal`, whose own carousel is
                      `withIndicators` UNCONDITIONALLY (`:177`) - the opposite of the inline one.
  the Close control   `aria-label="Close"` renders **only** when `fullScreen` (`PhotoMenu:130`),
                      so its absence beforehand and presence inside is a second biconditional.
  the tags badge      `Edit Tags ({activeTags.length})` (`PhotoMenu:181`) - a DERIVED label.
  `TagSelector`       ⭐ the FULL selector (`Search tags...`, `Tags/index.tsx:136`), which is a
                      DIFFERENT component from the `MiniTagSelector` (`Auto-apply tags?`, `:244`)
                      that `MOB.620` pins. A run once went amber for confusing exactly these two.

🛑 STRICTLY READ-ONLY, AND THE TAG CONTROLS ARE ASSERTED BUT NEVER ACTUATED.
  `handleTagAssign` / `handleTagCreate` MUTATE (`Tags/index.tsx:100-111` writes through
  `client.cache.modify`, and create posts a real tag). The tag modal is opened, read, and
  dismissed with its own `Done` button. Same standing rule as the three capture buttons in
  `MOB.620` and `Delete Item` in `MOB.397`: prove the control renders, never fire it.
  The form is then closed WITHOUT submitting, so no asset and no attachment are written.

⚠️ TRAP 3 IS AT ITS WORST ON THIS SCREEN - FOUR MODALS CAN BE MOUNTED AT ONCE.
  the collector form (`Get New Asset`) · the photo picker (`Select Photo Source`) · the
  FULLSCREEN modal · the TAG modal. Three of them contain a `.mantine-Carousel`, and two contain
  a control whose `aria-label` is `Close`. Nothing here is selected by position or by a bare
  class: the inline carousel is scoped to `#asset-collector`, and the fullscreen modal is
  identified as *the modal that has a carousel and does NOT contain the form*.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert, upload_steps  # noqa: E402

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

# ---- scoping helpers -------------------------------------------------------------------------
# The INLINE carousel lives inside the form; `MOB.621` proved this selector reaches it.
FORM = ("const f = document.getElementById('asset-collector');\n"
        "if (!f) return false;\n")
# The FULLSCREEN modal is the one that HAS a carousel and does NOT contain the form. Selecting it
# by position, or by `aria-label=Close`, would both be wrong - the form modal has a close button
# of its own, and the tag modal is a sibling. See the header.
FULLSCREEN = ("const fs = [...document.querySelectorAll('.mantine-Modal-content')]\n"
              "  .find(m => m.querySelector('[class*=\"mantine-Carousel\"]')\n"
              "          && !m.querySelector('#asset-collector'));\n")

IND = '[class*="mantine-Carousel-indicator"]'
CTRL = '[class*="mantine-Carousel-control"]'


def count_in_form(sel):
    return FORM + f"return f.querySelectorAll('{sel}').length"


# ⚠️ CLEAR STALE UPLOAD TAGS BEFORE THE SECOND REVEAL.
# `useFileDialog`'s input exists only while the picker is open, so the first one SHOULD be gone by
# now - but if it ever lingers, the reveal would re-find the detached node, the upload would fire
# a change event at nothing, and the second photo would silently never arrive. The `>1` assertion
# below would catch that, but as a confusing failure rather than a clear one. Two lines of
# insurance is cheaper than diagnosing it. Done here rather than in `dd_tools.upload_steps` so
# `MOB.600`'s and `MOB.621`'s green JSON is not disturbed.
PICK_FRESH_GALLERY = (
    "document.querySelectorAll('[data-dd-upload]')\n"
    "  .forEach(n => n.removeAttribute('data-dd-upload'));\n"
    "const inputs = [...document.querySelectorAll('input[type=\"file\"]')];\n"
    "const el = inputs.find(i => !i.capture);\n")


def add_a_photo(n, open_label):
    """Open the picker, drop a real file on the hidden gallery input, close the picker."""
    return [
        step("click", f'Open the photo picker for photo {n} ("{open_label}")',
             {"element": xpath_el(COLLECTOR_URL,
                                  f'//button[normalize-space(.)="{open_label}"]')}, timeout=30),
        step("assertPageContains", f"The picker opened for photo {n}",
             {"value": "Select Photo Source"}, timeout=30),
    ] + upload_steps(
        COLLECTOR_URL,
        picker=PICK_FRESH_GALLERY,
        reveal_name=f"Reveal the hidden gallery input for photo {n} (clearing any stale tag)",
        upload_name=f"Upload photo {n}",
    ) + [
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
             f"⭐ The picker closed ITSELF after photo {n} — `onDialogChange` calls `close()`",
             {"value": "Select Photo Source"}, timeout=30),
        step("wait", f"Let the reducer take photo {n}", {"value": 4}),
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
]

# ---- ONE photo: the carousel exists, and is deliberately BARE --------------------------------
steps += add_a_photo(1, "Add Asset Photo")
steps += [
    jsassert("At ONE photo: the carousel exists",
             FORM + "return f.querySelectorAll('[class*=\"mantine-Carousel\"]').length >= 1;",
             timeout=30),
    # ⭐ The first half of the biconditional. These two must be ABSENT here and PRESENT after the
    # second upload; asserting only the second half would pass on a carousel that always shows
    # them (trap 5).
    jsassert("⭐ At ONE photo: NO indicators — `withIndicators={photos.length > 1}` is false",
             count_in_form(IND) + " === 0;", timeout=30),
    jsassert("⭐ At ONE photo: NO controls — `withControls={photos.length > 1}` is false",
             count_in_form(CTRL) + " === 0;", timeout=30),
    # `PhotoMenu` renders per slide and needs no SAVED attachment — this is the fact that made the
    # withdrawn fixture ask unnecessary, so it is asserted explicitly rather than assumed.
    jsassert("`PhotoMenu` rendered for a LOCAL, unsaved photo (its gear is present)",
             FORM + "return f.querySelectorAll('[aria-label=\"Settings\"]').length >= 1;",
             timeout=30),
]

# ---- TWO photos: the same two facts must now flip ---------------------------------------------
steps += add_a_photo(2, "Add More Photos")
steps += [
    # Proof the second upload actually landed, before anything is concluded from it. The button
    # label is derived from `attachments.length`, so it cannot be right by accident.
    step("assertElementPresent", 'The button still reads "Add More Photos" (a second photo landed)',
         {"element": xpath_el(COLLECTOR_URL, ADD_MORE)}, timeout=30),
    jsassert("PROOF: there are now TWO slides, so the reducer APPENDED rather than replaced",
             FORM + "return f.querySelectorAll('[class*=\"mantine-Carousel-slide\"]').length === 2;",
             timeout=30),

    # ⭐ THE BICONDITIONAL CLOSES. Same two selectors, same scope, opposite verdict.
    jsassert("⭐ At TWO photos: indicators APPEAR — the `photos.length > 1` branch",
             count_in_form(IND) + " >= 1;", timeout=30),
    jsassert("⭐ At TWO photos: controls APPEAR — the same branch, second prop",
             count_in_form(CTRL) + " >= 1;", timeout=30),

    # The derived tags label. With 0 tags the badge reads `Edit Tags (0)`; with 1-3 it renders the
    # tag NAMES instead and this string vanishes (`PhotoMenu:154-183`).
    # ⚠️ COUNTED AGAINST THE SLIDES, not merely searched for. Every photo carries its OWN
    # PhotoMenu, so a bare `/Edit Tags \(0\)/` on the form's text passes as long as ONE untagged
    # photo is present — it would still pass if the other photo had picked up tags. Requiring one
    # zero-badge PER SLIDE is what makes this fail when any photo carries tags. (Caught by the
    # jsdom validator, which is exactly the case it was written to find.)
    jsassert("Every slide's tags badge reads its DERIVED zero form `Edit Tags (0)` — "
             "counted per slide, not merely present somewhere",
             FORM + "const slides = f.querySelectorAll('[class*=\"mantine-Carousel-slide\"]')"
                    ".length;\n"
                    "if (slides < 1) return false;\n"
                    "const hits = (f.textContent || '').match(/Edit Tags \\(0\\)/g) || [];\n"
                    "return hits.length === slides;", timeout=30),

    # ---- fullscreen ---------------------------------------------------------------------------
    # 🛑 The `aria-label=\"Close\"` control renders ONLY when `fullScreen` (`PhotoMenu:130`), so
    # its absence NOW is the first half of a second biconditional. It is scoped away from
    # `.mantine-Modal-close`, which is the FORM's own X and would otherwise match.
    jsassert("⭐ BEFORE fullscreen: no `aria-label=\"Close\"` control exists "
             "(excluding the form's own modal X)",
             "return [...document.querySelectorAll('[aria-label=\"Close\"]')]\n"
             "  .filter(n => !n.classList.contains('mantine-Modal-close')).length === 0;",
             timeout=30),

    # Clicked from JS, and on the LAST gear on purpose: `index.tsx:62` scrolls the carousel to the
    # newest photo after an upload, so the first slide's gear may be outside the viewport and a
    # real click on it would fail as not-interactable (trap 28's cousin). The Menu dropdown
    # portals out regardless of which target opened it.
    jsassert("Open the photo menu on the ACTIVE (last) slide",
             FORM + "const g = [...f.querySelectorAll('[aria-label=\"Settings\"]')];\n"
             "if (!g.length) return false;\n"
             "g[g.length - 1].click();\n"
             "return true;", timeout=30),
    step("wait", "Let the menu dropdown render", {"value": 2}),
    step("assertPageContains", '"View in Fullscreen" is offered',
         {"value": "View in Fullscreen"}, timeout=30),
    step("click", "Open fullscreen",
         {"element": xpath_el(COLLECTOR_URL,
                              # 🛑 NOT `//*` — trap 3. `//*[normalize-space(.)="…"]` matches the
                              # Menu.Item <button> AND the inner element carrying the same text,
                              # so Datadog reports "Multiple elements found" and refuses to
                              # click. Scope to the Menu.Item class and take the first: with two
                              # photos the carousel mounts a PhotoMenu per slide, so more than
                              # one dropdown can legitimately exist.
                              '(//*[contains(concat(" ", normalize-space(@class), " "),'
                              ' " mantine-Menu-item ")]'
                              '[normalize-space(.)="View in Fullscreen"])[1]')}, timeout=30),
    step("wait", "Let the fullscreen modal mount", {"value": 3}),

    jsassert("⭐ The FULLSCREEN modal opened — a carousel outside the form",
             FULLSCREEN + "return !!fs;", timeout=30),
    # ⭐ The fullscreen carousel is `withIndicators` UNCONDITIONALLY (`index.tsx:177`) — the
    # opposite of the inline one. Two carousels, two different rules, both now pinned.
    jsassert("⭐ Fullscreen indicators are UNCONDITIONAL — a different rule from the inline "
             "carousel above",
             FULLSCREEN + f"if (!fs) return false;\nreturn fs.querySelectorAll('{IND}').length >= 1;",
             timeout=30),
    # The second half of the Close biconditional.
    jsassert("⭐ INSIDE fullscreen: the `aria-label=\"Close\"` control now EXISTS",
             "return [...document.querySelectorAll('[aria-label=\"Close\"]')]\n"
             "  .filter(n => !n.classList.contains('mantine-Modal-close')).length >= 1;",
             timeout=30),

    jsassert("Leave fullscreen by its own Close control",
             "const b = [...document.querySelectorAll('[aria-label=\"Close\"]')]\n"
             "  .filter(n => !n.classList.contains('mantine-Modal-close'));\n"
             "if (!b.length) return false;\n"
             "b[0].click();\n"
             "return true;", always=True, timeout=30),
    step("wait", "Let fullscreen close", {"value": 2}, always=True),
    jsassert("RESTORED: fullscreen is gone and the form is still open",
             FULLSCREEN + "return !fs && !!document.getElementById('asset-collector');",
             always=True, timeout=30),

    # ---- the tag modal — opened and READ, never actuated ---------------------------------------
    jsassert("Open the tag editor from the `Edit Tags (n)` badge "
             "(matches any count — the badge is the target, not its number)",
             FORM + "const b = [...f.querySelectorAll('*')]\n"
             "  .filter(n => n.children.length === 0\n"
             "            && /Edit Tags \\(\\d+\\)/.test(n.textContent || ''));\n"
             "if (!b.length) return false;\n"
             "b[b.length - 1].click();\n"
             "return true;", timeout=30),
    step("wait", "Let the tag modal mount", {"value": 3}),
    # ⚠️ POLLING, and it matters: `TagSelector` returns null until GET_TAGS_TABLE resolves
    # (`Tags/index.tsx:113`), so an un-polled assertion here would read an empty modal.
    step("assertPageContains", "The tag editor opened — its heading rendered once the tags query "
                               "resolved", {"value": "Edit Attachment Tags"}, timeout=30),
    # ⭐ THE FULL `TagSelector`, NOT the `MiniTagSelector`. `Search tags...` (`Tags/index.tsx:136`)
    # belongs to this component; `Auto-apply tags?` (`:244`) belongs to the picker's mini one that
    # MOB.620 pins. A run once went amber for asserting the wrong one of these two.
    step("assertElementPresent",
         '⭐ The FULL TagSelector rendered — `Search tags...`, not `Auto-apply tags?`',
         {"element": xpath_el(COLLECTOR_URL, '//input[@placeholder="Search tags..."]')},
         timeout=30),
    step("assertPageContains", "…and its `All Tags` section rendered", {"value": "All Tags"},
         timeout=30),

    # 🛑 NOTHING IS CLICKED IN HERE. Assigning or creating a tag MUTATES (`Tags/index.tsx:100`).
    # `Done` is the component's own dismissal and writes nothing.
    step("click", "Close the tag editor with its own `Done` button (assigning a tag would WRITE)",
         {"element": xpath_el(COLLECTOR_URL, '//button[normalize-space(.)="Done"]')},
         always=True, timeout=30),
    step("wait", "Let the tag modal close", {"value": 2}, always=True),
    step("assertPageLacks", "The tag editor is gone", {"value": "Edit Attachment Tags"},
         always=True, timeout=30),

    # ---- discard ------------------------------------------------------------------------------
    # 🛑 NEVER SUBMIT. Both photos live in the reducer; closing the form discards them and nothing
    # reaches the server. `closeOnClickOutside={false}`, so the X is the only dismissal.
    step("click", "Close the form with its X — DISCARDING both photos, never submitting",
         {"element": xpath_el(COLLECTOR_URL, f'{FORM_MODAL}{CLOSE_X}')},
         always=True, timeout=30),
    step("wait", "Let the form close", {"value": 2}, always=True),
    jsassert("RESTORED: the form is gone, so both photos were discarded unsent",
             "return !document.getElementById('asset-collector');",
             always=True, timeout=30),
]

write(test(
    "MOB.622_Collector_Photo_Carousel",
    "`MOB.622` **The carousel's DISPLAY surface — read at ONE photo and at TWO.**\n"
    "- ⛔ **This retires a fixture ask rather than waiting on it.** The surface sat in 🟡 BLOCKED\n"
    "  behind *\"≥2 photos on a named fixture asset\"*, which assumed photos can only arrive\n"
    "  **before page load**. `ADD_PHOTO` **appends** (`Form/utils.ts:124`), so uploading twice\n"
    "  supplies them at runtime — and it dispatches to a **local reducer**, so a test that never\n"
    "  submits writes nothing.\n"
    "- ⭐ **The central assertion is a BICONDITIONAL across the two states.**\n"
    "  `withIndicators`/`withControls` are `{photos.length > 1}`. Asserting they *appear* would\n"
    "  pass on a carousel that always shows them, so the same two facts are read at one photo and\n"
    "  at two and **required to disagree** — the conditional pinned in both directions, one run.\n"
    "- ⭐ Same shape again for **`aria-label=\"Close\"`**, which renders *only* in fullscreen\n"
    "  (`PhotoMenu:130`) — absent before, present inside. And the **fullscreen carousel is\n"
    "  `withIndicators` UNCONDITIONALLY** (`index.tsx:177`): two carousels, two different rules.\n"
    "- Covers what nothing had reached: `PhotoMenu` (proven to render for a **local, unsaved**\n"
    "  photo — the fact the withdrawn ask turned on), **View in Fullscreen**, the derived\n"
    "  **`Edit Tags (0)`** badge, and ⭐ the **FULL `TagSelector`** (`Search tags...`) — a\n"
    "  different component from the `MiniTagSelector` (`Auto-apply tags?`) `MOB.620` pins.\n"
    "- 🛑 **READ-ONLY, and the tag controls are asserted but NEVER actuated** — assigning or\n"
    "  creating a tag writes (`Tags/index.tsx:100`). The editor is dismissed with its own `Done`,\n"
    "  and the form is closed without submitting, so no asset and no attachment are created.\n"
    "- ⚠️ **Trap 3 at its worst: four modals can be mounted at once**, three containing a\n"
    "  carousel and two containing an `aria-label=\"Close\"`. Nothing is selected by position —\n"
    "  the inline carousel is scoped to `#asset-collector`, and fullscreen is identified as *the\n"
    "  modal with a carousel that does not contain the form*.",
    steps,
    tags=["Mobile", "env:dev", "Asset Collector", "Photos", "read-only"],
))
print("wrote MOB.622 (photo carousel display surface: 1 photo vs 2)")
