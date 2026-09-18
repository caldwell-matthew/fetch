"""The mobile suites, grouped by module — the ONE place a suite's children are listed.

WHY ONE FILE
  Suites used to be written by eight different builders, each holding its own child list. A
  rebuild of any one of them reset its suite's wired subtest ids (2026-09-15: five suites at
  once). Here every scheduled leaf sits in exactly one suite, `build_module_suites.py` writes
  the suites from this list, and `dd_tools.test()` tags every test with its module from it.

HOW A MODULE BECOMES SUITES
  Datadog stops a suite whose children's combined run time passes its ceiling (Appendix F), so a
  module is several numbered suites, each kept well under it. Read-only and data-changing tests
  sit in separate suites so a schedule can run the read-only ones side by side and chain only
  the ones sharing a fixture (trap 1). The order inside a suite is the run order.

ADDING A TEST
  Put its id in the suite for its route and module, then `build_module_suites.py` →
  `wire_suite.py` → push that suite. `assert_complete()` fails if a leaf is in no suite, in two,
  or unaccounted for.
"""
import glob
import os
import re

MODULES = {
    "work-orders": "WorkOrders",
    "asset-verify": "AssetVerify",
    "asset-collector": "AssetCollector",
    "asset-lookup": "AssetLookup",
    "material-lookup": "MaterialLookup",
    "map": "Map",
    "app-shell": "AppShell",
    "session": "Session",
    "phone": "Phone",
}

# (id, module, part name, class, blurb, children in run order)
SUITES = [
    ("953", "work-orders", "1_List", "writes",
     "`/work`: the list renders, search, sort, map toggle, status ring, row navigation; MOB.300 creates a "
     "work order (residue) and MOB.301 opens the insert form's photo picker.",
     ["150", "300", "301", "340", "341", "343", "344", "342", "345"]),
    ("954", "work-orders", "2_Detail_Open_Tabs", "read-only",
     "`/work/:workStageId` read-only: open, tabs, General Info's value arrow, the add-form picker, permits, "
     "warranties, MapLink, record cycling.",
     ["310", "330", "331", "393", "394", "399", "348", "349"]),
    ("981", "work-orders", "3_Detail_Charges_Offline", "read-only",
     "`/work/:workStageId` read-only: the charge forms and their ESTIMATES section, form metrics, the assign "
     "modal, and the offline screens.\n"
     "- Split from MOB.954 at 485s local (~580-970s on Datadog, against the ~1071s ceiling — Appendix F).",
     ["357", "356", "351", "398", "911", "912"]),
    ("955", "work-orders", "4_Detail_Assets_Records_Read", "read-only",
     "`/work/:workStageId` read-only: the Assets tab and its status controls, the condition edit prefill, "
     "lookups, attachments, proximity radius, the asset location form.\n"
     "- MOB.358 LAST: it expands an asset row, which needs the Asset schema cached (bugs §45).",
     ["347", "389", "387", "741", "731", "358"]),
    ("956", "work-orders", "5_Records", "writes",
     "`/work/:workStageId` records on fixture EYRpYJ9QYdQ1JFF10JtB0Q: the four charges (residue), a "
     "condition and a failure (self-cleaning; red while bugs §42 is open), a note (residue) and a note "
     "edited then deleted (self-cleaning).",
     ["350", "360", "370", "380", "390", "391", "392", "361"]),
    ("957", "work-orders", "6_Status_Field_Edits", "writes",
     "Self-restoring edits on fixture EYRpYJ9QYdQ1JFF10JtB0Q: the status walk, General Info, an attribute, "
     "a condition and a failure `Edit Item` (the two saves red while bugs §42 is open).\n"
     "- MOB.320 FIRST: it restores `Ready` `always`.",
     ["320", "395", "388", "386", "385"]),
    ("958", "work-orders", "7_Assets_Location_Edits", "writes",
     "Self-restoring and self-cleaning writes on fixture EYRpYJ9QYdQ1JFF10JtB0Q: Edit Location, an asset "
     "link's status, an asset link added then removed, the asset location form.",
     ["352", "353", "354", "359"]),
    ("959", "work-orders", "8_Stage_Writes_Create", "writes",
     "Work orders created from an asset and as follow-up work (residue), `Copy to asset` (self-cleaning), "
     "and writes on work order `20260910-16`: a photo uploaded then deleted, a reassignment restored, a "
     "form attached then deleted.\n"
     "- MOB.364 LAST on `20260910-16`.",
     ["396", "397", "302", "363", "365", "364"]),
    ("960", "work-orders", "9_Forms", "writes",
     "`/work/:workStageId/form/:formId`: the form renders; MOB.134 fills an integer field and clears it "
     "(self-restoring); MOB.135 opens the Inspection form's signature pad and closes it untouched (read-only).",
     ["355", "134", "135"]),
    ("961", "asset-verify", "1_Jobs_List", "read-only",
     "`/asset-verify`: the job list renders, search/filter/sort, counts and badges, sort persistence and "
     "sort ordering.\n"
     "- MOB.810 is a JOB-LIST test (`sessionStorage['mobile-MobileJob-sort']`), not an Asset Lookup one; it "
     "sat in MOB.969 until 2026-09-15.\n"
     "- MOB.535 LAST: it picks its own sort values and ends on `RESTORE: clear the persisted sort`, so the "
     "suite leaves the job list unsorted whatever MOB.810 left behind.",
     ["140", "530", "560", "580", "810", "535"]),
    ("962", "asset-verify", "2_Job_Assets_Read", "read-only",
     "`/asset-verify/:jobId` read-only on job Z0EVwQcdJZhMURcBFkp0E0: the asset list, tabs, map toggle, "
     "asset search, photo tag search, reading history.",
     ["500", "520", "585", "531", "547", "551"]),
    ("963", "asset-verify", "3_Verify_Status_Queue", "writes",
     "Self-restoring on job Z0EVwQcdJZhMURcBFkp0E0: verify and unverify, the Unverified tab, the offline "
     "transaction queue, the job status menu, and verifying EVERY asset.\n"
     "- MOB.511 and MOB.512 LAST, in that order: they leave the job `2 out of 2` and COMPLETED until "
     "their restore legs run, and MOB.500/510/590 guard on `0 out of 2` while MOB.530/560 expect READY.\n"
     "- MOB.536 before them: a failed status restore can drop the job from the crew's list. "
     "`reset_av_fixture.py --apply` is the 0-run fallback for either.",
     ["510", "590", "913", "536", "511", "512"]),
    ("964", "asset-verify", "4_Asset_Detail_Read", "read-only",
     "`/asset-verify/:jobId/asset/:verificationId` read-only: cycling, the failure and condition forms, "
     "attachments.",
     ["570", "575", "546"]),
    ("965", "asset-verify", "5_Asset_Detail_Edits", "writes",
     "`/asset-verify/:jobId/asset/:verificationId` writes: the Tag ID round trip and an attribute edit "
     "(self-restoring), event readings (residue).",
     ["537", "545", "550"]),
    ("966", "asset-collector", "1_Capture", "read-only",
     "`/asset-collector`: the route, the photo picker and carousel (never submitted), capture options, "
     "the form's Location row (stubbed geolocation, captured and cleared, never submitted), search, the row "
     "avatar modal, sort.",
     ["160", "620", "621", "622", "626", "629", "610", "624", "625"]),
    ("967", "asset-collector", "2_Saved_Asset", "writes",
     "Writes on `DD SYNTHETIC MOBILE` assets: create an asset (red while bugs §34 is open), the saved-photo "
     "menu (residue: one photo), saved-photo tags, avatar and delete (residue: one org tag).\n"
     "- MOB.600 FIRST, then MOB.623, then MOB.627 — all on the newest marker asset.\n"
     "- 🛑 A LOCAL REPLAY OF MOB.600 IS A FALSE NEGATIVE: it cannot drive the photo picker, so it "
     "collects photo-free, which persists, and its server proof passes. Only Datadog exercises §34.",
     ["600", "623", "627", "628"]),
    ("968", "asset-lookup", "1_Rows_Tabs", "read-only",
     "`/asset-lookup` read-only: search, the tag lookup menu, readings (and their empty state), offline "
     "messages, work history, View in Map, Near Me.",
     ["100", "700", "750", "720", "721", "914", "740", "735", "730"]),
    ("969", "asset-lookup", "2_Filters_Sort", "read-only",
     "`/asset-lookup`: the filter builder, its edit and multi-value branches, and search-vs-filter. "
     "Read-only — every write on this route is MOB.980.\n"
     "- ⚠️ THE NAME SAYS `Sort` AND NOTHING HERE SORTS. MOB.810 moved to MOB.961 on 2026-09-15 — it sorts the "
     "MOBILE JOB list (`sessionStorage['mobile-MobileJob-sort']`), not this one. The name is kept because "
     "`push` matches on NAME, so renaming would create a second Datadog test and orphan this one (the "
     "duplicate hazard that cost MOB.551 and MOB.624 a stray copy each). Rename in the Datadog UI if it "
     "ever matters.",
     ["800", "805", "806", "807", "820"]),
    ("980", "asset-lookup", "3_Edits", "writes",
     "`/asset-lookup` writes: a field edit on `Pump 0102` (self-restoring), a System created and a reading "
     "captured on a `DD SYNTHETIC MOBILE` asset (residue).\n"
     "- Separate from MOB.969: the filter/search children leave a term in `asset_lookup_query`, and a search "
     "typed on top of it reads `Pump 0102Pump 0102` (trap 17, measured 2026-09-15).",
     ["710", "712", "722"]),
    ("970", "material-lookup", "", "writes",
     "`/material-lookup`: the storeroom list, column sort, attachments (read-only), a cycle count (+1/−1) "
     "and stocking (residue: +1 quantity).",
     ["110", "850", "860", "870", "855", "865", "866"]),
    ("971", "map", "", "writes",
     "`/map`: controls and Switch Map (read-only), then a work order created from the map (residue).\n"
     "- MOB.122 LAST.",
     ["120", "121", "123", "122"]),
    ("972", "app-shell", "", "writes",
     "Every route's shell: Home, the online and offline guards, Dev Logs, the Transaction Log, the "
     "hamburger menu, the back arrow, header status icons.\n"
     "- Writes: MOB.131 verifies and un-verifies an asset on the AV fixture job; MOB.131 before MOB.132, whose "
     "search reads those entries.",
     ["180", "900", "910", "170", "171", "130", "131", "132", "400", "410", "420", "430", "450", "460", "470"]),
    ("973", "session", "RunAlone", "writes",
     "Role gating and crew scoping. 🛑 RUN ALONE — it changes the session's crew, which every other suite "
     "reads.",
     ["210", "220"]),
    ("975", "phone", "", "read-only",
     "Phone width (`chrome.mobile_small`): the form's phone branch, the header and list.",
     ["951", "952"]),
]

# Leaves deliberately in no scheduled suite.
STANDALONE = {
    "000": ("app-shell", "the login itself — every suite already runs it first"),
    "200": ("session", "switches the session's crew; crew-scoped data changes under any suite"),
    "346": ("work-orders", "blocked: the scheduled view is unreachable for this crew (bugs §25)"),
    "440": ("session", "logs out, which kills any suite running at the time"),
}
# Leaves held out of their suites (none today; both PDF tests were confirmed on Datadog 2026-09-15).
HELD = {}

# ---- THE WEEKLY SCHEDULE (testing_checklist ▶ #37) -------------------------------------------------------
# Datadog's own scheduler, weekly. Each suite runs once, in its own ONE-HOUR window: `tick_every = 3600` inside
# an `options.scheduling` window of one hour on one weekday gives one run a week at a known time.
#
#   🛑 SLOTS ARE HOW SUITES ARE KEPT APART. Datadog cannot make one test wait for another, so the data-changing
#   suites (trap 1: they share fixtures) each get their own hour, starting TWO hours apart: a suite may start
#   anywhere in its hour and the longest takes ~12½ min, ~25 with its retry, so the next slot never overlaps.
#   The read-only suites share one slot — they may overlap each other, never a data-changing one.
#   `preflight.py schedule` refuses any two slots (other than the shared read-only one) under 2h apart.
#
# The owner chose this 2026-09-17 (2,000 runs/month; dev is up at weekends). MOB.967 has NO slot: it stays
# paused until bugs §34 is fixed.
SCHEDULE_TZ = "America/Los_Angeles"
READ_ONLY_SLOT = ("Sat", 18)
SLOTS = {                     # suite id -> (weekday, start hour, Pacific)
    **{sid: READ_ONLY_SLOT for sid in ("954", "981", "955", "961", "962", "964", "966", "968", "969", "975")},
    "953": ("Sat", 20), "956": ("Sat", 22),
    "957": ("Sun", 0), "958": ("Sun", 2), "959": ("Sun", 4), "960": ("Sun", 6), "963": ("Sun", 8),
    "965": ("Sun", 10), "980": ("Sun", 12), "970": ("Sun", 14), "971": ("Sun", 16), "972": ("Sun", 18),
    "973": ("Sun", 20),       # Session — last, and alone
}
# Datadog's `timeframes[].day` numbering: ISO, MONDAY = 1. Confirmed 2026-09-17 by `schedule_probe.py`: created
# Thursday 20:21 PT with windows on days 5/6/7 at 21:00, Datadog's UI gave its next run as "1d from now" — Friday,
# so 5 = Friday. (Sunday = 1 would have made 5 Thursday, under an hour away.)
DATADOG_DAY = {"Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 7}
DAY_NUMBERING_CONFIRMED = True
# The one switch. False: the suites carry their windows but stay `paused` (pushing them bills nothing).
# True: every suite with a slot is pushed `live`.
SCHEDULE_ON = False
# Who Datadog emails when a scheduled suite fails (owner, 2026-09-17). Datadog notifies whoever the test's MESSAGE
# @-mentions, so the builder appends `@<address>`. ⚠️ ONLY WHILE SCHEDULE_ON: a hand-started run (a verify, the
# re-measuring pass) can alert too, and nobody should be emailed about those.
ALERT_TO = "matthew.caldwell@mentorapm.com"


WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def slot_problems(slots, read_only_ids, read_only_slot=READ_ONLY_SLOT, last="973", min_gap=2):
    """What is wrong with a slot table — pure, so `preflight.py schedule` can prove it rejects bad ones.

    Read-only suites share `read_only_slot`; every other slot, and the read-only one, must start `min_gap`
    hours from every other (on the weekly circle, so Sun 23:00 → Mon 00:00 is 1h); `last` must be the final
    data-changing slot after the read-only one."""
    how = lambda slot: WEEKDAYS.index(slot[0]) * 24 + slot[1]
    out = []
    for sid in read_only_ids:
        if slots.get(sid) != read_only_slot:
            out.append(f"MOB.{sid} is read-only but not in the read-only slot")
    starts = {"read-only": how(read_only_slot)}
    starts.update({sid: how(slot) for sid, slot in slots.items() if sid not in read_only_ids})
    keys = list(starts)
    for i, a in enumerate(keys):
        for b in keys[i + 1:]:
            gap = abs(starts[a] - starts[b]) % 168
            gap = min(gap, 168 - gap)
            if gap < min_gap:
                out.append(f"slots {a} and {b} start {gap}h apart — the minimum is {min_gap}h")
    writes = [k for k in keys if k != "read-only"]
    if writes and max(writes, key=lambda k: (starts[k] - starts["read-only"]) % 168) != last:
        out.append(f"MOB.{last} (Session) must be the LAST data-changing slot")
    return out


def schedule_options(sid):
    """The `options` a suite gets for its slot, or None for a suite with no slot."""
    if sid not in SLOTS:
        return None
    day, hour = SLOTS[sid]
    return {"tick_every": 3600,
            "scheduling": {"timezone": SCHEDULE_TZ,
                           "timeframes": [{"day": DATADOG_DAY[day], "from": f"{hour:02d}:00",
                                           "to": f"{(hour + 1) % 24:02d}:00"}]}}

TESTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dd_tests_mobile")


def suite_name(sid, module, part):
    return "_".join(x for x in (f"MOB.{sid}", MODULES[module], part, "Suite") if x)


def _module_by_id():
    m = {}
    for sid, module, _part, _cls, _blurb, children in SUITES:
        m[sid] = module
        for c in children:
            m[c] = module
    for tid, (module, _why) in STANDALONE.items():
        m[tid] = module
    for tid, (module, _suite) in HELD.items():
        m[tid] = module
    return m


def module_tag(test_name):
    """`module:<slug>` for any test this plan places, else None (old suites, the scratch, diagnostics)."""
    hit = re.match(r"MOB\.(\d{3})", test_name or "")
    module = hit and _module_by_id().get(hit.group(1))
    return f"module:{module}" if module else None


def leaf_names():
    """{id: full test name} for every local leaf test (a JSON with no playSubTest step)."""
    import json
    out = {}
    for path in glob.glob(os.path.join(TESTS_DIR, "MOB.*.json")):
        d = json.load(open(path))["details"]
        if any(s["type"] == "playSubTest" for s in d["steps"]):
            continue
        out[os.path.basename(path)[4:7]] = os.path.basename(path)[:-5]
    return out


def assert_complete(leaves):
    """Every leaf is in exactly one suite, or standalone, or held — and nothing is listed twice."""
    placed = {}
    for sid, _m, _p, _c, _b, children in SUITES:
        for c in children:
            if c in placed:
                raise SystemExit(f"suite_plan: MOB.{c} is in MOB.{placed[c]} and MOB.{sid}")
            placed[c] = sid
    both = set(placed) & (set(STANDALONE) | set(HELD))
    if both:
        raise SystemExit(f"suite_plan: in a suite AND standalone/held: {sorted(both)}")
    known = set(placed) | set(STANDALONE) | set(HELD)
    diag = {tid for tid, name in leaves.items() if "_DIAG_" in name}
    missing = sorted(set(leaves) - known - diag)
    ghosts = sorted(known - set(leaves))
    if missing or ghosts:
        raise SystemExit(f"suite_plan: leaves in no suite: {missing} · listed but not local: {ghosts}")
    return placed
