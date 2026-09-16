"""Build MOB.363_Work_Attachment_Upload_Delete - upload ONE photo to a work order's Attachments tab, prove
it on the server, delete THAT photo, prove the stage back to no attachments.

WHY THIS EXISTS
  `MOB.741` asserts the work-stage attachment panel and its Docs image filter - it never uploads to the
  Photos side (that writes). `MOB.302` copies an existing stage photo to an asset and unlinks it there.
  Nothing had uploaded a photo to a STAGE or sent the stage-side `REMOVE_ATTACHMENT`.

🛑 THE DELETE - owner-authorised 2026-09-15 (trap 2), ONLY the photo this run uploaded
  PREMISE (server)   the stage holds NO attachments - so the one it holds after the upload is this run's
  STASH  (server)    exactly one attachment, an image; its id goes to sessionStorage
  GUARD + GEAR       in ONE step: the Photos panel shows exactly one slide, and that slide's image IS the
                     stashed id - only then is its gear clicked. A leftover from a failed run stops the
                     next run at the premise; it is never deleted by a run that did not upload it.
  Nothing after the guard is `always`: a failed guard cannot be followed by a delete (MOB.302/390 shape).

WHAT THE SOURCE SAYS (`WorkOrders/components/WorkStageAttachments.tsx`, origin/development)
  - Upload: `handleUpload` -> `uploadPhoto(modelType: 'WorkStage')`, and - only when `copyToAsset` AND the
    stage has exactly one asset - `copyPhotoToAsset` too. The template here has
    `copyAttachmentToAsset: false` (WorkDetails passes it), so the photo must NOT reach the asset; the
    premise requires the flag false and the stash step proves the asset does not hold the new id.
  - The gear menu's `Copy to asset` / `Delete Photo` exist only when the stage HAS assets
    (`customMenuItems` returns [] otherwise) - why this runs on a stage with one asset.
  - `Delete Photo` -> `DeletePhotoConfirmation` "Are you sure you want to delete this image?" -> `Yes` ->
    `REMOVE_ATTACHMENT { modelType: 'WorkStage', parentId, attachmentId }`, fire-and-forget, after the
    cache is edited (trap 6: a reload proves nothing). Server `destroy`: one reference left -> the S3 file
    and the attachment row go. ⭐ Proved over /graphql: the stage's attachments are back to [] (rest).

UPLOAD: `upload_steps` (MOB.600's `uploadFiles` recipe, trap 12) behind the carousel's `Add Photo` ->
  `Select Photo Source`. The reveal takes the ONE `accept="image/*"` input without `capture` (the gallery
  input `useFileDialog` appends to <body>) and fails closed on none or several (trap 3). Readiness: the
  slide's `<img src>` leaves the `blob:` preview for the server's `/api/attachment/<id>` URL (MOB.623).

FIXTURE (shared with MOB.364 / MOB.365 - see build_work_attach_form_test.py)
  stage `xohY0klBZktB9VBRxc8k4J` (work 20260910-16), template `All Tabs`, one asset `⚡ Tank 0000`
  (never touched: `Copy to asset` is never clicked), 0 attachments at rest.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      server_assert, work_cache_warm, upload_steps, ACTIVE_PANEL_JS)

FIXTURE_ID = "xohY0klBZktB9VBRxc8k4J"      # work 20260910-16 - shared with MOB.364 / MOB.365
STAGE_URL = f"{BASE}/work/{FIXTURE_ID}"
ASSET_ID = "8khYtoBRVNNs5d9cEt8NdY"        # ⚡ Tank 0000 - the stage's one asset
K_ID, K_SERVER = "__dd363_id", "__dd363_server"
MENU = ["View in Fullscreen", "Copy to asset", "Delete Photo"]

ATT_Q = ("query($id: ID!, $a: ID!) { workStage(id: $id) { id mobileTemplate { copyAttachmentToAsset } "
         "assets { assetId { id name } } attachments { id fileName fileType } } "
         "asset(id: $a) { id attachments { id } } }")
ATT_V = {"id": FIXTURE_ID, "a": ASSET_ID}

PREMISE = ("(() => { const w = data.workStage;\n"
           f"  sessionStorage.removeItem('{K_ID}');   // a killed run's id must never reach the guard\n"
           f"  return w.id === '{FIXTURE_ID}' && w.attachments.length === 0\n"
           "    && w.mobileTemplate.copyAttachmentToAsset === false\n"
           f"    && w.assets.length === 1 && w.assets[0].assetId.id === '{ASSET_ID}'; }})()")
STASH = ("(() => { const at = data.workStage.attachments;\n"
         "  if (at.length !== 1 || !/^image\\//.test(at[0].fileType || '')) return false;\n"
         "  if (data.asset.attachments.some(x => x.id === at[0].id)) return false;   // copied to the asset\n"
         f"  sessionStorage.setItem('{K_ID}', at[0].id);\n"
         "  return true; })()")
GONE = ("(() => { const at = data.workStage.attachments;\n"
        f"  const id = sessionStorage.getItem('{K_ID}');\n"
        "  return !!id && at.length === 0 && !data.asset.attachments.some(x => x.id === id); })()")

ID_OF = ("const idOf = img => ((img && img.getAttribute('src') || '')"
         ".match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;\n")
SLIDE = '[class*="mantine-Carousel-slide"]'
PANEL = (ACTIVE_PANEL_JS +
         f"const slides = [...p.querySelectorAll('{SLIDE}')];\n"
         "const labels = [...p.querySelectorAll('button')].map(b => (b.textContent || '').trim());\n")

# The gallery input, and only it: `accept="image/*"` (AddPhotoOptions) without `capture` (the camera's).
PICK_GALLERY = (
    "document.querySelectorAll('[data-dd-upload]').forEach(n => n.removeAttribute('data-dd-upload'));\n"
    "const hits = [...document.querySelectorAll('input[type=\"file\"]')]\n"
    "  .filter(i => i.getAttribute('accept') === 'image/*' && !i.capture && !i.getAttribute('capture'));\n"
    "if (hits.length !== 1) return false;   // 0 = picker not open, >1 = ambiguous (trap 3)\n"
    "const el = hits[0];\n")

MODAL_WITH = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
              '[.//*[contains(normalize-space(.), "{}")]]')
DELETE_ITEM = ('(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")]'
               '[normalize-space(.)="Delete Photo"])[1]')

steps = work_cache_warm() + [
    go(STAGE_URL, "the attachment work order (20260910-16)"),
    step("wait", "Let the detail view begin rendering", {"value": 2}),
    step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}, timeout=30),
] + server_assert("PREMISE (server): the stage holds NO attachments (so the one after the upload is this "
                  "run's), its template does not copy photos to the asset, and its one asset is ⚡ Tank 0000",
                  K_SERVER, ATT_Q, ATT_V, PREMISE) + [
    step("click", 'Open the "Attachments" tab',
         {"element": xpath_el(STAGE_URL, '//*[@role="tab"][contains(normalize-space(.), "Attachments")]')},
         timeout=30),
    step("wait", "Let the Photos segment render", {"value": 3}),
    jsassert("PHOTOS panel at rest: `Add Photo`, no `Add File`, and no slides",
             PANEL + "return slides.length === 0 && labels.includes('Add Photo') && !labels.includes('Add File');",
             timeout=30),
    step("click", 'Open the picker ("Add Photo")',
         {"element": xpath_el(STAGE_URL, '//button[normalize-space(.)="Add Photo"]')}, timeout=30),
    step("assertPageContains", "The picker opened", {"value": "Select Photo Source"}, timeout=30),
] + upload_steps(
    STAGE_URL, picker=PICK_GALLERY,
    reveal_name='Reveal the ONE gallery input (`accept="image/*"`, no `capture`) — fails closed otherwise',
    upload_name="Upload ONE photo to the work order's Photos",
) + [
    step("assertPageLacks", "The picker closed itself once the file arrived (`onDialogChange`)",
         {"value": "Select Photo Source"}, timeout=30),
    jsassert("⭐ UPLOAD LANDED: exactly one slide, its <img src> the server's `/api/attachment/<id>` URL "
             "(not the `blob:` preview)",
             PANEL + ID_OF + "if (slides.length !== 1) return false;\n"
             "const img = slides[0].querySelector('img');\n"
             "const src = img ? (img.getAttribute('src') || '') : '';\n"
             "return !src.startsWith('blob:') && !!idOf(img);",
             timeout=90),
] + server_assert("⭐ SERVER: the stage holds exactly ONE attachment, an image — this run's (keep its id); "
                  "and ⚡ Tank 0000 does NOT hold it (no copy to the asset)",
                  K_SERVER, ATT_Q, ATT_V, STASH, timeout=60) + [
    jsassert("🛑 GUARD + open the gear: only if the panel shows exactly one slide and its image IS the "
             "attachment the server just named",
             PANEL + ID_OF +
             f"const id = sessionStorage.getItem('{K_ID}');\n"
             "if (!id || slides.length !== 1 || idOf(slides[0].querySelector('img')) !== id) return false;\n"
             "const g = slides[0].querySelector('[aria-label=\"Settings\"]');\n"
             "if (!g) return false;\ng.click();\nreturn true;", timeout=30),
    step("wait", "Let the menu open", {"value": 1}),
    jsassert("MENU (stage photo): exactly " + " · ".join(MENU) + " — in that order",
             "const dds = [...document.querySelectorAll('.mantine-Menu-dropdown')];\n"
             "if (dds.length !== 1) return false;\n"
             "const got = [...dds[0].querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());\n"
             f"return JSON.stringify(got) === JSON.stringify({json.dumps(MENU)});", timeout=30),
    step("click", "Click `Delete Photo` (NEVER `Copy to asset`)",
         {"element": xpath_el(STAGE_URL, DELETE_ITEM)}, timeout=30),
    step("wait", "Let the confirmation open", {"value": 1}),
    step("click", 'Confirm: "Yes"',
         {"element": xpath_el(STAGE_URL, MODAL_WITH.format("Are you sure you want to delete this image?")
                              + '//button[normalize-space(.)="Yes"]')}, timeout=30),
    step("wait", "Wait for REMOVE_ATTACHMENT", {"value": 3}),
] + server_assert("⭐ SERVER: the stage's attachments are back to NONE (its rest set), and ⚡ Tank 0000 never "
                  "held the photo — asked over /graphql",
                  K_SERVER, ATT_Q, ATT_V, GONE, timeout=60) + [
    jsassert("The Photos panel shows no slides again, and `Add Photo`",
             PANEL + "return slides.length === 0 && labels.includes('Add Photo');", timeout=30),
    jsassert("Remove this test's sessionStorage key",
             f"sessionStorage.removeItem('{K_ID}');\nreturn true;", always=True, timeout=15),
]

write(test(
    "MOB.363_Work_Attachment_Upload_Delete",
    "`MOB.363` **Upload one photo to a work order's Attachments tab, prove it, delete THAT photo.**\n"
    f"- On its own Datadog-created work order `{FIXTURE_ID}` (work `20260910-16`, one asset ⚡ Tank 0000,\n"
    "  template copies nothing to the asset).\n"
    "- Premise over `/graphql`: the stage holds NO attachments. After the upload the server holds exactly\n"
    "  one image — this run's id, kept — and the asset does not.\n"
    "- 🛑 **Owner-authorised delete** (trap 2, 2026-09-15): the gear is clicked only in the step that\n"
    "  proves the one slide IS that id; `Delete Photo` → `Yes`.\n"
    "- ⭐ `/graphql`: the stage's attachments back to none. Self-cleaning.",
    steps,
    ["Mobile", "env:dev", "Work Order", "Attachments", "Photos", "self-cleaning"],
))
print("wrote MOB.363 (stage photo upload + delete)")
