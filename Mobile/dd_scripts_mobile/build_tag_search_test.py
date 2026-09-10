"""Build MOB.547 - the photo tag search's CREATE button is an exclusive-or (checklist 🟢 #18).

WHAT CHANGED, AND WHY IT IS WORTH A TEST
  `db95798d54` ("fix(tags): normalize searches and synchronize mobile tag options", 2026-09-10)
  redefined when the tag picker offers to create a tag. It used to mean *no results*:

      displayCreateButton: searchResults.length === 0 && action.search.trim().length > 0

  It now means *no EXACT match*, case- and whitespace-insensitively (`Tags/reducer.ts:46-57`,
  and the same rule inline in `Tags/index.tsx:188-190` for the mini selector):

      const str = action.search.trim().toLocaleLowerCase();
      const hasExactMatch = action.tags.some(({ name }) => name.toLocaleLowerCase().trim() === str);
      displayCreateButton: !!str && !hasExactMatch

  So a partial match now shows results AND the create button - which the old rule made
  impossible. That is a biconditional over one text input, and nothing tested it.

⭐ THE FIXTURE MAKES THE STRONGEST CASE AVAILABLE. The org has 16 tags including both `Custom`
  and `Custom 4-21` (read through the API, 0 runs). Typing `Custom`:

      old rule -> results exist, so NO create button
      new rule -> results exist AND an exact match exists, so NO create button
      typing `Batter` -> results exist and NO exact match, so create button SHOWS  <- the change

  Probe B therefore does double duty: it proves the normalisation (`  cUSTOM  ` still matches
  `Custom` exactly) on a search that also returns two options, so "results exist" and "create
  hidden" are shown to be independent facts rather than the same fact.

WHERE IT RUNS - the AV asset detail's Attachments tab, `MOB.546`'s route
  Reusing a green path costs nothing and keeps this test about the tag search. The alternative
  was `MOB.622`'s route, which uploads two photos into the collector form and discards them.

🛑 THE TAG BADGE IS NOT ALWAYS CALLED "EDIT TAGS". `PhotoMenu.tsx:154-181` renders the tag
  overlay as up to three NAME badges when the photo has 1-3 tags, and only falls back to
  `Edit Tags (n)` otherwise - the fixture photo carries `Lens: Nameplate Extraction`, so a
  locator keyed to "Edit Tags" finds nothing here.

  ⚠️ AND DO NOT MATCH THE HEX COLOUR. Version 1 targeted the green outline the component sets
  (`outline: 1px solid #8dc63f`) and found nothing on a page where the badge was plainly on
  screen: **the browser serialises a hex colour as `rgb(141, 198, 63)` in the `style`
  attribute**, so the authored text is not what `getAttribute('style')` returns. `cursor:
  pointer` comes from the same style object and survives serialisation, so that leads, with
  both colour spellings kept as fallbacks.

🛑 NOTHING IS WRITTEN. Selecting an option calls `onOptionSubmit` and assigns a tag; pressing
  the create option posts a real tag. This test only ever sets the input's value and reads the
  dropdown, then leaves through `Done`.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, HERE, step, xpath_el, test, write, jsassert,  # noqa: E402
                      av_job_gate, ACTIVE_PANEL_JS)

JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
JOB_URL = f"{BASE}/asset-verify/{JOB_ID}"
ASSET = "Tank 0000"
TAB = "Attachments"
FIRST_TAB = "General Info"

# Fixture tags, read from the API 2026-09-10. `Custom` is both a tag AND a prefix of
# `Custom 4-21`, which is what makes probe B possible.
PARTIAL = "Batter"            # matches `Battery Pack`, is not any tag's full name
PARTIAL_HIT = "Battery Pack"
EXACT_PADDED = "  cUSTOM  "   # matches `Custom` exactly once trimmed and lower-cased
EXACT_HIT = "Custom"
NO_MATCH = "ZZZZ-NO-SUCH-TAG"

SEARCH_INPUT = '//input[@placeholder="Search tags..."]'
DONE = ('//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Modal-content ")]'
        '//button[normalize-space(.)="Done"]')


def tab(name):
    return f'//*[@role="tab"][contains(normalize-space(.), "{name}")]'


def link(name):
    return f'(//span[contains(normalize-space(.), "{name}")])[last()]'


# React tracks an input's value on the DOM node, so `el.value = x` is invisible to it. Going
# through the prototype's setter and dispatching `input` is the standard way to type from JS -
# and it is one step instead of a click, a select-all and a typeText.
# ⚠️ `el.ownerDocument.defaultView`, never the bare `window`: the bench runs these bodies with
# only `document` in scope, and a body that needs the real `window` cannot be checked there.
def type_search(value, label):
    js = ("const el = document.querySelector('input[placeholder=\"Search tags...\"]');\n"
          "if (!el) return false;\n"
          "const view = el.ownerDocument.defaultView;\n"
          "const setter = Object.getOwnPropertyDescriptor(\n"
          "  view.HTMLInputElement.prototype, 'value').set;\n"
          f"setter.call(el, {json.dumps(value)});\n"
          "el.dispatchEvent(new view.Event('input', { bubbles: true }));\n"
          "return true;")
    return [
        jsassert(f"Type {label} into the tag search", js, timeout=30),
        step("wait", "Let the dropdown re-filter", {"value": 2}),
    ]


# The dropdown's options are `Combobox.Option`s (`TagSearchCombobox.tsx:89-104`); the create
# entry is one of them, distinguished by its text.
OPTIONS_JS = (
    "const opts = [...document.querySelectorAll('[role=\"option\"]')]\n"
    "  .map(o => (o.textContent || '').trim());\n"
    "const create = opts.filter(t => t.indexOf('+ Create Tag') === 0);\n"
    "const tags = opts.filter(t => t.indexOf('+ Create Tag') !== 0);\n")

steps = av_job_gate(JOB_ID) + [
    step("click", f"Open {ASSET}'s full-page detail",
         {"element": xpath_el(JOB_URL, link(ASSET))}, timeout=30),
    step("wait", "Let the asset detail begin rendering", {"value": 2}),
    step("assertPageContains", "The full-page asset detail rendered",
         {"value": "Asset Type:"}, timeout=30),
    step("click", f'Open the "{TAB}" tab', {"element": xpath_el(JOB_URL, tab(TAB))}, timeout=30),
    step("wait", "Wait for the panel", {"value": 3}),

    jsassert("Make sure the Photos segment is showing (value 1)",
             ACTIVE_PANEL_JS +
             "const root = p.querySelector('[class*=\"mantine-SegmentedControl-root\"]');\n"
             "if (!root) return false;\n"
             "const el = root.querySelector('input[type=\"radio\"][value=\"1\"]');\n"
             "if (!el) return false;\n"
             "el.click();\n"
             "return true;", timeout=30),
    step("wait", "Let the carousel render", {"value": 3}),

    # 🛑 Not "the Edit Tags badge" - see the header. The green outline is the component's own.
    jsassert("Open the tag editor from the carousel's tag badge (a NAME badge when the photo "
             "has 1–3 tags, `Edit Tags (n)` otherwise)",
             ACTIVE_PANEL_JS +
             "const isTagBadge = b => {\n"
             "  const st = b.getAttribute('style') || '';\n"
             "  // 🛑 The component writes `outline: 1px solid #8dc63f`, but the browser\n"
             "  // SERIALISES hex colours as rgb() - matching '8dc63f' finds nothing in\n"
             "  // Chrome. `cursor: pointer` is the other half of the same style object and\n"
             "  // survives serialisation untouched, so it leads; the colour forms are kept\n"
             "  // as fallbacks in case the cursor rule moves.\n"
             "  if (st.indexOf('cursor: pointer') !== -1) return true;\n"
             "  if (st.indexOf('8dc63f') !== -1) return true;\n"
             "  if (st.indexOf('141, 198, 63') !== -1) return true;\n"
             "  return /Edit Tags \\(\\d+\\)/.test(b.textContent || '');\n"
             "};\n"
             "const badges = [...p.querySelectorAll('[class*=\"mantine-Badge-root\"]')]\n"
             "  .filter(isTagBadge);\n"
             "if (!badges.length) return false;\n"
             "badges[badges.length - 1].click();\n"
             "return true;", timeout=30),
    step("wait", "Let the tag modal mount", {"value": 3}),
    step("assertElementPresent",
         "⭐ The FULL TagSelector opened — `Search tags...`, not the mini `Auto-apply tags?`",
         {"element": xpath_el(JOB_URL, SEARCH_INPUT)}, timeout=30),

    # ---- A: a PARTIAL match — results AND the create button, which the old rule forbade ----
] + type_search(PARTIAL, f'the partial term "{PARTIAL}"') + [
    jsassert(f'⭐ PARTIAL: "{PARTIAL}" lists `{PARTIAL_HIT}` **and** offers to create it — '
             f'under the old rule (results ⇒ no create) this was impossible',
             OPTIONS_JS +
             f"const hit = tags.some(t => t.indexOf('{PARTIAL_HIT}') !== -1);\n"
             f"const offer = create.some(t => t.indexOf(\"'{PARTIAL}'\") !== -1);\n"
             "return hit && offer;", timeout=30),

    # ---- B: an EXACT match, padded and mis-cased — results, NO create ---------------------
] + type_search(EXACT_PADDED, f'the padded, mis-cased exact term "{EXACT_PADDED}"') + [
    jsassert(f'⭐ EXACT: "{EXACT_PADDED}" still matches `{EXACT_HIT}` (trimmed, lower-cased) '
             f'and the create button is GONE — while results are still listed',
             OPTIONS_JS +
             f"const hit = tags.some(t => t.trim() === '{EXACT_HIT}');\n"
             "return hit && tags.length >= 2 && create.length === 0;", timeout=30),

    # ---- C: no match at all — the original behaviour still holds --------------------------
] + type_search(NO_MATCH, "a term that matches nothing") + [
    jsassert("NO MATCH: no tag options, and the create button is offered",
             OPTIONS_JS +
             f"return tags.length === 0 && create.some(t => t.indexOf(\"'{NO_MATCH}'\") !== -1);",
             timeout=30),

    # ---- leave nothing behind -------------------------------------------------------------
] + type_search("", "an empty term (clearing the search)") + [
    step("click", "Close the tag editor with its own `Done` (selecting an option would WRITE)",
         {"element": xpath_el(JOB_URL, DONE)}, always=True, timeout=30),
    step("wait", "Let the tag modal close", {"value": 2}, always=True),
    step("assertPageLacks", "RESTORED: the tag editor is gone",
         {"value": "Search tags..."}, always=True),
    step("click", f'RESTORE: back to the "{FIRST_TAB}" tab',
         {"element": xpath_el(JOB_URL, tab(FIRST_TAB))}, always=True, timeout=30),
    step("wait", "Let the first tab render", {"value": 2}, always=True),
]

write(test(
    "MOB.547_AssetVerify_Photo_Tag_Search",
    "`MOB.547` **The tag search's create button is an exclusive-or with an exact match** —\n"
    "checklist 🟢 #18, covering `db95798d54` (2026-09-10).\n"
    "- READ-ONLY. It sets the search input's value and reads the dropdown. Selecting an option\n"
    "  assigns a tag and the create option posts a new one, so neither is ever clicked; it\n"
    "  leaves through `Done`.\n"
    "- ⭐ **The rule changed from *no results* to *no EXACT match*.** A partial term now shows\n"
    "  results **and** the create button — impossible before. Three probes close it:\n"
    f"  `{PARTIAL}` → `{PARTIAL_HIT}` listed **and** create offered · `{EXACT_PADDED}` →\n"
    f"  `{EXACT_HIT}` matched, two options listed, create **gone** · `{NO_MATCH}` → no options,\n"
    "  create offered.\n"
    f"- The padded, mis-cased `{EXACT_PADDED}` also proves the `trim().toLocaleLowerCase()`\n"
    "  normalisation, on a search that still returns results — so *results exist* and *create\n"
    "  hidden* are shown to be independent.\n"
    "- 🛑 The tag badge is a NAME badge when the photo has 1–3 tags and only reads\n"
    "  `Edit Tags (n)` otherwise (`PhotoMenu.tsx:154-181`), so it is targeted by the green\n"
    "  outline the component itself sets, not by that text.\n"
    "- Runs on `MOB.546`'s route (AV asset detail → Attachments → Photos).",
    steps,
    ["Mobile", "env:dev", "Asset Verification", "Photos", "read-only"],
))
print("wrote MOB.547 (photo tag search create-button exclusive-or)")
