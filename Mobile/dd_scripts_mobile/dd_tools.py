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


def _conf():
    c = Configuration(ssl_ca_cert=certifi.where())
    env = dotenv_values(os.path.join(REPO, ".env"))
    c.api_key["apiKeyAuth"] = env.get("DD_API")
    c.api_key["appKeyAuth"] = env.get("DD_APP")
    return c


# ---------------------------------------------------------------- builders
def gvar(*names):
    return [{"id": GLOBALS[n], "name": n, "type": "global"} for n in names]


def step(type_, name, params, optional=False, always=False, timeout=None):
    """optional=True lets a step fail without failing the test - for branches that only
    appear under some configuration (e.g. the status-notes modal, shown only when the
    work template sets requireStatusNotes).

    always=True sets Datadog's `alwaysExecute`, which runs the step even after an EARLIER
    step failed. These are different things and the distinction matters:

        optional  this step may fail        -> the TEST still passes
        always    an earlier step DID fail  -> this step runs anyway; the test still fails

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
    d = {"allowFailure": optional, "alwaysExecute": always, "exitIfSucceed": False,
         "isCritical": not optional, "name": name, "noScreenshot": False,
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


def jsassert(name, code, optional=False, always=False, timeout=None):
    """A `Run JavaScript` assertion step. Passes when the code returns truthy.

    IMPORTANT: unlike `uploadFiles`, this step type IS generatable from here - its params are
    just {"code": ...} with no bucketKey, so no Datadog-UI authoring is needed (trap 12
    applies to uploads only).

    Use it to assert things the DOM cannot express: sessionStorage/localStorage contents, an
    <input>'s VALUE (which is a property, not page text - trap 9), computed styles, or any
    JS-only property such as an input's `capture` flag.
    """
    return step("assertFromJavascript", name, {"code": code}, optional=optional,
                always=always, timeout=timeout)


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
        step("wait", "Wait for the page to mount", {"value": 10}),
        step("assertElementContent", 'Test the "Mobile Jobs" page mounted',
             {"check": "contains", "value": "Mobile Jobs",
              "element": xpath_el(AV_JOBS_URL,
                                  '//*[@id="page-title"]//h4[contains(normalize-space(.), '
                                  '"Mobile Jobs")]')}),
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
