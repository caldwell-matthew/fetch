"""Build MOB.625 - the Asset Collector's sort, including `Collected By Me` (checklist 🟢 #14).

WHAT THE SOURCE SAYS (`AssetCollector/index.tsx:132-137`, `utils/filterAssets.ts:searchSort`)
  `SortDropDown` offers `Created At ▲/▼`, `Name ▲/▼` and `Collected By Me`. The list is sorted
  CLIENT-SIDE over the loaded pages, and:

    Created At   `new Date(a) - new Date(b)`, flipped for DESC
    Name         `String.localeCompare`, flipped for DESC
    createdBy    🛑 NOT A SORT - `filter(asset => asset.createdBy?.id === session.me.id)`;
                 direction is ignored and the order is the server's (createdAt DESC)

⭐ THREE PROOFS, NONE HARDCODING AN ORDER (trap 29)
  1. NARROW to this suite's own residue - `DD SYNTHETIC MOBILE` rows, which `MOB.600` creates
     under the test account - so the list is small enough to render whole (the list is
     `Virtuoso`, trap 22/30) and the data is ours, not somebody else's.
  2. CREATED AT: with no sort chosen, the list is in the SERVER's order (createdAt DESC). So
     `Created At ▼` must equal that default order and `Created At ▲` its reverse - compared on
     the rows present in both renders (trap 30), which proves the date sort without parsing
     `convertDatetime`'s format.
  3. NAME: the rendered names equal themselves sorted with `localeCompare` (reversed for ▼).
  4. COLLECTED BY ME, on the WIDE list: before it, the rendered window shows rows by >= 2
     creators (the premise that the filter has something to remove - `soft`, it is data);
     after it, every rendered row has ONE creator, and a `DD SYNTHETIC MOBILE` row is among
     them - so that creator is the test account, identified without writing a person's name.

🟡 THE PICK LEAKS INTO ASSET VERIFICATION (bugs §38)
  The collector passes `model="MobileJob"`, so every pick is written to
  `sessionStorage['mobile-MobileJob-sort']` - the key `AssetVerification/index.tsx:33-40` reads
  on mount as the JOB LIST's sort. An OPTIONAL sentinel picks `Name ▼` here, opens the job list
  and reads its sort picker: `Mobile Job Name ▼`, a choice nobody made on that screen (its
  default is `Created At ▼`). A fix turns the sentinel red without failing the test.

RESTORE: the collector's own sort is component state and dies with the page, but the leaked
key does not. Its prior value is stashed in sessionStorage at the start (window vars do not
survive the job-list navigation) and put back `always`, asserted.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, step, xpath_el, go, test, write, jsassert  # noqa: E402

COLLECTOR_URL = BASE + "/asset-collector"
AV_URL = BASE + "/asset-verify"
MARKER = "DD SYNTHETIC MOBILE"          # MOB.600's own residue: created by the test account
JOB_KEY = "mobile-MobileJob-sort"
STASH = "__dd625_prevJobSort"           # test-owned, removed by the restore

SORT_BTN = ('//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up"'
            ' or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ")'
            ' or contains(concat(" ", normalize-space(@class), " "),'
            ' " fa-arrow-down-arrow-up ")]]')                  # = build_sort_verify_tests
SORT_SELECT = ('//*[contains(concat(" ", normalize-space(@class), " "),'
               ' " mantine-Modal-content ")][contains(., "Sort Criteria")]'
               '//input[contains(concat(" ", normalize-space(@class), " "),'
               ' " mantine-Select-input ")]')

# Each row: the NAME (the control's first Highlight - `index.tsx:181`) and the `creator, date`
# line (the label's LAST child - `index.tsx:203`). The key joins both, so two assets with one
# name are still two rows. A row whose parts cannot be read fails the step (trap 5).
ROWS_JS = (
    "const rows = [...document.querySelectorAll('[class*=\"mantine-Accordion-item\"]')].map(it => {\n"
    "  const c = it.querySelector('[class*=\"mantine-Accordion-control\"]');\n"
    "  if (!c) return null;\n"
    "  const nm = c.querySelector('[class*=\"mantine-Highlight-root\"]');\n"
    "  const lab = c.querySelector('[class*=\"mantine-Accordion-label\"]') || c;\n"
    "  const last = lab.lastElementChild;\n"
    # The creator line is a Text with no Highlight in it; the name block and the search-match
    # line both carry one. Without this, a missing creator line would read the name block's
    # own ", " (descriptions have commas) as a creator - the bench caught exactly that.
    "  const by = last && /mantine-Text-root/.test(last.className)\n"
    "    && !last.querySelector('[class*=\"mantine-Highlight-root\"]') ? last : null;\n"
    "  const name = nm ? (nm.textContent || '').trim() : '';\n"
    "  const line = by ? (by.textContent || '').trim() : '';\n"
    "  const i = line.indexOf(', ');\n"
    "  return name && i > 0 ? { name, creator: line.slice(0, i), key: name + '\\u0001' + line } : null;\n"
    "});\n"
    "if (!rows.length || rows.some(r => !r)) return false;\n")


def type_search(value, label):
    js = ("const el = document.querySelector('input[placeholder=\"Find Asset(s)\"]');\n"
          "if (!el) return false;\n"
          "const view = el.ownerDocument.defaultView;\n"
          "const setter = Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value').set;\n"
          f"setter.call(el, '{value}');\n"
          "el.dispatchEvent(new view.Event('input', { bubbles: true }));\n"
          f"return el.value === '{value}';")
    return [jsassert(f"{label}", js, timeout=30),
            step("wait", "Let the debounced search (300 ms) apply", {"value": 2})]


def sort_by(url, label, always=False, optional=False):
    kw = dict(always=always, optional=optional)
    return [
        step("click", "Open the sort dropdown", {"element": xpath_el(url, SORT_BTN)},
             timeout=30, **kw),
        step("wait", "Wait for the sort modal", {"value": 2}, **kw),
        step("click", "Open the sort options", {"element": xpath_el(url, SORT_SELECT)},
             timeout=30, **kw),
        step("wait", "Wait for the options", {"value": 1}, **kw),
        step("click", f'Pick "{label}"',
             {"element": xpath_el(url, f'//*[@role="option"][normalize-space(.)="{label}"]')},
             timeout=30, **kw),
        step("wait", "Let the list re-order", {"value": 2}, **kw),
    ]


def vs_default(reverse):
    """The rows present in BOTH this render and the default render come out in the default's
    order (▼) or its reverse (▲). Fewer than 2 in common fails (trap 30's floor)."""
    return (ROWS_JS +
            "const def = window.__ddDefault || [];\n"
            "const now = rows.map(r => r.key);\n"
            "const inNow = new Set(now), inDef = new Set(def);\n"
            "const d = def.filter(k => inNow.has(k)), n = now.filter(k => inDef.has(k));\n"
            "if (d.length < 2) return false;\n"
            + ("d.reverse();\n" if reverse else "") +
            "return n.join('\\u0000') === d.join('\\u0000');")


def by_name(desc):
    return (ROWS_JS +
            "const names = rows.map(r => r.name);\n"
            "if (names.length < 2) return false;\n"
            "const sorted = [...names].sort((a, b) => a.localeCompare(b));\n"
            + ("sorted.reverse();\n" if desc else "") +
            "return JSON.stringify(names) === JSON.stringify(sorted);")


steps = [
    go(COLLECTOR_URL, "the Asset Collector"),
    step("wait", "Let the collected list load", {"value": 5}),
    jsassert("The collected list rendered rows, each with a name and a creator line",
             ROWS_JS + "return rows.length >= 2;", timeout=30),
    jsassert(f"STASH: remember `{JOB_KEY}` as it was, so the restore can put it back",
             f"if (sessionStorage.getItem('{STASH}') === null)\n"
             f"  sessionStorage.setItem('{STASH}', JSON.stringify({{ v: sessionStorage.getItem('{JOB_KEY}') }}));\n"
             f"return sessionStorage.getItem('{STASH}') !== null;", timeout=30),
    jsassert("PREMISE (data): the unfiltered window shows rows by at least 2 creators — "
             "`Collected By Me` has something to remove",
             ROWS_JS +
             "window.__ddCreators = [...new Set(rows.map(r => r.creator))];\n"
             "return window.__ddCreators.length >= 2;", soft=True, timeout=30),

    # ---- narrow to our own residue ---------------------------------------------------------
] + type_search(MARKER, f'Search "{MARKER}" — this suite\'s own residue') + [
    jsassert("NARROWED: 2 to 15 rows, every one ours, all distinct — and CAPTURE the "
             "server's default order (no sort chosen yet)",
             ROWS_JS +
             f"if (rows.length < 2 || rows.length > 15) return false;\n"
             f"if (!rows.every(r => r.name.includes('{MARKER}'))) return false;\n"
             "const keys = rows.map(r => r.key);\n"
             "if (new Set(keys).size !== keys.length) return false;\n"
             "window.__ddDefault = keys;\n"
             "return true;", timeout=30),
] + sort_by(COLLECTOR_URL, "Created At ▲") + [
    jsassert("⭐ CREATED AT ▲: exactly the reverse of the server's createdAt-DESC order",
             vs_default(reverse=True), soft=True, timeout=30),
] + sort_by(COLLECTOR_URL, "Created At ▼") + [
    jsassert("⭐ CREATED AT ▼: the server's own order again", vs_default(reverse=False),
             soft=True, timeout=30),
] + sort_by(COLLECTOR_URL, "Name ▲") + [
    jsassert("⭐ NAME ▲: the rendered names are their own `localeCompare` order",
             by_name(desc=False), soft=True, timeout=30),
] + sort_by(COLLECTOR_URL, "Name ▼") + [
    jsassert("⭐ NAME ▼: exactly that order reversed", by_name(desc=True), soft=True, timeout=30),

    # ---- Collected By Me, on the wide list -------------------------------------------------
] + type_search("", "Clear the search") + sort_by(COLLECTOR_URL, "Collected By Me") + [
    jsassert("⭐ COLLECTED BY ME: every rendered row has ONE creator, it was among the "
             "creators before, and one of those rows is ours — so it is the test account",
             ROWS_JS +
             "const creators = [...new Set(rows.map(r => r.creator))];\n"
             "if (creators.length !== 1) return false;\n"
             "if (!(window.__ddCreators || []).includes(creators[0])) return false;\n"
             f"return rows.some(r => r.name.includes('{MARKER}'));", soft=True, timeout=30),
    jsassert("…and it REMOVED rows: fewer creators than before the filter",
             ROWS_JS +
             "return (window.__ddCreators || []).length > new Set(rows.map(r => r.creator)).size;",
             soft=True, timeout=30),

    # ---- §38: the pick leaks into the AV job list (optional) -------------------------------
] + sort_by(COLLECTOR_URL, "Name ▼", optional=True) + [
    jsassert(f"SENTINEL (bugs §38): the collector's pick was written to `{JOB_KEY}` — the "
             "Asset Verification JOB LIST's key",
             f"let v = null; try {{ v = JSON.parse(sessionStorage.getItem('{JOB_KEY}') || 'null'); }} catch (e) {{}}\n"
             "return !!v && v.id === 'name_DESC';", optional=True, timeout=15),
    go(AV_URL, "the Asset Verification job list"),
    step("wait", "Let the job list mount (it reads the key on mount)", {"value": 5},
         optional=True),
    step("click", "Open the job list's sort dropdown", {"element": xpath_el(AV_URL, SORT_BTN)},
         optional=True, timeout=30),
    step("wait", "Wait for the sort modal", {"value": 2}, optional=True),
    jsassert("SENTINEL (bugs §38): the JOB LIST now sorts by a Name ▼ nobody chose on it — "
             "its default is `Created At ▼`. Red here means it was fixed: rewrite this step",
             "const m = [...document.querySelectorAll('[class*=\"mantine-Modal-content\"]')]\n"
             "  .find(x => (x.textContent || '').includes('Sort Criteria'));\n"
             "const inp = m && m.querySelector('input[class*=\"mantine-Select-input\"]');\n"
             "const v = inp ? inp.value.trim() : '';\n"
             "return /Name/.test(v) && v.endsWith('▼') && !/Created At/.test(v);",
             optional=True, timeout=15),
    step("pressKey", "Close the sort modal", {"value": "Escape"}, optional=True),

    # ---- restore ---------------------------------------------------------------------------
    jsassert(f"RESTORE: put `{JOB_KEY}` back as it was before this test",
             f"const raw = sessionStorage.getItem('{STASH}');\n"
             "if (raw === null) return false;\n"
             "const prev = JSON.parse(raw).v;\n"
             f"if (prev === null) sessionStorage.removeItem('{JOB_KEY}');\n"
             f"else sessionStorage.setItem('{JOB_KEY}', prev);\n"
             f"sessionStorage.removeItem('{STASH}');\n"
             "window.__ddRestoredJobSort = prev;\n"
             "return true;", always=True, timeout=30),
    jsassert(f"RESTORED: `{JOB_KEY}` holds its original value and the stash is gone",
             f"return sessionStorage.getItem('{STASH}') === null\n"
             f"  && sessionStorage.getItem('{JOB_KEY}') === (window.__ddRestoredJobSort ?? null);",
             always=True, timeout=30),
]

write(test(
    "MOB.625_Collector_List_Sort",
    "`MOB.625` **The Asset Collector's sort, including `Collected By Me`** — checklist 🟢 #14.\n"
    f"- Narrowed to this suite's own `{MARKER}` rows (the list is virtualised, and the data\n"
    "  is ours). `Created At ▼` equals the server's default order and `▲` its reverse, on the\n"
    "  rows common to both renders; `Name ▲/▼` equal their own `localeCompare` order. No order\n"
    "  is hardcoded (trap 29).\n"
    "- ⭐ **`Collected By Me` is a FILTER, not a sort** (`searchSort`): on the wide list every row\n"
    "  is left with one creator — the creator of our own rows — and creators were removed.\n"
    "- 🟡 **bugs §38**: the collector writes its pick to `mobile-MobileJob-sort`, which the Asset\n"
    "  Verification job list reads as ITS sort. An OPTIONAL sentinel shows the job list adopting\n"
    "  `Name ▼`. The key is stashed first and restored `always`.\n"
    "- READ-ONLY: only a sort and a search are chosen.",
    steps,
    ["Mobile", "env:dev", "Asset Collector", "read-only"],
))
print("wrote MOB.625 (collector sort)")
