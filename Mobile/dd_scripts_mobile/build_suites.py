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
    ["MOB.100_Nav_Asset_Lookup", "MOB.110_Nav_Material_Lookup", "MOB.120_Nav_Map",
     "MOB.130_Nav_Transaction_Log", "MOB.140_Nav_Mobile_Jobs", "MOB.150_Nav_Work_Orders",
     "MOB.160_Nav_Asset_Collector", "MOB.170_Nav_Dev_Logs", "MOB.900_Online_Guard",
     "MOB.121_Map_Controls"],
    ["Mobile", "env:dev", "E2E", "Suite", "Smoke"],
))

write(suite(
    "MOB.991_WorkOrders_Suite",
    "`MOB.991` Work order CRUD against fixture EYRpYJ9QYdQ1JFF10JtB0Q.\n"
    "- MUTATES dev: MOB.300 creates a work order that cannot be deleted from mobile\n"
    "  (tagged 'DD SYNTHETIC MOBILE'), and MOB.320 changes the fixture's status before\n"
    "  reverting it to Ready. Consider running this on demand rather than on a schedule.",
    # COMPLETE, IN RUN ORDER. This list had drifted badly: it named only the first three
    # while ten more (the detail tabs and every charge type) had been appended to the JSON by
    # build_work_ui_tests / build_charge_tests / build_tab_tests. One DD_FORCE rebuild here
    # would have silently deleted all ten and the suite would still have reported PASS -
    # trap 12, and by far the largest instance of it found so far.
    ["MOB.300_Work_Create", "MOB.310_Work_Read", "MOB.320_Work_Status_Update",
     "MOB.330_Work_Detail_Tabs", "MOB.340_Work_Search_Sort",
     "MOB.350_Work_Add_Equipment_Charge", "MOB.360_Work_Add_Labor_Charge",
     "MOB.370_Work_Add_Material_Charge", "MOB.380_Work_Add_Other_Charge",
     "MOB.390_Work_Add_Condition", "MOB.391_Work_Add_Failure",
     "MOB.392_Work_Add_Note", "MOB.393_Work_Add_Form"],
    # MOB.134_Work_Form_Fill is deliberately NOT wired here (2026-08-18). It has never
    # passed - see its build script's header - and one unproven child was masking 13
    # working ones. Re-add it here and run wire_suite.py once it goes green standalone.
    ["Mobile", "env:dev", "E2E", "Suite", "Work Order", "CRUD"],
))

write(suite(
    "MOB.992_Menu_Suite",
    "`MOB.992` Hamburger menu: open/close, resync, Transaction Log route, crew modal\n"
    "dismissal. READ-ONLY - the mutating crew switch (MOB.200) and logout (MOB.440) are\n"
    "deliberately excluded and run standalone.",
    # COMPLETE - MOB.450/460 are appended by build_chrome_tests.py, so they must be named
    # here too or a rebuild of THIS script drops them (trap 12).
    ["MOB.400_Menu_Open_Close", "MOB.410_Menu_Resync", "MOB.420_Menu_Transaction_Log",
     "MOB.430_Crew_Modal_Dismiss", "MOB.450_Global_Back_Arrow",
     "MOB.460_Global_Module_Resync"],
    ["Mobile", "env:dev", "E2E", "Suite", "Menu"],
))

print("wrote MOB.990_Smoke_Suite, MOB.991_WorkOrders_Suite, MOB.992_Menu_Suite")
# MOB.999_Mobile_Suite was deleted from Datadog on 2026-08-07; the "pending your call"
# message that used to print here outlived the decision by five days.
