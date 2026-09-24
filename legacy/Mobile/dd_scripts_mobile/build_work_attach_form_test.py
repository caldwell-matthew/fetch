"""Build MOB.364_Work_Attach_Form - attach a form to a work order, proved on the server.

WHY THIS EXISTS
  `MOB.393` opens the add-form picker and cancels. Nothing had ever sent
  `CREATE_WORKSTAGE_FORM` and read the result back. Mobile cannot REMOVE a form, so the run deletes the
  one it attached over `/graphql` (`deleteWorkStageForm`, owner 2026-09-15) and proves the stage's form
  ids back to the premise's. It still runs on its own Datadog-created work order, never the main
  fixture (`MOB.134`/`355`/`357` read that one's forms), so a failed delete cannot touch them.

THE FIXTURE (shared with MOB.363 and MOB.365, read over the API 2026-09-15, 0 runs)
  work stage `xohY0klBZktB9VBRxc8k4J` - work `20260910-16`, created by the test account (`MOB.396`,
  `DD SYNTHETIC MOBILE 71373228`), status `Ready`, crew `Admin` among its 8 assignments, template
  `All Tabs` (`copyAttachmentToAsset: false`), one asset `⚡ Tank 0000`, 0 attachments, no schedule
  entries, 3 forms at rest (`📊Datatype`, `⚡Trigger`, `⚡Operating Status`). Opened by URL after
  `work_cache_warm`, so its name is never asserted.
  🛑 It carries the residue marker, so it is on `cleanup_residue.py`'s never-touch list (`FIXTURE_STAGES`).

WHAT THE SOURCE SAYS (`WorkOrders/components/Forms/AdHocForm.tsx`, origin/development)
  - The picker's `loadOptions` hides every template the stage already holds, by derived id
    (`workStageId + workflowForm.id`) OR by name (`:125-128`).
  - Submit: `toast.success('Form added')` fires BEFORE `client.mutate` (trap 7), and the modal closes in
    `update()` - which Apollo runs first on the `optimisticResponse` (trap 6). So neither the toast nor
    the closed modal proves the server wrote anything.
  ⭐ THE PROOF IS A /graphql READ (`dd_tools.server_assert`): the stage holds exactly ONE more form than
    at the premise, and exactly one named what this run picked - a name it did not hold before. A reload
    then shows that card (trap 6: a refused optimistic add never reaches the persisted cache).

⚠️ TRAP 10 - THE TEST CONSUMES ITS OWN FIXTURE, AND THAT IS BOUNDED, NOT UNBOUNDED
  Because the picker hides what is attached, every run attaches a DIFFERENT template, and the stage's
  form list can only grow to the number of mobile ad-hoc templates (16 on dev, measured). With 3 held
  (hiding 4 - `Trigger Test` shares a derived id with `⚡Trigger`), about **12 runs** remain from rest,
  minus every local replay. Then the picker is empty and the FIXTURE GUARD goes red - honestly, and `soft`,
  so a suite's later children still run. Nothing here depends on a fixed count or on "exactly one card"
  beyond the picked name, and the Forms tab is a plain `.map` (not virtualised), so growth up to that
  bound breaks nothing else. Resetting it needs `deleteWorkStageForm` over the API (not mobile) - an
  owner decision; this test never deletes.

PICK, BY WHAT THE SERVER SAID
  The pick is the first VISIBLE option (trap 3 - closed ListFilter dropdowns stay mounted) whose title is
  not among the names the premise read from the server, and its title is carried in sessionStorage to the
  proof. Its title is the template name; the stage form snapshots that name (`addFormToWorkStage`).
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert,  # noqa: E402
                      server_assert, work_cache_warm, ACTIVE_PANEL_JS)

FIXTURE_ID = "xohY0klBZktB9VBRxc8k4J"      # work 20260910-16 - shared with MOB.363 / MOB.365
STAGE_URL = f"{BASE}/work/{FIXTURE_ID}"
FORM = "adhoc-form"
K_BEFORE, K_PICK, K_SERVER = "__dd364_before", "__dd364_pick", "__dd364_server"
K_IDS, K_NEW, K_NET = "__dd364_before_ids", "__dd364_new", "__dd364_deleted"   # the delete's licence
DELETE_M = "mutation($id: ID!) { deleteWorkStageForm(id: $id) }"

FORMS_Q = "query($id: ID!) { workStage(id: $id) { id forms { id name } } }"
MODAL = '//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
ADD_BTN = '//button[normalize-space(.)="Add"]'
FORMS_TAB = '//*[@role="tab"][contains(normalize-space(.), "Form")]'
SUBMIT = f'//button[@form="{FORM}"]'


def before_names():
    return f"JSON.parse(sessionStorage.getItem('{K_BEFORE}') || 'null')"


# Premise: read the stage's forms from the server and keep their names for the pick and the proof.
PREMISE = ("(() => { const f = data.workStage.forms;\n"
           f"  sessionStorage.removeItem('{K_PICK}');   // a killed run's pick must not steer this one\n"
           f"  ['{K_IDS}', '{K_NEW}', '{K_NET}'].forEach(k => sessionStorage.removeItem(k));   // nor its delete licence\n"
           f"  if (data.workStage.id !== '{FIXTURE_ID}' || !Array.isArray(f)) return false;\n"
           f"  sessionStorage.setItem('{K_BEFORE}', JSON.stringify(f.map(x => (x.name || '').trim())));\n"
           f"  sessionStorage.setItem('{K_IDS}', JSON.stringify(f.map(x => x.id)));\n"
           "  return true; })()")

# Cleanup (owner 2026-09-15): mobile has no remove, so the run deletes the ONE form it attached over /graphql.
# The id must be new since the premise AND named the pick; a form the stage held before is never a target.
FIND_NEW = ("(() => { const f = data.workStage.forms;\n"
            f"  const ids = JSON.parse(sessionStorage.getItem('{K_IDS}') || 'null'), pick = sessionStorage.getItem('{K_PICK}');\n"
            f"  if (data.workStage.id !== '{FIXTURE_ID}' || !Array.isArray(f) || !Array.isArray(ids)) return false;\n"
            "  const fresh = f.filter(x => !ids.includes(x.id));\n"
            "  if (fresh.length === 0) return true;   // nothing attached: nothing to delete\n"
            "  if (fresh.length !== 1 || !pick || (fresh[0].name || '').trim() !== pick) return false;\n"
            f"  sessionStorage.setItem('{K_NEW}', fresh[0].id);\n"
            "  return true; })()")

DELETE_JS = (f"const id = sessionStorage.getItem('{K_NEW}');\n"
             f"const ids = JSON.parse(sessionStorage.getItem('{K_IDS}') || 'null');\n"
             f"if (!id || sessionStorage.getItem('{K_NET}')) return true;   // nothing of this run's to delete, or already sent\n"
             "if (!Array.isArray(ids) || ids.includes(id)) return false;   // never a form the stage held before this run\n"
             f"sessionStorage.setItem('{K_NET}', '1');\n"
             "window.fetch('/graphql', { method: 'POST', credentials: 'same-origin',\n"
             "  headers: { 'content-type': 'application/json', 'apollo-require-preflight': '*' },\n"
             f"  body: JSON.stringify({{ query: '{DELETE_M}', variables: {{ id }} }}) }});\n"
             "return true;")

GONE = ("(() => { const f = data.workStage.forms;\n"
        f"  const ids = JSON.parse(sessionStorage.getItem('{K_IDS}') || 'null');\n"
        "  if (!Array.isArray(f) || !Array.isArray(ids)) return false;\n"
        "  const now = f.map(x => x.id).sort(), was = ids.slice().sort();\n"
        "  return now.length === was.length && now.every((v, i) => v === was[i]); })()")

# The one thing the whole test is about: one more form, and it is the picked one, new to this stage.
PROOF = ("(() => { const f = data.workStage.forms.map(x => (x.name || '').trim());\n"
         f"  const before = {before_names()}, pick = sessionStorage.getItem('{K_PICK}');\n"
         "  if (!Array.isArray(before) || !pick || before.includes(pick)) return false;\n"
         "  return f.length === before.length + 1 && f.filter(n => n === pick).length === 1; })()")

PICK_JS = (f"const before = {before_names()};\n"
           f"const pick0 = sessionStorage.getItem('{K_PICK}');\n"
           "if (!Array.isArray(before)) return false;\n"
           "const vis = [...document.querySelectorAll('[role=\"option\"]')]\n"
           "  .filter(o => o.offsetParent !== null)\n"
           "  .map(o => ({ o, t: ((o.querySelector('[class*=\"option-title\"]') || {}).textContent || '').trim() }))\n"
           "  .filter(x => x.t && !before.includes(x.t));\n"
           "if (!vis.length) return false;\n"
           "const x = pick0 ? vis.find(v => v.t === pick0) : vis[0];   // a re-poll never picks a second one\n"
           "if (!x) return false;\n"
           f"sessionStorage.setItem('{K_PICK}', x.t);\n"
           "x.o.click();\n"
           "return true;")

# Exactly one card in the active panel titled with the picked form.
CARD_JS = (ACTIVE_PANEL_JS +
             f"const pick = sessionStorage.getItem('{K_PICK}');\n"
             "if (!pick) return false;\n"
             "return [...p.querySelectorAll('[class*=\"mantine-Title-root\"]')]\n"
             "  .filter(t => (t.textContent || '').trim() === pick).length === 1;")
RESYNC = '//p[starts-with(normalize-space(.), "Data synced on")]/following-sibling::button[1]'

steps = work_cache_warm() + [
    go(STAGE_URL, "the add-form work order (20260910-16)"),
    step("wait", "Let the detail view begin rendering", {"value": 2}),
    step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}, timeout=30),
] + server_assert("PREMISE (server): read this stage's forms — their names are what the picker must hide and "
                  "the baseline for +1",
                  K_SERVER, FORMS_Q, {"id": FIXTURE_ID}, PREMISE) + [
    step("click", "Open the Forms tab", {"element": xpath_el(STAGE_URL, FORMS_TAB)}, timeout=30),
    step("wait", "Let the form cards render", {"value": 2}),
    step("click", 'Open the add-form modal ("Add")', {"element": xpath_el(STAGE_URL, ADD_BTN)}, timeout=30),
    step("wait", "Wait for the modal", {"value": 2}),
    step("assertElementPresent", "The form picker rendered in the modal",
         {"element": xpath_el(STAGE_URL, f'{MODAL}//*[@id="formId"]')}, timeout=30),
    step("click", "Open the picker", {"element": xpath_el(STAGE_URL, f'{MODAL}//*[@id="formId"]')}, timeout=30),
    step("wait", "Wait for the template options (MOBILE_AD_HOC_FORMS)", {"value": 3}),
    # soft: a fixture premise (trap 10) - red, not an abort.
    jsassert("FIXTURE GUARD + PICK: the picker offers a form this stage does not hold (trap 10); click the "
             "first VISIBLE one and keep its name",
             PICK_JS, timeout=30, soft=True),
    jsassert("The picker now holds the picked form's name",
             f"const pick = sessionStorage.getItem('{K_PICK}');\n"
             "const el = document.getElementById('formId');\n"
             "return !!pick && !!el && (el.value || '').trim() === pick;", timeout=20, soft=True),
    jsassert(f"Submit is ARMED — `button[form=\"{FORM}\"]` is `type=\"submit\"` (trap 8)",
             f"const b = document.querySelector('button[form=\"{FORM}\"]');\n"
             "return !!b && b.type === 'submit';", timeout=30, soft=True),
    step("click", "Submit — attach the form", {"element": xpath_el(STAGE_URL, SUBMIT)}, timeout=30, soft=True),
    step("wait", "Let CREATE_WORKSTAGE_FORM reach the server", {"value": 3}),
    step("assertPageContains", "The `Form added` toast (optional: it fires BEFORE the mutation — trap 7)",
         {"value": "Form added"}, optional=True),
    jsassert("The add-form modal closed and the Forms tab's `Add` is back on screen (UI only: it closes on "
             "the optimistic result — trap 6)",
             f"if (document.getElementById('{FORM}')) return false;\n"
             "return [...document.querySelectorAll('button')].some(b => (b.textContent || '').trim() === 'Add');",
             timeout=30, soft=True),
    jsassert("SENTINEL (optional): before any reload, the Forms tab shows the new card (what the add wrote to "
             "the page's cache)", CARD_JS, timeout=20, optional=True),
] + server_assert("⭐ SERVER: exactly ONE more form than at the premise, and exactly one named what this run "
                  "picked — asked over /graphql",
                  K_SERVER, FORMS_Q, {"id": FIXTURE_ID}, PROOF, soft=True, timeout=60) + [
    go(STAGE_URL, "the add-form work order (reload: the persisted cache holds no refused optimistic add)"),
    step("wait", "Let the detail view begin rendering", {"value": 2}),
    step("assertPageContains", "Test work order detail rendered", {"value": "Status:"}, timeout=30),
    step("click", "Reopen the Forms tab", {"element": xpath_el(STAGE_URL, FORMS_TAB)}, timeout=30),
    step("wait", "Let the form cards render", {"value": 2}),
    jsassert("SENTINEL (optional): after the reload, WITHOUT a resync, the Forms tab shows the new card — "
             "locally it did not: the page drew the cached work order and sent no read (trace 2026-09-15)",
             CARD_JS, timeout=10, optional=True),
    step("click", "Press the page's ⟳ resync (`ResyncButton` beside `Data synced on` → refetch)",
         {"element": xpath_el(STAGE_URL, RESYNC)}, timeout=30),
    step("wait", "Let the refetch land", {"value": 4}),
    jsassert("⭐ After a RELOAD the Forms tab shows exactly one card titled with the picked form (after the "
             "page's ⟳ resync)", CARD_JS, timeout=30, soft=True),
] + server_assert("CLEANUP (server): find the ONE form this run attached — an id new since the premise, named "
                  "the pick", K_SERVER, FORMS_Q, {"id": FIXTURE_ID}, FIND_NEW, always=True, timeout=60) + [
    jsassert("CLEANUP: delete THAT form over /graphql (`deleteWorkStageForm` — mobile has no remove; owner "
             "2026-09-15). One shot; refuses an id the stage held before this run", DELETE_JS, timeout=15, always=True),
    step("wait", "Let the delete reach the server", {"value": 3}, always=True),
] + server_assert("⭐ CLEANED (server): the stage's form ids are exactly the premise's",
                  K_SERVER, FORMS_Q, {"id": FIXTURE_ID}, GONE, always=True, timeout=60) + [
    jsassert("Remove this test's sessionStorage keys",
             f"{json.dumps([K_BEFORE, K_PICK, K_IDS, K_NEW, K_NET])}.forEach(k => sessionStorage.removeItem(k));\nreturn true;",
             always=True, timeout=15),
]

write(test(
    "MOB.364_Work_Attach_Form",
    "`MOB.364` **Attach a form to a work order — proved on the server, then deleted.**\n"
    f"- On its own Datadog-created work order `{FIXTURE_ID}` (work `20260910-16`), never the main\n"
    "  fixture. **Self-cleaning:** mobile cannot remove a form, so the run deletes the one it attached\n"
    "  over `/graphql` (`deleteWorkStageForm`, owner 2026-09-15), `always`, refusing any id the stage\n"
    "  held before the run, and proves the stage's form ids are exactly the premise's.\n"
    "- The toast fires before the mutation and the modal closes on the optimistic result, so the\n"
    "  ⭐ proof is a `/graphql` read: exactly one more form, and exactly one named the picked\n"
    "  template; then a reload shows that card.",
    steps,
    ["Mobile", "env:dev", "Work Order", "Forms", "self-cleaning"],
))
print("wrote MOB.364 (attach a form)")
