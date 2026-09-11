"""Build MOB.302 - a work-order photo's `Copy to asset`, proved on the server and cleaned up
(checklist 🟢 #3).

⭐ THE ONE OWNER-SANCTIONED DELETE (trap 2). Trap 2 forbids delete steps unless the repo owner
names the flow. The owner did, for this test only: copy the work order's photo to its asset,
prove it landed, then remove it FROM THE ASSET. Nothing else is ever deleted.

⚠️ "COPY" IS A LINK, NOT A COPY - measured on run 1, which the guard stopped cold:
  `controllers/system/attachment/index.ts:47-77` (`copy`) only INSERTS an asset<->attachment
  association row - the SAME attachment id - and does nothing if the row already exists. So
  after `Copy to asset` the asset lists the SOURCE's id, and one attachment has two parents.
  `delete/index.ts` (`destroy`) then decides by `getReferenceCount` over every association table:
    references > 1  ->  only this parent's association row is deleted; returns 0   (UNLINK)
    references = 1  ->  the S3 file, thumbnail and attachment row are deleted; returns 1
  So `Delete Photo` on the asset is an UNLINK *only because the work order still links it*.
  That is what the guard below leans on. (Run 1's leftover link was removed over the API -
  `removeAttachment` returned 0, and the work order kept its photo.)

DEDICATED FIXTURES (created by the owner for this test; no other test touches them)
  work order  `RcdI0xcpc8NBV8VoRNNBYM` - "☢️ USED IN DATADOG DONT TOUCH", Ready, template
              "All Tabs" (opened by URL, so the name is never asserted)
              (has ATTACHMENTS; `copyAttachmentToAsset` is OFF, so nothing copies on upload)
  its photo   one stage attachment - the SOURCE, never modified
  its asset   `Bypass Valve 0001` - the ONLY asset on the stage, 0 attachments at rest
  All read over the API before building (0 runs).

WHAT THE SOURCE SAYS
  `WorkStageAttachments.tsx`: the photo's gear menu offers `Copy to asset` (and `Delete Photo`
  - for the STAGE photo; never clicked here). It opens `CopyAttachmentForm` - "Copy attachment
  <file>", a radio per stage asset, `Submit`. `copyPhotoToAsset` (`utils/imageUpload.ts`) sends
  `COPY_ATTACHMENT { attachmentId, modelType: 'Asset', parentId }` and closes the modal only in
  the mutation's `update()` - so "the modal closed" is the SERVER's answer, not the click's.

⭐ THE ROUND TRIP IS PROVED BY COUNT, ON A SERVER-FRESH VIEW
    asset photos   0  ->  copy  ->  exactly 1 (the SOURCE's id)  ->  unlink  ->  0
  Every asset read is Asset Lookup (`MOBILE_ASSET_LOOKUP` is `network-only`). NOT the work
  order's Assets tab (its cache is patched client-side by `copyPhotoToAsset`). The source's id
  and file name are read from the work order page and carried in sessionStorage. The PREMISE
  (0 photos) is what proves the one photo afterwards was linked by THIS run.

🛑 THE DELETE IS GUARDED IN THE SAME STEP AS THE GEAR CLICK. The JS opens the menu only if the
  asset holds exactly one photo whose id IS the source's and whose name is the source's. The
  source id was captured from the WORK ORDER in this run, so the attachment has >= 2
  references when the delete is sent - `destroy` can only unlink. A guard that failed cannot
  be followed by a delete: the step is critical, and nothing after it is `always`.

LAST: the work order is re-read - still one photo, same id, and its image LOADS (the S3 file
survived; a deleted file would 404 to naturalWidth 0). That turns "destroy only unlinks" from
a source reading into a measurement on every run.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert, ACTIVE_PANEL_JS  # noqa: E402

WO_ID = "RcdI0xcpc8NBV8VoRNNBYM"
WO_URL = f"{BASE}/work/{WO_ID}"
WORK_URL = BASE + "/work"
LOOKUP_URL = BASE + "/asset-lookup"
TARGET = "Bypass Valve 0001"
K_SRC_ID, K_SRC_NAME = "__dd302_srcId", "__dd302_srcName"

SEARCH = '//input[@name="asset-search"]'
PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]'


def tok(cls):
    return f'contains(concat(" ", normalize-space(@class), " "), " {cls} ")'


ITEM = (f'(//*[{tok("mantine-Accordion-item")}]'
        f'[.//*[{tok("mantine-Accordion-control")}][contains(., "{TARGET}")]])[1]')
CHEVRON = f'{ITEM}//*[{tok("mantine-Accordion-chevron")}]'


def asset_tab(title):
    return f'{ITEM}//*[@role="tab"][normalize-space(.)="{title}"]'


def menu_item(label):
    return f'(//*[{tok("mantine-Menu-item")}][normalize-space(.)="{label}"])[1]'


def modal_with(text):
    return f'//*[{tok("mantine-Modal-content")}][.//*[contains(normalize-space(.), "{text}")]]'


# id of an attachment, from its image URL: `/api/attachment/<id>?org=…`
ID_OF = "const idOf = img => ((img && img.getAttribute('src') || '').match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;\n"
SLIDE = '[class*="mantine-Carousel-slide"]'

# The asset row's ACTIVE panel (Asset Lookup: the tab strip lives inside the row).
ASSET_PANEL_JS = (
    "const items = [...document.querySelectorAll('[class*=\"mantine-Accordion-item\"]')];\n"
    "const it = items.find(i => {\n"
    "  const c = i.querySelector('[class*=\"mantine-Accordion-control\"]');\n"
    f"  return c && (c.textContent || '').includes('{TARGET}');\n"
    "});\n"
    "if (!it) return false;\n"
    "const tabEl = it.querySelector('[role=\"tab\"][aria-selected=\"true\"], [role=\"tab\"][data-active]');\n"
    "const byId = tabEl && tabEl.getAttribute('aria-controls')\n"
    "  ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;\n"
    "const p = byId || [...it.querySelectorAll('[role=\"tabpanel\"]')].find(x => x.style.display !== 'none');\n"
    "if (!p) return false;\n"
    f"const slides = [...p.querySelectorAll('{SLIDE}')];\n"
    "const labels = [...p.querySelectorAll('button')].map(b => (b.textContent || '').trim());\n")

STASH = (f"const srcId = sessionStorage.getItem('{K_SRC_ID}');\n"
         f"const srcName = sessionStorage.getItem('{K_SRC_NAME}');\n")


def open_asset_photos(label):
    return [
        go(LOOKUP_URL, f"Asset Lookup ({label})"),
        step("wait", "Wait for the page to mount", {"value": 5}),
        step("assertElementContent", 'Test the "Asset Lookup" page rendered',
             {"check": "contains", "value": "Asset Lookup", "element": xpath_el(LOOKUP_URL, PAGE_TITLE)},
             timeout=30),
        step("click", "Focus the search input", {"element": xpath_el(LOOKUP_URL, SEARCH)}, timeout=30),
        step("pressKey", "Select any persisted query first (typeText APPENDS — trap 17)",
             {"value": "a", "modifiers": ["Control"]}),
        step("typeText", f"Search for {TARGET}", {"value": TARGET, "element": xpath_el(LOOKUP_URL, SEARCH)}),
        step("pressKey", "Submit the search (Enter)", {"value": "Enter"}),
        step("wait", "Wait for the search results (network-only)", {"value": 8}),
        step("click", f"Expand {TARGET}'s row by its chevron (never the avatar — bugs §35)",
             {"element": xpath_el(LOOKUP_URL, CHEVRON)}, timeout=30),
        step("wait", "Let the detail panel mount", {"value": 3}),
        step("click", 'Open its "Photos" tab', {"element": xpath_el(LOOKUP_URL, asset_tab("Photos"))},
             timeout=30),
        step("wait", "Let the Photos panel render", {"value": 3}),
    ]


def open_wo_attachments():
    return [
        go(WORK_URL, "/work to warm the lookup cache"),
        step("wait", "Wait for the work list and lookup prefetch", {"value": 20}),
        go(WO_URL, "the copy-to-asset work order"),
        step("wait", "Let the detail view begin rendering", {"value": 2}),
        step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}, timeout=30),
        step("click", 'Open the "Attachments" tab',
             {"element": xpath_el(WO_URL, '//*[@role="tab"][contains(normalize-space(.), "Attachments")]')},
             timeout=30),
        step("wait", "Let the Photos segment render", {"value": 3}),
    ]


steps = open_asset_photos("premise") + [
    jsassert(f"PREMISE: {TARGET} holds NO photos — the Photos panel rendered (`Add Photo`) and has "
             "no slides. A leftover copy stops the test here; it never deletes what this run did "
             "not make",
             ASSET_PANEL_JS + "return slides.length === 0 && labels.includes('Add Photo');", timeout=30),

    # ---- copy, on the work order -------------------------------------------------------------
] + open_wo_attachments() + [
    jsassert("CAPTURE: the work order's ONE photo — its attachment id and file name (the SOURCE)",
             ACTIVE_PANEL_JS + ID_OF +
             f"const slides = [...p.querySelectorAll('{SLIDE}')];\n"
             "if (slides.length !== 1) return false;\n"
             "const img = slides[0].querySelector('img');\n"
             "const id = idOf(img), name = img && img.getAttribute('alt');\n"
             "if (!id || !name) return false;\n"
             f"sessionStorage.setItem('{K_SRC_ID}', id);\n"
             f"sessionStorage.setItem('{K_SRC_NAME}', name);\n"
             "return true;", timeout=30),
    jsassert("Open the photo's gear menu",
             ACTIVE_PANEL_JS +
             f"const s = p.querySelector('{SLIDE}');\n"
             "const g = s && s.querySelector('[aria-label=\"Settings\"]');\n"
             "if (!g) return false;\ng.click();\nreturn true;", timeout=30),
    step("wait", "Let the menu open", {"value": 1}),
    jsassert("MENU (work-order photo): offers `Copy to asset` (and the stage's own `Delete Photo`)",
             "const items = [...document.querySelectorAll('[class*=\"mantine-Menu-dropdown\"] [class*=\"mantine-Menu-item\"]')]\n"
             "  .map(i => (i.textContent || '').trim());\n"
             "return items.includes('Copy to asset') && items.includes('Delete Photo');",
             timeout=30),
    step("click", "Click `Copy to asset` (NEVER `Delete Photo` here)",
         {"element": xpath_el(WO_URL, menu_item("Copy to asset"))}, timeout=30),
    step("wait", "Let the copy form open", {"value": 2}),
    jsassert(f"COPY FORM: names the source file, and offers exactly one asset — {TARGET}, selected",
             STASH +
             "const m = [...document.querySelectorAll('[class*=\"mantine-Modal-content\"]')]\n"
             "  .find(x => (x.textContent || '').includes('Select an asset'));\n"
             "if (!m || !srcName) return false;\n"
             "const radios = [...m.querySelectorAll('input[type=\"radio\"]')];\n"
             "const lab = r => { const l = m.querySelector('label[for=\"' + r.id + '\"]'); return l ? l.textContent.trim() : ''; };\n"
             "return (m.textContent || '').includes('Copy attachment ' + srcName)\n"
             f"  && radios.length === 1 && radios[0].checked && lab(radios[0]) === '{TARGET}';",
             timeout=30),
    step("click", "Submit the copy",
         {"element": xpath_el(WO_URL, f'{modal_with("Select an asset")}//button[normalize-space(.)="Submit"]')},
         timeout=30),
    step("wait", "Wait for COPY_ATTACHMENT", {"value": 3}),
    step("assertPageContains", "The `copied to asset.` toast (optional: transient)",
         {"value": "copied to asset."}, optional=True),
    step("wait", "Let the server answer", {"value": 3}),
    jsassert("⭐ THE COPY FORM CLOSED — it closes only in the mutation's `update()`, so the server "
             "answered",
             "return ![...document.querySelectorAll('[class*=\"mantine-Modal-content\"]')]\n"
             "  .some(x => (x.textContent || '').includes('Select an asset'));", timeout=30),

    # ---- proof, on the asset (server-fresh) ------------------------------------------------
] + open_asset_photos("proof") + [
    jsassert(f"⭐ {TARGET} now holds EXACTLY ONE photo — the SOURCE's attachment id and file "
             "name: `Copy to asset` LINKS the same attachment, it does not duplicate it",
             ASSET_PANEL_JS + ID_OF + STASH +
             "if (slides.length !== 1 || !srcId || !srcName) return false;\n"
             "const img = slides[0].querySelector('img');\n"
             "return idOf(img) === srcId && img.getAttribute('alt') === srcName;", timeout=30),

    # ---- unlink it from the ASSET (owner-sanctioned) ----------------------------------------
    jsassert("🛑 GUARD + open the gear: only if the asset's one photo IS the source this run read "
             "on the work order (>= 2 references, so the delete can only unlink)",
             ASSET_PANEL_JS + ID_OF + STASH +
             "if (slides.length !== 1 || !srcId || !srcName) return false;\n"
             "const img = slides[0].querySelector('img');\n"
             "if (idOf(img) !== srcId || img.getAttribute('alt') !== srcName) return false;\n"
             "const g = slides[0].querySelector('[aria-label=\"Settings\"]');\n"
             "if (!g) return false;\ng.click();\nreturn true;", timeout=30),
    step("wait", "Let the menu open", {"value": 1}),
    step("click", "Click `Delete Photo` — on the ASSET (unlinks its association row only)",
         {"element": xpath_el(LOOKUP_URL, menu_item("Delete Photo"))}, timeout=30),
    step("wait", "Let the confirmation open", {"value": 1}),
    step("click", 'Confirm: "Yes"',
         {"element": xpath_el(LOOKUP_URL, f'{modal_with("Are you sure you want to delete this image?")}'
                                          '//button[normalize-space(.)="Yes"]')}, timeout=30),
    step("wait", "Wait for REMOVE_ATTACHMENT", {"value": 5}),

    # ---- the round trip closed, both ends ----------------------------------------------------
] + open_asset_photos("after the delete") + [
    jsassert(f"⭐ UNLINKED: {TARGET} holds NO photos again — 0 → 1 → 0",
             ASSET_PANEL_JS + "return slides.length === 0 && labels.includes('Add Photo');", timeout=30),
] + open_wo_attachments() + [
    jsassert("⭐ THE SOURCE IS UNTOUCHED: the work order still has its one photo, same id",
             ACTIVE_PANEL_JS + ID_OF + STASH +
             f"const slides = [...p.querySelectorAll('{SLIDE}')];\n"
             "return slides.length === 1 && !!srcId && idOf(slides[0].querySelector('img')) === srcId;",
             timeout=30),
    jsassert("…and its FILE survived: the image loaded (a deleted S3 object 404s to naturalWidth 0) "
             "(soft: lazy loading could leave it unloaded)",
             ACTIVE_PANEL_JS + ID_OF + STASH +
             f"const img = p.querySelector('{SLIDE} img');\n"
             "return !!img && idOf(img) === srcId && img.complete && img.naturalWidth > 0;",
             soft=True, timeout=30),
    jsassert("Remove this test's sessionStorage keys",
             f"['{K_SRC_ID}', '{K_SRC_NAME}'].forEach(k => sessionStorage.removeItem(k));\n"
             "return true;", always=True, timeout=15),
]

write(test(
    "MOB.302_Work_Photo_Copy_To_Asset",
    "`MOB.302` **`Copy to asset` on a work-order photo — proved on the server, then unlinked.**\n"
    "- ⭐ **The one owner-sanctioned delete** (trap 2): copy the photo, prove it, remove it from\n"
    "  the ASSET. Dedicated fixtures: work order `RcdI0xcpc8NBV8VoRNNBYM` (one photo, the source)\n"
    f"  and its only asset `{TARGET}` (0 attachments at rest).\n"
    "- `Copy to asset` **links the same attachment** (same id) — it does not duplicate it. The\n"
    "  asset-side delete is an unlink only while another parent still references it.\n"
    "- Proved by count on Asset Lookup (network-only): **0 → 1 → 0**.\n"
    "- The delete step's own guard requires the asset's one photo to be the source this run read\n"
    "  on the work order, in the same step as the gear click.\n"
    "- Ends on the work order: still one photo, same id, image loads (the file survived).",
    steps,
    ["Mobile", "env:dev", "Work Order", "Photos", "self-cleaning"],
))
print("wrote MOB.302 (copy to asset = link, self-cleaning unlink)")
