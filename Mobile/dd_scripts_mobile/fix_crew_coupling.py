"""Decouple the suite from crew-scoped state.

Two problems this fixes:

1. MOB.200_Crew_Switch fires CHANGE_SESSION_ROLE and never restores the previous crew,
   so every suite run leaves the account on a different crew. That is not self-contained:
   both mobileJobsForCrew (AssetVerification) and workStages(crew: '<SESSION>')
   (WorkOrders) are crew-scoped, so the next run sees a different data set - it can hide
   the "Find Mobile Job(s)" input entirely, and can orphan the MOB.300 record that
   MOB.310/MOB.320 filter for. Removed from MOB.999; keep running it deliberately.

2. MOB.140's "Find Mobile Job(s)" assertion is data-dependent, not a route signal:
   AssetVerification/index.tsx only renders that SearchInput when
   `data?.mobileJobs && sortedFilteredList`. A crew with no mobile jobs has no input.
   The PageTitle assertion is the crew-independent route signal, so the search-input
   check becomes optional.
"""
import json, os

HERE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dd_tests_mobile")

# 1. drop the crew switch from the suite
suite_path = os.path.join(HERE, "MOB.999_Mobile_Suite.json")
suite = json.load(open(suite_path))
before = len(suite["details"]["steps"])
suite["details"]["steps"] = [
    s for s in suite["details"]["steps"]
    if not (s["type"] == "playSubTest" and s["name"] == "MOB.200_Crew_Switch")
]
removed = before - len(suite["details"]["steps"])
suite["details"]["message"] = suite["details"]["message"].replace(
    "- subtestPublicId values are PENDING-WIRE-UP until the children are thrown; see wire_suite.py.",
    "- subtestPublicId values are PENDING-WIRE-UP until the children are thrown; see wire_suite.py.\n"
    "- MOB.200_Crew_Switch is deliberately NOT chained here: it mutates the session crew,\n"
    "  and both mobile jobs and work orders are crew-scoped, so it destabilises later runs.")
with open(suite_path, "w") as f:
    f.write(json.dumps(suite, indent=4))

# 2. make the crew-dependent mobile-jobs search assertion optional
mj_path = os.path.join(HERE, "MOB.140_Nav_Mobile_Jobs.json")
mj = json.load(open(mj_path))
changed = 0
for s in mj["details"]["steps"]:
    if s["type"] == "assertElementPresent" and "search input" in s["name"]:
        s["allowFailure"] = True
        s["isCritical"] = False
        s["name"] = s["name"] + " (optional: crew-scoped data)"
        changed += 1
mj["details"]["message"] += (
    "\n- The search-input check is optional: AssetVerification renders it only when the\n"
    "  current crew actually has mobile jobs (mobileJobsForCrew). The page title is the\n"
    "  crew-independent route assertion.")
with open(mj_path, "w") as f:
    f.write(json.dumps(mj, indent=4))

print(f"MOB.999: removed {removed} crew-switch subtest step(s)")
print(f"MOB.140: made {changed} step(s) optional")
