"""A throwaway Datadog test that measures how `options.scheduling` behaves — before the suites depend on it.

WHY (testing_checklist ▶ #37, the weekly schedule)
  The weekly plan gives every suite a one-hour slot at the weekend: `tick_every = 3600` (hourly) and an
  `options.scheduling` window of one hour on one day, so each suite should run exactly once a week at a known
  time. Datadog documents the fields — `timeframes: [{day, from, to}]`, `timezone` — but not
  (1) how the window combines with `tick_every`: one run per window, or one at each edge?
  (2) at what minute inside the window it fires, and
  (3) which weekday `day: 1` is.

HOW ONE TEST ANSWERS ALL THREE
  🛑 A test's windows must all share ONE time of day — Datadog refuses anything else with
  `All start times should be equal` (measured 2026-09-17; the first version gave each day its own hour).
  That is no constraint on the plan, where each suite has a single window, but it shapes this probe:

  One window, 21:00–22:00 Pacific, on day numbers 5, 6 and 7. Created on a Thursday evening:
      Monday = 1  →  5, 6, 7 are Fri, Sat, Sun  →  silent Thursday, fires Fri, Sat and Sun
      Sunday = 1  →  5, 6, 7 are Thu, Fri, Sat  →  fires THURSDAY night, silent on Sunday
  (Sunday = 0 would reject day 7 outright.) The count per night answers (1), the minutes answer (2).

  It visits the dev login page and asserts the URL — no login, no session, nothing written, no fixture
  touched. `retry.count = 0`, so a failure is not billed twice. Cost: 1 run per window it fires in, so ~3–6
  over three days.

USAGE
    ./.venv/bin/python legacy/Mobile/dd_scripts_mobile/schedule_probe.py create   # make it, live
    ./.venv/bin/python legacy/Mobile/dd_scripts_mobile/schedule_probe.py report   # its runs, in Pacific time
    ./.venv/bin/python legacy/Mobile/dd_scripts_mobile/schedule_probe.py pause    # stop it (billing stops)
"""
import datetime
import os
import sys
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dd_tools import _conf, remote_ids  # noqa: E402
from datadog_api_client import ApiClient  # noqa: E402
from datadog_api_client.v1.api.synthetics_api import SyntheticsApi  # noqa: E402
from datadog_api_client.v1.models import (  # noqa: E402
    SyntheticsBrowserTest, SyntheticsUpdateTestPauseStatusPayload, SyntheticsTestPauseStatus)

NAME = "MOB.TRIAL_Schedule_Window_Probe"
TZ = "America/Los_Angeles"
PT = ZoneInfo(TZ)
URL = "https://dev.mentorapm.com/login"


def body():
    return SyntheticsBrowserTest(**{
        "name": NAME,
        "type": "browser",
        "status": "live",
        "message": ("Throwaway probe for the weekly schedule (testing_checklist #37): one window, 21:00-22:00 Pacific, "
                    "on day numbers 5, 6, 7. Visits the login page only. Pause or delete after the trial."),
        "tags": ["Mobile", "env:dev", "trial"],
        "locations": ["gcp:us-west2"],
        "config": {"assertions": [], "request": {"method": "GET", "url": URL, "headers": {}}},
        "options": {
            "device_ids": ["chrome.laptop_large"],
            "tick_every": 3600,
            "retry": {"count": 0, "interval": 300},
            "min_location_failed": 1,
            "scheduling": {
                "timezone": TZ,
                "timeframes": [{"day": d, "_from": "21:00", "to": "22:00"} for d in (5, 6, 7)],
            },
        },
        "steps": [{
            "type": "assertCurrentUrl", "name": "The login page loaded", "allowFailure": False, "isCritical": True,
            "noScreenshot": True, "params": {"check": "contains", "value": "dev.mentorapm.com"},
        }],
    })


def main(cmd):
    with ApiClient(_conf()) as c:
        api = SyntheticsApi(c)
        pid = remote_ids(api).get(NAME)
        if cmd == "create":
            if pid:
                print(f"exists: {NAME} -> {pid}")
                return 0
            t = api.create_synthetics_browser_test(body()).to_dict()
            print(f"CREATE {NAME} -> {t['public_id']}  status={t.get('status')}")
            print("scheduling:", t["options"].get("scheduling"))
            return 0
        if not pid:
            print(f"{NAME} not found")
            return 1
        if cmd == "pause":
            api.update_test_pause_status(pid, SyntheticsUpdateTestPauseStatusPayload(
                new_status=SyntheticsTestPauseStatus.PAUSED))
            print(f"paused {NAME}")
            return 0
        if cmd == "report":
            t = api.get_browser_test(pid).to_dict()
            print(f"{NAME} ({pid}) status={t.get('status')} tick_every={t['options'].get('tick_every')}")
            print("windows:", [(w['day'], w['from'], w['to']) for w in t['options']['scheduling']['timeframes']])
            runs = api.get_browser_test_latest_results(pid).to_dict()["results"]
            print(f"{len(runs)} run(s):")
            for r in sorted(runs, key=lambda r: r["check_time"]):
                at = datetime.datetime.fromtimestamp(r["check_time"] / 1000, tz=PT)
                ok = r.get("result", {}).get("passed")
                print(f"  {at:%a %Y-%m-%d %H:%M:%S %Z}  passed={ok}")
            days = {datetime.datetime.fromtimestamp(r["check_time"] / 1000, tz=PT).strftime("%a") for r in runs}
            if "Thu" in days:
                print("⇒ fired on a Thursday: Sunday = 1 (5, 6, 7 = Thu, Fri, Sat)")
            elif "Sun" in days:
                print("⇒ fired on a Sunday: Monday = 1 (5, 6, 7 = Fri, Sat, Sun)")
            return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else ""))
