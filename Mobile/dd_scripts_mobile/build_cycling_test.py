"""Build MOB.570 - the left/right record-cycling arrows on the asset detail (T2.2).

MUCH SIMPLER THAN THE FIRST DRAFT, BECAUSE THE ASSET NAMES ARE KNOWN NOW
  The abandoned version captured the current asset's identity into sessionStorage, cycled,
  and compared - all to avoid needing to know WHICH assets the fixture job holds. That was
  engineering around Appendix D Q7 instead of asking it. With `Tank 0000` and
  `A/C Motor 0002` known (owner, 2026-08-13) the test just names what it expects to land on,
  which is both shorter and a stronger claim.

WRAP-AROUND IS THE SECOND HALF OF THE PROOF
  `onClick` wraps: `newIndex = currentIndex + 1 === total ? 0 : currentIndex + 1`. The fixture
  job has exactly TWO assets, so forward twice must return to the start. Without that, the
  test only shows the arrow moved somewhere once.

  The cycle length depends on the segmented filter (`filteredAssets` honours it), and
  `av_job_gate` leaves it on the default `All` - which is why this does not touch it.

ICONS LOOKED UP, NOT GUESSED (trap 14)
  faCircleArrowLeft -> "circle-arrow-left", faCircleArrowRight -> "circle-arrow-right",
  measured with node. The buttons have no accessible name, so the icon IS the locator.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import BASE, HERE, step, xpath_el, test, write, av_job_gate  # noqa: E402

JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
JOB_URL = f"{BASE}/asset-verify/{JOB_ID}"
ASSET_T = "Tank 0000"
ASSET_A = "A/C Motor 0002"


def arrow(direction, showing):
    """The arrow belonging to the cycler that is CURRENTLY showing `showing`.

    Two RecordCycleButtons render on this page (the unscoped locator hit "Multiple elements
    found", and `[last()]` picked the wrong one - caught by the BASELINE assertion, which is
    why that assertion exists). Rather than guess an index a third time, each click targets
    the cycler whose own Group contains the asset we know is on screen at that moment. The
    test always knows that: it asserts the name immediately before each click.

    `parent::*` is the Group that RecordCycleButtons renders - Button, title div, Button - so
    this is "the forward arrow sitting next to the title that reads X".
    """
    name = "circle-arrow-left" if direction == "back" else "circle-arrow-right"
    return (f'//button[.//*[@data-icon="{name}"'
            f' or contains(concat(" ", normalize-space(@class), " "), " fa-{name} ")]'
            f'][parent::*[contains(., "{showing}")]]')


def link(name):
    # contains + innermost span: the rendered name carries an emoji prefix, and TruncateText
    # wraps the Highlight so both spans match (trap 3).
    return f'(//span[contains(normalize-space(.), "{name}")])[last()]'


def title_shows(name):
    """True when SOME cycler group shows `name` between its two arrows.

    Scoped to a cycler group rather than the page: the asset name also appears in the header
    and elsewhere, so a page-level check would pass without the cycler having moved (trap 5b).
    Any-group rather than a positional one because there are two cyclers and which is which is
    not knowable from source - and `arrow()` clicks the arrow of whichever group shows this
    name, so assertion and click always refer to the same control.
    """
    return ("const groups = [...document.querySelectorAll('button')]\n"
            "  .filter(b => b.querySelector('[data-icon=\"circle-arrow-right\"]'))\n"
            "  .map(b => b.parentElement).filter(Boolean);\n"
            "if (!groups.length) return false;\n"
            f"return groups.some(g => (g.textContent || '').indexOf('{name}') !== -1);")


from dd_tools import jsassert  # noqa: E402

write(test(
    "MOB.570_AssetVerify_Asset_Cycling",
    "`MOB.570` The left/right arrows cycle between a job's assets, and wrap around.\n"
    "- READ-ONLY. Pure navigation between two existing assets.\n"
    f"- Starts on `{ASSET_T}`, cycles forward to `{ASSET_A}`, forward again to **wrap** back,\n"
    f"  then back-arrows to `{ASSET_A}` again. Wrap-around is the half that distinguishes\n"
    "  *cycling works* from *the arrow moved somewhere once*.\n"
    "- Assertions are scoped to the text **between the two arrows**, not the whole page: the\n"
    "  asset name also appears in the header, so a page-level check would pass without the\n"
    "  cycler moving at all (trap 5b).\n"
    "- `faCircleArrowLeft`/`Right` render as `circle-arrow-left`/`circle-arrow-right` —\n"
    "  measured, not guessed (trap 14). The buttons have no accessible name.\n"
    "- Does not touch the segmented filter: `filteredAssets` honours it, so a status filter\n"
    "  would change the cycle length and make the wrap assertion wrong.",
    av_job_gate(JOB_ID) + [
        step("click", f"Open {ASSET_T}'s full-page detail",
             {"element": xpath_el(JOB_URL, link(ASSET_T))}, timeout=30),
        step("wait", "Let the asset detail begin rendering", {"value": 2}),
        step("assertPageContains", "The full-page asset detail rendered",
             {"value": "Asset Type:"}, timeout=30),
        step("assertElementPresent", f"The cycling arrows next to {ASSET_T} are rendered",
             {"element": xpath_el(JOB_URL, arrow("fwd", ASSET_T))}, timeout=30),
        jsassert(f'BASELINE: the cycler shows "{ASSET_T}"', title_shows(ASSET_T), timeout=30),

        step("click", "Cycle FORWARD",
             {"element": xpath_el(JOB_URL, arrow("fwd", ASSET_T))}, timeout=30),
        step("wait", "Let the next asset render", {"value": 3}),
        jsassert(f'PROOF: forward moved to "{ASSET_A}"', title_shows(ASSET_A), timeout=30),

        step("click", "Cycle FORWARD again — with 2 assets this must wrap",
             {"element": xpath_el(JOB_URL, arrow("fwd", ASSET_A))}, timeout=30),
        step("wait", "Let the wrap render", {"value": 3}),
        jsassert(f'PROOF: cycling wrapped back to "{ASSET_T}"', title_shows(ASSET_T),
                 timeout=30),

        step("click", "Cycle BACK — the reverse arrow works too",
             {"element": xpath_el(JOB_URL, arrow("back", ASSET_T))}, timeout=30),
        step("wait", "Let the previous asset render", {"value": 3}),
        jsassert(f'PROOF: the back arrow moved to "{ASSET_A}"', title_shows(ASSET_A),
                 timeout=30),
    ],
    ["Mobile", "env:dev", "Asset Verification", "read-only"],
))

# ---------------------------------------------------------------- wire into MOB.993
suite_path = os.path.join(HERE, "MOB.993_AssetVerify_Suite.json")
doc = json.load(open(suite_path))
steps = doc["details"]["steps"]
CHILD = "MOB.570_AssetVerify_Asset_Cycling"
if CHILD not in [s.get("name") for s in steps]:
    steps.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                  "isCritical": True, "name": CHILD, "noScreenshot": False,
                  "type": "playSubTest",
                  "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
    with open(suite_path, "w") as f:
        f.write(json.dumps(doc, indent=4))
    print(f"added {CHILD} to MOB.993")
    print("REMINDER: add it to CHILDREN in build_verify_suite.py (trap 12)")

print("wrote MOB.570 (asset cycling arrows)")
