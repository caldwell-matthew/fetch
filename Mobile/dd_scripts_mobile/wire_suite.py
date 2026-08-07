"""Fill in every suite's subtestPublicId values.

A suite chains its children with playSubTest steps, but a subtestPublicId only exists once
the child test has been created on Datadog. So the order is:

    1. push the children                     (creates them, assigns IDs)
    2. python3 Mobile/wire_suite.py          (this script - patches the suites)
    3. push again                            (uploads the wired suites)

Read-only against Datadog: it only calls list_tests() to look up the child IDs.
Run from the repo root with the venv python:

    ./.venv/bin/python Mobile/wire_suite.py
"""
import json, os, sys, glob, certifi
from dotenv import dotenv_values
from datadog_api_client import ApiClient, Configuration
from datadog_api_client.v1.api.synthetics_api import SyntheticsApi

SCRIPTS = os.path.dirname(os.path.abspath(__file__))   # Mobile/dd_scripts
MOBILE = os.path.dirname(SCRIPTS)                      # Mobile
REPO = os.path.dirname(MOBILE)                         # repo root (fetch/)
HERE = os.path.join(MOBILE, "dd_tests_mobile")
SUITES = sorted(glob.glob(os.path.join(HERE, "MOB.9*Suite.json")))

conf = Configuration(ssl_ca_cert=certifi.where())
env = dotenv_values(os.path.join(REPO, ".env"))
conf.api_key["apiKeyAuth"] = env.get("DD_API")
conf.api_key["appKeyAuth"] = env.get("DD_APP")

with ApiClient(conf) as c:
    remote = SyntheticsApi(c).list_tests().to_dict()["tests"]
ids = {t["name"]: t["public_id"] for t in remote}

total_wired, missing = 0, []
for path in SUITES:
    suite = json.load(open(path))
    steps = suite["details"]["steps"]
    wired = 0
    for s in steps:
        if s.get("type") != "playSubTest":
            continue
        child = s["name"]
        if child in ids:
            s["params"]["subtestPublicId"] = ids[child]
            wired += 1
        else:
            missing.append(f"{os.path.basename(path)} -> {child}")
    if wired:
        with open(path, "w") as f:
            f.write(json.dumps(suite, indent=4))
    total_wired += wired
    print(f"{os.path.basename(path):<32} wired {wired} subtest id(s)")

if missing:
    print("\nNot yet on Datadog - push these children first:")
    for m in missing:
        print("   ", m)
    sys.exit(1)

print(f"\nWired {total_wired} subtest id(s) across {len(SUITES)} suite(s).")
print("Now push again:  ./.venv/bin/python Mobile/dd_tools.py push")
