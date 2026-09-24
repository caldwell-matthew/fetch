"""Build MOB.722_AssetLookup_Reading_Capture - capture a reading from Asset Lookup's Readings tab,
proved over `/graphql`.

WHY THIS EXISTS, AND WHY MOB.720 STILL DOES NOT SUBMIT
  `MOB.720` covers the tab, its derived field list and the `AddReadingTypes` picker, and stops
  before submitting on purpose: on `Pump 0102` every run would leave a permanent Event. `MOB.550`
  submits, but on Asset Verification's container (`AssetVerification/EventReadings/index.tsx`).
  This is the other container - `AssetLookup/AssetLookupDetails/EventReadings.tsx` - on a
  THROWAWAY asset, with the residue decided and recorded.

WHAT THE SOURCE SAYS (origin/development 4da480a68f)
  `onSubmit` (`:157-235`) builds one `CREATE_EVENT` per filled field (`FormData`, `parseFloat`), then
  ONLINE it `await Promise.all(pending)` and only then writes the captured values into the cache
  (`writeFragment` on `Asset.latestReadings`) and toasts `Event readings captured.`; a rejection
  toasts `Event readings could not be saved.`. That is stronger than MOB.550's container, but the
  toast is transient and the rendered previous entry is still the app's own cache write - and a
  reload renders the persisted cache (trap 6). ⭐ THE PROOF IS A `/graphql` READ: the asset's
  `latestReadings` for the reading type is exactly the value this run typed.
  Submit is `SubmitButton form={formId}`, `isValid={filledInputs >= 1 && !saving}`; `filledInputs` is
  recomputed only in the form's `onBlur`, so a `Tab` arms it, and the click waits for
  `type="submit"` (trap 8, MOB.550's note).

THE RECORD: A THROWAWAY ASSET, NEVER A FIXTURE
  Not `⚡ Building 0000` (MOB.721 and MOB.914 need zero readings), not the AV job's `⚡ Tank 0000` /
  `A/C Motor 0002` (MOB.550/551/914 read their readings), not `Pump 0102` (MOB.720's exclusive-or and a
  never-touch fixture). Asset Lookup searches `DD SYNTHETIC MOBILE` and takes the first marker row; a
  critical guard requires its `Name` cell to be `DD SYNTHETIC MOBILE <8 digits>` (MOB.600's residue)
  before anything is typed, and records the name for the server read. No builder reads readings on
  those assets (grep 2026-09-15); the server held 4 of them, none with a reading.

THE READING TYPE: `Test 1`, ADDED ONLY WHEN THE ASSET LACKS IT
  Outside a work order the fields are derived from the asset's `latestReadings` plus types added in
  the session, and the picker hides types already shown (`readingTypeOptions`). So the first run on
  an asset adds `Test 1` through `Add reading types` (MultiSelect -> `Add`), and every later run finds
  the field already there. Datadog cannot branch, so the three ENSURE steps each return true at once
  when the field exists and otherwise drive the picker ONE action at a time (window flags stop a poll
  from repeating a click). Both paths end at the same critical fact: the `Test 1` field is on the form,
  and its input is tagged `data-dd722` for the typing steps. `Add reading types` is `loading` (and
  inert) while the org's types load, so the click waits for it.

THE VALUE: `722` + FIVE RANDOM DIGITS
  Recognisable in the data (`722xxxxx`) and different every run, so the server predicate can only be
  satisfied by THIS run's event. `{{ RUNID722 }}` is interpolated into typed text only; the typed value
  is read back from the input into `sessionStorage` for the predicate (build_edit_tests.py's rule).

RESIDUE - mobile cannot delete an event
  One `Event` per run on the chosen marker asset: reading type `Test 1`, reading `722xxxxx`; the first
  run on an asset also makes `Test 1` one of its reading fields (that is only the event itself).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, go, test, write, jsassert, localvar,  # noqa: E402
                      server_assert)

LOOKUP_URL = BASE + "/asset-lookup"
MARKER = "DD SYNTHETIC MOBILE"
TYPE = "Test 1"
# 🛑 NOT `RUNID`. Inside MOB.980 a suite's children share local variables BY NAME on Datadog (first
# definition wins), and MOB.710/712 declare `RUNID` as `numeric(8)` - so MOB.722 typed `722` + EIGHT
# digits and its 5-digit guard went red (Datadog, 2026-09-16; it passed solo, where nothing else
# defines `RUNID`). A name no other test uses cannot collide. `preflight.py locals` enforces it.
RUNID = localvar("RUNID722", "{{ numeric(5) }}", "48120")
VALUE = "722{{ RUNID722 }}"
K_ASSET, K_VALUE, K_SRV = "__dd722_asset", "__dd722_value", "__dd722_server"
TAG = "data-dd722"


def tok(cls):
    return f'contains(concat(" ", normalize-space(@class), " "), " {cls} ")'


SEARCH = '//input[@name="asset-search"]'
ITEM = (f'(//*[{tok("mantine-Accordion-item")}]'
        f'[.//*[{tok("mantine-Accordion-control")}][contains(., "{MARKER}")]])[1]')
CONTROL = f'{ITEM}//*[{tok("mantine-Accordion-control")}]'
READINGS_TAB = f'{ITEM}//*[@role="tab"][normalize-space(.)="Readings"]'
READINGS_FORM = f'{ITEM}//form[starts-with(@id, "asset-lookup-readings-")]'
READING_INPUT = f'//input[@{TAG}="reading"]'
SUBMIT = f'{ITEM}//button[starts-with(@form, "asset-lookup-readings-")]'

NAME_RE = "/^DD SYNTHETIC MOBILE \\d{8}$/"

ITEM_JS = (
    "const it = [...document.querySelectorAll('.mantine-Accordion-item')].find(i => {\n"
    "  const c = i.querySelector('.mantine-Accordion-control');\n"
    f"  return c && (c.textContent || '').includes('{MARKER}');\n"
    "});\n"
    "if (!it) return false;\n")
# The `Test 1` field's input: `EventReadingField` is a Box holding a Group whose first Text is the
# reading type's name, then the NumberInput (`placeholder="Enter reading"`, `name=<type id>`).
FIELD_JS = (
    "const form = it.querySelector('form[id^=\"asset-lookup-readings-\"]');\n"
    "if (!form) return false;\n"
    "const field = () => [...form.querySelectorAll('input[placeholder=\"Enter reading\"]')].find(inp => {\n"
    "  const root = inp.closest('.mantine-NumberInput-root');\n"
    "  const box = root && root.parentElement;\n"
    "  const t = box && box.querySelector('.mantine-Text-root');\n"
    f"  return !!t && t.textContent.trim() === '{TYPE}';\n"
    "});\n"
    "const picker = () => [...document.querySelectorAll('.mantine-Modal-content')]\n"
    "  .find(m => (m.textContent || '').includes('Add Reading Types'));\n")

ASSETS_PARAMS = {"p": {"limit": 100, "query": {"conditions": [
    {"column": "name", "operator": "CONTAINS", "value": MARKER}]}}}
Q_READINGS = ("query($p: TableQuery!) { assets(params: $p) { edges { id name "
              "latestReadings { id reading readingDate readingType { id name } } } } }")
PRED = (f"(() => {{ const a = sessionStorage.getItem('{K_ASSET}'), v = sessionStorage.getItem('{K_VALUE}');\n"
        "  if (!a || !v) return false;\n"
        "  const e = data.assets.edges.filter(x => x.name === a);\n"
        "  if (e.length !== 1) return false;\n"
        f"  const r = (e[0].latestReadings || []).filter(x => x.readingType && x.readingType.name === '{TYPE}');\n"
        "  return r.length === 1 && Number(r[0].reading) === Number(v); })()")

steps = [
    go(LOOKUP_URL, "asset lookup"),
    step("wait", "Wait for the page to mount", {"value": 3}),
    step("assertElementContent", 'Test the "Asset Lookup" page rendered',
         {"check": "contains", "value": "Asset Lookup",
          "element": xpath_el(LOOKUP_URL, '//*[@id="page-title"]//h4[contains(normalize-space(.), "Asset Lookup")]')},
         timeout=30),
    step("click", "Focus the search input", {"element": xpath_el(LOOKUP_URL, SEARCH)}, timeout=30),
    step("pressKey", "Select any persisted query first (typeText APPENDS — trap 17)",
         {"value": "a", "modifiers": ["Control"]}),
    step("typeText", f'Search for "{MARKER}"', {"value": MARKER, "element": xpath_el(LOOKUP_URL, SEARCH)}),
    step("pressKey", "Submit the search (Enter — there is no search button)", {"value": "Enter"}),
    step("assertElementPresent", f'RESULT GUARD: a "{MARKER}" row rendered (MOB.600 residue)',
         {"element": xpath_el(LOOKUP_URL, ITEM)}, timeout=60),
    step("click", "Expand that row", {"element": xpath_el(LOOKUP_URL, CONTROL)}, timeout=30),
    step("wait", "Let the detail panel mount", {"value": 3}),
    # 🛑 Critical, before anything is written: General Info is the tab a row opens on.
    jsassert(f"FIXTURE GUARD: the row's `Name` cell is exactly `{MARKER} <8 digits>` — a throwaway asset; "
             "record the name",
             ITEM_JS +
             "const tr = [...it.querySelectorAll('tr')].find(t => {\n"
             "  const b = t.querySelector('b');\n"
             "  return b && b.textContent.trim() === 'Name';\n"
             "});\n"
             "const name = tr && tr.cells.length >= 2 ? tr.cells[1].textContent.trim() : '';\n"
             f"if (!{NAME_RE}.test(name)) return false;\n"
             f"sessionStorage.setItem('{K_ASSET}', name);\n"
             "return true;", timeout=30),
    step("click", 'Open the "Readings" tab', {"element": xpath_el(LOOKUP_URL, READINGS_TAB)}, timeout=30),
    step("assertElementPresent", 'The "Readings" tab is active',
         {"element": xpath_el(LOOKUP_URL, READINGS_TAB + "[@data-active]")}, timeout=30),
    # The form mounts only once the readings query answered (`!fields.length && loading` -> Loading).
    step("assertElementPresent", "The asset-scoped readings form mounted",
         {"element": xpath_el(LOOKUP_URL, READINGS_FORM)}, timeout=60),
    jsassert(f"ENSURE 1/3: the `{TYPE}` field is already on the form — or open `Add reading types` (once, "
             "when it is not loading)",
             ITEM_JS + FIELD_JS +
             "if (field() || picker()) return true;\n"
             "const b = it.querySelector('[aria-label=\"Add reading types\"]');\n"
             "if (!b || b.disabled || b.hasAttribute('data-loading')) return false;\n"
             "if (!window.__dd722_open) { window.__dd722_open = 1; b.click(); }\n"
             "return false;", timeout=45),
    jsassert(f"ENSURE 2/3: the field exists — or `{TYPE}` is picked in the MultiSelect (a pill)",
             ITEM_JS + FIELD_JS +
             "if (field()) return true;\n"
             "const m = picker();\n"
             "if (!m) return false;\n"
             "if ([...m.querySelectorAll('.mantine-Pill-label')]\n"
             f"  .some(p => p.textContent.trim() === '{TYPE}')) return true;\n"
             "const opts = [...document.querySelectorAll('[role=\"option\"]')]\n"
             f"  .filter(o => o.textContent.trim() === '{TYPE}');\n"
             "if (opts.length === 1) { opts[0].click(); return false; }\n"
             "const inp = m.querySelector('input');\n"
             "if (inp) { inp.focus(); inp.click(); }\n"
             "return false;", timeout=45),
    jsassert(f"ENSURE 3/3: confirm with `Add` if the picker is open — the `{TYPE}` field is on the form; "
             "tag its input",
             ITEM_JS + FIELD_JS +
             "const f = field();\n"
             f"if (f) {{ document.querySelectorAll('[{TAG}]').forEach(n => n.removeAttribute('{TAG}'));\n"
             f"  f.setAttribute('{TAG}', 'reading'); return true; }}\n"
             "const m = picker();\n"
             "if (!m) return false;\n"
             "const add = [...m.querySelectorAll('button')].find(b => b.textContent.trim() === 'Add');\n"
             "if (add && !add.disabled && !window.__dd722_add) { window.__dd722_add = 1; add.click(); }\n"
             "return false;", timeout=45),
    step("click", f"Focus the `{TYPE}` reading input", {"element": xpath_el(LOOKUP_URL, READING_INPUT)}, timeout=30),
    step("typeText", "Enter the reading `722<RUNID>`", {"value": VALUE, "element": xpath_el(LOOKUP_URL, READING_INPUT)}),
    jsassert("The input holds `722` + 5 digits; record it (the JS never reads RUNID)",
             f"const el = document.querySelector('input[{TAG}=\"reading\"]');\n"
             "const v = el ? (el.value || '').trim() : '';\n"
             "if (!/^722\\d{5}$/.test(v)) return false;\n"
             f"sessionStorage.setItem('{K_VALUE}', v);\n"
             "return true;", timeout=20),
    step("pressKey", "Tab out — the form's onBlur recounts `filledInputs` (arms Submit)", {"value": "Tab"}),
    jsassert("Submit is ARMED — this row's `button[form=\"asset-lookup-readings-…\"]` is `type=\"submit\"` (trap 8)",
             ITEM_JS + "const b = it.querySelector('button[form^=\"asset-lookup-readings-\"]');\n"
             "return !!b && b.type === 'submit';", timeout=30),
    step("click", "Submit the reading (CREATE_EVENT)", {"element": xpath_el(LOOKUP_URL, SUBMIT)}, timeout=30),
    step("wait", "Brief wait for the toast", {"value": 2}),
    step("assertPageContains", "`Event readings captured.` toast (optional: transient)",
         {"value": "Event readings captured."}, optional=True),
] + server_assert(f"⭐ SERVER: the asset's latest `{TYPE}` reading is exactly the value typed (CREATE_EVENT stored)",
                  K_SRV, Q_READINGS, ASSETS_PARAMS, PRED, timeout=60) + [
    jsassert(f"The `{TYPE}` field now renders that value as its previous entry (the post-save cache write)",
             ITEM_JS + FIELD_JS +
             f"const v = sessionStorage.getItem('{K_VALUE}');\n"
             "const f = field();\n"
             "const box = f && f.closest('.mantine-NumberInput-root') && f.closest('.mantine-NumberInput-root').parentElement;\n"
             "const g = box && box.querySelector('.mantine-Group-root');\n"
             "return !!v && !!g && [...g.querySelectorAll('.mantine-Text-root')].some(t => t.textContent.trim() === v);",
             timeout=30),
    # ---- leave it as found ------------------------------------------------------------------------
    step("click", "Collapse the row", {"element": xpath_el(LOOKUP_URL, CONTROL)}, always=True, timeout=30),
    jsassert("RESTORED: the row reports itself collapsed",
             ITEM_JS + "const c = it.querySelector('.mantine-Accordion-control');\n"
             "return !!c && c.getAttribute('aria-expanded') === 'false';", always=True, timeout=30),
    jsassert("CLEANUP: remove this test's scratch keys, flags and tag, and the persisted search",
             f"['{K_ASSET}', '{K_VALUE}', 'asset_lookup_query'].forEach(k => sessionStorage.removeItem(k));\n"
             "delete window.__dd722_open; delete window.__dd722_add;\n"
             f"document.querySelectorAll('[{TAG}]').forEach(n => n.removeAttribute('{TAG}'));\n"
             f"return !sessionStorage.getItem('{K_ASSET}') && !sessionStorage.getItem('{K_VALUE}');",
             always=True, timeout=15),
]

write(test(
    "MOB.722_AssetLookup_Reading_Capture",
    "`MOB.722` **Capture a reading from Asset Lookup's Readings tab** — proved over `/graphql`.\n"
    f"- On the first `{MARKER}` row (a critical guard requires its `Name` to be `{MARKER} <8 digits>`\n"
    "  before anything is written) — not a fixture, and not an asset whose readings another test counts.\n"
    f"- Reading type `{TYPE}`: added through `Add reading types` only when the asset lacks it (the picker\n"
    "  hides types already shown), so every run ends at the same field.\n"
    "- Types `722<5 random digits>`, tabs out to arm Submit (`filledInputs` counts on blur), submits.\n"
    "- ⭐ **Server proof**: the asset's `latestReadings` for that type is exactly the typed value — the\n"
    "  toast is transient and the rendered previous entry is the app's own cache write (trap 6).\n"
    f"- ⚠️ **LEAVES RESIDUE**: one Event per run (`{TYPE}`, `722xxxxx`) on that throwaway asset.",
    steps,
    ["Mobile", "env:dev", "Asset Lookup", "Readings", "residue"],
    local_vars=(RUNID,),
))
print("wrote MOB.722 (capture a reading from Asset Lookup)")
