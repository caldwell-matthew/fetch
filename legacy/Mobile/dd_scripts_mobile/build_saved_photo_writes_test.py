"""Build MOB.627_Collector_Saved_Photo_Writes - the WRITES on a saved photo, each proved over
`/graphql`: tag add + remove (+ create), `Set as Avatar`, then `Delete Photo` on the photo this run
uploaded. Checklist ▶ #63 · #64 · #65.

WHY THIS EXISTS
  `MOB.623` uploads a photo onto a `DD SYNTHETIC MOBILE` asset and proves the gear menu's item SET,
  but it clicks only `Rotate Image`: `Set as Avatar` writes with no restore, `Delete Photo` is trap 2,
  and `MOB.622`'s tag editor runs on a LOCAL photo (`onTagModify`, a reducer - nothing is sent).
  So on a saved photo `SET_ATTACHMENT_AS_AVATAR`, `ADD_TAG_TO_ATTACHMENT`,
  `REMOVE_TAG_FROM_ATTACHMENT`, `CREATE_TAG` and `REMOVE_ATTACHMENT` had never run. ONE upload
  carries all of them - one test instead of three (owner: Datadog cost).

THE TARGET - AND WHY EVERY WRITE IS SAFE
  The row is `MOB.623`'s: the first collector row whose control carries `DD SYNTHETIC MOBILE`
  (MOB.600 residue, a throwaway record). Its name (`DD SYNTHETIC MOBILE <8 digits>`) is stashed, and
  every server read resolves the asset by that exact name inside a STATIC `assets(params)` query -
  Datadog cannot interpolate an id into a step, and the predicate can read sessionStorage.
  1. PREMISE (server): exactly one asset has that name; its attachment ids are stashed (`BEFORE`).
  2. Upload one photo through the panel's `Add Photo` (MOB.623's recipe); readiness = the last
     slide's `<img src>` stops being the `blob:` preview. The id is read from that src
     (`/api/attachment/<id>`), and ⭐ the SERVER must list it as the ONE attachment not in `BEFORE`.
     From here on "our photo" means exactly that id, and every write is guarded on it.
  🛑 The two guards that open the gear (avatar, delete) check the id IN THE SAME STEP as the click.
  The delete can only hit an attachment that did not exist before this run, on a marker asset -
  `Pump 0102` and every fixture photo are unreachable by construction.

TAGS (`ui/PhotoCarousel/Tags/index.tsx`) - the saved-photo branch: `onTagModify` is undefined here
  (`Attachments` passes none), so `handleTagAssign`/`handleTagRemove` send the mutations.
  - ADD an EXISTING org tag, `Test Tag` (a plain tag: a `_LENS_` id would queue the photo for
    MentorLens processing, `attachment/resolver/tag.ts`). Picked from the `Search tags...` combobox.
  - REMOVE it with the pill's remove button. Both are fire-and-forget + `cache.modify`, so the pill
    proves nothing (trap 6) - each is proved by the attachment's `tags` over `/graphql`.
  - CREATE (`+ Create Tag '<name>'`): 🛑 PERMANENT ORG-WIDE RESIDUE - mobile cannot delete a tag. At
    most one per run, named `DD SYNTHETIC MOBILE <RUNID>`. Proved by the org's tag list.
    ⚠️ SUSPECTED APP DEFECT, SENTINELLED: `handleTagCreate` calls `handleTagAssign(attachmentId,
    tagId)`, which looks the new id up in `tagOptions` - the array from the CURRENT render, taken
    before `updateQuery` merged the new tag - so it returns early and the new tag is never sent to
    the photo. An `optional` server sentinel records whether the created tag reached the photo,
    without owning the verdict.

`SET AS AVATAR` (`graphql/updateRecord.ts:31-75`) - `cache.modify` first, then a non-awaited mutate,
  and the `Avatar set` toast fires before the request (trap 7). Proved by `asset.avatar.id` equal to
  our photo's id. No restore exists - see the delete.

`DELETE PHOTO` (`DetailPage/PhotoAttachments.tsx:80-107`) - gear -> `Delete Photo` -> `Yes`;
  `REMOVE_ATTACHMENT` is awaited before the cache drops the slide. Proved on the server: our id is
  gone and the asset's attachment set is EXACTLY `BEFORE` again (nothing else touched).
  ⭐ AVATAR, THEN DELETE - the order is deliberate. `attachment/delete/index.ts` (`destroy`) first
  runs `UPDATE asset SET avatar = NULL WHERE id = parent AND avatar = attachmentId`, so deleting the
  avatar photo leaves the asset with NO avatar, not a dangling one. A `soft` server step measures
  that on every run. Measured at build time (2026-09-15) the marker asset had `avatar = null`, so the
  test ends with the asset's avatar where it began.
  ⚠️ `setAttachmentAsAvatar` also runs `deleteAvatar`, which deletes the PREVIOUS avatar's attachment
  record when nothing else references it. On a throwaway asset whose avatar is null, nothing.

RESIDUE: one org tag per run (`DD SYNTHETIC MOBILE <RUNID>`). The photo, its tags and the avatar
  are removed by the test itself; a run that dies part-way leaves its photo (and maybe the avatar)
  on the throwaway asset - the premise does not care, and the next run's delete clears the avatar.

⚠️ TRAP 3 - scoped to THE item and its LAST slide throughout (MOB.623's constants, copied: sharing
  them would rewrite MOB.623's JSON). The tag modal is found by its heading.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert, server_assert,  # noqa: E402
                      upload_steps, localvar)

COLLECTOR_URL = BASE + "/asset-collector"
MARKER = "DD SYNTHETIC MOBILE"
TAG = "Test Tag"                 # an existing, non-MentorLens org tag (id 8o8F9JxBNAlItJ0JcIoA0s)
CREATE_TAG_LEG = True            # False drops the CREATE_TAG leg and its per-run org tag
K_NAME, K_BEFORE, K_ATT, K_NEWTAG = "__dd627_name", "__dd627_before", "__dd627_att", "__dd627_newtag"
KEYS = [K_NAME, K_BEFORE, K_ATT, K_NEWTAG]


def tok(cls):
    return f'contains(concat(" ", normalize-space(@class), " "), " {cls} ")'


# ---- MOB.623's locators (copied) -------------------------------------------------------------
ITEM = (f'(//*[{tok("mantine-Accordion-item")}]'
        f'[.//*[{tok("mantine-Accordion-control")}][contains(., "{MARKER}")]])[1]')
CHEVRON = f'{ITEM}//*[{tok("mantine-Accordion-chevron")}]'
ADD_PHOTO = f'{ITEM}//button[normalize-space(.)="Add Photo"]'


def tab(title):
    return f'{ITEM}//*[@role="tab"][normalize-space(.)="{title}"]'


def menu_item(label):
    return f'(//*[{tok("mantine-Menu-item")}][normalize-space(.)="{label}"])[1]'


def modal_with(text):
    return f'//*[{tok("mantine-Modal-content")}][.//*[contains(normalize-space(.), "{text}")]]'


ITEM_JS = (
    "const items = [...document.querySelectorAll('.mantine-Accordion-item')];\n"
    "const it = items.find(i => {\n"
    "  const c = i.querySelector('.mantine-Accordion-control');\n"
    f"  return c && (c.textContent || '').includes('{MARKER}');\n"
    "});\n"
    "if (!it) return false;\n")
SLIDE = '[class*="mantine-Carousel-slide"]'
LAST_SLIDE = (f"const slides = it.querySelectorAll('{SLIDE}');\n"
              "const last = slides[slides.length - 1];\n"
              "if (!last) return false;\n")
PICK_FRESH_GALLERY = (
    "document.querySelectorAll('[data-dd-upload]')\n"
    "  .forEach(n => n.removeAttribute('data-dd-upload'));\n"
    "const inputs = [...document.querySelectorAll('input[type=\"file\"]')];\n"
    "const el = inputs.find(i => !i.capture);\n")
# id of an attachment from its image URL: `/api/attachment/<id>?…` (MOB.302's reading)
ID_OF = ("const idOf = img => ((img && img.getAttribute('src') || '')"
         ".match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;\n")
STASH = (f"const att = sessionStorage.getItem('{K_ATT}');\n"
         f"let before = null; try {{ before = JSON.parse(sessionStorage.getItem('{K_BEFORE}') || 'null'); }} catch (e) {{ before = null; }}\n"
         "if (!att || !Array.isArray(before) || before.includes(att)) return false;\n")

TAG_MODAL = modal_with("Edit Attachment Tags")
SEARCH = f'{TAG_MODAL}//input[@placeholder="Search tags..."]'
PILL = f'{TAG_MODAL}//*[{tok("mantine-Pill-root")}][normalize-space(.)="{TAG}"]'

# ---- the server read ---------------------------------------------------------------------------
# STATIC: every marker asset with its avatar and attachments (4 assets, ~1KB measured). The
# predicate picks the one whose name is the stashed row name - and demands exactly one.
ASSETS_Q = ("query($p: TableQuery) { assets(params: $p) { edges { id name avatar { id } "
            "attachments { id fileName fileType tags { id name } } } } }")
ASSETS_V = {"p": {"limit": 50, "query": {"connector": "AND", "conditions": [
    {"column": "name", "operator": "CONTAINS", "value": MARKER}]}}}
TAGS_Q = "query($p: TableQuery) { tags(params: $p) { edges { id name } } }"
TAGS_V = {"p": {"limit": 50, "query": {"connector": "AND", "conditions": [
    {"column": "name", "operator": "CONTAINS", "value": MARKER}]}}}


def on_asset(body):
    """A predicate over OUR asset: binds `a` (the one asset named as stashed), `ids`, `before`,
    `att` and `mine` (our attachment, or undefined), then evaluates `body`."""
    return ("(() => {\n"
            f"  const name = sessionStorage.getItem('{K_NAME}');\n"
            "  const hits = ((data.assets || {}).edges || []).filter(x => x.name === name);\n"
            "  if (!name || hits.length !== 1) return false;\n"
            "  const a = hits[0], atts = a.attachments || [], ids = atts.map(x => x.id);\n"
            f"  const att = sessionStorage.getItem('{K_ATT}');\n"
            f"  let before = null; try {{ before = JSON.parse(sessionStorage.getItem('{K_BEFORE}') || 'null'); }} catch (e) {{ before = null; }}\n"
            "  if (!att || !Array.isArray(before) || before.includes(att)) return false;\n"
            "  const mine = atts.find(x => x.id === att);\n"
            f"  return !!({body});\n"
            "})()")


def open_gear_guarded(name):
    """🛑 The guard and the gear click share one step: the LAST slide must BE our photo."""
    return jsassert(name,
                    ITEM_JS + LAST_SLIDE + ID_OF + STASH +
                    "const img = last.querySelector('img');\n"
                    "if (idOf(img) !== att) return false;\n"
                    "const g = last.querySelector('[aria-label=\"Settings\"]');\n"
                    "if (!g) return false;\n"
                    "g.click();\n"
                    "return true;", timeout=30)


steps = [
    go(COLLECTOR_URL, "the asset collector"),
    step("wait", "Wait for the collector to load its lookup cache", {"value": 15}),
    step("assertElementPresent", "The collector page rendered",
         {"element": xpath_el(COLLECTOR_URL, '//*[@id="page-title"]//h4')}, timeout=30),
    step("assertElementPresent",
         f'FIXTURE GUARD: a "{MARKER}" asset is in the collected list (MOB.600 residue)',
         {"element": xpath_el(COLLECTOR_URL, ITEM)}, timeout=60, soft=True),
    jsassert(f"Stash the row's asset name (`{MARKER} <8 digits>`) — every server read resolves the "
             "asset by it",
             ITEM_JS +
             "const c = it.querySelector('.mantine-Accordion-control');\n"
             f"const m = (c.textContent || '').match(/{MARKER} \\d{{8}}/);\n"
             "if (!m) return false;\n"
             f"sessionStorage.setItem('{K_NAME}', m[0]);\n"
             "return true;", timeout=30),
]
steps += server_assert(
    "PREMISE (server): exactly ONE asset carries that name — stash its attachment ids (BEFORE)",
    "__dd627_srv_premise", ASSETS_Q, ASSETS_V,
    "(() => {\n"
    f"  const name = sessionStorage.getItem('{K_NAME}');\n"
    "  const hits = ((data.assets || {}).edges || []).filter(x => x.name === name);\n"
    "  if (!name || hits.length !== 1) return false;\n"
    f"  sessionStorage.setItem('{K_BEFORE}', JSON.stringify((hits[0].attachments || []).map(x => x.id)));\n"
    "  return true;\n"
    "})()")
steps += [
    step("click", "Expand that row by its chevron",
         {"element": xpath_el(COLLECTOR_URL, CHEVRON)}, timeout=30),
    step("wait", "Let the detail panel mount", {"value": 3}),
    step("click", 'Switch to the "Photos" tab', {"element": xpath_el(COLLECTOR_URL, tab("Photos"))},
         timeout=30),
    step("wait", "Let the Photos panel mount", {"value": 3}),
    step("assertElementPresent", 'The "Photos" tab is active',
         {"element": xpath_el(COLLECTOR_URL, tab("Photos") + "[@data-active]")}, timeout=30),
    step("click", 'Open the picker ("Add Photo")', {"element": xpath_el(COLLECTOR_URL, ADD_PHOTO)},
         timeout=30),
    step("assertPageContains", "The picker opened", {"value": "Select Photo Source"}, timeout=30),
] + upload_steps(
    COLLECTOR_URL, picker=PICK_FRESH_GALLERY,
    reveal_name="Reveal the hidden gallery input (clearing any stale tag)",
    upload_name="Upload ONE photo onto the marker asset",
) + [
    step("assertPageLacks", "The picker closed itself once the file arrived",
         {"value": "Select Photo Source"}, timeout=30),
    jsassert("UPLOAD LANDED: the last slide's <img src> is a server `/api/attachment/<id>` URL — "
             "stash that attachment id",
             ITEM_JS + LAST_SLIDE + ID_OF +
             "const id = idOf(last.querySelector('img'));\n"
             "if (!id) return false;\n"
             f"sessionStorage.setItem('{K_ATT}', id);\n"
             "return true;", timeout=90),
]
steps += server_assert(
    "⭐ SERVER: that id is the ONE new attachment on the asset (not in BEFORE, BEFORE intact), an "
    "image, untagged",
    "__dd627_srv_upload", ASSETS_Q, ASSETS_V,
    on_asset("mine && /^image\\//.test(mine.fileType || '') && (mine.tags || []).length === 0"
             " && ids.length === before.length + 1 && before.every(b => ids.includes(b))"),
    timeout=60)

# ---- TAGS: add an existing tag, remove it, create one ------------------------------------------
steps += [
    jsassert("Open the tag editor from OUR slide's `Edit Tags (0)` badge",
             ITEM_JS + LAST_SLIDE + ID_OF + STASH +
             "if (idOf(last.querySelector('img')) !== att) return false;\n"
             "const b = [...last.querySelectorAll('*')]\n"
             "  .filter(n => n.children.length === 0 && /^Edit Tags \\(0\\)$/.test((n.textContent || '').trim()));\n"
             "if (b.length !== 1) return false;\n"
             "b[0].click();\n"
             "return true;", timeout=30),
    step("assertElementPresent", "The tag editor opened once GET_TAGS_TABLE resolved (`Search tags...`)",
         {"element": xpath_el(COLLECTOR_URL, SEARCH)}, timeout=30),
    step("click", "Focus `Search tags...` (opens the combobox)",
         {"element": xpath_el(COLLECTOR_URL, SEARCH)}, timeout=30),
    step("typeText", f'Type "{TAG}"', {"value": TAG, "element": xpath_el(COLLECTOR_URL, SEARCH)}),
    step("click", f'Pick the existing tag "{TAG}"',
         {"element": xpath_el(COLLECTOR_URL, f'//*[@role="option"][normalize-space(.)="{TAG}"]')},
         timeout=30),
    step("assertElementPresent", f'The "{TAG}" pill rendered (client echo only — trap 6)',
         {"element": xpath_el(COLLECTOR_URL, PILL)}, timeout=30),
]
steps += server_assert(
    f"⭐ SERVER (ADD_TAG_TO_ATTACHMENT): our photo carries \"{TAG}\"",
    "__dd627_srv_tagadd", ASSETS_Q, ASSETS_V,
    on_asset(f"mine && (mine.tags || []).some(t => t.name === '{TAG}')"), timeout=45)
steps += [
    step("click", f'Remove the "{TAG}" pill (its remove button)',
         {"element": xpath_el(COLLECTOR_URL, f'{PILL}//*[{tok("mantine-Pill-remove")}]')}, timeout=30),
]
steps += server_assert(
    f"⭐ SERVER (REMOVE_TAG_FROM_ATTACHMENT): our photo no longer carries \"{TAG}\"",
    "__dd627_srv_tagremove", ASSETS_Q, ASSETS_V,
    on_asset(f"mine && !(mine.tags || []).some(t => t.name === '{TAG}')"), timeout=45)
steps += [
    jsassert(f'…and the editor agrees: no "{TAG}" pill, the search box still there',
             "const m = [...document.querySelectorAll('.mantine-Modal-content')]\n"
             "  .find(x => (x.textContent || '').includes('Edit Attachment Tags'));\n"
             "if (!m || !m.querySelector('input[placeholder=\"Search tags...\"]')) return false;\n"
             "return ![...m.querySelectorAll('.mantine-Pill-root')]\n"
             f"  .some(p => (p.textContent || '').trim() === '{TAG}');", timeout=30),
]

if CREATE_TAG_LEG:
    steps += [
        step("click", "Focus `Search tags...` again (focus resets the search)",
             {"element": xpath_el(COLLECTOR_URL, SEARCH)}, timeout=30),
        step("typeText", f"Type a NEW tag name `{MARKER} <RUNID>`",
             {"value": f"{MARKER} {{{{ RUNID }}}}", "element": xpath_el(COLLECTOR_URL, SEARCH)}),
        # Datadog does not expand {{ }} inside JS, so the name is read back off the input itself.
        # 🛑 The click is in this step: the option's text is composed (`+ Create Tag '${search}'`),
        # so an XPath literal would not exist in the source (check_literals), and the guard that the
        # option offers exactly the typed marker name belongs with the click that creates it.
        jsassert("🛑 Stash the typed name (marker + 8 digits) and click the ONE `+ Create Tag` option "
                 "offering exactly it — a PERMANENT org tag (mobile cannot delete one)",
                 "const i = document.querySelector('input[placeholder=\"Search tags...\"]');\n"
                 "const v = i ? i.value : '';\n"
                 f"if (!/^{MARKER} \\d{{8}}$/.test(v)) return false;\n"
                 "const o = [...document.querySelectorAll('[role=\"option\"]')]\n"
                 "  .filter(x => (x.textContent || '').trim() === `+ Create Tag '${v}'`);\n"
                 "if (o.length !== 1) return false;\n"
                 f"sessionStorage.setItem('{K_NEWTAG}', v);\n"
                 "o[0].click();\n"
                 "return true;", timeout=30),
    ]
    steps += server_assert(
        "⭐ SERVER (CREATE_TAG): the org holds exactly ONE tag with the typed name",
        "__dd627_srv_tagcreate", TAGS_Q, TAGS_V,
        "(() => {\n"
        f"  const n = sessionStorage.getItem('{K_NEWTAG}');\n"
        "  return !!n && ((data.tags || {}).edges || []).filter(t => t.name === n).length === 1;\n"
        "})()", timeout=45)
    # optional SENTINEL - see the header: `handleTagAssign` reads the pre-create `tagOptions`.
    # `server_assert` has no `optional`, so the read step's flags are set to optional's here.
    steps += [step("wait", "Give a create→assign chain time to reach the server", {"value": 5})]
    sentinel = server_assert(
        "SENTINEL (optional): the CREATED tag reached our photo — red = `handleTagCreate` never sent "
        "ADD_TAG_TO_ATTACHMENT (stale `tagOptions`)",
        "__dd627_srv_createassign", ASSETS_Q, ASSETS_V,
        on_asset(f"mine && (mine.tags || []).some(t => t.name === sessionStorage.getItem('{K_NEWTAG}'))"),
        timeout=20)
    sentinel[0]["allowFailure"], sentinel[0]["isCritical"] = True, False
    steps += sentinel

steps += [
    step("click", "Close the tag editor (`Done`)",
         {"element": xpath_el(COLLECTOR_URL, f'{TAG_MODAL}//button[normalize-space(.)="Done"]')},
         timeout=30),
    jsassert("The tag editor closed; our slide is still there",
             ITEM_JS + LAST_SLIDE + ID_OF + STASH +
             "return !document.querySelector('input[placeholder=\"Search tags...\"]')\n"
             "  && idOf(last.querySelector('img')) === att;", timeout=30),
]

# ---- SET AS AVATAR ---------------------------------------------------------------------------------
steps += [
    open_gear_guarded("🛑 GUARD + open the gear: only if the last slide IS our photo (the one new id)"),
    step("wait", "Let the menu dropdown render", {"value": 2}),
    step("click", 'Click "Set as Avatar" (no restore — our own upload on a marker asset)',
         {"element": xpath_el(COLLECTOR_URL, menu_item("Set as Avatar"))}, timeout=30),
]
steps += server_assert(
    "⭐ SERVER (SET_ATTACHMENT_AS_AVATAR): the asset's avatar IS our photo",
    "__dd627_srv_avatar", ASSETS_Q, ASSETS_V,
    on_asset("mine && a.avatar && a.avatar.id === att"), timeout=60)

# ---- DELETE PHOTO ----------------------------------------------------------------------------------
steps += [
    open_gear_guarded("🛑 GUARD + open the gear: only if the last slide IS our photo — the delete "
                      "can hit nothing that existed before this run"),
    step("wait", "Let the menu dropdown render", {"value": 2}),
    step("click", 'Click "Delete Photo"',
         {"element": xpath_el(COLLECTOR_URL, menu_item("Delete Photo"))}, timeout=30),
    step("click", 'Confirm: "Yes"',
         {"element": xpath_el(COLLECTOR_URL, f'{modal_with("Are you sure you want to delete this image?")}'
                                             '//button[normalize-space(.)="Yes"]')}, timeout=30),
]
steps += server_assert(
    "⭐ SERVER (REMOVE_ATTACHMENT): our photo is gone and the attachment set is EXACTLY BEFORE",
    "__dd627_srv_deleted", ASSETS_Q, ASSETS_V,
    on_asset("!mine && ids.length === before.length && before.every(b => ids.includes(b))"),
    timeout=60)
steps += server_assert(
    "⭐ SERVER: deleting the avatar photo CLEARED the avatar — no dangling avatar id",
    "__dd627_srv_avatarcleared", ASSETS_Q, ASSETS_V,
    on_asset("!mine && !a.avatar"), soft=True, timeout=30)
steps += [
    jsassert("…and the carousel agrees: as many slides as BEFORE, none of them ours (soft: UI echo)",
             ITEM_JS + ID_OF + STASH +
             f"const slides = [...it.querySelectorAll('{SLIDE}')];\n"
             "return slides.length === before.length\n"
             "  && !slides.some(s => idOf(s.querySelector('img')) === att);", soft=True, timeout=30),
]

# ---- leave it as found -----------------------------------------------------------------------------
steps += [
    jsassert("CLEANUP: close a tag editor left open by a failed step (no-op otherwise)",
             "const m = [...document.querySelectorAll('.mantine-Modal-content')]\n"
             "  .find(x => (x.textContent || '').includes('Edit Attachment Tags'));\n"
             "const d = m && [...m.querySelectorAll('button')].find(b => (b.textContent || '').trim() === 'Done');\n"
             "if (d) d.click();\n"
             "return true;", always=True, timeout=15),
    jsassert("CLEANUP: remove this test's sessionStorage keys",
             f"{KEYS!r}.forEach(k => sessionStorage.removeItem(k));\n"
             f"return {KEYS!r}.every(k => !sessionStorage.getItem(k));", always=True, timeout=15),
    step("click", "Collapse the row again", {"element": xpath_el(COLLECTOR_URL, CHEVRON)},
         always=True, timeout=30),
    step("wait", "Let the panel close", {"value": 2}, always=True),
    jsassert("RESTORED: the row reports itself collapsed",
             ITEM_JS +
             "const c = it.querySelector('.mantine-Accordion-control');\n"
             "return !!c && c.getAttribute('aria-expanded') === 'false';", always=True, timeout=30),
]

write(test(
    "MOB.627_Collector_Saved_Photo_Writes",
    "`MOB.627` **The writes on a SAVED photo, each proved over `/graphql`: tags, `Set as Avatar`, "
    "`Delete Photo`.**\n"
    "- Uploads ONE photo onto the newest `DD SYNTHETIC MOBILE` asset (`MOB.623`'s recipe); the server\n"
    "  must list its id as the one attachment that was not there before. Every later write is guarded\n"
    "  on that id, the gear guards in the same step as the click.\n"
    f"- ⭐ Tags: add the existing `{TAG}`, remove it — each read back from the attachment's `tags`.\n"
    "  Create `DD SYNTHETIC MOBILE <RUNID>` — 🛑 **one permanent org tag per run**; an `optional`\n"
    "  sentinel records whether it reached the photo (suspected: `handleTagCreate` → stale `tagOptions`).\n"
    "- ⭐ `Set as Avatar`: `asset.avatar.id` is the photo's id.\n"
    "- ⭐ `Delete Photo` (owner-authorised 2026-09-15, own upload only): the id is gone and the set is\n"
    "  exactly as before; `soft`: the avatar is cleared with it (`destroy` nulls it).\n"
    "- Residue: the created tag. Row collapsed and sessionStorage keys removed on the way out.",
    steps,
    tags=["Mobile", "env:dev", "Asset Collector", "Photos", "residue"],
    local_vars=[localvar("RUNID", "{{ numeric(8) }}", "12345678")],
))
print("wrote MOB.627 (saved-photo writes: tags, avatar, delete)")
