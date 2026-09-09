"""Build MOB.623_Collector_Saved_Photo_Menu - add a photo to an EXISTING asset, then drive the
gear menu on that SAVED photo, and assert what the Photos / Docs / Attributes panels render.

WHY THIS EXISTS
  `MOB.622` proves `PhotoMenu` renders on a LOCAL, unsaved photo and stops. Nothing had opened the
  gear on a photo that is actually attached to a record, so `Set as Avatar`, `Rotate Image` and
  `Get Description` (`PhotoAttachments.tsx` / `AssetLookupDetails/index.tsx`) were unexercised
  on every parent type. Nothing had added a photo to an EXISTING record either (`MOB.600` attaches
  at creation; `MOB.621`/`622` never submit). And `MOB.520` clicks the Photos / Docs / Attributes
  tabs but asserts only `data-active`, so what those panels RENDER was unproven anywhere.

THE FIXTURE, AND WHY THE TEST SUPPLIES ITS OWN PHOTO
  The row is the newest `DD SYNTHETIC MOBILE` asset in the collector list (`createdAt DESC`).
  ⚠️ MEASURED 2026-09-09 (first run's screenshot): the server-side `collectedAssets` list holds
  no asset newer than Sep 3, and its `DD SYNTHETIC MOBILE` rows (Aug 21/24) carry a `0` photo
  badge. So there is NO residue asset with a saved photo to lean on - and `MOB.600`'s Sep 8/9
  assets are absent from that list even though its PROOF OF CREATION passed (that step reads a
  row `prependTableResults` writes into the cache client-side; see Appendix D).
  ➡️ This test therefore uploads ONE photo onto the marker asset itself through the panel's own
  `Add Photo` (`PhotoAttachments.addPhotos` -> `uploadPhoto`), which is coverage of a surface no
  test had, and then drives the menu on that photo. Residue: one photo per run on a throwaway
  record. Inside `MOB.994` it runs last, on the asset `MOB.600` created a minute earlier.

HOW "THE UPLOAD LANDED" IS KNOWN
  In the browser `UploadLink` tus-uploads the bytes FIRST and only then forwards
  `CREATE_PENDING_ATTACHMENTS`; the optimistic attachment renders with a `blob:` preview and the
  response replaces it with the server's `reportLinkPreview`. So the slide's `<img src>` flipping
  from `blob:` to a server URL is the readiness signal, and it is polled rather than waited on.

⭐ ROTATE IMAGE IS THE STRONGEST TEST AVAILABLE ON THIS SURFACE
  A real mutation (`ROTATE_IMAGE`, 90°) with a read-back proof: `handleRotate`'s cache update
  rewrites `reportLinkPreview` to `${server value}&t=${Date.now()}` and the slide renders that as
  its src. After each click the src must DIFFER from the value recorded before it AND carry a
  `t=` cache-buster. Four clicks are 360°, so the photo ends as it began. The src is stashed in
  `sessionStorage['__dd623_src']` between steps and the key is removed on the way out.
  ⚠️ What this proves is the round trip: the server resolver swallows a failed `rotate()` and
  still returns the record (`attachment/update/index.ts`), and pixels are not assertable.
  ⚠️ If a rotate step fails part-way the photo is left at 90°/180°/270°. Accepted on a throwaway
  record; forcing the remaining clicks with `alwaysExecute` would rotate blindly past an unknown
  failure.

🛑 ASSERTED, NEVER CLICKED
  `Set as Avatar` writes an avatar with no restore. `Get Description` posts the image to the AI
  route. `Delete Photo` is trap 2. All three are proven PRESENT by reading the open dropdown's
  item set - exactly five items, in the order the two call sites compose them:
      PhotoMenu: `View in Fullscreen` first, then `menuOptions`
      PhotoAttachments: `[...actions, Set as Avatar, Rotate Image, Delete Photo]`
      AssetLookupDetails passes `actions = [Get Description]`
  An exact ordered set fails if an item is added, removed, renamed or reordered.

⭐ PHOTOS vs DOCS IS A BICONDITIONAL
  `Attachments.tsx` mounts the carousel only when `onPhotosAdded` is passed and the file table only
  when `onFilesAdded` is - `PhotoAttachments` passes the first, `FileAttachments` the second. So
  the Photos panel must show a carousel + `Add Photo` and NO `Add File`, and the Docs panel the
  exact opposite. `keepMounted={false}` on the tabs means only the active panel is in the DOM, so
  everything is scoped to the accordion item and read twice with opposite verdicts (`MOB.741`'s
  shape, on an Asset instead of a WorkStage).

  Attributes is an exclusive-or: `RecordAttributeTable` renders EITHER `No Attributes Found` OR a
  table of `<b>label</b>` rows, never both and never neither.

⚠️ TRAP 3 - the page holds many accordion items, and after expansion the tab strip, carousel and
  gear exist per item. Every XPath and every JS body is scoped to THE item chosen by the guard -
  the first whose CONTROL carries the marker - and within it to the LAST slide, which is the one
  the carousel jumps to after an upload. The Mantine class is matched as a whole token:
  `contains(@class, "mantine-Accordion-item")` would also match `mantine-Accordion-itemTitle`.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert, upload_steps  # noqa: E402

COLLECTOR_URL = BASE + "/asset-collector"
MARKER = "DD SYNTHETIC MOBILE"
SRC_KEY = "__dd623_src"
ROTATIONS = 4
MENU = ["View in Fullscreen", "Get Description", "Set as Avatar", "Rotate Image", "Delete Photo"]


def tok(cls):
    return f'contains(concat(" ", normalize-space(@class), " "), " {cls} ")'


# The one row this test drives: the first item whose CONTROL carries the marker.
ITEM = (f'(//*[{tok("mantine-Accordion-item")}]'
        f'[.//*[{tok("mantine-Accordion-control")}][contains(., "{MARKER}")]])[1]')
CHEVRON = f'{ITEM}//*[{tok("mantine-Accordion-chevron")}]'
ADD_PHOTO = f'{ITEM}//button[normalize-space(.)="Add Photo"]'


def tab(title):
    return f'{ITEM}//*[@role="tab"][normalize-space(.)="{title}"]'


def menu_item(label):
    # Scoped to the Menu.Item class, first match (trap 3 - `//*` would also hit the inner label).
    return f'(//*[{tok("mantine-Menu-item")}][normalize-space(.)="{label}"])[1]'


# JS prelude: resolve the same item the XPath does, or return false.
ITEM_JS = (
    "const items = [...document.querySelectorAll('.mantine-Accordion-item')];\n"
    "const it = items.find(i => {\n"
    "  const c = i.querySelector('.mantine-Accordion-control');\n"
    f"  return c && (c.textContent || '').includes('{MARKER}');\n"
    "});\n"
    "if (!it) return false;\n")

SLIDE = '[class*="mantine-Carousel-slide"]'
# The LAST slide: the carousel jumps to the newest photo after an upload (`index.tsx`,
# `setIndex(last)`), so that is the photo this test added and the one it rotates.
LAST_SLIDE = (f"const slides = it.querySelectorAll('{SLIDE}');\n"
              "const last = slides[slides.length - 1];\n"
              "if (!last) return false;\n")
BUTTONS = "const t = [...it.querySelectorAll('button')].map(b => (b.textContent || '').trim());\n"
# The panel behind the ACTIVE tab, by `aria-controls` -> id; falls back to the one panel that is
# not `display:none`. Inactive panels are empty shells, so "first tabpanel" is never right.
ACTIVE_PANEL = (
    "const tabEl = it.querySelector('[role=\"tab\"][aria-selected=\"true\"], [role=\"tab\"][data-active]');\n"
    "const byId = tabEl && tabEl.getAttribute('aria-controls')\n"
    "  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;\n"
    "const p = byId || [...it.querySelectorAll('[role=\"tabpanel\"]')]\n"
    "  .find(x => x.style.display !== 'none');\n"
    "if (!p) return false;\n")

# Clear any stale reveal tag from an earlier test in the same session, then take the gallery
# input (`useFileDialog` appends it to <body> while the picker is open; the camera inputs carry
# `capture`). Same shape as MOB.622's picker.
PICK_FRESH_GALLERY = (
    "document.querySelectorAll('[data-dd-upload]')\n"
    "  .forEach(n => n.removeAttribute('data-dd-upload'));\n"
    "const inputs = [...document.querySelectorAll('input[type=\"file\"]')];\n"
    "const el = inputs.find(i => !i.capture);\n")


def switch_tab(title, wait=3):
    return [
        step("click", f'Switch to the "{title}" tab',
             {"element": xpath_el(COLLECTOR_URL, tab(title))}, timeout=30),
        step("wait", f"Let the {title} panel mount", {"value": wait}),
        step("assertElementPresent", f'The "{title}" tab is active',
             {"element": xpath_el(COLLECTOR_URL, tab(title) + "[@data-active]")}, timeout=30),
    ]


def open_gear(name):
    return jsassert(name,
                    ITEM_JS + LAST_SLIDE +
                    "const g = last.querySelector('[aria-label=\"Settings\"]');\n"
                    "if (!g) return false;\n"
                    "g.click();\n"
                    "return true;", timeout=30)


def rotate(n):
    return [
        jsassert(f"ROTATE {n}/{ROTATIONS}: record the last slide's current src",
                 ITEM_JS + LAST_SLIDE +
                 "const img = last.querySelector('img');\n"
                 "if (!img || !img.getAttribute('src')) return false;\n"
                 f"sessionStorage.setItem('{SRC_KEY}', img.getAttribute('src'));\n"
                 "return true;", timeout=30),
        open_gear(f"ROTATE {n}/{ROTATIONS}: open the gear on that slide"),
        step("wait", "Let the menu dropdown render", {"value": 2}),
        step("click", f'ROTATE {n}/{ROTATIONS}: click "Rotate Image"',
             {"element": xpath_el(COLLECTOR_URL, menu_item("Rotate Image"))}, timeout=30),
        # Polls: the server rotates the file and the cache update lands afterwards. The proof is
        # the src DIFFERING from the recorded one, not merely containing `t=` - after the first
        # click every later "before" already carries a `t=`.
        jsassert(f"⭐ ROTATE {n}/{ROTATIONS}: the src changed and carries a fresh `t=` cache-buster",
                 ITEM_JS + LAST_SLIDE +
                 f"const before = sessionStorage.getItem('{SRC_KEY}');\n"
                 "const img = last.querySelector('img');\n"
                 "if (!before || !img) return false;\n"
                 "const now = img.getAttribute('src') || '';\n"
                 "return now !== before && /[?&]t=\\d+/.test(now);", timeout=60),
    ]


steps = [
    go(COLLECTOR_URL, "the asset collector"),
    step("wait", "Wait for the collector to load its lookup cache", {"value": 15}),
    step("assertElementPresent", "The collector page rendered",
         {"element": xpath_el(COLLECTOR_URL, '//*[@id="page-title"]//h4')}, timeout=30),
    # soft: a missing fixture goes red without aborting the suite's other children (dd_tools.step).
    step("assertElementPresent",
         f'FIXTURE GUARD: a "{MARKER}" asset is in the collected list (MOB.600 residue)',
         {"element": xpath_el(COLLECTOR_URL, ITEM)}, timeout=60, soft=True),
    step("click", "Expand that row by its chevron (the avatar and geolocate controls stop "
                  "propagation, so the chevron is the safe target)",
         {"element": xpath_el(COLLECTOR_URL, CHEVRON)}, timeout=30),
    step("wait", "Let the detail panel mount", {"value": 3}),
    step("assertElementPresent", "The row's tab strip rendered",
         {"element": xpath_el(COLLECTOR_URL, f'({ITEM}//*[@role="tab"])[1]')}, timeout=30),
    jsassert("The strip has SIX tabs (`AssetLookupDetails`' template)",
             ITEM_JS + "return it.querySelectorAll('[role=\"tab\"]').length === 6;", timeout=30),
]

# ---- Photos: add a photo to the EXISTING asset --------------------------------------------------
steps += switch_tab("Photos")
steps += [
    # `Add Photo` is the component default label (`PhotoCarousel`, no `buttonText` here), gated on
    # `permissions.asset.update` - which the `Admin` role has. Present with or without photos.
    step("assertElementPresent", 'PHOTOS panel: the `Add Photo` button renders (asset.update)',
         {"element": xpath_el(COLLECTOR_URL, ADD_PHOTO)}, timeout=30),
    jsassert("PHOTOS panel: NO `Add File` here - that is the Docs panel's control",
             ITEM_JS + BUTTONS + "return !t.includes('Add File');", timeout=30),
    step("click", 'Open the picker ("Add Photo") on the saved asset',
         {"element": xpath_el(COLLECTOR_URL, ADD_PHOTO)}, timeout=30),
    step("assertPageContains", "The picker opened", {"value": "Select Photo Source"}, timeout=30),
] + upload_steps(
    COLLECTOR_URL, picker=PICK_FRESH_GALLERY,
    reveal_name="Reveal the hidden gallery input (clearing any stale tag)",
    upload_name="Upload a photo onto the EXISTING asset",
) + [
    step("assertPageLacks", "The picker closed ITSELF once the file arrived (`onDialogChange`)",
         {"value": "Select Photo Source"}, timeout=30),
    # ⭐ Readiness, polled: tus bytes first, then the mutation response swaps the blob preview for
    # the server URL. Until then the photo exists only in the cache and Rotate would race it.
    jsassert("⭐ UPLOAD LANDED: the last slide's <img src> is a server URL, not the `blob:` preview",
             ITEM_JS + LAST_SLIDE +
             "const img = last.querySelector('img');\n"
             "const src = img ? (img.getAttribute('src') || '') : '';\n"
             "return src.length > 0 && !src.startsWith('blob:') && !src.startsWith('data:');",
             timeout=90),
    jsassert("⭐ PHOTOS panel: a carousel with a slide and an <img>, `Add Photo`, and NO `Add File`",
             ITEM_JS + BUTTONS +
             f"const slides = it.querySelectorAll('{SLIDE}').length;\n"
             f"const img = it.querySelector('{SLIDE} img');\n"
             "return slides >= 1 && !!img && t.includes('Add Photo') && !t.includes('Add File');",
             timeout=30),
    jsassert("The gear (`aria-label=\"Settings\"`) renders on the saved photo",
             ITEM_JS + LAST_SLIDE +
             "return !!last.querySelector('[aria-label=\"Settings\"]');", timeout=30),
    open_gear("Open the gear"),
    step("wait", "Let the menu dropdown render", {"value": 2}),
    # Exactly ONE dropdown is open (the header burger and the column picker are closed and
    # unmounted), and its items are exactly the composed set, in order.
    jsassert("⭐ MENU SET: exactly " + " · ".join(MENU) + " — in that order",
             "const dds = document.querySelectorAll('.mantine-Menu-dropdown');\n"
             "if (dds.length !== 1) return false;\n"
             "const got = [...dds[0].querySelectorAll('.mantine-Menu-item')]\n"
             "  .map(e => (e.textContent || '').trim());\n"
             f"const want = {MENU!r};\n"
             "return JSON.stringify(got) === JSON.stringify(want);", timeout=30),
    step("pressKey", "Close the menu (nothing in it is clicked yet)", {"value": "Escape"}),
    step("wait", "Let the menu close", {"value": 1}),
]

# ---- Rotate Image x4: real mutation, read-back proof, restores itself at 360° ----------------
for n in range(1, ROTATIONS + 1):
    steps += rotate(n)

# ---- Docs: the opposite verdict on the same two facts ----------------------------------------
steps += switch_tab("Docs")
steps += [
    jsassert("⭐ DOCS panel: `Add File`, NO `Add Photo`, and NO carousel — the biconditional closes",
             ITEM_JS + BUTTONS +
             f"const slides = it.querySelectorAll('{SLIDE}').length;\n"
             "return slides === 0 && t.includes('Add File') && !t.includes('Add Photo');",
             timeout=30),
]

# ---- Attributes: exclusive-or ---------------------------------------------------------------
steps += switch_tab("Attributes", wait=2)
steps += [
    # ⚠️ NOT `it.querySelector('[role="tabpanel"]')`: Mantine keeps every inactive panel in the DOM
    # as an EMPTY `role="tabpanel"` with `display:none` (`TabsPanel.mjs`), so the first match is
    # General Info's empty shell. Resolve the ACTIVE tab's `aria-controls` instead - cost one run.
    jsassert("ATTRIBUTES panel: EXACTLY ONE of `No Attributes Found` or a table of labelled rows",
             ITEM_JS + ACTIVE_PANEL +
             "const empty = (p.textContent || '').includes('No Attributes Found');\n"
             "const rows = p.querySelectorAll('table tr b').length;\n"
             "return empty !== (rows > 0);", timeout=30),
]

# ---- leave it as found ------------------------------------------------------------------------
steps += [
    jsassert(f"CLEANUP: remove this test's scratch key `{SRC_KEY}`",
             f"sessionStorage.removeItem('{SRC_KEY}');\n"
             f"return !sessionStorage.getItem('{SRC_KEY}');", always=True, timeout=30),
    step("click", "Collapse the row again", {"element": xpath_el(COLLECTOR_URL, CHEVRON)},
         always=True, timeout=30),
    step("wait", "Let the panel close", {"value": 2}, always=True),
    jsassert("RESTORED: the row reports itself collapsed",
             ITEM_JS +
             "const c = it.querySelector('.mantine-Accordion-control');\n"
             "return !!c && c.getAttribute('aria-expanded') === 'false';",
             always=True, timeout=30),
]

write(test(
    "MOB.623_Collector_Saved_Photo_Menu",
    "`MOB.623` **Add a photo to an EXISTING asset, then drive the gear menu on that SAVED photo; "
    "and what the Photos / Docs / Attributes panels render.**\n"
    "- Fixture is the newest `DD SYNTHETIC MOBILE` asset in the collector list (`MOB.600`\n"
    "  residue). It has no saved photo (measured 2026-09-09), so the test adds ONE through the\n"
    "  panel's own `Add Photo` — a surface nothing else covers — and polls for the `blob:`\n"
    "  preview to become a server URL before touching it. **Residue: one photo per run** on a\n"
    "  throwaway record. In `MOB.994` this runs last, on the asset created a minute earlier.\n"
    "- ⭐ **`Rotate Image` ×4** — a real mutation with a read-back proof: the slide's `<img src>`\n"
    "  must DIFFER from the value recorded before each click and carry a fresh `t=`. Four 90°\n"
    "  turns are 360°, so it is **self-restoring by construction**. (The server swallows a failed\n"
    "  `rotate()` and still returns, so this proves the round trip, not the pixels.)\n"
    "- ⭐ **The menu set is asserted exactly and in order**: `View in Fullscreen` · `Get\n"
    "  Description` · `Set as Avatar` · `Rotate Image` · `Delete Photo`. Only Rotate is clicked;\n"
    "  the others write, post to the AI route, or delete.\n"
    "- ⭐ **Photos vs Docs is a biconditional** — carousel + `Add Photo` and no `Add File`, then\n"
    "  the exact opposite. Attributes is an exclusive-or over its two render branches.\n"
    "- Scoped to ONE accordion item and its LAST slide throughout (trap 3); leaves the row\n"
    "  collapsed and removes its scratch `sessionStorage` key.",
    steps,
    tags=["Mobile", "env:dev", "Asset Collector", "Photos", "residue"],
))
print("wrote MOB.623 (saved-photo gear menu + attachment panel content)")
