"""Build MOB.580 (sort ORDERING) and MOB.590 (verified asset absent from Unverified).

Both were blocked on Appendix D Q7 - "what are the fixture job's two asset names?" - which the
repo owner answered 2026-08-13: `Tank 0000` and `A/C Motor 0002`.

MOB.580 CLOSES THE SB BLOCK'S LAST GAP: NOTHING PROVED SORTING SORTS
  Every sort test until now proved a sort could be CHOSEN - the modal opens, the selection
  persists to sessionStorage (MOB.810) - but never that the list came out in that order.
  Proving an order needs two records whose relative order is known in advance, which is
  exactly what Q7 supplied:

      Name ascending   ->  "A/C Motor 0002" before "Tank 0000"
      Name descending  ->  "Tank 0000" before "A/C Motor 0002"

  The assertion compares POSITIONS in the rendered list, and requires BOTH assets to be found
  before it compares - so it cannot pass on a list that is missing one of them, or empty
  (trap 5). Asserting "the first row is X" would have been weaker: it passes when the second
  row is missing entirely.

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
ASSET_A = "A/C Motor 0002"      # sorts FIRST by name ascending
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


def order_js(first, second):
    """True when `first` appears BEFORE `second` in the rendered asset list.

    Requires both to be present before comparing, so it cannot pass on a list that is empty
    or missing one of them - the failure mode a "the first row is X" assertion would hide.
    """
    return (
        "const items = [...document.querySelectorAll('[class*=\"mantine-Accordion-item\"]')]\n"
        "  .map(e => e.textContent || '');\n"
        f"const a = items.findIndex(t => t.indexOf('{first}') !== -1);\n"
        f"const b = items.findIndex(t => t.indexOf('{second}') !== -1);\n"
        "if (a < 0 || b < 0) return false;\n"
        "return a < b;")


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
    "  in that order. Doing so needs two records whose order is known in advance, which is\n"
    f"  what Appendix D Q7 unblocked: `{ASSET_A}` sorts before `{ASSET_T}` ascending.\n"
    "- The assertion compares **positions** and requires **both** assets to be found first,\n"
    "  so it cannot pass on an empty or half-rendered list (trap 5). *The first row is X* is\n"
    "  weaker — it passes when the second row is missing entirely.\n"
    "- Leaves the Asset sort set in `sessionStorage`. Harmless: every test that clicks an\n"
    "  asset now targets it **by name**, not by position.",
    av_job_gate(JOB_ID)
    + sort_by("Name ▲")
    + [jsassert(f'PROOF (ascending): "{ASSET_A}" is listed before "{ASSET_T}"',
                order_js(ASSET_A, ASSET_T), timeout=30)]
    + sort_by("Name ▼")
    + [jsassert(f'PROOF (descending): the order REVERSED — "{ASSET_T}" now precedes '
                f'"{ASSET_A}"', order_js(ASSET_T, ASSET_A), timeout=30)]
    + sort_by("Name ▲")
    + [jsassert("RESTORED: ascending order again", order_js(ASSET_A, ASSET_T),
                timeout=30, always=True)],
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
