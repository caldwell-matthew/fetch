"""Build MOB.866_MaterialLookup_Item_Attachment_Delete - upload a photo and a document to the storeroom
item through the item modal's `Photos` / `Docs` segments, prove each on the server, then delete each
again through the app, and prove the item is back at rest.

WHY THIS EXISTS
  `MOB.865` pins the modal's segments and which buttons each half offers, and clicks nothing: "an
  upload here lands for real". So the editable half of `StockAdjustments.tsx` - `PhotoAttachments`
  and `FileAttachments` on the storeroom item, with `removeAttachmentsFromCache` as the delete
  callback - had never written anything under a test.

⚠️ THE MODEL IS `StoreroomItem`, NOT `MaterialItem` (read on origin/development@4da480a68f)
  The Photos / Docs segments each show `Storeroom Item` (editable: `modelType="StoreroomItem"`,
  `parentId` = the storeroom item) above `Material Item (read only)` (`ReadOnlyAttachments`). Every
  write here goes to the STOREROOM item. The material item is read before and after and must not
  change.

FIXTURE, READ OVER THE API FIRST (2026-09-15, 0 runs)
  `Central Storeroom` (`sUAkckBIpothA9sEYNtVw8`) · `000-000-000 Adamantium`:
    storeroom item `4lZMQZsNNdJ95hoYhd4gYt` - 0 attachments, no avatar
    material item  `pJodNZlMY8Aw08g9hZE8NE` - 0 attachments, no avatar
  That empty rest state is what `MOB.865` reads (`No photos` / `No documents`, no row image button).

WHAT PROVES THE WRITE (traps 6, 8, 18)
  `addPhotos` / `addFiles` start `CREATE_PENDING_ATTACHMENTS` and call `onPhotosAdded` /
  `onFilesAdded` -> `refetchAttachments()` only when it resolves. So a new slide or table row
  means the server answered. But it is still the client's view, so each write is proved over
  `/graphql` (`dd_tools.server_assert`, the same `attachments(modelType, params)` query the modal
  uses):
      premise   the storeroom item holds 0 attachments; the material item's count is recorded
      photo     exactly 1 - named as uploaded, `image/*` - and the material item unchanged
      gone      0 again
      document  exactly 1 - named as uploaded, `application/pdf`
      gone      0 again, and the material item still at its recorded count
  The delete has the same shape. `deleteAttachmentById` / `deleteFiles` await `REMOVE_ATTACHMENT`
  and only then call `removeAttachmentsFromCache`, so the UI shrinking is the server's answer.
  It is still re-read over `/graphql`. `destroy` (server `attachment/delete/index.ts`) deletes the
  row and the S3 file when this parent holds the only reference - an upload made here has exactly
  one - and clears the storeroom item's avatar first if it was this attachment.

🛑 THE DELETES ARE OWNER-AUTHORISED (2026-09-15) FOR THIS TEST'S OWN UPLOADS ONLY (trap 2)
  No step can delete an attachment this run did not create:
    - The premise (0 attachments, server) sets `__dd866_empty`. Without it, neither picker
      reveals its input, so nothing uploads. No stashed id means both delete guards refuse.
    - After each upload a server read (`always`, a read) stashes the ONE attachment's id - only if
      the premise held, only if it is the only attachment, and only if its name and type are
      the upload's.
    - The destructive click itself (`Yes` in the confirmation / `Delete File(s)`) is made from a
      JS step that re-checks everything IMMEDIATELY before clicking. The Storeroom Item section
      holds exactly ONE slide/row, and it carries the stashed id: the slide's `<img src>` is
      `/api/attachment/<id>?…`, the row's link is `/api/attachment/<id>`.
    The delete legs are `always`, so a run that uploaded and then failed still removes its own
    upload and `MOB.865`'s rest state survives. The guards make `always` safe.
  🛑 `Set as Avatar` is never clicked (it writes an avatar `MOB.865`'s XOR would see).

📄 THE DOCUMENT LEG (trap 12)
  The Docs tab drops images client-side (`AttachmentTable.addFiles`, `MOB.741`), so a document
  upload needs a non-image file in Datadog's upload storage: `dd_tools.RECORDED_PDF`, the one PDF
  the owner recorded in the Datadog UI (`MOB.PDF_Upload_Recording`, never delete), with its entry
  renamed `DD SYNTHETIC MOBILE 866.pdf` - the name the server read expects. `local_run.py`
  supplies a one-page PDF of that name.

LOCATORS
  Everything is scoped to THE item modal - the `.mantine-Modal-content` holding the
  SegmentedControl, because the photo picker and the delete confirmation are modals of their
  own - and inside it to the `Storeroom Item` section: the siblings between its heading and
  `Material Item (read only)` (trap 3; `MOB.865`'s split). Segments are switched by radio VALUE,
  never by label (bugs §22).
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, HERE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      server_assert, upload_steps, RECORDED_PDF)

NAME = "MOB.866_MaterialLookup_Item_Attachment_Delete"
MATERIAL_URL = BASE + "/material-lookup"
STOREROOM = "Central Storeroom"
ITEM = "000-000-000 Adamantium"
ITEM_SEARCH = "Adamantium"
STOREROOM_ITEM_ID = "4lZMQZsNNdJ95hoYhd4gYt"
MATERIAL_ITEM_ID = "pJodNZlMY8Aw08g9hZE8NE"
DOC_NAME = "DD SYNTHETIC MOBILE 866.pdf"
MENU = ["View in Fullscreen", "Set as Avatar", "Rotate Image", "Delete Photo"]
CONFIRM = "Are you sure you want to delete this image?"

K_EMPTY, K_MAT, K_PHOTO, K_DOC = "__dd866_empty", "__dd866_mat", "__dd866_photo", "__dd866_doc"
K_SERVER = "__dd866_server"
KEYS = [K_EMPTY, K_MAT, K_PHOTO, K_DOC]

# The photo's file name is MOB.600's recipe's (with its U+202F before `PM`) - the step is copied.
_src = json.load(open(os.path.join(HERE, "MOB.600_Collector_Create_Asset.json")))["details"]["steps"]
_up = next(s for s in _src if s["type"] == "uploadFiles")
PHOTO_NAME = _up["params"]["files"][0]["name"]
PNG_KEY = _up["params"]["files"][0]["bucketKey"]

# 🛑 Trap 12: the uploads are MOB.600's PNG and the recorded PDF. A step holding any other bucketKey was
# recorded by hand - never regenerate over it.
_existing = os.path.join(HERE, NAME + ".json")
if os.path.exists(_existing):
    for _s in json.load(open(_existing))["details"]["steps"]:
        if _s["type"] == "uploadFiles" and any(f.get("bucketKey") not in (PNG_KEY, RECORDED_PDF["bucketKey"])
                                               for f in _s["params"]["files"]):
            raise SystemExit(f"{NAME} holds a hand-recorded uploadFiles step (neither MOB.600's PNG nor the"
                             " recorded PDF) - refusing to overwrite it (trap 12). Edit the JSON, not this builder.")

PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Material Lookup")]'
SEARCH = '//input[@placeholder="Search for material items by name"]'
STOREROOM_SELECT = '//*[@id="storeroomLocationId"]'
ROW = f'//tr[contains(normalize-space(.), "{ITEM}")]'
ROW_ACTION = (ROW + '//button[.//*[@data-icon="arrow-up-right-from-square"'
              ' or contains(concat(" ", normalize-space(@class), " "),'
              ' " fa-arrow-up-right-from-square ")]]')


def tok(cls):
    return f'contains(concat(" ", normalize-space(@class), " "), " {cls} ")'


ITEM_MODAL = f'//*[{tok("mantine-Modal-content")}][.//*[{tok("mantine-SegmentedControl-root")}]]'
ADD_PHOTO = f'{ITEM_MODAL}//button[normalize-space(.)="Add Photo"]'
DELETE_PHOTO = f'(//*[{tok("mantine-Menu-item")}][normalize-space(.)="Delete Photo"])[1]'


def option(text):
    return f'//*[@role="option"][contains(normalize-space(.), "{text}")]'


J = json.dumps  # JS string literals (keeps the U+202F as an escape)

# THE item modal: the one holding the SegmentedControl (the picker and the confirmation are modals too).
MODAL_JS = ("const m = [...document.querySelectorAll('.mantine-Modal-content')]\n"
            "  .find(x => !!x.querySelector('[class*=\"mantine-SegmentedControl-root\"]'));\n"
            "if (!m) return false;\n")
# The `Storeroom Item` section: the siblings between its heading and `Material Item (read only)`.
SECTION_JS = (MODAL_JS +
              "const leaves = [...m.querySelectorAll('p, div, span')].filter(e => e.children.length === 0);\n"
              "const store = leaves.find(e => (e.textContent || '').trim() === 'Storeroom Item');\n"
              "const ro = leaves.find(e => (e.textContent || '').trim() === 'Material Item (read only)');\n"
              "if (!store || !ro || store.parentElement !== ro.parentElement) return false;\n"
              "const sec = [];\n"
              "let cur = store.nextElementSibling;\n"
              "while (cur && cur !== ro) { sec.push(cur); cur = cur.nextElementSibling; }\n"
              "if (cur !== ro) return false;\n"
              "const within = sel => sec.flatMap(e => (e.matches(sel) ? [e] : []).concat([...e.querySelectorAll(sel)]));\n"
              "const btns = within('button').map(b => (b.textContent || '').trim());\n")

GUARD_PHOTO_JS = (SECTION_JS +
                  f"const id = sessionStorage.getItem('{K_PHOTO}');\n"
                  f"if (sessionStorage.getItem('{K_EMPTY}') !== '1' || !id) return false;\n"
                  "const slides = within('.mantine-Carousel-slide');\n"
                  "if (slides.length !== 1) return false;\n"
                  "const img = slides[0].querySelector('img');\n"
                  f"if (!img || img.getAttribute('alt') !== {J(PHOTO_NAME)}) return false;\n"
                  "if (!(img.getAttribute('src') || '').includes('/api/attachment/' + id + '?')) return false;\n")

GUARD_DOC_JS = (SECTION_JS +
                f"const id = sessionStorage.getItem('{K_DOC}');\n"
                f"if (sessionStorage.getItem('{K_EMPTY}') !== '1' || !id) return false;\n"
                "const rows = within('tbody tr');\n"
                "if (rows.length !== 1) return false;\n"
                "const a = rows[0].querySelector('a[href]');\n"
                "if (!a || a.getAttribute('href') !== '/api/attachment/' + id) return false;\n"
                f"if ((a.textContent || '').trim() !== {J(DOC_NAME)}) return false;\n"
                "const box = rows[0].querySelector('input[type=\"checkbox\"]');\n"
                "if (!box) return false;\n")

# ---- the server read: the storeroom item's attachments and the material item's, in one query
ATT_Q = """query MOB866_ATTACHMENTS($s: ChildTableQuery!, $m: ChildTableQuery!) {
  s: attachments(modelType: StoreroomItem, params: $s) { edges { id fileName fileType } }
  m: attachments(modelType: MaterialItem, params: $m) { edges { id } } }"""
ATT_V = {"s": {"parentId": STOREROOM_ITEM_ID, "limit": 100}, "m": {"parentId": MATERIAL_ITEM_ID, "limit": 100}}

PREMISE_P = ("(() => { const ok = data.s.edges.length === 0;\n"
             f"  if (ok) {{ sessionStorage.setItem('{K_EMPTY}', '1'); sessionStorage.setItem('{K_MAT}', String(data.m.edges.length)); }}\n"
             "  return ok; })()")


def landed_p(key, file_name, type_test):
    return ("(() => {\n"
            f"  const mat = sessionStorage.getItem('{K_MAT}');\n"
            f"  if (sessionStorage.getItem('{K_EMPTY}') !== '1' || mat === null) return false;\n"
            "  const e = data.s.edges;\n"
            f"  if (e.length !== 1 || e[0].fileName !== {J(file_name)} || !({type_test}).test(e[0].fileType || '')) return false;\n"
            "  if (data.m.edges.length !== Number(mat)) return false;\n"
            f"  sessionStorage.setItem('{key}', e[0].id);\n"
            "  return true; })()")


def gone_p(key):
    return (f"(() => {{ const id = sessionStorage.getItem('{key}'); const mat = sessionStorage.getItem('{K_MAT}');\n"
            "  return !!id && mat !== null && data.s.edges.length === 0 && data.m.edges.length === Number(mat); })()")


REST_P = (f"(() => {{ const mat = sessionStorage.getItem('{K_MAT}');\n"
          "  return mat !== null && data.s.edges.length === 0 && data.m.edges.length === Number(mat); })()")


def switch_segment(value, label):
    return [
        jsassert(f'Switch to the "{label}" segment by VALUE ({value}) — never by text (§22)',
                 MODAL_JS +
                 "const root = m.querySelector('[class*=\"mantine-SegmentedControl-root\"]');\n"
                 f"const el = root.querySelector('input[type=\"radio\"][value=\"{value}\"]');\n"
                 "if (!el) return false;\n"
                 "el.click();\n"
                 "return true;", timeout=30),
        step("wait", f"Let the {label} panel mount (its attachment queries fire now)", {"value": 4}),
        jsassert(f'The "{label}" segment is the CHECKED one',
                 MODAL_JS +
                 "const on = m.querySelector('[class*=\"mantine-SegmentedControl-root\"] input[type=\"radio\"]:checked');\n"
                 f"return !!on && on.value === '{value}';", timeout=30),
    ]


def photos_at_rest(name):
    return jsassert(name, SECTION_JS +
                    "return within('.mantine-Carousel-slide').length === 0\n"
                    "  && btns.includes('Add Photo') && !btns.includes('Add File');", timeout=30)


def docs_at_rest(name):
    return jsassert(name, SECTION_JS +
                    "return within('tbody tr').length === 0\n"
                    "  && btns.includes('Add File') && !btns.includes('Add Photo');", timeout=30)


steps = [
    go(MATERIAL_URL, "material lookup"),
    step("wait", "Wait for the page to mount", {"value": 6}),
    jsassert("Clear this test's sessionStorage keys from any earlier run in this session",
             "".join(f"sessionStorage.removeItem('{k}');\n" for k in KEYS) + "return true;", timeout=15),
    step("assertElementContent", 'Test the "Material Lookup" page rendered',
         {"check": "contains", "value": "Material Lookup",
          "element": xpath_el(MATERIAL_URL, PAGE_TITLE)}, timeout=30),
]
steps += server_assert(
    f"🛑 PREMISE (server): the storeroom item holds NO attachment — so any found later is this run's; "
    "stashes the premise flag and the MaterialItem edges count", K_SERVER, ATT_Q, ATT_V, PREMISE_P, soft=True)
steps += [
    # `index.tsx`: `<Loading visible={loading && !previousData} />` covers the page until the first
    # material query answers, and `N matches` renders exactly when `data.results` exists. Replay 1 clicked
    # the dropdown through that overlay (forced) and the option never became visible.
    jsassert("READY: the material list has loaded — an `N matches` line shows and no loading overlay covers "
             "the page",
             "const overlay = document.querySelectorAll('.mantine-LoadingOverlay-overlay').length > 0;\n"
             "const counted = [...document.querySelectorAll('p, div, span')]\n"
             "  .some(e => e.children.length === 0 && /^\\d[\\d,]* matches$/.test((e.textContent || '').trim()));\n"
             "return counted && !overlay;", timeout=60),
    step("click", "Open the storeroom dropdown",
         {"element": xpath_el(MATERIAL_URL, STOREROOM_SELECT)}, timeout=30),
    step("wait", "Wait for storeroom options", {"value": 2}),
    step("click", f"Pick {STOREROOM}",
         {"element": xpath_el(MATERIAL_URL, option(STOREROOM))}, timeout=30),
    step("wait", "Wait for the material list to load", {"value": 8}),
    step("click", "Focus the material search", {"element": xpath_el(MATERIAL_URL, SEARCH)},
         timeout=30),
    step("typeText", f"Search for {ITEM_SEARCH}",
         {"value": ITEM_SEARCH, "element": xpath_el(MATERIAL_URL, SEARCH)}),
    step("wait", "Wait for the search debounce", {"value": 4}),
    step("assertElementPresent", f'FIXTURE GUARD: "{ITEM}" is listed',
         {"element": xpath_el(MATERIAL_URL, ROW)}, timeout=30),
    step("click", f"Open the item modal for {ITEM} (the row's action icon)",
         {"element": xpath_el(MATERIAL_URL, ROW_ACTION)}, timeout=30),
    step("assertPageContains", "The modal opened on the Quantity Adjustment view",
         {"value": "Current Quantity"}, timeout=30),
]

# ---- PHOTO: upload -----------------------------------------------------------------------------
steps += switch_segment("3", "Photos")
steps += [
    photos_at_rest("PHOTOS at rest: the Storeroom Item section has NO slide and offers `Add Photo`"),
    step("click", "Open the picker (`Add Photo` in the item modal)",
         {"element": xpath_el(MATERIAL_URL, ADD_PHOTO)}, timeout=30),
    step("assertPageContains", "The picker opened", {"value": "Select Photo Source"}, timeout=30),
] + upload_steps(
    MATERIAL_URL,
    picker=(f"if (sessionStorage.getItem('{K_EMPTY}') !== '1') return false;   // premise failed: never upload\n"
            "document.querySelectorAll('[data-dd-upload]').forEach(n => n.removeAttribute('data-dd-upload'));\n"
            "const pics = [...document.querySelectorAll('input[type=\"file\"][accept=\"image/*\"]')]\n"
            "  .filter(i => !i.capture && !i.getAttribute('capture'));\n"
            "if (pics.length !== 1) return false;\n"
            "const el = pics[0];\n"),
    reveal_name="🛑 Reveal the gallery input — ONLY if the premise held (the storeroom item was empty)",
    upload_name="Upload a photo to the storeroom item",
) + [
    step("assertPageLacks", "The picker closed itself once the file arrived",
         {"value": "Select Photo Source"}, timeout=30),
    jsassert("⭐ PHOTO LANDED (UI, after the refetch): exactly ONE slide in the Storeroom Item section, "
             "named as uploaded, with a server image URL",
             SECTION_JS +
             "const slides = within('.mantine-Carousel-slide');\n"
             "if (slides.length !== 1) return false;\n"
             "const img = slides[0].querySelector('img');\n"
             "if (!img) return false;\n"
             f"return img.getAttribute('alt') === {J(PHOTO_NAME)}\n"
             "  && (img.getAttribute('src') || '').includes('/api/attachment/');", timeout=90),
]
# `always`: a READ that stashes the id the delete guard needs - a run that fails after the upload still cleans up.
steps += server_assert(
    "⭐ SERVER: the storeroom item holds exactly ONE attachment — the uploaded image — and the material "
    "item is unchanged; its id is stashed for the delete guard",
    K_SERVER, ATT_Q, ATT_V, landed_p(K_PHOTO, PHOTO_NAME, "/^image\\//"), always=True, timeout=60)

# ---- PHOTO: delete (always, guarded) -----------------------------------------------------------
steps += [
    jsassert("🛑 GUARD + open the gear: only on the ONE slide, and only if it is the attachment the server "
             "just stashed (premise held)",
             GUARD_PHOTO_JS +
             "if (document.querySelector('.mantine-Menu-dropdown')) return false;\n"
             "const g = slides[0].querySelector('[aria-label=\"Settings\"]');\n"
             "if (!g) return false;\n"
             "g.click();\n"
             "return true;", always=True, timeout=30),
    step("wait", "Let the menu dropdown render", {"value": 2}, always=True),
    jsassert("⭐ MENU SET on a storeroom item photo: exactly " + " · ".join(MENU) + " — in that order",
             "const dds = document.querySelectorAll('.mantine-Menu-dropdown');\n"
             "if (dds.length !== 1) return false;\n"
             "const got = [...dds[0].querySelectorAll('.mantine-Menu-item')].map(e => (e.textContent || '').trim());\n"
             f"return JSON.stringify(got) === JSON.stringify({J(MENU)});", soft=True, timeout=30),
    step("click", 'Click "Delete Photo" (the menu the guard opened)',
         {"element": xpath_el(MATERIAL_URL, DELETE_PHOTO)}, always=True, timeout=30),
    step("wait", "Let the confirmation open", {"value": 2}, always=True),
    jsassert("🛑 GUARD + confirm `Yes`: re-checked immediately before the click — ONE slide, carrying the "
             "stashed id, and the delete confirmation open",
             GUARD_PHOTO_JS +
             "const c = [...document.querySelectorAll('.mantine-Modal-content')]\n"
             f"  .filter(x => x !== m && (x.textContent || '').includes({J(CONFIRM)}));\n"
             "if (c.length !== 1) return false;\n"
             "const yes = [...c[0].querySelectorAll('button')].filter(b => (b.textContent || '').trim() === 'Yes');\n"
             "if (yes.length !== 1) return false;\n"
             "yes[0].click();\n"
             "return true;", always=True, timeout=30),
]
steps += server_assert(
    "⭐ SERVER: the photo is GONE — the storeroom item holds no attachment, the material item unchanged",
    K_SERVER, ATT_Q, ATT_V, gone_p(K_PHOTO), always=True, timeout=60)
steps += [
    photos_at_rest("⭐ PHOTOS back at rest (UI): no slide in the Storeroom Item section, `Add Photo` still offered"),
]

# ---- DOCUMENT: upload --------------------------------------------------------------------------
steps += switch_segment("4", "Docs")
steps += [
    docs_at_rest("DOCS at rest: the Storeroom Item section has NO file row and offers `Add File`"),
]
_doc = upload_steps(
    MATERIAL_URL,
    picker=(f"if (sessionStorage.getItem('{K_EMPTY}') !== '1') return false;   // premise failed: never upload\n"
            "document.querySelectorAll('[data-dd-upload]').forEach(n => n.removeAttribute('data-dd-upload'));\n"
            + SECTION_JS +
            "const ins = within('input[type=\"file\"][accept=\"*/*\"]');\n"
            "if (ins.length !== 1) return false;\n"
            "const el = ins[0];\n"),
    reveal_name="🛑 Reveal the Storeroom Item section's hidden file input (accept=\"*/*\") — ONLY if the premise held",
    upload_name=f"📄 Upload a PDF (`{DOC_NAME}`) — the owner-recorded PDF (trap 12)",
)
_doc[1]["params"]["files"] = [dict(RECORDED_PDF, name=DOC_NAME)]
steps += _doc + [
    jsassert("⭐ DOCUMENT LANDED (UI, after the refetch): exactly ONE file row in the Storeroom Item section, "
             "named as uploaded, linking to a server attachment",
             SECTION_JS +
             "const rows = within('tbody tr');\n"
             "if (rows.length !== 1) return false;\n"
             "const a = rows[0].querySelector('a[href]');\n"
             f"return !!a && (a.textContent || '').trim() === {J(DOC_NAME)}\n"
             "  && (a.getAttribute('href') || '').startsWith('/api/attachment/');", timeout=90),
]
steps += server_assert(
    "⭐ SERVER: the storeroom item holds exactly ONE attachment — the uploaded PDF — and the material item "
    "is unchanged; its id is stashed for the delete guard",
    K_SERVER, ATT_Q, ATT_V, landed_p(K_DOC, DOC_NAME, "/^application\\/pdf$/"), always=True, timeout=60)

# ---- DOCUMENT: delete (always, guarded) --------------------------------------------------------
steps += [
    jsassert("🛑 GUARD + tick the row: only the ONE row, and only if it links to the attachment the server "
             "just stashed (premise held)",
             GUARD_DOC_JS +
             "if (!box.checked) box.click();\n"
             "return true;", always=True, timeout=30),
    jsassert("🛑 GUARD + open the table's gear: the row is ticked and it is still the stashed attachment",
             GUARD_DOC_JS +
             "if (!box.checked) return false;\n"
             "const gears = within('button[aria-label=\"Menu\"]');\n"
             "if (gears.length !== 1 || gears[0].disabled) return false;\n"
             "if (document.querySelector('.mantine-Menu-dropdown')) return false;\n"
             "gears[0].click();\n"
             "return true;", always=True, timeout=30),
    step("wait", "Let the menu dropdown render", {"value": 2}, always=True),
    jsassert("🛑 GUARD + `Delete File(s)`: re-checked immediately before the click — ONE ticked row carrying "
             "the stashed id, and a menu holding only `Delete File(s)`",
             GUARD_DOC_JS +
             "if (!box.checked) return false;\n"
             "const dds = document.querySelectorAll('.mantine-Menu-dropdown');\n"
             "if (dds.length !== 1) return false;\n"
             "const items = [...dds[0].querySelectorAll('.mantine-Menu-item')];\n"
             "if (items.length !== 1 || (items[0].textContent || '').trim() !== 'Delete File(s)') return false;\n"
             "items[0].click();\n"
             "return true;", always=True, timeout=30),
]
steps += server_assert(
    "⭐ SERVER: the PDF is GONE — the storeroom item holds no attachment, the material item unchanged",
    K_SERVER, ATT_Q, ATT_V, gone_p(K_DOC), always=True, timeout=60)
steps += [
    docs_at_rest("⭐ DOCS back at rest (UI): no file row in the Storeroom Item section, `Add File` still offered"),
]

# ---- leave it as found ---------------------------------------------------------------------------
steps += server_assert(
    "RESTED (server): the storeroom item holds no attachment and the material item is at its recorded count",
    K_SERVER, ATT_Q, ATT_V, REST_P, always=True, timeout=30)
steps += [
    jsassert("CLEANUP: remove this test's sessionStorage keys",
             "".join(f"sessionStorage.removeItem('{k}');\n" for k in KEYS) +
             f"return {' && '.join(f'!sessionStorage.getItem({J(k)})' for k in KEYS)};",
             always=True, timeout=15),
    jsassert("Close any modal left over a failure (picker, confirmation), then the item modal with its own X",
             "const all = [...document.querySelectorAll('.mantine-Modal-content')];\n"
             "const m = all.find(x => !!x.querySelector('[class*=\"mantine-SegmentedControl-root\"]'));\n"
             "all.filter(x => x !== m).forEach(x => { const c = x.querySelector('.mantine-Modal-close'); if (c) c.click(); });\n"
             "const x = m && m.querySelector('.mantine-Modal-close');\n"
             "if (x) x.click();\n"
             "return true;", always=True, timeout=15),
    step("wait", "Let the modals close", {"value": 2}, always=True),
    jsassert("RESTORED: no modal is left open for the next subtest",
             "return !document.querySelector('.mantine-Modal-content');", always=True, timeout=30),
]

write(test(
    NAME,
    "`MOB.866` **Upload a photo and a PDF to the storeroom item, prove each over `/graphql`, delete each "
    "through the app, and prove the item back at rest.**\n"
    f"- Fixture: `{STOREROOM}` · `{ITEM}`. The editable half is the STOREROOM item "
    f"(`StoreroomItem` `{STOREROOM_ITEM_ID}`); the material item (`{MATERIAL_ITEM_ID}`) is read-only here\n"
    "  and must not change. Both hold 0 attachments at rest, which is what `MOB.865` reads.\n"
    "- ⭐ **Server-proved both ways**: premise 0 → exactly 1 (named, `image/*`) → 0 → exactly 1 "
    "(named, `application/pdf`) → 0.\n"
    "- 🛑 **Owner-authorised deletes (2026-09-15), this run's uploads only** (trap 2). Nothing uploads unless\n"
    "  the premise held; the `Yes` / `Delete File(s)` click is made from a step that re-checks, immediately\n"
    "  before it, that the section holds ONE item carrying the id the server read stashed. The delete\n"
    "  legs are `always`, so a failed run still removes its own upload.\n"
    "- ⭐ The photo gear menu on this call site is pinned: " + " · ".join(f"`{x}`" for x in MENU) + ".\n"
    "  `Set as Avatar` is never clicked.\n"
    f"- 📄 The PDF step uploads the owner-recorded PDF (`MOB.PDF_Upload_Recording`, trap 12) renamed `{DOC_NAME}`;\n"
    "  locally a generated one-page PDF of that name.",
    steps,
    tags=["Mobile", "env:dev", "Material Lookup", "Photos", "Attachments", "self-cleaning"],
))
print(f"wrote {NAME} ({len(steps)} steps: storeroom item photo + PDF, upload and delete)")
