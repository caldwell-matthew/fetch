"""Build MOB.550_AssetVerify_Event_Readings - capturing meter readings on an asset.

WHY THIS SCREEN NEEDED A DIFFERENT PROOF STRATEGY THAN EVERY OTHER TEST HERE

  Every UI signal it gives is fake. `onSubmit` (EventReadings/index.tsx:57-106) does:

      client.mutate({ mutation: CREATE_EVENT, ... });   // NOT awaited, no update(), no then()
      toast.success('Event readings captured.');        // fires unconditionally
      client.writeQuery({ ...assetEventReadingHistory }) // hand-written LOCAL cache entry

  So the toast, the "N of M recorded recently" counter, and the reading appearing next to its
  reading type ALL happen whether or not the server ever accepted the mutation. That is trap 6
  and bugs_found.md 11 in the same function.

  AND A RELOAD DOES NOT FIX IT - THIS IS THE PART THAT MATTERS.
    The Apollo cache is PERSISTED to IndexedDB (`persistCache` + LocalForage,
    graphql/index.tsx:146), so navigating away and back restores the same locally-written
    entry. Within a single run there is NO way to distinguish "the server stored it" from
    "the app wrote it to its own cache". The reload trick that proves MOB.395/545/710 does
    not work here, and using it anyway would have produced a confident green that meant
    nothing.

  ⚠️ HOW THE CACHE HOLDS THE FAKE VALUE CHANGED ON 2026-08-25 (commit c93877db1e), AND THE
  OLD EXPLANATION HERE WAS WRONG FOR TWO WEEKS. It used to argue:
        "`clearCache` rewrites only MOBILE_JOB_DETAILS / FETCH_MOBILE_JOB_TEST, and
         `assetEventReadingHistory` is a ROOT query field, so `cache.gc()` will not collect
         it; the prefetch then re-queries cache-first and returns the poisoned cache."
    None of that describes the code any more. The screen no longer reads a root field at all:
      - it reads `useFragment(ASSET_LATEST_READINGS)` off the NORMALISED `Asset:{id}` entity,
      - and `onSubmit` writes the fake value back with `cache.writeFragment` on that entity.
    A normalised field follows different eviction rules than a root one, so the specific
    retention argument above no longer holds.
  ⭐ THE CONCLUSION SURVIVED THE REWRITE ANYWAY - and is now stronger, not weaker. Verified
    2026-09-08, by reading the queries rather than assuming: `ASSET_LATEST_READINGS` is spread
    into the mobile job's own asset fragments (queries/index.gql.ts:40 and :92), so the job
    download carries `latestReadings` FROM THE SERVER on every cold start. The opening
    assertion is therefore still a genuine server proof, and it no longer depends on a root
    field happening to survive `gc()` - it depends on a payload the job cannot render without.
  🛑 THE LESSON, WORTH MORE THAN THE ROW: this test stayed GREEN throughout, for a reason its
    own documentation got wrong. A passing test whose stated mechanism is false is more
    dangerous than a failing one, because the false reason is what the next person debugging
    it will trust. Re-read this block against the source whenever EventReadings changes.

THE PROOF THAT DOES WORK: THE NEXT RUN'S COLD CACHE
  Datadog starts each run in a fresh browser profile, so IndexedDB is EMPTY and the app must
  fetch the asset's `latestReadings` from the server as part of the job download. Therefore:

      this run writes a known value  ->  the NEXT run opens on a cold cache and sees it

  The opening assertion is the real one: it proves the server persisted what a *previous* run
  wrote, because there is no local cache left to have faked it. The in-run assertions after
  each submit only prove the form and rendering work.

  Consequences, stated rather than hidden:
    - The FIRST run of this test FAILS its opening assertion, and should. There is no prior
      run to have written anything. It passes from the second run onward.
    - It tolerates a half-finished previous run by accepting EITHER known value, so a run
      that died between the two legs does not wedge the next one.
    - If a human edits these readings on desktop, the opening assertion fails - correctly.

RESIDUE - ACCEPTED BY THE REPO OWNER
  CREATE_EVENT creates a record and mobile is delete-free, so every run leaves one event
  reading per leg on the fixture asset. Same standing trade-off as MOB.600 and MOB.991.

TWO SMALL TRAPS THIS SCREEN ADDS
  1. `isValid={filledInputs >= 1}` and `filledInputs` is only recomputed in the form's
     onBlur. Typing and clicking straight at Submit can leave the button `type="button"` -
     a silent no-op (trap 8). A `Tab` keypress after typing forces the blur.
  2. After a successful submit the field REMOUNTS (`key={field.id + submitCount}`) with
     `defaultValue=""`, so the input clears itself. Assertions therefore read the rendered
     previous-entry text, and read it via textContent - which cannot see an input's value
     anyway (trap 16), making the check immune to echoing what we just typed.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import (BASE, HERE, step, xpath_el, go, test, write, jsassert,
                      av_job_gate)  # noqa: E402

JOB_URL = BASE + "/asset-verify"
JOB_ID = "Z0EVwQcdJZhMURcBFkp0E0"
JOB_DETAIL = f"{JOB_URL}/{JOB_ID}"

# Two fixed, distinctive values. Fixed rather than {{ RUNID }} on purpose: the opening
# assertion has to know what to look for on a cold cache, and Datadog variable interpolation
# inside a JS assertion body is unproven (see build_edit_tests.py).
READING_A = "4242"
READING_B = "1337"

JOBS_PAGE_TITLE = '//*[@id="page-title"]//h4[contains(normalize-space(.), "Mobile Jobs")]'
JOBS_SEARCH = '//input[@placeholder="Find Mobile Job(s)"]'
ROW = '(//*[contains(@class,"mantine-Accordion-item")])[1]'
# By NAME (contains, innermost span) - the style-based locator was an inference and does not
# reliably match; the rendered name also carries an emoji prefix.
FIXTURE_ASSET = "Tank 0000"        # the other fixture asset is "A/C Motor 0002"
ASSET_LINK = f'(//span[contains(normalize-space(.), "{FIXTURE_ASSET}")])[last()]'
EVENTS_TAB = '//*[@role="tab"][contains(normalize-space(.), "Event Readings")]'
FORM = '//form[@id="av-event-readings"]'
FIRST_INPUT = f'({FORM}//input)[1]'
SUBMIT = '//button[@form="av-event-readings"]'


def first_field_shows(values):
    """True when the FIRST reading field's rendered text contains any of `values`.

    Reads textContent, which cannot see an <input>'s value - so this can never be satisfied
    by the number we just typed, only by the previous-entry Text the component renders.
    """
    opts = ", ".join(f"'{v}'" for v in values)
    return ("const form = document.querySelector('#av-event-readings');\n"
            "if (!form) return false;\n"
            "const boxes = form.querySelectorAll(':scope > div > div');\n"
            "const first = boxes[0];\n"
            "if (!first) return false;\n"
            "const txt = first.textContent || '';\n"
            f"return [{opts}].some(v => txt.indexOf(v) !== -1);")


def capture(value, label):
    """Every step here is alwaysExecute.

    THIS IS WHAT MAKES THE TEST ABLE TO BOOTSTRAP ITSELF. The opening SERVER PROOF asserts
    that a PREVIOUS run's reading came back from the server - so on the very first run it
    fails. Without `always=True`, that failure aborts the rest of the test, no reading is
    ever written, and the NEXT run fails identically: a test that can never reach its own
    passing state. Found by running it (the first run failed and wrote nothing), not by
    reasoning about it.

    The test still FAILS on that first run - `always` does not hide the failure, it just
    lets the write happen anyway so run two can pass.
    """
    return [
        step("click", f"Focus the first reading field ({label})",
             {"element": xpath_el(JOB_DETAIL, FIRST_INPUT)}, always=True),
        step("typeText", f"Enter a reading of {value}",
             {"value": value, "element": xpath_el(JOB_DETAIL, FIRST_INPUT)}, always=True),
        # `filledInputs` is only recomputed on the form's onBlur, and the Submit button is
        # type="button" until it is >= 1. Without this Tab the click can be a silent no-op.
        step("pressKey", "Tab out to trigger the form's onBlur (arms the Submit button)",
             {"value": "Tab"}, always=True),
        step("wait", "Let the blur handler re-render the footer", {"value": 2}, always=True),
        step("click", "Submit the readings",
             {"element": xpath_el(JOB_DETAIL, SUBMIT)}, always=True),
        # Assert the toast BEFORE react-toastify's 5000ms autoClose (trap 16b). It proves
        # only that the handler ran - the mutation is not awaited - so it stays optional.
        step("wait", "Brief wait for the toast", {"value": 2}, always=True),
        step("assertPageContains", "Readings captured toast (optional: transient, and it "
             "fires unconditionally)", {"value": "Event readings captured."},
             optional=True, always=True),
        step("wait", "Let the field remount with the new previous-entry",
             {"value": 3}, always=True),
        jsassert(f"The reading {value} is now rendered as the field's previous entry ({label})",
                 first_field_shows([value]), always=True),
    ]


write(test(
    "MOB.550_AssetVerify_Event_Readings",
    "`MOB.550` Capture event readings (meter readings) on an asset.\n"
    "- ⚠️ **LEAVES RESIDUE**: `CREATE_EVENT` creates a record per leg and mobile is\n"
    "  delete-free. Same accepted trade-off as MOB.600 / MOB.991.\n"
    "- **Every UI signal on this screen is fake.** `onSubmit` fires `client.mutate` without\n"
    "  awaiting it, then unconditionally shows the toast and hand-writes the reading into the\n"
    "  Apollo cache with `writeQuery`. Toast, counter and rendered value all appear even if\n"
    "  the server rejected the mutation (trap 6, `bugs_found.md` §11).\n"
    "- **A reload cannot fix that here.** The cache is persisted to IndexedDB\n"
    "  (`persistCache` + LocalForage), so within one run \"stored\" and \"cached locally\" are\n"
    "  indistinguishable.\n"
    "  ⚠️ **The MECHANISM changed on 2026-08-25 and this note was wrong for two weeks** — the\n"
    "  screen no longer reads the root `assetEventReadingHistory` field; it reads\n"
    "  `useFragment(ASSET_LATEST_READINGS)` off the normalised `Asset` and writes the fake\n"
    "  value back with `writeFragment`. ⭐ **The conclusion survived**: `ASSET_LATEST_READINGS`\n"
    "  is spread into the job's own asset fragments, so a cold profile must fetch it from the\n"
    "  server — a stronger guarantee than the old one. Verified 2026-09-08.\n"
    "- **So the proof is the NEXT run.** Datadog starts each run with an empty profile, so\n"
    f"  the opening assertion — that the field already shows `{READING_A}` or `{READING_B}` —\n"
    "  can only be satisfied by data the **server** returned, written by a previous run.\n"
    "  **The first ever run fails that assertion, correctly**; it passes from the second on.\n"
    "  Accepting either value keeps a half-finished previous run from wedging the next one.\n"
    "- `filledInputs` is only recomputed on the form's `onBlur`, so a `Tab` keypress arms the\n"
    "  Submit button — without it the click is a silent no-op (trap 8).\n"
    "- Assertions read `textContent`, which cannot see an input's value, so they can never be\n"
    "  satisfied by the number just typed (trap 16).",
    # Shared gate: clicks the job row instead of deep-linking, and gates on the asset ROWS.
    # The local copy this replaced deep-linked onto a cache-only route and clicked an "All"
    # filter that is both the default and not a <label>/<input> - it passed on timing luck.
    av_job_gate(JOB_ID) + [
        step("click", f"Open {FIXTURE_ASSET}'s full-page detail",
             {"element": xpath_el(JOB_DETAIL, ASSET_LINK)}, timeout=30),
        step("wait", "Wait for the asset detail route", {"value": 6}),
        step("assertPageContains", "The full-page asset detail rendered",
             {"value": "Asset Type:"}),
        step("click", "Open the Event Readings tab",
             {"element": xpath_el(JOB_DETAIL, EVENTS_TAB)}),
        step("wait", "Wait for the Event Readings panel", {"value": 3}),
        step("assertElementPresent", "FIELD GUARD: the readings form rendered",
             {"element": xpath_el(JOB_DETAIL, FIRST_INPUT)}),

        # ---- THE ONLY SERVER-CONFIRMED ASSERTION IN THIS TEST ----
        # The browser profile is fresh, so this history came from the network, not from the
        # writeQuery a previous run did. FAILS ON THE FIRST EVER RUN - that is expected and
        # documented, not a bug to paper over with `optional`.
        jsassert(
            f"SERVER PROOF: a previous run's reading ({READING_A} or {READING_B}) came back "
            "from the server on a COLD cache",
            first_field_shows([READING_A, READING_B])),
    ]
    + capture(READING_A, "leg 1")
    + capture(READING_B, "leg 2 - leaves the known end state"),
    ["Mobile", "env:dev", "CRUD", "Asset Verification", "residue"],
))

# ---------------------------------------------------------------- suite
# DELIBERATELY NOT ADDED TO MOB.993_AssetVerify_Suite. That suite is documented as
# self-restoring - "ends every run exactly as it started" - and this test creates an
# undeletable Event per leg. Dropping a residue-leaving child into it would quietly make that
# promise false, which is the same mistake avoided when MOB.710 was kept out of the read-only
# MOB.995_AssetLookup_Suite. A suite's stated character is a fact other people schedule
# against; it is not a detail.
login_steps = json.load(
    open(os.path.join(HERE, "MOB.000_Login_(Dev).json")))["details"]["steps"]
CHILDREN = ["MOB.550_AssetVerify_Event_Readings"]   # keep COMPLETE - trap 12

write(test(
    "MOB.987_EventReadings_Suite",
    "Event readings — meter capture on an asset.\n"
    "- ⚠️ **LEAVES RESIDUE**: one `Event` record per leg, per run, and mobile is delete-free.\n"
    "- Kept OUT of `MOB.993_AssetVerify_Suite` on purpose: that suite is documented as\n"
    "  self-restoring, and adding this child would make that promise false.\n"
    "- **The first ever run FAILS its opening assertion by design** — that assertion proves\n"
    "  the server returned a reading written by a PREVIOUS run, and on run one there is none.\n"
    "- subtestPublicId values stay PENDING-WIRE-UP until the children exist on Datadog;\n"
    "  run wire_suite.py after pushing them.",
    login_steps + [step("playSubTest", c,
                        {"subtestPublicId": "PENDING-WIRE-UP", "playingTabId": -1})
                   for c in CHILDREN],
    ["Mobile", "env:dev", "Asset Verification", "residue", "suite"],
    extra_globals=("DATA_DOG_EMAIL", "DATA_DOG_PASSWORD"),
))

print("wrote MOB.550 (event readings), MOB.987 (suite)")
