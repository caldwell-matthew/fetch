"""Build MOB.985_WorkDetail_Suite - the work order DETAIL page's off-tab surfaces.

WHY A NEW SUITE RATHER THAN MOB.991
  Appendix F0: `MOB.991` ran green at 474s with 13 children and hit Datadog's MAXIMUM TEST
  EXECUTION TIME (1071s, capped) the moment a 70-step child was added. It has perhaps 500s of
  headroom, and a gate-heavy child eats all of it - so it is not the place for new work-order
  coverage. Small suites also parallelise, which is Appendix F item 3.

WHAT LIVES HERE
  The surfaces on `WorkDetails.tsx` that are NOT tabs, all of which the 2026-08-18 walk found
  unlisted:
    MOB.347  the Assets tab and its two status controls     READ-ONLY   (built 08-20)
    -        MapLink / LocationForm                          open
    -        record cycling (RecordCycleButtons)             open
  The warranty banner was folded into MOB.399 instead, because it needs the Warranties tab
  open and MOB.399 is already there.

READ-ONLY FOR NOW. Every child is read-only, so this suite is a scheduling candidate if
scheduling is ever turned on. If a mutating child is added later, say so here and move it out
of the read-only list in *Coverage at a glance* - that table, not the tags, is what people
rely on for safety.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import HERE, step, test, write  # noqa: E402

login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]

# ⚠️ KEEP IN SYNC WITH THE JSON — regenerating a suite whose children were wired directly
# into its JSON silently drops them (trap 19, reverse). It has happened twice: five children
# from MOB.986, one from MOB.995.
CHILDREN = ["MOB.347_Work_Asset_Status",
            "MOB.348_Work_MapLink",
            "MOB.349_Work_Record_Cycling",
            "MOB.355_Work_Form_Render"]

write(test(
    "MOB.985_WorkDetail_Suite",
    "`MOB.985` The work order **detail page's off-tab surfaces** — the parts of\n"
    "`WorkDetails.tsx` that are not tabs.\n"
    "- **READ-ONLY**, so it is a scheduling candidate. Say so here if that ever changes.\n"
    "- **Deliberately separate from `MOB.991`**, which is at Datadog's maximum test execution\n"
    "  time (Appendix F0) — adding one 70-step child took it from 474s to capped.\n"
    "- Children: `MOB.347` (Assets tab + status controls). `MapLink`/`LocationForm` and\n"
    "  record cycling belong here too and are still open.\n"
    "- subtestPublicId values stay PENDING-WIRE-UP until the children exist on Datadog;\n"
    "  run wire_suite.py after pushing them.",
    login_steps + [step("playSubTest", c,
                        {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1})
                   for c in CHILDREN],
    ["Mobile", "env:dev", "Work Orders", "suite", "read-only"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))
print("wrote MOB.985_WorkDetail_Suite")
