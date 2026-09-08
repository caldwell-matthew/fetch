"""Shared helpers for building, pushing, and running the MOB.* mobile suite.

Run from the repo root with the venv python, e.g.:
    ./.venv/bin/python Mobile/dd_scripts/dd_tools.py push       # sync dd_tests_mobile/ to Datadog
    ./.venv/bin/python Mobile/dd_scripts/dd_tools.py run MOB.990_Smoke_Suite
"""
import os, sys, json, glob, time, certifi
from dotenv import dotenv_values
from datadog_api_client import ApiClient, Configuration
from datadog_api_client.v1.api.synthetics_api import SyntheticsApi
from datadog_api_client.v1.model.synthetics_browser_test import SyntheticsBrowserTest
from datadog_api_client.v1.model.synthetics_trigger_body import SyntheticsTriggerBody
from datadog_api_client.v1.model.synthetics_trigger_test import SyntheticsTriggerTest

SCRIPTS = os.path.dirname(os.path.abspath(__file__))   # Mobile/dd_scripts
MOBILE = os.path.dirname(SCRIPTS)                      # Mobile
REPO = os.path.dirname(MOBILE)                         # repo root (fetch/)
# NB: Mobile/dd_tests_mobile - the mobile suite's JSON. Named to avoid colliding with
# the repo-root ./dd_tests/ (fetch.py's MAIN_DIR), which .gitignore matches unanchored.
TESTS = os.path.join(MOBILE, "dd_tests_mobile")
HERE = TESTS                                           # back-compat alias for build_* scripts
BASE = "https://dev.mentorapm.com/apm-mobile"
BODY_KEYS = ("name", "config", "message", "options", "type", "locations", "steps", "tags")

GLOBALS = {
    "MOBDEV":            "fe7958bf-435f-4932-af8e-0931caab79e7",
    "DATA_DOG_EMAIL":    "87b53e00-1675-4aa6-82c3-6e328e007d4b",
    "DATA_DOG_PASSWORD": "9c503d08-e175-464a-aa8e-dc9c0087ce30",
}

# ------------------------------------------------------------------ distance units
# 🛑 NEVER PIN A DISTANCE UNIT IN A LOCATOR. This block exists because three tests did.
#
# `ProximityMenu.tsx` renders its radius items as `${radius} ${distanceUnit}`, and BOTH halves
# come from client/src/components/utils/distance/index.ts, which reads the BROWSER LOCALE -
# not the org, not the app:
#
#     imperial (region in US / LR / MM)   distanceUnit 'mi'   radii [5, 10, 25, 50, 100]
#     metric   (everywhere else)          distanceUnit 'km'   radii [10, 25, 50, 100, 200]
#
# WHAT WENT WRONG (found by the 2026-09-08 audit, not by a run): the items used to render as
# `${miles} miles`. The 09-02 localization commit made them `25 mi`. MOB.730 / MOB.731 / MOB.974
# all pinned the literal `N miles`, so:
#   - MOB.731 could no longer find or click its radius, and everything after it was void;
#   - MOB.730's positive check (`/^\d+ miles$/` matches 5) failed;
#   - MOB.730's paired NEGATIVE check (same regex matches 0) started passing VACUOUSLY -
#     a green step that can never fail again. `audit_assertions.py` cannot see that shape,
#     because it reads as a positive check. Only the stale-literal scan catches it.
#
# So: match EITHER unit, and assert the option SET rather than a count, which additionally
# proves the app is not rendering a mix.
DIST_UNIT_RE = r"(mi|km)"                       # for embedding in an assertFromJavascript regex
RADII_IMPERIAL = [5, 10, 25, 50, 100]
RADII_METRIC = [10, 25, 50, 100, 200]
# ⭐ 25 is the ONLY radius present in BOTH sets. Any test that must CLICK one radius has to use
# it, or it silently becomes locale-dependent again.
RADIUS_IN_BOTH = 25


def radius_item_xp(radius):
    """XPath for one Mantine Menu.Item radius option, matching either unit.

    Exact-match on both candidate labels rather than `contains`, so "10 mi" cannot also match
    "100 mi" (trap 11's shape - a substring match that looks exact).
    """
    return (f'//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")]'
            f'[normalize-space(.)="{radius} mi" or normalize-space(.)="{radius} km"]')


def radius_set_js(items_var="items"):
    """JS asserting the rendered radius options are EXACTLY one locale's set, not a mix."""
    imp = json.dumps([f"{r} mi" for r in RADII_IMPERIAL])
    met = json.dumps([f"{r} km" for r in RADII_METRIC])
    return (f"const got = {items_var}.filter(t => /^\\d+ (mi|km)$/.test(t));\n"
            f"const IMPERIAL = {imp};\n"
            f"const METRIC = {met};\n"
            "const same = (a, b) => a.length === b.length && b.every(x => a.includes(x));\n"
            "return got.length === 5 && (same(got, IMPERIAL) || same(got, METRIC));")


def _conf():
    c = Configuration(ssl_ca_cert=certifi.where())
    env = dotenv_values(os.path.join(REPO, ".env"))
    c.api_key["apiKeyAuth"] = env.get("DD_API")
    c.api_key["appKeyAuth"] = env.get("DD_APP")
    return c


# ---------------------------------------------------------------- builders
def gvar(*names):
    return [{"id": GLOBALS[n], "name": n, "type": "global"} for n in names]


def step(type_, name, params, optional=False, always=False, timeout=None, soft=False):
    """optional=True lets a step fail without failing the test - for branches that only
    appear under some configuration (e.g. the status-notes modal, shown only when the
    work template sets requireStatusNotes).

    always=True sets Datadog's `alwaysExecute`, which runs the step even after an EARLIER
    step failed. These are different things and the distinction matters:

        optional  this step may fail        -> the TEST still passes
        always    an earlier step DID fail  -> this step runs anyway; the test still fails

    ⭐ soft=True is the THIRD combination, and its absence cost a suite on 2026-09-08.
    Datadog has two independent flags and this helper only ever exposed two of the four
    states:

        allowFailure  "carry on running after this step fails"
        isCritical    "mark the TEST failed if this step fails"

        optional=True   allowFailure=1 isCritical=0   continue, test PASSES   (vacuous risk)
        default         allowFailure=0 isCritical=1   ABORT THE RUN, test fails
        soft=True       allowFailure=1 isCritical=1   continue, test FAILS    <- this one

    🛑 The default aborts the whole RUN, and inside a suite that means every LATER SUBTEST
    NEVER EXECUTES. `MOB.346`'s fixture gate was critical; when the crew's role stopped being
    `SCHEDULED` the gate failed, the run aborted, and `MOB.171` and `MOB.910` were reported
    red without ever running. One real problem looked like three, and two of them were noise.

    ➡️ Use `soft=True` for any gate on a FIXTURE PREMISE inside a shared suite: the child
    still goes red, honestly, but it does not take its siblings down with it. Do NOT reach for
    `optional=True` there - a test whose subject is absent must not report green.

    timeout=N sets Datadog's per-step `timeout` (seconds). Whether a step POLLS until that
    timeout or checks once is the open question in Appendix F item 1 - if it polls, most of
    the ~815s of blind `wait` steps in this suite can be replaced by gates that return as
    soon as they are satisfied. The asset-list guard in `av_job_gate` is the first real use,
    and doubles as that experiment.

    Needed when a test must leave the world in a known state regardless of whether its
    assertions held - MOB.550 asserts that a PREVIOUS run's data came back from the server,
    and without `always` on the steps that write that data, a first failure would abort the
    write and the test could never bootstrap itself. Restore/cleanup legs in mutating tests
    are the other natural use.
    """
    d = {"allowFailure": optional or soft, "alwaysExecute": always, "exitIfSucceed": False,
         "isCritical": soft or not optional, "name": name, "noScreenshot": False,
         "params": params, "type": type_}
    if timeout is not None:
        d["timeout"] = timeout
    return d


def xpath_el(url, xp):
    return {"url": url,
            "userLocator": {"failTestOnCannotLocate": True,
                            "values": [{"type": "xpath", "value": xp}]}}


def go(url, label):
    return step("goToUrl", f"Navigate to {label}", {"value": url})


def localvar(name, pattern, example):
    """A per-run generated variable, e.g. localvar("RUNID", "{{ numeric(8) }}", "12345678").

    Datadog expands the pattern fresh on every run, so `{{ RUNID }}` in a step yields a new
    value each time. Needed wherever a record has a uniqueness constraint - a fixed marker
    string works for a work order description (MOB.300) but would collide on a second run
    for anything the backend requires to be unique.
    """
    return {"name": name, "type": "text", "pattern": pattern, "example": example}


def jsassert(name, code, optional=False, always=False, timeout=None, soft=False):
    """A `Run JavaScript` assertion step. Passes when the code returns truthy.

    IMPORTANT: unlike `uploadFiles`, this step type IS generatable from here - its params are
    just {"code": ...} with no bucketKey, so no Datadog-UI authoring is needed (trap 12
    applies to uploads only).

    Use it to assert things the DOM cannot express: sessionStorage/localStorage contents, an
    <input>'s VALUE (which is a property, not page text - trap 9), computed styles, or any
    JS-only property such as an input's `capture` flag.
    """
    return step("assertFromJavascript", name, {"code": code}, optional=optional,
                always=always, timeout=timeout, soft=soft)


# ---------------------------------------------------------------------------------------------
# UPLOADS - the one working recipe, shared.
# ---------------------------------------------------------------------------------------------
# ⭐ A `bucketKey` IS PORTABLE BETWEEN TESTS. MEASURED, and it reverses what dd_reference/README
# used to claim. The old claim was that the key is namespaced to the test that authored it (the
# path reads `browser-upload-file-step/<public_id>/<ts>.json`) and so could never be reused. That
# was an inference from the path shape, never a measurement. `MOB.621` copied MOB.600's key into
# a different test and ran green: **Datadog re-namespaces the key to the receiving test on push**
# (`4ty-vhq-3aa` -> `uv3-88w-i8i`).
#
# That is the difference between "every upload test needs a human to author its step in the
# Datadog UI first" and "upload coverage can be generated for any screen". It is the latter, and
# this helper is what makes it routine.
#
# ⚠️ TRAP 12 STILL APPLIES TO THE ORIGINAL. No API mints a bucketKey, so the recipe cannot be
# *created* here - only copied. `MOB.600`'s JSON is the master copy and every caller reads it at
# build time rather than pasting it, so there is exactly one copy and a build fails loudly if it
# ever goes missing. If MOB.600 loses it, restore from dd_reference/MOB.600_with_upload_steps.json.

# The gallery/camera inputs `useFileDialog` appends to <body> are all `accept="image/*"`
# (AddPhotoOptions.tsx:52-53). A Mantine `FileButton` renders its own hidden input with whatever
# `accept` the call site passed. So `accept` is what tells the two apart - not position, and not
# `capture`, which only separates the camera inputs from the gallery one.
REVEAL_GALLERY_INPUT = (
    "const inputs = [...document.querySelectorAll('input[type=\"file\"]')];\n"
    "const el = inputs.find(i => !i.capture);\n")


def reveal_file_button(scope=None):
    """Target a Mantine `FileButton`'s hidden input - `accept="*/*"` (Attachments.tsx:125).

    🛑 FAILS CLOSED WHEN THE PAGE HOLDS MORE THAN ONE. This is not defensiveness for its own
    sake: `AttachmentTable` is rendered by BOTH `WorkStageAttachments` (a work stage) and
    `FileAttachments` (an asset), so two `accept="*/*"` inputs can be mounted at once - and
    `FileAttachments.addFiles` calls `uploadFile` with NO image filter. Picking the wrong one
    would silently write a real attachment to an asset record. So an ambiguous match returns
    false and the test goes red instead of uploading to the wrong target.

    `scope` is a CSS selector for the container to search inside (trap 3 - pass one whenever
    the screen has more than one panel mounted, which behind a modal it always does).
    """
    root = (f"const root = document.querySelector('{scope}');\n"
            "if (!root) return false;\n") if scope else "const root = document;\n"
    return (root +
            "const hits = [...root.querySelectorAll('input[type=\"file\"][accept=\"*/*\"]')];\n"
            "if (hits.length !== 1) return false;   // 0 = not rendered, >1 = ambiguous, see above\n"
            "const el = hits[0];\n")


def upload_steps(url, picker=REVEAL_GALLERY_INPUT, reveal_name=None, upload_name=None,
                 source="MOB.600_Collector_Create_Asset.json"):
    """[reveal, uploadFiles] - reveals a hidden file input and drops a real file on it.

    `picker` is JS that must assign the target input to a local `const el`; the rest of the
    reveal (tagging it `data-dd-upload="1"` and forcing it visible) is appended here. Datadog
    cannot interact with a `display:none` input, and every file input in this app is hidden -
    `useFileDialog` appends its own to <body>, and Mantine's `FileButton` hides its own - so the
    reveal is not optional dressing, it is the step that makes the upload reachable at all.

    The upload step is copied out of `source` verbatim except for `element.url` and the step
    name, so the bucketKey, the userLocator and the multiLocator fallbacks all stay exactly as
    the (hand-authored, unregenerable) original.
    """
    src = json.load(open(os.path.join(TESTS, source)))["details"]["steps"]
    up = next((s for s in src if s["type"] == "uploadFiles"), None)
    if not up:
        raise SystemExit(
            f"{source} no longer carries a uploadFiles step - there is nothing to copy, and no\n"
            "API can mint a new bucketKey (trap 12). Restore it from\n"
            "dd_reference/MOB.600_with_upload_steps.json before building any upload test.")

    reveal = step("assertFromJavascript",
                  reveal_name or "Reveal the hidden file input (Datadog cannot click display:none)",
                  {"code": picker +
                   "if (!el) return false;\n"
                   "el.setAttribute('data-dd-upload', '1');\n"
                   "Object.assign(el.style, {\n"
                   "  display: 'block', opacity: '1', position: 'fixed',\n"
                   "  top: '0', left: '0', width: '240px', height: '40px', zIndex: '99999'\n"
                   "});\n"
                   "return true;\n"})

    up = json.loads(json.dumps(up))          # never mutate the source test's step
    up["name"] = upload_name or "Upload a file"
    up["params"]["element"]["url"] = url
    return [reveal, up]


# The header back arrow (`PageTitle`, faChevronDoubleLeft). Every plausible canonical name is
# matched because that icon is the one trap 14 was WRITTEN about: it was guessed as
# `chevron-double-left`, then `angles-left`, and is really `chevrons-left` - two wasted runs.
# Shared so a third caller cannot re-guess it. NB it does not exist on Home: `PageTitle`
# returns null when location.pathname === '/'.
BACK_ARROW = ('//*[@id="page-title"]//*[@data-icon="chevrons-left"'
              ' or contains(concat(" ", normalize-space(@class), " "), " fa-chevrons-left ")'
              ' or @data-icon="chevron-double-left"'
              ' or contains(concat(" ", normalize-space(@class), " "), " fa-chevron-double-left ")'
              ' or @data-icon="angles-left"'
              ' or contains(concat(" ", normalize-space(@class), " "), " fa-angles-left ")]')

# A work list row. `WorkListItem` is a bare Mantine Paper with no id or test hook, so it is
# identified by the one label every row carries and nothing else on the list page does:
# "Description:" (WorkListItem renders it unconditionally, even when desc is empty).
WORK_ROW = ('(//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Paper-root ")]'
            '[contains(., "Description:")])')

AV_JOBS_URL = BASE + "/asset-verify"
AV_FIXTURE_JOB = "DATADOG MOBILE JOB"


def av_list_gate(fixture=AV_FIXTURE_JOB):
    """Readiness for the mobile job LIST - stops there, does not open a job.

    Split out of `av_job_gate` on 2026-08-13: MOB.530 tests the LIST's status-filter legend,
    and folding the click-into-the-job into the shared gate broke it (the legend is on the
    list, not the detail). Callers that stay on the list use this; callers that need a job
    detail use `av_job_gate`, which is this plus the click-through.
    """
    return [
        go(AV_JOBS_URL, "the mobile job list"),
        # Appendix F: 10s -> 3s; the title assertion polls instead. The 25s BELOW stays -
        # it is what gives the two `assertPageLacks` checks their meaning.
        step("wait", "Let the page begin rendering", {"value": 3}),
        step("assertElementContent", 'Test the "Mobile Jobs" page mounted',
             {"check": "contains", "value": "Mobile Jobs",
              "element": xpath_el(AV_JOBS_URL,
                                  '//*[@id="page-title"]//h4[contains(normalize-space(.), '
                                  '"Mobile Jobs")]')}, timeout=30),
        step("wait", "Wait for the lookup prefetch and batched detail downloads",
             {"value": 25}),
        # placeholder is an ATTRIBUTE, not page text (trap 9)
        step("assertElementPresent", "Test the job list rendered",
             {"element": xpath_el(AV_JOBS_URL,
                                  '//input[@placeholder="Find Mobile Job(s)"]')}),
        # These two must NOT be converted to polling gates (Appendix F): a `lacks` assertion
        # is true BEFORE the loading starts as well as after it finishes, so the 25s wait
        # above is what gives them meaning.
        step("assertPageLacks", "Test the lookup prefetch finished (feeds schemaQuery)",
             {"value": "Fetching data for lookups"}),
        step("assertPageLacks", "Test the batched job-detail downloads finished",
             {"value": "Fetching mobile job details"}),
        step("assertPageContains", f'FIXTURE GUARD: "{fixture}" is in this crew\'s list',
             {"value": fixture}),
    ]


def av_job_gate(job_id, fixture=AV_FIXTURE_JOB):
    """THE readiness gate for reaching an Asset Verification job detail. Use this - do not
    hand-roll a shorter one.

    `/asset-verify/<id>` queries MOBILE_JOB_DETAILS with `fetchPolicy: 'cache-only'` and
    `Job.tsx` bails with `if (!job || !schemaQuery) return null`, so on a cold cache the page
    renders NOTHING and every locator on it is legitimately missing. Both loading labels are
    load-bearing:

        "Fetching data for lookups"    feeds schemaQuery - WITHOUT THIS the detail page is
                                       blank even though the job itself downloaded
        "Fetching mobile job details"  the batched MOBILE_JOB_DETAILS downloads

    This exists because the gate was trimmed twice and cost a run each time (MOB.545, then
    MOB.396), both failing at the "All" filter with `No element found` - which looks like a
    locator bug and is not. Copying the whole gate is the fix; centralising it is the reason
    this function exists.
    """
    detail = f"{AV_JOBS_URL}/{job_id}"
    detail = f"{AV_JOBS_URL}/{job_id}"
    return av_list_gate(fixture) + [
        # CLICK THE JOB, DO NOT DEEP-LINK. `goToUrl` is a full page load: it restarts the SPA
        # on a `cache-only` route and races the batched detail download, so the detail can
        # render with no asset rows. Clicking is client-side routing with the cache warm -
        # and is what a real user does.
        step("click", f'Open "{fixture}" by clicking its row (not a deep link)',
             {"element": xpath_el(
                 AV_JOBS_URL,
                 f'//*[contains(concat(" ", normalize-space(@class), " "),'
                 f' " mantine-Paper-root ")][contains(., "{fixture}")]')},
             timeout=30),
        step("wait", "Wait for the job detail to render", {"value": 5}),
        # The asset list is a SEPARATE readiness signal from the page, and every caller's next
        # move is to click a row. Polls (timeout=60) rather than sleeping.
        step("assertElementPresent", "ASSET LIST GUARD: the job's asset rows have rendered",
             {"element": xpath_el(
                 detail, '(//*[contains(@class,"mantine-Accordion-item")])[1]')},
             timeout=60),
    ]


WORK_URL = BASE + "/work"


def work_list_gate(wait=20, require_row=True):
    """Readiness for the WORK ORDER LIST. Added 2026-08-18 for the same reason
    `av_job_gate` exists: MOB.340 and MOB.134 had each grown their own warm-up and neither
    waited on `loadedAll`.

    `loadedAll` is load-bearing on this page in a way it is not elsewhere. The map toggle is
    written `onClick={() => loadedAll ? setMapView(!mapView) : undefined}` - so before the
    list finishes downloading, clicking it is a SILENT NO-OP. A test that clicked too early
    would report a successful click, observe nothing, and (if it asserted only page text)
    still pass. That is trap 5 wearing a different hat.

    There is no positive `loadedAll` flag in the DOM, so it is inferred from the three
    LoadingProgress labels being gone. Those are `assertPageLacks` checks and therefore
    vacuously true BEFORE loading starts as well as after it finishes - the `wait` above
    them is what gives them meaning. Do not convert them to polling gates (Appendix F).

    require_row=False DROPS the final row guard. Needed because the `Admin` crew's work list
    is EMPTY on dev - measured 2026-08-18 by MOB.978_DIAG_WorkList_Probe, which found zero
    Paper elements and a legend with no entries while the RingProgress, the Virtuoso
    scroller and the search box all rendered. `loadedAll` is still true in that state
    (`!![]` is true and `0 === 0`), so the page is fully loaded and interactive - there is
    simply nothing in it. Note this ALSO means MOB.340 has been asserting its search and
    sort controls against an empty list all along (trap 5).
    """
    return [
        go(WORK_URL, "/work — the work order list"),
        step("wait", "Let the work list begin rendering", {"value": 3}),
        step("assertElementContent", 'The "Work Orders" page mounted',
             {"check": "contains", "value": "Work Orders",
              "element": xpath_el(WORK_URL,
                                  '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                                  ' "Work Orders")]')}, timeout=30),
        step("wait", "Wait for the workstage pages and the lookup prefetch",
             {"value": wait}),
        # placeholder is an ATTRIBUTE, not page text (trap 9)
        step("assertElementPresent", "The work list rendered its search box",
             {"element": xpath_el(WORK_URL,
                                  '//input[@placeholder="Find Workstage(s)"]')}),
        step("assertPageLacks", "LOADEDALL 1/3: the initial fetch finished",
             {"value": "Retrieving assigned work"}),
        step("assertPageLacks", "LOADEDALL 2/3: paging through workstages finished",
             {"value": "workstages found"}),
        step("assertPageLacks", "LOADEDALL 3/3: the per-stage detail downloads finished",
             {"value": "workstages downloaded"}),
    ] + ([
        step("assertElementPresent", "WORK ROW GUARD: at least one work order rendered",
             {"element": xpath_el(WORK_URL, WORK_ROW + "[1]")}, timeout=60),
    ] if require_row else [])


def work_view_toggle(to, always=False):
    """Switch the work list between the SCHEDULED and plain LIST views, via the hamburger.

    `to` is "List" or "Scheduled" - the view you want to END UP IN.

    WHY A SHARED HELPER. `TopHeader/index.tsx:131` renders one menu item whose label FLIPS:
    `Toggle Work Order ${scheduledView ? 'List' : 'Scheduled'} View`. So the item you click is
    named after the view you are going TO, and the label is also the only proof of which view
    you are currently in. That is fiddly enough to get wrong twice, and this repo has already
    paid for hand-rolled copies once - three tests each grew their own `av_job_gate` and all
    three were subtly wrong. One copy, here.

    ⚠️ THE ITEM ONLY EXISTS FOR A `SCHEDULED` ROLE. It is hidden unless
    `mobileDownloadMode === 'SCHEDULED' && permissions.work.read`. The `Admin` fixture role was
    set to SCHEDULED on 2026-08-20; if that is ever reverted, every caller of this breaks at
    the click, and the fix is a fixture change, not a locator change.

    ⚠️ IT PERSISTS. The toggle writes `sessionStorage['toggle_mobile_v_work']`, and a Datadog
    suite shares ONE browser session - so a test that switches views MUST switch back, with
    `always=True` on the restore leg (trap 16c). Leaving the list view on would change what
    every later work-order subtest sees.
    """
    burger = '//button[@aria-label="Toggle navigation"]'
    item = (f'//*[contains(concat(" ", normalize-space(@class), " "), " mantine-Menu-item ")]'
            f'[contains(normalize-space(.), "Toggle Work Order {to} View")]')
    want = "false" if to == "List" else "true"
    return [
        step("click", f"Open the menu (to switch to the {to} view)",
             {"element": xpath_el(WORK_URL, burger)}, always=always, timeout=30),
        step("wait", "Let the menu open", {"value": 1}, always=always),
        step("click", f'Click "Toggle Work Order {to} View"',
             {"element": xpath_el(WORK_URL, item)}, always=always, timeout=30),
        step("wait", "Let the list re-render in the other view", {"value": 3}, always=always),
        # The app's own contract, not the icon (trap 16).
        jsassert(f"VIEW: sessionStorage['toggle_mobile_v_work'] is now '{want}'",
                 "return sessionStorage.getItem('toggle_mobile_v_work') === "
                 f"'{want}';", always=always, timeout=30),
    ]


def work_cache_warm(wait=30):
    """Visit /work purely to WARM the lookup cache, with no readiness claims.

    Added 2026-08-20 as the non-racy alternative to `work_list_gate` for callers that only
    need the cache warm before deep-linking a work order - MOB.134, MOB.347.

    WHY NOT work_list_gate: its three LOADEDALL checks are `assertPageLacks` on the
    LoadingProgress labels, and a *lacks* assertion CANNOT POLL - it is already true before
    loading starts, so its only meaning comes from the blind wait in front of it. That was
    fine while the crew's work list was empty. It is not fine now the list has stages: the
    per-stage downloads outran a 20s settle, then outran 45s, and the gate failed in MOB.134,
    MOB.346 and MOB.990 alike. Raising the number again is guessing, not gating.

    So this asserts only what it can assert POSITIVELY (the page mounted) and otherwise just
    waits. A test that needs real readiness should gate on ITS OWN positive signal - see
    MOB.346, which polls for the `Today` group header, the thing it is testing anyway.
    """
    return [
        go(WORK_URL, "/work — warm the work lookup cache"),
        step("wait", "Let the work list begin rendering", {"value": 3}),
        step("assertElementContent", 'The "Work Orders" page mounted',
             {"check": "contains", "value": "Work Orders",
              "element": xpath_el(WORK_URL,
                                  '//*[@id="page-title"]//h4[contains(normalize-space(.),'
                                  ' "Work Orders")]')}, timeout=30),
        # Blind on purpose: there is no positive DOM signal for "the lookup prefetch
        # finished", and the negative ones cannot poll. Do not convert this to an assertion.
        step("wait", "Let the lookup prefetch run", {"value": wait}),
    ]


def test(name, message, steps, tags, extra_globals=(), local_vars=()):
    """Envelope matching what fetch() writes: config keys snake_case (the SDK maps them
    to configVariables/setCookie), step keys camelCase. config.variables is the list the
    runner actually binds {{ NAME }} from - config_variables alone is not enough."""
    return {
        "test_name": name,
        "details": {
            "name": name, "type": "browser", "status": "paused", "message": message,
            "tags": list(tags), "locations": ["gcp:us-west2"],
            "config": {
                "assertions": [],
                "config_variables": gvar("MOBDEV", *extra_globals) + list(local_vars),
                "request": {"headers": {}, "method": "GET", "url": "{{ MOBDEV }}"},
                "variables": gvar("MOBDEV", *extra_globals) + list(local_vars),
                "set_cookie": "",
            },
            "options": {
                # SINGLE DEVICE, DELIBERATELY. Datadog runs each device_id as its own
                # CONCURRENT browser session, and every mutating test drives the same
                # fixture work order - so two devices race on shared server state. It
                # showed up as MOB.320 failing 'Test status is now "Complete"' while the
                # other session was walking the same work order to a different status.
                # Nothing in the test can fix that; the assertions are racing, not wrong.
                # Worse, it hid itself: for several runs one device always died at login,
                # so only one session actually ran and the suite looked clean.
                "device_ids": ["chrome.tablet"],
                "disable_cors": False, "disable_csp": False,
                "ignore_server_certificate_error": False,
                "min_failure_duration": 0, "min_location_failed": 1,
                "monitor_options": {}, "no_screenshot": False,
                "retry": {"count": 1, "interval": 300.0},
                "rum_settings": {"is_enabled": False},
                "tick_every": 86400,
            },
            "steps": steps,
        },
    }


def write(t, force=None):
    """Write a test's JSON, REFUSING to clobber an existing file unless forced.

    The JSON in dd_tests_mobile/ is the source of truth, not these build scripts:
      - several tests (MOB.100-170, MOB.300, MOB.900) have no generator at all any more
      - MOB.200's login steps and the suites' wired subtestPublicId values were applied
        as one-off patches and exist only in the JSON
    So re-running a build script out of habit silently reverts working, verified state -
    which is exactly what happened once already. Opt in explicitly to overwrite:

        DD_FORCE=1 ./.venv/bin/python Mobile/dd_scripts/<build script>.py
    """
    path = os.path.join(HERE, t["test_name"] + ".json")
    if force is None:
        force = os.environ.get("DD_FORCE") == "1"
    if os.path.exists(path) and not force:
        print(f"SKIP  {t['test_name']} - already exists (set DD_FORCE=1 to overwrite)")
        return None
    with open(path, "w") as f:
        f.write(json.dumps(t, indent=4))
    print(f"WROTE {t['test_name']}")
    return path


# ---------------------------------------------------------------- datadog
def remote_ids(api):
    return {t["name"]: t["public_id"] for t in api.list_tests().to_dict()["tests"]}


def push():
    """Create missing MOB.* tests, update existing ones.

    RETURNS NON-ZERO IF ANY TEST FAILED TO SYNC, and prints a loud summary. That matters
    more than it sounds: a push that errors while the caller keeps going leaves Datadog on
    the OLD version of the test, and the run that follows reports PASS for code that was
    never uploaded. That happened - a rejected `public_id` field silently kept MOB.600 three
    steps behind while the local JSON looked right. Always chain with && , never ; .
    """
    failed = []
    with ApiClient(_conf()) as c:
        api = SyntheticsApi(c)
        ids = remote_ids(api)
        for f in sorted(glob.glob(os.path.join(HERE, "*.json"))):
            d = json.load(open(f))["details"]
            try:
                body = SyntheticsBrowserTest(**{k: d[k] for k in BODY_KEYS})
                if d["name"] in ids:
                    api.update_browser_test(ids[d["name"]], body)
                    print(f"update {d['name']}")
                else:
                    r = api.create_synthetics_browser_test(body).to_dict()
                    print(f"CREATE {d['name']} -> {r['public_id']}")
            except Exception as e:
                failed.append(d["name"])
                print(f"FAILED {d['name']}: {str(e)[:200]}")
    if failed:
        print(f"\n*** {len(failed)} TEST(S) DID NOT SYNC - Datadog still has the old "
              f"version. DO NOT trust a run until this is fixed: {failed}")
    return 1 if failed else 0


def _eta(api, pid):
    """Median duration of recent runs, for the progress bar's denominator."""
    try:
        ds = [(r.get("result") or {}).get("duration")
              for r in api.get_browser_test_latest_results(pid).to_dict()["results"][:20]]
        ds = sorted(d / 1000 for d in ds if d)
        return ds[len(ds) // 2] if ds else 400.0
    except Exception:
        return 400.0


_last_logged = [0.0]


def _progress(elapsed, eta, waiting):
    """Live progress, in whichever form the output can actually show.

    TTY      one line redrawn in place with \\r.
    NOT TTY  a fresh line every 60s instead. \\r into a file is unreadable noise, but
             printing NOTHING is worse - a backgrounded run then produces a completely
             silent log for ~7 minutes, which is indistinguishable from a hung process.
             Newline-delimited output is what makes `tail -f` work.
    """
    frac = min(elapsed / eta, 1.0) if eta else 0.0
    filled = int(frac * 28)
    over = " over median" if elapsed > eta else ""
    bar = (f"[{'█' * filled}{'░' * (28 - filled)}] "
           f"{int(elapsed // 60):02d}:{int(elapsed % 60):02d}"
           f"/~{int(eta // 60):02d}:{int(eta % 60):02d}{over}  {waiting} running")
    if sys.stdout.isatty():
        sys.stdout.write(f"\r  {bar} ")
        sys.stdout.flush()
    elif elapsed - _last_logged[0] >= 60:
        _last_logged[0] = elapsed
        print(f"  {bar}", flush=True)


def run(*names, timeout=2400):
    """Trigger tests and poll until they finish, drawing a live progress bar.

    The bar is an ELAPSED/ETA estimate, not real progress. Datadog publishes a result only
    when a run finishes - there is no per-step feed to poll, confirmed by watching a run in
    flight return the previous result the whole time. So the bar answers "is this normal or
    is it stuck?", which is the actual question during a 6-minute wait.
    """
    # MOB.991 is ~150 steps across 9 subtests x 2 devices, plus queueing behind other
    # triggers. 1200s reported 'timed out' on runs that later passed - which reads like a
    # failure but is only the poller giving up.
    with ApiClient(_conf()) as c:
        api = SyntheticsApi(c)
        ids = remote_ids(api)
        missing = [n for n in names if n not in ids]
        if missing:
            print("not found:", missing)
            return 1
        body = SyntheticsTriggerBody(
            tests=[SyntheticsTriggerTest(public_id=ids[n]) for n in names])
        trig = api.trigger_tests(body=body).to_dict()
        pending = {r["public_id"]: r["result_id"] for r in trig.get("results", [])}
        name_of = {v: k for k, v in ids.items()}
        etas = {pid: _eta(api, pid) for pid in pending}
        eta = max(etas.values()) if etas else 400.0
        print(f"triggered {len(pending)} run(s); median recent run {eta/60:.1f} min\n")
        started = time.time()
        deadline, failed = started + timeout, 0
        while pending and time.time() < deadline:
            _progress(time.time() - started, eta, len(pending))
            time.sleep(15)
            for pid, rid in list(pending.items()):
                try:
                    res = api.get_browser_test_result(pid, rid).to_dict()
                except Exception:
                    continue
                r = res.get("result") or {}
                if res.get("status") is None and not r:
                    continue
                ok = res.get("status") == 0 or r.get("passed")
                if sys.stdout.isatty():
                    sys.stdout.write("\r" + " " * 78 + "\r")
                done, total = r.get("stepCountCompleted"), r.get("stepCountTotal")
                got = f"  {done}/{total} steps" if total else ""
                print(f"{'PASS' if ok else 'FAIL'}  {name_of.get(pid, pid)}"
                      f"{got}  {r.get('duration', 0)/1000:.0f}s")
                if not ok:
                    failed += 1
                    if r.get("error"):
                        print(f"    {str(r['error'])[:300]}")
                del pending[pid]
        if pending:
            print("timed out:", [name_of.get(p, p) for p in pending])
            failed += len(pending)
        return 1 if failed else 0


def pull(*names):
    """Fetch tests FROM Datadog into dd_tests_mobile/, overwriting the local JSON.

    The counterpart to push, for the one case the generators cannot cover: steps that can
    only be authored in the Datadog UI. `uploadFiles` is the example - its `bucketKey`
    points at a file in Datadog's own storage and no API endpoint mints one - and a
    `Run JavaScript` step added alongside it is in the same boat.

    Pull makes the JSON authoritative again after a UI edit, so the next push does not
    revert it. It does NOT make the generator safe to re-run: rebuilding from
    build_collector_tests.py still produces a test with no upload step. Once a test carries
    hand-authored steps, the JSON is the source of truth permanently.
    """
    with ApiClient(_conf()) as c:
        api = SyntheticsApi(c)
        ids = remote_ids(api)
        for name in names:
            if name not in ids:
                print("not found:", name)
                continue
            d = api.get_browser_test(ids[name]).to_dict()
            # Take only the keys push sends back. The rest of the payload carries
            # datetimes (created_at/modified_at) that json.dumps cannot serialise - the
            # exact bug that once truncated fetch.py's output files to zero bytes.
            details = {k: d[k] for k in BODY_KEYS if k in d}
            # Datadog returns a per-step `public_id` on GET but REJECTS it on update:
            #   "Additional properties are not allowed ('public_id' was unexpected)"
            # Leaving it in makes the very next push fail - and if that failure is not
            # noticed, the test on Datadog silently stays at the old version while the
            # local JSON looks correct. Strip it here so a pull round-trips cleanly.
            for st in details.get("steps", []):
                st.pop("public_id", None)
            path = os.path.join(HERE, name + ".json")
            with open(path, "w") as f:
                f.write(json.dumps({"test_name": name, "details": details}, indent=4))
            kinds = {}
            for s in details.get("steps", []):
                kinds[s.get("type")] = kinds.get(s.get("type"), 0) + 1
            print(f"PULLED {name}  ({len(details.get('steps', []))} steps)")
            for t, n in sorted(kinds.items()):
                print(f"         {n} x {t}")
    return 0


def report(name, index=0):
    """Print per-step and per-subtest outcomes for a recent run.

    ALWAYS CHECK THE AGE BANNER FIRST. Reading a stale result as if it were the current
    one has caused THREE separate misdiagnoses - each time producing a "fix" for a
    locator that had already been replaced. Two things make it easy to do:
      - every test runs on TWO devices, so one trigger yields two results that can fail
        at completely different steps, and index 0 is only one of them
      - a run takes ~20min, so the previous run's result sits there looking authoritative
        the entire time the new one is in flight
    Hence the header prints the check time, the age, and the sibling results.

    NOTE ON KEYS - this cost a misdiagnosis once. The payload mixes conventions:
        result.step_details          snake_case
        <subtest row>.subTestStepDetails   camelCase
    Reading the snake_case name on a subtest row silently yields None, which looks like
    "no failing steps" and makes a failed subtest read as passing. Always trust the
    row's own `passed` flag, not the absence of errors.
    """
    with ApiClient(_conf()) as c:
        api = SyntheticsApi(c)
        ids = remote_ids(api)
        if name not in ids:
            print("not found:", name)
            return 1
        pid = ids[name]
        results = api.get_browser_test_latest_results(pid).to_dict()["results"]
        if index >= len(results):
            print("no such result index")
            return 1
        full = api.get_browser_test_result(pid, results[index]["result_id"]).to_dict()
        res = full.get("result") or {}
        siblings = [(i, r) for i, r in enumerate(results[:6])]

    # check_time is epoch MILLISECONDS, not seconds - dividing wrong puts every run in 1970
    ct = full.get("check_time") or results[index].get("check_time")
    when, age = "unknown", ""
    if ct:
        secs = time.time() - ct / 1000.0
        when = time.strftime("%H:%M:%S", time.localtime(ct / 1000.0))
        age = f"  ({int(secs // 60)}m {int(secs % 60)}s ago)"
        if secs > 900:
            age += "   <-- STALE? a suite takes ~20min; a newer run may be in flight"

    print(f"{name}  device={full.get('device_id')}  passed={res.get('passed')}")
    print(f"run at {when}{age}")
    if len(siblings) > 1:
        print("other results (pass index N to read one):")
        for i, r in siblings:
            if i == index:
                continue
            rct = r.get("check_time")
            rw = time.strftime("%H:%M:%S", time.localtime(rct / 1000.0)) if rct else "?"
            print(f"  [{i}] {r.get('device_id','?'):20} {rw}  passed={r.get('result',{}).get('passed')}")
    print()
    for s in res.get("step_details") or []:
        subs = s.get("subTestStepDetails")
        if subs is None:
            mark = "ERR" if s.get("error") else "ok "
            print(f"  [{mark}] {s.get('description')}")
            if s.get("error"):
                print(f"        {str(s['error'])[:160]}")
            continue
        # a subtest row: trust `passed`, then dig into its own steps
        ok = s.get("passed")
        print(f"  [{'ok ' if ok else 'FAIL'}] {s.get('description')}  ({len(subs)} steps)")
        for sub in subs:
            if sub.get("error") or sub.get("passed") is False:
                print(f"        ERR {sub.get('description')}")
                if sub.get("error"):
                    print(f"            {str(sub['error'])[:160]}")
    return 0


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "push"
    if cmd == "push":
        sys.exit(push())
    elif cmd == "run":
        sys.exit(run(*sys.argv[2:]))
    elif cmd == "pull":
        sys.exit(pull(*sys.argv[2:]))
    elif cmd == "report":
        sys.exit(report(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 0))
    else:
        print(__doc__)
