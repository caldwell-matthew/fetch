"""Build MOB.712_AssetLookup_System_Create - create a System from an asset's `System` field, proved
over `/graphql`.

WHAT THE SOURCE SAYS (origin/development 4da480a68f)
  `AssetLookupDetails/index.tsx:51-84` rewrites the schema's `systemId` field - when it is a `record`
  and not `disabled` - to carry `props.onCreate`. The per-field pencil opens `EditForm` on it, a
  `ListFilter` (`helper-components/MentorInputs/ListFilter`). Typing a name no option matches
  (`noMatch`, case-insensitive) renders one extra option, `+ Create '<typed>'`. Clicking it:
      ComboboxOption.onClick -> ctx.onOptionSubmit('$create')   (ListFilter: onChange(null), close)
                             -> props.onClick -> onCreate(<typed>)
      onCreate: createSystem(client, name)   CREATE_SYSTEM {id: uid(), name}, not awaited, and a
                                             hand-written entry in the System lookup cache
                client.mutate(UPDATE_ASSET {systemId: newId}), context waitForKeys [asset, system]
                modal.close()                 immediately - OUTSIDE both mutations
  So the closing modal proves nothing (trap 6), and `System updated` is a transient toast from
  UPDATE_ASSET's `update()`. ⭐ THE PROOF IS TWO `/graphql` READS (`dd_tools.server_assert`):
      1. exactly ONE System carries the typed name              (CREATE_SYSTEM landed, once)
      2. the asset's `systemId` is THAT System, by id and name   (UPDATE_ASSET landed, and linked it)

THE FIELD IS REACHABLE, BUT HIDDEN BY DEFAULT - read over the API 2026-09-15
  `_info(schema: "Asset")`: `systemId` is `type: record`, `query: System`, `allowUpdate: true`,
  `disabled: null`, `display: false`. `RecordInfoTable` renders only the columns ticked in its
  column picker, defaulting to name/desc/typeId/tagId for an Asset, so the test ticks `System` like
  a user does. 🛑 That selection persists to **localStorage** under `_assetlookup_generalinfo_cols_`
  (`RecordInfoTable.tsx:40-42`, MOB.711's archive note) and is shared by every `AssetLookupDetails`
  - Asset Lookup, the Collector's details and the AV asset rows. So the column selection is
  recorded first and the tick is undone `always`; the last step proves `systemId` is no longer shown
  and every other column is as recorded.

THE RECORD: A THROWAWAY ASSET, NEVER A FIXTURE
  Asset Lookup searches `DD SYNTHETIC MOBILE` (server-side CONTAINS on name/desc) and takes the first
  row whose control carries the marker; a critical guard then requires the expanded row's `Name`
  cell to be exactly `DD SYNTHETIC MOBILE <8 digits>` (MOB.600's residue) before anything is typed.
  The server holds 4 such assets (2026-09-15), none with a System. Which one sorts first can change,
  so the name is READ from the page into `sessionStorage` rather than hardcoded (trap 29).

RUNID STAYS OUT OF THE JAVASCRIPT (build_edit_tests.py's rule)
  The System is typed as `DD SYNTHETIC MOBILE {{ RUNID }}` - interpolation into TYPED text is
  proven. The JS never depends on `{{ RUNID }}`: it reads the modal input's value back into
  `sessionStorage` and the server predicates compare against that.

RESIDUE - mobile cannot delete a System (no `deleteSystems` anywhere in client/mobile)
  One System per run named `DD SYNTHETIC MOBILE <8 digits>`, and the chosen marker asset's
  `systemId` pointing at the newest one. A fresh RUNID every run keeps `noMatch` true, so the
  create option always renders and no name collides.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert, localvar,  # noqa: E402
                      server_assert)

LOOKUP_URL = BASE + "/asset-lookup"
MARKER = "DD SYNTHETIC MOBILE"
RUNID = localvar("RUNID", "{{ numeric(8) }}", "71248120")
SYSTEM_VALUE = MARKER + " {{ RUNID }}"
COLS_KEY = "_assetlookup_generalinfo_cols_"
K_ASSET, K_SYSTEM, K_COLS = "__dd712_asset", "__dd712_system", "__dd712_cols"
K_SRV1, K_SRV2 = "__dd712_server_system", "__dd712_server_asset"


def tok(cls):
    return f'contains(concat(" ", normalize-space(@class), " "), " {cls} ")'


SEARCH = '//input[@name="asset-search"]'
# The first accordion item whose CONTROL carries the marker (MOB.623's shape, trap 3).
ITEM = (f'(//*[{tok("mantine-Accordion-item")}]'
        f'[.//*[{tok("mantine-Accordion-control")}][contains(., "{MARKER}")]])[1]')
CONTROL = f'{ITEM}//*[{tok("mantine-Accordion-control")}]'
# faColumns -> `table-columns` (trap 14; MOB.711 measured it); faEdit -> `pen-to-square`.
COLUMNS_BTN = (f'{ITEM}//button[.//*[@data-icon="table-columns"'
               ' or contains(concat(" ", normalize-space(@class), " "), " fa-table-columns ")]]')
SYSTEM_PENCIL = (f'{ITEM}//tr[.//b[normalize-space(.)="System"]]'
                 '//button[.//*[@data-icon="pen-to-square"'
                 ' or contains(concat(" ", normalize-space(@class), " "), " fa-pen-to-square ")]]')
MODAL = f'//*[{tok("mantine-Modal-content")}]'
MODAL_SYSTEM = f'{MODAL}//input[@id="systemId"]'
# `+ Create '${inputValue}'` is a template, so only its fixed head is a literal the bundle holds; the step
# before the click proves exactly ONE such option and that it names the typed System.
CREATE_OPTION = '//*[@role="option"][starts-with(normalize-space(.), "+ Create")]'

NAME_RE = "/^DD SYNTHETIC MOBILE \\d{8}$/"

# JS prelude: the same item the XPath resolves, or false.
ITEM_JS = (
    "const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {\n"
    "  const c = i.querySelector('.mantine-Accordion-control');\n"
    f"  return c && (c.textContent || '').includes('{MARKER}');\n"
    "});\n"
    "if (!it) return false;\n")
# A General Info row's value cell by its exact bold label (MOB.710's `row_desc_js`, scoped to `it`).
CELL_JS = ("const cell = label => {\n"
           "  const tr = [...it.querySelectorAll('tr')].find(t => {\n"
           "    const b = t.querySelector('b');\n"
           "    return b && b.textContent.trim() === label;\n"
           "  });\n"
           "  return tr && tr.cells.length >= 2 ? tr.cells[1] : null;\n"
           "};\n")
# The ONE checkbox labelled exactly `System` in the open column picker.
SYSTEM_BOX_JS = (
    "const roots = [...document.querySelectorAll('.mantine-Menu-dropdown .mantine-Checkbox-root')]\n"
    "  .filter(r => { const l = r.querySelector('.mantine-Checkbox-label');\n"
    "    return l && l.textContent.trim() === 'System'; });\n"
    "if (roots.length !== 1) return false;\n"
    "const box = roots[0].querySelector('input[type=\"checkbox\"]');\n"
    "if (!box) return false;\n")

ASSETS_PARAMS = {"p": {"limit": 100, "query": {"conditions": [
    {"column": "name", "operator": "CONTAINS", "value": MARKER}]}}}
Q_SYSTEMS = "query($p: TableQuery!) { systems(params: $p) { edges { id name } } }"
Q_ASSETS = ("query($p: TableQuery!) { assets(params: $p) { edges { id name systemId { id name } } } "
            "systems(params: $p) { edges { id name } } }")
PRED_SYSTEM = (f"(() => {{ const n = sessionStorage.getItem('{K_SYSTEM}'); if (!n) return false;\n"
               "  return data.systems.edges.filter(s => s.name === n).length === 1; })()")
PRED_ASSET = (f"(() => {{ const a = sessionStorage.getItem('{K_ASSET}'), n = sessionStorage.getItem('{K_SYSTEM}');\n"
              "  if (!a || !n) return false;\n"
              "  const as = data.assets.edges.filter(e => e.name === a);\n"
              "  const ss = data.systems.edges.filter(s => s.name === n);\n"
              "  return as.length === 1 && ss.length === 1 && !!as[0].systemId\n"
              "    && as[0].systemId.id === ss[0].id && as[0].systemId.name === n; })()")


def open_picker(always=False):
    a = dict(always=always)
    return [
        step("click", "Open the General Info column picker (`table-columns`)",
             {"element": xpath_el(LOOKUP_URL, COLUMNS_BTN)}, timeout=30, **a),
        step("assertElementPresent", "The column picker is open (`Find Column(s)`)",
             {"element": xpath_el(LOOKUP_URL, '//input[@placeholder="Find Column(s)"]')}, timeout=30, **a),
    ]


steps = [
    go(LOOKUP_URL, "asset lookup"),
    step("wait", "Wait for the page to mount", {"value": 3}),
    step("assertElementContent", 'Test the "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup",
          "element": xpath_el(LOOKUP_URL, '//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]')},
         timeout=30),
    step("click", "Focus the search input", {"element": xpath_el(LOOKUP_URL, SEARCH)}, timeout=30),
    # `asset_lookup_query` persists in sessionStorage and a suite shares one session (MOB.720's note).
    step("pressKey", "Select any persisted query first (typeText APPENDS — trap 17)",
         {"value": "a", "modifiers": ["Control"]}),
    step("typeText", f'Search for "{MARKER}"', {"value": MARKER, "element": xpath_el(LOOKUP_URL, SEARCH)}),
    step("pressKey", "Submit the search (Enter — there is no search button)", {"value": "Enter"}),
    step("assertElementPresent", f'RESULT GUARD: a "{MARKER}" row rendered (MOB.600 residue)',
         {"element": xpath_el(LOOKUP_URL, ITEM)}, timeout=60),
    step("click", "Expand that row", {"element": xpath_el(LOOKUP_URL, CONTROL)}, timeout=30),
    step("wait", "Let the detail panel mount", {"value": 3}),
    # 🛑 Critical, before anything is typed: the row is a throwaway asset, never a fixture.
    jsassert(f"FIXTURE GUARD: the row's `Name` cell is exactly `{MARKER} <8 digits>` — a throwaway asset; "
             "record the name",
             ITEM_JS + CELL_JS +
             "const c = cell('Name');\n"
             "const name = c ? c.textContent.trim() : '';\n"
             f"if (!{NAME_RE}.test(name)) return false;\n"
             f"sessionStorage.setItem('{K_ASSET}', name);\n"
             "return true;", timeout=30),
] + open_picker() + [
    jsassert("BEFORE: record the General Info column selection (localStorage — restored at the end)",
             f"const v = localStorage.getItem('{COLS_KEY}');\n"
             "if (!v) return false;\n"
             "try { JSON.parse(v); } catch (e) { return false; }\n"
             f"sessionStorage.setItem('{K_COLS}', v);\n"
             "return true;", timeout=30),
    # Trap 28: a Mantine checkbox input is hidden, so `click()` from JS - ONCE (a window flag), and the
    # same step proves the tick took. Already ticked (a run that died before its restore) passes.
    jsassert("Tick `System` in the picker — its checkbox is now checked",
             SYSTEM_BOX_JS +
             "if (!box.checked && !window.__dd712_ticked) { window.__dd712_ticked = 1; box.click(); }\n"
             "return box.checked;", timeout=30),
    step("pressKey", "Close the column picker", {"value": "Escape"}),
    step("assertElementPresent", "The `System` row now renders in General Info, with its edit pencil "
         "(`allowUpdate` and `asset.update`)",
         {"element": xpath_el(LOOKUP_URL, SYSTEM_PENCIL)}, timeout=30),
    step("click", "Open the System edit form", {"element": xpath_el(LOOKUP_URL, SYSTEM_PENCIL)}, timeout=30),
    step("assertElementPresent", "The edit modal opened on the System lookup (`#systemId`)",
         {"element": xpath_el(LOOKUP_URL, MODAL_SYSTEM)}, timeout=30),
    step("click", "Focus the System lookup", {"element": xpath_el(LOOKUP_URL, MODAL_SYSTEM)}, timeout=30),
    step("pressKey", "Select any current System name (typeText APPENDS — trap 17)",
         {"value": "a", "modifiers": ["Control"]}),
    step("typeText", f'Type a new System name "{SYSTEM_VALUE}"',
         {"value": SYSTEM_VALUE, "element": xpath_el(LOOKUP_URL, MODAL_SYSTEM)}),
    jsassert(f"The lookup holds `{MARKER} <8 digits>`; record it (the JS never reads RUNID)",
             "const el = document.querySelector('.mantine-Modal-content #systemId');\n"
             "const v = el ? (el.value || '').trim() : '';\n"
             f"if (!{NAME_RE}.test(v)) return false;\n"
             f"sessionStorage.setItem('{K_SYSTEM}', v);\n"
             "return true;", timeout=30),
    # `noMatch` is what renders the create branch - a name that matched an existing System would not.
    jsassert("The dropdown offers exactly ONE option `+ Create '<that name>'` (`ListFilter`, `noMatch`)",
             f"const n = sessionStorage.getItem('{K_SYSTEM}');\n"
             "if (!n) return false;\n"
             "const hits = [...document.querySelectorAll('[role=\"option\"]')]\n"
             "  .filter(o => (o.textContent || '').trim().indexOf('+ Create') === 0);\n"
             "return hits.length === 1 && hits[0].textContent.trim() === \"+ Create '\" + n + \"'\";",
             timeout=30),
    step("click", "Click `+ Create` — `onCreate`: CREATE_SYSTEM, then UPDATE_ASSET systemId",
         {"element": xpath_el(LOOKUP_URL, CREATE_OPTION)}, timeout=30),
    step("wait", "Brief wait for the toast", {"value": 2}),
    step("assertPageContains", "`System updated` toast (optional: transient — UPDATE_ASSET's `update()`)",
         {"value": "System updated"}, optional=True),
    jsassert("The System lookup's modal is gone and the row is still expanded (it closes whatever the server "
             "says — not proof)",
             ITEM_JS + "const c = it.querySelector('.mantine-Accordion-control');\n"
             "return !document.querySelector('.mantine-Modal-content #systemId')\n"
             "  && !!c && c.getAttribute('aria-expanded') === 'true';", timeout=30),
] + server_assert("⭐ SERVER: exactly ONE System carries the typed name (CREATE_SYSTEM stored it, once)",
                  K_SRV1, Q_SYSTEMS, ASSETS_PARAMS, PRED_SYSTEM, timeout=60) \
  + server_assert("⭐ SERVER: the asset's `systemId` IS that System — same id, same name (UPDATE_ASSET)",
                  K_SRV2, Q_ASSETS, ASSETS_PARAMS, PRED_ASSET, timeout=60) + [
    # ---- leave it as found: the column selection (localStorage), the modal, the row, the keys ----
    step("pressKey", "Close anything still open (optional)", {"value": "Escape"}, optional=True, always=True),
    jsassert("No System lookup modal is left open, and the marker row is still on the page",
             ITEM_JS + "return !document.querySelector('.mantine-Modal-content #systemId');",
             always=True, timeout=15),
] + open_picker(always=True) + [
    jsassert("RESTORE: untick `System` in the picker — its checkbox is now unchecked",
             SYSTEM_BOX_JS +
             "if (box.checked && !window.__dd712_unticked) { window.__dd712_unticked = 1; box.click(); }\n"
             "return !box.checked;", always=True, timeout=30),
    step("pressKey", "Close the column picker", {"value": "Escape"}, always=True),
    jsassert("RESTORED: localStorage no longer shows `systemId`, and every other column is as recorded",
             f"let cur, before;\n"
             f"try {{ cur = JSON.parse(localStorage.getItem('{COLS_KEY}') || 'null');\n"
             f"  before = JSON.parse(sessionStorage.getItem('{K_COLS}') || 'null'); }} catch (e) {{ return false; }}\n"
             "if (!cur || cur.systemId) return false;\n"
             "if (!before) return true;\n"
             "const keys = new Set([...Object.keys(before), ...Object.keys(cur)]);\n"
             "keys.delete('systemId');\n"
             "return [...keys].every(k => !!cur[k] === !!before[k]);", always=True, timeout=30),
    step("click", "Collapse the row", {"element": xpath_el(LOOKUP_URL, CONTROL)}, always=True, timeout=30),
    jsassert("RESTORED: the row reports itself collapsed",
             ITEM_JS + "const c = it.querySelector('.mantine-Accordion-control');\n"
             "return !!c && c.getAttribute('aria-expanded') === 'false';", always=True, timeout=30),
    jsassert("CLEANUP: remove this test's scratch keys and flags, and the persisted search",
             f"['{K_ASSET}', '{K_SYSTEM}', '{K_COLS}', 'asset_lookup_query']"
             ".forEach(k => sessionStorage.removeItem(k));\n"
             "delete window.__dd712_ticked; delete window.__dd712_unticked;\n"
             f"return !sessionStorage.getItem('{K_ASSET}') && !sessionStorage.getItem('{K_SYSTEM}');",
             always=True, timeout=15),
]

write(test(
    "MOB.712_AssetLookup_System_Create",
    "`MOB.712` **Create a System from an asset's `System` field** — proved over `/graphql`.\n"
    f"- On the first `{MARKER}` row in Asset Lookup (a critical guard requires its `Name` to be\n"
    f"  `{MARKER} <8 digits>` before anything is typed) — never a fixture.\n"
    "- `System` is hidden by default (`display: false`), so it is ticked in the column picker; the\n"
    "  selection persists to localStorage, so it is recorded first and unticked `always`.\n"
    f"- Types `{MARKER} <RUNID>` into the per-field `System` lookup and clicks `+ Create '…'`:\n"
    "  `onCreate` fires CREATE_SYSTEM and UPDATE_ASSET without awaiting either and closes the modal,\n"
    "  so the modal and the transient `System updated` toast prove nothing (trap 6).\n"
    "- ⭐ **Server proof**: exactly one System carries the typed name, and the asset's `systemId` is\n"
    "  that System by id and name.\n"
    "- ⚠️ **LEAVES RESIDUE**: one System per run (mobile cannot delete one), and the marker asset's\n"
    "  `systemId` points at the newest.",
    steps,
    ["Mobile", "env:dev", "Asset Lookup", "System", "residue"],
    local_vars=(RUNID,),
))
print("wrote MOB.712 (create a System from the asset's System field)")
