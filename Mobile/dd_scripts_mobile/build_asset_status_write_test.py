"""Build MOB.353_Work_Asset_Status_Write - `Mark as …` on a work-order asset WRITES, restored to a fixed status.

WHY THIS EXISTS
  `MOB.347` opens the asset status menu on the fixture's Assets tab, asserts its `Mark as …` items
  and never clicks one, because each item writes instantly with no confirm. The owner authorised the
  write on 2026-09-15 as a SELF-RESTORING test.

WHAT THE SOURCE SAYS (`WorkOrders/components/ui/AssetStatus.tsx:71-100, 106-141`)
  `AssetStatusIcon` is a Mantine Menu on `Progress: <Badge>`; its items (the five statuses minus the
  current one) call `applyStatus({ status })` straight from `onClick`. `applyStatus` writes the CACHE
  first (`cache.modify`) and only then sends `UPDATE_WORK_STAGE_ASSET { id, data: { status } }`
  (`errorPolicy: 'all'`; on errors `update()` rolls the cache back). So the badge flipping proves only
  the cache write, and a reload would read the persisted cache (trap 6) - the proof is a `/graphql`
  read of the link row. `sequence`/`comment` are sent as `undefined`, which JSON drops, so the server
  receives the status alone; the final read proves sequence and comment untouched.
  Server: `updateWorkStageAsset` is `Common.updateRecordById('WorkStageAsset', …)`; the model's
  `status` enum is `Active | Completed | Not Completed | Canceled` and nothing on the server reacts to
  a link's status (no hook, no work-stage status change).
  The badge's wrapper stops propagation (`Assets/index.tsx:131-139`), so clicking it never toggles the
  accordion row - which matters: expanding a row on a cold Asset-schema cache crashes the page
  (`AssetLookupDetails/index.tsx:43`, see MOB.354's docstring), and this test never expands one.

FIXTURE (read over the API 2026-09-15)
  link `AE09h8JhBBhMtd1wIs98lQ` - `Pump 0102` on work order `EYRpYJ9QYdQ1JFF10JtB0Q`, the stage's only
  asset: status `Active`, sequence 1, comment `Chemical dosing pump, …`. Rest status = `Active`.
  Written: `Completed`. Who reads it: `MOB.347` asserts the badge is one of the five labels and the
  menu offers <= 4 items - true in every state - so a mid-run death would not break it; the restore is
  still `always`.

RESTORE - three legs, all `alwaysExecute`
  1. the UI: `Mark as Active`, proved over /graphql;
  2. a backstop: ONE step reads the link and, only if its status is not `Active`, sends
     `updateWorkStageAsset(id, { status: 'Active' })`;
  3. the final server read: status `Active`, sequence 1, the fixed comment, the stage still `Ready`.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write,  # noqa: E402
                      jsassert, server_assert, work_cache_warm)

FIXTURE_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
WO_URL = f"{BASE}/work/{FIXTURE_ID}"
LINK_ID = "AE09h8JhBBhMtd1wIs98lQ"
ASSET = "Pump 0102"
REST_STATUS, WRITE_STATUS = "Active", "Completed"
REST_SEQUENCE = 1
REST_COMMENT = ("Chemical dosing pump, model PDM 2000, plastic housing with digital control panel, "
                "horizontal mount.")

ASSETS_TAB = '//*[@role="tab"][normalize-space(.)="Assets"]'
PROGRESS = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Text-root ")]'
            '[starts-with(normalize-space(.), "Progress:")]')
MENU_ITEM = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")]'
             '[normalize-space(.)="{}"]')

LINK_Q = ("query($id: ID!) { workStage(id: $id) { id status "
          "assets { id status sequence comment asset: assetId { id name } } } }")
UPDATE_M = ("mutation($id: ID!, $data: JSON!) { "
            "updateWorkStageAsset(id: $id, data: $data) { id } }")


def link_is(status, exact=False):
    """JS predicate over `data`: the fixture link holds `status` (and, exact, the rest sequence/comment)."""
    extra = (f" && l.sequence === {REST_SEQUENCE} && l.comment === {REST_COMMENT!r}" if exact else "")
    return ("(d => { const w = d && d.workStage; const l = w && (w.assets || [])"
            f".find(a => a && a.id === '{LINK_ID}');\n"
            f"  return !!l && l.asset && l.asset.name === '{ASSET}' && l.status === {status!r}{extra}; }})")


# The Assets tab's ACTIVE panel, its asset rows, and the one row that must be Pump 0102's.
ROW_JS = (
    "const tabEl = document.querySelector('[role=\"tab\"][aria-selected=\"true\"], [role=\"tab\"][data-active]');\n"
    "if (!tabEl || (tabEl.textContent || '').trim() !== 'Assets') return false;\n"
    "const p = tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;\n"
    "if (!p) return false;\n"
    "const rows = [...p.querySelectorAll('.mantine-Accordion-item')];\n"
    "const mine = rows.filter(r => { const c = r.querySelector('.mantine-Accordion-control');\n"
    f"  return c && (c.textContent || '').includes('{ASSET}'); }});\n"
    "const target = mine.length === 1 ? mine[0].querySelector('[aria-haspopup=\"menu\"]') : null;\n"
    "const badge = target ? (target.querySelector('.mantine-Badge-label') || {}).textContent : null;\n")


def badge_js(label):
    return ROW_JS + f"return rows.length === 1 && !!target && (badge || '').trim() === {label!r};"


def guard_open_js(frm, to):
    return (ROW_JS +
            f"if (rows.length !== 1 || !target || (badge || '').trim() !== {frm!r}) return false;\n"
            "if (target.getAttribute('aria-expanded') !== 'true') return false;\n"
            "const items = [...document.querySelectorAll('.mantine-Menu-dropdown .mantine-Menu-item')]\n"
            "  .map(i => (i.textContent || '').trim());\n"
            f"return items.includes('Mark as {to}') && !items.includes('Mark as {frm}');")


NET_KEY = "__dd353_net"
BACKSTOP_JS = (
    f"const K = '{NET_KEY}';\n"
    "const st = sessionStorage.getItem(K);\n"
    "if (st === 'done') return true;\n"
    "if (st === 'asking') return false;\n"
    "sessionStorage.setItem(K, 'asking');\n"
    "const post = body => window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',\n"
    "  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' }, body: JSON.stringify(body) });\n"
    f"post({{ query: {LINK_Q!r}, variables: {{ id: '{FIXTURE_ID}' }} }})\n"
    "  .then(r => r.json())\n"
    "  .then(j => {\n"
    f"    if ({link_is(REST_STATUS)}(j && j.data)) {{ sessionStorage.setItem(K, 'done'); return; }}\n"
    "    sessionStorage.setItem(K + ':sent', '1');\n"
    f"    return post({{ query: {UPDATE_M!r}, variables: {{ id: '{LINK_ID}', data: {{ status: '{REST_STATUS}' }} }} }})\n"
    "      .then(() => sessionStorage.setItem(K, 'done'));\n"
    "  })\n"
    "  .catch(() => sessionStorage.setItem(K, 'done'));\n"
    "return false;")


def mark(frm, to, always=False):
    a = dict(always=always)
    return [
        step("pressKey", "Escape any open menu first", {"value": "Escape"}, **a),
        step("wait", "Let it close", {"value": 1}, **a),
        jsassert(f"The Assets tab shows ONE row — {ASSET}'s — with the badge `{frm}`", badge_js(frm),
                 timeout=45, **a),
        step("click", f"Open {ASSET}'s status menu (the `Progress:` badge — its wrapper stops propagation, "
             "so the row never expands)", {"element": xpath_el(WO_URL, f"({PROGRESS})[1]")}, timeout=30, **a),
        jsassert(f"🛑 GUARD: the open menu is {ASSET}'s (its target is expanded, the badge reads `{frm}`) "
                 f"and offers `Mark as {to}` — the next click writes with no confirm",
                 guard_open_js(frm, to), timeout=30, **a),
        step("click", f"Click `Mark as {to}` (writes immediately)",
             {"element": xpath_el(WO_URL, MENU_ITEM.format(f"Mark as {to}"))}, timeout=30, **a),
        step("assertPageContains", "The `Fields updated` toast (optional: transient)",
             {"value": "Fields updated"}, optional=True, timeout=10, **a),
        jsassert(f"The badge now reads `{to}` (the CACHE write — not the proof)", badge_js(to),
                 timeout=30, **a),
    ]


steps = work_cache_warm() + [
    go(WO_URL, "the fixture work order"),
    step("wait", "Let the detail view begin rendering", {"value": 3}),
    step("assertElementPresent", "GATE: the detail data arrived (tab strip)",
         {"element": xpath_el(WO_URL, '(//*[@role="tab"])[1]')}, timeout=60),
    step("click", 'Open the "Assets" tab', {"element": xpath_el(WO_URL, ASSETS_TAB)}, timeout=30),
    step("assertElementPresent", '"Assets" is now the active tab',
         {"element": xpath_el(WO_URL, f'{ASSETS_TAB}[@data-active="true"]')}, timeout=30),
    step("assertElementPresent", 'FIXTURE GUARD: an asset row shows "Progress:" — showAssetStatus is ON',
         {"element": xpath_el(WO_URL, PROGRESS)}, timeout=60),
] + server_assert(
    f"PREMISE (server): {ASSET}'s link is `{REST_STATUS}`, sequence {REST_SEQUENCE}, the fixed comment; "
    "the stage is `Ready`",
    "__dd353_link", LINK_Q, {"id": FIXTURE_ID},
    f"data.workStage.status === 'Ready' && {link_is(REST_STATUS, exact=True)}(data)") + mark(
    REST_STATUS, WRITE_STATUS) + server_assert(
    f"⭐ SERVER: {ASSET}'s link is now `{WRITE_STATUS}` — asked over /graphql, not read from the cache",
    "__dd353_link", LINK_Q, {"id": FIXTURE_ID}, f"{link_is(WRITE_STATUS)}(data)") + [

    # ---- restore: the UI, to the FIXED rest status -----------------------------------------------
] + mark(WRITE_STATUS, REST_STATUS, always=True) + server_assert(
    f"⭐ RESTORED (server): the UI wrote `{REST_STATUS}` back",
    "__dd353_link", LINK_Q, {"id": FIXTURE_ID}, f"{link_is(REST_STATUS)}(data)", always=True) + [
    step("pressKey", "Escape — leave no menu open", {"value": "Escape"}, always=True),
    jsassert(f"BACKSTOP: if the link is not `{REST_STATUS}`, send `updateWorkStageAsset` with the FIXED "
             "rest status (reads first; sends nothing when the UI restore landed)", BACKSTOP_JS,
             always=True, timeout=45),
    jsassert("Remove the backstop's sessionStorage keys",
             f"['{NET_KEY}', '{NET_KEY}:sent'].forEach(k => sessionStorage.removeItem(k));\nreturn true;",
             always=True, timeout=15),
] + server_assert(
    f"⭐ AT REST (server): {ASSET}'s link is `{REST_STATUS}`, sequence {REST_SEQUENCE}, comment untouched; "
    "the stage still `Ready`",
    "__dd353_link", LINK_Q, {"id": FIXTURE_ID},
    f"data.workStage.status === 'Ready' && {link_is(REST_STATUS, exact=True)}(data)", always=True)

write(test(
    "MOB.353_Work_Asset_Status_Write",
    "`MOB.353` **`Mark as …` on a work-order asset writes** (`UPDATE_WORK_STAGE_ASSET`) — proved over\n"
    "`/graphql`, then restored to the FIXED rest status.\n"
    f"- `MOB.347` asserts the menu and never clicks. This marks `{ASSET}`'s link `{WRITE_STATUS}` and asks the\n"
    "  server — `applyStatus` writes the cache BEFORE the mutation, so the badge is not the proof (trap 6).\n"
    "- A guard in its own step checks the open menu is the one row's (`Pump 0102`, badge at the expected\n"
    "  status) right before the click, which writes with no confirm.\n"
    f"- Restore, all `alwaysExecute`: `Mark as {REST_STATUS}` proved over /graphql; a backstop sends\n"
    f"  `updateWorkStageAsset(status: {REST_STATUS})` only if the server is not at rest; the last read\n"
    f"  requires `{REST_STATUS}`, sequence {REST_SEQUENCE}, the comment untouched and the stage `Ready`.\n"
    "- Never expands the asset row (bug evidence in MOB.354: expanding on a cold Asset-schema cache crashes).",
    steps,
    tags=["Mobile", "env:dev", "Work Orders", "self-restoring"],
))
print("wrote MOB.353 (Mark as … writes, self-restoring)")
