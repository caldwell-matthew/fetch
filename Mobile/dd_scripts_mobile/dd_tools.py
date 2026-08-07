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


def step(type_, name, params, optional=False):
    """optional=True lets a step fail without failing the test - for branches that only
    appear under some configuration (e.g. the status-notes modal, shown only when the
    work template sets requireStatusNotes)."""
    return {"allowFailure": optional, "alwaysExecute": False, "exitIfSucceed": False,
            "isCritical": not optional, "name": name, "noScreenshot": False,
            "params": params, "type": type_}


def xpath_el(url, xp):
    return {"url": url,
            "userLocator": {"failTestOnCannotLocate": True,
                            "values": [{"type": "xpath", "value": xp}]}}


def go(url, label):
    return step("goToUrl", f"Navigate to {label}", {"value": url})


def test(name, message, steps, tags, extra_globals=()):
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
                "config_variables": gvar("MOBDEV", *extra_globals),
                "request": {"headers": {}, "method": "GET", "url": "{{ MOBDEV }}"},
                "variables": gvar("MOBDEV", *extra_globals),
                "set_cookie": "",
            },
            "options": {
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
    """Create missing MOB.* tests, update existing ones. Errors are surfaced, not
    swallowed (unlike fetch.py's throw(), whose bare except hides failed creates)."""
    with ApiClient(_conf()) as c:
        api = SyntheticsApi(c)
        ids = remote_ids(api)
        for f in sorted(glob.glob(os.path.join(HERE, "*.json"))):
            d = json.load(open(f))["details"]
            body = SyntheticsBrowserTest(**{k: d[k] for k in BODY_KEYS})
            if d["name"] in ids:
                api.update_browser_test(ids[d["name"]], body)
                print(f"update {d['name']}")
            else:
                r = api.create_synthetics_browser_test(body).to_dict()
                print(f"CREATE {d['name']} -> {r['public_id']}")


def run(*names, timeout=1200):
    # MOB.991 alone is ~90 steps including deliberate waits, so 600s was too tight.
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
        print(f"triggered {len(pending)} run(s); waiting...\n")
        deadline, failed = time.time() + timeout, 0
        while pending and time.time() < deadline:
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
                print(f"{'PASS' if ok else 'FAIL'}  {name_of.get(pid, pid)}")
                if not ok:
                    failed += 1
                    if r.get("error"):
                        print(f"    {str(r['error'])[:300]}")
                del pending[pid]
        if pending:
            print("timed out:", [name_of.get(p, p) for p in pending])
            failed += len(pending)
        return 1 if failed else 0


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "push"
    if cmd == "push":
        push()
    elif cmd == "run":
        sys.exit(run(*sys.argv[2:]))
    else:
        print(__doc__)
