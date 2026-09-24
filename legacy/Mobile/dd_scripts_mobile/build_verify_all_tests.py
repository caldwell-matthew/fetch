"""Build MOB.511 (verify ALL -> the job completes) and MOB.512 (the job LIST says so).

WHAT MADE THESE BUILDABLE
  `VerificationCheckbox.update()` recomputes a mobile job's status from its verified count in
  BOTH directions - 0 -> READY, all -> COMPLETED, between -> IN_PROGRESS (`154e7627c8`, served
  in build 92). Until then it only moved FORWARD, so verifying the fixture's last asset flipped
  the job COMPLETED with nothing in the app able to walk it back: these two tests would each
  have needed `reset_av_fixture.py --apply` as a manual step afterwards, which is why they sat
  in `cleanup_spec.md` §4 waiting on an owner decision.

  Now the same act undoes itself. Unverifying both assets recomputes the job to READY, so each
  test restores the fixture the way every other AV test does - with `always` legs.

🛑 THEY MUST BE THE LAST CHILDREN OF `MOB.963`
  While both assets are verified the fixture reads `2 out of 2 Assets Verified` and the job is
  COMPLETED. `MOB.500`, `MOB.510` and `MOB.590` all assert `0 out of 2` as their FIXTURE GUARD,
  and `MOB.530`/`MOB.560` filter the list expecting READY. A child that runs after these while
  they are mid-flight fails on a premise that is false, not on its own behaviour.

WHY TWO TESTS AND NOT ONE
  They assert in different places from the same act. MOB.511 stays on the job and reads the
  status over `/graphql`; MOB.512 goes back to the LIST and reads what the list itself renders -
  the card's own `2 out of 2` and `100%`, and which status badge keeps the job. A list that
  never re-rendered would still pass MOB.511.

THE COUNTER IS THE SIGNAL, NOT THE TOAST
  `toast.success` fires before the mutation and is never awaited (bugs §11), so it says only
  that the handler ran. The counter text, the server read and the list's own filter are the
  proofs here.

THE SECOND CHECKBOX IS NAMED, NOT COUNTED
  Both rows carry a checkbox, so `(//input[@type="checkbox"])[2]` would depend on the sort
  order (bugs §36's lesson: `⚡ Tank 0000` collates before `A/C Motor 0002`, and a rename moves
  it). Each click targets the checkbox INSIDE the row that contains the asset's name.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, step, xpath_el, test, write, av_job_gate,  # noqa: E402
                      av_list_gate, server_assert)

JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
FIXTURE_NAME = "DATADOG MOBILE JOB"
JOBS_URL = BASE + "/asset-verify"
JOB_URL = f"{JOBS_URL}/{JOB_ID}"
TAGS = ["Mobile", "env:dev", "Asset Verification", "CRUD", "self-restoring"]

# The fixture's two assets. `⚡ Tank 0000` carries a lightning bolt in its STORED name, so every
# locator matches on containment, never equality (trap 29).
ASSET_T = "Tank 0000"
ASSET_M = "A/C Motor 0002"

TOTAL = 2
BASELINE = f"0 out of {TOTAL} Assets Verified"
ONE_DONE = f"1 out of {TOTAL} Assets Verified"
ALL_DONE = f"{TOTAL} out of {TOTAL} Assets Verified"

# 🛑 NOT `assetsVerified`: the field exists on the type but the SERVER returns null for it
# (measured 2026-09-17) — it is filled in client-side off the job list. Count the links.
JOB_Q = ("query DD511Job($id: ID!) "
         "{ mobileJob(id: $id) { id status assets { id verified } } }")
VERIFIED = "data.mobileJob.assets.filter(a => a.verified).length"


def row(name):
    return ('//*[contains(concat(" ", normalize-space(@class), " "),'
            f' " mantine-Accordion-item ")][contains(., "{name}")]')


def checkbox(name):
    return f'{row(name)}//input[@type="checkbox"]'


def filt(label):
    """One <label> per option, matched on the span EXACTLY: "Verified" is a substring of
    "Unverified", and Datadog errors on multiple matches rather than picking one (trap 3)."""
    return f'//label[.//span[normalize-space(.)="{label}"]]'


def legend(label):
    return f'//li[contains(normalize-space(.), "{label}:")]'


def set_all(always=False):
    """The filter persists in sessionStorage across a suite's subtests, and the Verified tab
    would not list an unverified row — so never assume a starting tab."""
    return [
        step("click", 'Switch to the "All" filter',
             {"element": xpath_el(JOB_URL, filt("All"))}, always=always, timeout=30),
        step("wait", "Wait for the All list to re-render", {"value": 2}, always=always),
    ]


def toggle(name, label, always=False):
    return [
        step("click", f"{label} {name}",
             {"element": xpath_el(JOB_URL, checkbox(name))}, always=always, timeout=30),
        step("wait", "Wait for the mutation and the status it recomputes", {"value": 4},
             always=always),
    ]


def verify_both(always=False):
    return toggle(ASSET_T, "Verify", always=always) + toggle(ASSET_M, "Verify", always=always)


def unverify_both(always=False):
    return toggle(ASSET_T, "Unverify", always=always) + toggle(ASSET_M, "Unverify", always=always)


PREMISE = server_assert(
    "PREMISE (server): 0 of 2 verified, so the job is `READY`",
    "__dd511_job", JOB_Q, {"id": JOB_ID},
    f"data.mobileJob.status === 'READY' && {VERIFIED} === 0")


def restored(key="__dd511_job"):
    return server_assert(
        "⭐ RESTORED (server): 0 verified again, so the job recomputed back to `READY` — the "
        "step the forward-only version could not take",
        key, JOB_Q, {"id": JOB_ID},
        f"data.mobileJob.status === 'READY' && {VERIFIED} === 0", always=True)


# ------------------------------------------------------------------------------- MOB.511
write(test(
    "MOB.511_AssetVerify_Verify_All_Completed",
    "`MOB.511` Verify **both** assets and the job completes — then put it back.\n"
    "- ⭐ The one test that drives a job to `COMPLETED`. The status is asked of the server, "
    "  because the cache would agree with itself (trap 6).\n"
    "- **SELF-RESTORING**: unverifies both on `always` legs, which recomputes the job to "
    "  `READY`. Before `154e7627c8` this was a one-way door and the test needed "
    "  `reset_av_fixture.py --apply` afterwards.\n"
    f"- 🛑 Must run LAST in `MOB.963`: while both are verified the fixture reads `{ALL_DONE}`, "
    "  and MOB.500/510/590 guard on `0 out of 2`.\n"
    "- Each checkbox is the one inside its named asset's row — never `[1]`/`[2]`, which depend "
    "  on a sort order a rename can change (bugs §36).",
    av_job_gate(JOB_ID, FIXTURE_NAME) + set_all() + [
        step("assertPageContains", f'FIXTURE GUARD: job is at rest ("{BASELINE}")',
             {"value": BASELINE}),
    ] + PREMISE + toggle(ASSET_T, "Verify") + [
        step("assertPageContains", f'The counter reads "{ONE_DONE}"', {"value": ONE_DONE}),
    ] + server_assert(
        "SERVER: one of two verified — the job is `IN_PROGRESS`, not yet complete",
        "__dd511_job", JOB_Q, {"id": JOB_ID},
        f"data.mobileJob.status === 'IN_PROGRESS' && {VERIFIED} === 1") + toggle(
        ASSET_M, "Verify") + [
        step("assertPageContains", f'The counter reads "{ALL_DONE}"', {"value": ALL_DONE}),
    ] + server_assert(
        "⭐ SERVER: every asset verified, so the JOB is `COMPLETED` — asked over /graphql, not "
        "read from the cache",
        "__dd511_job", JOB_Q, {"id": JOB_ID},
        f"data.mobileJob.status === 'COMPLETED' && {VERIFIED} === 2") + [

        # ---- restore: unverify both, which walks the status back down --------------------
    ] + unverify_both(always=True) + [
        step("assertPageContains", f'RESTORED: job is back at rest ("{BASELINE}")',
             {"value": BASELINE}, always=True),
    ] + restored(),
    TAGS,
))

# ------------------------------------------------------------------------------- MOB.512
# THE LIST IS A SEPARATE RENDER, AND THAT IS THE POINT.
#   The job card draws `VerificationProgress` from the same cache the detail page writes, and
#   `JobStatusSummary`'s legend counts jobs by status. If the status write never reached the
#   list's cache entry, MOB.511 would still pass and this would not.
#
#   The status badge is the assertion that can SEE the status: the dot is a colour, not text
#   (trap: colours are not assertable), so the proof is which badge keeps the job. `Completed`
#   must now keep it and `Ready` must hide it — exactly the inverse of `MOB.560`, which asserts
#   the resting shape.
write(test(
    "MOB.512_AssetVerify_Job_List_Status",
    "`MOB.512` The job **list** reflects a completed job.\n"
    "- Verifies both assets on the detail page, returns to the list, and asserts what the LIST "
    f"  renders: the card's own `{ALL_DONE}` with `100%`, and that the `Completed` badge keeps "
    "  the job while `Ready` hides it — the inverse of `MOB.560`'s resting shape.\n"
    "- The status dot is a colour, not text, so the badge filter is what can read the status "
    "  back from the list at all.\n"
    "- **SELF-RESTORING**: returns to the job and unverifies both on `always` legs, which "
    "  recomputes it to `READY`.\n"
    f"- 🛑 Must run LAST in `MOB.963` alongside `MOB.511`: mid-flight the fixture is `{ALL_DONE}`.",
    av_job_gate(JOB_ID, FIXTURE_NAME) + set_all() + [
        step("assertPageContains", f'FIXTURE GUARD: job is at rest ("{BASELINE}")',
             {"value": BASELINE}),
    ] + PREMISE + verify_both() + [
        step("assertPageContains", f'The detail counter reads "{ALL_DONE}"', {"value": ALL_DONE}),

        # -------- back to the list, which has to have re-rendered from the same cache
    ] + av_list_gate(FIXTURE_NAME) + [
        step("assertPageContains", f'⭐ THE LIST: the card itself reads "{ALL_DONE}"',
             {"value": ALL_DONE}),
        step("assertPageContains", "⭐ THE LIST: and its percentage reads 100%", {"value": "100%"}),

        step("click", "Select the Completed status badge",
             {"element": xpath_el(JOBS_URL, legend("Completed"))}, timeout=30),
        step("wait", "Wait for the list to re-filter", {"value": 3}),
        step("assertPageContains",
             f'⭐ PROOF: the completed job survives the Completed badge — "{FIXTURE_NAME}"',
             {"value": FIXTURE_NAME}),
        step("click", "Deselect the Completed badge (it toggles)",
             {"element": xpath_el(JOBS_URL, legend("Completed"))}, always=True, timeout=30),
        step("wait", "Wait for the list to restore", {"value": 3}, always=True),

        step("click", "Select the Ready status badge",
             {"element": xpath_el(JOBS_URL, legend("Ready"))}, timeout=30),
        step("wait", "Wait for the list to re-filter", {"value": 3}),
        # Nothing else on this page echoes the job name, so a page-level negative is sound here.
        step("assertPageLacks",
             f'⭐ PROOF: it is no longer READY — the Ready badge hides "{FIXTURE_NAME}"',
             {"value": FIXTURE_NAME}),
        step("click", "Deselect the Ready badge",
             {"element": xpath_el(JOBS_URL, legend("Ready"))}, always=True, timeout=30),
        step("wait", "Wait for the list to restore", {"value": 3}, always=True),

        # ---- restore: back into the job, unverify both -----------------------------------
    ] + [dict(s, alwaysExecute=True) for s in av_job_gate(JOB_ID, FIXTURE_NAME)] + set_all(
        always=True) + unverify_both(always=True) + [
        step("assertPageContains", f'RESTORED: job is back at rest ("{BASELINE}")',
             {"value": BASELINE}, always=True),
    ] + restored("__dd512_job"),
    TAGS,
))

print("wrote MOB.511 (verify all -> COMPLETED), MOB.512 (the job list says so)")
