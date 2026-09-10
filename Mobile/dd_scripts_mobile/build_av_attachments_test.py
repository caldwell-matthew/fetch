"""Build MOB.546 - the ATTACHMENTS tab on the AV full-page asset detail (checklist 🟢 #11).

WHAT SHIPPED WITHOUT A TEST
  `AssetDetails.tsx:214` renders `SegmentedAssetAttachments` for a template section of type
  `ATTACHMENTS`. `MOB.545`/`575`/`550` open Attributes, Failure, Condition and Readings on that
  same page; nothing opened Attachments. The checklist row carried "⏳ whether the fixture job's
  template has that section is unverified" - settled 2026-09-10 by reading the template through
  the API for **0 Datadog runs** (`reset_av_fixture.Session`):

      7/15 Template -> GENERAL_INFO · ATTRIBUTES · FAILURES · CONDITION · EVENT_READINGS ·
                       ATTACHMENTS

⭐ WHY THIS IS NOT A THIRD COPY OF MOB.624 / MOB.865
  Those two drive the same component from the collector row's modal and the material item. Two
  things here are genuinely new:

  1. **The tab shell is pinned, correctly this time.** `InfiniteTabs.tsx:81` sets
     `keepMounted={false}`, and the first version of this test read that as "only one panel is
     in the DOM". It is not: `TabsPanel.mjs:24,32` keeps the panel ELEMENT for every tab and
     drops only its CHILDREN, leaving `display:none` shells - the same shape that cost
     `MOB.623` two runs on the collector. The assertion now says what is true: several panels
     exist, exactly ONE has content, and that one is the tab the user selected. If the app ever
     flips to `keepMounted`, this goes red and says so.
  2. **Both segments are populated.** The fixture asset carries 5 images/video AND 1 PDF
     (counted through the API, 0 runs). So "no carousel on Docs" is proved on a screen where a
     carousel demonstrably exists on Photos - the biconditional has real content on both sides,
     which `MOB.624` could only get from `MOB.623`'s residue.

READ-ONLY, AND STRUCTURALLY SO. It switches segments and reads. Nothing is uploaded: an upload
here would land (`FileAttachments.addFiles` has no image filter) and leave residue on a shared
fixture. `Add Photo` / `Add File` are asserted PRESENT, never clicked.

🛑 NO FILENAME IS HARDCODED - trap 29. The Docs assertion counts anchors pointing at
`/api/attachment/<id>` (`Attachments.tsx:104`), not `_Tank_0000_Condition_Assessment_….pdf`.
Anyone can rename an attachment; the shape of the row is the app's contract.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, HERE, step, xpath_el, test, write, jsassert,  # noqa: E402
                      av_job_gate, ACTIVE_PANEL_JS)

JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
JOB_URL = f"{BASE}/asset-verify/{JOB_ID}"
ASSET = "Tank 0000"          # identity anchor, matched by CONTAINS - it is stored as "⚡ Tank 0000"
TAB = "Attachments"
FIRST_TAB = "General Info"


def link(name):
    return f'(//span[contains(normalize-space(.), "{name}")])[last()]'


def tab(name):
    return f'//*[@role="tab"][contains(normalize-space(.), "{name}")]'


# 🛑 MEASURED, NOT ASSUMED. The first version of this test read `keepMounted={false}` on
# `InfiniteTabs` and asserted that exactly ONE `[role=tabpanel]` exists. It went red on a page
# that was rendering perfectly (the screenshot showed the carousel, the segments and
# `Add Photo`), because Mantine keeps the panel ELEMENT for every tab and only drops its
# CHILDREN - `TabsPanel.mjs:24,32`. `ACTIVE_PANEL_JS` follows the selected tab instead, which
# is the same approach `MOB.623` arrived at the hard way on the collector's tabs.
PANEL_JS = ACTIVE_PANEL_JS
BUTTONS = "const t = [...p.querySelectorAll('button')].map(b => (b.textContent || '').trim());\n"
CAROUSEL = '[class*="mantine-Carousel-slide"]'


def switch_segment(value, label):
    """Click the radio by VALUE. The labels are rendered by `useMediaQuery` inside a loop and
    are nondeterministic (bugs §22), so the value is the only stable handle."""
    return [
        jsassert(f'Switch to the "{label}" segment by VALUE ({value}) — never by label (§22)',
                 PANEL_JS +
                 "const root = p.querySelector('[class*=\"mantine-SegmentedControl-root\"]');\n"
                 "if (!root) return false;\n"
                 f"const el = root.querySelector('input[type=\"radio\"][value=\"{value}\"]');\n"
                 "if (!el) return false;\n"
                 "el.click();\n"
                 "return true;", timeout=30),
        step("wait", f"Let the {label} panel render", {"value": 3}),
    ]


steps = av_job_gate(JOB_ID) + [
    step("click", f"Open {ASSET}'s full-page detail",
         {"element": xpath_el(JOB_URL, link(ASSET))}, timeout=30),
    step("wait", "Let the asset detail begin rendering", {"value": 2}),
    step("assertPageContains", "The full-page asset detail rendered",
         {"value": "Asset Type:"}, timeout=30),

    step("click", f'Open the "{TAB}" tab', {"element": xpath_el(JOB_URL, tab(TAB))}, timeout=30),
    step("wait", "Wait for the panel", {"value": 3}),

    # ⭐ The structural claim, stated the way the library actually behaves: every tab keeps a
    # panel element, `keepMounted={false}` empties the inactive ones, and the ACTIVE one is the
    # only place the Attachments UI exists. Pinning this is what stops the next author (or me)
    # from reaching for `[role=tabpanel]` positionally.
    jsassert("⭐ The ACTIVE panel holds the attachments UI, and the inactive tabs are empty "
             "shells — `keepMounted={false}` drops children, not the panel element",
             PANEL_JS +
             "const all = [...document.querySelectorAll('[role=\"tabpanel\"]')];\n"
             "if (all.length < 2) return false;\n"
             "const withContent = all.filter(x => (x.textContent || '').trim().length > 0);\n"
             "if (withContent.length !== 1 || withContent[0] !== p) return false;\n"
             "return !!p.querySelector('[class*=\"mantine-SegmentedControl-root\"]');",
             timeout=30),
    jsassert("SEGMENTS: exactly two, values 1 (Photos) and 2 (Docs)",
             PANEL_JS +
             "const root = p.querySelector('[class*=\"mantine-SegmentedControl-root\"]');\n"
             "if (!root) return false;\n"
             "const vals = [...root.querySelectorAll('input[type=\"radio\"]')].map(i => i.value);\n"
             "return JSON.stringify(vals) === JSON.stringify(['1', '2']);", timeout=30),
] + switch_segment("1", "Photos") + [
    jsassert("⭐ PHOTOS: a carousel with at least one slide, `Add Photo`, and NO `Add File`",
             PANEL_JS + BUTTONS +
             f"const slides = p.querySelectorAll('{CAROUSEL}').length;\n"
             "return slides >= 1 && t.includes('Add Photo') && !t.includes('Add File');",
             timeout=30),
] + switch_segment("2", "Docs") + [
    jsassert("⭐ DOCS: a real download row, `Add File`, NO `Add Photo`, NO carousel — the "
             "biconditional closes with both sides populated",
             PANEL_JS + BUTTONS +
             "const files = p.querySelectorAll('a[href^=\"/api/attachment/\"]').length;\n"
             f"return files >= 1 && !p.querySelector('{CAROUSEL}')\n"
             "  && t.includes('Add File') && !t.includes('Add Photo');", timeout=30),

    # ---- restore: leave the detail on its first tab and the segment on Photos --------------
] + switch_segment("1", "Photos") + [
    step("click", f'RESTORE: back to the "{FIRST_TAB}" tab',
         {"element": xpath_el(JOB_URL, tab(FIRST_TAB))}, always=True, timeout=30),
    step("wait", "Let the first tab render", {"value": 2}, always=True),
    jsassert(f'RESTORED: the "{FIRST_TAB}" tab is the selected one',
             "const sel = document.querySelector('[role=\"tab\"][aria-selected=\"true\"]');\n"
             f"return !!sel && (sel.textContent || '').includes('{FIRST_TAB}');",
             always=True, timeout=30),
]

write(test(
    "MOB.546_AssetVerify_Asset_Attachments",
    "`MOB.546` **The `Attachments` tab on the AV full-page asset detail** — checklist 🟢 #11.\n"
    "- READ-ONLY. Switches segments and reads. Nothing is uploaded: an upload here would land\n"
    "  and leave residue on a shared fixture, so `Add Photo`/`Add File` are asserted present\n"
    "  and never clicked.\n"
    "- ⭐ **Two things are new versus `MOB.624`/`MOB.865`**, which drive the same component\n"
    "  elsewhere. First, the tab shell: several `[role=tabpanel]` elements exist and exactly\n"
    "  ONE carries content — `keepMounted={false}` drops children, not the element\n"
    "  (`TabsPanel.mjs:24,32`), which is the trap that cost `MOB.623` two runs. Second, the fixture\n"
    "  asset carries **both** photos and a PDF, so `no carousel on Docs` is proved on a screen\n"
    "  where a carousel demonstrably exists on Photos.\n"
    "- Segments are switched by radio **value** (`1`/`2`), never by label — the labels are\n"
    "  rendered through `useMediaQuery` inside a loop and are nondeterministic (bugs §22).\n"
    "- 🛑 **No filename is hardcoded** (trap 29): the Docs proof counts anchors pointing at\n"
    "  `/api/attachment/<id>`, which is the row's shape, not someone's file name.\n"
    "- Ends back on the `General Info` tab with the Photos segment selected.",
    steps,
    ["Mobile", "env:dev", "Asset Verification", "Photos", "read-only"],
))

# ---------------------------------------------------------------- wire into MOB.993
suite_path = os.path.join(HERE, "MOB.993_AssetVerify_Suite.json")
doc = json.load(open(suite_path))
steps_ = doc["details"]["steps"]
CHILD = "MOB.546_AssetVerify_Asset_Attachments"
if CHILD not in [s.get("name") for s in steps_]:
    steps_.append({"allowFailure": False, "alwaysExecute": False, "exitIfSucceed": False,
                   "isCritical": True, "name": CHILD, "noScreenshot": False,
                   "type": "playSubTest",
                   "params": {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1}})
    json.dump(doc, open(suite_path, "w"), indent=2)
    print(f"wired {CHILD} into MOB.993 (run wire_suite.py, then push)")
print("wrote MOB.546 (AV asset detail attachments tab)")
