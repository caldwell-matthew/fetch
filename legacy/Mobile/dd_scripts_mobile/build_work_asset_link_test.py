"""Build MOB.354_Work_Asset_Add_Remove - add an EXISTING asset from the Assets tab, prove it, remove THAT link.

WHY THIS EXISTS
  The work order's Assets tab can add an existing asset (`Assets/index.tsx:80-92`, `NewAssetButton`
  -> `MOBILE_WORK_ADD_ASSET`) and remove a link (`Assets/index.tsx:202-218`, the row's gear ->
  `Delete Item` -> `REMOVE_WORK_STAGE_ASSET_LINKS`). Neither was covered. The owner
  authorised the delete on 2026-09-15 - ONLY of the link this test adds in the same run (trap 2).

THE ASSET: `Bypass Valve 0001` (`wFRo1MMwoAMkdxA4hVpIhB`)
  - never `Pump 0102` (the fixture's own link, owner rule);
  - it has NO address and NO coordinates, and a unique name the picker search finds as one row;
  - its other users are `MOB.302` (its photos, read on Asset Lookup) and `MOB.399` (the Warranties tab
    of MOB.302's OWN work order) - neither reads which work orders link it, and this test leaves no link.
  `⚡ Tank 0000` is the AV job's asset (7+ tests, fixture guards) and `⚡ Building 0000` is MOB.721/914's
  zero-readings asset - both carry more readers, so they were not chosen.

WHAT THE SOURCE SAYS
  add     `NewAssetModalBody` (AssetVerification/NewAssetForm.tsx) -> `Add Existing Asset` renders
          `AssetLookup` with a checkbox per row; `Add N Asset(s)` calls `addAssetToWorkStage` per pick
          and closes the modal IMMEDIATELY (the close proves nothing). `addAssetToWorkStage`
          (Assets/utils.ts:28-92) sends `addWorkStageAssetLink` with an optimisticResponse only if the
          asset is already cached. So the proof is a `/graphql` read.
  location the client's `update()` fills the stage's address/x/y from the asset ONLY when the stage has
          none (utils.ts:71-79); the fixture has one. The server (`workStageAsset/create/index.ts`) never
          touches the stage's location, and fills asset-reference form fields only when the new asset is
          the stage's ONLY asset - Pump 0102 is already there. Asserted anyway: address/x/y unchanged.
  remove  `WorkCollectionMenu` -> `Delete Item` -> `Yes` -> `removeFromCollection` edits the cache FIRST,
          then fires the mutation without awaiting it (trap 6 - a reload proves nothing). Server
          (`workStageAsset/delete/index.ts`): deletes the link row AND that asset's conditions/failures
          on this stage - Bypass Valve has none; the fixture's condition/failure (Pump 0102's) are
          proved untouched by id.
  The picker's search box is `AssetLookup`'s, which PERSISTS its text in
  `sessionStorage['asset_lookup_query']` (`AssetLookup/index.tsx:48-52`) - the same key the Asset Lookup
  page reads. So the prior value is stashed first and put back `always`.

🐞 BUG EVIDENCE - expanding an asset row on a cold Asset-schema cache CRASHES THE PAGE (not filed)
  `Assets/index.tsx:42-45` reads the Asset schema with `readQuery` (cache only) and passes
  `schemaQuery?._info?.fields` to `AssetLookupDetails`, whose `useMemo` calls `fields.map` unguarded
  (`AssetLookupDetails/index.tsx:43`). Nothing on /work or the work-order page fetches that schema
  (prefetchData fetches the work schemas only). Measured twice (read-only probe, 2026-09-15, fresh
  session: /work 30s -> fixture -> Assets tab): the rows never rendered their geolocate control in 60s
  (`AssetGeolocate` returns null without the same schema) and clicking the row's chevron replaced the
  page with `Something went wrong. … Cannot read properties of undefined (reading 'map')`.
  Opening `Add Existing Asset` first (its `AssetLookup` runs `useQuery(GET_SCHEMA Asset)`) caches it; the
  geolocate controls then appear and the row expands. This test's add opens that picker anyway, and it
  GATES the expand on the geolocate controls being rendered, so it can never trip the ErrorBoundary
  (which would poison a suite's shared session).

🛑 THE DELETE (trap 2)
  - the premise proves over /graphql that the stage holds ONLY Pump 0102's link, and marks that it
    passed (`__dd354_premise`); a leftover Bypass Valve link stops the run there;
  - the add is proved over /graphql before any delete step;
  - the guard shares ONE step with the gear click: the premise mark is set, the tab shows exactly two
    rows, exactly one named Bypass Valve 0001, and its expanded panel holds exactly one gear;
  - `Delete Item` is the only item clicked, then `Yes`;
  - the server then holds only Pump 0102's link (same id, status, sequence, comment), the same
    condition/failure ids, and the rest address/x/y.
  BACKSTOP (`always`): only on a run whose premise passed, ONE step reads the stage and, if exactly one
  link to Bypass Valve 0001 exists (never Pump 0102's id), sends `removeWorkStageAssetLinks` for that
  link id alone - so a run that died between add and delete does not leave MOB.347/353/358/389 a
  second row. A run that needed it is still red (the delete proof is critical).
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write,  # noqa: E402
                      jsassert, server_assert, work_cache_warm)

FIXTURE_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
WO_URL = f"{BASE}/work/{FIXTURE_ID}"
PUMP, PUMP_ID, PUMP_LINK = "Pump 0102", "oB5BUN1Es1Jctw8FVYwYBh", "AE09h8JhBBhMtd1wIs98lQ"
PUMP_COMMENT = ("Chemical dosing pump, model PDM 2000, plastic housing with digital control panel, "
                "horizontal mount.")
BV, BV_ID = "Bypass Valve 0001", "wFRo1MMwoAMkdxA4hVpIhB"
REST_ADDRESS, REST_X, REST_Y = "230 North Alexander Street, New Orleans, LA 70119", "-90.1025785", "29.9782827"
K_PREMISE, K_CF, K_PREV, K_NET = "__dd354_premise", "__dd354_cf", "__dd354_prevQuery", "__dd354_net"


def tok(cls):
    return f'contains(concat(" ", normalize-space(@class), " "), " {cls} ")'


ASSETS_TAB = '//*[@role="tab"][normalize-space(.)="Assets"]'
MODAL = f'//*[{tok("mantine-Modal-content")}]'
ADD_ASSET = '//button[normalize-space(.)="Add Asset"]'
ADD_EXISTING = f'//label[{tok("mantine-SegmentedControl-label")}][normalize-space(.)="Add Existing Asset"]'
SEARCH = f'{MODAL}//input[@name="asset-search"]'
PICK_BOX = (f'{MODAL}//*[{tok("mantine-Accordion-item")}]'
            f'[.//*[{tok("mantine-Accordion-control")}][normalize-space(.)="{BV}"]]//input[@type="checkbox"]')
ADD_ONE = f'{MODAL}//button[normalize-space(.)="Add 1 Asset(s)"]'
CHEVRON = (f'(//*[@role="tabpanel"]//*[{tok("mantine-Accordion-item")}]'
           f'[.//*[{tok("mantine-Accordion-control")}][contains(normalize-space(.), "{BV}")]]'
           f'//*[{tok("mantine-Accordion-chevron")}])[1]')
DELETE_ITEM = f'//*[{tok("mantine-Menu-item")}][normalize-space(.)="Delete Item"]'
CONFIRM_TEXT = "Are you sure you want to delete this record?"
YES = f'//*[{tok("mantine-Modal-content")}][.//*[contains(normalize-space(.), "{CONFIRM_TEXT}")]]//button[normalize-space(.)="Yes"]'

LINKS_Q = ("query($id: ID!) { workStage(id: $id) { id status address x y condition { id } failures { id } "
           "assets { id status sequence comment asset: assetId { id name } } } }")
REMOVE_M = ("mutation($ids: [ID!]!, $parentId: ID!) { "
            "removeWorkStageAssetLinks(ids: $ids, parentId: $parentId) }")

# ---- server predicates over `data.workStage` (w) ------------------------------------------------
STAGE_OK = (f"(w => !!w && w.status === 'Ready' && w.address === {REST_ADDRESS!r}"
            f" && Math.abs(Number(w.x) - ({REST_X})) < 1e-6 && Math.abs(Number(w.y) - ({REST_Y})) < 1e-6)")
PUMP_OK = (f"(w => {{ const p = (w.assets || []).filter(a => a && a.id === '{PUMP_LINK}');\n"
           f"  return p.length === 1 && !!p[0].asset && p[0].asset.id === '{PUMP_ID}' && p[0].status === 'Active'"
           f" && p[0].sequence === 1 && p[0].comment === {PUMP_COMMENT!r}; }})")
BV_LINKS = f"(w => (w.assets || []).filter(a => a && a.asset && a.asset.id === '{BV_ID}'))"
CF = ("(w => JSON.stringify([(w.condition || []).map(c => c.id).sort(),"
      " (w.failures || []).map(f => f.id).sort()]))")

PREMISE_P = (f"(w => {STAGE_OK}(w) && {PUMP_OK}(w) && w.assets.length === 1 && {BV_LINKS}(w).length === 0\n"
             f"  && (sessionStorage.setItem('{K_CF}', {CF}(w)), true))(data.workStage)")
ADDED_P = (f"(w => {STAGE_OK}(w) && {PUMP_OK}(w) && w.assets.length === 2 && {BV_LINKS}(w).length === 1)"
           "(data.workStage)")
GONE_P = (f"(w => {STAGE_OK}(w) && {PUMP_OK}(w) && w.assets.length === 1 && {BV_LINKS}(w).length === 0\n"
          f"  && sessionStorage.getItem('{K_CF}') === {CF}(w))(data.workStage)")

# ---- DOM: the Assets tab's active panel and its rows --------------------------------------------
ASSETS_PANEL_JS = (
    "const tabEl = document.querySelector('[role=\"tab\"][aria-selected=\"true\"], [role=\"tab\"][data-active]');\n"
    "if (!tabEl || (tabEl.textContent || '').trim() !== 'Assets') return false;\n"
    "const p = tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;\n"
    "if (!p) return false;\n"
    "const rows = [...p.querySelectorAll('.mantine-Accordion-item')];\n"
    "const named = n => rows.filter(r => { const c = r.querySelector('.mantine-Accordion-control');\n"
    "  return c && (c.textContent || '').includes(n); });\n")

PICKER_JS = (
    "const m = [...document.querySelectorAll('.mantine-Modal-content')].find(x => x.querySelector('input[name=\"asset-search\"]'));\n"
    "if (!m) return false;\n"
    "const items = [...m.querySelectorAll('.mantine-Accordion-item')];\n"
    f"const bv = items.filter(i => ((i.querySelector('.mantine-Accordion-control') || {{}}).textContent || '').trim() === '{BV}');\n"
    "const btn = [...m.querySelectorAll('button')].find(b => /^Add \\d+ Asset\\(s\\)$/.test((b.textContent || '').trim()));\n"
    "const cb = bv.length === 1 ? bv[0].querySelector('input[type=\"checkbox\"]') : null;\n"
    "if (!cb || !btn) return false;\n")

STASH_JS = (f"if (sessionStorage.getItem('{K_PREV}') === null)\n"
            f"  sessionStorage.setItem('{K_PREV}', JSON.stringify(sessionStorage.getItem('asset_lookup_query')));\n"
            "return true;")
RESTORE_QUERY_JS = (f"const raw = sessionStorage.getItem('{K_PREV}');\n"
                    "if (raw === null) return true;\n"
                    "const prev = JSON.parse(raw);\n"
                    "if (prev === null) sessionStorage.removeItem('asset_lookup_query');\n"
                    "else sessionStorage.setItem('asset_lookup_query', prev);\n"
                    f"sessionStorage.removeItem('{K_PREV}');\n"
                    "return sessionStorage.getItem('asset_lookup_query') === prev;")

GUARD_JS = (ASSETS_PANEL_JS +
            f"if (sessionStorage.getItem('{K_PREMISE}') !== '1') return false;\n"
            f"const mine = named('{BV}');\n"
            "if (rows.length !== 2 || mine.length !== 1) return false;\n"
            f"if ((mine[0].querySelector('.mantine-Accordion-control').textContent || '').includes('{PUMP}')) return false;\n"
            "const panel = mine[0].querySelector('.mantine-Accordion-panel');\n"
            "const gears = panel ? [...panel.querySelectorAll('[aria-label=\"Menu\"]')] : [];\n"
            "if (gears.length !== 1) return false;\n"
            "gears[0].click();\nreturn true;")

BACKSTOP_JS = (
    f"const K = '{K_NET}';\n"
    f"if (sessionStorage.getItem('{K_PREMISE}') !== '1') return true;   // this run never proved it absent: touch nothing\n"
    "const st = sessionStorage.getItem(K);\n"
    "if (st === 'done') return true;\n"
    "if (st === 'asking') return false;\n"
    "sessionStorage.setItem(K, 'asking');\n"
    "const post = body => window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',\n"
    "  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' }, body: JSON.stringify(body) });\n"
    f"post({{ query: {LINKS_Q!r}, variables: {{ id: '{FIXTURE_ID}' }} }})\n"
    "  .then(r => r.json())\n"
    "  .then(j => {\n"
    "    const w = j && j.data && j.data.workStage;\n"
    f"    const ids = w ? (w.assets || []).filter(a => a && a.asset && a.asset.id === '{BV_ID}' && a.id !== '{PUMP_LINK}').map(a => a.id) : [];\n"
    "    if (ids.length !== 1) { sessionStorage.setItem(K, 'done'); return; }\n"
    "    sessionStorage.setItem(K + ':sent', ids[0]);\n"
    f"    return post({{ query: {REMOVE_M!r}, variables: {{ ids: ids, parentId: '{FIXTURE_ID}' }} }})\n"
    "      .then(() => sessionStorage.setItem(K, 'done'));\n"
    "  })\n"
    "  .catch(() => sessionStorage.setItem(K, 'done'));\n"
    "return false;")

steps = work_cache_warm() + [
    go(WO_URL, "the fixture work order"),
    step("wait", "Let the detail view begin rendering", {"value": 3}),
    step("assertElementPresent", "GATE: the detail data arrived (tab strip)",
         {"element": xpath_el(WO_URL, '(//*[@role="tab"])[1]')}, timeout=60),
    step("click", 'Open the "Assets" tab', {"element": xpath_el(WO_URL, ASSETS_TAB)}, timeout=30),
    step("assertElementPresent", '"Assets" is now the active tab',
         {"element": xpath_el(WO_URL, f'{ASSETS_TAB}[@data-active="true"]')}, timeout=30),
] + server_assert(
    f"PREMISE (server): the stage links ONLY {PUMP} (its link at rest), no {BV}; rest address/x/y, `Ready` "
    "— and record its condition/failure ids",
    "__dd354_links", LINKS_Q, {"id": FIXTURE_ID}, PREMISE_P) + [
    jsassert(f"PREMISE PASSED — mark this run (the backstop acts only on a run that proved {BV} absent first)",
             f"sessionStorage.setItem('{K_PREMISE}', '1');\nreturn sessionStorage.getItem('{K_PREMISE}') === '1';",
             timeout=15),
    jsassert("STASH the persisted Asset Lookup query — the picker's search writes `asset_lookup_query`",
             STASH_JS, timeout=15),
    jsassert(f"The Assets tab lists ONE row — {PUMP}'s — and no {BV}",
             ASSETS_PANEL_JS + f"return rows.length === 1 && named('{PUMP}').length === 1 && named('{BV}').length === 0;",
             timeout=60),

    # ---- add the existing asset ---------------------------------------------------------------
    step("click", "Open `Add Asset`", {"element": xpath_el(WO_URL, ADD_ASSET)}, timeout=30),
    step("assertElementPresent", "The add modal offers `Add Existing Asset`",
         {"element": xpath_el(WO_URL, ADD_EXISTING)}, timeout=30),
    step("click", "Choose `Add Existing Asset`", {"element": xpath_el(WO_URL, ADD_EXISTING)}, timeout=30),
    step("assertElementPresent", "The picker's search box mounted (in the modal)",
         {"element": xpath_el(WO_URL, SEARCH)}, timeout=60),
    # Measured on local replay 1: the focus click was intercepted by AssetLookup's
    # `mantine-LoadingOverlay-overlay` (`<Loading visible={loading && !data}>`) while its first query ran.
    # Datadog would click the overlay, not the input - so gate on the load having FINISHED (positive:
    # rows or `No Results` rendered, and no overlay) before touching the box.
    jsassert("The picker finished its first load — no LoadingOverlay over it, and it rendered rows or `No Results`",
             "const m = [...document.querySelectorAll('.mantine-Modal-content')].find(x => x.querySelector('input[name=\"asset-search\"]'));\n"
             "if (!m) return false;\n"
             "if (m.querySelector('.mantine-LoadingOverlay-overlay, .mantine-LoadingOverlay-root')) return false;\n"
             "return m.querySelectorAll('.mantine-Accordion-item').length > 0 || /No Results/.test(m.textContent || '');",
             timeout=60),
    step("click", "Focus the picker's search box", {"element": xpath_el(WO_URL, SEARCH)}, timeout=30),
    step("pressKey", "Select any persisted query first (typeText APPENDS — trap 17)",
         {"value": "a", "modifiers": ["Control"]}),
    step("typeText", f"Search for {BV}", {"value": BV, "element": xpath_el(WO_URL, SEARCH)}, timeout=30),
    step("pressKey", "Submit the search (Enter)", {"value": "Enter"}),
    jsassert(f"The picker lists exactly one `{BV}` row, UNCHECKED, and the footer reads `Add 0 Asset(s)`",
             PICKER_JS + "return !cb.checked && btn.textContent.trim() === 'Add 0 Asset(s)';", timeout=60),
    step("click", f"Check {BV}'s box", {"element": xpath_el(WO_URL, PICK_BOX)}, timeout=30),
    jsassert(f"{BV} is CHECKED and the footer reads `Add 1 Asset(s)`",
             PICKER_JS + "return cb.checked && btn.textContent.trim() === 'Add 1 Asset(s)';", timeout=30),
    step("click", "Click `Add 1 Asset(s)`", {"element": xpath_el(WO_URL, ADD_ONE)}, timeout=30),
    step("assertPageContains", "The `Asset added to workstage!` toast (optional: transient)",
         {"value": "Asset added to workstage!"}, optional=True, timeout=10),
    jsassert("The picker closed and the page is still alive (it closes on click — not the proof)",
             "if (!document.querySelectorAll('[role=tab]').length) return false;\n"
             "return !document.querySelector('input[name=\"asset-search\"]');", timeout=30),
] + server_assert(
    f"⭐ SERVER: the stage now links {BV} beside {PUMP} (untouched); address/x/y unchanged — asked over /graphql",
    "__dd354_links", LINKS_Q, {"id": FIXTURE_ID}, ADDED_P) + [
    jsassert(f"The Assets tab now lists {BV} beside {PUMP}",
             ASSETS_PANEL_JS + f"return rows.length === 2 && named('{BV}').length === 1 && named('{PUMP}').length === 1;",
             timeout=60),
    jsassert("GATE (🐞 crash workaround): the Asset schema is cached — every row renders its geolocate control "
             "— so expanding a row cannot hit the AssetLookupDetails crash",
             ASSETS_PANEL_JS + "return rows.length === 2 && rows.every(r => !!r.querySelector('[data-icon=\"location-crosshairs\"]'));",
             timeout=60),

    # ---- remove THAT link (owner-sanctioned) ------------------------------------------------------
    step("click", f"Expand {BV}'s row by its chevron", {"element": xpath_el(WO_URL, CHEVRON)}, timeout=30),
    jsassert(f"{BV}'s row expanded — its panel holds exactly one gear, and the page did not crash",
             ASSETS_PANEL_JS + f"const mine = named('{BV}');\n"
             "const panel = mine.length === 1 ? mine[0].querySelector('.mantine-Accordion-panel') : null;\n"
             "return !!panel && panel.querySelectorAll('[aria-label=\"Menu\"]').length === 1;", timeout=30),
    jsassert(f"🛑 GUARD + open its gear: only on a run whose premise passed, with exactly two rows, exactly one "
             f"named {BV} (not {PUMP}), holding exactly one gear", GUARD_JS, timeout=30),
    step("assertElementPresent", "The gear menu offers `Delete Item`",
         {"element": xpath_el(WO_URL, DELETE_ITEM)}, timeout=30),
    step("click", f"Click `Delete Item` — on {BV}'s link", {"element": xpath_el(WO_URL, DELETE_ITEM)}, timeout=30),
    step("assertPageContains", "The confirmation opened", {"value": CONFIRM_TEXT}, timeout=30),
    step("click", 'Confirm: "Yes"', {"element": xpath_el(WO_URL, YES)}, timeout=30),
] + server_assert(
    f"⭐ SERVER: no {BV} link remains; the {PUMP} link, the condition/failure ids and address/x/y are untouched",
    "__dd354_links", LINKS_Q, {"id": FIXTURE_ID}, GONE_P) + [
    jsassert(f"The Assets tab lists only {PUMP} again",
             ASSETS_PANEL_JS + f"return rows.length === 1 && named('{PUMP}').length === 1 && named('{BV}').length === 0;",
             timeout=30),

    # ---- always: put the session and the fixture back -----------------------------------------------
    step("pressKey", "Escape — leave no menu or modal open", {"value": "Escape"}, always=True),
    jsassert("RESTORE the persisted Asset Lookup query to what it was before the picker's search",
             RESTORE_QUERY_JS, always=True, timeout=15),
    jsassert(f"BACKSTOP: on a run whose premise passed, if exactly one {BV} link remains, remove THAT link id "
             f"(never {PUMP}'s) over /graphql", BACKSTOP_JS, always=True, timeout=45),
    jsassert("Remove the backstop's sessionStorage keys",
             f"['{K_NET}', '{K_NET}:sent'].forEach(k => sessionStorage.removeItem(k));\nreturn true;",
             always=True, timeout=15),
] + server_assert(
    f"⭐ AT REST (server): only {PUMP}'s link (at rest), the same condition/failure ids, rest address/x/y, `Ready`",
    "__dd354_links", LINKS_Q, {"id": FIXTURE_ID}, GONE_P, always=True) + [
    jsassert("Remove this test's sessionStorage keys",
             f"['{K_PREMISE}', '{K_CF}'].forEach(k => sessionStorage.removeItem(k));\nreturn true;",
             always=True, timeout=15),
]

write(test(
    "MOB.354_Work_Asset_Add_Remove",
    f"`MOB.354` **Add an existing asset from the Assets tab, prove it, remove THAT link** — `{BV}` on the\n"
    "fixture work order (`MOBILE_WORK_ADD_ASSET`, then `REMOVE_WORK_STAGE_ASSET_LINKS`).\n"
    "- The picker closes on click and the remove edits the cache before a fire-and-forget mutation, so\n"
    "  both ends are proved over `/graphql` (trap 6).\n"
    f"- 🛑 Owner-sanctioned delete (2026-09-15) of this run's link only: the premise proves `{PUMP}` is the\n"
    "  only link; the guard shares a step with the gear click; the server then holds Pump's link (same\n"
    "  id/status/sequence/comment), the same condition/failure ids and the rest address/x/y.\n"
    f"- `always`: the persisted `asset_lookup_query` is put back; a backstop removes a leftover `{BV}` link\n"
    "  by its id (only on a run whose premise passed); the last read requires the fixture at rest.\n"
    "- 🐞 Bug evidence: expanding an asset row before the Asset schema is cached crashes the page\n"
    "  (`AssetLookupDetails/index.tsx:43`); the expand is gated on the rows' geolocate controls.",
    steps,
    tags=["Mobile", "env:dev", "Work Orders", "self-cleaning"],
))
print("wrote MOB.354 (add an existing asset, remove that link, self-cleaning)")
