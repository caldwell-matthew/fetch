"""Build MOB.580 (sort ORDERING) and MOB.590 (verified asset absent from Unverified).

Both were blocked on Appendix D Q7 - "what are the fixture job's two asset names?" - which the
repo owner answered 2026-08-13: `Tank 0000` and `A/C Motor 0002`.

MOB.580 CLOSES THE SB BLOCK'S LAST GAP: NOTHING PROVED SORTING SORTS
  Every sort test until now proved a sort could be CHOSEN - the modal opens, the selection
  persists to sessionStorage (MOB.810) - but never that the list came out in that order.
  Proving an order needs at least two records on screen, which is what Q7 supplied.

🛑 VERSION 2 - THAT HARDCODED PAIR WAS A BUG, AND IT COST A SUITE.
  `MOB.993` went red on 2026-09-09 and again on 2026-09-10 with all three proofs false, and it
  was blamed on the app: bugs §36, "the sort pick leaves the list unmoved". It was the test.
  ⭐ **The fixture asset has been renamed `⚡ Tank 0000`** - the lightning bolt is part of the
  stored name - and `searchSort` orders by `localeCompare`, which collates that symbol BEFORE
  the letter `A`:

      '⚡ Tank 0000'.localeCompare('A/C Motor 0002')  ===  -1

  So ascending really does render Tank first, descending really does reverse it, and the app
  was right every time. The DIAG steps below are what proved it: they read
  `sessionStorage['mobile-Asset-sort']` back after each pick, both came out green, so the
  selection HAD reached the app - which left "the app sorted correctly and the test expected
  the wrong order" as the only branch standing.

  ➡️ **NEVER HARDCODE WHICH OF TWO RECORDS SORTS FIRST.** A record can be renamed by anyone
  with the app open, and a name's collation position is not a property the test controls. The
  assertions now read the rendered names and check them against the app's OWN comparator
  (`localeCompare`, `AssetVerification/utils/index.ts:154`), which is `MOB.535`'s monotonicity
  pattern applied to a two-row list: ASC must equal the sorted order, DESC must equal its
  exact reverse. That is *stronger* than the old positional check and survives a rename.

  Both fixture assets must still be FOUND before anything is compared, so the proof cannot
  pass on a list that is missing one of them, or empty (trap 5). Asserting "the first row is X"
  would have been weaker: it passes when the second row is missing entirely.

MOB.590 NAMES THE ASSET INSTEAD OF COUNTING CHECKBOXES
  MOB.510 verifies `(//input[@type="checkbox"])[1]` - whichever asset happens to be first.
  That was unavoidable before Q7 and it is a positional dependency: change the sort and the
  test verifies a different asset. This one targets the checkbox INSIDE the row containing
  `Tank 0000`, so it always acts on the asset it claims to.

  SELF-RESTORING: verify -> assert -> unverify, with the restore legs marked `always` so a
  failed assertion cannot leave the fixture job with a verified asset. The fixture contract
  is "exactly 2 assets, neither verified" and several other tests depend on it.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, HERE, step, xpath_el, go, test, write, jsassert,
                      av_job_gate)  # noqa: E402

JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
JOB_URL = f"{BASE}/asset-verify/{JOB_ID}"
# Identity anchors only - the two rows that must BE there. Which one sorts first is
# computed, never assumed: the fixture is currently named `⚡ Tank 0000` and that sorts
# ahead of `A/C Motor 0002`. See the header.
ASSET_A = "A/C Motor 0002"
ASSET_T = "Tank 0000"
TAGS = ["Mobile", "env:dev", "Asset Verification"]

SORT_BTN = ('//button[.//*[@data-icon="sort-alt" or @data-icon="arrow-down-arrow-up"'
            ' or contains(concat(" ", normalize-space(@class), " "), " fa-sort-alt ")'
            ' or contains(concat(" ", normalize-space(@class), " "),'
            ' " fa-arrow-down-arrow-up ")]]')
SORT_SELECT = ('//*[contains(concat(" ", normalize-space(@class), " "),'
               ' " mantine-Modal-content ")][contains(., "Sort Criteria")]'
               '//input[contains(concat(" ", normalize-space(@class), " "),'
               ' " mantine-Select-input ")]')


def row(name):
    return ('//*[contains(concat(" ", normalize-space(@class), " "),'
            f' " mantine-Accordion-item ")][contains(., "{name}")]')


# Reads each row's NAME - the ordering key `searchSort` actually sorts on - rather than the
# whole row text, which also carries the description and the created-by line. The name is the
# `Highlight` span in `JobAccordianControl.tsx:33-40`, identified by the inline underline it
# carries as the row's navigate affordance; the class fallbacks are there so a Mantine rename
# degrades to a different selector rather than to `false`. Returning null for a row whose name
# cannot be read makes the assertion fail loudly instead of comparing a short list to itself.
NAMES_JS = (
    "const nameOf = it => {\n"
    "  const c = it.querySelector('[class*=\"mantine-Accordion-control\"]');\n"
    "  if (!c) return null;\n"
    "  const el = c.querySelector('span[style*=\"underline\"]')\n"
    "    || c.querySelector('[class*=\"mantine-Highlight-root\"]')\n"
    "    || c.querySelector('[class*=\"mantine-Text-root\"]');\n"
    "  return el ? (el.textContent || '').trim() : null;\n"
    "};\n"
    "const names = [...document.querySelectorAll('[class*=\"mantine-Accordion-item\"]')]\n"
    "  .map(nameOf);\n"
    "if (names.length < 2 || names.some(n => !n)) return false;\n")


def order_js(direction):
    """The rendered order IS the app's own sort order, in `direction`.

    🛑 NOT "asset X is before asset Y". A hardcoded pair encodes a collation the test does not
    control: `⚡ Tank 0000` sorts before `A/C Motor 0002` under `localeCompare` because of the
    leading symbol, which is what made version 1 read a correct app as broken (see the header).

    This computes the expectation from the names on screen using the comparator the app uses
    (`searchSort` -> `String.localeCompare`, `AssetVerification/utils/index.ts:154`), so it
    proves the ordering property rather than one memorised arrangement. Both fixture assets
    must be present first, so it still cannot pass on a half-rendered list (trap 5).
    """
    assert direction in ("ASC", "DESC")
    return (
        NAMES_JS +
        f"if (!names.some(n => n.indexOf('{ASSET_A}') !== -1)) return false;\n"
        f"if (!names.some(n => n.indexOf('{ASSET_T}') !== -1)) return false;\n"
        "const sorted = [...names].sort((a, b) => a.localeCompare(b));\n"
        + ("" if direction == "ASC" else "sorted.reverse();\n") +
        "return JSON.stringify(names) === JSON.stringify(sorted);")


def stored_sort(sort_id, label):
    """DIAGNOSTIC, `optional` — did the SELECTION reach the app at all?

    `SortDropdown.tsx:84-91` writes `sessionStorage['mobile-Asset-sort']` and calls
    `props.onChange` in the SAME branch, and closes the modal either way. So the modal
    shutting is NOT evidence the sort was taken, and on 2026-09-09 `MOB.993` failed with
    exactly that shape: every click green, modal closed, list unmoved. This step splits the
    two halves of that failure:

        this ok  + PROOF red  ->  the app took the selection; the PROOF's expectation is wrong
        this ERR + PROOF red  ->  the click never became an onChange               (UI change)

    ⭐ On 2026-09-10 both DIAGs came out green while all three proofs were red, which is what
    identified the hardcoded pair as the defect rather than the app. They stay: they are two
    cheap steps that tell a test bug from an app bug in ONE run instead of a day of reading.

    `optional=True` so it reports its finding without owning the verdict.
    """
    return jsassert(f'DIAG: the app stored the "{label}" selection '
                    f'(`mobile-Asset-sort` = {sort_id})',
                    "let raw = null;\n"
                    "try { raw = sessionStorage.getItem('mobile-Asset-sort'); } catch (e) { return false; }\n"
                    "if (!raw) return false;\n"
                    "let v = null;\n"
                    "try { v = JSON.parse(raw); } catch (e) { return false; }\n"
                    f"return !!v && v.id === '{sort_id}';", optional=True, timeout=15)


def sort_by(label):
    return [
        step("click", "Open the sort dropdown",
             {"element": xpath_el(JOB_URL, SORT_BTN)}, timeout=30),
        step("wait", "Wait for the sort modal", {"value": 2}),
        step("assertPageContains", "The Sort Criteria modal opened", {"value": "Sort Criteria"}),
        step("click", "Open the sort options",
             {"element": xpath_el(JOB_URL, SORT_SELECT)}),
        step("wait", "Wait for the options", {"value": 2}),
        step("click", f'Pick "{label}"',
             {"element": xpath_el(
                 JOB_URL, f'//*[@role="option"][normalize-space(.)="{label}"]')}, timeout=30),
        step("wait", "Wait for the list to re-order", {"value": 3}),
    ]


# ---------------------------------------------------------------- 580: sort ordering
write(test(
    "MOB.580_AssetVerify_Sort_Ordering",
    "`MOB.580` **Sorting actually reorders the list** — the SB block's last open item.\n"
    "- READ-ONLY. Changes only the sort selection.\n"
    "- **Nothing in this suite proved this before.** MOB.340/530 prove the sort modal opens;\n"
    "  MOB.810 proves a choice persists to `sessionStorage`. Neither shows the rows came out\n"
    "  in that order.\n"
    "- ⭐ The proof reads the rendered NAMES and checks them against the app's own comparator\n"
    "  (`localeCompare`) — ASC is the sorted order, DESC is its exact reverse. It does **not**\n"
    "  hardcode which asset comes first: `⚡ Tank 0000` collates before `A/C Motor 0002`, and\n"
    f"  the old hardcoded pair read a correct app as broken for two runs.\n"
    f"- Both `{ASSET_A}` and `{ASSET_T}` must be found before anything is compared, so it\n"
    "  cannot pass on an empty or half-rendered list (trap 5).\n"
    "- Leaves the Asset sort set in `sessionStorage`. Harmless: every test that clicks an\n"
    "  asset now targets it **by name**, not by position.\n"
    "- The three proofs are `soft`: a red one still fails THIS test, but it no longer aborts\n"
    "  the run — on 2026-09-09 the ascending proof took `MOB.993`'s other 7 children down with\n"
    "  it, and none of them had run.\n"
    "- Each proof is preceded by an `optional` **DIAG** reading `mobile-Asset-sort`, which\n"
    "  separates *the app never took the selection* from *the app took it and did not\n"
    "  reorder*.",
    av_job_gate(JOB_ID)
    + sort_by("Name ▲")
    + [stored_sort("name_ASC", "Name ▲"),
       jsassert("PROOF (ascending): the rendered names ARE the sorted order",
                order_js("ASC"), timeout=30, soft=True)]
    + sort_by("Name ▼")
    + [stored_sort("name_DESC", "Name ▼"),
       jsassert("PROOF (descending): the rendered names are that order EXACTLY REVERSED",
                order_js("DESC"), timeout=30, soft=True)]
    + sort_by("Name ▲")
    + [jsassert("RESTORED: ascending order again", order_js("ASC"),
                timeout=30, always=True, soft=True)],
    TAGS + ["read-only", "SB"],
))

# ---------------------------------------------------------------- 590: unverified tab
CHECKBOX = f'{row(ASSET_T)}//input[@type="checkbox"]'


def filt(label):
    return f'//label[.//span[normalize-space(.)="{label}"]]'


write(test(
    "MOB.590_AssetVerify_Unverified_Tab",
    f"`MOB.590` A verified asset disappears from **Unverified** and appears on **Verified**.\n"
    "- **SELF-RESTORING**: verifies, asserts, then unverifies. The restore legs are\n"
    "  `alwaysExecute`, so a failed assertion cannot leave the fixture with a verified asset —\n"
    "  the fixture contract is *exactly 2 assets, neither verified*, and MOB.500/510 depend\n"
    "  on it.\n"
    f"- Acts on **`{ASSET_T}` by name**: the checkbox is the one inside that asset's row.\n"
    "  MOB.510 uses `(//input[@type='checkbox'])[1]` — whichever asset happens to be first —\n"
    "  which was unavoidable before Q7 and breaks silently if the sort changes.\n"
    "- The **negative** leg is the proof: absence from `Unverified` is what shows the filter\n"
    "  reflects verification state. Presence on `Verified` alone would also be satisfied by a\n"
    "  filter that does nothing.",
    av_job_gate(JOB_ID) + [
        step("assertElementPresent", f"BASELINE: {ASSET_T} is present before verifying",
             {"element": xpath_el(JOB_URL, row(ASSET_T))}, timeout=30),
        step("click", f"Verify {ASSET_T}",
             {"element": xpath_el(JOB_URL, CHECKBOX)}, timeout=30),
        step("wait", "Wait for the verify mutation", {"value": 4}),

        step("click", 'Switch to the "Unverified" filter',
             {"element": xpath_el(JOB_URL, filt("Unverified"))}, timeout=30),
        step("wait", "Wait for the list to re-filter", {"value": 3}),
        step("assertPageLacks",
             f'PROOF: "{ASSET_T}" is GONE from the Unverified tab once verified',
             {"value": ASSET_T}),

        step("click", 'Switch to the "Verified" filter',
             {"element": xpath_el(JOB_URL, filt("Verified"))}, timeout=30),
        step("wait", "Wait for the list to re-filter", {"value": 3}),
        step("assertElementPresent", f'"{ASSET_T}" is on the Verified tab',
             {"element": xpath_el(JOB_URL, row(ASSET_T))}, timeout=30),

        # ---- restore, always: never leave the fixture with a verified asset
        step("click", f"Unverify {ASSET_T} from the Verified tab",
             {"element": xpath_el(JOB_URL, CHECKBOX)}, timeout=30, always=True),
        step("wait", "Wait for the unverify mutation", {"value": 4}, always=True),
        step("click", 'Switch back to the "All" filter',
             {"element": xpath_el(JOB_URL, filt("All"))}, timeout=30, always=True),
        step("wait", "Wait for the list to restore", {"value": 3}, always=True),
        step("assertElementPresent", f'RESTORED: "{ASSET_T}" is listed again under All',
             {"element": xpath_el(JOB_URL, row(ASSET_T))}, timeout=30, always=True),
    ],
    TAGS + ["CRUD"],
))

# ---------------------------------------------------------------- wire into MOB.993
suite_path = os.path.join(HERE, "MOB.993_AssetVerify_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
added = []
for child in ["MOB.580_AssetVerify_Sort_Ordering", "MOB.590_AssetVerify_Unverified_Tab"]:
    if child not in [s.get("name") for s in steps]:
        steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                      "isCritical": True, "name": child, "noScreenshot": False,
                      "type": "playSubTest",
                      "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
        added.append(child)
if added:
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print("added to MOB.993:", ", ".join(added))
    print("REMINDER: add both to CHILDREN in build_verify_suite.py (trap 12)")

print("wrote MOB.580 (sort ordering), MOB.590 (unverified tab)")
