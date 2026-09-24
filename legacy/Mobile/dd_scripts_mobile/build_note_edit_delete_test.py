"""Build MOB.361_Work_Note_Edit_Delete - add a job note, EDIT it, DELETE it; every step proved on the server.

WHAT THE SOURCE SAYS (origin/development)
  Each note card (`WorkOrders/components/Notes.tsx:38-69`) is a Paper: the note's name, its type Pill and
  the gear (`WorkCollectionMenu`, `updateMutation=UPDATE_WORKSTAGE_JOB_NOTE`,
  `deleteMutation=REMOVE_JOB_NOTE_FROM_WORKSTAGE`, `defaultValues={note}`), then the desc in a Spoiler.
  - `Edit Item` renders `WorkCollectionForm` (`ui/Form.tsx`, `formType="UPDATE"`): name, noteType and
    the tiptap desc editor, prefilled from the note. Submit is armed on `isValid && isDirty`. It calls
    `updateCollectionRecord` - `optimisticResponse`, modal closed inside `update()` - so the modal
    closing proves NOTHING (trap 6).
  - `Delete Item` → "Are you sure you want to delete this record?" → Yes calls `removeFromCollection`:
    `cache.modify` drops the card FIRST, then a fire-and-forget `mutate`. A reload renders that
    persisted cache, so a reload proves nothing either (trap 6).
  - Not bugs §42: `WorkCollectionForm` mounts its form only after `GET_SCHEMA` resolves (`if (!fields)
    return null`), so `useFormWithValidation` is built from the real fields.
  So all three writes are proved by `dd_tools.server_assert` (a same-origin `/graphql` read).

THE RECORD IS THIS RUN'S OWN - never an existing note (the fixture holds `MOB.392`'s residue notes)
  marker   typed text `DD SYNTHETIC MOBILE 361 NOTE {{ RUNID }}`, edited to
           `DD SYNTHETIC MOBILE 361 EDITED {{ RUNID }}`. `{{ RUNID }}` stays OUT of every JavaScript
           body (build_edit_tests.py: interpolation there is unproven on Datadog); the JS keys on the
           fixed prefix `DD SYNTHETIC MOBILE 361`, which no other test writes.
  premise  the SERVER holds no note with the prefix. Only then does the premise step store the note ids
           it saw (`__dd361_before`) - the run's licence to delete.
  add      the server holds exactly ONE prefix note, NEW (not in `__dd361_before`), whose desc carries
           8 digits after the marker (RUNID expanded); its id is stored (`__dd361_id`)
  edit     that id now holds the EDITED marker, and no longer the NOTE marker
  delete   🛑 GUARDED IN THE SAME STEP AS THE GEAR CLICK: `__dd361_before` exists (this run's premise
           passed, so no prefix note pre-dated the run) AND exactly one card on screen carries the
           prefix. Then `Delete Item` → Yes on that card.
  gone     the server's note ids are EXACTLY `__dd361_before` - the run's note is gone and nothing
           else was deleted.

🛑 DELETE AUTHORISED BY THE OWNER 2026-09-15 (trap 2), for the note this test adds, only. The delete leg is
`always`, so a run that went red after the add still removes its own note. That is safe only because
of the guard: the first step clears `__dd361_before`, and only a passing premise sets it - a leftover
from an earlier run stops the test at the premise, and the delete leg then clicks nothing. Clean a
leftover from desktop.

SELF-CLEANING: the server ends holding exactly the notes it held before the run.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, work_list_gate, step, xpath_el, go, test, write, jsassert, server_assert,  # noqa: E402
                      localvar)

FIXTURE_ID = "EYRpYJ9QYdQ1JFF10JtB0Q"
STAGE_URL = f"{BASE}/work/{FIXTURE_ID}"
WORK_URL = BASE + "/work"
PREFIX = "DD SYNTHETIC MOBILE 361"
ADD_TEXT = PREFIX + " NOTE {{ RUNID }}"
EDIT_TEXT = PREFIX + " EDITED {{ RUNID }}"
RUNID = localvar("RUNID", "{{ numeric(8) }}", "48120735")
K_BEFORE, K_ID = "__dd361_before", "__dd361_id"
FORM = "work-collection-form"

ADD_BTN = '//button[normalize-space(.)="Add"]'
MODAL = '//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
EDITOR = MODAL + '//div[@contenteditable="true"]'
SUBMIT = f'//button[@form="{FORM}"]'
EDIT_ITEM = ('(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")]'
             '[normalize-space(.)="Edit Item"])[1]')
DELETE_ITEM = ('(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")]'
               '[normalize-space(.)="Delete Item"])[1]')
CONFIRM_YES = (MODAL + '[.//*[contains(normalize-space(.), "Are you sure you want to delete this record?")]]'
               '//button[normalize-space(.)="Yes"]')
NOTES_Q = "query($id: ID!) { workStage(id: $id) { jobNotes { id desc } } }"


def tab(label):
    return f'//*[@role="tab"][contains(normalize-space(.), "{label}")]'


# ---- server predicates (JS expressions over `data`) ------------------------------------------------
_MINE = (f"const ns = data.workStage.jobNotes; const P = '{PREFIX}';\n"
         "  const mine = ns.filter(n => (n.desc || '').indexOf(P) !== -1);\n"
         f"  const before = JSON.parse(sessionStorage.getItem('{K_BEFORE}') || 'null');\n")
SERVER_PREMISE = ("(() => { " + _MINE +
                  "  if (mine.length !== 0) return false;\n"
                  f"  sessionStorage.setItem('{K_BEFORE}', JSON.stringify(ns.map(n => n.id).sort()));\n"
                  "  return true; })()")
SERVER_ADDED = ("(() => { " + _MINE +
                "  if (!Array.isArray(before) || mine.length !== 1 || ns.length !== before.length + 1) return false;\n"
                "  if (before.indexOf(mine[0].id) !== -1) return false;\n"
                f"  if (!/{PREFIX} NOTE \\d{{8}}/.test(mine[0].desc)) return false;\n"
                f"  sessionStorage.setItem('{K_ID}', mine[0].id);\n"
                "  return true; })()")
SERVER_EDITED = ("(() => { " + _MINE +
                 f"  const id = sessionStorage.getItem('{K_ID}');\n"
                 "  if (!Array.isArray(before) || !id || mine.length !== 1 || mine[0].id !== id || ns.length !== before.length + 1) return false;\n"
                 f"  return /{PREFIX} EDITED \\d{{8}}/.test(mine[0].desc) && mine[0].desc.indexOf('{PREFIX} NOTE') === -1; }})()")
SERVER_GONE = ("(() => { " + _MINE +
               "  if (!Array.isArray(before) || mine.length !== 0) return false;\n"
               "  const now = ns.map(n => n.id).sort();\n"
               "  return now.length === before.length && now.every((x, i) => x === before[i]); })()")

# ---- the note card: the innermost Paper in the ACTIVE tab panel carrying the prefix (Notes.tsx) -----
CARD_JS = ("const tabEl = document.querySelector('[role=\"tab\"][aria-selected=\"true\"], [role=\"tab\"][data-active]');\n"
           "const byId = tabEl && tabEl.getAttribute('aria-controls') ? document.getElementById(tabEl.getAttribute('aria-controls')) : null;\n"
           "const panel = byId || [...document.querySelectorAll('[role=\"tabpanel\"]')].find(x => x.style.display !== 'none');\n"
           "if (!panel) return false;\n"
           f"const has = el => (el.textContent || '').replace(/\\s+/g, ' ').indexOf('{PREFIX}') !== -1;\n"
           "const papers = [...panel.querySelectorAll('.mantine-Paper-root')];\n"
           "const mine = papers.filter(c => has(c) && !papers.some(o => o !== c && c.contains(o) && has(o)));\n")


def open_notes(label, always=False):
    a = dict(always=always)
    return [
        step("goToUrl", f"Navigate to the fixture work order ({label})", {"value": STAGE_URL}, **a),
        step("wait", "Let the detail view begin rendering", {"value": 2}, **a),
        step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}, timeout=30, **a),
        step("click", "Open the Notes tab", {"element": xpath_el(STAGE_URL, tab("Notes"))}, timeout=30, **a),
        step("assertElementPresent", "The Notes tab rendered its `Add` button",
             {"element": xpath_el(STAGE_URL, ADD_BTN)}, timeout=30, **a),
        step("wait", "Let the note cards render", {"value": 2}, **a),
    ]


def armed(soft=False):
    return jsassert(f"Submit is ARMED — `button[form=\"{FORM}\"]` is `type=\"submit\"` (trap 8)",
                    f"const b = document.querySelector('button[form=\"{FORM}\"]');\nreturn !!b && b.type === 'submit';",
                    timeout=30, soft=soft)


steps = [
    # 🛑 WAIT FOR THE DOWNLOADS, NOT 20s. The lookups this test types into are cache-only on the detail
    # page and only `/work`'s prefetch fills them. On Datadog 2026-09-16 a cold session left /work after
    # the fixed 20s, the prefetch never finished, and MOB.350's `AC Adapter` option never appeared.
    # `work_list_gate` polls LOADEDALL 3/3 (up to 180s) - the prefetch runs before those downloads.
    *work_list_gate(require_row=False),
    jsassert("Clear this test's sessionStorage keys — only THIS run's premise may license the delete",
             f"sessionStorage.removeItem('{K_BEFORE}');\nsessionStorage.removeItem('{K_ID}');\n"
             f"return sessionStorage.getItem('{K_BEFORE}') === null;", timeout=15),
] + open_notes("add") + server_assert(
    f"PREMISE (server): no job note carries `{PREFIX}` — so the one found after the add is THIS run's; "
    "store the note ids the server holds (the delete's licence and the cleanup's baseline)",
    "__dd361_server", NOTES_Q, {"id": FIXTURE_ID}, SERVER_PREMISE) + [
    # ---- add ---------------------------------------------------------------------------------------
    step("click", "Open the add form", {"element": xpath_el(STAGE_URL, ADD_BTN)}, timeout=30),
    step("assertElementPresent", "The note form opened",
         {"element": xpath_el(STAGE_URL, f'//form[@id="{FORM}"]')}, timeout=30),
    step("click", "Focus the rich text editor", {"element": xpath_el(STAGE_URL, EDITOR)}, timeout=30),
    step("typeText", "Type the run's marker note", {"value": ADD_TEXT, "element": xpath_el(STAGE_URL, EDITOR)}),
    armed(),
    step("click", "Submit the new note", {"element": xpath_el(STAGE_URL, SUBMIT)}, timeout=30),
    step("wait", "Let the add reach the server", {"value": 3}),
] + server_assert(
    f"⭐ SERVER: exactly ONE note carries `{PREFIX} NOTE <8 digits>`, and it is new — store its id",
    "__dd361_server", NOTES_Q, {"id": FIXTURE_ID}, SERVER_ADDED, soft=True) \
  + open_notes("reload: edit its note") + [
    # ---- edit --------------------------------------------------------------------------------------
    jsassert(f"Open the gear of the ONE card carrying `{PREFIX}` (the premise proved none pre-dated this run)",
             CARD_JS + f"if (!sessionStorage.getItem('{K_BEFORE}') || mine.length !== 1) return false;\n"
             "const g = mine[0].querySelector('[aria-label=\"Menu\"]');\n"
             "if (!g) return false;\ng.click();\nreturn true;", timeout=30, soft=True),
    step("wait", "Let the menu open", {"value": 1}),
    step("click", "Click `Edit Item`", {"element": xpath_el(STAGE_URL, EDIT_ITEM)}, timeout=30, soft=True),
    step("assertElementPresent", "The note edit form opened",
         {"element": xpath_el(STAGE_URL, f'//form[@id="{FORM}"]')}, timeout=30, soft=True),
    jsassert(f"The editor opened PREFILLED with this run's note (`{PREFIX} NOTE`)",
             "const m = [...document.querySelectorAll('.mantine-Modal-content')];\n"
             "const eds = m.flatMap(x => [...x.querySelectorAll('[contenteditable=\"true\"]')]);\n"
             f"return eds.length === 1 && (eds[0].textContent || '').indexOf('{PREFIX} NOTE') !== -1;",
             timeout=30, soft=True),
    step("click", "Focus the rich text editor", {"element": xpath_el(STAGE_URL, EDITOR)}, timeout=30, soft=True),
    step("pressKey", "Select all of the note text", {"value": "a", "modifiers": ["Control"]}, soft=True),
    step("typeText", "Replace it with the EDITED marker",
         {"value": EDIT_TEXT, "element": xpath_el(STAGE_URL, EDITOR)}, soft=True),
    jsassert(f"The editor now reads `{PREFIX} EDITED …` and no longer `{PREFIX} NOTE`",
             "const m = [...document.querySelectorAll('.mantine-Modal-content')];\n"
             "const eds = m.flatMap(x => [...x.querySelectorAll('[contenteditable=\"true\"]')]);\n"
             "const t = eds.length === 1 ? (eds[0].textContent || '') : '';\n"
             f"return t.indexOf('{PREFIX} EDITED') === 0 && t.indexOf('{PREFIX} NOTE') === -1;",
             timeout=20, soft=True),
    armed(soft=True),
    step("click", "Submit the edit", {"element": xpath_el(STAGE_URL, SUBMIT)}, timeout=30, soft=True),
    step("wait", "Let the update reach the server", {"value": 3}),
] + server_assert(
    f"⭐ SERVER: the run's note (its stored id) now holds `{PREFIX} EDITED <8 digits>` — `UPDATE_WORKSTAGE_JOB_NOTE` "
    "saved (the modal proves nothing: optimistic)",
    "__dd361_server", NOTES_Q, {"id": FIXTURE_ID}, SERVER_EDITED, soft=True) \
  + open_notes("reload: delete its note", always=True) + [
    # ---- delete (owner-authorised 2026-09-15, this run's note only) --------------------------------
    jsassert(f"🛑 GUARD + open its gear: only if THIS run's premise passed (`{K_BEFORE}` set: no `{PREFIX}` "
             "note pre-dated the run) and exactly ONE card carries the prefix",
             CARD_JS + f"if (!sessionStorage.getItem('{K_BEFORE}') || mine.length !== 1) return false;\n"
             "const g = mine[0].querySelector('[aria-label=\"Menu\"]');\n"
             "if (!g) return false;\ng.click();\nreturn true;", timeout=30, soft=True, always=True),
    step("wait", "Let the menu open", {"value": 1}, always=True),
    step("click", "Click `Delete Item` — on THIS card (its own record id)",
         {"element": xpath_el(STAGE_URL, DELETE_ITEM)}, timeout=30, soft=True, always=True),
    step("wait", "Let the confirmation open", {"value": 1}, always=True),
    step("click", 'Confirm: "Yes"', {"element": xpath_el(STAGE_URL, CONFIRM_YES)}, timeout=30,
         soft=True, always=True),
    step("wait", "Wait for the remove mutation", {"value": 3}, always=True),
] + server_assert(
    f"⭐ SERVER: no note carries `{PREFIX}`, and the note ids are EXACTLY those before the run — deleted, "
    "and nothing else touched (`REMOVE_JOB_NOTE_FROM_WORKSTAGE`; a reload would show the cache's word)",
    "__dd361_server", NOTES_Q, {"id": FIXTURE_ID}, SERVER_GONE, always=True) + [
    jsassert("Remove this test's sessionStorage keys",
             f"sessionStorage.removeItem('{K_BEFORE}');\nsessionStorage.removeItem('{K_ID}');\nreturn true;",
             always=True, timeout=15),
]

write(test(
    "MOB.361_Work_Note_Edit_Delete",
    "`MOB.361` **Edit a job note, then delete it — each write proved on the server.**\n"
    f"- Adds its own note (`{PREFIX} NOTE {{{{ RUNID }}}}`), proved over `/graphql` (exactly one, new).\n"
    f"- `Edit Item` → the tiptap editor prefilled → replaced with `{PREFIX} EDITED …` →\n"
    "  `UPDATE_WORKSTAGE_JOB_NOTE`, proved over `/graphql` on that note's id.\n"
    "- `Delete Item` → Yes → `REMOVE_JOB_NOTE_FROM_WORKSTAGE`, proved over `/graphql`: no marker note, and\n"
    "  the note ids are exactly those before the run.\n"
    "- 🛑 **Owner-authorised delete** (trap 2), this run's note only: guarded in the gear-click step by a\n"
    "  server premise (no marker note before the run) and exactly one marker card. The delete leg is\n"
    "  `always`, so a red run still removes its own note.\n"
    "- 🛑 SELF-CLEANING — the fixture ends with exactly the notes it started with.",
    steps,
    ["Mobile", "env:dev", "Work Order", "Notes", "CRUD", "self-cleaning"],
    local_vars=[RUNID],
))
print("wrote MOB.361 (job note edit + delete)")
