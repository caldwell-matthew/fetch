"""Build MOB.628_Collector_Document_Add_Delete - upload ONE PDF to a `DD SYNTHETIC MOBILE` asset's
Docs, then delete exactly that file; both ends proved over `/graphql`. Checklist ▶ #66.

WHY THIS EXISTS
  `MOB.623`/`MOB.624` prove the Docs panel renders `Add File`; `MOB.741` proves the Docs `Add File`
  DROPS an image client-side. Nothing had sent a document to the server or deleted one:
  `FileAttachments.addFiles` -> `uploadFile` (`CREATE_PENDING_ATTACHMENTS` + tus) and
  `FileAttachments.deleteFiles` -> `REMOVE_ATTACHMENT` (`DetailPage/FileAttachments.tsx:22-63`).

📄 THE PDF (trap 12)
  The Docs filter drops images (`Attachments.tsx:33-43`), so MOB.600's PNG recipe writes nothing here.
  The upload step is MOB.600's with its file entry replaced by `dd_tools.RECORDED_PDF` - the one PDF
  the owner recorded in the Datadog UI (`MOB.PDF_Upload_Recording`, never delete). Locally,
  `local_run.py` generates a one-page PDF of the same name and really uploads it. Nothing below
  depends on the file's NAME: it is read back off the input after the upload.

THE TARGET AND THE GUARDS
  Same row as `MOB.623`/`MOB.627`: the first collector row carrying `DD SYNTHETIC MOBILE`, resolved on
  the server by its exact stashed name inside a STATIC `assets(params)` query.
  1. PREMISE (server): exactly one asset has the name; its attachment ids are stashed (`BEFORE`).
  2. Upload; the input must hold exactly ONE non-image `.pdf`, whose name is stashed.
  3. The table row with that name whose `/api/attachment/<id>` href is NOT in `BEFORE` must be
     exactly one; its id is stashed, and ⭐ the SERVER must list it as the one new attachment.
  4. 🛑 The row's checkbox is checked only if it is that row and nothing else is checked; and the
     `Delete File(s)` click shares ONE step with a re-check that the table's only checked row is
     ours. `deleteFiles` deletes `selectedRows`, so a stray check would widen the delete.

WHAT PROVES THE DELETE
  `deleteFiles` awaits `REMOVE_ATTACHMENT` before the cache drops the row, so the row vanishing is
  already server-confirmed - but it is proved on the server anyway: our id is gone and the
  attachment set is EXACTLY `BEFORE` (MOB.623's photos untouched). `destroy` (reference count 1)
  deletes the S3 object and the attachment row.

⚠️ `reveal_file_button` searches `document` or a CSS scope, and the accordion item has no CSS handle,
  so the picker here resolves the item first and then applies the same fail-closed rule: exactly one
  `accept="*/*"` input in the item AND on the page.

RESIDUE: none when green. A run that dies between upload and delete leaves one PDF on the throwaway
  asset; the next run's guards ignore it (its id is in that run's `BEFORE`).
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert, server_assert,  # noqa: E402
                      upload_steps, RECORDED_PDF)

COLLECTOR_URL = BASE + "/asset-collector"
MARKER = "DD SYNTHETIC MOBILE"
K_NAME, K_BEFORE, K_FILE, K_ATT = "__dd628_name", "__dd628_before", "__dd628_file", "__dd628_att"
KEYS = [K_NAME, K_BEFORE, K_FILE, K_ATT]

# 🛑 PLACEHOLDER - replace with the Datadog-recorded PDF's `files` entry (see the header).



def tok(cls):
    return f'contains(concat(" ", normalize-space(@class), " "), " {cls} ")'


ITEM = (f'(//*[{tok("mantine-Accordion-item")}]'
        f'[.//*[{tok("mantine-Accordion-control")}][contains(., "{MARKER}")]])[1]')
CHEVRON = f'{ITEM}//*[{tok("mantine-Accordion-chevron")}]'
ADD_FILE = f'{ITEM}//button[normalize-space(.)="Add File"]'
GEAR = f'{ITEM}//table//button[@aria-label="Menu"]'


def tab(title):
    return f'{ITEM}//*[@role="tab"][normalize-space(.)="{title}"]'


ITEM_JS = (
    "const items = [...document.querySelectorAll('.mantine-Accordion-item')];\n"
    "const it = items.find(i => {\n"
    "  const c = i.querySelector('.mantine-Accordion-control');\n"
    f"  return c && (c.textContent || '').includes('{MARKER}');\n"
    "});\n"
    "if (!it) return false;\n")
ID_OF_HREF = ("const idOf = a => ((a && a.getAttribute('href') || '')"
              ".match(/\\/api\\/attachment\\/([^?/&]+)/) || [])[1] || null;\n")
STASH = (f"const att = sessionStorage.getItem('{K_ATT}');\n"
         f"const file = sessionStorage.getItem('{K_FILE}');\n"
         f"let before = null; try {{ before = JSON.parse(sessionStorage.getItem('{K_BEFORE}') || 'null'); }} catch (e) {{ before = null; }}\n"
         "if (!att || !file || !Array.isArray(before) || before.includes(att)) return false;\n")
# The file table's body rows in the item, each with its checkbox, link id and link text.
ROWS = (ID_OF_HREF +
        "const rows = [...it.querySelectorAll('table tbody tr')].map(tr => {\n"
        "  const a = tr.querySelector('a[href]');\n"
        "  return { tr, cb: tr.querySelector('input[type=\"checkbox\"]'), id: idOf(a),\n"
        "           name: a ? (a.textContent || '').trim() : null };\n"
        "});\n")
PICK_ITEM_FILE_INPUT = (
    "document.querySelectorAll('[data-dd-upload]')\n"
    "  .forEach(n => n.removeAttribute('data-dd-upload'));\n" + ITEM_JS +
    "const hits = [...it.querySelectorAll('input[type=\"file\"][accept=\"*/*\"]')];\n"
    "const all = document.querySelectorAll('input[type=\"file\"][accept=\"*/*\"]').length;\n"
    "if (hits.length !== 1 || all !== 1) return false;   // 0 = not rendered, >1 = ambiguous\n"
    "const el = hits[0];\n")

ASSETS_Q = ("query($p: TableQuery) { assets(params: $p) { edges { id name avatar { id } "
            "attachments { id fileName fileType tags { id name } } } } }")
ASSETS_V = {"p": {"limit": 50, "query": {"connector": "AND", "conditions": [
    {"column": "name", "operator": "CONTAINS", "value": MARKER}]}}}


def on_asset(body):
    """A predicate over OUR asset: binds `a`, `ids`, `before`, `att`, `file`, `mine`."""
    return ("(() => {\n"
            f"  const name = sessionStorage.getItem('{K_NAME}');\n"
            "  const hits = ((data.assets || {}).edges || []).filter(x => x.name === name);\n"
            "  if (!name || hits.length !== 1) return false;\n"
            "  const a = hits[0], atts = a.attachments || [], ids = atts.map(x => x.id);\n"
            f"  const att = sessionStorage.getItem('{K_ATT}'), file = sessionStorage.getItem('{K_FILE}');\n"
            f"  let before = null; try {{ before = JSON.parse(sessionStorage.getItem('{K_BEFORE}') || 'null'); }} catch (e) {{ before = null; }}\n"
            "  if (!att || !file || !Array.isArray(before) || before.includes(att)) return false;\n"
            "  const mine = atts.find(x => x.id === att);\n"
            f"  return !!({body});\n"
            "})()")


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
    "__dd628_srv_premise", ASSETS_Q, ASSETS_V,
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
    step("click", 'Switch to the "Docs" tab', {"element": xpath_el(COLLECTOR_URL, tab("Docs"))},
         timeout=30),
    step("wait", "Let the Docs panel mount", {"value": 3}),
    step("assertElementPresent", 'The "Docs" tab is active',
         {"element": xpath_el(COLLECTOR_URL, tab("Docs") + "[@data-active]")}, timeout=30),
    step("assertElementPresent", "`Add File` renders (asset.create)",
         {"element": xpath_el(COLLECTOR_URL, ADD_FILE)}, timeout=30),
]
reveal, up = upload_steps(
    COLLECTOR_URL, picker=PICK_ITEM_FILE_INPUT,
    reveal_name='Reveal the row\'s hidden "Add File" input (accept="*/*", exactly one on the page)',
    upload_name="📄 Upload ONE PDF through `Add File` (the owner-recorded PDF — trap 12)")
up["params"]["files"] = [dict(RECORDED_PDF)]
steps += [
    reveal, up,
    jsassert("The input holds exactly ONE file, a non-image `.pdf` — stash its name",
             "const el = document.querySelector('input[data-dd-upload=\"1\"]');\n"
             "if (!el || !el.files || el.files.length !== 1) return false;\n"
             "const f = el.files[0];\n"
             "if (/^image\\//.test(f.type) || !/\\.pdf$/i.test(f.name)) return false;\n"
             f"sessionStorage.setItem('{K_FILE}', f.name);\n"
             "return true;", timeout=30),
    jsassert("The file table shows exactly ONE row with that name whose attachment id was not there "
             "before — stash the id",
             ITEM_JS + ROWS +
             f"const file = sessionStorage.getItem('{K_FILE}');\n"
             f"let before = null; try {{ before = JSON.parse(sessionStorage.getItem('{K_BEFORE}') || 'null'); }} catch (e) {{ before = null; }}\n"
             "if (!file || !Array.isArray(before)) return false;\n"
             "const fresh = rows.filter(r => r.name === file && r.id && !before.includes(r.id));\n"
             "if (fresh.length !== 1) return false;\n"
             f"sessionStorage.setItem('{K_ATT}', fresh[0].id);\n"
             "return true;", timeout=60),
]
steps += server_assert(
    "⭐ SERVER (CREATE_PENDING_ATTACHMENTS): that id is the ONE new attachment — the PDF's name, not "
    "an image, BEFORE intact",
    "__dd628_srv_upload", ASSETS_Q, ASSETS_V,
    on_asset("mine && mine.fileName === file && !/^image\\//.test(mine.fileType || '')"
             " && ids.length === before.length + 1 && before.every(b => ids.includes(b))"),
    timeout=90)
steps += [
    jsassert("🛑 GUARD + check the box: only OUR row (the new id, the PDF's name), and nothing else "
             "checked",
             ITEM_JS + ROWS + STASH +
             "const mineRows = rows.filter(r => r.id === att && r.name === file);\n"
             "if (mineRows.length !== 1 || !mineRows[0].cb) return false;\n"
             "const cb = mineRows[0].cb;\n"
             "if (rows.some(r => r !== mineRows[0] && r.cb && r.cb.checked)) return false;\n"
             "if (!cb.checked) cb.click();\n"
             "return cb.checked && rows.filter(r => r.cb && r.cb.checked).length === 1;", timeout=30),
    step("assertElementPresent", "The table's gear is enabled (a row is selected)",
         {"element": xpath_el(COLLECTOR_URL, f"{GEAR}[not(@disabled)]")}, timeout=30),
    step("click", "Open the table's gear", {"element": xpath_el(COLLECTOR_URL, GEAR)}, timeout=30),
    step("wait", "Let the menu dropdown render", {"value": 1}),
    jsassert("🛑 GUARD + click `Delete File(s)`: the ONLY checked row is ours — `deleteFiles` deletes "
             "every selected row",
             ITEM_JS + ROWS + STASH +
             "const checked = rows.filter(r => r.cb && r.cb.checked);\n"
             "if (checked.length !== 1 || checked[0].id !== att || checked[0].name !== file) return false;\n"
             "const dds = document.querySelectorAll('.mantine-Menu-dropdown');\n"
             "if (dds.length !== 1) return false;\n"
             "const del = [...dds[0].querySelectorAll('.mantine-Menu-item')]\n"
             "  .filter(i => (i.textContent || '').trim() === 'Delete File(s)');\n"
             "if (del.length !== 1) return false;\n"
             "del[0].click();\n"
             "return true;", timeout=30),
]
steps += server_assert(
    "⭐ SERVER (REMOVE_ATTACHMENT): the PDF is gone and the attachment set is EXACTLY BEFORE",
    "__dd628_srv_deleted", ASSETS_Q, ASSETS_V,
    on_asset("!mine && ids.length === before.length && before.every(b => ids.includes(b))"),
    timeout=60)
steps += [
    jsassert("…and the table agrees: no row carries our id, the `Add File` button is still there "
             "(soft: UI echo)",
             ITEM_JS + ROWS + STASH +
             "const addFile = [...it.querySelectorAll('button')].some(b => (b.textContent || '').trim() === 'Add File');\n"
             "return addFile && !rows.some(r => r.id === att);", soft=True, timeout=30),
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
    "MOB.628_Collector_Document_Add_Delete",
    "`MOB.628` **Upload ONE PDF to a `DD SYNTHETIC MOBILE` asset's Docs, then delete exactly that "
    "file — both ends over `/graphql`.**\n"
    "- 📄 The upload is the one PDF the owner recorded in the Datadog UI (`MOB.PDF_Upload_Recording`,\n"
    "  trap 12); locally a generated one-page PDF of the same name.\n"
    "- ⭐ The server must list the uploaded id as the one attachment that was not there before, with\n"
    "  the PDF's name and a non-image type.\n"
    "- 🛑 Delete (owner-authorised 2026-09-15, own upload only): the row's box is checked only when it\n"
    "  is ours and nothing else is; `Delete File(s)` is clicked in the same step as a re-check that the\n"
    "  only checked row is ours. ⭐ The id is gone and the set is exactly as before.\n"
    "- Residue: none when green. Row collapsed and sessionStorage keys removed on the way out.",
    steps,
    tags=["Mobile", "env:dev", "Asset Collector", "Attachments", "self-cleaning"],
))
print("wrote MOB.628 (asset document upload + delete — the owner-recorded PDF)")
