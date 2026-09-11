"""Split the single MOB.999 chain into three focused suites.

Why: one serial chain means the first failure hides every subtest after it - that already
bit us when the crew switch broke MOB.140 and masked the rest of the run. Splitting also
lets read-only suites run on a different schedule from ones that write to dev.

  MOB.990_Smoke_Suite       login + every route check + the online guard   READ-ONLY
  MOB.991_WorkOrders_Suite  login + create / read / status-revert          MUTATES dev
  MOB.992_Menu_Suite        login + hamburger menu behaviour               READ-ONLY

Deliberately in NO suite:
  MOB.200_Crew_Switch  - switches crews; mobile jobs and work orders are both crew-scoped,
                         so running it mid-suite changes the data other subtests rely on.
  MOB.440_Logout       - ends the session; nothing can follow it.
Both are self-contained (they carry their own login steps) and run on demand.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import step, test, write, HERE  # noqa: E402

login_steps = json.load(open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]
CREDS = ("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD")


def sub(name):
    return step("playSubTest", name,
                {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1})


def suite(name, blurb, children, tags):
    return test(name,
                blurb + "\n- Logs in once, then chains its subtests in the same browser session."
                        "\n- subtestPublicId values stay PENDING-WIRE-UP until the children exist"
                        " on Datadog; run wire_suite.py after pushing them.",
                login_steps + [sub(c) for c in children],
                tags, extra_globals=CREDS)


write(suite(
    "MOB.990_Smoke_Suite",
    "`MOB.990` Mobile smoke: every route renders, plus the online guard. READ-ONLY.",
    # ⚠️ COMPLETE, IN RUN ORDER — trap 19. Four children (MOB.171/180/346/910) were wired
    # into the JSON by other scripts and were missing here; a DD_FORCE rebuild would have
    # dropped all four and the suite would still have reported PASS.
    ["MOB.100_Nav_Asset_Lookup",
     "MOB.110_Nav_Material_Lookup",
     "MOB.120_Nav_Map",
     "MOB.130_Nav_Transaction_Log",
     "MOB.140_Nav_Mobile_Jobs",
     "MOB.150_Nav_Work_Orders",
     "MOB.160_Nav_Asset_Collector",
     "MOB.170_Nav_Dev_Logs",
     "MOB.900_Online_Guard",
     "MOB.121_Map_Controls",
     "MOB.123_Map_Switch_Map",
     "MOB.180_Home_Screen",
     # 🛑 MOB.346_Work_Scheduled_View REMOVED 2026-09-08 — it belongs here on subject, but not
     # while its subject is unreachable. SETTLED: the crew's `mobileDownloadMode` stays
     # `ASSIGNED` (a `SCHEDULED` role only sees stages with a scheduledevent within ±7 days —
     # §25 rule 4 — which empties the work list every other work test depends on). So the
     # scheduled view never renders and MOB.346 cannot pass.
     # ⚠️ Its failure was not contained: every assertion after its fixture gate is critical, so
     # the run ABORTED and MOB.171 + MOB.910 were reported red WITHOUT EVER EXECUTING. One real
     # problem read as three. MOB.346 stays a standalone test (still correct for a SCHEDULED
     # org); it just no longer decides whether its siblings get to run.
     # ➡️ Put it back the day the role becomes SCHEDULED and its work orders are scheduled.
     "MOB.171_DevLogs_Contents",
     "MOB.910_Offline_UI"],
    ["Mobile", "env:dev", "E2E", "Suite", "Smoke"],
))

write(suite(
    "MOB.991_WorkOrders_Suite",
    "`MOB.991` Work order lifecycle against fixture EYRpYJ9QYdQ1JFF10JtB0Q: create, read, the\n"
    "status walk, the detail tabs, list search/sort, a note, the add-form picker.\n"
    "- MUTATES dev: MOB.300 creates a work order that cannot be deleted from mobile\n"
    "  (tagged 'DD SYNTHETIC MOBILE'), MOB.392 adds a note, and MOB.320 changes the fixture's\n"
    "  status before reverting it to Ready.\n"
    "- The record adds (charges, condition, failure) are `MOB.988` — split out because this\n"
    "  suite hit Datadog's execution ceiling (Appendix F).",
    # COMPLETE, IN RUN ORDER. This list once named only the first three while ten more had
    # been appended to the JSON by other generators; one DD_FORCE rebuild would have silently
    # deleted them (trap 12). Diff it against the JSON before any rebuild.
    # SPLIT 2026-09-11: the six record-adding children moved to MOB.988 below. MOB.991 had
    # run 474s with 13 children and a 70-step addition hit the ceiling at 1071s; MOB.390/391's
    # reload proofs and deletes (bugs §40) added ~70s more, and every write test is due a
    # reload proof (checklist 🟢 #25). Two suites give both room.
    ["MOB.300_Work_Create", "MOB.310_Work_Read", "MOB.320_Work_Status_Update",
     "MOB.330_Work_Detail_Tabs", "MOB.340_Work_Search_Sort",
     "MOB.392_Work_Add_Note", "MOB.393_Work_Add_Form"],
    # MOB.134_Work_Form_Fill is archived (dd_tests_mobile/_archive/) - never wire it here.
    ["Mobile", "env:dev", "E2E", "Suite", "Work Order", "CRUD"],
))

write(suite(
    "MOB.988_WorkOrders_Records_Suite",
    "`MOB.988` Records added to fixture EYRpYJ9QYdQ1JFF10JtB0Q: the four ELMO charges, a\n"
    "condition score and a failure.\n"
    "- MUTATES dev: each charge is permanent residue (mobile has no delete for them).\n"
    "- MOB.390/391 are SELF-CLEANING: each adds a key the fixture does not hold, proves it after\n"
    "  a reload, and deletes it again (owner-sanctioned, trap 2).\n"
    "- Split from `MOB.991` at its execution ceiling (Appendix F).",
    ["MOB.350_Work_Add_Equipment_Charge", "MOB.360_Work_Add_Labor_Charge",
     "MOB.370_Work_Add_Material_Charge", "MOB.380_Work_Add_Other_Charge",
     "MOB.390_Work_Add_Condition", "MOB.391_Work_Add_Failure"],
    ["Mobile", "env:dev", "E2E", "Suite", "Work Order", "CRUD"],
))

write(suite(
    "MOB.983_AssetVerify_Extra_Suite",
    "`MOB.983` The AV fixture job's header, status menu and the offline queue — all three\n"
    "SELF-RESTORING on job Z0EVwQcdJZhMURcBFkp0E0, each proved after a reload.\n"
    "- Separate from `MOB.993` (14 children) to keep that suite's runtime down.\n"
    "- Order is load-bearing: MOB.537 (the Tank's tag, round trip) · MOB.913 (a verify held\n"
    "  offline, drained, unverified; its restore reloads) · MOB.536 LAST — a failed status\n"
    "  restore can drop the job from the crew's list, so nothing may run after it.\n"
    "  `reset_av_fixture.py --apply` is the 0-run fallback.",
    ["MOB.537_AssetVerify_Header_Tag",
     "MOB.913_Offline_Transaction_Queue",
     "MOB.536_AssetVerify_Job_Status_Menu"],
    ["Mobile", "env:dev", "Asset Verification", "suite", "self-restoring"],
))

write(suite(
    "MOB.992_Menu_Suite",
    "`MOB.992` Hamburger menu: open/close, resync, Transaction Log route, crew modal\n"
    "dismissal. READ-ONLY - the mutating crew switch (MOB.200) and logout (MOB.440) are\n"
    "deliberately excluded and run standalone.",
    # COMPLETE - MOB.450/460 are appended by build_chrome_tests.py, so they must be named
    # here too or a rebuild of THIS script drops them (trap 12).
    # ⚠️ COMPLETE — trap 19. MOB.470 was wired into the JSON separately.
    ["MOB.400_Menu_Open_Close",
     "MOB.410_Menu_Resync",
     "MOB.420_Menu_Transaction_Log",
     "MOB.430_Crew_Modal_Dismiss",
     "MOB.450_Global_Back_Arrow",
     "MOB.460_Global_Module_Resync",
     "MOB.470_Header_Status_Icons"],
    ["Mobile", "env:dev", "E2E", "Suite", "Menu"],
))

print("wrote MOB.990_Smoke_Suite, MOB.991_WorkOrders_Suite, MOB.988, MOB.983, MOB.992_Menu_Suite")
# MOB.999_Mobile_Suite was deleted from Datadog on 2026-08-07; the "pending your call"
# message that used to print here outlived the decision by five days.
